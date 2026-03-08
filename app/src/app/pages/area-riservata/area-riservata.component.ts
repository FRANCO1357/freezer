import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-area-riservata',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './area-riservata.component.html',
})
export class AreaRiservataComponent {
  private auth = inject(AuthService);

  user: User | null = this.auth.getStoredUser();

  logout(): void {
    this.auth.doLogout();
  }
}
