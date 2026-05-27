// ========== СИСТЕМА ЭНЕРГИИ ==========
const ENERGY_MAX      = 5;
const ENERGY_REGEN_MS = 30 * 60 * 1000; // 30 мин на 1 единицу

// Цены покупки энергии
const ENERGY_SHOP = [
  { amount: 1, price: 10,  currency: 'grinch', label: '+1 ⚡',  desc: '10 GRINCH'  },
  { amount: 3, price: 25,  currency: 'grinch', label: '+3 ⚡',  desc: '25 GRINCH'  },
  { amount: 5, price: 50,  currency: 'grinch', label: 'ПОЛНАЯ', desc: '50 GRINCH'  },
];

function getEnergy() {
  const stored  = localStorage.getItem('energy');
  const energy  = (stored === null) ? ENERGY_MAX : +stored;
  const last    = +localStorage.getItem('energyLast') || Date.now();
  const elapsed = Date.now() - last;
  const regen   = Math.floor(elapsed / ENERGY_REGEN_MS);

  if (regen > 0) {
    const newE = Math.min(ENERGY_MAX, energy + regen);
    localStorage.setItem('energy', newE);
    localStorage.setItem('energyLast', last + regen * ENERGY_REGEN_MS);
    if (window.S) S.energy = newE;
    return newE;
  }
  return Math.min(ENERGY_MAX, energy);
}

function useEnergy() {
  const e = getEnergy();
  if (e <= 0) { openEnergyModal(); return false; }
  const newE = e - 1;
  localStorage.setItem('energy', newE);
  if (newE < ENERGY_MAX) localStorage.setItem('energyLast', Date.now());
  if (window.S) S.energy = newE;
  updateEnergyUI();
  return true;
}

function getEnergyNextMs() {
  const e = getEnergy();
  if (e >= ENERGY_MAX) return 0;
  const last    = +localStorage.getItem('energyLast') || Date.now();
  const elapsed = Date.now() - last;
  return ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
}

// ── Покупка энергии ────────────────────────────────────
function buyEnergy(idx) {
  const opt = ENERGY_SHOP[idx];
  if (!opt) return;

  const curGrinch = (window.S && S.grinch) || parseInt(localStorage.getItem('grinch') || '0', 10);
  if (curGrinch < opt.price) {
    if (typeof toast === 'function') toast('❌ Недостаточно GRINCH токенов!');
    return;
  }

  const curE  = getEnergy();
  const newE  = opt.amount === 5 ? ENERGY_MAX : Math.min(ENERGY_MAX, curE + opt.amount);
  const added = newE - curE;
  if (added <= 0) {
    if (typeof toast === 'function') toast('⚡ Энергия уже полная!');
    return;
  }

  // Списываем GRINCH
  const newGrinch = curGrinch - opt.price;
  localStorage.setItem('grinch', String(newGrinch));
  localStorage.setItem('energy', String(newE));
  if (newE < ENERGY_MAX) localStorage.setItem('energyLast', Date.now());
  else localStorage.removeItem('energyLast');

  if (window.S) {
    S.grinch = newGrinch;
    S.energy = newE;
    if (typeof save === 'function') try { save(); } catch(e) {}
  }

  // Обновляем балансы в UI
  ['menuGrinch','shopGrinch','pGrinch'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = newGrinch.toLocaleString();
  });

  updateEnergyUI();
  updateEnergyModalContent();
  if (typeof toast === 'function') toast('⚡ +' + added + ' энергии!');
}

function updateEnergyUI() {
  const e  = getEnergy();
  const el = document.getElementById('menuEnergy');
  if (el) {
    el.textContent  = e + '/' + ENERGY_MAX;
    el.style.color  = e === 0 ? '#e74c3c' : e < ENERGY_MAX ? '#f1c40f' : '#3498db';
  }
  document.querySelectorAll('.energy-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < e);
  });
}

