import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketPriority } from '../../app/interface/TicketPriority';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketPriorityService {
  // Servicio para CRUD de prioridades de ticket
  // Usamos inyección por constructor para mantener consistencia con otros servicios
  constructor(private http: HttpClient) {}
  private apiUrl = `${Environment.apiUrl}/ticketpriority`;

  getAll(): Observable<TicketPriority[]> {
    return this.http.get<TicketPriority[]>(this.apiUrl);
  }

  getById(id: number): Observable<TicketPriority> {
    return this.http.get<TicketPriority>(`${this.apiUrl}/${id}`);
  }

  create(priority: TicketPriority): Observable<TicketPriority> {
    return this.http.post<TicketPriority>(this.apiUrl, priority);
  }

  update(id: number, priority: TicketPriority): Observable<TicketPriority> {
    return this.http.put<TicketPriority>(`${this.apiUrl}/${id}`, priority);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}