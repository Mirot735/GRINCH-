// ══════════════════════════════════════════════════════
// MINING SYSTEM v2 — по макету
// ══════════════════════════════════════════════════════

const MAX_MINERS_PER_TYPE = 8; // лимит на каждый тип шахты

// ── Инициализация S.miners ────────────────────────────
function initMining() {
  if (typeof S === 'undefined') { console.warn('initMining: S не определён'); return; }

  // S.miners берём из S (он уже загружен через save/load из grinch_state)
  // Если всё равно пусто — пробуем старый ключ 'miners' как fallback
  if (!S.miners || typeof S.miners !== 'object') {
    try {
      const old = localStorage.getItem('miners');
      S.miners = old ? JSON.parse(old) : {};
    } catch(e) { S.miners = {}; }
  }

  // miningPending тоже должны быть в S — если нет, берём из localStorage
  if (!S.miningPendingGifts)  S.miningPendingGifts  = 0;
  if (!S.miningPendingGrinch) S.miningPendingGrinch = 0;

  // Если lastAccrue никогда не ставился — ставим сейчас
  if (!localStorage.getItem('miningLastAccrue')) {
    localStorage.setItem('miningLastAccrue', Date.now());
  }

  accrueMiningIncome();
  renderMiningList();
  updateMiningTimer();
  fetchGrinchRate();
}

// ── Конфиг майнеров ───────────────────────────────────
const MINERS_GIFTS = [
  { id:'m_g1', name:'Носок Гринча',  img:'assets/img/Image_318.jpg', rarity:'common',    level:1, price:5000,   currency:'grinch', incomeDay:250,   incomeType:'gifts', desc:'Начальный майнер подарков' },
  { id:'m_g2', name:'Похититель',    img:'assets/img/Image_284.jpg', rarity:'rare',      level:2, price:20000,  currency:'grinch', incomeDay:1000,  incomeType:'gifts', desc:'Похищает подарки каждый день' },
  { id:'m_g3', name:'Гора подарков', img:'assets/img/Image_256.jpg', rarity:'epic',      level:3, price:60000,  currency:'grinch', incomeDay:3000,  incomeType:'gifts', desc:'Целая гора украденных подарков' },
  { id:'m_g4', name:'Пещера злодея', img:'assets/img/Image_168.jpg', rarity:'legendary', level:4, price:200000, currency:'grinch', incomeDay:10000, incomeType:'gifts', desc:'Тайная пещера Гринча' },
  { id:'m_g5', name:'Фабрика хаоса', img:'assets/img/Image_268.jpg', rarity:'legendary', level:5, price:600000, currency:'grinch', incomeDay:30000, incomeType:'gifts', desc:'Фабрика по производству хаоса' },
];

const MINERS_GRINCH = [
  { id:'m_t1', name:'Кошелёк вора',  img:'assets/img/miner_t1.png', rarity:'common',    level:1, price:0.5, currency:'ton', incomeDay:250,   incomeType:'grinch_real', desc:'Первый шаг к богатству' },
  { id:'m_t2', name:'Тайник Гринча', img:'assets/img/miner_t2.png', rarity:'rare',      level:2, price:2,   currency:'ton', incomeDay:1000,  incomeType:'grinch_real', desc:'Секретный тайник с токенами' },
  { id:'m_t3', name:'Зелёный банк',  img:'assets/img/miner_t3.png', rarity:'epic',      level:3, price:5,   currency:'ton', incomeDay:2500,  incomeType:'grinch_real', desc:'Зелёный банк Гринча' },
  { id:'m_t4', name:'Кит-злодей',    img:'assets/img/miner_t4.png', rarity:'legendary', level:4, price:15,  currency:'ton', incomeDay:7500,  incomeType:'grinch_real', desc:'Для серьёзных злодеев' },
  { id:'m_t5', name:'Токен-империя', img:'assets/img/miner_t5.png', rarity:'legendary', level:5, price:50,  currency:'ton', incomeDay:25000, incomeType:'grinch_real', desc:'Властелин токенов' },
];

