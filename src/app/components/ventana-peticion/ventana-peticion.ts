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
  ticketPrioridades: TicketPriority[] = [];
  usuarios: Usuario[] = [];
  rolesus: UsuarioRol[] = [];

  equiposInventario: InventoryUnit[] = [];
  equiposFiltrados: InventoryUnit[] = [];
  productosUnicos: Product[] = [];
  
  productoNombreSeleccionado: string = '';
  equiposDelProducto: InventoryUnit[] = [];

  datosResueltos: any[] = [];
  datosFiltradosPendientes: any[] = [];

  usuarioSeleccionado: Usuario | null = null;

  usuarioSeleccionados: { id: UsuarioRol; usuario: Usuario; rol: Rol } | null = null;

  equipoSeleccionado: InventoryUnit | null = null;

  productoSeleccionado: string = '';
  mostrarFormularioEquipo = false;

  tipoPeticion = '';
  detallePeticion = '';
  prioridadSeleccionada: TicketPriority | null = null;
  fechaEstimada: string = '';

  camposTocados = {
    tipoPeticion: false,
    detallePeticion: false,
    usuario: false,
    producto: false,
    productoNombre: false,
    equipo: false,
    prioridad: false,
    fechaEstimada: false
  };

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

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
      
      if (currentUser) {
        const usuarioActual = usuarios.find(
          (u) => u.idUsuario === currentUser.idUsuario || u.email === currentUser.email
        );
        if (usuarioActual) {
          this.usuarioSeleccionado = usuarioActual;
        } else {
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

    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;
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

    this.usuarioservicesR.getAll().subscribe((roles) => {
      this.rolesus = roles;
    });
    
    this.ticketPriority.getAll().subscribe((name) => {
      console.log('Prioridades cargadas:', name);
      this.ticketPrioridades = name;
      if (!this.authorizationService.isAdmin()) {
        const prioridadPorNombre = this.ticketPrioridades.find(p => {
          const n = (p.name || '').toUpperCase();
          return n.includes('BAJA') || n.includes('LOW') || n.includes('NORMAL') || n.includes('MEDIA');
        });
        if (prioridadPorNombre) {
          this.prioridadSeleccionada = prioridadPorNombre;
        } else if (this.ticketPrioridades.length > 0) {
          this.prioridadSeleccionada = this.ticketPrioridades[this.ticketPrioridades.length - 1];
        }
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

  crearTicket(): void {
    console.log('crearTicket() invoked');
    
    Object.keys(this.camposTocados).forEach(key => {
      this.camposTocados[key as keyof typeof this.camposTocados] = true;
    });
    
    if (!this.esFormularioValido()) {
      return;
    }

    const baseTicket: Ticket = {
      title: this.tipoPeticion,
      descripcion: this.detallePeticion,
      status: this.getEstadoPendiente(),
      priority: (this.authorizationService.isAdmin() && this.prioridadSeleccionada) ? this.prioridadSeleccionada : undefined,
      usuario_creador: this.usuarioSeleccionado
        ? ({ idUsuario: this.usuarioSeleccionado.idUsuario } as any)
        : undefined,
      equipoAfectado: this.equipoSeleccionado ?? undefined,
      fecha_estimada: (this.authorizationService.isAdmin() && this.fechaEstimada) ? this.convertirFechaISO(this.fechaEstimada) : undefined,
    };

    if (this.authorizationService.isAdmin()) {
      const usuarioActual = this.authService.getCurrentUser();
      
      const nuevoTicket: Ticket = {
        ...baseTicket,
        usuario_asignado: this.usuarioSeleccionados?.usuario
          ? ({ 
              idUsuario: this.usuarioSeleccionados.usuario.idUsuario,
              id_usuario: this.usuarioSeleccionados.usuario.idUsuario,
              id: this.usuarioSeleccionados.usuario.idUsuario
            } as any)
          : undefined,
        usuario_asigno: this.usuarioSeleccionados?.usuario && usuarioActual
          ? ({ 
              idUsuario: usuarioActual.idUsuario,
              id_usuario: usuarioActual.idUsuario,
              id: usuarioActual.idUsuario
            } as any)
          : undefined,
      };
      console.log('✅ Payload POST (admin) con usuario_asigno:', nuevoTicket);
      console.log('   - usuario_asignado:', nuevoTicket.usuario_asignado);
      console.log('   - usuario_asigno:', nuevoTicket.usuario_asigno);
      
      this.ticketService.create(nuevoTicket).subscribe({
        next: (ticketCreado) => {
          console.log('✅ Ticket creado (admin):', ticketCreado);
          console.log('   - usuario_asigno guardado:', ticketCreado.usuario_asigno);
          
          if (ticketCreado.usuario_asignado && !ticketCreado.usuario_asigno && usuarioActual) {
            console.log('⚠️ usuario_asigno no se guardó en CREATE, actualizando...');
            
            const ticketActualizado = {
              ...ticketCreado,
              usuario_asigno: {
                idUsuario: usuarioActual.idUsuario,
                id_usuario: usuarioActual.idUsuario,
                id: usuarioActual.idUsuario
              }
            };
            
            this.ticketService.update(ticketCreado.id_ticket!, ticketActualizado).subscribe({
              next: (ticketFinal) => {
                console.log('✅ usuario_asigno actualizado correctamente:', ticketFinal.usuario_asigno);
                this.router.navigate(['/help-menu']);
              },
              error: (errUpdate) => {
                console.error('❌ Error al actualizar usuario_asigno:', errUpdate);
                this.router.navigate(['/help-menu']);
              }
            });
          } else {
            this.router.navigate(['/help-menu']);
          }
        },
        error: (err) => {
          console.error('❌ Error al crear ticket (admin):', err);
        },
      });
      return;
    }

    this.ticketService.getAll().subscribe((allTickets) => {
      const agentes = this.rolesus
        .filter((r) => r.rol?.nombre?.toUpperCase() === 'AGENTE')
        .map((r) => r.usuario)
        .filter(Boolean);

      if (agentes.length === 0) {
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

  filtrarEquiposPorTipo(): void {
    if (!this.productoSeleccionado) {
      this.equiposFiltrados = [];
      this.equipoSeleccionado = null;
      this.productoNombreSeleccionado = '';
      this.equiposDelProducto = [];
      return;
    }

    this.equiposFiltrados = this.equiposInventario.filter((equipo) => {
      const tipoCoincide = equipo.product?.type === this.productoSeleccionado;
      if (!tipoCoincide) return false;

      if (!this.usuarioSeleccionado) return true;

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
    
    this.equipoSeleccionado = null;
    this.productoNombreSeleccionado = '';
    this.equiposDelProducto = [];
  }

  onEquipoSeleccionado(): void {
  }

  obtenerNombresUnicos(): string[] {
    const nombresSet = new Set<string>();
    this.equiposFiltrados.forEach(equipo => {
      if (equipo.product?.name) {
        nombresSet.add(equipo.product.name);
      }
    });
    return Array.from(nombresSet).sort();
  }

  onProductoNombreSeleccionado(): void {
    this.equipoSeleccionado = null;
    if (!this.productoNombreSeleccionado) {
      this.equiposDelProducto = [];
      return;
    }
    this.equiposDelProducto = this.equiposFiltrados.filter(
      equipo => equipo.product?.name === this.productoNombreSeleccionado
    );
  }

  formatearEquipoDetalle(equipo: InventoryUnit): string {
    const partes: string[] = [];
    if (equipo.serial) partes.push(`Serial: ${equipo.serial}`);
    if (equipo.product?.model) partes.push(`Modelo: ${equipo.product.model}`);
    if (equipo.municipalCode) partes.push(`Código: ${equipo.municipalCode}`);
    return partes.length > 0 ? partes.join(' | ') : 'Sin detalles';
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

  marcarCampoTocado(campo: keyof typeof this.camposTocados): void {
    this.camposTocados[campo] = true;
  }

  esCampoInvalido(campo: keyof typeof this.camposTocados): boolean {
    if (!this.camposTocados[campo]) return false;
    
    switch (campo) {
      case 'tipoPeticion':
        return !this.tipoPeticion || !this.tipoPeticion.trim();
      case 'detallePeticion':
        return !this.detallePeticion || !this.detallePeticion.trim();
      case 'usuario':
        return !this.usuarioSeleccionado;
      case 'producto':
        return !this.productoSeleccionado;
      case 'productoNombre':
        return !this.productoNombreSeleccionado && this.equiposFiltrados.length > 0;
      case 'equipo':
        return !this.equipoSeleccionado && this.equiposDelProducto.length > 0;
      case 'prioridad':
        return this.authorizationService.isAdmin() && !this.prioridadSeleccionada;
      case 'fechaEstimada':
        if (!this.authorizationService.isAdmin()) return false;
        if (!this.fechaEstimada || !this.fechaEstimada.trim()) return true;
        return this.fechaEstimadaExpirada();
      default:
        return false;
    }
  }

  esFormularioValido(): boolean {
    if (!this.tipoPeticion || !this.tipoPeticion.trim()) return false;
    if (!this.detallePeticion || !this.detallePeticion.trim()) return false;
    if (!this.usuarioSeleccionado) return false;
    if (!this.productoSeleccionado) return false;
    if (!this.equipoSeleccionado) return false;
    
    if (this.authorizationService.isAdmin()) {
      if (!this.prioridadSeleccionada) return false;
      if (!this.fechaEstimada || !this.fechaEstimada.trim()) return false;
    }
    
    return true;
  }

  obtenerFechaMinima(): string {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  convertirFechaISO(fechaLocal: string): string {
    if (!fechaLocal) return '';
    return `${fechaLocal}:00`;
  }

  fechaEstimadaExpirada(): boolean {
    if (!this.fechaEstimada) return false;
    const fechaSeleccionada = new Date(this.fechaEstimada);
    const ahora = new Date();
    return fechaSeleccionada < ahora;
  }

  formatearEquipo(equipo: InventoryUnit): string {
    let texto = '';
    
    if (equipo.serial && equipo.serial.trim() !== '' && equipo.serial !== 'null') {
      texto = `${equipo.serial} - `;
    }
    
    texto += equipo.product.name;
    
    if (equipo.product.brand || equipo.product.model) {
      const detalles: string[] = [];
      if (equipo.product.brand) detalles.push(equipo.product.brand);
      if (equipo.product.model) detalles.push(equipo.product.model);
      texto += ` (${detalles.join(' - ')})`;
    }
    
    return texto;
  }

  getRolesAdminYAgente(): UsuarioRol[] {
    return this.rolesus.filter(item => {
      const rolNombre = (item.rol?.nombre || '').toUpperCase();
      return rolNombre === 'ADMIN' || rolNombre === 'AGENTE' || rolNombre === 'AGENT';
    });
  }
}

