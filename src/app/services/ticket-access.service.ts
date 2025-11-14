import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import { Ticket } from '../interface/Ticket';
import { Environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketAccessService {

  /**
   * Servicio encargado de centralizar las reglas de visibilidad y permisos
   * sobre tickets en el frontend. No sustituye las comprobaciones en el backend,
   * que siempre deben aplicarse por seguridad.
   */

  constructor(
    private authService: AuthService,
    private authorizationService: AuthorizationService
  ) {}

  /**
   * Extrae el ID del usuario creador de un ticket, soportando múltiples formatos
   */
  private getUsuarioCreadorId(ticket: Ticket): number | undefined {
    return ticket.usuario_creador?.idUsuario ?? ticket.usuario_creador?.id_usuario;
  }

  /**
   * Extrae el ID del usuario asignado de un ticket, soportando múltiples formatos
   */
  private getUsuarioAsignadoId(ticket: Ticket): number | undefined {
    return ticket.usuario_asignado?.idUsuario ?? ticket.usuario_asignado?.id_usuario;
  }

  /**
   * Obtiene los tickets según el rol del usuario
   * Incluye fallback defensivo si los roles no están disponibles en el backend
   */
  getTicketsForUser(allTickets: Ticket[]): Ticket[] {
    const user = this.authService.getCurrentUser();
    const isAdmin = this.authorizationService.isAdmin();
    const isAgente = this.authorizationService.isAgente();
    const isCliente = this.authorizationService.isCliente();
    
    if (!user) {
      return [];
    }

    // ADMIN: ve todos los tickets
    if (isAdmin) {
      return allTickets;
    }

    // AGENTE: ve tickets asignados a él + tickets que creó
    if (isAgente) {
      const filtered = allTickets.filter(ticket => {
        const asignadoId = this.getUsuarioAsignadoId(ticket);
        const creadorId = this.getUsuarioCreadorId(ticket);
        const isAssigned = asignadoId === user.idUsuario;
        const isCreator = creadorId === user.idUsuario;
        return isAssigned || isCreator;
      });
      return filtered;
    }

    // CLIENTE: ve solo sus propios tickets
    if (isCliente) {
      const filtered = allTickets.filter(ticket => {
        const ticketCreadorId = this.getUsuarioCreadorId(ticket);
        const match = ticketCreadorId === user.idUsuario;
        if (!match) {
        }
        return match;
      });
      return filtered;
    }

    // FALLBACK: Si no hay rol definido pero usuario está autenticado
    console.warn('⚠️ Usuario autenticado pero sin rol definido. Aplicando fallback...');
    console.log('  Usuario ID:', user.idUsuario, '(tipo:', typeof user.idUsuario + ')');
    console.log('  Total tickets a filtrar:', allTickets.length);
    
    // Mostrar primeros 3 tickets con sus creadores
    allTickets.slice(0, 3).forEach((ticket, idx) => {
      const creadorId = this.getUsuarioCreadorId(ticket);
    });
    
    const fallbackFiltered = allTickets.filter(ticket => {
      const ticketCreadorId = this.getUsuarioCreadorId(ticket);
      const match = ticketCreadorId === user.idUsuario;
      
      if (!match) {
      }
      return match;
    });
    return fallbackFiltered;
  }

  /**
   * Verifica si el usuario puede ver un ticket específico
   */
  canViewTicket(ticket: Ticket): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // ADMIN puede ver todos
    if (this.authorizationService.isAdmin()) {
      return true;
    }

    // AGENTE ve tickets asignados a él + los que creó
    if (this.authorizationService.isAgente()) {
      const asignadoId = this.getUsuarioAsignadoId(ticket);
      const creadorId = this.getUsuarioCreadorId(ticket);
      return asignadoId === user.idUsuario || creadorId === user.idUsuario;
    }

    // CLIENTE ve solo los suyos
    if (this.authorizationService.isCliente()) {
      return this.getUsuarioCreadorId(ticket) === user.idUsuario;
    }

    return false;
  }

  /**
   * Verifica si el usuario puede editar un ticket
   */
  canEditTicket(ticket: Ticket): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Solo ADMIN puede editar
    return this.authorizationService.isAdmin();
  }

  /**
   * Verifica si el usuario puede eliminar un ticket
   */
  canDeleteTicket(ticket: Ticket): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // Solo ADMIN puede eliminar
    return this.authorizationService.isAdmin();
  }

  /**
   * Verifica si el usuario puede resolver un ticket
   */
  canResolveTicket(ticket: Ticket): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    // ADMIN puede resolver cualquiera
    if (this.authorizationService.isAdmin()) {
      return true;
    }

    // AGENTE puede resolver solo si está asignado
    if (this.authorizationService.isAgente()) {
      return this.getUsuarioAsignadoId(ticket) === user.idUsuario;
    }

    // CLIENTE NO puede resolver
    return false;
  }

  /**
   * Verifica si el usuario puede crear un ticket
   */
  canCreateTicket(): boolean {
    // ADMIN y AGENTE y CLIENTE pueden crear tickets
    return this.authorizationService.isAuthenticated();
  }

  /**
   * Obtiene el agente con menos carga (menos tickets asignados)
   */
  getAgenteConMenosCarga(allTickets: Ticket[]): any {
    // Este método se llamaría desde el backend
    // Aquí es solo referencia
    const ticketsAbiertos = allTickets.filter(t => t.status?.nombre === 'ABIERTO');
    
    // Contar tickets por agente
    const cargaPorAgente: { [key: number]: number } = {};
    
    ticketsAbiertos.forEach(ticket => {
      if (ticket.usuario_asignado?.id_usuario) {
        const id = ticket.usuario_asignado.id_usuario;
        cargaPorAgente[id] = (cargaPorAgente[id] || 0) + 1;
      }
    });

    // Retornar el agente con menos carga
    // Este método es más para referencia, el backend debería hacer esto
    return cargaPorAgente;
  }

  /**
   * Obtiene permisos del usuario actual para un ticket
   */
  getTicketPermissions(ticket: Ticket) {
    return {
      canView: this.canViewTicket(ticket),
      canEdit: this.canEditTicket(ticket),
      canDelete: this.canDeleteTicket(ticket),
      canResolve: this.canResolveTicket(ticket),
    };
  }
}
