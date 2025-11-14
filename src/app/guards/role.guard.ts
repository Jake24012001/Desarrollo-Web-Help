import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthorizationService } from '../services/authorization.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuardService {
  constructor(
    private authService: AuthService,
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Si la ruta requiere roles específicos
    if (route.data['roles']) {
      const requiredRoles = route.data['roles'] as string[];
      const userRoles = this.authorizationService.getUserRoles();

      // Verificar si el usuario tiene al menos uno de los roles requeridos
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        // Redirigir a una página de acceso denegado o dashboard
        this.router.navigate(['/help-menu']);
        return false;
      }
    }

    return true;
  }
}

/**
 * Función guard para proteger rutas basadas en roles
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const authorizationService = inject(AuthorizationService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Si la ruta requiere roles específicos
  if (route.data['roles']) {
    const requiredRoles = route.data['roles'] as string[];
    const userRoles = authorizationService.getUserRoles();

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Redirigir a una página de acceso denegado o dashboard
      router.navigate(['/help-menu']);
      return false;
    }
  }

  return true;
};
