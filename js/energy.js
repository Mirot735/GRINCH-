// ========== СИСТЕМА ЭНЕРГИИ ==========
const ENERGY_MAX = 5;
const ENERGY_REGEN_MS = 30 * 60 * 1000; // 30 минут на 1 единицу

function getEnergy() {
  const stored = localStorage.getItem('energy');
  const energy = (stored === null) ? ENERGY_MAX : +stored;
  const last = +localStorage.getItem('energyLast') || Date.now();
  const elapsed = Date.now() - last;
  const regen = Math.floor(elapsed / ENERGY_REGEN_MS);

  if (regen > 0) {
    const newE = Math.min(ENERGY_MAX, energy + regen);
    localStorage.setItem('energy', newE);
    localStorage.setItem('energyLast', last + regen * ENERGY_REGEN_MS);
    return newE;
  }
  return Math.min(ENERGY_MAX, energy);
}

function useEnergy() {
  const e = getEnergy();
  if (e <= 0) { openEnergyModal(); return false; }
  const newE = e - 1;
  localStorage.setItem('energy', newE);
  if (newE < ENERGY_MAX && !localStorage.getItem('energyLast')) {
    localStorage.setItem('energyLast', Date.now());
  }
  updateEnergyUI();
  return true;
}

function getEnergyNextMs() {
  const e = getEnergy();
  if (e >= ENERGY_MAX) return 0;
  const last = +localStorage.getItem('energyLast') || Date.now();
  const elapsed = Date.now() - last;
  return ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
}

function updateEnergyUI() {
  const e = getEnergy();
  const el = document.getElementById('menuEnergy');
  if (el) {
    el.textContent = e + '/' + ENERGY_MAX;
    el.style.color = e === 0 ? '#e74c3c' : e < ENERGY_MAX ? '#f1c40f' : '#3498db';
  }
  document.querySelectorAll('.energy-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < e);
  });
}

function openEnergyModal() {
  const modal = document.getElementById('energyModal');
  if (modal) { modal.classList.add('show'); updateEnergyModalContent(); }
}
function closeEnergyModal() {
  const modal = document.getElementById('energyModal');
  if (modal) modal.classList.remove('show');
}
function updateEnergyModalContent() {
  const e = getEnergy();
  document.querySelectorAll('.eic-ball').forEach((b, i) => b.classList.toggle('filled', i < e));
  const timerEl = document.getElementById('eicTimer');
  if (timerEl) {
    if (e >= ENERGY_MAX) { timerEl.textContent = '⚡ Энергия полная!'; return; }
    const ms = getEnergyNextMs();
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    timerEl.textContent = '⏱ Следующая через ' + m + 'м ' + String(s).padStart(2,'0') + 'с';
  }
}

function startGameWithEnergy() {
  if (!useEnergy()) return;
  show('game'); startGame();
}

// ========== ЕЖЕДНЕВНАЯ НАГРАДА — логика перенесена в daily.js ==========

// ========== ТАЙМЕР СОБЫТИЙ ==========
function updateEventTimer() {
  const el = document.getElementById('eventTimer'); if (!el) return;
  let end = +localStorage.getItem('eventEnd');
  if (!end) { end = Date.now()+7*24*3600*1000; localStorage.setItem('eventEnd',end); }
  const diff = end - Date.now();
  if (diff <= 0) { el.textContent = 'Скоро'; return; }
  el.textContent = Math.floor(diff/86400000) + 'д ' + Math.floor((diff%86400000)/3600000) + 'ч';
}

setInterval(() => { updateEnergyUI(); if(typeof dailyUpdMenuTile==='function')dailyUpdMenuTile(); updateEventTimer();
  if(document.getElementById('energyModal')?.classList.contains('show')) updateEnergyModalContent();
}, 15000);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { updateEnergyUI(); if(typeof dailyUpdMenuTile==='function')dailyUpdMenuTile(); updateEventTimer(); }, 600);
});

// Алиас для совместимости с init.js
function updateDailyTimer() {
  if (typeof dailyUpdMenuTile === 'function') dailyUpdMenuTile();
}
