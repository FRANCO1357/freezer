import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatta peso/quantità senza zeri decimali superflui (es. 500.00 → 500, 350.5 → 350.5).
 */
@Pipe({ name: 'formatQuantity', standalone: true })
export class FormatQuantityPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n % 1 === 0 ? String(n) : String(n);
  }
}
