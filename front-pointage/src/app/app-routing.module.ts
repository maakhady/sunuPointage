// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestComponent } from './theme/layouts/guest/guest.component';
import { AuthGuard } from './guards/auth.guard';  // Importer les gardien des routes
import { VigileGuard } from './guards/vigile.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },

      {
        path: 'dashboard/default',
        loadComponent: () => import('./demo/default/dashboard/dashboard.component').then((c) => c.DefaultComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'cohortes',
        loadComponent: () => import('./demo/cohortes/cohortes.component').then((c) => c.CohortesComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'cohortes/:id/apprenants',
        loadComponent: () => import('./demo/liste-apprenants/liste-apprenants.component').then((c) => c.ListeApprenantsComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'departements/:id/employes',
        loadComponent: () => import('./demo/liste-employes/liste-employes.component').then((c) => c.ListeEmployesComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'departements',
        loadComponent: () => import('./demo/departements/departements.component').then((c) => c.DepartementsComponent),
        canActivate: [AuthGuard]
      },
      // {
      //   path: 'historique',
      //   loadComponent: () => import('./demo/historique/historique.component').then((c) => c.HistoriqueComponent),
      //   canActivate: [AuthGuard]
      // },
      {
        path: 'pointage',
        loadComponent: () => import('./demo/pointage/pointage.component').then((c) => c.PointageComponent),
        canActivate: [AuthGuard]
      },
      // {
      //   path: 'typography',
      //   loadComponent: () => import('./demo/ui-component/typography/typography.component')
      // },

      {
        path: 'color',
        loadComponent: () => import('./demo/ui-component/ui-color/ui-color.component')
      },
      {
        path: 'sample-page/:id',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component')
      }
    ]


  },

  {
    path: 'typography',
    loadComponent: () => import('./demo/ui-component/typography/typography.component')
  },
  {
    path: 'dashboard-vigile',
    loadComponent: () => import('./demo/dashboard-vigile/dashboard-vigile.component')
      .then(m => m.DashboardVigileComponent),
      canActivate: [AuthGuard]
  },

  {
    path: '',
    component: GuestComponent,
    children: [

      {
        path: 'login',
        loadComponent: () => import('./demo/authentication/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./demo/authentication/register/register.component')
      },
      {
        path: 'forget-password',
        loadComponent: () => import('./demo/authentication/forget-password/forget-password.component')
          .then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./demo/authentication/reset-password/reset-password.component')
          .then(m => m.ResetPasswordComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
