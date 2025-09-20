import { Routes } from '@angular/router';
import { VistaPrincipal } from '../components/vista-principal/vista-principal';
import { VentanaPeticion } from '../components/ventana-peticion/ventana-peticion';

export const routes: Routes = [
  {
    path: 'help-menu',
    component: VistaPrincipal,
    children:[
      {
        path:'peticion',
        component:VentanaPeticion
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'help-menu'
  }
];