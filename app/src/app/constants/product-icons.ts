/**
 * Icone prodotto (PNG in /icons/). Chiave = nome file senza .png.
 * Aggiungi qui nuove icone quando aggiungi file in app/public/icons/
 */
export const PRODUCT_ICONS: { id: string; label: string }[] = [
  { id: 'icona_brodo', label: 'Brodo' },
  { id: 'icona_carne', label: 'Carne' },
  { id: 'icona_frutta', label: 'Frutta' },
  { id: 'icona_funghi', label: 'Funghi' },
  { id: 'icona_gelato', label: 'Gelato' },
  { id: 'icona_ghiaccio', label: 'Ghiaccio' },
  { id: 'icona_latticini', label: 'Latticini' },
  { id: 'icona_legumi', label: 'Legumi' },
  { id: 'icona_odori', label: 'Odori' },
  { id: 'icona_pane', label: 'Pane' },
  { id: 'icona_pesce', label: 'Pesce' },
  { id: 'icona_pizza', label: 'Pizza' },
  { id: 'icona_schiacciata', label: 'Schiacciata' },
  { id: 'icona_sugo', label: 'Sugo' },
  { id: 'icona_verdura', label: 'Verdura' },
  { id: 'icona_zuppa', label: 'Zuppa' },
];

export function productIconUrl(iconId: string | null | undefined): string | null {
  if (!iconId) return null;
  return `/icons/${iconId}.png`;
}
