import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Navbar } from "../app/components/navbar/navbar";
import { Footer } from "../app/components/footer/footer";
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, HttpClientModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  isLoginPage = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.isLoginPage = this.router.url === '/login';
    });
  }
}
