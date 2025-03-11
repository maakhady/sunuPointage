import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Departement } from '../demo/departements/departement.model';

@Injectable({
  providedIn: 'root'
})
export class DepartementService {

  private apiUrl = 'http://127.0.0.1:8000/api';  // URL de votre endpoint Laravel

  constructor(private http: HttpClient) { }

  // Récupérer tous les départements
  getDepartements(): Observable<Departement[]> {
    return this.http.get<{ message: string; data: Departement[] }>(`${this.apiUrl}/departements`)
      .pipe(
        map(response => response.data) // Transforme ici pour retourner directement un tableau
      );
  }

  // Récupérer un département par son ID
  getDepartementById(id: string): Observable<Departement> {
    return this.http.get<{ message: string; data: Departement }>(`${this.apiUrl}/departements/${id}`)
      .pipe(
        map(response => response.data)
      );
  }

  // Créer un nouveau département
  createDepartement(departement: Departement): Observable<Departement> {
    return this.http.post<{ message: string; data: Departement }>(`${this.apiUrl}/departements`, departement)
      .pipe(
        map(response => response.data)
      );
  }

  // Mettre à jour un département existant
  updateDepartement(id: string, departement: Departement): Observable<Departement> {
    return this.http.put<{ message: string; data: Departement }>(`${this.apiUrl}/departements/${id}`, departement)
      .pipe(
        map(response => response.data)
      );
  }

  getEmployesByDepartement(departementId: string): Observable<any> {
    // Changement de la route pour utiliser 'departements' au lieu de juste l'ID
    return this.http.get<any>(`${this.apiUrl}/${departementId}/employes`);
  }

  getApprenantsByCohorte(cohorteId: string) {
    return this.http.get(`${this.apiUrl}/cohortes/${cohorteId}/apprenants`);
  }

  // Dans departement.service.ts
deleteEmploye(id: string): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/utilisateurs/${id}`);
}


// Dans departement.service.ts
updateEmploye(id: string, formData: FormData): Observable<any> {
  return this.http.put<{ message: string; data: any }>(`${this.apiUrl}/utilisateurs/${id}`, formData)
    .pipe(
      map(response => response.data)
    );
}



getUserById(id: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/utilisateurs/${id}`);
}

importEmployes(departementId: string, formData: FormData) {
  return this.http.post(`${this.apiUrl}/utilisateurs/import/departement/${departementId}`, formData);
}


 createEmploye(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/utilisateurs/creerUser`, formData);
  }



  // Supprimer un département
  deleteDepartement(id: string): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/departements/${id}`)
      .pipe(
        map(() => null) // Retourne null car aucune donnée n'est attendue
      );
  }



   // méthode pour obtenir le nombre d'employés
 

getEmployesCount(): Observable<number> {
  return this.http.get<{ count: number }>(`${this.apiUrl}/count-employes`)
    .pipe(
      map(response => response.count)  // On extrait le nombre d'employés
    );
}




toggleStatus(id: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/utilisateurs/${id}/toggle-status`, {});
}


assignCard(id: string, cardId: string): Observable<any> {
  const url = `${this.apiUrl}/utilisateurs/${id}/assign-card`;
  return this.http.post(url, { cardId });
}



  
}
