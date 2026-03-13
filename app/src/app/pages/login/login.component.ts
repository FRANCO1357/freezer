import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMessage = '';
  infoMessage = '';
  loading = false;

  constructor() {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === '1') {
      this.infoMessage = "Registrazione completata. Controlla l'email per confermare l'account.";
    }
  }

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/area-riservata']),
      error: (err: { error?: { message?: string; errors?: { email?: string[] } } }) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message ||
          err.error?.errors?.email?.[0] ||
          'Accesso fallito. Riprova.';
      },
      complete: () => (this.loading = false),
    });
  }
}
