// Small UI kit: toasts, confirm modal, range fill sync.
import { svg } from './icons.js';

let stack;
export function toast(message, kind = 'info', ms = 2400) {
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.id = 'toast';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${kind}`;
  const ic = kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'info';
  t.innerHTML = `${svg(ic, { size: 18 })}<span></span>`;
  t.lastChild.textContent = message;
  stack.appendChild(t);
  while (stack.children.length > 3) stack.firstChild.remove();
  setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, ms);
}

/** Animated confirm dialog. Resolves true/false. */
export function confirmDialog({ title, body, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `<div class="modal glass glow-border" role="dialog" aria-modal="true" aria-labelledby="mTitle"><h3 id="mTitle"></h3><p></p><div class="modal-actions"><button class="btn" data-x="no"></button><button class="btn btn-primary" data-x="yes"></button></div></div>`;
    back.querySelector('h3').textContent = title;
    back.querySelector('p').textContent = body;
    back.querySelector('[data-x=no]').textContent = cancelText;
    back.querySelector('[data-x=yes]').textContent = confirmText;
    const prev = document.activeElement;
    const close = (v) => {
      back.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => { back.remove(); prev && prev.focus && prev.focus(); }, 300);
      resolve(v);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    back.addEventListener('click', (e) => { if (e.target === back) close(false); });
    back.querySelector('[data-x=no]').addEventListener('click', () => close(false));
    back.querySelector('[data-x=yes]').addEventListener('click', () => close(true));
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    requestAnimationFrame(() => { back.classList.add('is-open'); back.querySelector('[data-x=yes]').focus(); });
  });
}

/** Keep the gradient fill of a range input in sync with its value. */
export function syncRange(input) {
  const min = parseFloat(input.min || 0), max = parseFloat(input.max || 100);
  input.style.setProperty('--pct', `${((input.value - min) / (max - min)) * 100}%`);
}
export function bindRanges(root = document) {
  root.querySelectorAll('input[type=range]').forEach((r) => {
    syncRange(r);
    r.addEventListener('input', () => syncRange(r));
  });
}
