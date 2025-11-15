import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../services/ticket.service';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioRolService } from '../../services/usuariorol.service';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { forkJoin } from 'rxjs';
import { Ticket } from '../../interface/Ticket';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe (template)
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-actualizar-peticion',
  standalone: true,
  // DatePipe en imports
  imports: [FormsModule, CommonModule, DatePipe], 
  templateUrl: './actualizar-peticion.html',
  styleUrls: ['./actualizar-peticion.css'],
})
export class ActualizarPeticion implements OnInit {
  // Valores por defecto para evitar campos undefined en la UI
  datosticket: Ticket = {
    id_ticket: 0, 
    title: '',
    descripcion: '',
    fecha_creacion: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
    status: { id_status: 0, nombre: '' },
    priority: { id_priority: 0, name: '' },
    usuario_creador: { id_usuario: 0, nombre: '' },
    usuario_asignado: { id_usuario: 0, nombre: '' },
    equipoAfectado: { id: 0, serial: '', product: { id: 0, name: '', brand: '', model: '' } },
  };
  
  datosimportados: Ticket[] = [];
  // IDs seleccionados en los selects
  idtick: number = 0;
  selectedStatusId: number = 0;
  selectedPriorityId: number = 0;
  selectedUsuarioId: number = 0;
  selectedEquipoId: number = 0;

  // Flags de rol del usuario
  usuarioLogeado: any = null;
  nombreUsuarioLogeado: string = '';
  esCliente: boolean = false;
  esAdmin: boolean = false;
  esAgent: boolean = false;

  // Listas para selects
  estadosDisponibles: { id_status: number; nombre: string }[] = [];
  prioridadesDisponibles: { id_priority: number; name: string }[] = [];
  usuariosDisponibles: { id_usuario: number; nombre: string; roleLabel?: string; }[] = [];
  equiposDisponibles: {
    id: number;
    serial: string;
    product: { id: number; name: string; brand?: string; model?: string };
  }[] = [];

