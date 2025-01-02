import { Injectable, ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, first, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/utilisateurs/card';

  constructor(
    private http: HttpClient,
    private router: Router,
    private appRef: ApplicationRef
  ) {
    this.appRef.isStable
      .pipe(first((isStable) => isStable))
      .subscribe(() => {
        console.log('Angular est stable, service AuthService prêt.');
      });
  }

  loginWithCard(cardId: string) {
    return this.http.post<any>(this.apiUrl, { cardId }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la connexion avec la carte:', error);
        return throwError(() => new Error('Erreur de connexion'));
      })
    );
  }

  // Gère la réponse après la connexion réussie
  handleLoginResponse(response: any) {
    if (response.status) {
      localStorage.setItem('token', response.token); // Stockage du token dans localStorage
      this.redirectUser(response.user.fonction); // Redirection en fonction de la fonction de l'utilisateur
    } else {
      console.error('Carte non autorisée');
    }
  }

  // Redirection basée sur la fonction de l'utilisateur
  redirectUser(fonction: string) {
    if (fonction === 'DG') {
      this.router.navigate(['/admin-dashboard']);
    } else if (fonction === 'Vigile') {
      this.router.navigate(['/vigile-dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Méthode pour récupérer le token JWT et l'ajouter aux en-têtes des requêtes
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}
