import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './invite.component.html',
})
export class InviteComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  loading = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.http
      .post<{ message: string }>(`${this.apiUrl}/invitations`, this.form.getRawValue())
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message ?? 'Invito inviato.';
          this.form.reset();
        },
        error: (err) => {
          this.loading = false;
          const msg =
            err?.error?.message ??
            err?.error?.errors?.email?.[0] ??
            'Invio fallito. Riprova.';
          this.errorMessage = msg;
        },
      });
  }
}