// Цвета редкости
const RARITY_COLORS = {
  common:    { border:'#2ecc71',  bg:'rgba(3,12,5,0.97)',   label:'Обычный',    color:'#2ecc71',  glow:'rgba(46,204,113,0.5)' },
  rare:      { border:'#3498db',  bg:'rgba(3,8,18,0.97)',   label:'Редкий',     color:'#3498db',  glow:'rgba(52,152,219,0.5)' },
  epic:      { border:'#9b59b6',  bg:'rgba(10,3,18,0.97)',  label:'Эпический',  color:'#9b59b6',  glow:'rgba(155,89,182,0.5)' },
  legendary: { border:'#f1c40f',  bg:'rgba(12,8,1,0.97)',   label:'Легендарный',color:'#f1c40f',  glow:'rgba(241,196,15,0.5)' },
};

// ── Курс GRINCH ───────────────────────────────────────
let grinchRate = { tokensPerTon: 141000, updatedAt: 0 };
let currentMiningTab = 0;

const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

async function fetchGrinchRate() {
  const el = document.getElementById('grinchRateDisplay');
  if (el) el.textContent = '⏳ Загрузка...';

  try {
    const res = await fetch(
      `https://api.ston.fi/v1/pools/by_market/${GRINCH_CONTRACT}/${TON_ADDRESS}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      let pools = [];
      if (data.pool) pools = [data.pool];
      else if (data.pool_list) pools = data.pool_list;
      else if (data.pools) pools = data.pools;
      else if (Array.isArray(data)) pools = data;
      else pools = [data];

      for (const pool of pools) {
        if (!pool) continue;
        const r0str = String(pool.reserve0 || pool.token0_reserve || '0');
        const r1str = String(pool.reserve1 || pool.token1_reserve || '0');
        if (r0str !== '0' && r1str !== '0') {
          try {
            const r0b = BigInt(r0str), r1b = BigInt(r1str);
            const t0 = (pool.token0_address || pool.asset0_address || '').toLowerCase();
            let grinchR = r0b, tonR = r1b;
            if (t0 && t0.length > 10 && !t0.includes(GRINCH_CONTRACT.toLowerCase().slice(2,15))) {
              grinchR = r1b; tonR = r0b;
            }
            if (tonR > 0n) {
              const tpt = Number((grinchR * 1000n) / tonR) / 1000;
              if (tpt > 10) { _saveRate(Math.round(tpt), null); _showRate(el, Math.round(tpt)); return; }
            }
          } catch(e) {
            const r0f = parseFloat(r0str), r1f = parseFloat(r1str);
            if (r0f > 0 && r1f > 0) {
              const tpt = Math.round(r0f / r1f);
              if (tpt > 10) { _saveRate(tpt, null); _showRate(el, tpt); return; }
            }
          }
        }
      }
    }
  } catch(e) {}

  try {
    const [gR, tR] = await Promise.all([
      fetch(`https://api.ston.fi/v1/assets/${GRINCH_CONTRACT}`),
      fetch(`https://api.ston.fi/v1/assets/${TON_ADDRESS}`)
    ]);
    if (gR.ok && tR.ok) {
      const gD = await gR.json(), tD = await tR.json();
      const gUsd = parseFloat((gD.asset||gD).dex_usd_price || 0);
      const tUsd = parseFloat((tD.asset||tD).dex_usd_price || 0);
      if (gUsd > 0 && tUsd > 0) {
        const tpt = Math.round(tUsd / gUsd);
        if (tpt > 100) { _saveRate(tpt, gUsd); _showRate(el, tpt); return; }
      }
    }
  } catch(e) {}

  try {
    const res = await fetch(`https://tonapi.io/v2/rates?tokens=${GRINCH_CONTRACT}&currencies=ton`);
    if (res.ok) {
      const data = await res.json();
      const p = parseFloat(data.rates?.[GRINCH_CONTRACT]?.prices?.TON || 0);
      if (p > 0) { const tpt = Math.round(1/p); if (tpt > 100) { _saveRate(tpt, null); _showRate(el, tpt); return; } }
    }
  } catch(e) {}

  _useCachedRate(el);
}

