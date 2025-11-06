import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Persona } from '../../app/interface/Persona';
import { Observable } from 'rxjs';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  
  private apiUrl = `${Environment.apiUrl}/persona`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  getById(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }
}