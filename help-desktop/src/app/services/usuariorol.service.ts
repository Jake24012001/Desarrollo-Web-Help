import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRol} from  '../../interface/UsuarioRol'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioRolService {
  private apiUrl = `${environment.apiUrl}/usuariorol`; // Ajusta la URL según tu backend

  constructor(private http: HttpClient) {}

  getAll(): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(this.apiUrl);
  }

  getById(idUsuario: number, idRol: number): Observable<UsuarioRol> {
  const url = `${this.apiUrl}/${idUsuario}/${idRol}`;
  return this.http.get<UsuarioRol>(url);
}
}