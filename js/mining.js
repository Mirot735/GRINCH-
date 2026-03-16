// ══════════════════════════════════════════════════════
// MINING SYSTEM — mining.js
// ══════════════════════════════════════════════════════

// ── Инициализация S.miners если нет ──────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (typeof S !== 'undefined') {
    if (!S.miners) S.miners = JSON.parse(localStorage.getItem('miners')||'{}');
    if (!S.miningPendingGifts)  S.miningPendingGifts  = +localStorage.getItem('miningPendingGifts')||0;
    if (!S.miningPendingGrinch) S.miningPendingGrinch = +localStorage.getItem('miningPendingGrinch')||0;
  }
});

// ── Конфиг майнеров ───────────────────────────────────
const MINERS_GIFTS = [
  { id:'m_g1', name:'🧦 Носок Гринча',   icon:'🧦', level:1, price:5000,   currency:'grinch', incomeDay:250,  incomeType:'gifts',  desc:'Начальный майнер подарков' },
  { id:'m_g2', name:'🎀 Похититель',     icon:'🎀', level:2, price:20000,  currency:'grinch', incomeDay:1000, incomeType:'gifts',  desc:'Похищает подарки каждый день' },
  { id:'m_g3', name:'🌲 Гора подарков',  icon:'🌲', level:3, price:60000,  currency:'grinch', incomeDay:3000, incomeType:'gifts',  desc:'Целая гора украденных подарков' },
  { id:'m_g4', name:'🏔️ Пещера злодея', icon:'🏔️', level:4, price:200000, currency:'grinch', incomeDay:10000,incomeType:'gifts',  desc:'Тайная пещера Гринча' },
  { id:'m_g5', name:'🌟 Фабрика хаоса', icon:'🌟', level:5, price:600000, currency:'grinch', incomeDay:30000,incomeType:'gifts',  desc:'Фабрика по производству хаоса' },
];

const MINERS_GRINCH = [
  { id:'m_t1', name:'💰 Кошелёк вора',   icon:'💰', level:1, price:0.5,  currency:'ton', incomeDay:250,   incomeType:'grinch_real', desc:'Первый шаг к богатству' },
  { id:'m_t2', name:'💵 Тайник Гринча',  icon:'💵', level:2, price:2,    currency:'ton', incomeDay:1000,  incomeType:'grinch_real', desc:'Секретный тайник с токенами' },
  { id:'m_t3', name:'🌿 Зелёный банк',   icon:'🌿', level:3, price:5,    currency:'ton', incomeDay:2500,  incomeType:'grinch_real', desc:'Зелёный банк Гринча' },
  { id:'m_t4', name:'🐋 Кит-злодей',     icon:'🐋', level:4, price:15,   currency:'ton', incomeDay:7500,  incomeType:'grinch_real', desc:'Для серьёзных злодеев' },
  { id:'m_t5', name:'💫 Токен-империя',  icon:'💫', level:5, price:50,   currency:'ton', incomeDay:25000, incomeType:'grinch_real', desc:'Властелин токенов' },
];

// ── Текущий курс GRINCH ───────────────────────────────
let grinchRate = { tonPerMillion: 3.54, updatedAt: 0 };
let currentMiningTab = 0;

// ── GRINCH_CONTRACT уже объявлен в config.js ─────────
// (убрали дублирующий const — вызывал SyntaxError)
// Native TON address на STON.fi
const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