function _saveRate(tpt, usd) { grinchRate = { tokensPerTon:tpt, usdPrice:usd, updatedAt:Date.now() }; localStorage.setItem('grinchRate', JSON.stringify(grinchRate)); }
function _showRate(el, tpt) { if (el) el.textContent = '1 TON = ~' + tpt.toLocaleString() + ' GRINCH'; updateMiningStats(); }
function _useCachedRate(el) {
  const c = localStorage.getItem('grinchRate');
  if (c) { try { grinchRate = JSON.parse(c); const m = Math.floor((Date.now()-grinchRate.updatedAt)/60000); if(el) el.textContent = '1 TON ≈ '+(grinchRate.tokensPerTon||141000).toLocaleString()+' GRINCH (кэш '+m+'м)'; } catch(e){} }
  else { grinchRate.tokensPerTon = 141000; if(el) el.textContent = '1 TON ≈ 141,000 GRINCH'; }
}

// ── Переключение вкладок ──────────────────────────────
function switchMiningTab(tab) {
  currentMiningTab = tab;
  ['miningTab0','miningTab1'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const active = i === tab;
    el.style.background = active ? (i===0?'rgba(241,196,15,0.25)':'rgba(46,204,113,0.25)') : 'transparent';
    el.style.color = active ? (i===0?'#f1c40f':'#2ecc71') : 'rgba(255,255,255,0.4)';
    el.style.fontWeight = active ? '800' : '600';
  });
  renderMiningList();
}

