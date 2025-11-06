import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRol} from  '../../app/interface/UsuarioRol'
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioRolService {
  // Servicio para mapeos usuario<->rol
  private apiUrl = `${Environment.apiUrl}/usuariorol`; // Ajusta la URL según tu backend

  constructor(private http: HttpClient) {}

  getAll(): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(this.apiUrl);
  }

  getById(idUsuario: number, idRol: number): Observable<UsuarioRol> {
  const url = `${this.apiUrl}/${idUsuario}/${idRol}`;
  return this.http.get<UsuarioRol>(url);
}
}