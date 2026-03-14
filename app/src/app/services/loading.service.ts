import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly count = signal(0);

  readonly isLoading = computed(() => this.count() > 0);

  addRequest(): void {
    this.count.update((c) => c + 1);
  }

  removeRequest(): void {
    this.count.update((c) => Math.max(0, c - 1));
  }
}
