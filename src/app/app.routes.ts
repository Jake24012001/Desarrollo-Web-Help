import { Routes } from '@angular/router';
import { VistaPrincipal } from '../app/components/vista-principal/vista-principal';
import { VentanaPeticion } from '../app/components/ventana-peticion/ventana-peticion';
import { ActualizarPeticion } from '../app/components/actualizar-peticion/actualizar-peticion';
import { LoginComponent } from '../app/components/login/login';
import { ClientTicketComponent } from '../app/components/client-ticket/client-ticket';
import { adminGuard, clientGuard } from '../app/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'cliente',
    component: ClientTicketComponent,
    canActivate: [clientGuard],
  },
  {
    path: 'help-menu',
    component: VistaPrincipal,
    canActivate: [adminGuard],
  },
  {
    path: 'peticion',
    component: VentanaPeticion,
    canActivate: [adminGuard],
  },
  {
    path: 'actualizar/:id',
    component: ActualizarPeticion,
    canActivate: [adminGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
