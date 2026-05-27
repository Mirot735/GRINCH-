// ═══════════════════════════════════════════════════════════════
//  profile.js — профиль, инвентарь, кошелёк, рейтинг, друзья, квесты
//  НЕ трогает: renderShop, shopTab, claimDaily, renderDaily, SHOP, TON_PACKAGES
// ═══════════════════════════════════════════════════════════════

/* ── Уровни ── */
// Пороги синхронизированы с config.js
var LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500,
  7500, 10000, 13000, 17000, 22000, 28000, 35000, 45000, 60000, 80000, 100000
];

function getLevel(gifts) {
  gifts = gifts || 0;
  var lvl = 1;
  for (var i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (gifts >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return Math.min(lvl, LEVEL_THRESHOLDS.length);
}

function getLevelProgress(gifts) {
  gifts = gifts || 0;
  var lvl  = getLevel(gifts);
  var cur  = LEVEL_THRESHOLDS[lvl - 1] || 0;
  var next = LEVEL_THRESHOLDS[lvl] || LEVEL_THRESHOLDS[lvl - 1];
  if (lvl >= LEVEL_THRESHOLDS.length) return { lvl: lvl, level: lvl, pct: 100, cur: gifts, next: gifts, from: cur, to: next, need: 0 };
  var pct = Math.min(100, Math.round((gifts - cur) / (next - cur) * 100));
  return { lvl: lvl, level: lvl, pct: pct, cur: cur, next: next, from: cur, to: next, need: next - gifts };
}

function _pEl(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _pFmt(n) {
  n = n || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(Math.floor(n));
}

function getRefLink() {
  var S = window.S || {};
  return 'https://t.me/GrinchGameBot?start=ref_' + (S.nick || S.userId || 'player');
}

function copyRefLink() {
  var link = getRefLink();
  var copy = function(t) {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    if (typeof toast === 'function') toast('📋 Ссылка скопирована!');
  };
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(link).catch(function() { copy(link); });
  else copy(link);
}

/* ════════════════════════════════════════════
   ПРОФИЛЬ
════════════════════════════════════════════ */
function updateProfile() {
  var S     = window.S || {};
  var gifts = S.gifts  || 0;
  var grinch= S.grinch || 0;
  var refs  = (S.friends && S.friends.length) || S.refCount || 0;
  var nick  = S.nick || 'Игрок';
  var uid   = S.userId || S.tgId || '0000';
  var lp    = (typeof getLevelProgress === 'function') ? getLevelProgress(gifts) : {level:1,pct:0,from:0,to:100,need:100};
  // config.js возвращает lp.lvl, profile.js возвращает lp.level — берём оба
  var curLvl = lp.lvl || lp.level || 1;
  lp.pct  = lp.pct  || 0;
  lp.need = lp.need || (lp.next ? lp.next - gifts : 0);

  _pEl('profileName',  nick);
  _pEl('profileId',    'ID: #' + String(uid).slice(-6).padStart(4,'0'));
  _pEl('profileLevel', '🎄 LVL ' + curLvl);
  _pEl('profileLevelNum', curLvl);

  // Прогресс бар
  var fill = document.getElementById('profileLvlFill');
  if (fill) fill.style.width = lp.pct + '%';
  var fill2 = document.getElementById('profileLvlFill2');
  if (fill2) fill2.style.width = lp.pct + '%';

  // Подписи прогресс бара — текущие/нужные подарки
  if (curLvl >= 20) {
    _pEl('profileLvlNext', 'МАКС LVL ' + curLvl + '!');
    _pEl('profileLvlFrom', _pFmt(gifts));
    _pEl('profileLvlTo',   'МАКС');
  } else {
    _pEl('profileLvlNext', 'До LVL ' + (curLvl+1) + ': ' + _pFmt(lp.need) + ' 🎁');
    _pEl('profileLvlFrom', _pFmt(lp.from || lp.cur || 0));
    _pEl('profileLvlTo',   _pFmt(lp.to || lp.next || 0));
  }
  _pEl('pGifts',  _pFmt(gifts));
  _pEl('pGrinch', _pFmt(grinch));
  _pEl('pRefs',   refs);

  // Прогресс за сегодня
  var todayKey = new Date().toISOString().slice(0,10);
  var todayGifts = 0;
  try {
    var tg = JSON.parse(localStorage.getItem('todayGifts_' + todayKey) || '0');
    todayGifts = tg;
  } catch(e) {}
  _pEl('profileTodayGifts', '+' + todayGifts + ' за сегодня');

  // Ранг
  var rank = S.rank || S.seasonRank;
  _pEl('profileSeasonRank', rank ? '#' + rank : '#???');

  // Топ %
  var topPct = rank ? Math.min(99, Math.round(rank / 10)) + '%' : '—';
  _pEl('profileTopPct', topPct);

  var addr = S.walletAddr || S.wallet || '';
  _pEl('walletBadge', addr ? addr.slice(0,6)+'...'+addr.slice(-4) : 'TON · Транзакции');

  var inv   = S.inv || {};
  var total = Object.keys(inv).reduce(function(a,k){ return a + (typeof inv[k]==='number' ? inv[k] : 0); }, 0);
  _pEl('invBadge', total > 0 ? total + ' предметов' : 'Баффы · Предметы');

  var av = document.getElementById('profileAvatar');
  if (av) av.textContent = (nick[0]||'Г').toUpperCase();

  // Аватар из Telegram
  var avatarImg = document.getElementById('profileAvatarImg');
  if (avatarImg) {
    var tgUser = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
    if (tgUser && tgUser.photo_url) {
      avatarImg.src = tgUser.photo_url;
    }
  }

  _renderProfileHistory();
  updateMenuTopbar();
}

function _renderProfileHistory() {
  var el = document.getElementById('profileHistory');
  if (!el) return;
  var h = [];
  try { h = JSON.parse(localStorage.getItem('grinch_history') || '[]'); } catch(e) {}
  if (!h.length && window.S && window.S.history) h = window.S.history;

  if (!h.length) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.25);font-size:12px;">Нет сыгранных игр 🎮</div>';
    return;
  }
  el.innerHTML = h.slice().reverse().slice(0,10).map(function(g, i) {
    var score = g.score || g.gifts || 0;
    var date  = g.date ? new Date(g.date).toLocaleDateString('ru') : '—';
    var time  = g.date ? new Date(g.date).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}) : '';
    var badge = score>=50?'great':score>=20?'good':'ok';
    var label = score>=50?'ОТЛИЧНО':score>=20?'ХОРОШО':'OK';
    var icon  = score>=50?'🌟':score>=20?'🎁':'😈';
    return '<div class="ph-row">'
      + '<div class="ph-num">'+(i+1)+'</div>'
      + '<div class="ph-icon">'+icon+'</div>'
      + '<div class="ph-info"><div class="ph-score">'+score+' 🎁</div>'
      + '<div class="ph-meta">'+date+(time?' · '+time:'')+'</div></div>'
      + '<div class="ph-badge '+badge+'">'+label+'</div>'
      + '</div>';
  }).join('');
}

