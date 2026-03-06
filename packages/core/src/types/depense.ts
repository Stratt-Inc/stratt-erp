export type ImportJobStatut = "en_attente" | "en_cours" | "termine" | "erreur";

export interface Depense {
  id: string;
  orgId: string;
  reference: string;
  libelle: string;
  montant: number;
  dateDepense: Date;
  fournisseur?: string;
  codeNomenclature?: string;
  marcheId?: string;
  directionAcheteuse?: string;
  classifieParIA: boolean;
  confidenceIA?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportJob {
  id: string;
  orgId: string;
  fichierNom: string;
  fichierUrl: string;
  statut: ImportJobStatut;
  lignesTotal?: number;
  lignesTraitees?: number;
  lignesErreur?: number;
  erreurs?: string[];
  createdAt: Date;
  updatedAt: Date;
}
