import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Rol } from '../../app/interface/Rol';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  // Servicio CRUD para roles
  private apiUrl = `${Environment.apiUrl}/rol`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.apiUrl);
  }

  getById(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.apiUrl}/${id}`);
  }

  create(rol: Rol): Observable<Rol> {
    return this.http.post<Rol>(this.apiUrl, rol);
  }

  update(id: number, rol: Rol): Observable<Rol> {
    return this.http.put<Rol>(`${this.apiUrl}/${id}`, rol);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
