package sirene

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const inseeBaseURL = "https://api.insee.fr/entreprises/sirene/V3.11"

var httpClient = &http.Client{Timeout: 10 * time.Second}

// formeJuridiqueLabel maps codes to short French labels.
var formeJuridiqueLabel = map[string]string{
	"1000": "Entrepreneur individuel",
	"5499": "SARL",
	"5710": "SAS",
	"5720": "SASU",
	"5308": "EURL",
	"6540": "SA",
	"7389": "Association loi 1901",
	"7120": "Collectivité territoriale",
	"7130": "Établissement public",
}

// trancheEffectifsLabel maps INSEE codes to readable labels.
var trancheEffectifsLabel = map[string]string{
	"NN": "Non employeur",
	"00": "0 salarié",
	"01": "1 ou 2 salariés",
	"02": "3 à 5 salariés",
	"03": "6 à 9 salariés",
	"11": "10 à 19 salariés",
	"12": "20 à 49 salariés",
	"21": "50 à 99 salariés",
	"22": "100 à 199 salariés",
	"31": "200 à 249 salariés",
	"32": "250 à 499 salariés",
	"41": "500 à 999 salariés",
	"42": "1 000 à 1 999 salariés",
	"51": "2 000 à 4 999 salariés",
	"52": "5 000 à 9 999 salariés",
	"53": "10 000 salariés et plus",
}

// raw INSEE SIRET response structures
type inseeResponse struct {
	Etablissement struct {
		SIRET                        string `json:"siret"`
		UniteLegale                  struct {
			SIREN                             string `json:"siren"`
			DenominationUniteLegale           string `json:"denominationUniteLegale"`
			NomUniteLegale                    string `json:"nomUniteLegale"`
			PrenomUsuelUniteLegale            string `json:"prenomUsuelUniteLegale"`
			CategorieJuridiqueUniteLegale     string `json:"categorieJuridiqueUniteLegale"`
			ActivitePrincipaleUniteLegale     string `json:"activitePrincipaleUniteLegale"`
			TrancheEffectifsUniteLegale       string `json:"trancheEffectifsUniteLegale"`
			EtatAdministratifUniteLegale      string `json:"etatAdministratifUniteLegale"`
			DateCreationUniteLegale           string `json:"dateCreationUniteLegale"`
			DateFin                           string `json:"dateFin"`
		} `json:"uniteLegale"`
		AdresseEtablissement struct {
			NumeroVoieEtablissement   string `json:"numeroVoieEtablissement"`
			TypeVoieEtablissement     string `json:"typeVoieEtablissement"`
			LibelleVoieEtablissement  string `json:"libelleVoieEtablissement"`
			CodePostalEtablissement   string `json:"codePostalEtablissement"`
			LibelleCommuneEtablissement string `json:"libelleCommuneEtablissement"`
		} `json:"adresseEtablissement"`
	} `json:"etablissement"`
}

// Lookup fetches SIRENE data for a given SIRET using the INSEE API.
// The token parameter is an OAuth2 bearer token (from INSEE developer account).
func Lookup(siret, token string) (*SIRENEData, error) {
	siret = strings.ReplaceAll(siret, " ", "")
	if len(siret) != 14 {
		return nil, fmt.Errorf("SIRET invalide : doit contenir 14 chiffres")
	}

	url := fmt.Sprintf("%s/siret/%s", inseeBaseURL, siret)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("INSEE API unreachable: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("SIRET %s introuvable dans la base SIRENE", siret)
	}
	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		return nil, fmt.Errorf("token INSEE invalide ou expiré (HTTP %d)", resp.StatusCode)
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("INSEE API error %d: %s", resp.StatusCode, string(body))
	}

	var raw inseeResponse
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("INSEE decode error: %w", err)
	}

	etab := raw.Etablissement
	ul := etab.UniteLegale
	addr := etab.AdresseEtablissement

	nom := ul.DenominationUniteLegale
	if nom == "" {
		nom = strings.TrimSpace(ul.PrenomUsuelUniteLegale + " " + ul.NomUniteLegale)
	}

	adresse := strings.TrimSpace(fmt.Sprintf("%s %s %s",
		addr.NumeroVoieEtablissement,
		addr.TypeVoieEtablissement,
		addr.LibelleVoieEtablissement,
	))

	formeLabel := formeJuridiqueLabel[ul.CategorieJuridiqueUniteLegale]
	if formeLabel == "" {
		formeLabel = ul.CategorieJuridiqueUniteLegale
	}

	trancheLabel := trancheEffectifsLabel[ul.TrancheEffectifsUniteLegale]
	if trancheLabel == "" {
		trancheLabel = ul.TrancheEffectifsUniteLegale
	}

	return &SIRENEData{
		SIRET:               siret,
		SIREN:               ul.SIREN,
		DenominationSociale: nom,
		Adresse:             adresse,
		CodePostal:          addr.CodePostalEtablissement,
		Commune:             addr.LibelleCommuneEtablissement,
		CodeNAF:             ul.ActivitePrincipaleUniteLegale,
		FormeJuridique:      formeLabel,
		TrancheEffectifs:    trancheLabel,
		EtatAdministratif:   ul.EtatAdministratifUniteLegale,
		DateCreation:        ul.DateCreationUniteLegale,
		DateCessation:       ul.DateFin,
	}, nil
}
