import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-area-riservata-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './area-riservata-layout.component.html',
})
export class AreaRiservataLayoutComponent {
  private auth = inject(AuthService);
  user: User | null = this.auth.getStoredUser();

  /** Menu mobile aperto/chiuso (gestito in Angular perché Bootstrap JS non è caricato) */
  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.doLogout();
  }
}
