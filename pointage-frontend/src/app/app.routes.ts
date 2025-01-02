import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { VigileDashboardComponent } from './vigile-dashboard/vigile-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'vigile-dashboard', component: VigileDashboardComponent },
  { path: '**', redirectTo: 'login' }, // Redirection par défaut
];