function saveGameResult(score) {
  try {
    var h = JSON.parse(localStorage.getItem('grinch_history') || '[]');
    h.push({ score: score, date: Date.now() });
    if (h.length > 50) h = h.slice(-50);
    localStorage.setItem('grinch_history', JSON.stringify(h));
  } catch(e) {}
}

/* ── Топбар меню ── */
function updateMenuTopbar() {
  var S  = window.S || {};
  var lp = getLevelProgress(S.gifts || 0);

  _pEl('menuNick',       S.nick || 'Игрок');
  _pEl('menuLevel',      '★ Уровень ' + lp.level);
  _pEl('menuGifts',      _pFmt(S.gifts  || 0));
  _pEl('menuGrinch',     _pFmt(S.grinch || 0));
  _pEl('menuSeasonBank', _pFmt(S.seasonBank || 0));
  _pEl('menuRank',       S.rank ? '#' + S.rank : '#—');

  var bar = document.getElementById('menuLevelBar');
  if (bar) bar.style.width = lp.pct + '%';
  _pEl('menuLevelLabel', 'До уровня ' + (lp.level+1));
  _pEl('menuLevelPct',   lp.pct + '%');

  // Обновляем баланс магазина точно так же как shop.js
  var sg = document.getElementById('shopGifts');
  var sc = document.getElementById('shopGrinch');
  if (sg) sg.textContent = (S.gifts||0).toLocaleString();
  if (sc) sc.textContent = (S.grinch||0).toLocaleString();

  // Friends
  var refEl = document.getElementById('fRefLink');
  if (refEl) refEl.textContent = getRefLink();
  _pEl('fCount',    (S.friends&&S.friends.length)||S.refCount||0);
  _pEl('fEarned',   _pFmt(S.refGrinch||0));
  _pEl('fRefBonus', parseFloat(S.refTon||0).toFixed(2));
  _pEl('fRefGifts', _pFmt(S.refGifts||0));
}

