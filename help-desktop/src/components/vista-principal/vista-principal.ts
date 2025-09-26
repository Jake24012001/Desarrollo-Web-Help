import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './vista-principal.html',
  styleUrl: './vista-principal.css',
})
export class VistaPrincipal {
  constructor(private router: Router) {}

  placeholderText = 'Buscar...';
  mensajes = ['Equipos', 'Peticiones', 'Solicitudes', 'Solucionado'];
  mensajeIndex = 0;

  datosFiltrados: any[] = [];

  ngOnInit() {
    const peticionesGuardadas = JSON.parse(localStorage.getItem('peticiones') || '[]');

    this.datosFiltrados = peticionesGuardadas.map((p: any) => ({
      ...p,
      fechaEntrega: new Date(p.fechaEntrega),
    }));

    setInterval(() => {
      this.placeholderText = `Buscar ${this.mensajes[this.mensajeIndex]}`;
      this.mensajeIndex = (this.mensajeIndex + 1) % this.mensajes.length;
    }, 5000);

    setInterval(() => {
      this.datosFiltrados = [...this.datosFiltrados];
    }, 1000);

    this.datosFiltrados = peticionesGuardadas.map((p: any) => ({
      ...p,
      fechaEntrega: new Date(p.fechaEntrega),
    }));
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

  modificarPeticion(): void {
    Swal.fire({
      title: 'Modificar petición',
      text: '¿Deseas editar esta solicitud?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });
  }

  borrarPeticion(index: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la petición permanentemente.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const peticiones = JSON.parse(localStorage.getItem('peticiones') || '[]');
        peticiones.splice(index, 1);
        localStorage.setItem('peticiones', JSON.stringify(peticiones));

        this.datosFiltrados = peticiones.map((p: any) => ({
          ...p,
          fechaEntrega: new Date(p.fechaEntrega),
        }));
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

  borrarTodas(): void {
    localStorage.removeItem('peticiones');
    this.datosFiltrados = [];
  }

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Disponible':
        return 'disponible';
      case 'En proceso':
        return 'en-proceso';
      case 'Terminado':
        return 'terminado';
      case 'No disponible':
        return 'no-disponible';
      default:
        return '';
    }
  }
}
