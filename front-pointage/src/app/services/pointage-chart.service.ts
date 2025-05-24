// src/app/services/pointage-chart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GraphiqueFilters {
  debut: string;
  fin: string;
  cohorte_id?: string;
  departement_id?: string;
  type?: 'apprenant' | 'employe';
}

export interface GraphiquePresenceData {
  status: boolean;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  };
}

export interface GraphiqueGlobaleData {
  status: boolean;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  stats: {
    total: number;
    presents_ponctuel: number;
    retards: number;
    absents: number;
    pourcentage_presence: number;
  };
}

export interface GraphiqueTopRevardsData {
  status: boolean;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class PointageChartService {

  private apiUrl = `${environment.apiUrl}/pointages`;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer les données pour le graphique des présences par jour
   */
  getGraphiquePresencesParJour(filters: GraphiqueFilters): Observable<GraphiquePresenceData> {
    let params = new HttpParams()
      .set('debut', filters.debut)
      .set('fin', filters.fin);

    if (filters.cohorte_id) {
      params = params.set('cohorte_id', filters.cohorte_id);
    }
    if (filters.departement_id) {
      params = params.set('departement_id', filters.departement_id);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<GraphiquePresenceData>(`${this.apiUrl}/graphique-presences-jour`, { params });
  }

  /**
   * Récupérer les données pour le graphique en secteurs (présence globale)
   */
  getGraphiquePresenceGlobale(filters: GraphiqueFilters): Observable<GraphiqueGlobaleData> {
    let params = new HttpParams()
      .set('debut', filters.debut)
      .set('fin', filters.fin);

    if (filters.cohorte_id) {
      params = params.set('cohorte_id', filters.cohorte_id);
    }
    if (filters.departement_id) {
      params = params.set('departement_id', filters.departement_id);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<GraphiqueGlobaleData>(`${this.apiUrl}/graphique-presence-globale`, { params });
  }

  /**
   * Récupérer les données pour le graphique des top retards
   */
  getGraphiqueTopRetards(filters: GraphiqueFilters & { limite?: number }): Observable<GraphiqueTopRevardsData> {
    let params = new HttpParams()
      .set('debut', filters.debut)
      .set('fin', filters.fin);

    if (filters.cohorte_id) {
      params = params.set('cohorte_id', filters.cohorte_id);
    }
    if (filters.departement_id) {
      params = params.set('departement_id', filters.departement_id);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.limite) {
      params = params.set('limite', filters.limite.toString());
    }

    return this.http.get<GraphiqueTopRevardsData>(`${this.apiUrl}/graphique-top-retards`, { params });
  }

  /**
   * Générer les dates pour une période donnée
   */
  generateDateRange(type: 'week' | 'month'): { debut: string; fin: string } {
    const today = new Date();
    let debut: Date;
    let fin: Date = new Date();

    if (type === 'week') {
      // Semaine actuelle (du lundi au dimanche)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le premier jour
      debut = new Date(today.setDate(diff));
      fin = new Date(debut);
      fin.setDate(debut.getDate() + 6);
    } else {
      // Mois actuel
      debut = new Date(today.getFullYear(), today.getMonth(), 1);
      fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return {
      debut: this.formatDate(debut),
      fin: this.formatDate(fin)
    };
  }

  /**
   * Formater une date au format YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}