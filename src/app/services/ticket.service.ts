import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ticket } from '../../app/interface/Ticket';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  // Servicio principal para tickets: listar, obtener, crear, actualizar y eliminar
  private apiUrl = `${Environment.apiUrl}/ticket`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  create(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  update(id: number, ticket: Ticket): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Actualizar calificación de un ticket
  actualizarCalificacion(id: number, puntuacion: number, comentario: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}/calificacion`, {
      puntuacion,
      comentario_calificacion: comentario
    });
  }

  createFromPeticion(ticketData: {
    title: string;
    descripcion: string;
    usuarioCreadorId: number;
    usuarioAsignadoId: number;
    equipoAfectadoId: number;
    statusId?: number;
    priorityId?: number;
  }): Observable<Ticket> {
    const ticket: Ticket = {
      title: ticketData.title,
      descripcion: ticketData.descripcion,
      status: {
        id_status: ticketData.statusId || 1 // Por defecto "Pendiente"
      },
      priority: {
        id_priority: ticketData.priorityId || 2 // Por defecto "Media"
      },
      usuario_creador: {
        id_usuario: ticketData.usuarioCreadorId
      },
      usuario_asignado: {
        id_usuario: ticketData.usuarioAsignadoId
      },
      equipoAfectado: {
        id: ticketData.equipoAfectadoId
      }
    };

    return this.create(ticket);
  }
}