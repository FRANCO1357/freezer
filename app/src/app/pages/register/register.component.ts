import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  });

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, password_confirmation } = this.form.getRawValue();

    if (password !== password_confirmation) {
      this.errorMessage = 'Le password non coincidono.';
      return;
    }

    this.loading = true;
    this.auth.register(name, email, password, password_confirmation).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage =
          res.message || "Registrazione completata. Controlla l'email per confermare l'account.";
        // opzionale: potremmo anche reindirizzare al login dopo qualche secondo
      },
      error: (err) => {
        this.loading = false;
        if (err?.error && typeof err.error === 'object') {
          if (typeof err.error.message === 'string') {
            this.errorMessage = err.error.message;
          } else if (err.status === 422 && err.error.errors) {
            const firstKey = Object.keys(err.error.errors)[0];
            this.errorMessage = err.error.errors[firstKey][0] ?? 'Dati non validi.';
          } else {
            this.errorMessage = 'Registrazione non riuscita. Riprova più tardi.';
          }
        } else {
          this.errorMessage = 'Registrazione non riuscita. Riprova più tardi.';
        }
      },
    });
  }
}

