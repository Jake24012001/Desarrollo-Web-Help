import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirige al menú
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/help-menu']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const { email, clave } = this.loginForm.value;

    this.authService.login(email, clave).subscribe({
      next: (response: any) => {
        if (response && response.idUsuario) {
          this.authService.saveUser(response);
          this.router.navigate(['/help-menu']);
        } else {
          this.error = response.message || 'Usuario o contraseña incorrectos';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.error = 'Usuario o contraseña incorrectos';
        this.loading = false;
      },
    });
  }
}