async function fetchGrinchRate() {
  const el = document.getElementById('grinchRateDisplay');
  if (el) el.textContent = '⏳ Загрузка...';

  // ── Метод 1: STON.fi — пул GRINCH/TON по market ──────
  // GET /v1/pools/by_market/{asset0}/{asset1}
  try {
    const res = await fetch(
      `https://api.ston.fi/v1/pools/by_market/${GRINCH_CONTRACT}/${TON_ADDRESS}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      // STON.fi v1 возвращает { pool: {...} } или { pool_list: [...] }
      let pools = [];
      if (data.pool) pools = [data.pool];
      else if (data.pool_list) pools = data.pool_list;
      else if (data.pools) pools = data.pools;
      else if (Array.isArray(data)) pools = data;
      else pools = [data];

      for (const pool of pools) {
        if (!pool) continue;
        const r0 = parseFloat(pool.reserve0 || pool.token0_reserve || 0);
        const r1 = parseFloat(pool.reserve1 || pool.token1_reserve || 0);
        // Резервы — огромные числа (18+ знаков), используем BigInt для точности
        const r0str = String(pool.reserve0 || pool.token0_reserve || '0');
        const r1str = String(pool.reserve1 || pool.token1_reserve || '0');
        if (r0str !== '0' && r1str !== '0') {
          try {
            const r0b = BigInt(r0str);
            const r1b = BigInt(r1str);
            // by_market/GRINCH/TON → reserve0=GRINCH, reserve1=TON (оба 9 decimals)
            // tokensPerTon = reserve0 / reserve1
            const t0 = (pool.token0_address || pool.asset0_address || pool.asset0 || '').toLowerCase();
            let grinchR = r0b, tonR = r1b;
            // Если token0 НЕ GRINCH — меняем местами
            if (t0 && t0.length > 10 && !t0.includes(GRINCH_CONTRACT.toLowerCase().slice(2, 15))) {
              grinchR = r1b; tonR = r0b;
            }
            if (tonR > 0n) {
              // Умножаем на 1000 для сохранения дробной части
              const tokensPerTon = Number((grinchR * 1000n) / tonR) / 1000;
              if (tokensPerTon > 10) {
                _saveRate(Math.round(tokensPerTon), null);
                _showRate(el, Math.round(tokensPerTon));
                return;
              }
            }
          } catch(bigIntErr) {
            // BigInt не поддерживается — fallback на float
            const r0f = parseFloat(r0str), r1f = parseFloat(r1str);
            if (r0f > 0 && r1f > 0) {
              const tokensPerTon = Math.round(r0f / r1f);
              if (tokensPerTon > 10) {
                _saveRate(tokensPerTon, null);
                _showRate(el, tokensPerTon);
                return;
              }
            }
          }
        }
      }
    }
  } catch(e) { console.warn('STON pool:', e); }

  // ── Метод 2: STON.fi asset — dex_usd_price ────────────
  // GET /v1/assets/{address}
  try {
    const [grinchRes, tonRes] = await Promise.all([
      fetch(`https://api.ston.fi/v1/assets/${GRINCH_CONTRACT}`),
      fetch(`https://api.ston.fi/v1/assets/${TON_ADDRESS}`)
    ]);
    if (grinchRes.ok && tonRes.ok) {
      const gData = await grinchRes.json();
      const tData = await tonRes.json();
      const grinchUsd = parseFloat((gData.asset||gData).dex_usd_price || (gData.asset||gData).dex_price_usd || 0);
      const tonUsd    = parseFloat((tData.asset||tData).dex_usd_price || (tData.asset||tData).dex_price_usd || 0);
      if (grinchUsd > 0 && tonUsd > 0) {
        const tokensPerTon = Math.round(tonUsd / grinchUsd);
        if (tokensPerTon > 100) {
          _saveRate(tokensPerTon, grinchUsd);
          _showRate(el, tokensPerTon);
          return;
        }
      }
    }
  } catch(e) { console.warn('STON asset:', e); }

  // ── Метод 3: TonAPI rates ─────────────────────────────
  try {
    const res = await fetch(
      `https://tonapi.io/v2/rates?tokens=${GRINCH_CONTRACT}&currencies=ton`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const priceInTon = parseFloat(
        data.rates?.[GRINCH_CONTRACT]?.prices?.TON || 0
      );
      if (priceInTon > 0) {
        const tokensPerTon = Math.round(1 / priceInTon);
        if (tokensPerTon > 100) {
          _saveRate(tokensPerTon, null);
          _showRate(el, tokensPerTon);
          return;
        }
      }
    }
  } catch(e) { console.warn('TonAPI:', e); }

  // ── Метод 4: DeDust резервы пула ──────────────────────
  try {
    const res = await fetch(
      `https://api.dedust.io/v2/pools?address=${GRINCH_CONTRACT}`
    );
    if (res.ok) {
      const pools = await res.json();
      const p = Array.isArray(pools) ? pools[0] : pools;
      if (p?.reserves) {
        const [r0, r1] = p.reserves;
        const tokensPerTon = Math.round(parseFloat(r0) / parseFloat(r1));
        if (tokensPerTon > 100) {
          _saveRate(tokensPerTon, null);
          _showRate(el, tokensPerTon);
          return;
        }
      }
    }
  } catch(e) { console.warn('DeDust:', e); }

  // ── Все не сработали — кэш или хардкод ───────────────
  _useCachedRate(el);
}

