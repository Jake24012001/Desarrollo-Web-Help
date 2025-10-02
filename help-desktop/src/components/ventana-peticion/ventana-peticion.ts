import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../app/services/usuario.service';
import { EquipoService } from '../../app/services/equipos.service';
import { Usuario } from '../../interface/Usuario';
import { TicketService } from '../../app/services/ticket.service';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
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
  equiposFiltrados: InventoryUnit[] = [];

  usuarioSeleccionado = '';
  equipoSeleccionado = '';
  tipoPeticion = '';
  detallePeticion = '';

  productosUnicos: Product[] = [];
  productoSeleccionado: string = '';

  // Para crear nuevo equipo - ACTUALIZADO con campos correctos
  mostrarFormularioEquipo = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private equipoService: EquipoService,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;

      // Extraer productos únicos por type
      const tiposSet = new Set<string>();
      this.productosUnicos = equipos
        .map((e) => e.product)
        .filter((p) => {
          if (!p?.type || tiposSet.has(p.type)) return false;
          tiposSet.add(p.type);
          return true;
        });
    });
  }

  cargarEquipos(): void {
    this.equipoService.getAll().subscribe((municipalCode) => {
      this.equiposInventario = municipalCode;
    });
  }

  mostrarFormEquipo(): void {
    this.mostrarFormularioEquipo = true;
  }

  ocultarFormEquipo(): void {
    this.mostrarFormularioEquipo = false;
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

    const equipoSeleccionadoObj = this.equiposInventario.find(
      (e) => e.id?.toString() === this.equipoSeleccionado
    );

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

  crearTicket(): void {
    const tipo = this.tipoPeticion.trim();
    const detalle = this.detallePeticion.trim();

    if (!tipo || !this.usuarioSeleccionado || !this.equipoSeleccionado || !detalle) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos antes de crear el ticket.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const usuarioCreadorId = Number(this.usuarioSeleccionado); // Asegúrate que sea un número
    const usuarioAsignadoId = Number(this.usuarioSeleccionado); // Puedes cambiar esto si hay lógica distinta
    const equipo = this.equiposInventario.find((e) => e.id?.toString() === this.equipoSeleccionado);

    if (!equipo) {
      Swal.fire({
        title: 'Equipo no encontrado',
        text: 'El equipo seleccionado no existe en el inventario.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const ticketData = {
      title: tipo,
      descripcion: detalle,
      usuarioCreadorId,
      usuarioAsignadoId,
      equipoAfectadoId: equipo.id!,
      statusId: 1, // "Pendiente"
      priorityId: 2, // "Media"
    };

    this.ticketService.createFromPeticion(ticketData).subscribe({
      next: (ticketCreado) => {
        Swal.fire({
          title: 'Ticket creado',
          text: `Se ha registrado correctamente el ticket #${ticketCreado.id_ticket}`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.router.navigate(['/help-menu']);
        });
      },
      error: (err) => {
        console.error('Error al crear el ticket:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el ticket. Intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }

  filtrarEquiposPorTipo(): void {
    this.equiposFiltrados = this.equiposInventario.filter(
      (equipo) => equipo.product?.type === this.productoSeleccionado
    );
  }
}
