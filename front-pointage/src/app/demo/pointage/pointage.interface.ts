// src/app/demo/pointage/pointage.interface.ts

// Dans pointage.interface.ts
export interface Pointage {
  _id: string;
  user_id: string;
  cardId: string;
  date: Date;
  premierPointage?: Date;
  dernierPointage?: Date;
  estPresent: boolean;
  estEnAttente: boolean;
  estRetard?: boolean;
  estRejete?: boolean;
  vigile_id?: string;
  utilisateur?: {
    _id: string;
    nom: string;
    prenom: string;
    photo?: string;
    matricule: string;
    fonction?: string;
  };
}

export interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  type: string;
  departement?: any;
  cohorte?: any;
  matricule: string;
  fonction?: string;
  photo?: string;
  statut: string;
}

export interface PointageResponse {
  status: boolean;
  message: string;
  data?: {
    utilisateur: Utilisateur;
    pointage: Pointage;
  };
}

export interface VigileInfo {
  isVigile: boolean;
  vigileId?: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DernierPointage {
  matricule: string;
  heure: string;
  nom: string;
  prenom: string;
  status: string;
}

export interface UtilisateurPresence {
  matricule: string;
  photo: string;
  nom: string;
  prenom: string;
  type: string;
  status: 'Présent' | 'Absent' | 'Retard';
  entree?: string;
  sortie?: string;
  cardId?: string;
}