/* ════════════════════════════════════════════
   КОШЕЛЁК
════════════════════════════════════════════ */
function renderWalletScreen() {
  var S    = window.S || {};
  var addr = S.walletAddr || S.wallet || '';
  var addrEl = document.getElementById('wltAddr');
  if (addrEl) {
    addrEl.textContent = addr || 'Кошелёк не подключён';
    addrEl.className   = 'wlt-card-addr' + (addr ? '' : ' empty');
  }
  _pEl('wltGrinch', _pFmt(S.grinch||0));
  _pEl('wltTon',    parseFloat(S.ton||0).toFixed(2));
  var block = document.getElementById('walletBlock');
  if (block) block.innerHTML = addr
    ? '<button class="wlt-disc-btn" onclick="disconnectWallet()">🔌 Отключить кошелёк</button>'
    : '<button class="wlt-connect-btn" onclick="connectWallet()">💎 Подключить кошелёк</button>';
  _renderWalletTx();
}
function renderWallet() { renderWalletScreen(); }

function _renderWalletTx() {
  var txEl = document.getElementById('wltTxList');
  if (!txEl) return;
  var txs = [];
  try { txs = JSON.parse(localStorage.getItem('grinch_txs') || '[]'); } catch(e) {}
  if (!txs.length) { txEl.innerHTML = '<div class="wlt-empty">История транзакций пуста</div>'; return; }
  txEl.innerHTML = txs.slice().reverse().slice(0,20).map(function(tx) {
    var cls  = tx.type==='in' ? 'plus' : 'minus';
    var sign = tx.type==='in' ? '+' : '-';
    var date = tx.date ? new Date(tx.date).toLocaleDateString('ru') : '—';
    return '<div class="wlt-tx-row">'
      + '<div class="wlt-tx-icon">'+(tx.icon||'💎')+'</div>'
      + '<div class="wlt-tx-info"><div class="wlt-tx-name">'+(tx.name||'Транзакция')+'</div>'
      + '<div class="wlt-tx-date">'+date+'</div></div>'
      + '<div class="wlt-tx-amt '+cls+'">'+sign+(tx.amt||0)+' '+(tx.currency||'TON')+'</div>'
      + '</div>';
  }).join('');
}

function connectWallet() {
  try {
    if (typeof getTonUI === 'function') { getTonUI().openModal(); return; }
  } catch(e) {}
  if (typeof toast === 'function') toast('💎 TON Connect не настроен');
}

function disconnectWallet() {
  try {
    if (typeof getTonUI === 'function') getTonUI().disconnect();
  } catch(e) {}
  if (window.S) { window.S.walletAddr = ''; window.S.wallet = ''; window.S.walletFull = ''; }
  if (typeof save === 'function') save();
  renderWalletScreen();
  if (typeof toast === 'function') toast('🔌 Кошелёк отключён');
}
  renderWalletScreen();
  if (typeof toast === 'function') toast('🔌 Кошелёк отключён');
}

