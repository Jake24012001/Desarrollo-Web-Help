import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryUnit {
  id?: number;
  stock?: number;
  product?: {
    id?: number;
    name?: string;
    // otros campos del producto
  };
  municipalCode?: string;
  serial?: string;
  maxStock?: number;
  minStock?: number;
  status?: string;
  custodian?: {
    id_persona?: number;
    // otros campos de persona
  };
  urlImg?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EquipoService {
  private apiUrl = `${environment.apiUrl}/inventoryunit`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InventoryUnit[]> {
    return this.http.get<InventoryUnit[]>(this.apiUrl);
  }

  getById(id: number): Observable<InventoryUnit> {
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