function _saveRate(tokensPerTon, usdPrice) {
  grinchRate = { tokensPerTon, usdPrice, updatedAt: Date.now() };
  localStorage.setItem('grinchRate', JSON.stringify(grinchRate));
}

function _showRate(el, tokensPerTon) {
  if (el) el.textContent = `1 TON = ~${tokensPerTon.toLocaleString()} GRINCH`;
  // Обновляем только строки цен в уже отрисованных карточках
  _updatePricesInCards();
}

function _updatePricesInCards() {
  // Обновляем отображение цен в уже отрисованных карточках
  // без полного перерендера
  document.querySelectorAll('[data-miner-price]').forEach(el => {
    const minerId = el.getAttribute('data-miner-price');
    const miner = [...MINERS_GIFTS, ...MINERS_GRINCH].find(m => m.id === minerId);
    if (miner && miner.currency === 'ton') {
      const tpt = grinchRate.tokensPerTon || 141000;
      el.textContent = miner.price + ' TON ≈ ' + Math.round(miner.price * tpt).toLocaleString() + ' G';
    }
  });
}

function _useCachedRate(el) {
  const cached = localStorage.getItem('grinchRate');
  if (cached) {
    try {
      grinchRate = JSON.parse(cached);
      const mins = Math.floor((Date.now() - grinchRate.updatedAt) / 60000);
      if (el) el.textContent = `1 TON ≈ ${(grinchRate.tokensPerTon||141000).toLocaleString()} GRINCH (кэш ${mins}м)`;
    } catch(e) {}
  } else {
    grinchRate.tokensPerTon = 141000;
    if (el) el.textContent = '1 TON ≈ 141,000 GRINCH';
  }
}

// ── Переключение вкладок ──────────────────────────────
function switchMiningTab(tab) {
  currentMiningTab = tab;
  const t0 = document.getElementById('miningTab0');
  const t1 = document.getElementById('miningTab1');
  if (tab === 0) {
    if(t0){t0.style.background='rgba(241,196,15,0.25)';t0.style.color='#f1c40f';t0.style.boxShadow='none';}
    if(t1){t1.style.background='transparent';t1.style.color='rgba(255,255,255,0.4)';}
  } else {
    if(t1){t1.style.background='rgba(46,204,113,0.25)';t1.style.color='#2ecc71';}
    if(t0){t0.style.background='transparent';t0.style.color='rgba(255,255,255,0.4)';}
  }
  renderMiningList(); // рендерим сразу — курс уже в grinchRate
}

