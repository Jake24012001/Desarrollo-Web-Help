import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../app/services/ticket.service';
import { Ticket } from '../../interface/Ticket';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-actualizar-peticion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './actualizar-peticion.html',
  styleUrl: './actualizar-peticion.css',
})
export class ActualizarPeticion implements OnInit {
  //imports de todos los datos que necesito
  serviciotickes: TicketService[] = [];
  datosticket: Ticket = {
    id_ticket: 0,
    title: '',
    descripcion: '',
    status: { id_status: 0, nombre: '' },
    priority: { id_priority: 0, name: '' },
    usuario_creador: { id_usuario: 0, nombre: '' },
    usuario_asignado: { id_usuario: 0, nombre: '' },
    equipoAfectado: {
      id: 0,
      serial: '',
      product: { id: 0, name: '' },
    },
    fecha_creacion: '',
    fecha_actualizacion: '',
    fecha_cierre: '',
    tiempoRestante: '',
  };

  constructor(private servicesticket: TicketService, private route: ActivatedRoute) {}

  id_ticket!: number;

  ngOnInit(): void {
    this.id_ticket = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id_ticket) {
      this.servicesticket.getById(this.id_ticket).subscribe((datos) => {
        this.datosticket = datos;
      });
    }
  }

  actualizarTicket(): void {
    if (this.datosticket && this.id_ticket) {
      this.servicesticket.update(this.id_ticket, this.datosticket).subscribe(() => {
        console.log('✅ Ticket actualizado correctamente');
        // Aquí puedes redirigir o mostrar un mensaje con Swal
      });
    }
  }
}
