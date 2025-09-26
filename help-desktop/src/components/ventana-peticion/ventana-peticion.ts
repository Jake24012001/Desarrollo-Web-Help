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
  tipoPeticion = '';
  detallePeticion = '';

  constructor(private router: Router) {}

  filtrarEquipos(): void {
    const usuario = this.usuariosConEquipos.find((u) => u.usuario === this.usuarioSeleccionado);
    this.equiposFiltrados = usuario ? usuario.equipos : [];
    this.equipoSeleccionado = '';
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
        this.router.navigate(['/help-menu']);
      }
    });
  }

  enviarPeticion(): void {
    const tipo = (document.getElementById('tipoPeticion') as HTMLInputElement)?.value.trim();
    const detalle = (
      document.getElementById('detallePeticion') as HTMLTextAreaElement
    )?.value.trim();

    if (!tipo || !this.usuarioSeleccionado || !this.equipoSeleccionado || !detalle) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos antes de enviar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // 👇 Aquí construyes la petición con el campo estado
    const nuevaPeticion = {
      fechaEntrega: new Date().toISOString(),
      tipo,
      descripcion: detalle,
      recibidoPor: this.usuarioSeleccionado,
      departamento: 'TI',
      elaboradoPor: 'Admin',
      equipo: this.equipoSeleccionado,
      estado: 'Pendiente', // ← actualizado
    };

    const peticiones = JSON.parse(localStorage.getItem('peticiones') || '[]');
    peticiones.push(nuevaPeticion);
    localStorage.setItem('peticiones', JSON.stringify(peticiones));

    Swal.fire({
      title: 'Petición registrada',
      text: 'Tu solicitud ha sido guardada correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      this.router.navigate(['/help-menu']);
    });
  }

  actualizarEstado(nuevoEstado: string): void {
    const estadoElemento = document.getElementById('estado-actual');
    if (!estadoElemento) return;

    estadoElemento.classList.remove('pendiente', 'en-proceso', 'terminado', 'no-disponible');
    estadoElemento.textContent = nuevoEstado;

    switch (nuevoEstado) {
      case 'Pendiente':
        estadoElemento.classList.add('pendiente');
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
      case 'Pendiente':
        return 'pendiente';
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
