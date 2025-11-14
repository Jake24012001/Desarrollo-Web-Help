/**
 * Rutas de la aplicación
 *
 * - `login`: pantalla de autenticación
 * - `help-menu`: vista principal (requiere autenticación)
 * - `peticion`: formulario de creación de peticiones
 * - `actualizar/:id`: editar petición existente
 * - `resolver/:id`: resolver/atender ticket
 */
import { Routes } from '@angular/router';
import { VistaPrincipal } from '../app/components/vista-principal/vista-principal';
import { VentanaPeticion } from '../app/components/ventana-peticion/ventana-peticion';
import { ActualizarPeticion } from '../app/components/actualizar-peticion/actualizar-peticion';
import { ResolverTicket } from '../app/components/resolver-ticket/resolver-ticket';
import { Login } from '../app/components/login/login';
import { authGuard } from '../app/guards/auth.guard';

export const routes: Routes = [
  {
    // Ruta pública: login
    path: 'login',
    component: Login,
  },
  {
    // Ruta protegida: menú principal con listado de tickets
    path: 'help-menu',
    component: VistaPrincipal,
    canActivate: [authGuard],
  },
  {
    // Formulario para crear una nueva petición (protegida)
    path: 'peticion',
    component: VentanaPeticion,
    canActivate: [authGuard],
  },
  {
    // Editar petición por id (protegida)
    path: 'actualizar/:id',
    component: ActualizarPeticion,
    canActivate: [authGuard],
  },
  {
    // Pantalla para que un agente/admin resuelva el ticket (protegida)
    path: 'resolver/:id',
    component: ResolverTicket,
    canActivate: [authGuard],
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
