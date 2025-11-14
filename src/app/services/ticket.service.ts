import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ticket } from '../../app/interface/Ticket';
import { Environment } from '../../app/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  /**
   * Servicio principal para tickets: listar, obtener, crear, actualizar y eliminar.
   * Este servicio envuelve las llamadas HTTP al backend y no realiza transformaciones
   * complejas: la validación y normalización deben ser gestionadas por el backend.
   */
  private apiUrl = `${Environment.apiUrl}/ticket`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los tickets.
   * Devuelve un Observable con el array de tickets crudo tal como lo retorna la API.
   */
  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  /**
   * Obtiene un ticket por su id.
   * @param id Identificador numérico del ticket
   */
  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo ticket. Se espera que el payload siga el contrato del backend
   * (idealmente DTO que contenga solo ids para relaciones en lugar de entidades completas).
   */
  create(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  /**
   * Actualiza un ticket existente.
   * @param id Id del ticket a actualizar
   * @param ticket Objeto con los campos a actualizar
   */
  update(id: number, ticket: Ticket): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket);
  }

  /**
   * Elimina un ticket por id.
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
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

    // Utiliza el endpoint create para persistir el ticket. Este helper facilita
    // la construcción del payload a partir de ids (recomendado sobre enviar entidades).
    return this.create(ticket);
  }
}