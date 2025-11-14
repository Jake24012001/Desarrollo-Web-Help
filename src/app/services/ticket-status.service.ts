import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketStatus } from '../../app/interface/TicketStatus';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketStatusService {
  // Servicio CRUD para estados de tickets
  private apiUrl = `${Environment.apiUrl}/ticketstatus`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TicketStatus[]> {
    return this.http.get<TicketStatus[]>(this.apiUrl);
  }

  getById(id: number): Observable<TicketStatus> {
    return this.http.get<TicketStatus>(`${this.apiUrl}/${id}`);
  }

  create(status: TicketStatus): Observable<TicketStatus> {
    return this.http.post<TicketStatus>(this.apiUrl, status);
  }

  update(id: number, status: TicketStatus): Observable<TicketStatus> {
    return this.http.put<TicketStatus>(`${this.apiUrl}/${id}`, status);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
