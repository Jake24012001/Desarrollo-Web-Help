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
  servicestickets: TicketService[] = [];
  idtick!: number;

  constructor(
    private servicesticket: TicketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idtick = Number(this.route.snapshot.paramMap.get('id'));

    // Cargar el ticket seleccionado
    if (this.idtick) {
      this.servicesticket.getById(this.idtick).subscribe((ticket) => {
        this.datosticket = ticket;
        console.log('✅ Ticket seleccionado:', this.datosticket);
      });
    }

    // Cargar todos los tickets
    this.servicesticket.getAll().subscribe((tickets) => {
      this.datosimportados = tickets;
      console.log('📦 Todos los tickets importados:', this.datosimportados);
    });
  }
}
