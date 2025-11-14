import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Environment } from '../../app/environments/environment';
import { LoginRequest, LoginResponse, AuthResponse } from '../../app/interface/Auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${Environment.apiUrl}/usuario`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Envía las credenciales al backend y retorna la respuesta tipada como `LoginResponse`.
   */
  login(email: string, clave: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, clave };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  saveUser(user: LoginResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  private getUserFromStorage(): LoginResponse | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
}
