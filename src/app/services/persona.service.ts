import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Persona } from '../../app/interface/Persona';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PersonaService {
  // Servicio CRUD para personas
  private apiUrl = `${Environment.apiUrl}/persona`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  getById(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }

  create(persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, persona);
  }

  update(id: number, persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${id}`, persona);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
