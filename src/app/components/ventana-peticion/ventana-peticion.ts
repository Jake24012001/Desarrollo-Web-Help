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
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { Environment } from '../../environments/environment';

import { Usuario } from '../../interface/Usuario';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
import { Ticket } from '../../interface/Ticket';
import { UsuarioRol } from '../../interface/UsuarioRol';
import { TicketPriority } from '../../interface/TicketPriority';
import { Rol } from '../../interface/Rol';

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
  usuarioSeleccionado: Usuario | null = null;

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
    , private authService: AuthService
    , public authorizationService: AuthorizationService
  ) {}

  // Ciclo de vida
  /**
   * Inicializa datos necesarios para el formulario de creación:
   * - carga usuarios, prioridades y equipos
   * - rellena el usuario creador con el usuario autenticado si es posible
   */
  ngOnInit(): void {
    // Obtener usuario actual y rellenar el campo "usuario creador"
    const currentUser = this.authService.getCurrentUser();
    
    // Cargar lista de usuarios
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
      
      // Si hay un usuario autenticado, buscarlo en la lista
      if (currentUser) {
        const usuarioActual = usuarios.find(
          (u) => u.idUsuario === currentUser.idUsuario || u.email === currentUser.email
        );
        if (usuarioActual) {
          this.usuarioSeleccionado = usuarioActual;
        } else {
          // Si no lo encuentra, crear un objeto Usuario con los datos disponibles
          this.usuarioSeleccionado = {
            idUsuario: currentUser.idUsuario ?? 0,
            nombres: currentUser.nombres,
            apellidos: currentUser.apellidos,
            email: currentUser.email,
            cedula: '',
            estado: currentUser.estado,
            clave: '',
            nombre: `${currentUser.nombres || ''} ${currentUser.apellidos || ''}`.trim(),
            unidadAdministrativa: {},
          };
        }
      }
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
    // Handler principal para crear tickets. Valida el formulario, construye
    // el payload y delega en TicketService.create().
    console.log('crearTicket() invoked');
    // Validar campos requeridos
    if (!this.tipoPeticion || !this.tipoPeticion.trim()) {
      Swal.fire('Error', 'Por favor ingrese el tipo de petición.', 'error');
      return;
    }
    if (!this.detallePeticion || !this.detallePeticion.trim()) {
      Swal.fire('Error', 'Por favor ingrese el detalle de la petición.', 'error');
      return;
    }
    if (!this.usuarioSeleccionado) {
      Swal.fire('Error', 'Por favor seleccione un usuario creador.', 'error');
      return;
    }
    if (!this.productoSeleccionado) {
      Swal.fire('Error', 'Por favor seleccione una categoría de equipo.', 'error');
      return;
    }
    if (!this.equipoSeleccionado) {
      Swal.fire('Error', 'Por favor seleccione un equipo disponible.', 'error');
      return;
    }
    if (!this.prioridadSeleccionada) {
      Swal.fire('Error', 'Por favor seleccione una prioridad.', 'error');
      return;
    }

    // Construir ticket base
    const baseTicket: Ticket = {
      title: this.tipoPeticion,
      descripcion: this.detallePeticion,
      status: this.getEstadoPendiente(),
      priority: this.prioridadSeleccionada,
      usuario_creador: this.usuarioSeleccionado
        ? ({ idUsuario: this.usuarioSeleccionado.idUsuario } as any)
        : undefined,
      equipoAfectado: this.equipoSeleccionado,
    };

    // Si el usuario es ADMIN, permite usar la selección de asignación
    if (this.authorizationService.isAdmin()) {
      const nuevoTicket: Ticket = {
        ...baseTicket,
        usuario_asignado: this.usuarioSeleccionados?.usuario
          ? ({ idUsuario: this.usuarioSeleccionados.usuario.idUsuario } as any)
          : undefined,
      };
      console.log('Payload POST (admin):', nuevoTicket);
      this.ticketService.create(nuevoTicket).subscribe({
        next: (ticketCreado) => {
          console.log('Ticket creado (admin):', ticketCreado);
          this.router.navigate(['/help-menu']);
        },
        error: (err) => {
          console.error('Error al crear ticket (admin):', err);
        },
      });
      return;
    }

    // Si no es admin (e.g., Cliente), no se permite seleccionar asignado.
    // Asignar automáticamente al agente con menos tickets abiertos (si existen agentes)
    this.ticketService.getAll().subscribe((allTickets) => {
      const agentes = this.rolesus
        .filter((r) => r.rol?.nombre?.toUpperCase() === 'AGENTE')
        .map((r) => r.usuario)
        .filter(Boolean);

      if (agentes.length === 0) {
        // No hay agentes registrados: crear sin asignado
          const nuevoTicket: Ticket = { ...baseTicket, usuario_asignado: undefined };
        this.ticketService.create(nuevoTicket).subscribe({
          next: (ticketCreado) => {
            console.log('Ticket creado (sin agentes):', ticketCreado);
            this.router.navigate(['/help-menu']);
          },
          error: (err) => console.error('Error crear ticket (sin agentes):', err),
        });
        return;
      }

      const cargaPorAgente = agentes.map((agente) => ({
        agente,
        count: allTickets.filter(
          (t) => (((t.usuario_asignado as any)?.idUsuario ?? t.usuario_asignado?.id_usuario) === agente.idUsuario) && t.status?.nombre === Environment.NOMBRE_STATUS_ABIERTO
        ).length,
      }));

      cargaPorAgente.sort((a, b) => a.count - b.count);
      const agenteElegido = cargaPorAgente[0]?.agente ?? null;

      const nuevoTicket: Ticket = {
        ...baseTicket,
        usuario_asignado: agenteElegido
          ? ({ idUsuario: agenteElegido.idUsuario } as any)
          : undefined,
      };
      console.log('Payload POST (auto-assign):', nuevoTicket);
      this.ticketService.create(nuevoTicket).subscribe({
        next: (ticketCreado) => {
          console.log('Ticket creado (auto-assign):', ticketCreado);
          this.router.navigate(['/help-menu']);
        },
        error: (err) => console.error('Error crear ticket (auto-assign):', err),
      });
    });
  }

  // Filtrado y utilidades de UI
  filtrarEquiposPorTipo(): void {
    if (!this.productoSeleccionado) {
      this.equiposFiltrados = [];
      return;
    }

    // Filtrar por tipo de producto Y por custodio del usuario creador
    this.equiposFiltrados = this.equiposInventario.filter((equipo) => {
      // Verificar que el tipo de producto coincida
      const tipoCoincide = equipo.product?.type === this.productoSeleccionado;
      if (!tipoCoincide) return false;

      // Si no hay usuario seleccionado, no filtrar por custodio
      if (!this.usuarioSeleccionado) return true;

      // Verificar que el custodio coincida con el usuario creador (por email o cedula)
      const custodio = equipo.custodian;
      if (!custodio) return false;

      const usuarioEmail = this.usuarioSeleccionado.email?.toLowerCase() || '';
      const usuarioCedula = this.usuarioSeleccionado.cedula?.toLowerCase() || '';
      const custodioEmail = custodio.correo?.toLowerCase() || '';
      const custodioCedula = custodio.cedula?.toLowerCase() || '';

      return (
        (usuarioEmail && usuarioEmail === custodioEmail) ||
        (usuarioCedula && usuarioCedula === custodioCedula)
      );
    });
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

  /**
   * Filtra los roles para mostrar solo ADMIN y AGENTE en el select de asignación
   */
  getRolesAdminYAgente(): UsuarioRol[] {
    return this.rolesus.filter(item => {
      const rolNombre = (item.rol?.nombre || '').toUpperCase();
      return rolNombre === 'ADMIN' || rolNombre === 'AGENTE' || rolNombre === 'AGENT';
    });
  }
}

