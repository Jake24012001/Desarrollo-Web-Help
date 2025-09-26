import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Peticion } from '../../interface/Peticion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './vista-principal.html',
  styleUrl: './vista-principal.css',
})
export class VistaPrincipal implements OnDestroy {
  constructor(private router: Router) {}

  placeholderText = 'Buscar...';
  mensajes = ['Equipos', 'Peticiones', 'Solicitudes', 'Solucionado'];
  mensajeIndex = 0;

  datosFiltrados: Peticion[] = [];
  datosFiltradosPendientes: Peticion[] = [];
  datosResueltos: Peticion[] = [];

  temporizadorPlaceholder: any;
  temporizadoresPorPeticion = new Map<number, any>();

  ngOnInit(): void {
    const peticionesGuardadas = JSON.parse(localStorage.getItem('peticiones') || '[]');

    this.datosFiltrados = peticionesGuardadas.map((p: any) => ({
      ...p,
      fechaEntrega: new Date(p.fechaEntrega),
    }));

    this.actualizarListas();

    this.datosFiltradosPendientes.forEach((p) => this.iniciarTemporizador(p.id));

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

  iniciarTemporizador(id: number): void {
    if (this.temporizadoresPorPeticion.has(id)) return;

    const intervalo = setInterval(() => {
      const peticion = this.datosFiltrados.find((p) => p.id === id);
      if (peticion && peticion.estado !== 'Resuelto') {
        this.datosFiltrados = [...this.datosFiltrados]; // fuerza refresco visual
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

  actualizarListas(): void {
    this.datosFiltradosPendientes = this.datosFiltrados.filter((p) => p.estado !== 'Resuelto');
    this.datosResueltos = this.datosFiltrados.filter((p) => p.estado === 'Resuelto');
    this.actualizarLocalStorage();
  }

  actualizarLocalStorage(): void {
    localStorage.setItem('peticiones', JSON.stringify(this.datosFiltrados));
  }

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

  modificarPeticion(item?: Peticion): void {
    Swal.fire({
      title: 'Modificar petición',
      text: '¿Deseas editar esta solicitud?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });
    // Aquí podrías agregar lógica para redirigir con el ID de la petición
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
        const id = this.datosFiltradosPendientes[index].id;

        // Detener temporizador individual
        this.detenerTemporizador(id);

        // Eliminar solo si está en estado Pendiente
        this.datosFiltrados = this.datosFiltrados.filter(
          (p) => !(p.id === id && p.estado === 'Pendiente')
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
        this.datosFiltrados.forEach((p) => this.detenerTemporizador(p.id));
        this.datosFiltrados = [];
        this.actualizarListas();
      }
    });
  }

  calcularTiempo(fecha: Date): string {
    if (!fecha || isNaN(new Date(fecha).getTime())) return '—';

    const ahora = new Date().getTime();
    const ingreso = new Date(fecha).getTime();
    const diferencia = ahora - ingreso;

    const segundos = Math.floor(diferencia / 1000) % 60;
    const minutos = Math.floor(diferencia / (1000 * 60)) % 60;
    const horas = Math.floor(diferencia / (1000 * 60 * 60)) % 24;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    return `${dias}d ${horas}h ${minutos}m ${segundos}s`;
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
        return '';
    }
  }

  marcarComoResuelta(item: Peticion): void {
    item.estado = 'Resuelto';
    item.tiempoFinalizado = this.calcularTiempo(item.fechaEntrega);
    this.detenerTemporizador(item.id);
    this.actualizarListas();
  }
}
