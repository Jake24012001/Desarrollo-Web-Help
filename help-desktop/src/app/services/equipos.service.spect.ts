import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Environment } from '../../environments/environment';

export interface Equipo {
  id?: number;
  nombre: string;
  descripcion?: string;
  // Agrega otros campos según tu modelo backend
}

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private apiUrl = `${Environment.apiUrl}/equipo`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(this.apiUrl);
  }

  getById(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  create(equipo: Equipo): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, equipo);
  }

  update(id: number, equipo: Equipo): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, equipo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}