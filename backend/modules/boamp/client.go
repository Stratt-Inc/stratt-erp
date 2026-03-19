package boamp

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const boampBaseURL = "https://www.boamp.fr/api/search/"

// SearchParams holds the filters for a BOAMP search.
type SearchParams struct {
	MotsCles    string
	CodeCPV     string
	Departement string
	MontantMin  float64
	MontantMax  float64
	Page        int
	PageSize    int
}

// boampSearchResult is the raw BOAMP API response shape.
type boampSearchResult struct {
	Count   int `json:"count"`
	Results []struct {
		Reference string `json:"reference_boamp"`
		Titre     string `json:"famille_libelle"`
		Data      struct {
			AAPC struct {
				Objet    string `json:"objet"`
				Acheteur struct {
					NomOfficiel string `json:"nom_officiel"`
				} `json:"pouvoir_adjudicateur"`
				Procedure    string `json:"procedure"`
				DateLimite   string `json:"date_limite_reception"`
				Montant      string `json:"valeur_totale"`
				CPV          string `json:"code_objet_principal"`
			} `json:"AAPC"`
		} `json:"donnees"`
		DateParution     string `json:"dateparution"`
		DepartementCode  string `json:"department_code"`
		TypeAvis         string `json:"type_avis"`
		URLAvis          string `json:"url_avis"`
	} `json:"results"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

// Search queries the BOAMP API and returns normalized BOAMPAvis.
func Search(params SearchParams) ([]BOAMPAvis, int, error) {
	if params.PageSize == 0 {
		params.PageSize = 20
	}
	if params.Page < 1 {
		params.Page = 1
	}

	q := url.Values{}
	q.Set("rows", fmt.Sprintf("%d", params.PageSize))
	q.Set("start", fmt.Sprintf("%d", (params.Page-1)*params.PageSize))
	q.Set("sort", "dateparution desc")

	var filters []string
	if params.MotsCles != "" {
		filters = append(filters, fmt.Sprintf("texte:(%s)", params.MotsCles))
	}
	if params.CodeCPV != "" {
		filters = append(filters, fmt.Sprintf("code_cpv:(%s)", params.CodeCPV))
	}
	if params.Departement != "" {
		filters = append(filters, fmt.Sprintf("department_code:%s", params.Departement))
	}
	if len(filters) > 0 {
		q.Set("q", strings.Join(filters, " AND "))
	}

	reqURL := boampBaseURL + "?" + q.Encode()
	resp, err := httpClient.Get(reqURL)
	if err != nil {
		return nil, 0, fmt.Errorf("BOAMP API unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, 0, fmt.Errorf("BOAMP API error %d: %s", resp.StatusCode, string(body))
	}

	var raw boampSearchResult
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, 0, fmt.Errorf("BOAMP decode error: %w", err)
	}

	avis := make([]BOAMPAvis, 0, len(raw.Results))
	for _, r := range raw.Results {
		montant := 0.0
		objet := r.Data.AAPC.Objet
		if objet == "" {
			objet = r.Titre
		}
		avis = append(avis, BOAMPAvis{
			Reference:       r.Reference,
			Titre:           r.Titre,
			Objet:           objet,
			Acheteur:        r.Data.AAPC.Acheteur.NomOfficiel,
			Departement:     r.DepartementCode,
			CodeCPV:         r.Data.AAPC.CPV,
			Procedure:       r.Data.AAPC.Procedure,
			DatePublication: r.DateParution,
			DateLimite:      r.Data.AAPC.DateLimite,
			Montant:         montant,
			TypeAvis:        r.TypeAvis,
			URL:             r.URLAvis,
		})
	}

	return avis, raw.Count, nil
}
