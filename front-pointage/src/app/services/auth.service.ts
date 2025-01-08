import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrlLogin = 'http://localhost:8000/api/utilisateurs/login'; // URL de votre API de connexion
  private apiUrlLogout = 'http://localhost:8000/api/utilisateurs/logout'; // URL de votre API de déconnexion
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public currentUser: Observable<any> = this.currentUserSubject.asObservable();
  public tokenChanged = new EventEmitter<string>();

  constructor(private http: HttpClient) {}

  // Connexion
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(this.apiUrlLogin, credentials).pipe(
      tap((response: any) => {
        console.log('Connexion réussie, token reçu:', response.access_token);
        // Stocker le token et le rôle dans localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('role', response.data.role); // Supposons que l'API renvoie un rôle
        this.currentUserSubject.next(response.data); // Mettre à jour l'état actuel de l'utilisateur
        this.tokenChanged.emit(response.access_token);
      }),
      catchError((error) => {
        console.error('Erreur de connexion:', error);
        throw error; // Propager l'erreur pour que l'appelant puisse la gérer
      })
    );
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Vérifier si l'utilisateur est un administrateur
  isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }

  // Déconnexion
  logout(): Observable<any> {
    return this.http.post(this.apiUrlLogout, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        // Émettre null avant de vider le localStorage
        this.tokenChanged.emit(null);
        // Supprimer les données du localStorage et mettre à jour l'état
        localStorage.clear();
        this.currentUserSubject.next(null);
      }),
      catchError((error) => {
        console.error('Erreur de déconnexion:', error);
        throw error;
      })
    );
  }

  // Ajouter un en-tête d'authentification pour les requêtes sécurisées
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('Token d\'authentification non trouvé');
    }
    console.log('Token utilisé pour les en-têtes:', token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
