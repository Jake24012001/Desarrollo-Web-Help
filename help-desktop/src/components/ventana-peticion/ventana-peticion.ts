import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-ventana-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventana-peticion.html',
  styleUrl: './ventana-peticion.css',
})
export class VentanaPeticion {
  usuariosConEquipos = [
    {
      usuario: 'Kevin Vargas',
      equipos: ['Laptop MSI GF66', 'Router Machala'],
    },
    {
      usuario: 'Ana Torres',
      equipos: ['Sensor de humedad', 'Switch de respaldo'],
    },
  ];

  usuarioSeleccionado = '';
  equiposFiltrados: string[] = [];
  equipoSeleccionado = '';
  constructor(private router: Router) {}

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
        this.router.navigate(['/help-menu']);
      }
    });
  }
  actualizarEstado(nuevoEstado: string): void {
    const estadoElemento = document.getElementById('estado-actual');
    if (!estadoElemento) return;

    // Limpiar clases anteriores
    estadoElemento.classList.remove('disponible', 'en-proceso', 'terminado');

    // Actualizar texto
    estadoElemento.textContent = nuevoEstado;

    // Aplicar clase correspondiente
    switch (nuevoEstado) {
      case 'Disponible':
        estadoElemento.classList.add('disponible');
        break;
      case 'En proceso':
        estadoElemento.classList.add('en-proceso');
        break;
      case 'Terminado':
        estadoElemento.classList.add('terminado');
        break;
      case 'No disponible':
        estadoElemento.classList.add('no-disponible');
        break;
      default:
        estadoElemento.style.backgroundColor = 'transparent';
        estadoElemento.style.color = '#333';
    }
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

  filtrarEquipos(): void {
    const usuario = this.usuariosConEquipos.find((u) => u.usuario === this.usuarioSeleccionado);
    this.equiposFiltrados = usuario ? usuario.equipos : [];
    this.equipoSeleccionado = ''; // Reinicia selección
  }
}
