import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import { UsuarioService } from '../../services/usuario.service';
import { EquipoService } from '../../services/equipos.service';
import { TicketService } from '../../services/ticket.service';
import { UsuarioRolService } from '../../services/usuariorol.service';
import { TicketPriorityService } from '../../services/ticket-priority.service';

import { Usuario } from '../../interface/Usuario';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
import { Ticket } from '../../interface/Ticket';
import { UsuarioRol } from '../../interface/UsuarioRol';
import { TicketPriority } from '../../interface/TicketPriority';
import { Rol } from '../../interface/Rol';
import { Environment } from '../../environments/environment'; // constantes de entorno

@Component({
  selector: 'app-ventana-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventana-peticion.html',
  styleUrl: './ventana-peticion.css',
})
export class VentanaPeticion implements OnInit {
  // Estado y datos mostrados en la UI
  ticketPrioridades: TicketPriority[] = [];
  usuarios: Usuario[] = [];
  rolesus: UsuarioRol[] = [];

  equiposInventario: InventoryUnit[] = [];
  equiposFiltrados: InventoryUnit[] = [];
  productosUnicos: Product[] = [];

  datosResueltos: any[] = [];
  datosFiltradosPendientes: any[] = [];

  // Valores de formulario / selecciones
  usuarioSeleccionado: { id_usuario: number; nombre: string } | null = null;

  usuarioSeleccionados: { id: UsuarioRol; usuario: Usuario; rol: Rol } | null = null;

  equipoSeleccionado: {
    id: number;
    serial: string;
    product: {
      id: number;
      name: string;
      brand?: string;
      model?: string;
    };
  } | null = null;

  productoSeleccionado: string = '';
  mostrarFormularioEquipo = false;

  tipoPeticion = '';
  detallePeticion = '';
  prioridadSeleccionada: TicketPriority | null = null;

  // Constructor e inyección de servicios
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private equipoService: EquipoService,
    private ticketService: TicketService,
    private usuarioservicesR: UsuarioRolService,
    private ticketPriority: TicketPriorityService
  ) {}

  // Ciclo de vida
  ngOnInit(): void {
    // Cargar lista de usuarios
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    // Cargar inventario de equipos
    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;
      // Filtrar por usuario y obtener tipos únicos de producto
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
      console.log('Prioridades cargadas:', name);
      this.ticketPrioridades = name;
    });
  }
  // Acciones (crear/cancelar)
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

  crearTicket(): void {
    const nuevoTicket: Ticket = {
      title: this.tipoPeticion,
      descripcion: this.detallePeticion,
      status: this.getEstadoPendiente(),
      priority: this.prioridadSeleccionada ?? undefined,
      usuario_creador: this.usuarioSeleccionado ?? undefined,
      usuario_asignado: this.usuarioSeleccionados?.usuario ?? undefined,
      equipoAfectado: this.equipoSeleccionado ?? undefined,
    };

  // Enviar creación al backend
  this.ticketService.create(nuevoTicket).subscribe({
      next: (ticketCreado) => {
        console.log('Ticket creado:', ticketCreado);
        this.router.navigate(['/help-menu']);
        // Aquí podrías redirigir, mostrar mensaje, etc.
      },
      error: (err) => {
        console.error('Error al crear ticket:', err);
      },
    });
  }

  // Filtrado y utilidades de UI
  filtrarEquiposPorTipo(): void {
    if (!this.productoSeleccionado) {
      this.equiposFiltrados = [];
      return;
    }

    this.equiposFiltrados = this.equiposInventario.filter(
      (equipo) => equipo.product?.type === this.productoSeleccionado
    );
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

  // Formatear el texto del equipo para el select
  formatearEquipo(equipo: InventoryUnit): string {
    let texto = '';
    
    // Solo agregar serial si existe y no es null
    if (equipo.serial && equipo.serial.trim() !== '' && equipo.serial !== 'null') {
      texto = `${equipo.serial} - `;
    }
    
    // Agregar nombre del producto
    texto += equipo.product.name;
    
    // Agregar marca y modelo si existen
    if (equipo.product.brand || equipo.product.model) {
      const detalles: string[] = [];
      if (equipo.product.brand) detalles.push(equipo.product.brand);
      if (equipo.product.model) detalles.push(equipo.product.model);
      texto += ` (${detalles.join(' - ')})`;
    }
    
    return texto;
  }
}
