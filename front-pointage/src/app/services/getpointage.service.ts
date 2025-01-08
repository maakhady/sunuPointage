import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Interfaces
export interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  type: string;
  departement?: {
    nom: string;
  };
  cohorte?: {
    nom: string;
  };
}

export interface Pointage {
  _id: string;
  user_id: string;
  cardId: string;
  date: string;
  estPresent: boolean;
  estRetard: boolean;
  estEnAttente: boolean;
  premierPointage: string | null;
  dernierPointage: string | null;
  utilisateur: Utilisateur;
  vigile?: Utilisateur;
}

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
  statistiques?: {
    total_utilisateurs: number;
    presents: number;
    absents: number;
    retards: number;
    pourcentage_presence: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GetpointageService {
  private apiUrl = `${environment.apiUrl}/pointages`;

  constructor(private http: HttpClient) {}

  // Récupérer la liste complète des pointages avec filtres
  getAllPointages(filters?: {
    date?: string;
    user_id?: string
  }): Observable<ApiResponse<Pointage[]>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.date) params = params.set('date', filters.date);
      if (filters.user_id) params = params.set('user_id', filters.user_id);
    }

    return this.http.get<ApiResponse<Pointage[]>>(this.apiUrl, { params });
  }

  // Récupérer les pointages du jour
  getPointagesJour(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/jour`);
  }

  // Récupérer les utilisateurs pointés
  getUtilisateursPointes(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/utilisateurs`);
  }

  // Récupérer les présences avec filtres
  recupererPresences(params: {
    date: string;
    periode: 'journee' | 'semaine' | 'mois';
    cohorte_id?: string;
    departement_id?: string;
    statut_presence?: 'present' | 'absent' | 'retard';
    type?: 'apprenant' | 'employe';
  }): Observable<ApiResponse<Pointage[]>> {
    return this.http.post<ApiResponse<Pointage[]>>(`${this.apiUrl}/presences/recuperer`, params);
  }

  // Filtrer les présences
  filtrerPresences(params: {
    date_debut: string;
    date_fin: string;
    cohorte_id?: string;
    departement_id?: string;
    statut_presence?: 'present' | 'absent' | 'retard';
    type?: 'apprenant' | 'employe';
  }): Observable<ApiResponse<Pointage[]>> {
    return this.http.post<ApiResponse<Pointage[]>>(`${this.apiUrl}/presences/filtrer`, params);
  }

  // Historique des pointages
  getHistorique(params: {
    debut: string;
    fin: string;
    user_id?: string;
    type?: 'retard' | 'absence';
  }): Observable<ApiResponse<Pointage[]>> {
    const httpParams = new HttpParams({ fromObject: { ...params } });
    return this.http.get<ApiResponse<Pointage[]>>(`${this.apiUrl}/historique`, { params: httpParams });
  }





  // Modifier un pointage
  modifierPointage(id: string, data: {
    premierPointage?: string;
    dernierPointage?: string;
    estPresent?: boolean;
    estRetard?: boolean;
  }): Observable<ApiResponse<Pointage>> {
    return this.http.put<ApiResponse<Pointage>>(`${this.apiUrl}/${id}`, data);
  }


}
