import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../app/services/ticket.service';
import { Ticket } from '../../interface/Ticket';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-actualizar-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './actualizar-peticion.html',
  styleUrls: ['./actualizar-peticion.css'],
})
export class ActualizarPeticion implements OnInit {
  datosticket!: Ticket;
  datosimportados: Ticket[] = [];
  idtick!: number;
  selectedStatusId!: number;
  selectedPriorityId!: number;
  selectedUsuarioId!: number;
  selectedEquipoId!: number;

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
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idtick = Number(this.route.snapshot.paramMap.get('id'));
    this.selectedStatusId = this.datosticket.status?.id_status ?? 0;
    this.selectedPriorityId = this.datosticket.priority?.id_priority ?? 0;
    this.selectedUsuarioId = this.datosticket.usuario_asignado?.id_usuario ?? 0;
    this.selectedEquipoId = this.datosticket.equipoAfectado?.id ?? 0;
    // Cargar el ticket seleccionado
    if (this.idtick) {
      this.servicesticket.getById(this.idtick).subscribe((ticket) => {
        this.datosticket = {
          ...ticket,
          status: ticket.status ?? { id_status: 0, nombre: '' },
          priority: ticket.priority ?? { id_priority: 0, name: '' },
          usuario_creador: ticket.usuario_creador ?? { id_usuario: 0, nombre: '' },
          usuario_asignado: ticket.usuario_asignado ?? { id_usuario: 0, nombre: '' },
          equipoAfectado: ticket.equipoAfectado ?? {
            id: 0,
            serial: '',
            product: { id: 0, name: '' },
          },
        };
        console.log('✅ Ticket seleccionado:', this.datosticket);
      });
    }

    // Cargar todos los tickets y extraer listas únicas
    this.servicesticket.getAll().subscribe((tickets) => {
      this.datosimportados = tickets;
      console.log('📦 Todos los tickets importados:', this.datosimportados);

      this.estadosDisponibles = this.extraerEstadosUnicos();
      this.prioridadesDisponibles = this.extraerPrioridadesUnicas();
      this.usuariosDisponibles = this.extraerUsuariosUnicos();
      this.equiposDisponibles = this.extraerEquiposUnicos();
    });
  }

  // ✅ Métodos para extraer listas únicas
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
}
