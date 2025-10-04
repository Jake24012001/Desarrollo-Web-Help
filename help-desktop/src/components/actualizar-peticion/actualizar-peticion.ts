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
  datosticket!: Ticket;

  constructor(private servicesticket: TicketService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // se importa toda la informacion del ticke seleccionado
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.servicesticket.getById(id).subscribe((datos) => {
        this.datosticket = datos;
      });
    }
  }

  actualizarTicket(): void {
    if (this.datosticket) {
      // lógica para actualizar el ticket
      console.log('Actualizando ticket:', this.datosticket);
    }
  }
}
