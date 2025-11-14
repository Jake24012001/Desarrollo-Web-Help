import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketComment } from '../../app/interface/TicketComment';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketCommentService {
  // Servicio CRUD para comentarios de tickets
  private apiUrl = `${Environment.apiUrl}/ticket-comment`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TicketComment[]> {
    return this.http.get<TicketComment[]>(this.apiUrl);
  }

  getById(id: number): Observable<TicketComment> {
    return this.http.get<TicketComment>(`${this.apiUrl}/${id}`);
  }

  create(comment: TicketComment): Observable<TicketComment> {
    return this.http.post<TicketComment>(this.apiUrl, comment);
  }

  update(id: number, comment: TicketComment): Observable<TicketComment> {
    return this.http.put<TicketComment>(`${this.apiUrl}/${id}`, comment);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getByTicketId(ticketId: number): Observable<TicketComment[]> {
    return this.http.get<TicketComment[]>(`${this.apiUrl}/ticket/${ticketId}`);
  }
}
