import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Cohorte } from '../demo/cohortes/cohorte.model';  // Assurez-vous que ce chemin est correct
import { Apprenant } from '../demo/liste-apprenants/ apprenant.model';
// import { Apprenant } from '../demo/liste-apprenants/apprenant.model'; 




//interface pour le pointage
export interface Pointage {
  id: string;
  user_id: string;
  date: Date;
  premierPointage_temp: Date;
  estRetard_temp: boolean;
  estPresent: boolean;
  estEnAttente: boolean;
  created_at: Date;
  updated_at: Date;
  utilisateur: Utilisateur;
}


export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  fonction: string;
  type: string;
  email: string;
  matricule: string;
  cardId: string;
  telephone: string;
  statut: string;
}






@Injectable({
  providedIn: 'root'
})
export class ApiService {

  getEmployesByDepartement(departementId: string) {
    throw new Error('Method not implemented.');
  }

  private apiUrl = 'http://127.0.0.1:8000/api';  // URL de votre endpoint Laravel

  constructor(private http: HttpClient) { }

    // Récupérer toutes les cohortes
    getCohortes(): Observable<Cohorte[]> {
      return this.http.get<{ message: string; data: Cohorte[] }>(`${this.apiUrl}/cohortes`)
        .pipe(
          map(response => response.data) // Transforme ici pour retourner directement un tableau
        );
    }

    // Récupérer une cohorte par son ID
    getCohorteById(id: string): Observable<Cohorte> {
      return this.http.get<{ message: string; data: Cohorte }>(`${this.apiUrl}/cohortes/${id}`)
        .pipe(
          map(response => response.data)
        );
    }

    // Créer une nouvelle cohorte
    createCohorte(cohorte: Cohorte): Observable<Cohorte> {
      return this.http.post<{ message: string; data: Cohorte }>(`${this.apiUrl}/cohortes`, cohorte)
        .pipe(
          map(response => response.data)
        );
    }


    // Mettre à jour une cohorte existante
    updateCohorte(id: string, cohorte: Cohorte): Observable<Cohorte> {
      return this.http.put<{ message: string; data: Cohorte }>(`${this.apiUrl}/cohortes/${id}`, cohorte)
        .pipe(
          map(response => response.data)
        );
    }



      // Supprimer une cohorte
    deleteCohorte(id: string): Observable<void> {
      return this.http.delete<{ message: string }>(`${this.apiUrl}/cohortes/${id}`)
        .pipe(
          map(() => null) // Retourne null car aucune donnée n'est attendue
        );
    }



    /******************************************Apprenant************************************************** */



    getApprenantsByCohorte(cohorteId: string) {
      return this.http.get(`${this.apiUrl}/cohortes/${cohorteId}/apprenants`);
    }


    createApprenant(formData: FormData): Observable<any> {
      return this.http.post(`${this.apiUrl}/utilisateurs/creerUser`, formData);

    }


    // Méthode classique pour update sans photo (JSON)
updateApprenant(id: string, apprenantData: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/utilisateurs/${id}`, apprenantData, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).pipe(
    map((response: any) => response.data)
  );
}

// ✅ NOUVELLE MÉTHODE pour FormData (avec photo)
updateApprenantWithFormData(id: string, formData: FormData): Observable<any> {
  return this.http.put(`${this.apiUrl}/utilisateurs/${id}`, formData).pipe(
    map((response: any) => response.data)
  );
  
  // Note: Pas de headers Content-Type pour FormData, le navigateur le gère automatiquement
}

// ✅ MÉTHODE CORRIGÉE pour contourner le problème Laravel avec PUT + FormData
updateApprenantWithPhoto(id: string, formData: FormData): Observable<any> {
  // 🔧 Utiliser POST avec _method=PUT pour contourner le problème Laravel
  return this.http.post(`${this.apiUrl}/utilisateurs/${id}`, formData).pipe(
    map((response: any) => response.data)
  );
}

    // Dans api.service.ts
    deleteApprenant(id: string): Observable<any> {
      return this.http.delete<any>(`${this.apiUrl}/utilisateurs/${id}`);
    }



    getUserById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/utilisateurs/${id}`);
    }


    importApprenants(cohorteId: string, formData: FormData) {
      return this.http.post(`${this.apiUrl}/utilisateurs/import/cohorte/${cohorteId}`, formData);
    }

    // Dans ApiService

    getApprenantsCount(): Observable<number> {
      return this.http.get<{ count: number }>(`${this.apiUrl}/count-apprenants`)
        .pipe(
          map(response => response.count)  // On extrait le nombre total
        );
    }


    toggleStatus(id: string): Observable<any> {
      return this.http.put(`${this.apiUrl}/utilisateurs/${id}/toggle-status`, {});
    }


    assignCard(id: string, cardId: string): Observable<any> {
      const url = `${this.apiUrl}/utilisateurs/${id}/assign-card`;
      return this.http.post(url, { cardId });
    }


/****************************************Pointage*********************************************** */



 // Récupérer tous les pointages
 getPointages(): Observable<Pointage[]> {
  return this.http.get<{ message: string; data: Pointage[] }>(`${this.apiUrl}/pointages`)
    .pipe(
      map(response => {
        // Conversion des chaînes de dates en objets Date
        return response.data.map(pointage => ({
          ...pointage,
          date: new Date(pointage.date),
          premierPointage_temp: new Date(pointage.premierPointage_temp),
          updated_at: new Date(pointage.updated_at),
          created_at: new Date(pointage.created_at)
        }));
      })
    );
}



// Récupérer les pointages par utilisateur
getPointagesByUser(userId: string): Observable<Pointage[]> {
  return this.http.get<{ message: string; data: Pointage[] }>(`${this.apiUrl}/pointages`, {
    params: { user_id: userId }
  }).pipe(
    map(response => {
      return response.data.map(pointage => ({
        ...pointage,
        date: new Date(pointage.date),
        premierPointage_temp: new Date(pointage.premierPointage_temp),
        updated_at: new Date(pointage.updated_at),
        created_at: new Date(pointage.created_at)
      }));
    })
  );
}

// Récupérer les pointages par date
getPointagesByDate(date: Date): Observable<Pointage[]> {
  return this.http.get<{ message: string; data: Pointage[] }>(`${this.apiUrl}/pointages`, {
    params: {
      date: date.toISOString()
    }
  }).pipe(
    map(response => {
      return response.data.map(pointage => ({
        ...pointage,
        date: new Date(pointage.date),
        premierPointage_temp: new Date(pointage.premierPointage_temp),
        updated_at: new Date(pointage.updated_at),
        created_at: new Date(pointage.created_at)
      }));
    })
  );
}



}