/* ════════════════════════════════════════════
   ИНВЕНТАРЬ — переключение вкладок
   Панели в HTML: inv-content-boosts (без display:none)
                  inv-content-res    (display:none)
                  inv-content-nft    (display:none)
════════════════════════════════════════════ */
function switchInvTab(tab) {
  // 1. Скрыть ВСЕ панели через setAttribute style
  var ids = ['boosts', 'res', 'nft'];
  ids.forEach(function(t) {
    var pane = document.getElementById('inv-content-' + t);
    if (pane) pane.setAttribute('style', 'display:none!important');

    var btn = document.getElementById('itab-' + t);
    if (btn) {
      btn.classList.remove('active');
    }
  });

  // 2. Показать нужную панель
  var activePane = document.getElementById('inv-content-' + tab);
  if (activePane) {
    activePane.setAttribute('style', 'display:flex;flex-direction:column;flex:1;overflow-y:auto;');
  }

  // 3. Активировать нужную кнопку
  var activeBtn = document.getElementById('itab-' + tab);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // 4. Рендерим контент
  if (tab === 'boosts') _invRenderBoosts();
  if (tab === 'res')    _invRenderRes();
  if (tab === 'nft')    _invRenderNFT();
}

var _INV_META = {
  slow:    { emoji:'⏱️', name:'Замедление',  cls:'slow'    },
  magnet:  { emoji:'🌙', name:'Магнит',       cls:'magnet'  },
  totem:   { emoji:'🗿', name:'Тотем',        cls:'totem'   },
  star:    { emoji:'⭐', name:'x2 Хруст',     cls:'star'    },
  hp:      { emoji:'❤️', name:'+1 Жизнь',     cls:'hp'      },
  autobet: { emoji:'🤖', name:'Автосбор',      cls:'autobet' },
  chest7:  { emoji:'🏆', name:'Супер-сундук', cls:'chest'   },
  megaBox: { emoji:'🎀', name:'Мега-бокс',    cls:'chest'   },
};

function _invRenderBoosts() {
  var grid = document.getElementById('invGridBoosts');
  if (!grid) return;
  var inv = (window.S && window.S.inv) || {};
  var keys = Object.keys(_INV_META).filter(function(k){ return (inv[k]||0) > 0; });

  if (!keys.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);">'
      + '<div style="font-size:42px;margin-bottom:8px;">⚡</div>'
      + '<div style="font-size:13px;">Нет предметов</div>'
      + '<div style="font-size:11px;margin-top:4px;opacity:0.7;">Купи в магазине!</div></div>';
    return;
  }
  grid.innerHTML = keys.map(function(k) {
    var m = _INV_META[k], cnt = inv[k]||0;
    return '<div class="inv-item ' + m.cls + '" onclick="_invUseItem(\'' + k + '\')">'
      + '<div class="inv-item-emoji">' + m.emoji + '</div>'
      + '<div class="inv-item-name">' + m.name + '</div>'
      + '<div class="inv-item-count">×' + cnt + '</div>'
      + '</div>';
  }).join('');
}

function _invUseItem(key) {
  if (typeof useItem === 'function') useItem(key);
  else if (typeof toast === 'function') toast('⚡ ' + ((_INV_META[key]||{}).name||key) + ' активирован!');
  setTimeout(function(){ _invRenderBoosts(); }, 100);
}

function _invRenderRes() {
  var el = document.getElementById('invGridRes');
  if (!el) return;
  var S = window.S || {};
  function row(icon, name, val, color) {
    return '<div style="background:rgba(0,0,0,0.5);border:1px solid '+color+';border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px;">'
      + '<span style="font-size:28px;">'+icon+'</span>'
      + '<div style="flex:1;">'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">'+name+'</div>'
      + '<div style="font-size:26px;font-weight:900;color:#fff;">'+val+'</div>'
      + '</div></div>';
  }
  el.innerHTML = row('🎁','Подарки', (S.gifts||0).toLocaleString(), 'rgba(241,196,15,0.4)')
    + row('🟢','GRINCH', (S.grinch||0).toLocaleString(), 'rgba(46,204,113,0.4)')
    + row('💎','TON', parseFloat(S.ton||0).toFixed(2), 'rgba(41,182,246,0.4)');
}

