import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Restituisce l'URL assoluto per l'immagine prodotto (il backend può restituire URL relativi).
 */
@Pipe({ name: 'productImageUrl', standalone: true })
export class ProductImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    if (url == null || url === '') return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiUrl = environment.apiUrl;
    const base = apiUrl.startsWith('http')
      ? new URL(apiUrl).origin
      : (typeof window !== 'undefined' ? window.location.origin + apiUrl.replace(/\/api\/?$/, '') : '');
    return base + (url.startsWith('/') ? url : '/' + url);
  }
}