// ── Отрисовка списка майнеров ─────────────────────────
function renderMiningList() {
  const list = document.getElementById('miningList');
  if (!list) { console.warn('miningList not found'); return; }
  list.innerHTML = '';

  const miners = currentMiningTab === 0 ? MINERS_GIFTS : MINERS_GRINCH;
  // Безопасно получаем miners — даже если S.miners не определён
  const myMiners = (typeof S !== 'undefined' && S.miners) ? S.miners : {};

  if (!miners || miners.length === 0) {
    list.innerHTML = '<div style="color:red;padding:20px;">Ошибка: нет данных майнеров</div>';
    return;
  }

  miners.forEach(function(m) {
    const owned = myMiners[m.id] || 0;
    const hasOne = owned > 0;
    const incomePerDay = m.incomeDay * owned;
    const isGift = m.incomeType === 'gifts';
    const color = isGift ? '#f1c40f' : '#2ecc71';
    const borderColor = isGift ? 'rgba(241,196,15,0.35)' : 'rgba(46,204,113,0.35)';
    const btnColor = isGift ? '#e67e22' : '#27ae60';
    const txtColor = isGift ? '#1a0a00' : '#fff';
    const priceStr = m.currency === 'grinch'
      ? m.price.toLocaleString() + ' GRINCH'
      : m.price + ' TON';

    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,rgba(0,0,0,0.7),rgba(0,0,0,0.5));border:1.5px solid ' + borderColor + ';border-radius:18px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:2px;';

    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = 'width:56px;height:56px;border-radius:14px;background:rgba(0,0,0,0.4);border:1px solid ' + borderColor + ';display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;';
    iconDiv.textContent = m.icon;

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex:1;min-width:0;';
    infoDiv.innerHTML =
      '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">' +
        '<span style="font-size:13px;font-weight:800;color:#fff;">' + m.name + '</span>' +
        '<span style="font-size:8px;font-weight:700;color:' + color + ';background:rgba(0,0,0,0.3);border:1px solid ' + borderColor + ';border-radius:5px;padding:1px 5px;">LVL ' + m.level + '</span>' +
      '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:5px;">' + m.desc + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<span style="background:rgba(0,0,0,0.3);border-radius:7px;padding:3px 7px;font-size:10px;font-weight:700;color:' + color + ';">+' + m.incomeDay.toLocaleString() + '/день</span>' +
        '<span style="background:rgba(0,0,0,0.3);border-radius:7px;padding:3px 7px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);">+' + Math.floor(m.incomeDay/24) + '/час</span>' +
      '</div>' +
      (hasOne ? '<div style="margin-top:5px;font-size:10px;color:#2ecc71;font-weight:700;">✅ У тебя: ' + owned + ' шт → +' + incomePerDay.toLocaleString() + '/день</div>' : '');

    const btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;';

    const priceEl = document.createElement('div');
    priceEl.style.cssText = 'font-size:10px;font-weight:800;color:' + color + ';text-align:center;';
    priceEl.textContent = priceStr;

    const btn = document.createElement('button');
    btn.style.cssText = 'padding:8px 12px;background:linear-gradient(135deg,' + color + ',' + btnColor + ');border:none;border-radius:10px;font-size:11px;font-weight:900;color:' + txtColor + ';cursor:pointer;white-space:nowrap;';
    btn.textContent = hasOne ? '+ Ещё' : '⛏️ Купить';
    btn.onclick = function() { buyMiner(m.id); };

    btnDiv.appendChild(priceEl);
    btnDiv.appendChild(btn);
    card.appendChild(iconDiv);
    card.appendChild(infoDiv);
    card.appendChild(btnDiv);
    list.appendChild(card);
  });

  updateMiningStats();
}

// ── Купить майнер ─────────────────────────────────────
function buyMiner(id) {
  const miner = [...MINERS_GIFTS, ...MINERS_GRINCH].find(m => m.id === id);
  if (!miner) return;

  if (miner.currency === 'grinch') {
    if (S.grinch < miner.price) {
      toast('❌ Недостаточно GRINCH! Нужно ' + miner.price.toLocaleString());
      return;
    }
    S.grinch -= miner.price;
    if (!S.miners) S.miners = {};
    S.miners[miner.id] = (S.miners[miner.id] || 0) + 1;
    save();
    toast('⛏️ ' + miner.name + ' куплен! +' + miner.incomeDay.toLocaleString() + '/день');
    renderMiningList();
    updateMenu();
  } else {
    // TON покупка — напрямую через sendTonPayment
    buyMinerTon(miner);
  }
}

