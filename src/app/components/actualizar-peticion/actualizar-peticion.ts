import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../services/ticket.service';
import { UsuarioService } from '../../services/usuario.service';
import { forkJoin } from 'rxjs';
import { Ticket } from '../../interface/Ticket';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // Añadido DatePipe para el template
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-actualizar-peticion',
  standalone: true,
  // Añadido DatePipe a imports para usarlo en el template (si es necesario)
  imports: [FormsModule, CommonModule, DatePipe], 
  templateUrl: './actualizar-peticion.html',
  styleUrls: ['./actualizar-peticion.css'],
})
export class ActualizarPeticion implements OnInit {
  // ✅ Inicialización Segura y uso de 'id_ticket'
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
    equipoAfectado: { id: 0, serial: '', product: { id: 0, name: '' } },
  };
  
  datosimportados: Ticket[] = [];
  idtick: number = 0; // ✅ Inicialización Segura
  selectedStatusId: number = 0; // ✅ Inicialización Segura
  selectedPriorityId: number = 0; // ✅ Inicialización Segura
  selectedUsuarioId: number = 0; // ✅ Inicialización Segura
  selectedEquipoId: number = 0; // ✅ Inicialización Segura

  // ✅ Listas únicas para combos
  estadosDisponibles: { id_status: number; nombre: string }[] = [];
  prioridadesDisponibles: { id_priority: number; name: string }[] = [];
  usuariosDisponibles: { id_usuario: number; nombre: string }[] = [];
  equiposDisponibles: {
    id: number;
    serial: string;
    product: { id: number; name: string };
  }[] = [];

  constructor(
    private servicesticket: TicketService,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idtick = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar usuarios y tickets en paralelo para evitar sobrescrituras y condiciones de carrera
    forkJoin({ users: this.usuarioService.getAll(), tickets: this.servicesticket.getAll() }).subscribe(
      ({ users, tickets }) => {
        // Mapear usuarios del servicio (defensivo con posibles nombres de campo distintos)
        this.usuariosDisponibles = (users || []).map((u: any) => ({
          id_usuario: u.id_usuario ?? u.idUsuario ?? u.id ?? 0,
          nombre:
            u.nombre ??
            u.nombres ??
            (u.nombres ? `${u.nombres} ${u.apellidos ?? ''}`.trim() : '') ??
            '',
        }));

        // Tickets
        this.datosimportados = tickets || [];
        console.log('📦 Todos los tickets importados:', this.datosimportados);

        this.estadosDisponibles = this.extraerEstadosUnicos();
        this.prioridadesDisponibles = this.extraerPrioridadesUnicas();

        // Fusionar usuarios extraídos de tickets con los usuarios obtenidos del servicio
        const usuariosFromTickets = this.extraerUsuariosUnicos();
        const merged = [...this.usuariosDisponibles];
        usuariosFromTickets.forEach((ut) => {
          if (!merged.some((m) => m.id_usuario === ut.id_usuario)) merged.push(ut);
        });
        this.usuariosDisponibles = merged;

        this.equiposDisponibles = this.extraerEquiposUnicos();

        // Cargar el ticket seleccionado si el ID existe.
        if (this.idtick) {
          this.servicesticket.getById(this.idtick).subscribe((ticket) => {
              // Normalizar campos del usuario asignado y creador para soportar varias formas
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

              // Inicializar los IDs seleccionados después de que this.datosticket se ha cargado
              this.selectedStatusId = this.datosticket.status?.id_status ?? 0;
              this.selectedPriorityId = this.datosticket.priority?.id_priority ?? 0;
              this.selectedEquipoId = this.datosticket.equipoAfectado?.id ?? 0;

              // Intentar preseleccionar el usuario asignado.
              // Primero usamos el id normalizado; si es 0/undefined, intentamos hacer match por 'cedula' o 'nombre'.
              const asignadoRaw: any = usuarioAsignadoRaw || {};
              let assignedId = this.datosticket.usuario_asignado?.id_usuario ?? 0;
              if (!assignedId || assignedId === 0) {
                // buscar por coincidencia en nombre/cedula entre usuariosDisponibles
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

              // Si el usuario asignado (por id) no aparece en la lista, lo añadimos para que el select pueda mostrarlo
              const asignado = this.datosticket.usuario_asignado;
              if (asignado && asignado.id_usuario) {
                const exists = this.usuariosDisponibles.some((u) => u.id_usuario === asignado.id_usuario);
                if (!exists) {
                  this.usuariosDisponibles.push({ id_usuario: asignado.id_usuario, nombre: asignado.nombre ?? '' });
                }
              }

              console.log('✅ Ticket seleccionado (normalizado):', this.datosticket);
          });
        }
      }
    );
  }

  // Métodos de extracción (sin cambios, se conservan)
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

  // Métodos que actualizan el objeto datosticket al cambiar un select
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

  //Método guardarCambios corregido
  guardarCambios(): void {
    // 1. Actualizar el campo de fecha_actualizacion antes de enviar
    this.datosticket.fecha_actualizacion = new Date().toISOString();

    // 2. Llamar al servicio de actualización
    // Usamos '!' aquí porque el ID está garantizado de ser un número (0 inicial o ID real) 
    // después de ngOnInit y es un argumento requerido por el servicio.
    this.servicesticket.update(this.datosticket.id_ticket!, this.datosticket).subscribe({
      next: (response) => {
        console.log('Ticket actualizado con éxito:', response);
        // Navegar a la vista de tickets después de guardar
        this.router.navigate(['/help-menu']); 
      },
      error: (err) => {
        console.error('Error al actualizar el ticket:', err);
        // Opcional: Implementar lógica de modal o toast para informar al usuario
      }
    });
  }
}