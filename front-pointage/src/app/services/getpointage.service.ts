import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaces
export interface Utilisateur {
  _id: string;
  id?: string;
  nom: string;
  prenom: string;
  matricule: string;
  cardId: string;
  type?: string;
  departement?: {
    nom: string;
  };
  cohorte?: {
    nom: string;
  };
}

export interface Pointage {
  id: string;
  user_id: string;
  cardId: string;
  date: string;
  estPresent: boolean;
  estRetard: boolean;
  estEnAttente: boolean;
  estRetard_temp: boolean;
  premierPointage: string | null;
  dernierPointage: string | null;
  premierPointage_temp: string | null;
  dernierPointage_temp: string | null;
  vigile_id: string;
  user: Utilisateur;
  vigile?: Utilisateur;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
  total?: number;  // Ajoutez cette propriété
  statistiques?: {
    total_pointages: number;
    total_present: number;
    total_retard: number;
    total_absent: number;
    pourcentage_presence: number;
  };
}
export interface PresenceParams {
  date?: string;
  periode?: 'journee' | 'semaine' | 'mois';
  date_debut?: string;
  date_fin?: string;
  cohorte_id?: string;
  departement_id?: string;
  statut_presence?: 'present' | 'absent' | 'retard';
  type?: 'apprenant' | 'employe';
  per_page?: number;
  page?: number; // Ajoutez cette ligne
}

@Injectable({
  providedIn: 'root'
})
export class GetpointageService {
  private apiUrl = `${environment.apiUrl}/pointages`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les présences avec filtres optionnels
   * @param params Paramètres de filtrage
   * @returns Observable<ApiResponse<Pointage[]>>
   */
  recupererPresences(params: PresenceParams): Observable<ApiResponse<Pointage[]>> {
    let httpParams = new HttpParams();

    // Ajout des paramètres selon le mode de filtrage
    if (params.date && params.periode) {
      httpParams = httpParams.set('date', params.date);
      httpParams = httpParams.set('periode', params.periode);
    } else if (params.date_debut && params.date_fin) {
      httpParams = httpParams.set('date_debut', params.date_debut);
      httpParams = httpParams.set('date_fin', params.date_fin);
    }

    // Paramètres optionnels
    Object.entries(params).forEach(([key, value]) => {
      if (value && !['date', 'periode', 'date_debut', 'date_fin'].includes(key)) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/presences/recuperer`, { params: httpParams });
  }

  /**
   * Récupérer tous les pointages avec filtres optionnels
   * @param filters Paramètres de filtrage
   * @returns Observable<ApiResponse<Pointage[]>>
   */
  getAllPointages(filters?: {
    date?: string;
    user_id?: string;
  }): Observable<ApiResponse<Pointage[]>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<ApiResponse<Pointage[]>>(this.apiUrl, { params });
  }

  /**
   * Récupérer les pointages du jour
   * @returns Observable<ApiResponse<Pointage[]>>
   */
  getPointagesJour(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/jour`);
  }

  /**
   * Récupérer les utilisateurs pointés
   * @returns Observable<ApiResponse<Pointage[]>>
   */
  getUtilisateursPointes(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/utilisateurs`);
  }

  /**
   * Récupérer l'historique des pointages avec filtres
   * @param params Paramètres de filtrage
   * @returns Observable<ApiResponse<Pointage[]>>
   */
  getHistorique(params: {
    debut: string;
    fin: string;
    user_id?: string;
    type?: 'retard' | 'absence';
  }): Observable<ApiResponse<Pointage[]>> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/historique`, { params: httpParams });
  }

  /**
   * Modifier un pointage
   * @param id ID du pointage
   * @param data Données à modifier
   * @returns Observable<ApiResponse<Pointage>>
   */
  modifierPointage(id: string, data: {
    premierPointage?: string;
    dernierPointage?: string;
    estPresent?: boolean;
    estRetard?: boolean;
  }): Observable<ApiResponse<Pointage>> {
    return this.http.put<ApiResponse<Pointage>>(`${this.apiUrl}/${id}`, data);
  }

/**
   * Enregistrer un nouveau congé
   * @param data Données du congé
   * @returns Observable<ApiResponse<any>>
   */
storeConges(data: {
  user_id: string;
  date_debut: string;
  date_fin: string;
  type_conge: string;
  motif: string;
}): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(`${this.apiUrl}/conges`, data);
}


}
