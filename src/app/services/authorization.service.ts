import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { LoginResponse } from '../interface/Auth';

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  CLIENTE = 'CLIENTE'
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  constructor(private authService: AuthService) {}

  /**
   * Obtiene los roles del usuario actual
   */
  getUserRoles(): string[] {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles || [];
    return roles;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * Comparación insensible a mayúsculas/minúsculas
   */
  hasRole(role: string): boolean {
    const userRoles = this.getUserRoles();
    const normalizedRoles = userRoles.map(r => r.toUpperCase());
    const normalizedRole = role.toUpperCase();
    
    // Si el array de roles está vacío, el backend puede no haber incluido roles en la respuesta
    if (userRoles.length === 0) {
      // Mantener esta advertencia, es importante para el diagnóstico
      console.warn('⚠️ Usuario autenticado pero sin roles en la respuesta del backend');
    }
    
    return normalizedRoles.includes(normalizedRole);
  }

  /**
   * Verifica si el usuario es ADMIN
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  /**
   * Verifica si el usuario es AGENTE
   */
  isAgente(): boolean {
    return this.hasRole(UserRole.AGENTE);
  }

  /**
   * Verifica si el usuario es CLIENTE
   */
  isCliente(): boolean {
    return this.hasRole(UserRole.CLIENTE);
  }

  /**
   * Obtiene el rol principal del usuario (por prioridad: ADMIN > AGENTE > CLIENTE)
   */
  getPrimaryRole(): UserRole | null {
    if (this.isAdmin()) return UserRole.ADMIN;
    if (this.isAgente()) return UserRole.AGENTE;
    if (this.isCliente()) return UserRole.CLIENTE;
    return null;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): LoginResponse | null {
    return this.authService.getCurrentUser();
  }
}
