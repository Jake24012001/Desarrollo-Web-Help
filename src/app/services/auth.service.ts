import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Environment } from '../environments/environment';
import { Usuario } from '../interface/Usuario';

export interface LoginRequest {
  cedula: string;
  clave: string;
}

export interface LoginResponse {
  usuario: Usuario;
  rol: string; // 'ADMIN' o 'CLIENTE'
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${Environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    // Restaurar sesión desde localStorage si existe
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  /**
   * Actualizar usuario manualmente (para login local)
   */
  setCurrentUser(user: LoginResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Login del usuario
   */
  login(cedula: string, clave: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { cedula, clave }).pipe(
      tap((response) => {
        // Guardar en localStorage y BehaviorSubject
        localStorage.setItem('currentUser', JSON.stringify(response));
        this.currentUserSubject.next(response);
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Verificar si es admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'ADMIN' || user?.rol === 'Administrador';
  }

  /**
   * Verificar si es cliente
   */
  isClient(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'CLIENTE' || user?.rol === 'Cliente';
  }

  /**
   * Obtener cédula del usuario actual
   */
  getCurrentUserCedula(): string | undefined {
    return this.getCurrentUser()?.usuario?.cedula;
  }

  /**
   * Obtener ID del usuario actual
   */
  getCurrentUserId(): number | undefined {
    return this.getCurrentUser()?.usuario?.idUsuario;
  }
}
