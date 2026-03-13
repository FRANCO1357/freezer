import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accept-invite.component.html',
})
export class AcceptInviteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  loading = signal(false);
  loadError = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  inviterName = signal('');
  invitedEmail = signal('');
  token = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.loadError.set('Link non valido: token mancante.');
      return;
    }
    this.token.set(t);
    this.http
      .get<{ inviter_name: string; invited_email: string }>(
        `${this.apiUrl}/invitations/accept?token=${encodeURIComponent(t)}`
      )
      .subscribe({
        next: (res) => {
          this.inviterName.set(res.inviter_name ?? '');
          this.invitedEmail.set(res.invited_email ?? '');
          this.form.patchValue({ name: res.invited_email?.split('@')[0] ?? '' });
        },
        error: () => this.loadError.set('Invito non valido o scaduto.'),
      });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    const { name, password, password_confirmation } = this.form.getRawValue();
    if (password !== password_confirmation) {
      this.errorMessage.set('Le password non coincidono.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.http
      .post<{ message: string }>(`${this.apiUrl}/invitations/accept`, {
        token: this.token(),
        name,
        password,
        password_confirmation,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message ?? 'Accesso attivato.');
          setTimeout(() => {
            this.router.navigate(['/login'], { queryParams: { invited: '1' } });
          }, 1500);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err?.error?.message ??
            err?.error?.errors?.token?.[0] ??
            'Operazione fallita. Riprova.';
          this.errorMessage.set(msg);
        },
      });
  }
}
