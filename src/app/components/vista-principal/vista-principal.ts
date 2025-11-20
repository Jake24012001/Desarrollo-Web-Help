import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { TicketService } from '../../services/ticket.service';
import { TicketCommentService } from '../../services/ticket-comment.service';
import { TicketPriorityService } from '../../services/ticket-priority.service';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { TicketAccessService } from '../../services/ticket-access.service';
import { Ticket } from '../../interface/Ticket';
import { TicketComment } from '../../interface/TicketComment';
import { TicketPriority } from '../../interface/TicketPriority';
import { Environment } from '../../environments/environment';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './vista-principal.html',
  styleUrls: ['./vista-principal.css'],
})
export class VistaPrincipal implements OnInit, OnDestroy {
  // Textos dinámicos del buscador que rotan cada 5 segundos
  placeholderText = 'Buscar...';
  mensajes = [
    'Equipo Afectado',
    'Descripción',
    'Título',
    'Usuario Asignado',
    'Usuario Creador',
    'Prioridad',
    'Estado',
    'Fechas',
    'Tiempo Restante',
  ];
  mensajeIndex = 0;

  // Variables de búsqueda y filtrado
  terminoBusqueda: string = '';
  datosOriginalesPendientes: Ticket[] = [];
  datosOriginalesResueltos: Ticket[] = [];
  filtroTickets: 'todos' | 'pendientes' | 'resueltos' = 'todos';

  // Listas que se muestran en las tablas
  datosFiltrados: Ticket[] = [];
  datosFiltradosPendientes: Ticket[] = [];
  datosResueltos: Ticket[] = [];

  // Temporizadores para actualizar el tiempo transcurrido en cada ticket
  temporizadorPlaceholder: any;
  temporizadoresPorPeticion = new Map<number, any>();

  constructor(
    private router: Router,
    private servicios: TicketService,
    private ticketCommentService: TicketCommentService,
    private ticketPriorityService: TicketPriorityService,
    private authService: AuthService,
    public authorizationService: AuthorizationService,
    public ticketAccessService: TicketAccessService
  ) {}

  // Al iniciar, cargo los tickets y filtro según el rol del usuario
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    this.servicios.getAll().subscribe({
      next: (tickets) => {
        // Filtra tickets según permisos del usuario actual
        const ticketsFiltrados = this.ticketAccessService.getTicketsForUser(tickets);

        this.datosFiltrados = ticketsFiltrados.map((p: Ticket) => ({
          ...p,
          fechaEntrega: this.isValidDate(p.fecha_creacion) ? new Date(p.fecha_creacion!) : undefined,
          tiempoRestante:
            p.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO && p.fecha_creacion
              ? this.calcularTiempoTranscurrido(p.fecha_creacion)
              : '—',
        }));
        this.actualizarListas();
        this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
        this.datosOriginalesResueltos = [...this.datosResueltos];

        // Inicia temporizadores para mostrar tiempo transcurrido en tickets abiertos
        this.datosFiltradosPendientes.forEach((p) => {
          if (
            typeof p.id_ticket === 'number' &&
            p.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO
          ) {
            this.iniciarTemporizador(p.id_ticket);
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al obtener tickets:', error);
        console.error('Detalles:', error.message);
        console.error('Status:', error.status);
      }
    });

    // Rota los mensajes del placeholder cada 5 segundos
    this.temporizadorPlaceholder = setInterval(() => {
      this.placeholderText = `Buscar ${this.mensajes[this.mensajeIndex]}`;
      this.mensajeIndex = (this.mensajeIndex + 1) % this.mensajes.length;
    }, 5000);
  }

  // Limpio todos los temporizadores al destruir el componente
  ngOnDestroy(): void {
    clearInterval(this.temporizadorPlaceholder);
    this.temporizadoresPorPeticion.forEach((t) => clearInterval(t));
    this.temporizadoresPorPeticion.clear();
  }

  // Busca en todas las propiedades del ticket
  filtrarDatos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.datosFiltradosPendientes = [...this.datosOriginalesPendientes];
      this.datosResueltos = [...this.datosOriginalesResueltos];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();

    this.datosFiltradosPendientes = this.datosOriginalesPendientes.filter((item) =>
      this.contieneTermino(item, termino)
    );

    this.datosResueltos = this.datosOriginalesResueltos.filter((item) =>
      this.contieneTermino(item, termino)
    );
  }

  // Cambia entre vista de todos, pendientes o resueltos
  aplicarFiltroTickets(): void {
    this.actualizarListas();
  }

  // Limpia el campo de búsqueda y restaura las listas
  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.filtrarDatos();
  }