function _invRenderNFT() {
  var el = document.getElementById('invGridNft');
  if (!el) return;
  var nfts = (window.S && window.S.nfts) || [];
  if (!nfts.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);">'
      + '<div style="font-size:42px;margin-bottom:8px;">🖼️</div>'
      + '<div style="font-size:13px;">Нет NFT</div>'
      + '<div style="font-size:11px;margin-top:4px;opacity:0.7;">Попади в топ сезона!</div></div>';
    return;
  }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">'
    + nfts.map(function(n){
        return '<div class="inv-item" style="border-color:rgba(147,112,219,0.4);">'
          + '<div style="font-size:32px;">'+(n.emoji||'🖼️')+'</div>'
          + '<div class="inv-item-name">'+(n.name||'NFT')+'</div></div>';
      }).join('') + '</div>';
}

function renderInventoryScreen() {
  // Принудительно скрываем все кроме boosts перед рендером
  ['res','nft'].forEach(function(t){
    var p = document.getElementById('inv-content-' + t);
    if (p) p.setAttribute('style','display:none!important');
  });
  var p0 = document.getElementById('inv-content-boosts');
  if (p0) p0.setAttribute('style','display:flex;flex-direction:column;flex:1;overflow-y:auto;');
  switchInvTab('boosts');
}

/* ════════════════════════════════════════════
   РЕЙТИНГ
════════════════════════════════════════════ */
function renderRating() {
  // Только обновляем ранг игрока — экран рейтинга строит rating.js
  var S = window.S||{}, myNick = S.nick||'Игрок', myGifts = S.gifts||0;
  var top = [];
  try { top = JSON.parse(localStorage.getItem('grinch_rating')||'[]'); } catch(e) {}
  if (!top.length) {
    ['IceQueen','FrostByte','GiftHunter','WinterPro','SnowKing',
     'GrinchSlayer','XmasHero','ColdFury','NightElf','SilverFox'].forEach(function(n,i){
      top.push({ nick:n, gifts: Math.max(0,5000-i*400-Math.floor(Math.random()*100)) });
    });
  }
  if (!top.some(function(r){ return r.nick===myNick; }))
    top.push({ nick:myNick, gifts:myGifts, me:true });
  top.sort(function(a,b){ return b.gifts-a.gifts; });
  top = top.slice(0,50);
  var myRank = top.findIndex(function(r){ return r.nick===myNick||r.me; })+1;
  if (window.S) window.S.rank = myRank;
  _pEl('menuRank','#'+myRank);
  _pEl('profileSeasonRank','#'+myRank);
  // Если открыт экран рейтинга — запускаем rating.js рендер
  var ratScreen = document.getElementById('s-rating');
  if (ratScreen && ratScreen.classList.contains('active') && typeof _ratFetch === 'function') {
    _ratFetch();
  }
}

/* ════════════════════════════════════════════
   ДРУЗЬЯ
════════════════════════════════════════════ */
function renderFriends() {
  var S = window.S||{}, friends = S.friends||[];
  var refEl = document.getElementById('fRefLink');
  if (refEl) refEl.textContent = getRefLink();
  _pEl('fCount',    friends.length||S.refCount||0);
  _pEl('fEarned',   _pFmt(S.refGrinch||0));
  _pEl('fRefBonus', parseFloat(S.refTon||0).toFixed(2));
  _pEl('fRefGifts', _pFmt(S.refGifts||0));
  var listEl = document.getElementById('friendsList');
  if (!listEl) return;
  if (!friends.length) {
    listEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:24px;font-size:13px;">Нет рефералов — пригласи друзей! 👥</div>';
    return;
  }
  listEl.innerHTML = friends.map(function(f){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;">'
      + '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#0d2a1a,#1a4a2a);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#2ecc71;flex-shrink:0;">'+(f.nick[0]||'?').toUpperCase()+'</div>'
      + '<div style="flex:1;"><div style="font-size:14px;font-weight:700;color:#fff;">'+(f.nick||'Игрок')+'</div>'
      + '<div style="font-size:11px;color:rgba(255,255,255,0.4);">'+(f.gifts||0).toLocaleString()+' 🎁</div></div>'
      + '<div style="font-size:12px;color:#2ecc71;font-weight:800;">+'+Math.floor((f.gifts||0)*0.2).toLocaleString()+' 🟢</div>'
      + '</div>';
  }).join('');
}

