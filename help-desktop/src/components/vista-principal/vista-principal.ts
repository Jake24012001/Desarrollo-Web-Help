import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { TicketService } from '../../app/services/ticket.service';
import { HttpClientModule } from '@angular/common/http';
import { Ticket } from '../../interface/Ticket';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './vista-principal.html',
  styleUrls: ['./vista-principal.css'],
})
export class VistaPrincipal implements OnDestroy {
  constructor(private router: Router, private servicios: TicketService) {}

  // UI placeholders
  placeholderText = 'Buscar...';
  mensajes = ['Equipos', 'Peticiones', 'Solicitudes', 'Solucionado'];
  mensajeIndex = 0;

  // Datos
  datosFiltrados: Ticket[] = [];
  datosFiltradosPendientes: Ticket[] = [];
  datosResueltos: Ticket[] = [];

  // Temporizadores
  temporizadorPlaceholder: any;
  temporizadoresPorPeticion = new Map<number, any>();

  // Ciclo de vida
  ngOnInit(): void {
    this.servicios.getAll().subscribe((tickets) => {
      this.datosFiltrados = tickets.map((p: Ticket) => ({
        ...p,
        fechaEntrega: this.isValidDate(p.fecha_creacion) ? new Date(p.fecha_creacion!) : null,
      }));

      this.actualizarListas();

      this.datosFiltradosPendientes.forEach((p) => {
        if (p.id_ticket !== undefined && p.id_ticket !== null) {
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

  // Temporizadores por petición
  iniciarTemporizador(id: number): void {
    if (this.temporizadoresPorPeticion.has(id)) return;

    const intervalo = setInterval(() => {
      const peticion = this.datosFiltrados.find((p) => p.id_ticket === id);
      if (peticion && peticion.status?.nombre !== 'Resuelto') {
        this.datosFiltrados = [...this.datosFiltrados];
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

  borrarPeticion(index: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la petición pendiente permanentemente.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const id = this.datosFiltradosPendientes[index].id_ticket;
        if (id !== undefined && id !== null) {
          this.detenerTemporizador(id);
        }

        this.datosFiltrados = this.datosFiltrados.filter(
          (p) => !(p.id_ticket === id && p.status?.nombre === 'Pendiente')
        );

        this.actualizarListas();
      }
    });
  }

  borrarTodas(): void {
    Swal.fire({
      title: '¿Eliminar todas?',
      text: 'Se eliminarán todas las peticiones guardadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar todo',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('peticiones');

        this.datosFiltrados.forEach((p) => {
          if (p.id_ticket !== undefined && p.id_ticket !== null) {
            this.detenerTemporizador(p.id_ticket);
          }
        });

        this.datosFiltrados = [];
        this.actualizarListas();
      }
    });
  }

  marcarComoResuelta(item: Ticket): void {
    if (item.status?.nombre !== 'Resuelto') {
      item.status.nombre = 'Resuelto';
    }

    if (item.id_ticket !== undefined) {
      this.detenerTemporizador(item.id_ticket);
    }

    this.actualizarListas();
  }

  // Utilidades
  actualizarListas(): void {
    this.datosFiltradosPendientes = this.datosFiltrados.filter(
      (p) => p.status?.nombre !== 'Resuelto'
    );

    this.datosResueltos = this.datosFiltrados.filter((p) => p.status?.nombre === 'Resuelto');

    this.actualizarLocalStorage();
  }

  actualizarLocalStorage(): void {
    localStorage.setItem('peticiones', JSON.stringify(this.datosFiltrados));
  }

  calcularTiempoRestante(fechaCierre: string): string {
    if (!fechaCierre || isNaN(new Date(fechaCierre).getTime())) return '—';

    const ahora = new Date().getTime();
    const cierre = new Date(fechaCierre).getTime();
    const diferencia = cierre - ahora;

    if (diferencia <= 0) return 'Expirado';

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    return `${dias}d ${horas}h ${minutos}m ${segundos}s restantes`;
  }

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'pendiente';
      case 'En proceso':
        return 'en-proceso';
      case 'Terminado':
        return 'terminado';
      case 'No disponible':
        return 'no-disponible';
      case 'Resuelto':
        return 'resuelto';
      default:
        return 'estado-desconocido';
    }
  }

  isValidDate(date: any): boolean {
    return date && !isNaN(new Date(date).getTime());
  }
}