  constructor(
    private servicesticket: TicketService,
    private usuarioService: UsuarioService,
    private usuarioRolService: UsuarioRolService,
    private authService: AuthService,
    private authorizationService: AuthorizationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener datos del usuario logeado
    this.usuarioLogeado = this.authService.getCurrentUser();
    this.esCliente = this.authorizationService.isCliente();
    this.esAdmin = this.authorizationService.isAdmin();
    this.esAgent = this.authorizationService.isAgente();

    // Mostrar nombre del usuario logeado (fallback)
    if (this.usuarioLogeado) {
      this.nombreUsuarioLogeado = this.usuarioLogeado.nombres || this.usuarioLogeado.nombre || 'Usuario';
    }

    this.idtick = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar usuarios, roles y tickets en paralelo
    forkJoin({ users: this.usuarioService.getAll(), tickets: this.servicesticket.getAll(), userRoles: this.usuarioRolService.getAll() }).subscribe(
      ({ users, tickets, userRoles }) => {
        // Normalizar usuarios
        const mappedUsers = (users || []).map((u: any) => {
          const id = u.id_usuario ?? u.idUsuario ?? u.id ?? 0;
          const nombres = (u.nombres ?? u.nombre ?? '').toString().trim();
          const apellidos = (u.apellidos ?? u.apellido ?? '').toString().trim();
          const cedula = u.cedula ?? u.identificacion ?? '';
          const displayName = `${nombres} ${apellidos}`.trim() || (u.nombre ?? '') || cedula || '';
          return {
            id_usuario: id,
            nombres,
            apellidos,
            cedula,
            nombre: displayName,
          };
        });

  // Detectar usuarios con roles relevantes
        let allowedUserIds = new Set<number>();
        (userRoles || []).forEach((ur: any) => {
          const rolObj = ur.rol ?? ur.role ?? {};
          const rolId = rolObj.idRol ?? rolObj.id ?? rolObj.id_role ?? 0;
          const rolName = (rolObj.nombre ?? rolObj.name ?? '').toString().toLowerCase();
          const usuarioObj = ur.usuario ?? ur.user ?? {};
          const uId = usuarioObj.id_usuario ?? usuarioObj.idUsuario ?? usuarioObj.id ?? 0;
          if (!uId) return;
          // Incluir tanto Admin como Agent/Agente
          if (
            rolId === 1 ||
            rolId === 2 ||
            rolName.includes('admin') ||
            rolName.includes('agent') ||
            rolName.includes('agente')
          ) {
            allowedUserIds.add(uId);
          }
        });

        // Construir mapa de roles por usuario
        const rolesPorUsuario = new Map<number, string[]>();
        (userRoles || []).forEach((ur: any) => {
          const usuarioObj = ur.usuario ?? ur.user ?? {};
          const uId = usuarioObj.id_usuario ?? usuarioObj.idUsuario ?? usuarioObj.id ?? 0;
          if (!uId) return;
          const rolObj = ur.rol ?? ur.role ?? {};
          const rolName = (rolObj.nombre ?? rolObj.name ?? '').toString();
          const arr = rolesPorUsuario.get(uId) ?? [];
          arr.push(rolName);
          rolesPorUsuario.set(uId, arr);
        });

        // Adjuntar roleLabel a mappedUsers
        mappedUsers.forEach((mu: any) => {
          const r = rolesPorUsuario.get(mu.id_usuario) ?? [];
          // Priorizar Admin > Agent > Agente > otros
          let label = '';
          if (r.some((x: string) => x.toLowerCase().includes('admin'))) label = 'Admin';
          else if (r.some((x: string) => x.toLowerCase().includes('agent') || x.toLowerCase().includes('agente'))) label = 'Agent';
          else if (r.length > 0) label = r[0];
          mu.roleLabel = label;
        });

        // Aplicar filtro por rol si hay mapeos
        if (allowedUserIds.size > 0) {
          this.usuariosDisponibles = mappedUsers.filter((mu) => allowedUserIds.has(mu.id_usuario));
        } else {
          this.usuariosDisponibles = mappedUsers;
        }

        // Tickets cargados
        this.datosimportados = tickets || [];
        console.log('📦 Todos los tickets importados:', this.datosimportados);

        this.estadosDisponibles = this.extraerEstadosUnicos();
        this.prioridadesDisponibles = this.extraerPrioridadesUnicas();

        // Añadir usuarios encontrados en tickets que no estén en la lista
        const usuariosFromTickets = this.extraerUsuariosUnicos().map((ut) => ({
          id_usuario: ut.id_usuario,
          nombre: ut.nombre ?? '',
          roleLabel: ''
        }));
        const merged = [...this.usuariosDisponibles];
        usuariosFromTickets.forEach((ut) => {
          if (!merged.some((m) => m.id_usuario === ut.id_usuario)) merged.push(ut);
        });
        // Respetar filtro por roles en la lista combinada
        if (allowedUserIds.size > 0) {
          this.usuariosDisponibles = merged.filter((m) => allowedUserIds.has(m.id_usuario));
        } else {
          this.usuariosDisponibles = merged;
        }

        // Asegurarse de que todos los usuariosDisponibles tengan roleLabel
        this.usuariosDisponibles = this.usuariosDisponibles.map((u: any) => ({
          ...u,
          roleLabel: u.roleLabel ?? rolesPorUsuario.get(u.id_usuario)?.length ? (rolesPorUsuario.get(u.id_usuario)!.some(r => r.toLowerCase().includes('admin')) ? 'Admin' : (rolesPorUsuario.get(u.id_usuario)!.some(r => r.toLowerCase().includes('agent') || r.toLowerCase().includes('agente')) ? 'Agent' : rolesPorUsuario.get(u.id_usuario)![0])) : ''
        }));

    this.equiposDisponibles = this.extraerEquiposUnicos();

    // Cargar ticket seleccionado si existe id en la ruta
        if (this.idtick) {
          this.servicesticket.getById(this.idtick).subscribe((ticket) => {
      // Normalizar usuario asignado/creador
              const tAny: any = ticket as any;
              const usuarioAsignadoRaw: any = tAny.usuario_asignado ?? tAny.usuarioAsignado ?? tAny.usuarioAsignadoDTO ?? {};
              const usuarioCreadorRaw: any = tAny.usuario_creador ?? tAny.usuarioCreador ?? {};

              const usuarioAsignadoNorm = {
                id_usuario:
                  usuarioAsignadoRaw.id_usuario ?? usuarioAsignadoRaw.idUsuario ?? usuarioAsignadoRaw.id ?? 0,
                nombre:
                  usuarioAsignadoRaw.nombre ?? usuarioAsignadoRaw.nombres ?? usuarioAsignadoRaw.cedula ?? '' ,
              };

              const usuarioCreadorNorm = {
                id_usuario:
                  usuarioCreadorRaw.id_usuario ?? usuarioCreadorRaw.idUsuario ?? usuarioCreadorRaw.id ?? 0,
                nombre: usuarioCreadorRaw.nombre ?? usuarioCreadorRaw.nombres ?? usuarioCreadorRaw.cedula ?? '',
              };

              this.datosticket = {
                ...ticket,
                status: ticket.status ?? { id_status: 0, nombre: '' },
                priority: ticket.priority ?? { id_priority: 0, name: '' },
                usuario_creador: usuarioCreadorNorm,
                usuario_asignado: usuarioAsignadoNorm,
                equipoAfectado: ticket.equipoAfectado ?? {
                  id: 0,
                  serial: '',
                  product: { id: 0, name: '' },
                },
                id_ticket: ticket.id_ticket ?? this.idtick,
              };

              // Inicializar selects con los valores del ticket
              this.selectedStatusId = this.datosticket.status?.id_status ?? 0;
              this.selectedPriorityId = this.datosticket.priority?.id_priority ?? 0;
              this.selectedEquipoId = this.datosticket.equipoAfectado?.id ?? 0;

              // Preseleccionar usuario asignado por id o coincidencia
              const asignadoRaw: any = usuarioAsignadoRaw || {};
              let assignedId = this.datosticket.usuario_asignado?.id_usuario ?? 0;
              if (!assignedId || assignedId === 0) {
                // Buscar por coincidencia en nombre/cedula
                const found = this.usuariosDisponibles.find((u) => {
                  if (!u.nombre) return false;
                  // comparar con cedula o nombre del objeto crudo
                  return (
                    (asignadoRaw.cedula && u.nombre === asignadoRaw.cedula) ||
                    (asignadoRaw.nombre && u.nombre === asignadoRaw.nombre) ||
                    (asignadoRaw.nombres && u.nombre === `${asignadoRaw.nombres} ${asignadoRaw.apellidos ?? ''}`.trim())
                  );
                });
                if (found) assignedId = found.id_usuario;
              }
              this.selectedUsuarioId = assignedId ?? 0;

              // Si el usuario asignado no está en la lista, añadirlo para que el select lo muestre
              const asignado = this.datosticket.usuario_asignado;
              if (asignado && asignado.id_usuario) {
                const exists = this.usuariosDisponibles.some((u) => u.id_usuario === asignado.id_usuario);
                if (!exists) {
                  this.usuariosDisponibles.push({ id_usuario: asignado.id_usuario, nombre: asignado.nombre ?? '' });
                }
              }

              console.log('Ticket cargado:', this.datosticket);
          });
        } else {
          // Nuevo ticket: si es cliente, auto-asignar usuario logeado
          if (this.esCliente && this.usuarioLogeado) {
            this.datosticket.usuario_creador = {
              id_usuario: this.usuarioLogeado.idUsuario,
              nombre: this.nombreUsuarioLogeado
            };
          }
        }
      }
    );
  }