/* ════════════════════════════════════════════
   ЗАДАНИЯ
════════════════════════════════════════════ */
var _questTab = 0;
function questTab(idx) {
  _questTab = idx;
  for (var i=0;i<3;i++) {
    var t = document.getElementById('qtab'+i);
    if (!t) continue;
    t.style.color = i===idx ? 'var(--green)' : 'var(--text2)';
    t.style.borderBottom = i===idx ? '2px solid var(--green)' : '2px solid transparent';
  }
  renderQuests();
}

var _QG = [
  {id:'q_play10',   name:'Сыграй 10 игр',      icon:'🎮',target:10,  reward:200, key:'gamesPlayed'},
  {id:'q_gifts500', name:'Собери 500 подарков', icon:'🎁',target:500, reward:150, key:'gifts'      },
  {id:'q_streak3',  name:'Серия 3 дня',         icon:'🔥',target:3,   reward:300, key:'dailyStreak'},
  {id:'q_ref1',     name:'Пригласи 1 друга',    icon:'👥',target:1,   reward:500, key:'refCount'   },
  {id:'q_lvl5',     name:'Достигни 5 уровня',   icon:'⬆️',target:5,   reward:1000,key:'level'      },
];
var _QC = [
  {id:'cq_main',name:'Подпишись на канал',  icon:'📢',url:'https://t.me/GrinchGame',     reward:500},
  {id:'cq_news',name:'Подпишись на новости',icon:'📰',url:'https://t.me/GrinchGameNews', reward:300},
  {id:'cq_chat',name:'Войди в чат',         icon:'💬',url:'https://t.me/GrinchGameChat', reward:200},
];
var _QB = [
  {id:'bq_05',name:'Купи на 0.5 TON',icon:'💎',ton:0.5, grinch:1000,reward:200 },
  {id:'bq_1', name:'Купи на 1 TON',  icon:'💎',ton:1.0, grinch:2500,reward:500 },
  {id:'bq_2', name:'Купи на 2 TON',  icon:'💎',ton:2.0, grinch:6000,reward:1200},
];

