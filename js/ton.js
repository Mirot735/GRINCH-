// ── Фикс null-кошелька при старте ────────────────────────
(function fixNullWallet(){
  const w = localStorage.getItem('wallet');
  if(w === 'null' || w === 'undefined') {
    localStorage.removeItem('wallet');
    if(window.S) { S.wallet = null; S.walletFull = null; }
  }
})();

let tonUI = null;

// ── Инициализация TON Connect ──────────────────────────────
function getTonUI() {
  if (tonUI) return tonUI;
  try {
    tonUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://raw.githubusercontent.com/ton-connect/demo-dapp/master/public/tonconnect-manifest.json',
      buttonRootId: null
    });
    tonUI.onStatusChange(wallet => {
      if (wallet) {
        const addr = wallet.account.address;
        S.wallet = addr.slice(0,6) + '...' + addr.slice(-4);
        S.walletFull = addr;
        save();
        toast('✅ Кошелёк подключён!');
        renderTonShop();
      } else {
        S.wallet = null;
        S.walletFull = null;
        save();
        renderTonShop();
      }
    });
  } catch(e) {
    console.error('TON Connect init error:', e);
  }
  return tonUI;
}

async function connectWallet() {
  try {
    if (!window.TON_CONNECT_UI) {
      toast('Открой в Telegram для подключения!');
      return;
    }
    const ui = getTonUI();
    await ui.openModal();
  } catch(e) {
    toast('Ошибка подключения кошелька');
  }
}

async function disconnectWallet() {
  try {
    const ui = getTonUI();
    await ui.disconnect();
  } catch(e) {}
  S.wallet = null;
  S.walletFull = null;
  save();
  renderTonShop();
  toast('Кошелёк отключён');
}

function showWalletConn(addr) {
  const block = document.getElementById('walletBlock');
  if (!block) return;
  block.innerHTML = `
    <div class="wc-connected">
      <div class="wc-conn-row">
        <div class="wc-conn-addr">💎 ${addr}</div>
        <button class="wc-disc-btn" onclick="disconnectWallet()">Отключить</button>
      </div>
    </div>`;
}

// ── Открыть покупку — СРАЗУ через TON Connect ────────────
async function openTonDeposit(pkgId) {
  selectedPkg = TON_PACKAGES.find(p => p.id === pkgId);
  if (!selectedPkg) return;

  // Если кошелёк не подключён — сначала подключаем
  if (!S.walletFull) {
    toast('💎 Сначала подключи кошелёк!');
    try {
      if (!window.TON_CONNECT_UI) { toast('Открой в Telegram!'); return; }
      const ui = getTonUI();
      await ui.openModal();
      // После подключения — повторно вызываем покупку
      const check = setInterval(() => {
        if (S.walletFull) {
          clearInterval(check);
          openTonDeposit(pkgId);
        }
      }, 500);
      setTimeout(() => clearInterval(check), 30000);
    } catch(e) { toast('Ошибка подключения'); }
    return;
  }

  // Кошелёк подключён — сразу отправляем транзакцию
  await sendTonPayment(selectedPkg.ton, selectedPkg, PROJECT_WALLET);
}

// ── Покупка майнера за TON ─────────────────────────────────
async function openMinerTonPayment(minerId, tonAmount, label) {
  if (!S.walletFull) {
    toast('💎 Сначала подключи кошелёк!');
    try {
      const ui = getTonUI();
      await ui.openModal();
      const check = setInterval(() => {
        if (S.walletFull) {
          clearInterval(check);
          openMinerTonPayment(minerId, tonAmount, label);
        }
      }, 500);
      setTimeout(() => clearInterval(check), 30000);
    } catch(e) {}
    return;
  }
  // Сохраняем pending майнер
  localStorage.setItem('pendingMiner', minerId);
  const fakePkg = { id: minerId, ton: tonAmount, grinch: 0, label };
  await sendTonPayment(tonAmount, fakePkg, MINING_WALLET);
}

// ── Универсальная отправка TON транзакции ─────────────────
async function sendTonPayment(tonAmount, pkg, walletAddress) {
  const ui = getTonUI();
  if (!ui || !S.walletFull) { toast('Подключи кошелёк!'); return; }

  // Показываем статус
  showTxStatusModal('pending', pkg);

  try {
    const nanoTon = Math.round(tonAmount * 1_000_000_000).toString();
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || S.nick;
    const comment = 'grinch_' + tgId + '_' + pkg.id;
    const payload = _buildCommentPayload(comment);

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: walletAddress,
        amount: nanoTon,
        payload: payload
      }]
    };

    const result = await ui.sendTransaction(tx);
    showTxStatusModal('success', pkg);
    setTimeout(() => closeTxStatusModal(), 4000);

  } catch(e) {
    if (e?.message?.includes('User rejects') || e?.message?.includes('cancel')) {
      showTxStatusModal('cancelled', pkg);
    } else {
      showTxStatusModal('error', pkg);
    }
    setTimeout(() => closeTxStatusModal(), 3000);
  }
}

