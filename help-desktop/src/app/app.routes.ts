import { Routes } from '@angular/router';
import { VistaPrincipal } from '../components/vista-principal/vista-principal';

export const routes: Routes = [
  {
    path: 'help-menu',
    component: VistaPrincipal
  },
  {
    path: '**',
    redirectTo: 'help-menu'
  }
];