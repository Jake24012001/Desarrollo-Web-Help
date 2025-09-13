import { Component } from '@angular/core';

@Component({
  selector: 'app-vista-principal',
  standalone: true,
  imports: [],
  templateUrl: './vista-principal.html',
  styleUrl: './vista-principal.css',
})
export class VistaPrincipal {
  actualizarEstado(nuevoEstado: string): void {
    const estadoElemento = document.getElementById('estado-actual');

    if (!estadoElemento) return;

    // Limpiar clases anteriores
    estadoElemento.classList.remove('disponible', 'en-proceso', 'terminado');

    // Actualizar texto
    estadoElemento.textContent = nuevoEstado;

    // Aplicar clase correspondiente
    switch (nuevoEstado) {
      case 'Disponible':
        estadoElemento.classList.add('disponible');
        break;
      case 'En proceso':
        estadoElemento.classList.add('en-proceso');
        break;
      case 'Terminado':
        estadoElemento.classList.add('terminado');
        break;
      default:
        estadoElemento.style.backgroundColor = 'transparent';
        estadoElemento.style.color = '#333';
    }
  }
}
