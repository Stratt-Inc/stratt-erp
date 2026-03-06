export type AlerteSeverity = "critique" | "haute" | "moyenne" | "info";
export type AlerteType =
  | "fractionnement"
  | "seuil_procedure"
  | "renouvellement"
  | "classification_manquante"
  | "marche_sans_justification";

export interface Alerte {
  id: string;
  orgId: string;
  type: AlerteType;
  severity: AlerteSeverity;
  titre: string;
  message: string;
  donnees?: Record<string, unknown>;
  resolue: boolean;
  resolueAt?: Date;
  resolueParId?: string;
  createdAt: Date;
  updatedAt: Date;
}
