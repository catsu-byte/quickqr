import QRCode from 'qrcode';
import './style.css';

const content = document.querySelector('#content');
const canvas = document.querySelector('#qr-canvas');
const dark = document.querySelector('#dark');
const light = document.querySelector('#light');
const size = document.querySelector('#size');
const status = document.querySelector('#status');
const historyRoot = document.querySelector('#history');
const storageKey = 'quickqr-history-v1';
let renderTimer;

function readHistory() {
  try { return JSON.parse(localStorage.getItem(storageKey)) ?? []; }
  catch { return []; }
}

function saveHistory(value) {
  if (!value.trim()) return;
  const next = [value.trim(), ...readHistory().filter((item) => item !== value.trim())].slice(0, 6);
  localStorage.setItem(storageKey, JSON.stringify(next));
  renderHistory();
}

function renderHistory() {
  const items = readHistory();
  historyRoot.innerHTML = items.length ? '' : '<p class="empty">Generated codes will appear here on this device.</p>';
  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.innerHTML = `<span>${escapeHtml(item)}</span><small>Use again →</small>`;
    button.addEventListener('click', () => { content.value = item; renderCode(); content.focus(); });
    historyRoot.append(button);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

async function renderCode() {
  const value = content.value.trim();
  if (!value) { status.textContent = 'Enter some content'; return; }
  status.textContent = 'Generating…';
  try {
    await QRCode.toCanvas(canvas, value, {
      width: Math.min(Number(size.value), 768), margin: 2,
      color: { dark: dark.value, light: light.value }, errorCorrectionLevel: 'H'
    });
    status.textContent = 'Ready to scan';
  } catch { status.textContent = 'Could not generate this code'; }
}

function queueRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderCode, 120);
}

document.querySelector('#qr-form').addEventListener('input', queueRender);
content.addEventListener('change', () => saveHistory(content.value));
document.querySelector('#download-png').addEventListener('click', async () => {
  await QRCode.toCanvas(canvas, content.value.trim(), { width: Number(size.value), margin: 2, color: { dark: dark.value, light: light.value }, errorCorrectionLevel: 'H' });
  const link = document.createElement('a');
  link.download = `quickqr-${Date.now()}.png`; link.href = canvas.toDataURL('image/png'); link.click();
  saveHistory(content.value); await renderCode(); status.textContent = 'PNG downloaded';
});
document.querySelector('#copy-image').addEventListener('click', () => canvas.toBlob(async (blob) => {
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); status.textContent = 'Copied to clipboard'; }
  catch { status.textContent = 'Image copy is not supported here'; }
}));
document.querySelector('#clear-history').addEventListener('click', () => { localStorage.removeItem(storageKey); renderHistory(); });

renderHistory();
renderCode();
