import { Component, OnInit } from '@angular/core';
import { TicketService } from '../../app/services/ticket.service';
import { Ticket } from '../../interface/Ticket';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-actualizar-peticion',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './actualizar-peticion.html',
  styleUrl: './actualizar-peticion.css',
})
export class ActualizarPeticion implements OnInit {
  //imports de todos los datos que necesito
  serviciotickes: TicketService[] = [];
  datosticket: Ticket[] = [];

  constructor(private servicesticket: TicketService) {}

  ngOnInit(): void {
    // se importa toda la informacion del ticke seleccionado
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.servicesticket.getAll().subscribe((datos) => {
      this.datosticket = datos;
    });
  }

  actualizarTicket(){
    
  }
}
