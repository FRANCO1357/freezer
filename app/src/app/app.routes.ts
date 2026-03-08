import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'area-riservata',
    loadComponent: () => import('./pages/area-riservata/area-riservata.component').then(m => m.AreaRiservataComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
