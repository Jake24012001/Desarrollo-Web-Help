import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { TicketService } from '../../services/ticket.service';
import { TicketCommentService } from '../../services/ticket-comment.service';
import { TicketPriorityService } from '../../services/ticket-priority.service';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioRolService } from '../../services/usuariorol.service';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { TicketAccessService } from '../../services/ticket-access.service';
import { Ticket } from '../../interface/Ticket';
import { TicketComment } from '../../interface/TicketComment';
import { TicketPriority } from '../../interface/TicketPriority';
import { Usuario } from '../../interface/Usuario';
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
  mostrarSoloMisTickets: boolean = false;
  todosLosTickets: Ticket[] = [];

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
        this.todosLosTickets = ticketsFiltrados;

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

  toggleMisTickets(): void {
    this.mostrarSoloMisTickets = !this.mostrarSoloMisTickets;
    
    if (this.mostrarSoloMisTickets) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.mostrarSoloMisTickets = false;
        return;
      }

      const currentUserId = currentUser.idUsuario;
      
      this.datosFiltrados = this.todosLosTickets.filter((ticket) => {
        const creadorId = ticket.usuario_creador?.idUsuario || 
                         ticket.usuario_creador?.id_usuario || 
                         (ticket.usuario_creador as any)?.id;
        return creadorId === currentUserId;
      }).map((p: Ticket) => ({
        ...p,
        fechaEntrega: this.isValidDate(p.fecha_creacion) ? new Date(p.fecha_creacion!) : undefined,
        tiempoRestante:
          p.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO && p.fecha_creacion
            ? this.calcularTiempoTranscurrido(p.fecha_creacion)
            : '—',
      }));
    } else {
      this.datosFiltrados = this.todosLosTickets.map((p: Ticket) => ({
        ...p,
        fechaEntrega: this.isValidDate(p.fecha_creacion) ? new Date(p.fecha_creacion!) : undefined,
        tiempoRestante:
          p.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO && p.fecha_creacion
            ? this.calcularTiempoTranscurrido(p.fecha_creacion)
            : '—',
      }));
    }
    
    this.actualizarListas();
    this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
    this.datosOriginalesResueltos = [...this.datosResueltos];
    
    this.datosFiltradosPendientes.forEach((p) => {
      if (
        typeof p.id_ticket === 'number' &&
        p.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO
      ) {
        this.iniciarTemporizador(p.id_ticket);
      }
    });
    
    if (this.terminoBusqueda) {
      this.filtrarDatos();
    }
  }

  private contieneTermino(item: Ticket, termino: string): boolean {
    return (
      item.title?.toLowerCase().includes(termino) ||
      item.descripcion?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.nombre?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.nombres?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.apellidos?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.email?.toLowerCase().includes(termino) ||
      item.usuario_creador?.nombre?.toLowerCase().includes(termino) ||
      item.usuario_creador?.nombres?.toLowerCase().includes(termino) ||
      item.usuario_creador?.apellidos?.toLowerCase().includes(termino) ||
      item.usuario_creador?.email?.toLowerCase().includes(termino) ||
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

  // Calcula el tiempo de resolución (desde creación hasta cierre del ticket)
  calcularTiempoResolucion(fechaCreacion: string | undefined, fechaCierre: string | undefined): string {
    if (!fechaCreacion || !fechaCierre) return '—';

    const inicio = new Date(fechaCreacion);
    const cierre = new Date(fechaCierre);
    
    if (isNaN(inicio.getTime()) || isNaN(cierre.getTime())) return '—';

    const diferencia = cierre.getTime() - inicio.getTime();
    
    // Si la diferencia es negativa, hay un error en los datos
    if (diferencia < 0) return '—';

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    // Formato más legible dependiendo del tiempo
    if (dias > 0) {
      return `${dias}d ${horas}h ${minutos}m`;
    } else if (horas > 0) {
      return `${horas}h ${minutos}m ${segundos}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos}s`;
    } else {
      return `${segundos}s`;
    }
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
                <strong style="color: #004A97;">${comment.author?.email || 'Usuario'}</strong>
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
            
            <!-- Fecha de Creación -->
            ${ticket.fecha_creacion ? `
              <div style="background: #f8fcff; padding: 12px; border-radius: 8px; border: 1px solid #BBDEFB;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <i class="bi bi-calendar-plus" style="color: #004A97; font-size: 1.1rem; margin-right: 8px;"></i>
                  <strong style="color: #004A97; font-size: 0.85rem;">Fecha de Creación</strong>
                </div>
                <div style="color: #212121; font-size: 0.9rem;">
                  ${new Date(ticket.fecha_creacion).toLocaleDateString('es-EC', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <small style="color: #757575; font-size: 0.8rem; display: block; margin-top: 4px;">
                  <i class="bi bi-clock"></i> ${new Date(ticket.fecha_creacion).toLocaleTimeString('es-EC', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </small>
              </div>
            ` : ''}

            <!-- Fecha Estimada / Límite -->
            ${ticket.fecha_estimada ? `
              <div style="background: ${this.fechaEstimadaVencida(ticket) ? '#fff5f5' : '#f8fcff'}; 
                          padding: 12px; border-radius: 8px; 
                          border: 2px solid ${this.fechaEstimadaVencida(ticket) ? '#dc3545' : '#BBDEFB'};">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <i class="bi bi-alarm${this.fechaEstimadaVencida(ticket) ? '-fill' : ''}" 
                     style="color: ${this.fechaEstimadaVencida(ticket) ? '#dc3545' : '#004A97'}; 
                            font-size: 1.1rem; margin-right: 8px;"></i>
                  <strong style="color: ${this.fechaEstimadaVencida(ticket) ? '#dc3545' : '#004A97'}; font-size: 0.85rem;">
                    Fecha Límite
                  </strong>
                </div>
                <div style="color: ${this.fechaEstimadaVencida(ticket) ? '#dc3545' : '#212121'}; 
                            font-size: 0.9rem; font-weight: ${this.fechaEstimadaVencida(ticket) ? '600' : '400'};">
                  ${new Date(ticket.fecha_estimada).toLocaleDateString('es-EC', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <small style="color: ${this.fechaEstimadaVencida(ticket) ? '#dc3545' : '#757575'}; 
                              font-size: 0.8rem; display: block; margin-top: 4px;">
                  <i class="bi bi-clock"></i> ${new Date(ticket.fecha_estimada).toLocaleTimeString('es-EC', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  ${this.fechaEstimadaVencida(ticket) ? ' <strong>(Vencida)</strong>' : ''}
                </small>
              </div>
            ` : ''}

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

  /**
   * Verifica si el usuario actual es el creador del ticket
   */
  esCreadorDelTicket(ticket: Ticket): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    const creadorId = ticket.usuario_creador?.idUsuario ?? ticket.usuario_creador?.id_usuario;
    return creadorId === currentUser.idUsuario;
  }

  /**
   * Abre un modal para agregar comentario después de calificar el ticket
   */
  agregarComentarioRating(ticket: Ticket, rating: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    Swal.fire({
      title: '<strong style="color: #004A97; font-size: 1.5rem;">Comparte tu Experiencia</strong>',
      html: `
        <div style="text-align: left; margin: 20px auto; max-width: 100%;">
          <!-- Calificación dada -->
          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: white; font-weight: 600; font-size: 1rem;">
              Tu Calificación
            </p>
            <div style="font-size: 2rem; color: white; margin-top: 8px;">
              ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
            </div>
          </div>

          <!-- Info del ticket -->
          <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #004A97; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #004A97; font-weight: 600; font-size: 1rem;">
              <i class="bi bi-ticket-detailed"></i> ${ticket.title || 'Sin título'}
            </p>
            <p style="margin: 0; color: #666; font-size: 0.85rem;">
              <i class="bi bi-person"></i> Asignado a: ${ticket.usuario_asignado?.nombres || ticket.usuario_asignado?.nombre || 'No asignado'}
            </p>
          </div>

          <!-- Campo de comentario -->
          <label style="display: block; margin-bottom: 10px; color: #212121; font-weight: 500; font-size: 0.95rem;">
            <i class="bi bi-chat-left-text"></i> Cuéntanos sobre tu experiencia:
          </label>
          <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <textarea id="swal-comment-rating" 
              style="width: 100%; min-height: 180px; padding: 15px; border: none; 
              font-size: 0.95rem; resize: vertical; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              line-height: 1.6; color: #212121; box-sizing: border-box; outline: none;"
              rows="8"
              placeholder="¿Qué te pareció la atención recibida? ¿El problema fue resuelto satisfactoriamente?"
              onfocus="this.parentElement.style.border='2px solid #004A97'; this.parentElement.style.boxShadow='0 0 0 3px rgba(0,74,151,0.1)'"
              onblur="this.parentElement.style.border='1px solid #ddd'; this.parentElement.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'"></textarea>
          </div>
          <small style="display: block; margin-top: 8px; color: #757575; font-size: 0.85rem;">
            <i class="bi bi-info-circle"></i> Tu comentario ayudará a mejorar nuestro servicio
          </small>
        </div>
      `,
      width: '800px',
      padding: '30px 40px',
      icon: 'question',
      iconColor: '#FFD700',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle"></i> Enviar Comentario',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Omitir',
      confirmButtonColor: '#004A97',
      cancelButtonColor: '#6c757d',
      buttonsStyling: true,
      customClass: {
        confirmButton: 'btn-resolver-custom',
        cancelButton: 'btn-cancelar-custom'
      },
      preConfirm: () => {
        const comentario = (document.getElementById('swal-comment-rating') as HTMLTextAreaElement)?.value;
        if (!comentario || comentario.trim().length < 10) {
          Swal.showValidationMessage('El comentario debe tener al menos 10 caracteres');
          return false;
        }
        return comentario.trim();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Crear el comentario usando el servicio de comentarios
        const nuevoComentario: TicketComment = {
          ticket: ticket,
          author: {
            idUsuario: currentUser.idUsuario,
            nombres: currentUser.nombres,
            apellidos: currentUser.apellidos,
            email: currentUser.email,
          } as any,
          message: result.value,
        };

        this.ticketCommentService.create(nuevoComentario).subscribe({
          next: (comentarioCreado) => {
            Swal.fire({
              icon: 'success',
              title: '¡Comentario Enviado!',
              html: `
                <p>Gracias por compartir tu experiencia.</p>
                <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #4CAF50;">
                  <p style="margin: 0; color: #2E7D32; font-size: 0.9rem;">
                    <i class="bi bi-check-circle"></i> Tu calificación y comentario han sido registrados exitosamente.
                  </p>
                </div>
              `,
              confirmButtonColor: '#004A97'
            });

            // Actualizar la vista si es necesario
            this.actualizarListas();
          },
          error: (error) => {
            console.error('Error al crear comentario:', error);
            Swal.fire('Error', 'No se pudo guardar tu comentario. Por favor intenta de nuevo.', 'error');
          }
        });
      }
    });
  }

  /**
   * Abre un modal para calificar el servicio de un ticket resuelto (solo creador)
   */
  calificarTicket(ticket: Ticket): void {
    if (!this.esCreadorDelTicket(ticket)) {
      Swal.fire('Acceso denegado', 'Solo el creador del ticket puede calificarlo', 'error');
      return;
    }

    if (!ticket.id_ticket) return;

    let ratingSeleccionado = 0;
    
    Swal.fire({
      title: '<strong style="color: #004A97;">Calificar Servicio</strong>',
      html: `
        <div style="text-align: left; padding: 15px;">
          <p style="margin-bottom: 20px; color: #555;">
            <i class="bi bi-info-circle"></i> ¿Cómo calificarías la atención recibida para el ticket:
            <strong style="color: #004A97;">${ticket.title}</strong>?
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <div class="rating-stars" style="font-size: 2.5rem; cursor: pointer;">
              ${[1, 2, 3, 4, 5].map(i => `<span class="rating-star" data-rating="${i}" style="color: #ddd; transition: color 0.2s;">★</span>`).join('')}
            </div>
            <p id="rating-text" style="color: #004A97; font-weight: 600; margin-top: 10px; min-height: 24px;"></p>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-size: 0.9rem;">
            <i class="bi bi-chat-dots"></i> Después de calificar, podrás agregar un comentario sobre tu experiencia.
          </p>
        </div>
      `,
      width: '550px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle"></i> Enviar Calificación',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Cancelar',
      confirmButtonColor: '#004A97',
      cancelButtonColor: '#6c757d',
      didOpen: () => {
        const stars = document.querySelectorAll('.rating-star');
        const ratingText = document.getElementById('rating-text');
        const ratingLabels = ['', 'Muy Malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
        
        stars.forEach(star => {
          star.addEventListener('mouseenter', (e) => {
            const rating = parseInt((e.target as HTMLElement).getAttribute('data-rating') || '0');
            stars.forEach((s, idx) => {
              (s as HTMLElement).style.color = idx < rating ? '#FFD700' : '#ddd';
            });
            if (ratingText) ratingText.textContent = ratingLabels[rating];
          });

          star.addEventListener('click', (e) => {
            ratingSeleccionado = parseInt((e.target as HTMLElement).getAttribute('data-rating') || '0');
            stars.forEach((s, idx) => {
              (s as HTMLElement).style.color = idx < ratingSeleccionado ? '#FFD700' : '#ddd';
              (s as HTMLElement).style.transform = idx < ratingSeleccionado ? 'scale(1.2)' : 'scale(1)';
            });
            if (ratingText) {
              ratingText.textContent = ratingLabels[ratingSeleccionado];
              ratingText.style.color = '#FFD700';
            }
          });
        });

        // Reset on mouse leave
        const container = document.querySelector('.rating-stars');
        container?.addEventListener('mouseleave', () => {
          if (ratingSeleccionado === 0) {
            stars.forEach(s => (s as HTMLElement).style.color = '#ddd');
            if (ratingText) ratingText.textContent = '';
          } else {
            stars.forEach((s, idx) => {
              (s as HTMLElement).style.color = idx < ratingSeleccionado ? '#FFD700' : '#ddd';
            });
            if (ratingText) {
              ratingText.textContent = ratingLabels[ratingSeleccionado];
              ratingText.style.color = '#FFD700';
            }
          }
        });
      },
      preConfirm: () => {
        if (ratingSeleccionado === 0) {
          Swal.showValidationMessage('Por favor selecciona una calificación');
          return false;
        }
        return ratingSeleccionado;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const rating = result.value;
        
        console.log('🌟 Enviando calificación:', rating, 'para ticket ID:', ticket.id_ticket);
        
        this.servicios.actualizarCalificacion(ticket.id_ticket!, rating).subscribe({
          next: (ticketActualizado) => {
            console.log('✅ Respuesta del backend:', ticketActualizado);
            
            // Actualizar el ticket en todas las listas locales
            const ticketId = ticket.id_ticket;
            
            // Actualizar datosResueltos
            const indexResueltos = this.datosResueltos.findIndex(t => t.id_ticket === ticketId);
            if (indexResueltos !== -1) {
              this.datosResueltos[indexResueltos] = { ...this.datosResueltos[indexResueltos], rating };
            }
            
            // Actualizar datosFiltrados
            const indexFiltrados = this.datosFiltrados.findIndex(t => t.id_ticket === ticketId);
            if (indexFiltrados !== -1) {
              this.datosFiltrados[indexFiltrados] = { ...this.datosFiltrados[indexFiltrados], rating };
            }
            
            // Actualizar datosOriginalesResueltos
            const indexOriginales = this.datosOriginalesResueltos.findIndex(t => t.id_ticket === ticketId);
            if (indexOriginales !== -1) {
              this.datosOriginalesResueltos[indexOriginales] = { ...this.datosOriginalesResueltos[indexOriginales], rating };
            }
            
            console.log('✅ Calificación guardada:', rating, 'para ticket:', ticketId);
            
            // Mostrar confirmación y abrir modal para agregar comentario
            Swal.fire({
              icon: 'success',
              title: '¡Gracias por tu calificación!',
              html: `
                <p>Tu opinión nos ayuda a mejorar nuestro servicio.</p>
                <div style="font-size: 2rem; color: #FFD700; margin: 15px 0;">
                  ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                </div>
                <p style="margin-top: 15px; color: #666;">Ahora puedes agregar un comentario sobre tu experiencia.</p>
              `,
              confirmButtonText: '<i class="bi bi-chat-left-text"></i> Agregar Comentario',
              showCancelButton: true,
              cancelButtonText: 'Cerrar',
              confirmButtonColor: '#004A97',
              cancelButtonColor: '#6c757d'
            }).then((commentResult) => {
              if (commentResult.isConfirmed) {
                // Abrir modal para agregar comentario
                this.agregarComentarioRating(ticket, rating);
              }
            });
          },
          error: (error) => {
            console.error('Error al calificar ticket:', error);
            Swal.fire('Error', 'No se pudo guardar la calificación. Por favor intenta de nuevo.', 'error');
          }
        });
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

  // Verifica si el ticket excedió la fecha estimada de resolución
  tiempoExcedido(ticket: Ticket): boolean {
    if (!ticket.fecha_estimada) {
      return false;
    }

    const fechaEstimada = new Date(ticket.fecha_estimada);
    if (isNaN(fechaEstimada.getTime())) {
      return false;
    }

    const ahora = Date.now();
    return ahora > fechaEstimada.getTime();
  }

  // Verifica si la fecha estimada del ticket ya venció (para usar en el modal)
  fechaEstimadaVencida(ticket: Ticket): boolean {
    return this.tiempoExcedido(ticket);
  }

  // Abre modal para que el admin gestione las prioridades (sin duración)
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

        // Construyo el HTML del modal mostrando las prioridades existentes
        const prioridadesHTML = prioridadesOrdenadas.map(p => `
          <div style="margin-bottom: 16px; padding: 18px; border: 2px solid #BBDEFB; border-radius: 8px; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 700; color: #1565C0; font-size: 1.05rem; margin: 0;">
                ${p.name}
              </label>
              <span style="background: #E3F2FD; color: #0D47A1; padding: 6px 16px; border-radius: 4px; font-size: 0.9rem; font-weight: 600; border: 1px solid #BBDEFB;">
                ${p.description || 'Sin descripción'}
              </span>
            </div>
          </div>
        `).join('');

        Swal.fire({
          title: '<span style="color: #1565C0; font-weight: 700;">Prioridades del Sistema</span>',
          html: `
            <div style="text-align: left; max-height: 500px; overflow-y: auto; padding: 10px;">
              <p style="color: #616161; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5;">
                Las fechas estimadas de resolución ahora se configuran individualmente para cada ticket.
              </p>
              ${prioridadesHTML}
            </div>
          `,
          width: '600px',
          confirmButtonText: 'Cerrar',
          customClass: {
            popup: 'swal-responsive-modal',
            confirmButton: 'btn-confirmar-custom'
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar prioridades:', err);
        Swal.fire('Error', 'No se pudieron cargar las prioridades', 'error');
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
