import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../../app/interface/Usuario';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  // Servicio CRUD para usuarios
  private apiUrl = `${Environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  create(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  update(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // NOTE: previously there was a local cache `usuarios` and `getUsuarios()` which
  // were not used. Keeping the service lean: if you need a client-side cache,
  // implement it explícitamente con BehaviorSubject y métodos públicos.
}