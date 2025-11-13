import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  usuario = '';
  password = '';
  loading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Redirigir si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
  }

  onSubmit(): void {
    if (!this.usuario || !this.password) {
      Swal.fire({
        title: 'Campos vacíos',
        text: 'Por favor ingresa usuario y contraseña',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.loading = true;

    // Verificación local simple
    if (this.password !== '123') {
      this.loading = false;
      Swal.fire({
        title: 'Error',
        text: 'Contraseña incorrecta',
        icon: 'error',
        confirmButtonText: 'Reintentar',
      });
      return;
    }

    if (this.usuario === 'admin') {
      // Login como administrador
      const adminUser: any = {
        usuario: {
          idUsuario: 1,
          cedula: 'admin',
          nombre: 'Administrador',
          email: 'admin@test.com',
          clave: '123',
          estado: true,
          unidadAdministrativa: { id: 1, nombre: 'Admin' }
        },
        rol: 'Administrador'
      };
      
      // Actualizar el estado del AuthService
      this.authService.setCurrentUser(adminUser);
      this.loading = false;
      
      // Redirigir inmediatamente
      this.router.navigate(['/help-menu']).then(() => {
        Swal.fire({
          title: '¡Bienvenido Admin!',
          text: 'Acceso concedido',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      });
      
    } else if (this.usuario === 'cliente') {
      // Login como cliente
      const clientUser: any = {
        usuario: {
          idUsuario: 2,
          cedula: Environment.DEMO_CLIENT_CEDULA || 'cliente',
          nombre: 'Cliente',
          email: 'cliente@test.com',
          clave: '123',
          estado: true,
          unidadAdministrativa: { id: 2, nombre: 'Cliente' }
        },
        rol: 'Cliente'
      };
      
      // Actualizar el estado del AuthService
      this.authService.setCurrentUser(clientUser);
      this.loading = false;
      
      // Redirigir inmediatamente
      this.router.navigate(['/cliente']).then(() => {
        Swal.fire({
          title: '¡Bienvenido Cliente!',
          text: 'Acceso concedido',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      });
      
    } else {
      this.loading = false;
      Swal.fire({
        title: 'Error',
        text: 'Usuario no válido. Usa "admin" o "cliente"',
        icon: 'error',
        confirmButtonText: 'Reintentar',
      });
    }
  }

  private redirectByRole(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/help-menu']); // Vista de administrador
    } else if (this.authService.isClient()) {
      this.router.navigate(['/cliente']); // Vista de cliente
    } else {
      this.router.navigate(['/login']);
    }
  }
}
