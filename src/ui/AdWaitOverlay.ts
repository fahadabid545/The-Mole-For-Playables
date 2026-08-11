import { EventBus, EVT } from '../utils/EventBus';

// DOM overlay tied to AD_START / AD_END. Guarantees the game is
// visually locked during an ad-network round-trip so the user cannot
// tap a dead pause button while the scene sits behind a paused Game.

let el: HTMLDivElement | null = null;
let openCount = 0;
let safetyTimer: number | null = null;

function ensure(): HTMLDivElement {
  if (el) return el;
  el = document.createElement('div');
  el.id = 'ad-wait-overlay';
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483000',
    'display:none', 'align-items:center', 'justify-content:center',
    'background:rgba(0,0,0,.72)',
    'color:#fff5c9',
    'font:700 22px "Arial Black",Impact,sans-serif',
    'letter-spacing:1px', 'text-align:center', 'padding:24px',
    'pointer-events:auto',
  ].join(';');
  el.innerHTML = `
    <div>
      <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 18px;
                  border:6px solid rgba(255,213,79,.25);border-top-color:#ffd54f;
                  animation:jm-adspin 1s linear infinite;"></div>
      <div>LOADING AD…</div>
      <div style="margin-top:10px;font-size:14px;opacity:.75;font-weight:400;">
        Hang on, ad about to play.
      </div>
    </div>
    <style>@keyframes jm-adspin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(el);
  return el;
}

function show(): void {
  const node = ensure();
  openCount++;
  node.style.display = 'flex';
  // Belt + suspenders: if AD_END never fires, kill the overlay after 30s
  // so the player is never trapped.
  if (safetyTimer !== null) window.clearTimeout(safetyTimer);
  safetyTimer = window.setTimeout(() => forceHide(), 30000);
}

function hide(): void {
  if (openCount > 0) openCount--;
  if (openCount === 0 && el) el.style.display = 'none';
  if (openCount === 0 && safetyTimer !== null) {
    window.clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function forceHide(): void {
  openCount = 0;
  if (el) el.style.display = 'none';
  if (safetyTimer !== null) { window.clearTimeout(safetyTimer); safetyTimer = null; }
}

export function initAdWaitOverlay(): void {
  EventBus.on(EVT.AD_START, show);
  EventBus.on(EVT.AD_END, hide);
}
