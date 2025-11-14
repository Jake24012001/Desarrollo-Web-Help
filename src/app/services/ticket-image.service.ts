import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketImage } from '../../app/interface/TicketImage';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketImageService {
  // Servicio CRUD para imágenes de tickets
  private apiUrl = `${Environment.apiUrl}/ticket-image`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TicketImage[]> {
    return this.http.get<TicketImage[]>(this.apiUrl);
  }

  getById(id: number): Observable<TicketImage> {
    return this.http.get<TicketImage>(`${this.apiUrl}/${id}`);
  }

  create(image: TicketImage): Observable<TicketImage> {
    return this.http.post<TicketImage>(this.apiUrl, image);
  }

  update(id: number, image: TicketImage): Observable<TicketImage> {
    return this.http.put<TicketImage>(`${this.apiUrl}/${id}`, image);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getByTicketId(ticketId: number): Observable<TicketImage[]> {
    return this.http.get<TicketImage[]>(`${this.apiUrl}/ticket/${ticketId}`);
  }
}
