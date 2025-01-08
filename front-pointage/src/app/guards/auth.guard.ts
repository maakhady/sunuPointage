import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';



@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService,private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    if (token) {
      return true; // L'utilisateur est connecté
    } else {
      this.router.navigate(['/login']); // Redirection vers la page de connexion
      return false; // Accès refusé
    }
  }
}
