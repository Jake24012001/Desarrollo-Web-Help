import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../app/services/usuario.service';
import { EquipoService } from '../../app/services/equipos.service';
import { Usuario } from '../../interface/Usuario';
import { TicketService } from '../../app/services/ticket.service';
import { InventoryUnit } from '../../interface/InventoryUnit';
import { Product } from '../../interface/Product';
import { Ticket } from '../../interface/Ticket';
import { UsuarioRol } from '../../interface/UsuarioRol';
import { UsuarioRolService } from '../../app/services/usuariorol.service';
import { TicketPriorityService } from '../../app/services/ticket-priority.service';
import { TicketPriority } from '../../interface/TicketPriority';
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
  usuarioSeleccionado = '';
  equipoSeleccionado = '';
  tipoPeticion = '';
  detallePeticion = '';

  usuarioAdmin = ''; 

  productosUnicos: Product[] = [];
  productoSeleccionado: string = '';
  mostrarFormularioEquipo = false;
  prioridadSeleccionada: TicketPriority | null = null;
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private equipoService: EquipoService,
    private ticketService: TicketService,
    private usuarioservicesR:UsuarioRolService,
    private ticketPriority:TicketPriorityService
  ) { }

  ngOnInit(): void {

 
    //se carguen todos los usuarios de la backend
    this.usuarioService.getAll().subscribe((usuarios) => {
      this.usuarios = usuarios;
    });

    // se carguen todos los equipos del usuario seleccionado
    this.equipoService.getAll().subscribe((equipos) => {
      this.equiposInventario = equipos;

    // se cargan los roles de los usuarios y su cedula
    this.usuarioservicesR.getAll().subscribe((roles) => {
      this.rolesus = roles;
    });

     // Cargar prioridades de ticket
    this.ticketPriority.getAll().subscribe((name) => {
      console.log('Prioridades cargadas:', name); // ← revisa en consola
    this.ticketPrioridades = name;
    });
  
      // Extraer productos únicos por type
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

  enviarPeticion(): void {
    const tipo = (document.getElementById('tipoPeticion') as HTMLInputElement)?.value.trim();
    const detalle = (
      document.getElementById('detallePeticion') as HTMLTextAreaElement
    )?.value.trim();

    if (!tipo || !this.usuarioSeleccionado || !this.equipoSeleccionado || !detalle) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos antes de enviar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const equipoSeleccionadoObj = this.equiposFiltrados.find(
      (e) => e.id?.toString() === this.equipoSeleccionado
    );

    const nuevaPeticion = {
      fechaEntrega: new Date().toISOString(),
      tipo,
      descripcion: detalle,
      recibidoPor: this.usuarioSeleccionado,
      departamento: 'TI',
      elaboradoPor: 'Admin',
      equipo: equipoSeleccionadoObj?.serial || '', // CAMBIADO: usar serial en lugar de nombre
      estado: 'Pendiente',
    };

    const peticiones = JSON.parse(localStorage.getItem('peticiones') || '[]');
    peticiones.push(nuevaPeticion);
    localStorage.setItem('peticiones', JSON.stringify(peticiones));

    Swal.fire({
      title: 'Petición registrada',
      text: 'Tu solicitud ha sido guardada correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      this.router.navigate(['/help-menu']);
    });
  }

  // Métodos existentes...
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

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'pendiente';
      case 'En proceso':
        return 'en-proceso';
      case 'Terminado':
        return 'terminado';
      case 'No disponible':
        return 'no-disponible';
      default:
        return '';
    }
  }

  crearTicket(): void {

  }

  filtrarEquiposPorTipo(): void {
    if (!this.productoSeleccionado) {
      this.equiposFiltrados = [];
      return;
    }

    this.equiposFiltrados = this.equiposInventario.filter(
      (equipo) => equipo.product?.type === this.productoSeleccionado
    );
  }

  mostrarFormEquipo(): void {
    this.mostrarFormularioEquipo = true;
  }

  getEstadoPendiente(): Ticket['status'] {
    return {
      id_status: 1,
      nombre: 'Abierto',
    };
  }


  filtrarporusuario():void{

  }

}
