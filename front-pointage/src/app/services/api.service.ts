import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Cohorte } from '../demo/cohortes/cohorte.model';  // Assurez-vous que ce chemin est correct
import { Apprenant } from '../demo/liste-apprenants/ apprenant.model';

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

  
  getApprenantsByCohorte(cohorteId: string) {
    return this.http.get(`${this.apiUrl}/cohortes/${cohorteId}/apprenants`);
  }

    // Dans api.service.ts
    deleteApprenant(id: string): Observable<any> {
      return this.http.delete<any>(`${this.apiUrl}/utilisateurs/${id}`);
    }


    getUserById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/utilisateurs/${id}`);
    }
    


  importApprenants(cohorteId: string, formData: FormData): Observable<any> {
    return this.http.post<{ message: string; data: any }>(
      `${this.apiUrl}/cohortes/${cohorteId}/import-apprenants`,
      formData
    ).pipe(
      map(response => response.data)
    );
  }





}
