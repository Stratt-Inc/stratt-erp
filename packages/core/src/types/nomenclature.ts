export interface NomenclatureCode {
  id: string;
  orgId: string;
  code: string;
  libelle: string;
  description?: string;
  parentCode?: string;
  niveau: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NomenclatureVersion {
  id: string;
  orgId: string;
  version: string;
  annee: number;
  actif: boolean;
  createdAt: Date;
}
