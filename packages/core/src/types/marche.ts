export type MarcheStatut =
  | "planifie"
  | "en_cours"
  | "attribue"
  | "execute"
  | "clos"
  | "annule";

export type Procedure =
  | "mapa_40k"
  | "mapa_90k"
  | "appel_offres_ouvert"
  | "appel_offres_restreint"
  | "accord_cadre"
  | "procedure_negociee"
  | "marche_negociee_sans_publicite";

export interface Marche {
  id: string;
  orgId: string;
  reference: string;
  objet: string;
  procedure: Procedure;
  statut: MarcheStatut;
  montantEstime: number;
  montantAttribue?: number;
  dateDebut?: Date;
  dateFin?: Date;
  fournisseur?: string;
  codeNomenclature?: string;
  directionAcheteuse?: string;
  createdAt: Date;
  updatedAt: Date;
}
