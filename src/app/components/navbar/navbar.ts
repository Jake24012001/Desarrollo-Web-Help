import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { LoginResponse } from '../../interface/Auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit, OnDestroy {
  currentUser: LoginResponse | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    public authorizationService: AuthorizationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
