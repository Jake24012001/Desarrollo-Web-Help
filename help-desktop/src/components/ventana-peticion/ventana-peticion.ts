import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../app/services/usuario.service';
import { EquipoService } from '../../app/services/equipos.service';
import { Usuario } from '../../interface/Usuario';
import { TicketService } from '../../app/services/ticket.service';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
import { Ticket } from '../../interface/Ticket';
import { UsuarioRol } from '../../interface/UsuarioRol';
import { UsuarioRolService } from '../../app/services/usuariorol.service';
import { TicketPriorityService } from '../../app/services/ticket-priority.service';
import { TicketPriority } from '../../interface/TicketPriority';
import { Rol } from '../../interface/Rol';
import { Persona } from '../../interface/Persona';
import { environment } from '../../environments/environment'; // agregado como variable global

@Component({
  selector: 'app-ventana-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ventana-peticion.html',
  styleUrl: './ventana-peticion.css',
})
export class VentanaPeticion implements OnInit {
  ticketPrioridades: TicketPriority[] = [];
  usuarios: Usuario[] = [];
  rolesus: UsuarioRol[] = [];
  equiposInventario: InventoryUnit[] = [];
  equiposFiltrados: InventoryUnit[] = [];
  usuarioSeleccionado: { id_usuario: number; nombre: string } | null = null;

  equipoSeleccionado: {
    id: number;
    serial: string;
    product: {
      id: number;
      name: string;
    };
  } | null = null;
  tipoPeticion = '';
  detallePeticion = '';

  usuarioSeleccionados: { id: UsuarioRol; usuario: Usuario; rol: Rol } | null = null;
  productosUnicos: Product[] = [];
  productoSeleccionado: string = '';
  mostrarFormularioEquipo = false;
  prioridadSeleccionada: TicketPriority | null = null;

  personas: Persona[] = [];
  personasFiltradas: Persona[] = [];

  datosResueltos: any[] = [];
  datosFiltradosPendientes: any[] = [];

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private equipoService: EquipoService,
    private ticketService: TicketService,
    private usuarioservicesR: UsuarioRolService,
    private ticketPriority: TicketPriorityService
  ) {}

  ngOnInit(): void {
    // Cargar todos los usuarios
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    // Cargar todos los equipos
    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;

      // Filtrar equipos por usuario (ej. por cedula)
      this.filtrarPorUsuario(); // ← reemplaza con cedula dinámica si aplica

      // Extraer productos únicos por type
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

    // Cargar roles de usuarios
    this.usuarioservicesR.getAll().subscribe((roles) => {
      this.rolesus = roles;
    });

    // Cargar prioridades de ticket
    this.ticketPriority.getAll().subscribe((name) => {
      console.log('Prioridades cargadas:', name);
      this.ticketPrioridades = name;
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
      id_status: environment.ID_STATUS_ABIERTO,
      nombre: environment.NOMBRE_STATUS_ABIERTO,
    };
  }

  filtrarPorUsuario(): void {
    const coincidencias: { usuario: Usuario; persona: Persona }[] = [];

    this.usuarios.forEach((usuario) => {
      const personaCoincidente = this.personas.find(
        (persona) => persona.cedula?.trim() === usuario.cedula?.trim()
      );

      if (personaCoincidente) {
        coincidencias.push({ usuario, persona: personaCoincidente });
      }
    });

    console.log('Coincidencias encontradas:', coincidencias);
  }
}
