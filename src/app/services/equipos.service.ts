import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Environment } from '../../app/environments/environment';
import { InventoryUnit } from '../../app/interface/InventoryUnit';

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  // Servicio CRUD para equipos (InventoryUnit)
  // Métodos simples que llaman al backend en /inventoryunit
  private apiUrl = `${Environment.apiUrl}/inventoryunit`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<InventoryUnit[]> {
    return this.http.get<InventoryUnit[]>(this.apiUrl);
  }

  getById(id: number): Observable<InventoryUnit> {
    if (!id) throw new Error('ID inválido');
    return this.http.get<InventoryUnit>(`${this.apiUrl}/${id}`);
  }
  create(equipo: InventoryUnit): Observable<InventoryUnit> {
    return this.http.post<InventoryUnit>(this.apiUrl, equipo);
  }

  update(id: number, equipo: InventoryUnit): Observable<InventoryUnit> {
    return this.http.put<InventoryUnit>(`${this.apiUrl}/${id}`, equipo);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
