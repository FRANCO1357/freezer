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
    loadComponent: () => import('./pages/area-riservata/area-riservata-layout.component').then(m => m.AreaRiservataLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'freezers', pathMatch: 'full' },
      { path: 'freezers', loadComponent: () => import('./pages/freezers-list/freezers-list.component').then(m => m.FreezersListComponent) },
      { path: 'freezers/:id', loadComponent: () => import('./pages/freezer-detail/freezer-detail.component').then(m => m.FreezerDetailComponent) },
      { path: 'tutti-i-prodotti', loadComponent: () => import('./pages/all-products/all-products.component').then(m => m.AllProductsComponent) },
      { path: 'prodotto/nuovo', loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
      { path: 'prodotto/:id/visualizza', loadComponent: () => import('./pages/product-view/product-view.component').then(m => m.ProductViewComponent) },
      { path: 'prodotto/:id', loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent) },
      { path: 'storico', loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
