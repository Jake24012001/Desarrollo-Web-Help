import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core'; // Agregar OnInit
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TicketService } from '../../app/services/ticket.service';
import { HttpClientModule } from '@angular/common/http';
import { Ticket } from '../../interface/Ticket';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './vista-principal.html',
  styleUrls: ['./vista-principal.css'],
})
export class VistaPrincipal implements OnInit, OnDestroy { // Implementar OnInit
  constructor(private router: Router, private servicios: TicketService) {}

  placeholderText = 'Buscar...';
  mensajes = ['Equipos', 'Peticiones', 'Solicitudes', 'Solucionado'];
  mensajeIndex = 0;

  // Búsqueda
  terminoBusqueda: string = '';
  datosOriginalesPendientes: Ticket[] = [];
  datosOriginalesResueltos: Ticket[] = [];

  // Datos
  datosFiltrados: Ticket[] = [];
  datosFiltradosPendientes: Ticket[] = [];
  datosResueltos: Ticket[] = [];

  // Temporizadores
  temporizadorPlaceholder: any;
  temporizadoresPorPeticion = new Map<number, any>();
  

  ngOnInit(): void {
  this.servicios.getAll().subscribe((tickets) => {
    this.datosFiltrados = tickets.map((p: Ticket) => ({
  ...p,
  fechaEntrega: this.isValidDate(p.fecha_creacion) ? new Date(p.fecha_creacion!) : undefined,
      tiempoRestante: p.status?.nombre === 'ABIERTO' && p.fecha_creacion
  ? this.calcularTiempoTranscurrido(p.fecha_creacion)
  : '—'
}));
    this.actualizarListas();
    this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
    this.datosOriginalesResueltos = [...this.datosResueltos];

    this.datosFiltradosPendientes.forEach((p) => {
      if (typeof p.id_ticket === 'number' && p.status?.nombre === 'ABIERTO') {
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

  // Métodos de búsqueda
  filtrarDatos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.datosFiltradosPendientes = [...this.datosOriginalesPendientes];
      this.datosResueltos = [...this.datosOriginalesResueltos];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();

    // Filtrar tickets pendientes
    this.datosFiltradosPendientes = this.datosOriginalesPendientes.filter(item => 
      this.contieneTermino(item, termino)
    );

    this.datosResueltos = this.datosOriginalesResueltos.filter(item => 
      this.contieneTermino(item, termino)
    );
  }

  private contieneTermino(item: Ticket, termino: string): boolean {
    return (
      item.descripcion?.toLowerCase().includes(termino) ||
      item.usuario_asignado?.nombre?.toLowerCase().includes(termino) ||
      item.equipoAfectado?.product?.name?.toLowerCase().includes(termino) ||
      item.usuario_creador?.nombre?.toLowerCase().includes(termino) ||
      item.priority?.nombre?.toLowerCase().includes(termino) ||
      item.status?.nombre?.toLowerCase().includes(termino) ||
      false
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.filtrarDatos();
  }

  // Temporizadores por petición
  iniciarTemporizador(id: number): void {
  if (this.temporizadoresPorPeticion.has(id)) return;

  const item = this.datosFiltrados.find(p => p.id_ticket === id);
  if (!item || item.status?.nombre !== 'ABIERTO') return;

  const inicio = new Date(item.fecha_creacion || Date.now()).getTime();

  const intervalo = setInterval(() => {
    const ahora = Date.now();
    const transcurrido = ahora - inicio;

    const segundos = Math.floor(transcurrido / 1000) % 60;
    const minutos = Math.floor(transcurrido / (1000 * 60)) % 60;
    const horas = Math.floor(transcurrido / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(transcurrido / (1000 * 60 * 60 * 24));

    item.tiempoRestante = `${dias}d ${horas}h ${minutos}m ${segundos}s transcurridos`;

    if (item.status?.nombre !== 'ABIERTO') {
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

    // si funcion

  // Gestión de peticiones
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

    // si funcion

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
        this.router.navigate(['/peticion', item.id_ticket]);
      }
    });
  }
  // si funcion
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
          this.datosFiltrados = this.datosFiltrados.filter(p => p.id_ticket !== id);

          // Actualizar listas derivadas
          this.actualizarListas();
          this.datosOriginalesPendientes = [...this.datosFiltradosPendientes];
          this.datosOriginalesResueltos = [...this.datosResueltos];

          Swal.fire('Eliminado', 'La petición ha sido eliminada.', 'success');
        },
        error: (error) => {
          console.error('Error al eliminar ticket:', error);
          Swal.fire('Error', 'No se pudo eliminar la petición.', 'error');
        }
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
        id_status: 1, // ID para "Resuelto" - ajusta según tu BD
        nombre: 'CERRADO'
      }
    };

    // Actualizar en el backend
    this.servicios.update(item.id_ticket, ticketActualizado).subscribe({
      next: (ticketResuelto) => {
        // Actualizar en el array local
        const index = this.datosFiltrados.findIndex(p => p.id_ticket === item.id_ticket);
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
      }
    });
  }

  // Utilidades
  actualizarListas(): void {
    this.datosFiltradosPendientes = this.datosFiltrados.filter(
      (p) => p.status?.nombre !== 'CERRADO'
    );

    this.datosResueltos = this.datosFiltrados.filter((p) => p.status?.nombre === 'CERRADO');
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
      case 'ABIERTO':
        return 'AB';
      case 'Terminado':
        return 'terminado';
      case 'No disponible':
        return 'no-disponible';
      case 'CERRADO':
        return 'CERRADO';
      default:
        return 'estado-desconocido';
    }
  }

  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }

  
}