// ── Статус модал ──────────────────────────────────────────
function showTxStatusModal(status, pkg) {
  let modal = document.getElementById('txStatusModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'txStatusModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(modal);
  }

  const contents = {
    pending: {
      icon: '⏳',
      title: 'Открываем Tonkeeper...',
      sub: 'Подтверди транзакцию в кошельке',
      color: '#29b6f6'
    },
    success: {
      icon: '✅',
      title: 'Транзакция отправлена!',
      sub: pkg.grinch > 0
        ? 'Зачислим ' + pkg.grinch.toLocaleString() + ' GRINCH в течение 1-2 минут'
        : 'Майнер будет активирован в течение 1-2 минут',
      color: '#2ecc71'
    },
    cancelled: { icon: '❌', title: 'Отменено', sub: 'Транзакция отменена', color: '#e74c3c' },
    error:     { icon: '⚠️', title: 'Ошибка', sub: 'Попробуй ещё раз', color: '#e74c3c' }
  };

  const c = contents[status];
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#071a14,#0a2018);border:1px solid ${c.color}44;border-radius:24px;padding:28px 22px;width:100%;max-width:320px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;">
      <div style="font-size:52px;">${c.icon}</div>
      <div style="font-size:18px;font-weight:900;color:#fff;">${c.title}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">${c.sub}</div>
      ${status !== 'pending' ? '<button onclick="closeTxStatusModal()" style="width:100%;padding:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">OK</button>' : ''}
    </div>`;
  modal.style.display = 'flex';
}

function closeTxStatusModal() {
  const m = document.getElementById('txStatusModal');
  if (m) m.style.display = 'none';
}

function closeTonModal() {
  const modal = document.getElementById('tonDepositModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  selectedPkg = null;
}

// ── Копировать адрес ───────────────────────────────────────
function copyTonAddr() {
  navigator.clipboard?.writeText(PROJECT_WALLET).then(() => {
    toast('📋 Адрес скопирован!');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = PROJECT_WALLET;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    toast('📋 Адрес скопирован!');
  });
}

// ── sendTonTransaction — оставляем для совместимости ─────
async function sendTonTransaction() {
  if (selectedPkg) await sendTonPayment(selectedPkg.ton, selectedPkg, PROJECT_WALLET);
}

// Кошелёк майнинга — откуда выплачиваются GRINCH токены майнерам
const MINING_WALLET = 'UQAJg4rCfyhsIlykjAYG9Wr5tSzQjdTssoZkafROmpUlDB1U';
// _notifyBot удалён — бот сам мониторит транзакции через TonCenter API

// ── Encode text comment as TON cell payload (base64) ──────
function _buildCommentPayload(text) {
  // TON comment cell: 0x00000000 prefix + UTF-8 text
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);
  const buffer = new Uint8Array(4 + textBytes.length);
  // First 4 bytes = 0 (op code for simple comment)
  buffer.set(textBytes, 4);
  return btoa(String.fromCharCode(...buffer));
}

// ── Квесты и друзья ───────────────────────────────────────
function renderFriends() {
  // Ссылка
  const refLink = 'https://t.me/GrinchGameBot?start=ref_' + encodeURIComponent(S.nick);
  const linkEl = document.getElementById('fRefLink');
  if(linkEl) linkEl.textContent = refLink.replace('https://','');

  // Счётчики
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl('fCount',    S.refs || 0);
  setEl('fEarned',   (S.refEarned || 0).toLocaleString());
  setEl('fRefBonus', ((S.refTonEarned||0) * (typeof REF_BONUS_PCT!=='undefined'?REF_BONUS_PCT:0.2)).toFixed(2));
  setEl('fRefGifts', (S.refGiftsEarned || 0).toLocaleString());

  // Список рефералов
  const list = document.getElementById('friendsList');
  if(!list) return;

  const refs = JSON.parse(localStorage.getItem('refsList') || '[]');
  if(refs.length === 0){
    list.innerHTML = `
      <div style="text-align:center;padding:24px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;">
        <div style="font-size:40px;margin-bottom:8px;">👥</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:4px;">Друзей пока нет</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.3);">Поделись ссылкой и получай 20%!</div>
      </div>`;
    return;
  }

  list.innerHTML = refs.map((r,i) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0d3a1f,#1a5c35);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${r.avatar||'👤'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name||'Игрок'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:1px;">🎁 ${(r.gifts||0).toLocaleString()} подарков</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:13px;font-weight:800;color:#2ecc71;">+${(r.earned||0).toLocaleString()}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);">GRINCH</div>
      </div>
    </div>
  `).join('');
}

