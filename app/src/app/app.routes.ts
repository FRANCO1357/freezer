import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { loggedInGuard } from './guards/logged-in.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loggedInGuard],
  },
  {
    path: 'area-riservata',
    loadComponent: () => import('./pages/area-riservata/area-riservata.component').then(m => m.AreaRiservataComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