// ── Отрисовка списка майнеров ─────────────────────────
function renderMiningList() {
  const list = document.getElementById('miningList');
  if (!list) return;
  list.innerHTML = '';

  const miners = currentMiningTab === 0 ? MINERS_GIFTS : MINERS_GRINCH;
  const myMiners = (typeof S !== 'undefined' && S.miners) ? S.miners : {};
  const isGiftTab = currentMiningTab === 0;

  miners.forEach(function(m) {
    const owned = myMiners[m.id] || 0;
    const totalIncome = m.incomeDay * owned;
    const roi = m.currency === 'grinch' ? Math.round(m.price / m.incomeDay) : 20;
    const rarity = RARITY_COLORS[m.rarity] || RARITY_COLORS.common;
    const incomeIcon = isGiftTab ? '🎁' : '💎';

    const EMOJI_GIFTS = ['🧦','🎀','🌲','🏔️','🌟'];
    const EMOJI_GRINCH = ['💰','💵','🌿','🐋','💫'];
    const emoji = isGiftTab ? EMOJI_GIFTS[m.level-1] : EMOJI_GRINCH[m.level-1];

    const priceStr = m.currency === 'grinch'
      ? m.price.toLocaleString() + ' GRINCH'
      : m.price + ' TON';

    // ── Карточка ──
    const card = document.createElement('div');
    card.style.cssText = `background:${rarity.bg};border:1.5px solid ${rarity.border};border-radius:14px;padding:10px;display:flex;align-items:flex-start;gap:10px;position:relative;`;

    // ── Иконка ──
    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = `width:72px;height:72px;border-radius:12px;background:rgba(0,0,0,0.5);border:1.5px solid ${rarity.border};display:flex;align-items:center;justify-content:center;font-size:30px;flex-shrink:0;overflow:hidden;`;
    const img = document.createElement('img');
    img.src = m.img;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;';
    img.onerror = function() { this.style.display='none'; iconDiv.innerHTML += '<span style="font-size:30px;">'+emoji+'</span>'; };
    iconDiv.appendChild(img);
    card.appendChild(iconDiv);

    // ── Центр ──
    const center = document.createElement('div');
    center.style.cssText = 'flex:1;min-width:0;overflow:hidden;padding-right:2px;';
    center.innerHTML =
      '<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;min-width:0;">' +
        '<span style="font-size:12px;font-weight:900;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;min-width:0;">' + m.name + '</span>' +
        '<span style="font-size:8px;font-weight:800;background:rgba(0,0,0,0.6);border:1px solid '+rarity.border+';color:'+rarity.color+';border-radius:4px;padding:1px 4px;flex-shrink:0;">LVL '+m.level+'</span>' +
      '</div>' +
      (owned > 0
        ? '<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">⚡×<b style="color:'+rarity.color+'">'+owned+'</b> <b style="color:#ffe44d">+'+totalIncome.toLocaleString()+'/д</b></div>'
        : '<div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+m.desc+'</div>') +
      '<div style="display:flex;gap:4px;align-items:center;">' +
        '<span style="background:rgba(0,0,0,0.5);border:1px solid '+rarity.border+';border-radius:5px;padding:1px 5px;font-size:9px;font-weight:900;color:#ffe44d;white-space:nowrap;">🎁+'+m.incomeDay.toLocaleString()+'/д</span>' +
        '<span style="font-size:8px;color:rgba(255,255,255,0.35);white-space:nowrap;">⏱'+roi+'д</span>' +
      '</div>';
    card.appendChild(center);

    // ── Правый блок: цена + кнопки + точки ──
    const right = document.createElement('div');
    right.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;';
    const priceLabel = document.createElement('div');
    priceLabel.style.cssText = 'font-size:9px;font-weight:900;color:'+rarity.color+';white-space:nowrap;';
    priceLabel.textContent = priceStr;
    right.appendChild(priceLabel);

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:3px;';

    const isMaxed = owned >= MAX_MINERS_PER_TYPE;
    if (isMaxed) {
      const bLocked = document.createElement('button');
      bLocked.style.cssText = 'padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:7px;font-size:9px;font-weight:900;color:rgba(255,255,255,0.4);cursor:default;white-space:nowrap;';
      bLocked.innerHTML = '🔒 ПОЛНЫЙ';
      bLocked.disabled = true;
      btns.appendChild(bLocked);
    } else {
      const bMain = document.createElement('button');
      if (owned > 0) {
        bMain.style.cssText = 'padding:6px 12px;background:linear-gradient(135deg,#f1c40f,#e67e00);border:none;border-radius:7px;font-size:11px;font-weight:900;color:#1a0a00;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;';
        bMain.innerHTML = '⛏️ МАКС';
        bMain.onclick = function(){ buyMiner(m.id, 'max'); };
      } else {
        bMain.style.cssText = 'padding:6px 12px;background:linear-gradient(135deg,#27ae60,#1a7a40);border:1px solid rgba(46,204,113,0.5);border-radius:7px;font-size:11px;font-weight:900;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;';
        bMain.innerHTML = '⛏️ Купить';
        bMain.onclick = function(){ buyMiner(m.id, 1); };
      }
      btns.appendChild(bMain);
    }
    right.appendChild(btns);

    if (owned > 0) {
      const maxD = 8, filled = Math.min(owned, maxD);
      let d = '<div style="font-size:8px;color:rgba(255,255,255,0.3);text-align:right;margin-top:1px;">Прид:'+owned+'</div><div style="display:flex;gap:1px;justify-content:flex-end;margin-top:2px;">';
      for (let i = 0; i < maxD; i++) d += '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:'+(i<filled?rarity.color:'rgba(255,255,255,0.1)')+'"></span>';
      d += '</div>';
      const dotsEl = document.createElement('div');
      dotsEl.innerHTML = d;
      right.appendChild(dotsEl);
    }

    card.appendChild(right);
    list.appendChild(card);
  });

  updateMiningStats();
}

// ── Купить майнер ─────────────────────────────────────
function buyMiner(id, qty) {
  const miner = [...MINERS_GIFTS, ...MINERS_GRINCH].find(m => m.id === id);
  if (!miner) return;
  if (!S.miners) S.miners = {};

  const owned = S.miners[miner.id] || 0;

  // Проверяем лимит
  if (owned >= MAX_MINERS_PER_TYPE) {
    toast('🔒 Максимум ' + MAX_MINERS_PER_TYPE + ' шахт этого типа!');
    return;
  }

  // Считаем сколько можно ещё купить
  const canBuy = MAX_MINERS_PER_TYPE - owned;

  // Количество
  let count = 1;
  if (qty === 'max') {
    const byBalance = miner.currency === 'grinch' ? Math.floor(S.grinch / miner.price) : 1;
    count = Math.min(canBuy, byBalance);
    if (count <= 0) { toast('❌ Недостаточно ' + (miner.currency === 'grinch' ? 'GRINCH' : 'TON') + '!'); return; }
  } else {
    count = Math.min(qty || 1, canBuy);
  }

  if (miner.currency === 'grinch') {
    const total = miner.price * count;
    if (S.grinch < total) { toast('❌ Нужно ' + total.toLocaleString() + ' GRINCH!'); return; }

    accrueMiningIncome();

    S.grinch -= total;
    const hadMiners = Object.values(S.miners).some(v => v > 0);
    S.miners[miner.id] = owned + count;
    if (!hadMiners) localStorage.setItem('miningLastAccrue', Date.now());
    localStorage.setItem('miners', JSON.stringify(S.miners));
    save();

    const newOwned = S.miners[miner.id];
    const limitMsg = newOwned >= MAX_MINERS_PER_TYPE ? ' (МАКС!)' : '';
    toast('⛏️ ' + miner.name + ' ×' + count + ' куплен!' + limitMsg);
    renderMiningList();
    updateMenu();
  } else {
    if (typeof buyMinerTon === 'function') buyMinerTon(miner);
    else toast('Ошибка: TON функции не загружены');
  }
}

// ── Статистика ────────────────────────────────────────
function updateMiningStats() {
  const myMiners = (typeof S !== 'undefined' && S.miners) ? S.miners : {};
  let giftsPerDay = 0, grinchPerDay = 0;
  let bestMiner = null, bestIncome = 0;
  let totalCount = 0;

  MINERS_GIFTS.forEach(m => {
    const cnt = myMiners[m.id] || 0;
    const income = cnt * m.incomeDay;
    giftsPerDay += income;
    totalCount += cnt;
    if (income > bestIncome) { bestIncome = income; bestMiner = m.name + (cnt > 1 ? ' ×'+cnt : ''); }
  });
  MINERS_GRINCH.forEach(m => {
    const cnt = myMiners[m.id] || 0;
    const income = cnt * m.incomeDay;
    grinchPerDay += income;
    totalCount += cnt;
    if (income > bestIncome) { bestIncome = income; bestMiner = m.name + (cnt > 1 ? ' ×'+cnt : ''); }
  });

  // Кнопка — показывает накопленную сумму (текст в span поверх картинки)
  const claimText = document.getElementById('miningClaimText');
  const claimBtn = document.getElementById('miningClaimBtn');
  if (claimText) {
    const pendingG = S?.miningPendingGifts || 0;
    const pendingGr = S?.miningPendingGrinch || 0;
    if (pendingG > 0 && pendingGr > 0) {
      claimText.textContent = 'Собрать ' + pendingG.toLocaleString() + ' 🎁 + ' + pendingGr.toLocaleString() + ' GRINCH';
      if (claimBtn) claimBtn.style.opacity = '1';
    } else if (pendingG > 0) {
      claimText.textContent = 'Собрать ' + pendingG.toLocaleString() + ' подарков';
      if (claimBtn) claimBtn.style.opacity = '1';
    } else if (pendingGr > 0) {
      claimText.textContent = 'Собрать ' + pendingGr.toLocaleString() + ' GRINCH';
      if (claimBtn) claimBtn.style.opacity = '1';
    } else {
      claimText.textContent = 'Собрать всё';
      if (claimBtn) claimBtn.style.opacity = '0.55';
    }
  }

  // Доход в шапке
  const incomeEl = document.getElementById('miningTotalIncome');
  if (incomeEl) {
    const parts = [];
    if (giftsPerDay > 0) parts.push('+' + giftsPerDay.toLocaleString() + ' 🎁');
    if (grinchPerDay > 0) parts.push('+' + grinchPerDay.toLocaleString() + ' 🟢');
    incomeEl.textContent = parts.length ? parts.join('  ') : 'Нет майнеров';
  }

  // Следующий уровень — стрелка
  const nextEl = document.getElementById('miningNextIncome');
  if (nextEl && giftsPerDay > 0) {
    const nextTier = MINERS_GIFTS.find(m => m.incomeDay > giftsPerDay / Math.max(1, Object.keys(myMiners).length));
    if (nextTier) nextEl.textContent = '→ ' + (giftsPerDay + nextTier.incomeDay).toLocaleString() + '/день';
  }

  // Статистика внизу — как на макете (прозрачная рамка, 2 строки)
  const statsEl = document.getElementById('miningStatsBar');
  if (statsEl) {
    const total = giftsPerDay + grinchPerDay;
    const perHour = Math.floor(total / 24);
    statsEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
        '<span style="color:rgba(255,255,255,0.5);font-size:11px;">Общий доход: <b style="color:#f1c40f;">' + total.toLocaleString() + '/день</b></span>' +
        '<span style="color:rgba(255,255,255,0.5);font-size:11px;">Всего шахт: <b style="color:#fff;">' + totalCount + '</b></span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        (bestMiner ? '<span style="color:rgba(255,255,255,0.4);font-size:11px;">Лучшая шахта: <b style="color:#2ecc71;">' + bestMiner + '</b></span>' : '<span></span>') +
        (perHour > 0 ? '<span style="color:rgba(255,255,255,0.35);font-size:10px;">~+' + perHour.toLocaleString() + '/час</span>' : '') +
      '</div>';
  }

  // Превью на кнопке в меню
  const preview = document.getElementById('miningIncomePreview');
  if (preview) {
    const perHour = Math.floor((giftsPerDay + grinchPerDay) / 24);
    preview.textContent = perHour > 0 ? '+' + perHour + '/час' : '0/час';
  }
}

// ── Накопление дохода ─────────────────────────────────
function accrueMiningIncome() {
  if (typeof S === 'undefined') return;
  if (!S.miners) S.miners = {};
  const myMiners = S.miners;
  const hasMiners = Object.values(myMiners).some(v => v > 0);
  if (!hasMiners) return;

  const now = Date.now();
  const stored = +localStorage.getItem('miningLastAccrue');
  if (!stored) { localStorage.setItem('miningLastAccrue', now); return; }

  const hoursElapsed = (now - stored) / 3600000;
  if (hoursElapsed < 0.0167) return;
  const hoursToAccrue = Math.min(hoursElapsed, 24);

  let giftsEarned = 0, grinchEarned = 0;
  MINERS_GIFTS.forEach(function(m) { giftsEarned += (myMiners[m.id]||0) * m.incomeDay * hoursToAccrue / 24; });
  MINERS_GRINCH.forEach(function(m) { grinchEarned += (myMiners[m.id]||0) * m.incomeDay * hoursToAccrue / 24; });

  giftsEarned = Math.floor(giftsEarned);
  grinchEarned = Math.floor(grinchEarned);

  localStorage.setItem('miningLastAccrue', now);

  if (giftsEarned > 0 || grinchEarned > 0) {
    S.miningPendingGifts  = (S.miningPendingGifts  || 0) + giftsEarned;
    S.miningPendingGrinch = (S.miningPendingGrinch || 0) + grinchEarned;
    if (typeof save === 'function') save();
  }
}

// ── Таймер сбора ──────────────────────────────────────
function updateMiningTimer() {
  const el = document.getElementById('miningTimerDisplay');
  if (!el) return;
  const myMiners = (typeof S !== 'undefined' && S.miners) ? S.miners : {};
  const hasMiners = Object.values(myMiners).some(v => v > 0);
  if (!hasMiners) { el.textContent = 'Купи шахту чтобы начать майнинг!'; el.style.color = 'rgba(255,255,255,0.3)'; return; }

  const lastAccrue = +localStorage.getItem('miningLastAccrue');
  if (!lastAccrue) { el.textContent = ''; return; }

  const elapsed = Date.now() - lastAccrue;
  const interval = 3600000; // начисляем каждый час
  const remaining = Math.max(0, interval - (elapsed % interval));

  const h = Math.floor(elapsed / 3600000);
  const mR = Math.floor((remaining % 3600000) / 60000);
  const sR = Math.floor((remaining % 60000) / 1000);

  const pendingG = S?.miningPendingGifts || 0;
  const pendingGr = S?.miningPendingGrinch || 0;

  if (pendingG > 0 || pendingGr > 0) {
    el.textContent = 'Следующее начисление через: ' +
      String(mR).padStart(2,'0') + ':' + String(sR).padStart(2,'0');
    el.style.color = 'rgba(46,204,113,0.6)';
  } else {
    el.textContent = 'Следующее начисление через: ' +
      String(mR).padStart(2,'0') + ':' + String(sR).padStart(2,'0');
    el.style.color = 'rgba(255,255,255,0.4)';
  }
}

// ── Забрать ───────────────────────────────────────────
function claimMining() {
  accrueMiningIncome();
  if (typeof S === 'undefined') return;

  const pendingGifts  = S.miningPendingGifts  || 0;
  const pendingGrinch = S.miningPendingGrinch || 0;

  if (pendingGifts === 0 && pendingGrinch === 0) {
    toast('⏳ Пока нечего забирать!'); return;
  }

  if (pendingGrinch > 0) {
    // GRINCH токены — модал вывода
    const modal = document.getElementById('withdrawModal');
    if (modal) {
      document.getElementById('withdrawAmount').textContent = pendingGrinch.toLocaleString() + ' GRINCH';
      if (S.wallet) document.getElementById('withdrawWallet').value = S.walletFull || '';
      modal.style.display = 'flex';
    }
    // Подарки зачисляем сразу
    if (pendingGifts > 0) {
      S.gifts += pendingGifts; S.seasonBank += pendingGifts;
      S.miningPendingGifts = 0;
      if (typeof save === 'function') save();
    }
    return;
  }

  // Только подарки
  S.gifts += pendingGifts; S.seasonBank += pendingGifts;
  S.miningPendingGifts = 0;
  if (typeof save === 'function') save();
  toast('🎁 +' + pendingGifts.toLocaleString() + ' подарков от шахт!');
  if (typeof updateMenu === 'function') updateMenu();
  updateMiningStats();
}

function submitWithdraw() {
  const wallet = document.getElementById('withdrawWallet')?.value?.trim();
  if (!wallet || wallet.length < 10) { toast('❌ Введи правильный TON кошелёк!'); return; }
  const amount = S?.miningPendingGrinch || 0;
  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || S?.nick || 'unknown';
  const BOT_TOKEN = '8536652053:AAF3WV2etPzjJHpMGl3YIlbrpkimEvi3TYs';
  const msg = '💎 ВЫВОД GRINCH!\n\nИгрок: ' + tgId + '\nСумма: ' + amount.toLocaleString() + ' GRINCH\nКошелёк: ' + wallet;
  fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ chat_id: tgId, text: msg })
  }).catch(()=>{});
  if (S?.miningPendingGifts > 0) { S.gifts += S.miningPendingGifts; S.seasonBank += S.miningPendingGifts; }
  S.miningPendingGrinch = 0; S.miningPendingGifts = 0;
  if (typeof save === 'function') save();
  closeWithdrawModal();
  toast('✅ Заявка отправлена! Выплата в течение 24ч');
  if (typeof updateMenu === 'function') updateMenu();
}

function closeWithdrawModal() {
  const m = document.getElementById('withdrawModal');
  if (m) m.style.display = 'none';
}

// ── Таймеры ───────────────────────────────────────────
setInterval(function() { accrueMiningIncome(); updateMiningStats(); }, 60000);  // начисление раз в минуту
setInterval(function() { updateMiningTimer(); }, 1000);  // таймер тикает каждую секунду
document.addEventListener('DOMContentLoaded', function() { setTimeout(function() { accrueMiningIncome(); updateMiningTimer(); }, 1500); });