function copyRefLink() {
  const link = 'https://t.me/GrinchGameBot?start=ref_' + encodeURIComponent(S.nick);
  navigator.clipboard?.writeText(link).then(()=>{
    toast('📋 Ссылка скопирована!');
  }).catch(()=>{
    const el = document.createElement('textarea');
    el.value = link; document.body.appendChild(el);
    el.select(); document.execCommand('copy');
    document.body.removeChild(el);
    toast('📋 Ссылка скопирована!');
  });
}

function renderQuests() {
  const list = document.getElementById('questsList');
  if(!list) return;
  list.innerHTML = '';
  const tab = typeof currentQuestTab !== 'undefined' ? currentQuestTab : 0;
  try {
    if (tab === 0) renderGameQuests(list);
    else if (tab === 1) renderChannelQuests(list);
    else if (tab === 2) renderTonQuests(list);
  } catch(e) { console.error('renderQuests error:', e); list.innerHTML = '<div style="color:red;padding:12px;">Ошибка: '+e.message+'</div>'; }
}

function makeChannelCard(q) {
  const done = S.questsDone.includes(q.id);
  // Проверяем — нажал ли уже "Перейти" (храним время в localStorage)
  const visitKey = 'visit_' + q.id;
  const visitTime = +localStorage.getItem(visitKey) || 0;
  const now = Date.now();
  const elapsed = now - visitTime;
  const WAIT_MS = 30000; // 30 секунд
  const visited = visitTime > 0;
  const canCheck = visited && elapsed >= WAIT_MS;
  const waiting = visited && elapsed < WAIT_MS;

  const d = document.createElement('div');
  d.className = 'channel-quest' + (done ? ' done' : '');

  let btnHtml = '';
  if (done) {
    btnHtml = '<div class="qi-done-badge" style="margin-top:6px;">✅ Выполнено</div>';
  } else if (!visited) {
    // Ещё не переходил — только кнопка "Перейти"
    btnHtml = `<div style="margin-top:6px;">
      <button class="cq-btn" onclick="channelVisit('${q.id}','${q.url}',this)">🔗 Перейти</button>
    </div>`;
  } else if (waiting) {
    // Перешёл, ждём таймер
    const secsLeft = Math.ceil((WAIT_MS - elapsed) / 1000);
    btnHtml = `<div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:11px;color:rgba(255,255,255,0.4);" id="timer_${q.id}">⏳ Проверить через ${secsLeft}с</span>
    </div>`;
  } else if (canCheck) {
    // Таймер истёк — показываем кнопку проверить
    btnHtml = `<div style="margin-top:6px;">
      <button class="cq-check-btn" onclick="claimChannelQuest('${q.id}')">✅ Проверить подписку</button>
    </div>`;
  }

  d.innerHTML = `
    <div class="cq-logo" style="background:rgba(0,136,204,.15);border:1px solid rgba(0,136,204,.25);">${q.icon}</div>
    <div class="cq-info">
      <div class="cq-name">${q.name}</div>
      <div class="cq-desc">${q.desc}</div>
      <div class="cq-reward">+${q.reward} GRINCH${q.rewardGifts>0?' + '+q.rewardGifts+' 🎁':''}</div>
      ${btnHtml}
    </div>`;
  return d;
}

// Нажал "Перейти" — запоминаем время и открываем канал
function channelVisit(id, url, btn) {
  localStorage.setItem('visit_' + id, Date.now().toString());
  openChannel(url);
  // Перерисовываем через секунду чтобы показать таймер
  setTimeout(() => renderQuests(), 500);
  // Обратный отсчёт каждую секунду
  let secs = 30;
  const iv = setInterval(() => {
    secs--;
    const el = document.getElementById('timer_' + id);
    if (el) {
      if (secs <= 0) {
        clearInterval(iv);
        renderQuests(); // показываем кнопку "Проверить"
      } else {
        el.textContent = '⏳ Проверить через ' + secs + 'с';
      }
    } else {
      clearInterval(iv);
    }
  }, 1000);
}
