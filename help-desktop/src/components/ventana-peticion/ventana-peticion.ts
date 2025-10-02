import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../app/services/usuario.service';
import { EquipoService, InventoryUnit } from '../../app/services/equipos.service';
import { Usuario } from '../../interface/Usuario';

@Component({
  selector: 'app-ventana-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventana-peticion.html',
  styleUrl: './ventana-peticion.css',
})
export class VentanaPeticion implements OnInit {
  usuarios: Usuario[] = [];
  equiposInventario: InventoryUnit[] = [];
  
  usuarioSeleccionado = '';
  equipoSeleccionado = '';
  tipoPeticion = '';
  detallePeticion = '';
  
  // Para crear nuevo equipo - ACTUALIZADO con campos correctos
  mostrarFormularioEquipo = false;
  nuevoEquipo: InventoryUnit = {
    stock: 1,
    serial: '',
    status: 'DISPONIBLE',
    municipalCode: '',
    maxStock: 10,
    minStock: 1
  };

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private equipoService: EquipoService
  ) {}

  ngOnInit(): void {
    // Cargar usuarios
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    // Cargar equipos de inventario
    this.cargarEquipos();
  }

  cargarEquipos(): void {
    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;
    });
  }

  mostrarFormEquipo(): void {
    this.mostrarFormularioEquipo = true;
  }

  ocultarFormEquipo(): void {
    this.mostrarFormularioEquipo = false;
    this.nuevoEquipo = {
      stock: 1,
      serial: '',
      status: 'DISPONIBLE',
      municipalCode: '',
      maxStock: 10,
      minStock: 1
    };
  }

  crearEquipo(): void {
    if (!this.nuevoEquipo.serial?.trim()) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'El número de serie es obligatorio.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const equipoParaCrear: InventoryUnit = {
      stock: this.nuevoEquipo.stock || 1,
      serial: this.nuevoEquipo.serial?.trim(),
      status: this.nuevoEquipo.status || 'DISPONIBLE',
      municipalCode: this.nuevoEquipo.municipalCode?.trim(),
      maxStock: this.nuevoEquipo.maxStock || 10,
      minStock: this.nuevoEquipo.minStock || 1
    };

    console.log('Enviando equipo:', equipoParaCrear);

    this.equipoService.create(equipoParaCrear).subscribe({
      next: (equipoCreado) => {
        Swal.fire({
          title: 'Equipo creado',
          text: 'El equipo se ha creado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
        
        // Recargar la lista de equipos
        this.cargarEquipos();
        
        // Seleccionar automáticamente el equipo recién creado
        this.equipoSeleccionado = equipoCreado.id?.toString() || '';
        
        // Ocultar formulario
        this.ocultarFormEquipo();
      },
      error: (error) => {
        console.error('Error al crear equipo:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el equipo. Verifica que el número de serie sea único.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      }
    });
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
    const detalle = (document.getElementById('detallePeticion') as HTMLTextAreaElement)?.value.trim();

    if (!tipo || !this.usuarioSeleccionado || !this.equipoSeleccionado || !detalle) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos antes de enviar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const equipoSeleccionadoObj = this.equiposInventario.find(e => e.id?.toString() === this.equipoSeleccionado);

    const nuevaPeticion = {
      fechaEntrega: new Date().toISOString(),
      tipo,
      descripcion: detalle,
      recibidoPor: this.usuarioSeleccionado,
      departamento: 'TI',
      elaboradoPor: 'Admin',
      equipo: equipoSeleccionadoObj?.serial || '', // CAMBIADO: usar serial en lugar de nombre
      estado: 'Pendiente',
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

  // Métodos existentes...
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