import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "../app/components/navbar/navbar";
import { Footer } from "../app/components/footer/footer";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer,HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