  private contieneTermino(item: Ticket, termino: string): boolean {
    return (
      item.title?.toLowerCase().includes(termino) ||
      item.descripcion?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.nombre?.toLowerCase().includes(termino) ||
      item.usuario_creador?.nombre?.toLowerCase().includes(termino) ||
      item.equipoAfectado?.serial?.toLowerCase().includes(termino) ||
      item.equipoAfectado?.product?.name?.toLowerCase().includes(termino) ||
      item.priority?.name?.toLowerCase().includes(termino) ||
      item.status?.nombre?.toLowerCase().includes(termino) ||
      item.fecha_creacion?.toLowerCase().includes(termino) ||
      item.fecha_actualizacion?.toLowerCase().includes(termino) ||
      item.fecha_cierre?.toLowerCase().includes(termino) ||
      item.tiempoRestante?.toLowerCase().includes(termino) ||
      false
    );
  }

  // Crea un temporizador que actualiza el tiempo transcurrido cada segundo
  iniciarTemporizador(id: number): void {
    if (this.temporizadoresPorPeticion.has(id)) return;

    const item = this.datosFiltrados.find((p) => p.id_ticket === id);
    if (!item || item.status?.nombre !== Environment.NOMBRE_STATUS_ABIERTO) return;

    const inicio = new Date(item.fecha_creacion || Date.now()).getTime();

    const intervalo = setInterval(() => {
      const ahora = Date.now();
      const transcurrido = ahora - inicio;

      const segundos = Math.floor(transcurrido / 1000) % 60;
      const minutos = Math.floor(transcurrido / (1000 * 60)) % 60;
      const horas = Math.floor(transcurrido / (1000 * 60 * 60)) % 24;
      const dias = Math.floor(transcurrido / (1000 * 60 * 60 * 24));

      item.tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s`;

      if (item.status?.nombre !== Environment.NOMBRE_STATUS_ABIERTO) {
        this.detenerTemporizador(id);
      }
    }, 1000);

    this.temporizadoresPorPeticion.set(id, intervalo);
  }

  /**
   * Detiene y elimina el temporizador asociado a un ticket.
   */
  detenerTemporizador(id: number): void {
    const temporizador = this.temporizadoresPorPeticion.get(id);
    if (temporizador) {
      clearInterval(temporizador);
      this.temporizadoresPorPeticion.delete(id);
    }
  }

  /**
   * Navega al formulario de creación de peticiones tras confirmar con el usuario.
   */
  crearPeticion(): void {
    Swal.fire({
      title: '¿Deseas crear la petición?',
      text: 'Se te redirigirá a la ventana de detalles.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/peticion']);
      }
    });
  }

  /**
   * Inicia el flujo de modificación de un ticket, validando permisos.
   */
  modificarPeticion(item?: Ticket): void {
    if (!item?.id_ticket) return;

    // Verificar si tiene permiso para editar
    if (!this.ticketAccessService.canEditTicket(item)) {
      Swal.fire('Acceso Denegado', 'No tienes permiso para editar este ticket.', 'error');
      return;
    }

    Swal.fire({
      title: 'Modificar ticket',
      text: '¿Deseas editar esta solicitud?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/actualizar', item.id_ticket]);
      }
    });
  }

  /**
   * Elimina un ticket (solo si el usuario tiene permiso), con confirmación.
   */
  borrarPeticion(index: number, tipo: 'pendiente' | 'resuelto'): void {
    const fuente = tipo === 'pendiente' ? this.datosFiltradosPendientes : this.datosResueltos;
    const ticket = fuente[index];
    const id = ticket?.id_ticket;

    if (typeof id !== 'number') return;

    // Verificar si tiene permiso para eliminar
    if (!this.ticketAccessService.canDeleteTicket(ticket)) {
      Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar este ticket.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la petición permanentemente.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicios.delete(id).subscribe({
          next: () => {
            this.detenerTemporizador(id);

            // Eliminar del array principal
            this.datosFiltrados = this.datosFiltrados.filter((p) => p.id_ticket !== id);

            // Actualizar listas derivadas
            this.actualizarListas();
            this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
            this.datosOriginalesResueltos = [...this.datosResueltos];

            Swal.fire('Eliminado', 'La petición ha sido eliminada.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar ticket:', error);
            Swal.fire('Error', 'No se pudo eliminar la petición.', 'error');
          },
        });
      }
    });
  }

  /**
   * Marca un ticket como resuelto (cambia el estado a CERRADO) si existe permiso
   * y el ticket está en estado ABIERTO. Solicita un comentario de resolución.
   */
  // Cambia el ticket a estado CERRADO y solicita un comentario de resolución
  marcarComoResuelta(item: Ticket): void {
    if (item.id_ticket == null || !item.status) return;

    if (!this.ticketAccessService.canResolveTicket(item)) {
      Swal.fire('Acceso Denegado', 'No tienes permiso para resolver este ticket.', 'error');
      return;
    }

    if (item.status?.nombre !== Environment.NOMBRE_STATUS_ABIERTO) {
      Swal.fire('Acción inválida', 'Solo se pueden resolver tickets que estén abiertos.', 'error');
      return;
    }

    // Pido al usuario que describa la solución aplicada
    Swal.fire({
      title: '<strong style="color: #004A97; font-size: 1.5rem;">Resolver Ticket</strong>',
      html: `
        <div style="text-align: left; margin: 20px auto; max-width: 100%;">
          <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #004A97; margin-bottom: 20px;">
            <p style="margin: 0; color: #004A97; font-weight: 600; font-size: 1rem;">
              <i class="bi bi-ticket-detailed"></i> ${item.title || 'Sin título'}
            </p>
          </div>
          <label style="display: block; margin-bottom: 10px; color: #212121; font-weight: 500; font-size: 0.95rem;">
            Por favor, describe la solución aplicada:
          </label>
          <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <textarea id="swal-comment" 
              placeholder="Describe detalladamente cómo se resolvió el problema..." 
              style="width: 100%; min-height: 180px; padding: 15px; border: none; 
              font-size: 0.95rem; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              line-height: 1.6; color: #212121; box-sizing: border-box; outline: none;"
              rows="8"
              onfocus="this.parentElement.style.border='2px solid #004A97'; this.parentElement.style.boxShadow='0 0 0 3px rgba(0,74,151,0.1)'"
              onblur="this.parentElement.style.border='1px solid #ddd'; this.parentElement.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'"></textarea>
          </div>
          <small style="display: block; margin-top: 8px; color: #757575; font-size: 0.85rem;">
            <i class="bi bi-info-circle"></i> Describe los pasos realizados, herramientas utilizadas y resultado final
          </small>
        </div>
      `,
      width: '800px',
      padding: '30px 40px',
      icon: 'question',
      iconColor: '#004A97',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle"></i> Resolver',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Cancelar',
      confirmButtonColor: '#004A97',
      cancelButtonColor: '#6c757d',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'btn-resolver-custom',
        cancelButton: 'btn-cancelar-custom'
      },
      preConfirm: () => {
        const comment = (document.getElementById('swal-comment') as HTMLTextAreaElement)?.value;
        if (!comment || comment.trim() === '') {
          Swal.showValidationMessage('Por favor ingresa la solución del problema');
          return false;
        }
        return comment.trim();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.resolverTicketConComentario(item, result.value);
      }
    });
  }

  // Actualiza el ticket a CERRADO y guarda la solución como comentario
  private resolverTicketConComentario(item: Ticket, solucion: string): void {
    const ticketActualizado: Ticket = {
      ...item,
      status: {
        id_status: Environment.ID_STATUS_CERRADO,
        nombre: Environment.NOMBRE_STATUS_CERRADO,
      },
    };

    this.servicios.update(item.id_ticket!, ticketActualizado).subscribe({
      next: (ticketResuelto) => {
        // Creo el comentario con la solución aplicada
        const currentUser = this.authService.getCurrentUser();
        const comment: TicketComment = {
          ticket: { id_ticket: item.id_ticket } as Ticket,
          author: { idUsuario: currentUser?.idUsuario } as any,
          message: solucion,
        };

        this.ticketCommentService.create(comment).subscribe({
          next: () => {
            const index = this.datosFiltrados.findIndex((p) => p.id_ticket === item.id_ticket);
            if (index !== -1) {
              this.datosFiltrados[index] = ticketResuelto;
            }

            this.detenerTemporizador(item.id_ticket!);

            this.actualizarListas();
            this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
            this.datosOriginalesResueltos = [...this.datosResueltos];

            Swal.fire('Resuelto', 'El ticket ha sido marcado como resuelto y la solución ha sido registrada.', 'success');
          },
          error: (error) => {
            console.error('Error al crear comentario:', error);
            Swal.fire('Advertencia', 'El ticket fue resuelto pero no se pudo guardar el comentario.', 'warning');
          },
        });
      },
      error: (error) => {
        console.error('Error al resolver ticket:', error);
        Swal.fire('Error', 'No se pudo marcar como resuelto.', 'error');
      },
    });
  }

  /**
   * Recalcula las listas de pendientes y resueltos a partir del array principal
   * y mantiene el orden por fecha de creación (más reciente primero).
   */
  actualizarListas(): void {

    
    this.datosFiltradosPendientes = this.datosFiltrados.filter(
      (p) => {
        const esCerrado = p.status?.nombre === Environment.NOMBRE_STATUS_CERRADO;
        return !esCerrado;
      }
    );

    this.datosResueltos = this.datosFiltrados.filter(
      (p) => p.status?.nombre === Environment.NOMBRE_STATUS_CERRADO
    );

    // Ordenar por fecha de creación (más reciente primero)
    this.datosFiltradosPendientes.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion || 0).getTime();
      const fechaB = new Date(b.fecha_creacion || 0).getTime();
      return fechaB - fechaA; // Descendente: más reciente primero
    });

    this.datosResueltos.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion || 0).getTime();
      const fechaB = new Date(b.fecha_creacion || 0).getTime();
      return fechaB - fechaA; // Descendente: más reciente primero
    });
  }

  /**
   * Calcula el tiempo restante hasta una fecha de cierre indicada.
   */
  calcularTiempoRestante(fechaCierre: string): string {
    const cierre = new Date(fechaCierre);
    if (!fechaCierre || isNaN(cierre.getTime())) return '—';

    const ahora = Date.now();
    const diferencia = cierre.getTime() - ahora;

    if (diferencia <= 0) return 'Expirado';

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    return `${dias}d ${horas}h ${minutos}m ${segundos}s restantes`;
  }

  // Calcula cuánto tiempo ha pasado desde que se creó el ticket
  calcularTiempoTranscurrido(fechaInicio: string): string {
    const inicio = new Date(fechaInicio);
    if (!fechaInicio || isNaN(inicio.getTime())) return '—';

    const ahora = Date.now();
    const diferencia = ahora - inicio.getTime();

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    return `${dias}d ${horas}h ${minutos}m ${segundos}s`;
  }

  // Muestra el modal con toda la información del ticket y comentarios si está resuelto
  verDescripcionCompleta(ticket: Ticket): void {
    if (!ticket.id_ticket) return;

    if (ticket.status?.nombre === Environment.NOMBRE_STATUS_CERRADO) {
      this.ticketCommentService.getAll().subscribe({
        next: (allComments) => {
          const comments = allComments.filter(c => c.ticket?.id_ticket === ticket.id_ticket);
          this.mostrarModalConComentarios(ticket, comments);
        },
        error: () => {
          this.mostrarModalConComentarios(ticket, []);
        }
      });
    } else {
      this.mostrarModalConComentarios(ticket, []);
    }
  }

  // Construye y muestra el modal con la info del ticket y los comentarios de resolución
  private mostrarModalConComentarios(ticket: Ticket, comments: TicketComment[]): void {
    const currentUser = this.authService.getCurrentUser();
    const isAdminOrAgent = this.authorizationService.isAdmin() || this.authorizationService.isAgente();

    let commentsHtml = '';
    if (comments.length > 0) {
      commentsHtml = `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #E3F2FD;">
          <h6 style="color: #004A97; font-weight: 700; margin-bottom: 15px;">
            <i class="bi bi-chat-left-text"></i> Solución Aplicada
          </h6>
      `;
      
      comments.forEach(comment => {
        const isAuthor = comment.author?.idUsuario === currentUser?.idUsuario;
        const isAdmin = this.authorizationService.isAdmin();
        // Los admins pueden editar cualquier comentario, los agentes solo los suyos
        const canEdit = (isAuthor && isAdminOrAgent) || isAdmin;
        
        commentsHtml += `
          <div style="background: #f8fcff; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #4CAF50; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div>
                <strong style="color: #004A97;">${comment.author?.nombre || comment.author?.nombres || 'Usuario'}</strong>
                <small style="color: #757575; display: block; font-size: 0.85rem;">
                  ${comment.createdAt ? new Date(comment.createdAt).toLocaleString('es-EC') : ''}
                </small>
              </div>
              ${canEdit ? `
                <button 
                  class="btn-edit-comment" 
                  data-comment-id="${comment.id}"
                  style="background: transparent; border: 1px solid #004A97; color: #004A97; 
                  padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; 
                  transition: all 0.2s;"
                  onmouseover="this.style.background='#004A97'; this.style.color='white';"
                  onmouseout="this.style.background='transparent'; this.style.color='#004A97';">
                  <i class="bi bi-pencil"></i> Editar
                </button>
              ` : ''}
            </div>
            <p style="white-space: pre-wrap; margin: 0; color: #212121;">${comment.message}</p>
          </div>
        `;
      });
      commentsHtml += '</div>';
    }

    Swal.fire({
      title: `<strong style="color: #004A97; font-size: 1.4rem;">${ticket.title || 'Detalle del Ticket'}</strong>`,
      html: `
        <div style="text-align: left; max-height: 600px; overflow-y: auto; padding: 10px;">
          
          <!-- Descripción -->
          <div style="margin-bottom: 20px;">
            <h6 style="color: #004A97; font-weight: 600; margin-bottom: 10px; font-size: 0.95rem;">
              <i class="bi bi-file-text"></i> Descripción
            </h6>
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%); 
                        padding: ${ticket.descripcion && ticket.descripcion.length > 100 ? '12px 15px' : '10px 15px'}; 
                        border-radius: 8px; border-left: 4px solid #004A97; 
                        color: #212121; line-height: 1.6; font-size: 0.9rem;">
              ${ticket.descripcion || 'Sin descripción'}
            </div>
          </div>

          <!-- Información del Ticket -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            
            ${ticket.equipoAfectado?.product?.name ? `
              <div style="background: #f8fcff; padding: 12px; border-radius: 8px; border: 1px solid #BBDEFB;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <i class="bi bi-laptop" style="color: #004A97; font-size: 1.1rem; margin-right: 8px;"></i>
                  <strong style="color: #004A97; font-size: 0.85rem;">Equipo Afectado</strong>
                </div>
                <div style="color: #212121; font-size: 0.9rem;">${ticket.equipoAfectado.product.name}</div>
                ${ticket.equipoAfectado.product.brand || ticket.equipoAfectado.product.model ? `
                  <small style="color: #757575; font-size: 0.8rem; display: block; margin-top: 4px;">
                    ${ticket.equipoAfectado.product.brand || ''} 
                    ${ticket.equipoAfectado.product.brand && ticket.equipoAfectado.product.model ? ' • ' : ''}
                    ${ticket.equipoAfectado.product.model || ''}
                  </small>
                ` : ''}
              </div>
            ` : ''}

            ${ticket.usuario_asignado ? `
              <div style="background: #f8fcff; padding: 12px; border-radius: 8px; border: 1px solid #BBDEFB;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <i class="bi bi-person-check" style="color: #004A97; font-size: 1.1rem; margin-right: 8px;"></i>
                  <strong style="color: #004A97; font-size: 0.85rem;">Asignado a</strong>
                </div>
                <div style="color: #212121; font-size: 0.9rem;">
                  ${ticket.usuario_asignado.nombres || ticket.usuario_asignado.nombre || '—'}
                  ${ticket.usuario_asignado.apellidos || ''}
                </div>
                <small style="color: #757575; font-size: 0.8rem; display: block; margin-top: 4px;">
                  <i class="bi bi-envelope"></i> ${ticket.usuario_asignado.email || '—'}
                </small>
              </div>
            ` : ''}

            ${ticket.priority?.name ? `
              <div style="background: #f8fcff; padding: 12px; border-radius: 8px; border: 1px solid #BBDEFB;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <i class="bi bi-exclamation-triangle" style="color: #004A97; font-size: 1.1rem; margin-right: 8px;"></i>
                  <strong style="color: #004A97; font-size: 0.85rem;">Prioridad</strong>
                </div>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 600; 
                             font-size: 0.85rem; background: ${
                  ticket.priority.name === 'ALTA' ? '#FFEBEE' : 
                  ticket.priority.name === 'MEDIA' ? '#FFF3E0' : 
                  '#E8F5E9'
                }; color: ${
                  ticket.priority.name === 'ALTA' ? '#C62828' : 
                  ticket.priority.name === 'MEDIA' ? '#EF6C00' : 
                  '#2E7D32'
                };">
                  ${ticket.priority.name}
                </span>
              </div>
            ` : ''}
          </div>

          ${commentsHtml}
        </div>
      `,
      width: '90%',
      padding: '25px 30px',
      confirmButtonText: '<i class="bi bi-x-circle"></i> Cerrar',
      confirmButtonColor: '#004A97',
      buttonsStyling: true,
      customClass: {
        popup: 'swal-responsive-modal'
      },
      didOpen: () => {
        // Agregar event listeners a los botones de editar
        const editButtons = document.querySelectorAll('.btn-edit-comment');
        editButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const commentId = (e.currentTarget as HTMLElement).getAttribute('data-comment-id');
            if (commentId) {
              const comment = comments.find(c => c.id === parseInt(commentId));
              if (comment) {
                Swal.close();
                this.editarComentario(comment, ticket);
              }
            }
          });
        });
      }
    });
  }

  // Permite editar el comentario de resolución (solo admin o el autor del comentario)
  private editarComentario(comment: TicketComment, ticket: Ticket): void {
    Swal.fire({
      title: '<strong style="color: #004A97; font-size: 1.5rem;">Editar Solución</strong>',
      html: `
        <div style="text-align: left; margin: 20px auto; max-width: 100%;">
          <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #004A97; margin-bottom: 20px;">
            <p style="margin: 0; color: #004A97; font-weight: 600; font-size: 1rem;">
              <i class="bi bi-ticket-detailed"></i> ${ticket.title || 'Sin título'}
            </p>
          </div>
          <label style="display: block; margin-bottom: 10px; color: #212121; font-weight: 500; font-size: 0.95rem;">
            Modifica la solución aplicada:
          </label>
          <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <textarea id="swal-edit-comment" 
              style="width: 100%; min-height: 180px; padding: 15px; border: none; 
              font-size: 0.95rem; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              line-height: 1.6; color: #212121; box-sizing: border-box; outline: none;"
              rows="8"
              onfocus="this.parentElement.style.border='2px solid #004A97'; this.parentElement.style.boxShadow='0 0 0 3px rgba(0,74,151,0.1)'"
              onblur="this.parentElement.style.border='1px solid #ddd'; this.parentElement.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'">${comment.message}</textarea>
          </div>
          <small style="display: block; margin-top: 8px; color: #757575; font-size: 0.85rem;">
            <i class="bi bi-info-circle"></i> Actualiza los detalles de la solución aplicada
          </small>
        </div>
      `,
      width: '800px',
      padding: '30px 40px',
      icon: 'info',
      iconColor: '#004A97',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle"></i> Guardar',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Cancelar',
      confirmButtonColor: '#004A97',
      cancelButtonColor: '#6c757d',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'btn-resolver-custom',
        cancelButton: 'btn-cancelar-custom'
      },
      preConfirm: () => {
        const newMessage = (document.getElementById('swal-edit-comment') as HTMLTextAreaElement)?.value;
        if (!newMessage || newMessage.trim() === '') {
          Swal.showValidationMessage('El comentario no puede estar vacío');
          return false;
        }
        return newMessage.trim();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value && comment.id) {
        const updatedComment: TicketComment = {
          ...comment,
          message: result.value,
        };
        
        this.ticketCommentService.update(comment.id, updatedComment).subscribe({
          next: () => {
            Swal.fire('Actualizado', 'El comentario ha sido actualizado exitosamente.', 'success')
              .then(() => this.verDescripcionCompleta(ticket));
          },
          error: (error) => {
            console.error('Error al actualizar comentario:', error);
            Swal.fire('Error', 'No se pudo actualizar el comentario.', 'error');
          },
        });
      } else {
        // Volver al modal anterior
        this.verDescripcionCompleta(ticket);
      }
    });
  }

  // Devuelve la clase CSS que corresponde al estado del ticket
  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'pendiente';
      case Environment.NOMBRE_STATUS_ABIERTO:
        return Environment.NOMBRE_STATUS_ABIERTO;
      case 'Terminado':
        return 'terminado';
      case 'No disponible':
        return 'no-disponible';
      case Environment.NOMBRE_STATUS_CERRADO:
        return Environment.NOMBRE_STATUS_CERRADO;
      default:
        return 'estado-desconocido';
    }
  }

  // Chequea si un valor es una fecha válida
  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }

  // Verifica si el ticket excedió el tiempo esperado de resolución según su prioridad
  tiempoExcedido(ticket: Ticket): boolean {
    if (!ticket.fecha_creacion || !ticket.priority?.resolutionTimeHours) {
      return false;
    }

    const fechaCreacion = new Date(ticket.fecha_creacion);
    if (isNaN(fechaCreacion.getTime())) {
      return false;
    }

    const ahora = Date.now();
    const tiempoTranscurridoMs = ahora - fechaCreacion.getTime();
    const horasTranscurridas = tiempoTranscurridoMs / (1000 * 60 * 60);

    return horasTranscurridas > ticket.priority.resolutionTimeHours;
  }

  // Abre modal para que el admin gestione las duraciones de las prioridades
  gestionarPrioridades(): void {
    this.ticketPriorityService.getAll().subscribe({
      next: (prioridades: TicketPriority[]) => {
        // Ordeno las prioridades: BAJA -> MEDIA -> ALTA
        const prioridadesOrdenadas = [...prioridades].sort((a, b) => {
          const orden: { [key: string]: number } = { 'BAJA': 1, 'LOW': 1, 'MEDIA': 2, 'MEDIUM': 2, 'ALTA': 3, 'HIGH': 3 };
          const valorA = orden[a.name.toUpperCase()] || 999;
          const valorB = orden[b.name.toUpperCase()] || 999;
          return valorA - valorB;
        });

        // Construyo el HTML del modal con inputs editables para cada prioridad
        const prioridadesHTML = prioridadesOrdenadas.map(p => `
          <div style="margin-bottom: 16px; padding: 18px; border: 2px solid #BBDEFB; border-radius: 8px; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <label style="font-weight: 700; color: #1565C0; font-size: 1.05rem; margin: 0;">
                Prioridad ${p.name}
              </label>
              <span style="background: #E3F2FD; color: #0D47A1; padding: 4px 14px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; border: 1px solid #BBDEFB;">
                ${p.name}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input 
                type="number" 
                id="priority-${p.id_priority}" 
                class="swal2-input" 
                value="${p.resolutionTimeHours || 0}" 
                min="1"
                step="1"
                style="margin: 0; flex: 1; padding: 12px; font-size: 1rem; border: 2px solid #BBDEFB; border-radius: 6px; background: white;"
                placeholder="Horas"
              />
              <span style="color: #1565C0; font-weight: 600; white-space: nowrap; min-width: 50px;">horas</span>
            </div>
          </div>
        `).join('');

        Swal.fire({
          title: '<span style="color: #1565C0; font-weight: 700;">Gestión de Prioridades</span>',
          html: `
            <div style="text-align: left; max-height: 500px; overflow-y: auto; padding: 10px;">
              <p style="color: #616161; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5;">
                Configura el tiempo máximo de resolución para cada nivel de prioridad.
              </p>
              ${prioridadesHTML}
            </div>
          `,
          width: '600px',
          showCancelButton: true,
          confirmButtonText: 'Guardar Cambios',
          cancelButtonText: 'Cancelar',
          customClass: {
            popup: 'swal-responsive-modal',
            confirmButton: 'btn-confirmar-custom',
            cancelButton: 'btn-cancelar-custom'
          },
          preConfirm: () => {
            const cambios: { prioridad: TicketPriority; nuevasDuracion: number }[] = [];
            let hayError = false;

            prioridades.forEach(p => {
              const input = document.getElementById(`priority-${p.id_priority}`) as HTMLInputElement;
              if (input) {
                const nuevoValor = parseInt(input.value);
                if (isNaN(nuevoValor) || nuevoValor < 1) {
                  Swal.showValidationMessage(`El valor para ${p.name} debe ser mayor a 0`);
                  hayError = true;
                  return;
                }
                if (nuevoValor !== p.resolutionTimeHours) {
                  cambios.push({ prioridad: p, nuevasDuracion: nuevoValor });
                }
              }
            });

            if (hayError) return false;
            return cambios;
          },
        }).then((result) => {
          if (result.isConfirmed && result.value && result.value.length > 0) {
            // Guardo los cambios en el backend
            let actualizacionesCompletadas = 0;
            const totalActualizaciones = result.value.length;

            result.value.forEach((cambio: { prioridad: TicketPriority; nuevasDuracion: number }) => {
              const prioridadActualizada: TicketPriority = {
                ...cambio.prioridad,
                resolutionTimeHours: cambio.nuevasDuracion
              };

              // Valido que exista el ID antes de actualizar
              if (!cambio.prioridad.id_priority) {
                console.error('ID de prioridad no encontrado');
                return;
              }

              this.ticketPriorityService.update(cambio.prioridad.id_priority, prioridadActualizada).subscribe({
                next: () => {
                  actualizacionesCompletadas++;
                  if (actualizacionesCompletadas === totalActualizaciones) {
                    Swal.fire({
                      icon: 'success',
                      title: '¡Actualizado!',
                      text: `Se actualizaron ${totalActualizaciones} prioridad(es) exitosamente.`,
                      timer: 2000
                    });
                    // Recargo los tickets para reflejar los cambios
                    this.ngOnInit();
                  }
                },
                error: (error) => {
                  console.error('Error al actualizar prioridad:', error);
                  Swal.fire('Error', `No se pudo actualizar la prioridad ${cambio.prioridad.name}.`, 'error');
                }
              });
            });
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar prioridades:', error);
        Swal.fire('Error', 'No se pudieron cargar las prioridades.', 'error');
      }
    });
  }

  // Devuelve el color según el nombre de la prioridad
  private getColorPrioridad(nombre: string): string {
    const nombreUpper = nombre.toUpperCase();
    if (nombreUpper.includes('ALTA') || nombreUpper.includes('HIGH')) return '#C62828';
    if (nombreUpper.includes('MEDIA') || nombreUpper.includes('MEDIUM')) return '#F57C00';
    if (nombreUpper.includes('BAJA') || nombreUpper.includes('LOW')) return '#2E7D32';
    return '#616161';
  }
}
