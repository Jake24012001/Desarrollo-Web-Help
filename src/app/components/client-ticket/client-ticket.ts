import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import { UsuarioService } from '../../services/usuario.service';
import { EquipoService } from '../../services/equipos.service';
import { TicketService } from '../../services/ticket.service';
import { UsuarioRolService } from '../../services/usuariorol.service';
import { TicketPriorityService } from '../../services/ticket-priority.service';
import { AuthService } from '../../services/auth.service';

import { Usuario } from '../../interface/Usuario';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
import { Ticket } from '../../interface/Ticket';
import { UsuarioRol } from '../../interface/UsuarioRol';
import { TicketPriority } from '../../interface/TicketPriority';
import { Rol } from '../../interface/Rol';
import { Environment } from '../../environments/environment';

@Component({
  selector: 'app-client-ticket',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './client-ticket.html',
  styleUrl: './client-ticket.css',
})
export class ClientTicketComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private equipoService = inject(EquipoService);
  private ticketService = inject(TicketService);
  private usuarioservicesR = inject(UsuarioRolService);
  private ticketPriority = inject(TicketPriorityService);

  // Datos para formulario de creación (original)
  ticketPrioridades: TicketPriority[] = [];
  usuarios: Usuario[] = [];
  rolesus: UsuarioRol[] = [];
  equiposInventario: InventoryUnit[] = [];
  equiposFiltrados: InventoryUnit[] = [];
  productosUnicos: Product[] = [];
  
  usuarioSeleccionado: Usuario | null = null;
  usuarioSeleccionados: { id: UsuarioRol; usuario: Usuario; rol: Rol } | null = null;
  equipoSeleccionado: InventoryUnit | null = null;
  productoSeleccionado: string = '';
  mostrarFormularioEquipo = false;
  tipoPeticion = '';
  detallePeticion = '';
  prioridadSeleccionada: TicketPriority | null = null;

  // Datos para visualización de tickets del cliente (usando lógica de vista-principal)
  misTickets: Ticket[] = [];
  datosOriginalesAbiertos: Ticket[] = [];
  datosOriginalesResueltos: Ticket[] = [];
  ticketsAbiertos: Ticket[] = [];
  ticketsResueltos: Ticket[] = [];
  searchTerm: string = '';
  
  // Temporizadores
  temporizadoresPorPeticion = new Map<number, any>();

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.cargarMisTickets();
  }

  ngOnDestroy(): void {
    this.temporizadoresPorPeticion.forEach((t) => clearInterval(t));
    this.temporizadoresPorPeticion.clear();
  }

  cargarDatosIniciales(): void {
    // Cargar lista de usuarios
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    // Cargar inventario de equipos
    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;
      const tiposSet = new Set<string>();
      this.productosUnicos = equipos
        .map((e) => e.product)
        .filter((p) => {
          if (!p?.type || tiposSet.has(p.type)) return false;
          tiposSet.add(p.type);
          return true;
        });
      this.equiposFiltrados = [];
    });

    // Cargar mapeos usuario-rol
    this.usuarioservicesR.getAll().subscribe((roles) => {
      this.rolesus = roles;
    });

    // Cargar prioridades de ticket
    this.ticketPriority.getAll().subscribe((name) => {
      this.ticketPrioridades = name;
    });
  }

  cargarMisTickets(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      console.error('No se pudo obtener el ID del usuario actual');
      return;
    }

    this.ticketService.getAll().subscribe({
      next: (tickets) => {
        // Filtrar tickets creados por el cliente actual y calcular tiempo
        this.misTickets = tickets
          .filter(t => t.usuario_creador?.id_usuario === userId)
          .map((ticket: Ticket) => ({
            ...ticket,
            fechaEntrega: this.isValidDate(ticket.fecha_creacion) ? new Date(ticket.fecha_creacion!) : undefined,
            tiempoRestante: ticket.status?.id_status === Environment.ID_STATUS_ABIERTO && ticket.fecha_creacion
              ? this.calcularTiempoTranscurrido(ticket.fecha_creacion)
              : '—',
          }));

        // Separar en abiertos y resueltos
        this.actualizarListas();
        this.datosOriginalesAbiertos = [...this.ticketsAbiertos];
        this.datosOriginalesResueltos = [...this.ticketsResueltos];

        // Iniciar temporizadores para tickets abiertos
        this.ticketsAbiertos.forEach((ticket) => {
          if (typeof ticket.id_ticket === 'number' && ticket.status?.id_status === Environment.ID_STATUS_ABIERTO) {
            this.iniciarTemporizador(ticket.id_ticket);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar tickets:', err);
      }
    });
  }

  actualizarListas(): void {
    this.ticketsAbiertos = this.misTickets.filter(
      (t) => t.status?.id_status === Environment.ID_STATUS_ABIERTO
    );

    this.ticketsResueltos = this.misTickets.filter(
      (t) => t.status?.id_status === Environment.ID_STATUS_CERRADO
    );
  }

  // Búsqueda en tiempo real
  filtrarTickets(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.ticketsAbiertos = [...this.datosOriginalesAbiertos];
      this.ticketsResueltos = [...this.datosOriginalesResueltos];
      return;
    }

    const termino = this.searchTerm.toLowerCase().trim();

    this.ticketsAbiertos = this.datosOriginalesAbiertos.filter((item) =>
      this.contieneTermino(item, termino)
    );

    this.ticketsResueltos = this.datosOriginalesResueltos.filter((item) =>
      this.contieneTermino(item, termino)
    );
  }

  private contieneTermino(item: Ticket, termino: string): boolean {
    return (
      item.title?.toLowerCase().includes(termino) ||
      item.descripcion?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.nombre?.toLowerCase().includes(termino) ||
      item.equipoAfectado?.serial?.toLowerCase().includes(termino) ||
      item.equipoAfectado?.product?.name?.toLowerCase().includes(termino) ||
      item.priority?.name?.toLowerCase().includes(termino) ||
      item.status?.nombre?.toLowerCase().includes(termino) ||
      item.tiempoRestante?.toLowerCase().includes(termino) ||
      false
    );
  }

  // Temporizadores por ticket
  iniciarTemporizador(id: number): void {
    if (this.temporizadoresPorPeticion.has(id)) return;

    const item = this.misTickets.find((t) => t.id_ticket === id);
    if (!item || item.status?.id_status !== Environment.ID_STATUS_ABIERTO) return;

    const inicio = new Date(item.fecha_creacion || Date.now()).getTime();

    const intervalo = setInterval(() => {
      const ahora = Date.now();
      const transcurrido = ahora - inicio;

      const segundos = Math.floor(transcurrido / 1000) % 60;
      const minutos = Math.floor(transcurrido / (1000 * 60)) % 60;
      const horas = Math.floor(transcurrido / (1000 * 60 * 60)) % 24;
      const dias = Math.floor(transcurrido / (1000 * 60 * 60 * 24));

      item.tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s`;

      if (item.status?.id_status !== Environment.ID_STATUS_ABIERTO) {
        this.detenerTemporizador(id);
      }
    }, 1000);

    this.temporizadoresPorPeticion.set(id, intervalo);
  }

  detenerTemporizador(id: number): void {
    const temporizador = this.temporizadoresPorPeticion.get(id);
    if (temporizador) {
      clearInterval(temporizador);
      this.temporizadoresPorPeticion.delete(id);
    }
  }

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

  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }

  cancelarAccion(): void {
    Swal.fire({
      title: '¿Cancelar petición?',
      text: 'Se perderán los datos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
    }).then((result) => {
      if (result.isConfirmed) {
        this.limpiarFormulario();
      }
    });
  }

  limpiarFormulario(): void {
    this.tipoPeticion = '';
    this.detallePeticion = '';
    this.usuarioSeleccionado = null;
    this.usuarioSeleccionados = null;
    this.equipoSeleccionado = null;
    this.productoSeleccionado = '';
    this.prioridadSeleccionada = null;
  }

  crearTicket(): void {
    // Obtener el usuario actual logueado
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser?.usuario) {
      Swal.fire('Error', 'No se pudo identificar el usuario actual', 'error');
      return;
    }

    const nuevoTicket: Ticket = {
      title: this.tipoPeticion,
      descripcion: this.detallePeticion,
      status: this.getEstadoPendiente(),
      priority: this.prioridadSeleccionada ?? undefined,
      usuario_creador: currentUser.usuario, // Usuario logueado (el cliente)
      usuario_asignado: this.usuarioSeleccionados?.usuario ?? undefined,
      equipoAfectado: this.equipoSeleccionado ?? undefined,
    };

    this.ticketService.create(nuevoTicket).subscribe({
      next: (ticketCreado) => {
        console.log('Ticket creado:', ticketCreado);
        Swal.fire('¡Éxito!', 'Ticket creado correctamente', 'success');
        this.limpiarFormulario();
        this.cargarMisTickets(); // Recargar lista de tickets
      },
      error: (err) => {
        console.error('Error al crear ticket:', err);
        Swal.fire('Error', 'No se pudo crear el ticket', 'error');
      },
    });
  }

  filtrarEquiposPorTipo(): void {
    if (!this.productoSeleccionado) {
      this.equiposFiltrados = [];
      return;
    }

    this.equiposFiltrados = this.equiposInventario.filter((equipo) => {
      const coincideTipo = equipo.product?.type === this.productoSeleccionado;
      
      if (this.usuarioSeleccionado) {
        const cedulaUsuario = this.usuarioSeleccionado.cedula || this.usuarioSeleccionado.nombre;
        const cedulaCustodian = equipo.custodian?.cedula;
        const coincideCustodio = cedulaCustodian === cedulaUsuario;
        
        return coincideTipo && coincideCustodio;
      }
      
      return false;
    });

    if (this.equipoSeleccionado && 
        !this.equiposFiltrados.find(e => e.id === this.equipoSeleccionado?.id)) {
      this.equipoSeleccionado = null;
    }
  }

  onUsuarioChange(): void {
    this.productoSeleccionado = '';
    this.equipoSeleccionado = null;
    this.equiposFiltrados = [];
  }

  mostrarFormEquipo(): void {
    this.mostrarFormularioEquipo = true;
  }

  getEstadoPendiente(): Ticket['status'] {
    return {
      id_status: Environment.ID_STATUS_ABIERTO,
      nombre: Environment.NOMBRE_STATUS_ABIERTO,
    };
  }

  formatearEquipo(equipo: InventoryUnit): string {
    let texto = '';
    
    if (equipo.serial && equipo.serial.trim() !== '' && equipo.serial !== 'null') {
      texto = `${equipo.serial} - `;
    }
    
    texto += equipo.product.name;
    
    if (equipo.product.brand || equipo.product.model) {
      const detalles: string[] = [];
      if (equipo.product.brand) detalles.push(equipo.product.brand);
      if (equipo.product.model) detalles.push(equipo.product.model);
      texto += ` (${detalles.join(' - ')})`;
    }
    
    return texto;
  }

  // Calificar servicio (para tickets resueltos)
  calificarServicio(ticket: Ticket): void {
    Swal.fire({
      title: 'Calificar Servicio',
      html: `
        <div class="mb-3">
          <label class="form-label">Puntuación (1-5):</label>
          <select id="puntuacion" class="form-select">
            <option value="1">⭐ 1 - Muy malo</option>
            <option value="2">⭐⭐ 2 - Malo</option>
            <option value="3" selected>⭐⭐⭐ 3 - Regular</option>
            <option value="4">⭐⭐⭐⭐ 4 - Bueno</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 - Excelente</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Comentario:</label>
          <textarea id="comentario" class="form-control" rows="3" placeholder="Opcional: Comparte tu experiencia"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const puntuacion = parseInt((document.getElementById('puntuacion') as HTMLSelectElement).value);
        const comentario = (document.getElementById('comentario') as HTMLTextAreaElement).value;
        return { puntuacion, comentario };
      }
    }).then((result) => {
      if (result.isConfirmed && ticket.id_ticket) {
        const { puntuacion, comentario } = result.value;
        
        this.ticketService.actualizarCalificacion(ticket.id_ticket, puntuacion, comentario).subscribe({
          next: () => {
            Swal.fire('¡Gracias!', 'Tu calificación ha sido registrada', 'success');
            this.cargarMisTickets();
          },
          error: (err) => {
            console.error('Error al calificar:', err);
            Swal.fire('Error', 'No se pudo registrar la calificación', 'error');
          }
        });
      }
    });
  }

  getPrioridadClass(prioridad?: TicketPriority | { id_priority?: number; name?: string; resolutionTimeHours?: number }): string {
    if (!prioridad?.name) return 'bg-secondary';
    
    const nombre = prioridad.name.toLowerCase();
    if (nombre.includes('alta') || nombre.includes('urgente')) return 'bg-danger';
    if (nombre.includes('media')) return 'bg-warning text-dark';
    if (nombre.includes('baja')) return 'bg-success';
    return 'bg-secondary';
  }

  getEstadoTexto(ticket: Ticket): string {
    return ticket.status?.nombre || 'DESCONOCIDO';
  }

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
