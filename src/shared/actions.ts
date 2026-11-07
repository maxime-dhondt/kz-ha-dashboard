import type { ActionConfig, HomeAssistant } from './types';

export function fireEvent(
  node: EventTarget,
  type: string,
  detail?: unknown,
  options: { bubbles?: boolean; composed?: boolean } = {},
): void {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
    }),
  );
}

/** Client-side navigation understood by the HA router. */
export function navigate(path: string, replace = false): void {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  fireEvent(window, 'location-changed', { replace });
}

/**
 * Best effort: opens the HA quick bar by emulating its "e" keyboard shortcut.
 * Cards let users override this with `search_action`.
 */
export function openQuickBar(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
}

/** Executes a native-style action (`more-info`, `toggle`, `perform-action`, `navigate`, `url`). */
export function runAction(
  node: HTMLElement,
  hass: HomeAssistant | undefined,
  action: ActionConfig | undefined,
  fallbackEntity?: string,
): void {
  if (!action || action.action === 'none') return;
  const entityId = action.entity ?? fallbackEntity;

  switch (action.action) {
    case 'more-info':
      if (entityId) fireEvent(node, 'hass-more-info', { entityId });
      break;
    case 'toggle':
      if (hass && entityId)
        void hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      break;
    case 'call-service':
    case 'perform-action': {
      const spec = action.perform_action ?? action.service;
      if (!hass || !spec) break;
      const [domain, ...rest] = spec.split('.');
      if (!domain || rest.length === 0) break;
      void hass.callService(
        domain,
        rest.join('.'),
        action.data ?? action.service_data,
        action.target,
      );
      break;
    }
    case 'navigate':
      if (action.navigation_path) navigate(action.navigation_path);
      break;
    case 'url':
      if (action.url_path) window.open(action.url_path, '_blank', 'noopener');
      break;
  }
}