function openEnergyModal() {
  let modal = document.getElementById('energyModal');
  if (!modal) {
    modal = _buildEnergyModal();
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  updateEnergyModalContent();
}

function closeEnergyModal() {
  const modal = document.getElementById('energyModal');
  if (modal) modal.style.display = 'none';
}

// ── Строим модалку ─────────────────────────────────────
function _buildEnergyModal() {
  const modal = document.createElement('div');
  modal.id = 'energyModal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;'
    + 'align-items:flex-end;justify-content:center;'
    + 'background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);';
  modal.onclick = function(e) { if (e.target === modal) closeEnergyModal(); };

  modal.innerHTML = `
    <div style="width:100%;max-width:480px;background:#050505;border:1px solid rgba(0,255,136,0.2);
      border-radius:20px 20px 0 0;padding:20px 16px 32px;position:relative;overflow:hidden;">

      <!-- Линия сверху -->
      <div style="position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(0,255,136,0.6),transparent);"></div>

      <!-- Хэндл -->
      <div style="width:40px;height:3px;background:rgba(255,255,255,0.15);border-radius:2px;
        margin:0 auto 16px;"></div>

      <!-- Заголовок -->
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;
          color:#00ff88;text-shadow:0 0 16px rgba(0,255,136,0.8);letter-spacing:2px;">⚡ ЭНЕРГИЯ</div>
        <div id="eicTimer" style="font-family:'IBM Plex Mono',monospace;font-size:11px;
          color:rgba(0,255,136,0.4);margin-top:4px;letter-spacing:1px;"></div>
      </div>

      <!-- Шарики энергии -->
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:20px;">
        ${Array.from({length:ENERGY_MAX},(_,i)=>`
          <div class="eic-ball" style="width:36px;height:36px;border-radius:50%;
            border:2px solid rgba(0,255,136,0.3);background:rgba(0,0,0,0.6);
            display:flex;align-items:center;justify-content:center;font-size:16px;
            transition:all .3s;" data-idx="${i}">⚡</div>`).join('')}
      </div>

      <!-- Покупка -->
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:rgba(0,255,136,0.4);
        letter-spacing:2px;text-align:center;margin-bottom:10px;">// КУПИТЬ ЗА GRINCH</div>

      <div style="display:flex;gap:8px;margin-bottom:16px;">
        ${ENERGY_SHOP.map((opt,i)=>`
          <button onclick="buyEnergy(${i})" style="flex:1;padding:12px 4px;
            background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.25);
            border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent;
            display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:900;
              color:#00ff88;text-shadow:0 0 8px rgba(0,255,136,0.6);">${opt.label}</div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;
              color:rgba(255,215,0,0.7);">🟢 ${opt.desc}</div>
          </button>`).join('')}
      </div>

      <!-- Ждать -->
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
        border-radius:10px;padding:12px;text-align:center;margin-bottom:12px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;
          color:rgba(255,255,255,0.3);letter-spacing:1px;">РЕГЕНЕРАЦИЯ</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;
          color:rgba(255,255,255,0.5);margin-top:4px;">+1 ⚡ каждые 30 минут</div>
      </div>

      <button onclick="closeEnergyModal()" style="width:100%;padding:13px;
        background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:10px;
        font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;
        color:rgba(255,255,255,0.3);cursor:pointer;letter-spacing:2px;">ЗАКРЫТЬ</button>
    </div>`;

  return modal;
}

function updateEnergyModalContent() {
  const e = getEnergy();
  document.querySelectorAll('.eic-ball').forEach((b, i) => {
    const filled = i < e;
    b.style.background   = filled ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.6)';
    b.style.borderColor  = filled ? '#00ff88' : 'rgba(0,255,136,0.2)';
    b.style.boxShadow    = filled ? '0 0 10px rgba(0,255,136,0.5)' : 'none';
  });
  const timerEl = document.getElementById('eicTimer');
  if (timerEl) {
    if (e >= ENERGY_MAX) {
      timerEl.textContent = '⚡ ЭНЕРГИЯ ПОЛНАЯ';
      timerEl.style.color = '#00ff88';
    } else {
      const ms = getEnergyNextMs();
      const m  = Math.floor(ms / 60000);
      const s  = Math.floor((ms % 60000) / 1000);
      timerEl.textContent = '+1 ⚡ через ' + m + 'м ' + String(s).padStart(2, '0') + 'с';
      timerEl.style.color = 'rgba(0,255,136,0.4)';
    }
  }
}

function startGameWithEnergy() {
  if (!useEnergy()) return;
  show('game'); startGame();
}

// ========== ТАЙМЕР СОБЫТИЙ ==========
function updateEventTimer() {
  const el = document.getElementById('eventTimer');
  if (!el) return;
  let end = +localStorage.getItem('eventEnd');
  if (!end) { end = Date.now() + 7*24*3600*1000; localStorage.setItem('eventEnd', end); }
  const diff = end - Date.now();
  if (diff <= 0) { el.textContent = 'Скоро'; return; }
  el.textContent = Math.floor(diff/86400000) + 'д ' + Math.floor((diff%86400000)/3600000) + 'ч';
}

setInterval(() => {
  updateEnergyUI();
  if (typeof dailyUpdMenuTile === 'function') dailyUpdMenuTile();
  updateEventTimer();
  const modal = document.getElementById('energyModal');
  if (modal && modal.style.display !== 'none') updateEnergyModalContent();
}, 15000);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateEnergyUI();
    if (typeof dailyUpdMenuTile === 'function') dailyUpdMenuTile();
    updateEventTimer();
  }, 600);
});

function updateDailyTimer() {
  if (typeof dailyUpdMenuTile === 'function') dailyUpdMenuTile();
}

