import { Injectable, ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, of, catchError, first, throwError, Observable } from 'rxjs';
import { ApiResponse, VigileInfo } from 'src/app/demo/pointage/pointage.interface';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private cardLoginUrl = `${this.apiUrl}/utilisateurs/card`;
  private forgotPasswordUrl = `${this.apiUrl}/forgot-password`;
  private resetPasswordUrl = `${this.apiUrl}/reset-password`;



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
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(this.resetPasswordUrl, {
      token,
      password,
      password_confirmation: password
    }).pipe(
      catchError((error) => {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        return throwError(() => error);
      })
    );
  }

  loginWithCard(cardId: string): Observable<any> {
    return this.http.post<any>(this.cardLoginUrl, { cardId }).pipe(
      map(response => {
        if (response.status) {
          this.handleLoginResponse(response);
        }
        return response;
      }),
      catchError(error => {
        let errorMessage = 'Erreur de connexion';
        if (error.status === 401) {
          errorMessage = error.error.message || 'Carte non autorisée';
        }
        return throwError(() => ({ message: errorMessage, status: error.status }));
      })
    );
  }

  // Nouvelle méthode pour le mot de passe oublié
  sendPasswordResetLink(email: string): Observable<any> {
    return this.http.post<any>(this.forgotPasswordUrl, { email }).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'envoi du lien de réinitialisation:', error);
        return throwError(() => error);
      })
    );
  }

  // Gère la réponse après la connexion réussie
  handleLoginResponse(response: any) {
    if (response.status) {
      // Sauvegarder d'abord le token et les données
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data));

      // Vérifier directement la fonction depuis les données de réponse
      if (response.data.fonction === 'Vigile') {
        console.log('Vigile détecté depuis la réponse');
        localStorage.setItem('vigile_id', response.data.id);
        this.router.navigate(['/dashboard-vigile']);
      } else if (response.data.fonction === 'DG') {
        console.log('DG détecté depuis la réponse');
        this.router.navigate(['/dashboard/default']);
      } else {
        console.error('Fonction non reconnue:', response.data.fonction);
        this.router.navigate(['/login']);
      }
    }
  }
  // Redirection basée sur la fonction de l'utilisateur
  redirectUser(fonction: string) {
    if (fonction === 'DG') {
      this.router.navigate(['/dashboard/default']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Méthode pour récupérer le token JWT et l'ajouter aux en-têtes des requêtes
  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  isVigile(): Observable<{ isVigile: boolean; vigileId?: string }> {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      return of({ isVigile: false });
    }

    try {
      const user = JSON.parse(userData);
      const vigileInfo = {
        isVigile: user.fonction === 'Vigile',
        vigileId: user.id
      };

      if (vigileInfo.isVigile && vigileInfo.vigileId) {
        localStorage.setItem('vigile_id', vigileInfo.vigileId);
      }

      console.log('Vérification vigile depuis localStorage:', vigileInfo);
      return of(vigileInfo);
    } catch (error) {
      console.error('Erreur parsing user_data:', error);
      return of({ isVigile: false });
    }
  }
}

