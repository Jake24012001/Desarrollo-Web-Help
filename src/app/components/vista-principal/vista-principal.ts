import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { TicketService } from '../../services/ticket.service';
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
  constructor(private router: Router, private servicios: TicketService) {}

  // Lifecycle: carga inicial y limpieza
  ngOnInit(): void {
    this.servicios.getAll().subscribe((tickets) => {
      this.datosFiltrados = tickets.map((p: Ticket) => ({
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
    });

    this.temporizadorPlaceholder = setInterval(() => {
      this.placeholderText = `Buscar ${this.mensajes[this.mensajeIndex]}`;
      this.mensajeIndex = (this.mensajeIndex + 1) % this.mensajes.length;
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizadorPlaceholder);
    this.temporizadoresPorPeticion.forEach((t) => clearInterval(t));
    this.temporizadoresPorPeticion.clear();
  }

  // Búsqueda y filtrado
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

  // Temporizadores por petición
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

      item.tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s transcurridos`;

      if (item.status?.nombre !== Environment.NOMBRE_STATUS_ABIERTO) {
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

  // Acciones CRUD y confirmaciones
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

  modificarPeticion(item?: Ticket): void {
    if (!item?.id_ticket) return;

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

  borrarPeticion(index: number, tipo: 'pendiente' | 'resuelto'): void {
    const fuente = tipo === 'pendiente' ? this.datosFiltradosPendientes : this.datosResueltos;
    const ticket = fuente[index];
    const id = ticket?.id_ticket;

    if (typeof id !== 'number') return;

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

  marcarComoResuelta(item: Ticket): void {
    if (item.id_ticket == null || !item.status) return;

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

  // Funciones utilitarias
  actualizarListas(): void {
    this.datosFiltradosPendientes = this.datosFiltrados.filter(
      (p) => p.status?.nombre !== Environment.NOMBRE_STATUS_CERRADO
    );

    this.datosResueltos = this.datosFiltrados.filter(
      (p) => p.status?.nombre === Environment.NOMBRE_STATUS_CERRADO
    );
  }

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

  calcularTiempoTranscurrido(fechaInicio: string): string {
    const inicio = new Date(fechaInicio);
    if (!fechaInicio || isNaN(inicio.getTime())) return '—';

    const ahora = Date.now();
    const diferencia = ahora - inicio.getTime();

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    return `${dias}d ${horas}h ${minutos}m ${segundos}s transcurridos`;
  }

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

  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }
}
