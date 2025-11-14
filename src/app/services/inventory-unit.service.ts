import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryUnit } from '../../app/interface/InventoryUnit';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryUnitService {
  // Servicio CRUD para unidades de inventario
  private apiUrl = `${Environment.apiUrl}/inventoryunit`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InventoryUnit[]> {
    return this.http.get<InventoryUnit[]>(this.apiUrl);
  }

  getById(id: number): Observable<InventoryUnit> {
    return this.http.get<InventoryUnit>(`${this.apiUrl}/${id}`);
  }

  create(unit: InventoryUnit): Observable<InventoryUnit> {
    return this.http.post<InventoryUnit>(this.apiUrl, unit);
  }

  update(id: number, unit: InventoryUnit): Observable<InventoryUnit> {
    return this.http.put<InventoryUnit>(`${this.apiUrl}/${id}`, unit);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
