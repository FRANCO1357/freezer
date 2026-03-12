import { Pipe, PipeTransform } from '@angular/core';

/**
 * Tronca il testo a max caratteri e aggiunge "..." se più lungo.
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength: number): string {
    if (value == null || value === '') return '';
    const s = String(value);
    return s.length > maxLength ? s.slice(0, maxLength) + '...' : s;
  }
}
