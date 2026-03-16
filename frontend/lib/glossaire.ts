export interface GlossaireTerm {
  sigle?: string;
  terme: string;
  categorie: string;
  definition: string;
  exemple?: string;
  legifrance?: string;
  ccp?: string; // Article CCP
}

export const GLOSSAIRE: GlossaireTerm[] = [
  // ── Procédures ──────────────────────────────────────────────────────────
  {
    sigle: "MAPA",
    terme: "Marché à Procédure Adaptée",
    categorie: "Procédures",
    definition: "Procédure dans laquelle l'acheteur définit librement les modalités de passation, dans le respect des principes fondamentaux (liberté d'accès, égalité de traitement, transparence). Applicable en dessous des seuils européens.",
    exemple: "Un MAPA pour l'achat de fournitures de bureau à 35 000 € HT.",
    legifrance: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038358751",
    ccp: "Art. L2123-1",
  },
  {
    sigle: "AO",
    terme: "Appel d'Offres",
    categorie: "Procédures",
    definition: "Procédure formalisée par laquelle l'acheteur choisit l'offre économiquement la plus avantageuse sans négociation. Obligatoire au-dessus des seuils européens pour les fournitures et services courants.",
    exemple: "AO ouvert pour un marché de nettoyage à 250 000 € HT.",
    legifrance: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038358755",
    ccp: "Art. L2124-2",
  },
  {
    sigle: "AOR",
    terme: "Appel d'Offres Restreint",
    categorie: "Procédures",
    definition: "Variante de l'appel d'offres dans laquelle l'acheteur sélectionne préalablement les candidats autorisés à remettre une offre (phase de candidature puis phase d'offre).",
    ccp: "Art. L2124-3",
  },
  {
    terme: "Dialogue Compétitif",
    categorie: "Procédures",
    definition: "Procédure formalisée dans laquelle l'acheteur dialogue avec les candidats admis pour développer des solutions aptes à répondre à ses besoins, avant d'inviter les candidats à remettre une offre.",
    exemple: "Utilisé pour des projets complexes type PPP ou DSP.",
    ccp: "Art. L2124-4",
  },
  {
    terme: "Procédure Concurrentielle avec Négociation",
    sigle: "PCN",
    categorie: "Procédures",
    definition: "Procédure formalisée permettant la négociation après remise des offres initiales. Applicable dans des cas limitativement énumérés par le code.",
    ccp: "Art. L2124-5",
  },
  {
    terme: "Concours",
    categorie: "Procédures",
    definition: "Procédure par laquelle l'acheteur choisit, après mise en concurrence et avis d'un jury, un plan ou un projet, notamment dans le domaine de l'architecture, de l'urbanisme ou du traitement de données.",
    ccp: "Art. L2124-7",
  },
  {
    terme: "Marché de Partenariat",
    categorie: "Procédures",
    definition: "Marché public permettant à l'acheteur de confier à un opérateur économique une mission globale comprenant le financement, la construction ou la transformation, l'entretien, la maintenance et éventuellement la gestion d'un ouvrage.",
    ccp: "Art. L1112-1",
  },
  {
    terme: "Accord-Cadre",
    categorie: "Procédures",
    definition: "Accord conclu entre un ou plusieurs acheteurs et un ou plusieurs opérateurs économiques, qui établit les termes régissant les marchés à passer au cours d'une période donnée (max 4 ans pour l'État, 8 ans pour les réseaux).",
    ccp: "Art. L2125-1",
  },
  {
    terme: "Système d'Acquisition Dynamique",
    sigle: "SAD",
    categorie: "Procédures",
    definition: "Processus d'acquisition entièrement électronique, ouvert pendant toute sa durée à tout opérateur économique satisfaisant aux critères de sélection.",
    ccp: "Art. L2125-5",
  },

  // ── Documents ──────────────────────────────────────────────────────────
  {
    sigle: "DCE",
    terme: "Dossier de Consultation des Entreprises",
    categorie: "Documents",
    definition: "Ensemble des documents remis aux candidats pour leur permettre de présenter une offre. Comprend le RC, le CCAP, le CCTP, les plans, le BPU/DQE le cas échéant.",
    exemple: "Le DCE est mis en ligne sur la plateforme de dématérialisation.",
  },
  {
    sigle: "RC",
    terme: "Règlement de la Consultation",
    categorie: "Documents",
    definition: "Document du DCE précisant les conditions de la mise en concurrence : critères de sélection des candidatures et d'attribution, modalités de remise des offres, délais.",
  },
  {
    sigle: "CCAP",
    terme: "Cahier des Clauses Administratives Particulières",
    categorie: "Documents",
    definition: "Document contractuel fixant les dispositions administratives propres au marché : prix, révision, pénalités, délais d'exécution, modalités de réception et de paiement.",
    ccp: "Art. R2112-1",
  },
  {
    sigle: "CCTP",
    terme: "Cahier des Clauses Techniques Particulières",
    categorie: "Documents",
    definition: "Document contractuel définissant les spécifications techniques des prestations : caractéristiques, normes, modalités d'exécution, performances attendues.",
  },
  {
    sigle: "CCAG",
    terme: "Cahier des Clauses Administratives Générales",
    categorie: "Documents",
    definition: "Document-type fixant les dispositions générales applicables à une catégorie de marchés (travaux, fournitures courantes, services, TIC, PI, maîtrise d'œuvre). S'applique par référence dans le CCAP.",
  },
  {
    sigle: "BPU",
    terme: "Bordereau des Prix Unitaires",
    categorie: "Documents",
    definition: "Document listant les prix unitaires de chaque prestation, sur la base desquels le titulaire sera rémunéré. Utilisé pour les marchés à bons de commande.",
  },
  {
    sigle: "DQE",
    terme: "Détail Quantitatif Estimatif",
    categorie: "Documents",
    definition: "Document permettant d'évaluer les offres en appliquant les prix unitaires du BPU à des quantités estimées par l'acheteur. Sert à la comparaison des offres.",
  },
  {
    sigle: "DPGF",
    terme: "Décomposition du Prix Global et Forfaitaire",
    categorie: "Documents",
    definition: "Tableau détaillant la décomposition du prix forfaitaire d'un marché en postes élémentaires. Permet d'analyser la cohérence du prix et de gérer les travaux supplémentaires.",
  },
  {
    sigle: "AAPC",
    terme: "Avis d'Appel Public à la Concurrence",
    categorie: "Documents",
    definition: "Avis de publicité marquant le lancement officiel d'une procédure d'achat. Publié au BOAMP et/ou au JOUE selon les seuils. Contient les informations essentielles du marché.",
    legifrance: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038358497",
  },
  {
    terme: "Avis d'Attribution",
    categorie: "Documents",
    definition: "Avis publié après signature du marché informant du résultat de la procédure : nom du titulaire, montant du marché. Obligatoire pour les marchés formalisés.",
    ccp: "Art. R2183-1",
  },
  {
    sigle: "DC1",
    terme: "Lettre de Candidature (DC1)",
    categorie: "Documents",
    definition: "Formulaire officiel permettant à un opérateur économique de présenter sa candidature à un marché public, seul ou en groupement. Disponible sur le site du ministère de l'Économie.",
  },
  {
    sigle: "DC2",
    terme: "Déclaration du Candidat (DC2)",
    categorie: "Documents",
    definition: "Formulaire officiel permettant au candidat de déclarer sa situation (chiffre d'affaires, effectifs, certificats, références). Accompagne le DC1.",
  },
  {
    sigle: "DUME",
    terme: "Document Unique de Marché Européen",
    categorie: "Documents",
    definition: "Formulaire électronique standardisé au niveau européen permettant aux candidats de déclarer leur situation pour l'accès à un marché public. Remplace les DC1/DC2.",
    legifrance: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000034354570",
  },

  // ── Acteurs ────────────────────────────────────────────────────────────
  {
    terme: "Acheteur Public",
    categorie: "Acteurs",
    definition: "Entité soumise au Code de la commande publique pour ses achats : État, collectivités territoriales, établissements publics, organismes de droit public.",
    ccp: "Art. L1211-1",
  },
  {
    terme: "Pouvoir Adjudicateur",
    sigle: "PA",
    categorie: "Acteurs",
    definition: "Catégorie d'acheteur regroupant l'État, les collectivités territoriales et leurs établissements publics. Soumis aux règles les plus strictes du CCP.",
    ccp: "Art. L1211-1",
  },
  {
    terme: "Entité Adjudicatrice",
    sigle: "EA",
    categorie: "Acteurs",
    definition: "Acheteur opérant dans les secteurs spéciaux (eau, énergie, transports, services postaux). Bénéficie de règles assouplies notamment sur les procédures et délais.",
    ccp: "Art. L1211-2",
  },
  {
    terme: "Opérateur Économique",
    sigle: "OE",
    categorie: "Acteurs",
    definition: "Toute personne physique ou morale, publique ou privée, ou groupement de personnes, qui offre sur le marché des travaux, des fournitures ou des services.",
    ccp: "Art. L1220-1",
  },
  {
    terme: "Candidat",
    categorie: "Acteurs",
    definition: "Opérateur économique ayant déposé une candidature. Il devient soumissionnaire s'il est admis à déposer une offre.",
  },
  {
    terme: "Soumissionnaire",
    categorie: "Acteurs",
    definition: "Opérateur économique ayant remis une offre. Il devient attributaire si son offre est retenue.",
  },
  {
    terme: "Attributaire",
    categorie: "Acteurs",
    definition: "Soumissionnaire dont l'offre a été retenue avant la signature du marché. Le marché n'est pas encore formé : un délai de standstill peut s'appliquer.",
  },
  {
    terme: "Titulaire",
    categorie: "Acteurs",
    definition: "Opérateur économique signataire du marché public. La relation contractuelle est établie.",
  },
  {
    terme: "Sous-traitant",
    categorie: "Acteurs",
    definition: "Entreprise à qui le titulaire confie l'exécution d'une partie du marché. Le sous-traitant doit être accepté et ses conditions de paiement agréées par l'acheteur.",
    ccp: "Art. L2193-1",
  },
  {
    terme: "Groupement d'Entreprises",
    categorie: "Acteurs",
    definition: "Association momentanée de plusieurs opérateurs économiques pour répondre conjointement à un marché public. Peut être conjoint (chaque membre répond d'une partie) ou solidaire.",
    ccp: "Art. L2142-4",
  },
  {
    terme: "Mandataire",
    categorie: "Acteurs",
    definition: "Membre du groupement désigné pour représenter l'ensemble du groupement vis-à-vis de l'acheteur. Responsable de la coordination.",
  },
  {
    terme: "Maître d'Ouvrage",
    sigle: "MOA",
    categorie: "Acteurs",
    definition: "Personne morale pour laquelle l'ouvrage est construit. Responsable du projet, elle définit le programme, arrête les coûts et les délais.",
  },
  {
    terme: "Maître d'Œuvre",
    sigle: "MOE",
    categorie: "Acteurs",
    definition: "Personne physique ou morale chargée de la conception et du suivi de l'exécution des travaux pour le compte du maître d'ouvrage.",
    ccp: "Art. L2431-1",
  },
  {
    terme: "Ordonnateur",
    categorie: "Acteurs",
    definition: "Agent habilité à prescrire l'exécution des recettes et des dépenses publiques. Prescrit le paiement du marché mais ne détient pas les fonds.",
  },
  {
    terme: "Comptable Public",
    categorie: "Acteurs",
    definition: "Agent chargé du maniement des fonds publics. Procède au paiement après vérification de la régularité de la dépense.",
  },

  // ── Exécution ──────────────────────────────────────────────────────────
  {
    sigle: "OS",
    terme: "Ordre de Service",
    categorie: "Exécution",
    definition: "Instruction écrite de l'acheteur au titulaire pour démarrer les travaux, les modifier ou les arrêter. L'OS de démarrage fixe la date de début du délai d'exécution.",
    exemple: "OS n°1 : démarrage des travaux le 1er avril 2026.",
  },
  {
    terme: "Avenant",
    categorie: "Exécution",
    definition: "Acte contractuel modifiant le contrat en cours d'exécution. Ne peut bouleverser l'économie du marché ni en changer l'objet. Encadré strictement par le CCP.",
    ccp: "Art. L2194-1",
  },
  {
    terme: "Décision de Poursuivre",
    sigle: "DP",
    categorie: "Exécution",
    definition: "Acte unilatéral de l'acheteur autorisant le titulaire à poursuivre des prestations supplémentaires non prévues au marché, dans l'attente d'un avenant.",
  },
  {
    terme: "Retenue de Garantie",
    categorie: "Exécution",
    definition: "Somme retenue sur chaque acompte (max 5 % du montant initial) pour garantir l'exécution des obligations de garantie. Restituée à l'issue du délai de garantie.",
    ccp: "Art. R2191-34",
  },
  {
    terme: "Caution Personnelle et Solidaire",
    categorie: "Exécution",
    definition: "Garantie fournie par un établissement bancaire qui s'engage solidairement avec le titulaire à satisfaire aux obligations résultant du marché. Peut remplacer la retenue de garantie.",
  },
  {
    terme: "Avance",
    categorie: "Exécution",
    definition: "Somme versée au titulaire avant tout commencement d'exécution. Obligatoire (minimum 5 %) pour les marchés ≥ 50 000 € HT d'une durée > 2 mois.",
    ccp: "Art. R2191-7",
  },
  {
    terme: "Acompte",
    categorie: "Exécution",
    definition: "Paiement partiel correspondant à des prestations effectivement réalisées. Obligatoire au minimum mensuellement pour les marchés de travaux.",
    ccp: "Art. R2191-14",
  },
  {
    terme: "Pénalités de Retard",
    categorie: "Exécution",
    definition: "Sommes dues par le titulaire en cas de non-respect des délais contractuels. Appliquées de plein droit sans mise en demeure préalable sauf disposition contraire du CCAP.",
    ccp: "Art. R2193-1",
  },
  {
    terme: "Délai de Paiement",
    categorie: "Exécution",
    definition: "Délai maximum dans lequel l'acheteur doit payer le titulaire. 30 jours pour l'État et ses établissements publics, 30 jours pour les collectivités locales. Des intérêts moratoires sont dus en cas de dépassement.",
    ccp: "Art. L2192-12",
  },
  {
    terme: "Intérêts Moratoires",
    sigle: "IM",
    categorie: "Exécution",
    definition: "Intérêts dus de plein droit au titulaire en cas de dépassement du délai de paiement. Calculés sur le taux directeur de la BCE + 8 points.",
    ccp: "Art. L2192-14",
  },
  {
    terme: "Révision de Prix",
    categorie: "Exécution",
    definition: "Mécanisme permettant de faire évoluer le prix du marché en fonction d'indices économiques (matières premières, main d'œuvre). Obligatoire pour les marchés > 3 mois comportant une part significative de main-d'œuvre ou de matières.",
    ccp: "Art. L2112-9",
  },
  {
    terme: "Actualisation",
    categorie: "Exécution",
    definition: "Mécanisme d'ajustement du prix entre la date de remise des offres et le début d'exécution. Distinct de la révision qui s'applique pendant l'exécution.",
  },
  {
    sigle: "PV",
    terme: "Procès-Verbal de Réception",
    categorie: "Exécution",
    definition: "Document constatant la fin des travaux ou des livraisons et les conditions dans lesquelles ils sont acceptés. Marque le point de départ du délai de garantie.",
    ccp: "Art. R2192-3",
  },
  {
    terme: "Réserves",
    categorie: "Exécution",
    definition: "Observations formulées lors de la réception signalant des désordres ou non-conformités. Doivent être levées par le titulaire dans un délai fixé.",
  },
  {
    terme: "Garantie de Parfait Achèvement",
    sigle: "GPA",
    categorie: "Exécution",
    definition: "Obligation du titulaire de remédier à tous les désordres signalés pendant l'année suivant la réception des travaux.",
    ccp: "Art. L2192-6",
  },

  // ── Seuils & Publicité ────────────────────────────────────────────────
  {
    terme: "Seuil Européen",
    categorie: "Seuils & Publicité",
    definition: "Montant en dessous duquel les acheteurs n'ont pas l'obligation de publier un JOUE. Révisés tous les 2 ans par la Commission européenne. En 2024 : 143 000 € (État/fournitures-services), 221 000 € (collectivités/fournitures-services), 5 538 000 € (travaux).",
    legifrance: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000048849577",
  },
  {
    sigle: "JOUE",
    terme: "Journal Officiel de l'Union Européenne",
    categorie: "Seuils & Publicité",
    definition: "Publication officielle de l'UE où sont publiés les avis de marchés au-dessus des seuils européens. Publication via TED (Tenders Electronic Daily).",
  },
  {
    sigle: "BOAMP",
    terme: "Bulletin Officiel des Annonces des Marchés Publics",
    categorie: "Seuils & Publicité",
    definition: "Bulletin officiel français de publicité des marchés publics. Obligatoire pour certaines procédures, recommandé pour d'autres. Géré par la Direction de l'information légale et administrative.",
    legifrance: "https://www.boamp.fr",
  },
  {
    sigle: "JAL",
    terme: "Journal d'Annonces Légales",
    categorie: "Seuils & Publicité",
    definition: "Support de presse habilité à recevoir des annonces légales. Utilisé pour la publicité des marchés passés par certaines collectivités en dessous des seuils européens.",
  },
  {
    terme: "Délai de Standstill",
    categorie: "Seuils & Publicité",
    definition: "Délai de 11 jours (16 jours si non électronique) entre la notification du rejet aux autres candidats et la signature du marché. Permet aux candidats évincés de former un recours.",
    ccp: "Art. L2182-1",
  },
  {
    terme: "Délai de Remise des Offres",
    categorie: "Seuils & Publicité",
    definition: "Délai minimum accordé aux soumissionnaires pour préparer et remettre leur offre. Varie selon la procédure : 35 jours minimum pour un AO ouvert publié au JOUE.",
    ccp: "Art. R2143-1",
  },

  // ── Critères & Attribution ────────────────────────────────────────────
  {
    terme: "Offre Économiquement la Plus Avantageuse",
    sigle: "OEPA",
    categorie: "Attribution",
    definition: "Critère d'attribution obligatoire. L'acheteur doit retenir l'offre présentant le meilleur rapport qualité/prix en fonction de critères pondérés définis dans le RC.",
    ccp: "Art. L2152-7",
  },
  {
    terme: "Critère Prix",
    categorie: "Attribution",
    definition: "Critère d'attribution portant sur le coût. Peut être le seul critère si l'acheteur a défini des spécifications suffisantes. Ne peut être inférieur à 30 % de la pondération dans la plupart des marchés.",
  },
  {
    terme: "Critère Qualité",
    categorie: "Attribution",
    definition: "Critère d'attribution portant sur la valeur technique, la méthodologie, la qualité du service, le délai de livraison, l'impact environnemental, etc.",
  },
  {
    terme: "Offre Anormalement Basse",
    sigle: "OAB",
    categorie: "Attribution",
    definition: "Offre dont le prix semble anormalement bas au regard des prestations. L'acheteur a l'obligation de demander des explications avant de rejeter l'offre.",
    ccp: "Art. L2152-5",
  },
  {
    terme: "Variante",
    categorie: "Attribution",
    definition: "Solution proposée par le soumissionnaire qui diffère des spécifications de base tout en satisfaisant les exigences minimales fixées par l'acheteur. Autorisée uniquement si mentionnée dans le DCE.",
    ccp: "Art. L2151-7",
  },
  {
    terme: "Option",
    categorie: "Attribution",
    definition: "Prestation supplémentaire définie dans le marché que l'acheteur se réserve le droit de commander. Doit être chiffrée par le soumissionnaire.",
  },

  // ── Contrôle & Recours ────────────────────────────────────────────────
  {
    terme: "Contrôle de Légalité",
    categorie: "Contrôle & Recours",
    definition: "Contrôle exercé par le représentant de l'État (préfet) sur les actes des collectivités territoriales. Les marchés formalisés sont transmissibles au préfet.",
    ccp: "Art. L3131-1 CGCT",
  },
  {
    terme: "Référé Précontractuel",
    categorie: "Contrôle & Recours",
    definition: "Recours juridictionnel disponible avant la signature du marché permettant à un concurrent évincé de contester des manquements aux obligations de publicité et de mise en concurrence.",
    ccp: "Art. L551-1 CJA",
  },
  {
    terme: "Référé Contractuel",
    categorie: "Contrôle & Recours",
    definition: "Recours disponible après la signature du marché (dans un délai de 31 jours) permettant de demander la suspension voire la résiliation du contrat en cas de violation grave des règles de publicité.",
    ccp: "Art. L551-13 CJA",
  },
  {
    terme: "Recours Tropic",
    categorie: "Contrôle & Recours",
    definition: "Recours de plein contentieux ouvert aux concurrents évincés dans les 2 mois suivant la mesure de publicité de la conclusion du contrat. Permet de contester la validité ou demander la résiliation.",
  },

  // ── Données & Numérique ───────────────────────────────────────────────
  {
    sigle: "DECP",
    terme: "Données Essentielles de la Commande Publique",
    categorie: "Données & Numérique",
    definition: "Données que tout acheteur public doit publier en open data sur data.gouv.fr pour les marchés ≥ 25 000 € HT. Comprend l'identité des parties, l'objet, le montant et la durée.",
    legifrance: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000032295952",
    ccp: "Art. R2196-1",
  },
  {
    sigle: "DUME",
    terme: "Document Unique de Marché Européen",
    categorie: "Données & Numérique",
    definition: "Formulaire électronique standardisé permettant aux opérateurs de déclarer leur aptitude à participer à un marché. Accepté dans tous les États membres.",
  },
  {
    sigle: "PdP",
    terme: "Profil d'Acheteur",
    categorie: "Données & Numérique",
    definition: "Outil de dématérialisation (plateforme) sur lequel l'acheteur publie les documents de la consultation et reçoit les candidatures et offres électroniques. Obligatoire pour les marchés ≥ 40 000 € HT.",
    ccp: "Art. R2132-1",
  },
  {
    sigle: "CPV",
    terme: "Common Procurement Vocabulary",
    categorie: "Données & Numérique",
    definition: "Nomenclature européenne de référence pour les marchés publics, composée de codes à 8 chiffres classifiant les fournitures, services et travaux. Obligatoire dans les avis de publicité.",
    exemple: "CPV 45000000 : Travaux de construction. CPV 72000000 : Services informatiques.",
  },
  {
    sigle: "SEDA",
    terme: "Standard d'Échange de Données pour l'Archivage",
    categorie: "Données & Numérique",
    definition: "Standard XML français pour l'échange et le versement de documents numériques aux services d'archives. Obligatoire pour les versements aux Archives nationales et départementales.",
  },

  // ── Allotissement & Organisation ──────────────────────────────────────
  {
    terme: "Allotissement",
    categorie: "Allotissement & Organisation",
    definition: "Division du marché en lots distincts correspondant à des prestations homogènes. Principe obligatoire pour favoriser l'accès des PME. L'acheteur peut déroger en justifiant son choix.",
    ccp: "Art. L2113-10",
  },
  {
    terme: "Lot",
    categorie: "Allotissement & Organisation",
    definition: "Subdivision d'un marché alloti correspondant à une prestation homogène ou à une zone géographique. Chaque lot fait l'objet d'un contrat séparé.",
  },
  {
    terme: "Marché Global",
    categorie: "Allotissement & Organisation",
    definition: "Marché non alloti regroupant plusieurs prestations. Déroge au principe d'allotissement. Doit être justifié par l'acheteur dans les documents du marché.",
    ccp: "Art. L2113-11",
  },
  {
    terme: "Accord de Groupement de Commandes",
    categorie: "Allotissement & Organisation",
    definition: "Convention par laquelle plusieurs acheteurs s'organisent pour passer conjointement un marché, désignant l'un d'eux comme coordonnateur.",
    ccp: "Art. L2113-2",
  },
  {
    terme: "Centrale d'Achat",
    categorie: "Allotissement & Organisation",
    definition: "Entité adjudicatrice réalisant des acquisitions de fournitures ou services, ou passant des marchés-cadres au profit d'autres acheteurs. Ex : UGAP.",
    ccp: "Art. L2113-5",
  },

  // ── Développement Durable ─────────────────────────────────────────────
  {
    terme: "Clause Sociale",
    categorie: "Développement Durable",
    definition: "Clause contractuelle favorisant l'insertion professionnelle de personnes éloignées de l'emploi. Peut porter sur un nombre d'heures d'insertion ou le recours à des SIAE.",
    ccp: "Art. L2112-2",
  },
  {
    terme: "Clause Environnementale",
    categorie: "Développement Durable",
    definition: "Clause contractuelle imposant au titulaire des exigences environnementales : gestion des déchets, émissions carbone, matériaux biosourcés, éco-conditionnalité.",
    ccp: "Art. L2112-2",
  },
  {
    terme: "SPASER",
    sigle: "SPASER",
    categorie: "Développement Durable",
    definition: "Document de planification obligatoire pour les acheteurs dont le montant total annuel des achats est supérieur à 50 M€ HT. Définit les objectifs et mesures de l'achat responsable.",
    ccp: "Art. L2111-3",
  },
  {
    terme: "Achat Innovant",
    categorie: "Développement Durable",
    definition: "Marché portant sur des travaux, fournitures ou services nouveaux ou sensiblement améliorés. Bénéficie de règles assouplies (MAPA jusqu'à 100 000 € HT sans publicité).",
    ccp: "Art. R2122-9-1",
  },
];

// Toutes les catégories uniques
export const CATEGORIES_GLOSSAIRE = Array.from(
  new Set(GLOSSAIRE.map((t) => t.categorie))
).sort();

// Lookup par terme ou sigle pour les tooltips contextuels
export function findTerm(query: string): GlossaireTerm | undefined {
  const q = query.toLowerCase();
  return GLOSSAIRE.find(
    (t) =>
      t.terme.toLowerCase() === q ||
      t.sigle?.toLowerCase() === q
  );
}