function renderQuests() {
  var el = document.getElementById('questsList');
  if (!el) return;
  var S=window.S||{}, done=S.questsDone||{}, lp=getLevelProgress(S.gifts||0);

  if (_questTab===0) {
    el.innerHTML = _QG.map(function(q){
      var isDone=!!done[q.id], prog=0;
      if(q.key==='gamesPlayed') prog=S.gamesPlayed||0;
      else if(q.key==='gifts')  prog=S.gifts||0;
      else if(q.key==='dailyStreak') {
        try{ prog=JSON.parse(localStorage.getItem('gd2')||'{}').streak||0; }catch(e){}
      }
      else if(q.key==='refCount') prog=(S.friends&&S.friends.length)||0;
      else if(q.key==='level')    prog=lp.level;
      var pct=Math.min(100,Math.round(prog/q.target*100));
      return '<div class="quest-item'+(isDone?' done':'')+'"><div class="qi-icon">'+q.icon+'</div>'
        +'<div class="qi-info"><div class="qi-name">'+q.name+'</div>'
        +'<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">'+prog+' / '+q.target+'</div>'
        +'<div class="qi-prog-wrap"><div class="qi-prog" style="width:'+pct+'%;"></div></div></div>'
        +(isDone?'<div class="qi-done-badge">✓</div>'
          :pct>=100?'<button class="qi-claim" onclick="claimQuest(\''+q.id+'\','+q.reward+')">Забрать!</button>'
          :'<div class="qi-reward">+'+q.reward+' 🎁</div>')
        +'</div>';
    }).join('');
  } else if (_questTab===1) {
    el.innerHTML = _QC.map(function(q){
      var isDone=!!done[q.id];
      return '<div class="channel-quest'+(isDone?' done':'')+'"><div class="cq-logo" style="background:rgba(0,136,204,0.15);border-radius:12px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">'+q.icon+'</div>'
        +'<div class="cq-info" style="flex:1;"><div class="cq-name" style="font-size:14px;font-weight:700;margin-bottom:3px;">'+q.name+'</div>'
        +'<div class="cq-reward">+'+q.reward+' 🎁</div>'
        +(!isDone?'<div class="cq-check-btn" onclick="_pCheckChan(\''+q.id+'\',\''+q.url+'\','+q.reward+')">Проверить подписку</div>':'')
        +'</div>'+(isDone?'<div class="qi-done-badge">✓</div>':'<button class="cq-btn" onclick="_pOpenUrl(\''+q.url+'\')">Перейти</button>')+'</div>';
    }).join('');
  } else {
    el.innerHTML = _QB.map(function(q){
      var isDone=!!done[q.id];
      return '<div class="ton-quest'+(isDone?' done':'')+'"><div class="tq-icon">'+q.icon+'</div>'
        +'<div class="tq-info" style="flex:1;"><div class="tq-name">'+q.name+'</div>'
        +'<div class="tq-ton" style="font-size:11px;color:#29b6f6;margin-bottom:3px;">'+q.ton+' TON → '+q.grinch.toLocaleString()+' GRINCH</div>'
        +'<div class="tq-reward">+'+q.reward+' 🎁 бонус</div></div>'
        +(isDone?'<div class="qi-done-badge">✓</div>':'<button class="tq-btn" onclick="openTxModal(\''+q.id+'\')">Купить</button>')
        +'</div>';
    }).join('');
  }
}

function claimQuest(id, reward) {
  var S=window.S||{};
  if(!S.questsDone) S.questsDone={};
  if(S.questsDone[id]) return;
  S.questsDone[id]=true;
  S.gifts=(S.gifts||0)+reward;
  if(typeof save==='function') save();
  updateMenuTopbar(); renderQuests();
  if(typeof toast==='function') toast('🎁 +'+reward+' подарков!');
}

function claimBuyQuest(id) {
  var q=_QB.find(function(x){ return x.id===id; });
  if(!q) return;
  var S=window.S||{};
  if(!S.questsDone) S.questsDone={};
  if(S.questsDone[id]) return;
  S.questsDone[id]=true;
  S.gifts=(S.gifts||0)+q.reward;
  S.grinch=(S.grinch||0)+q.grinch;
  if(typeof save==='function') save();
  updateMenuTopbar(); renderQuests();
  if(typeof toast==='function') toast('✅ '+q.grinch.toLocaleString()+' GRINCH + '+q.reward+' 🎁');
}

function _pCheckChan(id, url, reward) {
  _pOpenUrl(url);
  setTimeout(function(){ claimQuest(id, reward); }, 3000);
}

function _pOpenUrl(url) {
  try {
    if(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.openTelegramLink)
      Telegram.WebApp.openTelegramLink(url);
    else window.open(url,'_blank');
  } catch(e){ window.open(url,'_blank'); }
}

/* ════════════════════════════════════════════
   ИНИЦИАЛИЗАЦИЯ — ждём window.S
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  var attempts = 0;
  var timer = setInterval(function() {
    attempts++;
    if (window.S || attempts > 40) {
      clearInterval(timer);
      if (window.S) updateMenuTopbar();
    }
  }, 100);
});