  // Métodos auxiliares: extraen listas únicas para selects
  extraerEstadosUnicos(): { id_status: number; nombre: string }[] {
    return this.datosimportados
      .map((t) => t.status)
      .filter((s): s is { id_status: number; nombre: string } => !!s?.id_status)
      .reduce((acc: { id_status: number; nombre: string }[], curr) => {
        if (
          curr &&
          curr.id_status !== undefined &&
          !acc.some((e) => e.id_status === curr.id_status)
        ) {
          acc.push(curr);
        }
        return acc;
      }, []);
  }
  extraerPrioridadesUnicas(): { id_priority: number; name: string }[] {
    return this.datosimportados
      .map((t) => t.priority)
      .filter((p): p is { id_priority: number; name: string } => !!p?.id_priority)
      .reduce((acc: { id_priority: number; name: string }[], curr) => {
        if (
          curr &&
          curr.id_priority !== undefined &&
          !acc.some((e) => e.id_priority === curr.id_priority)
        ) {
          acc.push(curr);
        }
        return acc;
      }, []);
  }

  extraerUsuariosUnicos(): { id_usuario: number; nombre: string }[] {
    return this.datosimportados
      .map((t) => t.usuario_asignado)
      .filter((u): u is { id_usuario: number; nombre: string } => !!u?.id_usuario)
      .reduce((acc: { id_usuario: number; nombre: string }[], curr) => {
        if (
          curr &&
          curr.id_usuario !== undefined &&
          !acc.some((e) => e.id_usuario === curr.id_usuario)
        ) {
          acc.push(curr);
        }
        return acc;
      }, []);
  }

  extraerEquiposUnicos(): {
    id: number;
    serial: string;
    product: { id: number; name: string };
  }[] {
    return this.datosimportados
      .map((t) => t.equipoAfectado)
      .filter(
        (e): e is { id: number; serial: string; product: { id: number; name: string } } => !!e?.id
      )
      .reduce(
        (
          acc: {
            id: number;
            serial: string;
            product: { id: number; name: string };
          }[],
          curr
        ) => {
          if (curr && curr.id !== undefined && !acc.some((e) => e.id === curr.id)) {
            acc.push(curr);
          }
          return acc;
        },
        []
      );
  }

