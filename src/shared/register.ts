/** Declares a card in the Home Assistant card picker (`window.customCards`). */
export function registerCard(meta: {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
}): void {
  window.customCards = window.customCards ?? [];
  if (window.customCards.some((c) => c.type === meta.type)) return;
  window.customCards.push({
    preview: true,
    documentationURL: 'https://github.com/REPLACE_ME/glass-home-dashboard',
    ...meta,
  });
}
