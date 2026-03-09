import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Usato sulla route /login: se l'utente ha già il token in storage (è loggato),
 * lo reindirizza all'area riservata invece di mostrare il form di login.
 */
export const loggedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return router.createUrlTree(['/area-riservata']);
  }
  return true;
};
