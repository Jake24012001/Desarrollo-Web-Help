import { Component } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [],
  templateUrl: './vista-principal.html',
  styleUrl: './vista-principal.css',
})
export class VistaPrincipal {
  crearPeticion(): void {
    Swal.fire({
      title: 'Petición creada',
      text: 'Tu solicitud ha sido registrada correctamente.',
      icon: 'success',
      confirmButtonText: 'Cool',
    });
  }

  modificarPeticion(): void {
    Swal.fire({
      title: 'Modificar petición',
      text: '¿Deseas editar esta solicitud?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });
  }

  borrarPeticion(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la petición permanentemente.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
  }
}