  // Actualizan datosticket cuando cambia un select
  actualizarEstado(): void {
    const estadoSeleccionado = this.estadosDisponibles.find(
      (e) => e.id_status === this.selectedStatusId
    );
    if (estadoSeleccionado) {
      this.datosticket.status = estadoSeleccionado;
    }
  }

  actualizarPrioridad(): void {
    const prioridadSeleccionada = this.prioridadesDisponibles.find(
      (p) => p.id_priority === this.selectedPriorityId
    );
    if (prioridadSeleccionada) {
      this.datosticket.priority = prioridadSeleccionada;
    }
  }

  actualizarUsuarioAsignado(): void {
    const usuarioSeleccionado = this.usuariosDisponibles.find(
      (u) => u.id_usuario === this.selectedUsuarioId
    );
    if (usuarioSeleccionado) {
      this.datosticket.usuario_asignado = usuarioSeleccionado;
    }
  }

  actualizarEquipoAfectado(): void {
    const equipoSeleccionado = this.equiposDisponibles.find((e) => e.id === this.selectedEquipoId);
    if (equipoSeleccionado) {
      this.datosticket.equipoAfectado = equipoSeleccionado;
    }
  }

  guardarCambios(): void {
    // Actualizar fecha de modificación
    this.datosticket.fecha_actualizacion = new Date().toISOString();

    // Construir payload con ids para relaciones
    const payload: any = {
      id_ticket: this.datosticket.id_ticket,
      title: this.datosticket.title,
      descripcion: this.datosticket.descripcion,
      fecha_actualizacion: this.datosticket.fecha_actualizacion,
      // status / priority: enviar solo ids en las posibles formas que el backend acepte
      status: this.selectedStatusId
        ? { id_status: this.selectedStatusId, idStatus: this.selectedStatusId, id: this.selectedStatusId }
        : this.datosticket.status ?? undefined,
      priority: this.selectedPriorityId
        ? { id_priority: this.selectedPriorityId, idPriority: this.selectedPriorityId, id: this.selectedPriorityId }
        : this.datosticket.priority ?? undefined,
      // usuario_creador: enviar únicamente el id (evitar enviar objeto sin id)
      usuario_creador: this.datosticket.usuario_creador && (this.datosticket.usuario_creador.id_usuario || (this.datosticket.usuario_creador as any).id)
        ? {
            id_usuario: this.datosticket.usuario_creador.id_usuario ?? (this.datosticket.usuario_creador as any).id ?? (this.datosticket.usuario_creador as any).idUsuario,
            idUsuario: this.datosticket.usuario_creador.id_usuario ?? (this.datosticket.usuario_creador as any).id ?? (this.datosticket.usuario_creador as any).idUsuario,
          }
        : undefined,
      // usuario_asignado: enviar id desde selectedUsuarioId si existe, si no usar el valor normalizado
      usuario_asignado: this.selectedUsuarioId && this.selectedUsuarioId > 0
        ? { id_usuario: this.selectedUsuarioId, idUsuario: this.selectedUsuarioId, id: this.selectedUsuarioId }
        : this.datosticket.usuario_asignado && this.datosticket.usuario_asignado.id_usuario
        ? { id_usuario: this.datosticket.usuario_asignado.id_usuario }
        : undefined,
      // Incluir diferentes formatos de id por compatibilidad con backend
      usuarioAsignado: this.selectedUsuarioId && this.selectedUsuarioId > 0 ? { id: this.selectedUsuarioId } : undefined,
      equipoAfectado: this.selectedEquipoId && this.selectedEquipoId > 0 ? { id: this.selectedEquipoId } : undefined,
    };

  console.log('Enviando payload (obj):', payload);
    try {
      console.log('Enviando payload de actualización (json):', JSON.stringify(payload, null, 2));
    } catch (e) {
      console.log('No se pudo serializar payload:', e);
    }

    // llamar servicio de actualización
    this.servicesticket.update(this.datosticket.id_ticket!, payload).subscribe({
      next: (response) => {
        console.log('Ticket actualizado con éxito:', response);
        this.router.navigate(['/help-menu']);
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        console.error('Payload enviado:', payload);
        try {
          if (err.error) {
            console.error('err.error:', typeof err.error === 'string' ? err.error : JSON.stringify(err.error, null, 2));
          }
        } catch (e) {
          console.error('No se pudo serializar err.error', e);
        }
      },
    });
  }
}