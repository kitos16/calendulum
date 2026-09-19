import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { CalendulumMonth } from 'calendulum';

@Component({
  selector: 'app-root',
  imports: [CalendulumMonth, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly selected = signal<Date | null>(null);
}