// ── Покупка TON-майнера — СРАЗУ открывает Tonkeeper ────────
async function buyMinerTon(miner) {
  if (!window.getTonUI) { toast('TON Connect не загружен'); return; }

  // Если кошелёк не подключён — подключаем
  if (!S.walletFull) {
    toast('💎 Сначала подключи кошелёк!');
    try {
      const ui = getTonUI();
      await ui.openModal();
      // После подключения повторяем
      const check = setInterval(() => {
        if (S.walletFull) { clearInterval(check); buyMinerTon(miner); }
      }, 500);
      setTimeout(() => clearInterval(check), 30000);
    } catch(e) {}
    return;
  }

  // Кошелёк подключён — СРАЗУ отправляем транзакцию
  const ui = getTonUI();
  const nanoTon = Math.round(miner.price * 1_000_000_000).toString();
  const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || S.nick;
  const comment = 'grinch_' + tgId + '_miner_' + miner.id;
  const payload = _buildCommentPayload(comment);

  // Показываем статус "открываем кошелёк"
  showTxStatusModal('pending', { grinch: 0, label: miner.name });

  try {
    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: typeof MINING_WALLET !== 'undefined' ? MINING_WALLET : PROJECT_WALLET,
        amount: nanoTon,
        payload: payload
      }]
    };

    await ui.sendTransaction(tx);

    // Успех
    showTxStatusModal('success', { grinch: 0, label: miner.name + ' активируется!' });
    toast('⛏️ Оплата прошла! Майнер будет зачислен в течение 1-2 минут');
    setTimeout(() => closeTxStatusModal(), 4000);

  } catch(e) {
    if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) {
      showTxStatusModal('cancelled', {});
    } else {
      showTxStatusModal('error', {});
      console.error('Miner tx error:', e);
    }
    setTimeout(() => closeTxStatusModal(), 3000);
  }
}

// ── Статистика дохода ─────────────────────────────────
function updateMiningStats() {
  const myMiners = S.miners || {};
  let giftsPerDay = 0, grinchPerDay = 0;

  MINERS_GIFTS.forEach(m => {
    giftsPerDay += (myMiners[m.id] || 0) * m.incomeDay;
  });
  MINERS_GRINCH.forEach(m => {
    grinchPerDay += (myMiners[m.id] || 0) * m.incomeDay;
  });

  const el = document.getElementById('myMiningIncome');
  if (el) {
    if (giftsPerDay === 0 && grinchPerDay === 0) {
      el.textContent = 'Нет майнеров';
      el.style.color = 'rgba(255,255,255,0.4)';
    } else {
      el.innerHTML = (giftsPerDay>0?`🎁 <b style="color:#f1c40f">+${giftsPerDay.toLocaleString()}</b>/день  `:'') +
                     (grinchPerDay>0?`🟢 <b style="color:#2ecc71">+${grinchPerDay.toLocaleString()}</b>/день`:'');
    }
  }

  // Превью на кнопке в меню
  const preview = document.getElementById('miningIncomePreview');
  if (preview) {
    const perHour = Math.floor(giftsPerDay/24);
    preview.textContent = perHour > 0 ? '+'+perHour+'/час' : '0/час';
  }
}

// ── Накопление дохода ─────────────────────────────────
function accrueMiningIncome() {
  const myMiners = S.miners || {};
  const lastAccrue = +localStorage.getItem('miningLastAccrue') || Date.now();
  const now = Date.now();
  const hoursElapsed = (now - lastAccrue) / 3600000;

  if (hoursElapsed < 0.016) return; // меньше минуты — пропускаем

  let giftsEarned = 0, grinchEarned = 0;

  MINERS_GIFTS.forEach(m => {
    giftsEarned += (myMiners[m.id]||0) * m.incomeDay * hoursElapsed / 24;
  });
  MINERS_GRINCH.forEach(m => {
    grinchEarned += (myMiners[m.id]||0) * m.incomeDay * hoursElapsed / 24;
  });

  giftsEarned  = Math.floor(giftsEarned);
  grinchEarned = Math.floor(grinchEarned);

  if (giftsEarned > 0 || grinchEarned > 0) {
    // Накапливаем в pending
    S.miningPendingGifts  = (S.miningPendingGifts  || 0) + giftsEarned;
    S.miningPendingGrinch = (S.miningPendingGrinch || 0) + grinchEarned;
    localStorage.setItem('miningLastAccrue', now);
    save();
  }
}

