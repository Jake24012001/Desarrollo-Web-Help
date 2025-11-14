import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TicketCommentService } from '../../services/ticket-comment.service';
import { TicketService } from '../../services/ticket.service';
import { TicketComment } from '../../interface/TicketComment';
import { Ticket } from '../../interface/Ticket';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resolver-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './resolver-ticket.html',
  styleUrls: ['./resolver-ticket.css'],
})
export class ResolverTicket implements OnInit {
  ticket: Ticket | null = null;
  resolverForm!: FormGroup;
  comentarios: TicketComment[] = [];
  loading = false;
  submitted = false;
  ticketId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private commentService: TicketCommentService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.ticketId = params['id'];
      this.cargarTicket();
      this.cargarComentarios();
    });

    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.resolverForm = this.formBuilder.group({
      mensaje: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  cargarTicket(): void {
    this.ticketService.getById(this.ticketId).subscribe({
      next: (data: Ticket) => {
        this.ticket = data;
      },
      error: (error) => {
        console.error('Error al cargar el ticket:', error);
        Swal.fire('Error', 'No se pudo cargar el ticket', 'error');
      },
    });
  }

  cargarComentarios(): void {
    this.commentService.getByTicketId(this.ticketId).subscribe({
      next: (data: TicketComment[]) => {
        this.comentarios = data;
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
      },
    });
  }

  get f() {
    return this.resolverForm.controls;
  }

  resolverTicket(): void {
    this.submitted = true;

    if (this.resolverForm.invalid) {
      Swal.fire('Validación', 'Por favor completa el comentario (mínimo 10 caracteres)', 'warning');
      return;
    }

    if (!this.ticket) {
      Swal.fire('Error', 'Ticket no encontrado', 'error');
      return;
    }

    this.loading = true;
    const currentUser = this.authService.getCurrentUser();

    // Crear el comentario de resolución
    const nuevoComentario: TicketComment = {
      ticket: this.ticket,
      author: {
        idUsuario: currentUser?.idUsuario,
        nombres: currentUser?.nombres,
        apellidos: currentUser?.apellidos,
        email: currentUser?.email,
        estado: currentUser?.estado || false,
        clave: '',
        nombre: `${currentUser?.nombres} ${currentUser?.apellidos}`,
        cedula: '',
        unidadAdministrativa: {
          id: 0,
          nombre: '',
        },
      } as any,
      message: this.resolverForm.value.mensaje,
    };

    // Guardar comentario
    this.commentService.create(nuevoComentario).subscribe({
      next: () => {
        // Actualizar estado del ticket a resuelto
        const ticketActualizado = {
          ...this.ticket,
          status: {
            id_status: 2, // ID del estado "CERRADO"
            nombre: 'CERRADO',
          },
        };

        this.ticketService.update(this.ticketId, ticketActualizado as Ticket).subscribe({
          next: () => {
            Swal.fire(
              'Éxito',
              'El ticket ha sido resuelto correctamente',
              'success'
            ).then(() => {
              this.router.navigate(['/help-menu']);
            });
          },
          error: (error) => {
            console.error('Error al actualizar ticket:', error);
            Swal.fire('Error', 'Error al resolver el ticket', 'error');
            this.loading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
        Swal.fire('Error', 'Error al guardar el comentario', 'error');
        this.loading = false;
      },
    });
  }

  volver(): void {
    this.router.navigate(['/help-menu']);
  }
}
