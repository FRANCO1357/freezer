import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { metallicss } from 'metallicss';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('app');
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.applyMetallicss();
        // Ripeti dopo un po' per card/tabelle renderizzate in ritardo (es. dopo HTTP o *ngFor)
        [100, 400, 800].forEach((ms) => setTimeout(() => this.applyMetallicss(), ms));
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyMetallicss(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('.metallicss').forEach((el) => {
          if (el instanceof HTMLElement) metallicss(el);
        });
      });
    });
  }
}