// ── Забрать накопленное ───────────────────────────────
function claimMining() {
  accrueMiningIncome();

  const pendingGifts  = S.miningPendingGifts  || 0;
  const pendingGrinch = S.miningPendingGrinch || 0;

  if (pendingGifts === 0 && pendingGrinch === 0) {
    toast('⏳ Пока нечего забирать!');
    return;
  }

  // Если есть реальные GRINCH — открываем модал вывода
  if (pendingGrinch > 0) {
    document.getElementById('withdrawAmount').textContent = pendingGrinch.toLocaleString() + ' GRINCH';
    if (S.wallet) document.getElementById('withdrawWallet').value = S.walletFull || '';
    document.getElementById('withdrawModal').style.display = 'flex';
    return;
  }

  // Только подарки — сразу зачисляем
  S.gifts += pendingGifts;
  S.seasonBank += pendingGifts;
  S.miningPendingGifts = 0;
  save();
  toast('🎁 +' + pendingGifts.toLocaleString() + ' подарков от майнеров!');
  updateMenu();
  renderMiningList();
}

// ── Подать заявку на вывод ────────────────────────────
function submitWithdraw() {
  const wallet = document.getElementById('withdrawWallet').value.trim();
  if (!wallet || wallet.length < 10) {
    toast('❌ Введи правильный TON кошелёк!');
    return;
  }

  const amount = S.miningPendingGrinch || 0;
  const tgId   = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || S.nick;

  // Уведомляем через бот
  const BOT_TOKEN = '8536652053:AAF3WV2etPzjJHpMGl3YIlbrpkimEvi3TYs';
  const msg = `💎 ЗАЯВКА НА ВЫВОД!\n\nПользователь: ${tgId}\nНик: ${S.nick}\nСумма: ${amount.toLocaleString()} GRINCH\nКошелёк: ${wallet}\n\nОтправь токены вручную!`;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ chat_id: tgId, text: msg })
  }).catch(()=>{});

  // Зачисляем подарки (если были)
  if (S.miningPendingGifts > 0) {
    S.gifts += S.miningPendingGifts;
    S.seasonBank += S.miningPendingGifts;
  }

  S.miningPendingGrinch = 0;
  S.miningPendingGifts  = 0;
  save();

  closeWithdrawModal();
  toast('✅ Заявка отправлена! Выплата в течение 24ч');
  updateMenu();
}

function closeWithdrawModal() {
  document.getElementById('withdrawModal').style.display = 'none';
}

// ── Инициализация при открытии экрана ────────────────
const _origShow2 = typeof window._origShow !== 'undefined' ? window._origShow : null;
document.addEventListener('DOMContentLoaded', () => {
  // Запускаем накопление каждую минуту
  setInterval(accrueMiningIncome, 60000);
  // Первое накопление при загрузке
  setTimeout(accrueMiningIncome, 2000);
});

// show('mining') уже обрабатывается в index.html
// Здесь только экспортируем нужные функции глобально
window.renderMiningList   = renderMiningList;
window.fetchGrinchRate    = fetchGrinchRate;
window.accrueMiningIncome = accrueMiningIncome;
window.switchMiningTab    = switchMiningTab;
window.buyMiner           = buyMiner;
window.claimMining        = claimMining;
window.submitWithdraw     = submitWithdraw;
window.closeWithdrawModal = closeWithdrawModal;
