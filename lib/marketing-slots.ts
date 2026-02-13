/**
 * Vordefinierte Slot-IDs für In-App-Nachrichten (dynamische Platzierung).
 * Admin wählt einen Slot; Frontend rendert Nachrichten in der passenden Slot-Komponente.
 */
export const MARKETING_SLOT_IDS = [
  { id: 'menu_top', label: 'Menü oben', page: 'menu' },
  { id: 'menu_sidebar', label: 'Menü Sidebar', page: 'menu' },
  { id: 'dashboard_hero', label: 'Dashboard Hero', page: 'dashboard' },
  { id: 'dashboard_sidebar', label: 'Dashboard Sidebar', page: 'dashboard' },
  { id: 'wallet_top', label: 'Guthaben oben', page: 'wallet' },
  { id: 'popup_after_login', label: 'Popup nach Login', page: null },
] as const

export type MarketingSlotId = (typeof MARKETING_SLOT_IDS)[number]['id']

export const DISPLAY_TYPE_LABELS: Record<string, string> = {
  POPUP: 'Popup (Modal)',
  BANNER: 'Banner / Karte',
  SLOT: 'Slot (dynamischer Platz)',
}
