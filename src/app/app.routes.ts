import { Routes } from '@angular/router';
import { VistaPrincipal } from '../components/vista-principal/vista-principal';
import { VentanaPeticion } from '../components/ventana-peticion/ventana-peticion';
import { ActualizarPeticion } from '../components/actualizar-peticion/actualizar-peticion';
export const routes: Routes = [
  {
    path: 'help-menu',
    component: VistaPrincipal,
  },
  {
    path: 'peticion',
    component: VentanaPeticion,
  },
  {
    path: 'actualizar/:id',
    component: ActualizarPeticion,
  },
  {
    path: '**',
    redirectTo: 'help-menu',
  },
];
