import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { TicketAccessService } from '../../services/ticket-access.service';
import { Ticket } from '../../interface/Ticket';
import { Environment } from '../../environments/environment'; // agregado como variable global

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './vista-principal.html',
  styleUrls: ['./vista-principal.css'],
})
export class VistaPrincipal implements OnInit, OnDestroy {
  // Constantes y estado UI
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

  // Búsqueda y filtros
  terminoBusqueda: string = '';
  datosOriginalesPendientes: Ticket[] = [];
  datosOriginalesResueltos: Ticket[] = [];

  // Datos mostrados en tablas
  datosFiltrados: Ticket[] = [];
  datosFiltradosPendientes: Ticket[] = [];
  datosResueltos: Ticket[] = [];

  // Temporizadores y control por petición
  temporizadorPlaceholder: any;
  temporizadoresPorPeticion = new Map<number, any>();

  // Constructor
  constructor(
    private router: Router,
    private servicios: TicketService,
    private authService: AuthService,
    public authorizationService: AuthorizationService,
    public ticketAccessService: TicketAccessService
  ) {}

  /**
   * Inicializa la vista: carga tickets, aplica filtros por rol y arranca temporizadores.
   * También actualiza el placeholder con mensajes rotativos.
   */
  ngOnInit(): void {
    // Log inicial del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    
    this.servicios.getAll().subscribe({
      next: (tickets) => {
        
        // Filtrar tickets según el rol del usuario
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

    this.temporizadorPlaceholder = setInterval(() => {
      this.placeholderText = `Buscar ${this.mensajes[this.mensajeIndex]}`;
      this.mensajeIndex = (this.mensajeIndex + 1) % this.mensajes.length;
    }, 5000);
  }

  /**
   * Limpia temporizadores y recursos al destruir el componente.
   */
  ngOnDestroy(): void {
    clearInterval(this.temporizadorPlaceholder);
    this.temporizadoresPorPeticion.forEach((t) => clearInterval(t));
    this.temporizadoresPorPeticion.clear();
  }

  /**
   * Filtra tickets en pantalla según el texto de búsqueda actual.
   */
  filtrarDatos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.datosFiltradosPendientes = [...this.datosOriginalesPendientes];
      this.datosResueltos = [...this.datosOriginalesResueltos];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();

    // Filtrar tickets pendientes
    this.datosFiltradosPendientes = this.datosOriginalesPendientes.filter((item) =>
      this.contieneTermino(item, termino)
    );

    this.datosResueltos = this.datosOriginalesResueltos.filter((item) =>
      this.contieneTermino(item, termino)
    );
  }

  /**
   * Resetea el texto de búsqueda y restaura las listas originales.
   */
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

  /**
   * Inicia un temporizador por ticket (muestra tiempo transcurrido desde creación).
   */
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
   * y el ticket está en estado ABIERTO.
   */
  marcarComoResuelta(item: Ticket): void {
    if (item.id_ticket == null || !item.status) return;

    // Verificar si tiene permiso para resolver
    if (!this.ticketAccessService.canResolveTicket(item)) {
      Swal.fire('Acceso Denegado', 'No tienes permiso para resolver este ticket.', 'error');
      return;
    }

    // Solo permitir marcar como resuelto si está ABIERTO
    if (item.status?.nombre !== Environment.NOMBRE_STATUS_ABIERTO) {
      Swal.fire('Acción inválida', 'Solo se pueden resolver tickets que estén abiertos.', 'error');
      return;
    }

    // Actualizar el status
    const ticketActualizado: Ticket = {
      ...item,
      status: {
        id_status: Environment.ID_STATUS_CERRADO, // ID para "Resuelto" - ajusta según tu BD
        nombre: Environment.NOMBRE_STATUS_CERRADO,
      },
    };

    // Actualizar en el backend
    this.servicios.update(item.id_ticket, ticketActualizado).subscribe({
      next: (ticketResuelto) => {
        // Actualizar en el array local
        const index = this.datosFiltrados.findIndex((p) => p.id_ticket === item.id_ticket);
        if (index !== -1) {
          this.datosFiltrados[index] = ticketResuelto;
        }

        // Detener temporizador
        this.detenerTemporizador(item.id_ticket!);

        this.actualizarListas();
        this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
        this.datosOriginalesResueltos = [...this.datosResueltos];

        Swal.fire('Resuelto', 'El ticket ha sido marcado como resuelto.', 'success');
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

  /**
   * Calcula el tiempo transcurrido desde la fecha de inicio hasta ahora.
   */
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

  /**
   * Muestra un modal con la descripción completa y metadatos del ticket.
   */
  verDescripcionCompleta(ticket: Ticket): void {
    Swal.fire({
      title: `<strong>${ticket.title || 'Ticket'}</strong>`,
      html: `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
          <p style="margin-bottom: 10px;">
            <strong>Descripción:</strong>
          </p>
          <p style="white-space: pre-wrap; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #1976D2;">
            ${ticket.descripcion || 'Sin descripción'}
          </p>
          ${ticket.equipoAfectado?.product?.name ? `
            <p style="margin-top: 15px;">
              <strong>Equipo afectado:</strong> ${ticket.equipoAfectado.product.name}
              ${ticket.equipoAfectado.product.brand || ticket.equipoAfectado.product.model ? `
                <br><small style="color: #757575; font-style: italic;">
                  ${ticket.equipoAfectado.product.brand || ''} 
                  ${ticket.equipoAfectado.product.brand && ticket.equipoAfectado.product.model ? ' - ' : ''}
                  ${ticket.equipoAfectado.product.model || ''}
                </small>
              ` : ''}
            </p>
          ` : ''}
          ${ticket.usuario_asignado?.nombre ? `
            <p>
              <strong>Asignado a:</strong> ${ticket.usuario_asignado.nombre}
            </p>
          ` : ''}
          ${ticket.priority?.name ? `
            <p>
              <strong>Prioridad:</strong> <span style="color: ${
                ticket.priority.name === 'ALTA' ? '#C62828' : 
                ticket.priority.name === 'MEDIA' ? '#F57C00' : 
                '#2E7D32'
              }; font-weight: bold;">${ticket.priority.name}</span>
            </p>
          ` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#1976D2',
    });
  }

  /**
   * Devuelve una clase CSS según el nombre del estado para el styling.
   */
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

  /**
   * Verifica si un valor es una fecha válida.
   */
  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }

  /**
   * Indica si el tiempo esperado de resolución (según prioridad) ha sido excedido.
   */
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
}
