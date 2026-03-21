package quiz

// Question represents a CCP compliance quiz question.
type Question struct {
	ID          string   `json:"id"`
	Theme       string   `json:"theme"`        // "seuils" | "procedures" | "delais" | "documents" | "rgpd"
	Difficulty  string   `json:"difficulty"`   // "debutant" | "confirme" | "expert"
	Text        string   `json:"text"`
	Choices     []Choice `json:"choices"`
	Explanation string   `json:"explanation"`
	Reference   string   `json:"reference"` // legal reference
}

type Choice struct {
	ID      string `json:"id"`
	Text    string `json:"text"`
	Correct bool   `json:"correct,omitempty"` // omitted in API responses until answered
}

// Bank is the full question bank.
var Bank = []Question{
	// ── Seuils ──────────────────────────────────────────────────────────────
	{
		ID: "S01", Theme: "seuils", Difficulty: "debutant",
		Text: "À partir de quel seuil une collectivité doit-elle recourir à un appel d'offres pour un marché de fournitures ou services ?",
		Choices: []Choice{
			{ID: "a", Text: "40 000 € HT"},
			{ID: "b", Text: "90 000 € HT"},
			{ID: "c", Text: "215 000 € HT", Correct: true},
			{ID: "d", Text: "431 000 € HT"},
		},
		Explanation: "Le seuil AO fournitures/services pour les collectivités territoriales est fixé à 215 000 € HT (depuis le 1er jan. 2024).",
		Reference:   "Art. R2124-1 CCP",
	},
	{
		ID: "S02", Theme: "seuils", Difficulty: "debutant",
		Text: "Quel est le seuil d'appel d'offres pour les travaux ?",
		Choices: []Choice{
			{ID: "a", Text: "215 000 € HT"},
			{ID: "b", Text: "431 000 € HT"},
			{ID: "c", Text: "5 382 000 € HT", Correct: true},
			{ID: "d", Text: "10 000 000 € HT"},
		},
		Explanation: "Le seuil AO travaux est 5 382 000 € HT (révisé tous les 2 ans par la Commission européenne).",
		Reference:   "Art. R2124-1 CCP",
	},
	{
		ID: "S03", Theme: "seuils", Difficulty: "debutant",
		Text: "En dessous de quel montant une collectivité peut-elle passer un marché sans publicité ni mise en concurrence préalables ?",
		Choices: []Choice{
			{ID: "a", Text: "10 000 € HT"},
			{ID: "b", Text: "25 000 € HT"},
			{ID: "c", Text: "40 000 € HT", Correct: true},
			{ID: "d", Text: "90 000 € HT"},
		},
		Explanation: "Sous 40 000 € HT, aucune publicité ni mise en concurrence n'est imposée, mais les principes fondamentaux (égalité, transparence) restent applicables.",
		Reference:   "Art. R2122-8 CCP",
	},
	{
		ID: "S04", Theme: "seuils", Difficulty: "confirme",
		Text: "Quel est le seuil de publication au JOUE (Journal Officiel de l'UE) pour les marchés de fournitures/services d'un État ?",
		Choices: []Choice{
			{ID: "a", Text: "215 000 € HT"},
			{ID: "b", Text: "140 000 € HT", Correct: true},
			{ID: "c", Text: "431 000 € HT"},
			{ID: "d", Text: "750 000 € HT"},
		},
		Explanation: "Pour l'État (ministères, EPA nationaux), le seuil JOUE est 140 000 € HT. Pour les collectivités locales : 215 000 € HT.",
		Reference:   "Art. R2124-1 CCP",
	},
	{
		ID: "S05", Theme: "seuils", Difficulty: "confirme",
		Text: "Le fractionnement artificiel d'un marché pour rester sous un seuil est :",
		Choices: []Choice{
			{ID: "a", Text: "Autorisé si les achats sont réalisés sur des exercices budgétaires différents"},
			{ID: "b", Text: "Interdit et constitue un délit pénal", Correct: true},
			{ID: "c", Text: "Toléré sous 100 000 € HT"},
			{ID: "d", Text: "Possible avec accord du contrôleur de légalité"},
		},
		Explanation: "Le fractionnement artificiel est interdit (art. L2113-3 CCP) et peut constituer un favoritisme (art. 432-14 CP), passible de 2 ans d'emprisonnement.",
		Reference:   "Art. L2113-3 CCP, art. 432-14 CP",
	},
	// ── Procédures ───────────────────────────────────────────────────────────
	{
		ID: "P01", Theme: "procedures", Difficulty: "debutant",
		Text: "Quelle procédure permet de négocier avec les soumissionnaires après remise des offres initiales ?",
		Choices: []Choice{
			{ID: "a", Text: "Appel d'offres ouvert"},
			{ID: "b", Text: "Appel d'offres restreint"},
			{ID: "c", Text: "Procédure avec négociation", Correct: true},
			{ID: "d", Text: "Marché de gré à gré"},
		},
		Explanation: "La procédure avec négociation (ex-MAPA > seuils) permet une négociation encadrée après les offres initiales, sous conditions strictes.",
		Reference:   "Art. L2124-3 CCP",
	},
	{
		ID: "P02", Theme: "procedures", Difficulty: "debutant",
		Text: "Le MAPA (Marché A Procédure Adaptée) s'applique :",
		Choices: []Choice{
			{ID: "a", Text: "Uniquement aux marchés < 40 000 € HT"},
			{ID: "b", Text: "Aux marchés sous les seuils européens", Correct: true},
			{ID: "c", Text: "Uniquement aux travaux"},
			{ID: "d", Text: "Aux marchés négociés d'urgence"},
		},
		Explanation: "Le MAPA s'applique aux marchés dont la valeur estimée est inférieure aux seuils de procédures formalisées (215 000 € pour fournitures/services, 5 382 000 € pour travaux).",
		Reference:   "Art. R2123-1 CCP",
	},
	{
		ID: "P03", Theme: "procedures", Difficulty: "confirme",
		Text: "Dans un appel d'offres ouvert, la négociation avec les candidats est :",
		Choices: []Choice{
			{ID: "a", Text: "Possible uniquement sur le prix"},
			{ID: "b", Text: "Interdite", Correct: true},
			{ID: "c", Text: "Possible si toutes les offres sont non conformes"},
			{ID: "d", Text: "Autorisée après élimination des offres hors budget"},
		},
		Explanation: "L'appel d'offres est une procédure sans négociation. Toute négociation entache la procédure de nullité.",
		Reference:   "Art. L2124-2 CCP",
	},
	{
		ID: "P04", Theme: "procedures", Difficulty: "confirme",
		Text: "L'accord-cadre à bons de commande permet :",
		Choices: []Choice{
			{ID: "a", Text: "De négocier les prix à chaque commande"},
			{ID: "b", Text: "De passer des commandes sans nouvelle mise en concurrence", Correct: true},
			{ID: "c", Text: "De dépasser les seuils sans publication"},
			{ID: "d", Text: "De contractualiser sans durée maximale"},
		},
		Explanation: "L'accord-cadre à bons de commande fixe les prix et conditions. Les commandes sont passées sans remise en concurrence, dans la limite du maximum fixé.",
		Reference:   "Art. R2162-13 CCP",
	},
	{
		ID: "P05", Theme: "procedures", Difficulty: "expert",
		Text: "Le dialogue compétitif est ouvert lorsque :",
		Choices: []Choice{
			{ID: "a", Text: "Le pouvoir adjudicateur ne peut définir précisément ses besoins", Correct: true},
			{ID: "b", Text: "Le montant dépasse 10 M€"},
			{ID: "c", Text: "Au moins 5 candidats ont été présélectionnés"},
			{ID: "d", Text: "Le marché porte sur des travaux innovants"},
		},
		Explanation: "Le dialogue compétitif est réservé aux besoins complexes que l'acheteur ne peut définir seul (projets PPP, SI complexes, ouvrages innovants).",
		Reference:   "Art. L2124-4 CCP",
	},
	// ── Délais ───────────────────────────────────────────────────────────────
	{
		ID: "D01", Theme: "delais", Difficulty: "debutant",
		Text: "Quel est le délai minimum de réception des offres pour un appel d'offres ouvert publié au JOUE ?",
		Choices: []Choice{
			{ID: "a", Text: "15 jours"},
			{ID: "b", Text: "30 jours", Correct: true},
			{ID: "c", Text: "45 jours"},
			{ID: "d", Text: "52 jours"},
		},
		Explanation: "Le délai minimum est 35 jours (envoi électronique). Il peut être réduit à 30 jours si un avis de pré-information a été publié, et jusqu'à 15 jours en cas d'urgence justifiée.",
		Reference:   "Art. R2143-1 CCP",
	},
	{
		ID: "D02", Theme: "delais", Difficulty: "debutant",
		Text: "Le délai global de paiement dans les marchés publics pour les collectivités locales est de :",
		Choices: []Choice{
			{ID: "a", Text: "15 jours"},
			{ID: "b", Text: "30 jours", Correct: true},
			{ID: "c", Text: "45 jours"},
			{ID: "d", Text: "60 jours"},
		},
		Explanation: "Le DGP est de 30 jours pour les collectivités territoriales (art. L2192-12 CCP). Au-delà, des intérêts moratoires courent automatiquement.",
		Reference:   "Art. L2192-12 CCP",
	},
	{
		ID: "D03", Theme: "delais", Difficulty: "confirme",
		Text: "Le délai de standstill (suspension) après notification du rejet d'une candidature est de :",
		Choices: []Choice{
			{ID: "a", Text: "5 jours"},
			{ID: "b", Text: "11 jours calendaires", Correct: true},
			{ID: "c", Text: "15 jours ouvrés"},
			{ID: "d", Text: "21 jours"},
		},
		Explanation: "Le délai de suspension (standstill) est de 11 jours calendaires entre notification du rejet et signature du marché, ou 16 jours si la notification n'est pas faite par voie électronique.",
		Reference:   "Art. L2182-1 CCP",
	},
	{
		ID: "D04", Theme: "delais", Difficulty: "confirme",
		Text: "Combien de temps doit-on conserver les pièces d'un marché public après son achèvement ?",
		Choices: []Choice{
			{ID: "a", Text: "5 ans"},
			{ID: "b", Text: "10 ans", Correct: true},
			{ID: "c", Text: "15 ans"},
			{ID: "d", Text: "30 ans"},
		},
		Explanation: "La durée d'archivage réglementaire des marchés publics est de 10 ans à compter de leur achèvement (art. L3126-1 CCP).",
		Reference:   "Art. L3126-1 CCP",
	},
	{
		ID: "D05", Theme: "delais", Difficulty: "expert",
		Text: "En cas de dépassement du délai de paiement, l'indemnité forfaitaire de recouvrement est de :",
		Choices: []Choice{
			{ID: "a", Text: "15 €"},
			{ID: "b", Text: "20 €"},
			{ID: "c", Text: "40 €", Correct: true},
			{ID: "d", Text: "100 €"},
		},
		Explanation: "En sus des intérêts moratoires, une indemnité forfaitaire de 40 € par facture est due de plein droit au créancier (Décret 2013-269, transposant directive 2011/7/UE).",
		Reference:   "Décret n°2013-269, art. 1",
	},
	// ── Documents ────────────────────────────────────────────────────────────
	{
		ID: "DOC01", Theme: "documents", Difficulty: "debutant",
		Text: "Le CCAP est :",
		Choices: []Choice{
			{ID: "a", Text: "Le cahier des clauses techniques particulières"},
			{ID: "b", Text: "Le cahier des clauses administratives particulières", Correct: true},
			{ID: "c", Text: "Le cadre de réponse des candidats"},
			{ID: "d", Text: "Le contrat d'assurance du prestataire"},
		},
		Explanation: "Le CCAP fixe les clauses administratives (durée, pénalités, modalités de paiement) propres au marché. Le CCTP fixe les clauses techniques.",
		Reference:   "Art. R2112-1 CCP",
	},
	{
		ID: "DOC02", Theme: "documents", Difficulty: "debutant",
		Text: "Quel document précise les besoins techniques de l'acheteur ?",
		Choices: []Choice{
			{ID: "a", Text: "Le RC (Règlement de consultation)", Correct: false},
			{ID: "b", Text: "Le CCAP"},
			{ID: "c", Text: "Le CCTP (Cahier des Clauses Techniques Particulières)", Correct: true},
			{ID: "d", Text: "L'AE (Acte d'Engagement)"},
		},
		Explanation: "Le CCTP décrit précisément les spécifications techniques des prestations attendues.",
		Reference:   "Art. R2112-1 CCP",
	},
	{
		ID: "DOC03", Theme: "documents", Difficulty: "confirme",
		Text: "L'Acte d'Engagement (AE) est signé par :",
		Choices: []Choice{
			{ID: "a", Text: "Le seul acheteur public"},
			{ID: "b", Text: "Le seul candidat retenu"},
			{ID: "c", Text: "Le candidat retenu et le représentant de l'acheteur", Correct: true},
			{ID: "d", Text: "Le comptable public"},
		},
		Explanation: "L'AE est le document contractuel signé des deux parties qui matérialise l'engagement. Il lie l'acheteur et le titulaire.",
		Reference:   "Art. R2112-4 CCP",
	},
	{
		ID: "DOC04", Theme: "documents", Difficulty: "confirme",
		Text: "Le Dossier de Consultation des Entreprises (DCE) doit obligatoirement comprendre :",
		Choices: []Choice{
			{ID: "a", Text: "Le CCAP, CCTP, AE et RC", Correct: true},
			{ID: "b", Text: "Uniquement le CCAP et le CCTP"},
			{ID: "c", Text: "Le RC, CCAP et les CV des agents"},
			{ID: "d", Text: "Le CCTP et le budget prévisionnel"},
		},
		Explanation: "Le DCE comprend au minimum le Règlement de Consultation (RC), le CCAP, le CCTP et l'Acte d'Engagement (AE). Des documents annexes peuvent compléter.",
		Reference:   "Art. R2132-2 CCP",
	},
	{
		ID: "DOC05", Theme: "documents", Difficulty: "expert",
		Text: "Quelle est la durée minimale de mise à disposition du DCE sur le profil d'acheteur ?",
		Choices: []Choice{
			{ID: "a", Text: "Jusqu'à la date limite de remise des offres uniquement"},
			{ID: "b", Text: "5 ans après la notification du marché"},
			{ID: "c", Text: "Jusqu'à la fin de l'exécution du marché", Correct: true},
			{ID: "d", Text: "3 ans à compter de la signature"},
		},
		Explanation: "Le profil acheteur doit permettre l'accès aux documents de la consultation jusqu'à la fin d'exécution du marché (art. R2132-12 CCP).",
		Reference:   "Art. R2132-12 CCP",
	},
	// ── RGPD ─────────────────────────────────────────────────────────────────
	{
		ID: "R01", Theme: "rgpd", Difficulty: "debutant",
		Text: "Dans le cadre d'un marché public, le traitement des données personnelles des candidats est soumis au :",
		Choices: []Choice{
			{ID: "a", Text: "Règlement RGPD uniquement"},
			{ID: "b", Text: "RGPD et à la loi Informatique et Libertés", Correct: true},
			{ID: "c", Text: "Au CCP uniquement"},
			{ID: "d", Text: "Aucune réglementation spécifique"},
		},
		Explanation: "Les données personnelles traitées lors d'une procédure de marché (candidats, représentants) sont soumises au RGPD (UE 2016/679) et à la loi française n°78-17.",
		Reference:   "RGPD art. 6, Loi n°78-17 modifiée",
	},
	{
		ID: "R02", Theme: "rgpd", Difficulty: "confirme",
		Text: "La durée de conservation des données personnelles des candidats non retenus est au maximum de :",
		Choices: []Choice{
			{ID: "a", Text: "6 mois après la clôture de la consultation"},
			{ID: "b", Text: "2 ans après la fin de la procédure", Correct: true},
			{ID: "c", Text: "5 ans"},
			{ID: "d", Text: "10 ans (identique aux pièces du marché)"},
		},
		Explanation: "Selon la CNIL, les données des candidats non retenus doivent être conservées 2 ans à compter de la fin de la procédure (délibération CNIL n°2012-113).",
		Reference:   "Délibération CNIL n°2012-113",
	},
	{
		ID: "R03", Theme: "rgpd", Difficulty: "expert",
		Text: "L'acheteur public doit mentionner dans le DCE :",
		Choices: []Choice{
			{ID: "a", Text: "La liste nominative des agents traitant les offres"},
			{ID: "b", Text: "Les traitements de données prévus et les droits des candidats", Correct: true},
			{ID: "c", Text: "Le nom du DPO"},
			{ID: "d", Text: "Le numéro SIREN de l'acheteur uniquement"},
		},
		Explanation: "Conformément à l'art. 13 RGPD, l'acheteur doit informer les candidats des traitements réalisés sur leurs données (finalité, durée, droits) dès la mise en ligne du DCE.",
		Reference:   "RGPD art. 13",
	},
}

// Themes returns the list of available themes.
func Themes() []string {
	return []string{"seuils", "procedures", "delais", "documents", "rgpd"}
}
