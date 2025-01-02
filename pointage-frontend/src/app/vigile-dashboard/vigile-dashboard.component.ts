import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vigile-dashboard',
  templateUrl: './vigile-dashboard.component.html',
  styleUrls: ['./vigile-dashboard.component.css'],
})
export class VigileDashboardComponent {
  constructor(private router: Router) {}

  logout() {
    // Déconnexion et redirection vers la page de connexion
    this.router.navigate(['/login']);
  }
}
