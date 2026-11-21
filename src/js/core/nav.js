// Tiny session flag so the entry-point guard can tell in-app navigation from a fresh open/reload.
export const NAV_KEY = 'yantra:nav';
export function markInternalNav() { try { sessionStorage.setItem(NAV_KEY, String(Date.now())); } catch (_) { /* storage blocked: guard disables itself */ } }
