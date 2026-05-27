// ═══════════════════════════════════════════════════════
// GRINCH GAME — rating.js — Топ-50 (Cyber Terminal UI)
// ═══════════════════════════════════════════════════════

var RATING_API_URL = 'https://YOUR_BACKEND_URL/api/leaderboard';

// ── СТИЛИ ──────────────────────────────────────────────
(function _injectRatingStyles() {
  if (document.getElementById('_ratingStyle')) return;

  if (!document.querySelector('link[href*="IBM+Plex+Mono"]')) {
    var f = document.createElement('link');
    f.rel  = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(f);
  }

  var st = document.createElement('style');
  st.id = '_ratingStyle';
  st.textContent = [

  /* ЭКРАН */
  '#s-rating{background:#000!important;font-family:"IBM Plex Mono",monospace!important;flex-direction:column;overflow:hidden;position:relative;}',

  /* CRT SCANLINES */
  '#s-rating::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.16) 3px,rgba(0,0,0,0.16) 4px);pointer-events:none;z-index:9999;}',

  /* ВИНЬЕТКА */
  '#s-rating::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.7) 100%);pointer-events:none;z-index:9998;}',

  /* ХЕДЕР */
  '#s-rating .rat-header{flex-shrink:0;padding:16px 16px 13px;border-bottom:1px solid rgba(0,255,136,0.15);position:relative;display:flex;align-items:center;gap:10px;}',
  '#s-rating .rat-header::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ff88,transparent);}',

  '#s-rating .rat-hdr-back{width:34px;height:34px;border:1px solid rgba(0,255,136,0.2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:#00ff88;font-size:14px;cursor:pointer;flex-shrink:0;background:rgba(0,255,136,0.04);transition:all .15s;}',
  '#s-rating .rat-hdr-back:hover{border-color:#00ff88;background:rgba(0,255,136,0.1);}',

  '#s-rating .rat-hdr-center{flex:1;text-align:center;}',
  '#s-rating .rat-hdr-title{font-size:18px;font-weight:700;color:#00ff88;text-shadow:0 0 8px rgba(0,255,136,0.6),0 0 20px rgba(0,255,136,0.25);letter-spacing:3px;text-transform:uppercase;}',
  '#s-rating .rat-hdr-title::before{content:"// ";opacity:0.45;}',

  '#s-rating .rat-blink{display:inline-block;width:9px;height:17px;background:#00ff88;box-shadow:0 0 6px rgba(0,255,136,0.5);margin-left:3px;vertical-align:middle;animation:ratBlink 1.1s step-end infinite;}',
  '@keyframes ratBlink{0%,100%{opacity:1}50%{opacity:0}}',

  '#s-rating .rat-hdr-sub{font-size:9px;color:rgba(0,255,136,0.35);letter-spacing:3px;margin-top:3px;}',

  '#s-rating .rat-live{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700;letter-spacing:2px;color:#00ff88;text-shadow:0 0 6px rgba(0,255,136,0.5);flex-shrink:0;}',
  '#s-rating .rat-live-dot{width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:ratPulseDot 1.5s ease-in-out infinite;}',
  '@keyframes ratPulseDot{0%,100%{box-shadow:0 0 4px #00ff88;}50%{box-shadow:0 0 12px #00ff88,0 0 24px rgba(0,255,136,0.4);}}',

  /* ПРИЗОВОЙ БАННЕР */
  '#s-rating .rat-prize{flex-shrink:0;margin:10px 12px 0;background:linear-gradient(135deg,rgba(255,215,0,0.07),rgba(255,215,0,0.03));border:1px solid rgba(255,215,0,0.22);border-radius:4px;padding:10px 14px;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;animation:ratSlideIn 0.4s ease both;}',
  '#s-rating .rat-prize::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,215,0,0.55),transparent);}',
  '#s-rating .rat-prize-icon{font-size:22px;flex-shrink:0;}',
  '#s-rating .rat-prize-text{flex:1;}',
  '#s-rating .rat-prize-label{font-size:8px;font-weight:700;letter-spacing:3px;color:rgba(255,215,0,0.55);text-transform:uppercase;margin-bottom:3px;}',
  '#s-rating .rat-prize-amount{font-size:18px;font-weight:700;color:#ffd700;text-shadow:0 0 8px rgba(255,215,0,0.6);letter-spacing:1px;}',
  '#s-rating .rat-prize-sub{font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:1px;}',
  '#s-rating .rat-prize-right{text-align:right;flex-shrink:0;}',
  '#s-rating .rat-prize-big{font-size:22px;font-weight:700;color:#ffd700;text-shadow:0 0 8px rgba(255,215,0,0.6);}',
  '#s-rating .rat-prize-lbl{font-size:8px;color:rgba(255,215,0,0.45);letter-spacing:1px;}',

  /* РАЗДЕЛИТЕЛЬ */
  '#s-rating .rat-divider{height:1px;margin:10px 12px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.3),transparent);flex-shrink:0;}',

  /* СЕКЦИЯ */
  '#s-rating .rat-sec{flex-shrink:0;padding:0 14px 8px;display:flex;align-items:center;justify-content:space-between;}',
  '#s-rating .rat-sec-title{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#00ff88;text-shadow:0 0 6px rgba(0,255,136,0.5);}',
  '#s-rating .rat-sec-title::before{content:"// ";opacity:0.45;}',
  '#s-rating .rat-sec-count{font-size:9px;color:rgba(0,255,136,0.35);letter-spacing:1px;}',

  /* СПИСОК */
  '#s-rating .rat-list{flex:1;overflow-y:auto;padding-bottom:16px;-webkit-overflow-scrolling:touch;}',
  '#s-rating .rat-list::-webkit-scrollbar{width:2px;}',
  '#s-rating .rat-list::-webkit-scrollbar-track{background:transparent;}',
  '#s-rating .rat-list::-webkit-scrollbar-thumb{background:rgba(0,255,136,0.2);}',

  /* СТРОКА ИГРОКА */
  '.rat-row{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:0 10px 5px;background:rgba(0,8,3,0.95);border:1px solid rgba(0,255,136,0.12);border-radius:4px;position:relative;overflow:hidden;transition:all .15s;animation:ratSlideIn 0.35s ease both;}',
  '@keyframes ratSlideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}',
  '.rat-row::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.2),transparent);}',
  '.rat-row:hover{border-color:rgba(0,255,136,0.28);}',

  '.rat-row.rat-me{background:rgba(0,255,136,0.06);border-color:rgba(0,255,136,0.38);box-shadow:0 0 18px rgba(0,255,136,0.07),inset 0 0 20px rgba(0,255,136,0.02);}',
  '.rat-row.rat-me::before{background:linear-gradient(90deg,transparent,rgba(0,255,136,0.65),transparent);}',

  '.rat-row.rat-gold{background:rgba(255,215,0,0.05);border-color:rgba(255,215,0,0.25);}',
  '.rat-row.rat-silver{background:rgba(192,192,192,0.04);border-color:rgba(192,192,192,0.18);}',
  '.rat-row.rat-bronze{background:rgba(205,127,50,0.04);border-color:rgba(205,127,50,0.18);}',
  '.rat-row.rat-gold::before{background:linear-gradient(90deg,transparent,rgba(255,215,0,0.5),transparent);}',
  '.rat-row.rat-silver::before{background:linear-gradient(90deg,transparent,rgba(192,192,192,0.4),transparent);}',
  '.rat-row.rat-bronze::before{background:linear-gradient(90deg,transparent,rgba(205,127,50,0.4),transparent);}',

  /* МЕСТО */
  '.rat-rank{font-family:"IBM Plex Mono",monospace;font-size:12px;font-weight:700;min-width:26px;text-align:center;flex-shrink:0;color:rgba(0,255,136,0.38);}',
  '.rat-rank.medal{font-size:20px;line-height:1;}',

  /* АВАТАР */
  '.rat-avatar{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;border:1px solid rgba(0,255,136,0.18);background:rgba(0,255,136,0.04);color:rgba(0,255,136,0.55);position:relative;overflow:hidden;}',
  '.rat-avatar.me{color:#00ff88;border-color:rgba(0,255,136,0.45);box-shadow:0 0 10px rgba(0,255,136,0.15);}',
  '.rat-avatar.rank-1::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(255,215,0,0.4);animation:ratRing 2s ease-out infinite;}',
  '@keyframes ratRing{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.5);opacity:0}}',
  '.rat-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}',

  /* ИНФО */
  '.rat-info{flex:1;min-width:0;}',
  '.rat-nick{font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0.5px;}',
  '.rat-level{font-family:"IBM Plex Mono",monospace;font-size:9px;color:rgba(0,255,136,0.38);margin-top:2px;letter-spacing:2px;}',

  /* СЧЁТ */
  '.rat-score-wrap{display:flex;align-items:center;gap:6px;flex-shrink:0;}',
  '.rat-score{font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:700;color:rgba(255,215,0,0.75);white-space:nowrap;}',
  '.rat-row.rat-gold .rat-score{color:#ffd700;text-shadow:0 0 6px rgba(255,215,0,0.5);}',

  /* ТЫ-ТЕГ */
  '.rat-me-tag{font-family:"IBM Plex Mono",monospace;font-size:7px;font-weight:700;letter-spacing:2px;color:#000;background:#00ff88;padding:2px 6px;border-radius:2px;}',

  /* РАЗДЕЛИТЕЛЬ В СПИСКЕ */
  '.rat-sep{text-align:center;font-family:"IBM Plex Mono",monospace;font-size:9px;letter-spacing:3px;color:rgba(0,255,136,0.2);padding:8px 0 4px;}',

  /* ОФЛАЙН */
  '.rat-offline{margin:6px 10px 10px;padding:9px 12px;background:rgba(255,215,0,0.03);border:1px solid rgba(255,215,0,0.14);border-radius:4px;text-align:center;}',
  '.rat-offline-title{font-family:"IBM Plex Mono",monospace;font-size:9px;letter-spacing:1px;color:rgba(255,215,0,0.55);}',
  '.rat-offline-sub{font-family:"IBM Plex Mono",monospace;font-size:8px;color:rgba(255,255,255,0.2);margin-top:3px;letter-spacing:1px;}',

  /* ЛОАДЕР */
  '.rat-loader{display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 20px;}',
  '.rat-loader-ring{width:32px;height:32px;border:1px solid rgba(0,255,136,0.12);border-top-color:#00ff88;border-radius:50%;box-shadow:0 0 8px rgba(0,255,136,0.15);animation:ratSpin 0.8s linear infinite;}',
  '@keyframes ratSpin{to{transform:rotate(360deg)}}',
  '.rat-loader-text{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:3px;color:rgba(0,255,136,0.38);}',

  /* ПУСТО */
  '.rat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:10px;}',
  '.rat-empty-icon{font-size:40px;margin-bottom:6px;}',
  '.rat-empty-title{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:3px;color:rgba(0,255,136,0.55);text-transform:uppercase;}',
  '.rat-empty-sub{font-family:"IBM Plex Mono",monospace;font-size:10px;color:rgba(255,255,255,0.22);letter-spacing:1px;}',

  /* ЗАДЕРЖКИ */
  '.rat-row:nth-child(1){animation-delay:.04s}.rat-row:nth-child(2){animation-delay:.08s}.rat-row:nth-child(3){animation-delay:.12s}.rat-row:nth-child(4){animation-delay:.16s}.rat-row:nth-child(5){animation-delay:.20s}.rat-row:nth-child(6){animation-delay:.24s}.rat-row:nth-child(7){animation-delay:.28s}.rat-row:nth-child(8){animation-delay:.32s}.rat-row:nth-child(9){animation-delay:.36s}.rat-row:nth-child(10){animation-delay:.40s}'

  ].join('');
  document.head.appendChild(st);
})();

// ── ИНЖЕКТ HTML ────────────────────────────────────────
(function _injectRatingHTML() {
  function _init() {
    var screen = document.getElementById('s-rating');
    if (!screen) return;

    screen.classList.remove('active');

    screen.innerHTML =
      '<div class="rat-header">' +
        '<div class="rat-hdr-back" onclick="show(\'menu\')">◀</div>' +
        '<div class="rat-hdr-center">' +
          '<div class="rat-hdr-title">ТОП-50<span class="rat-blink"></span></div>' +
          '<div class="rat-hdr-sub">LEADERBOARD</div>' +
        '</div>' +
        '<div class="rat-live"><div class="rat-live-dot"></div>LIVE</div>' +
      '</div>' +

      '<div class="rat-prize">' +
        '<div class="rat-prize-icon">🏆</div>' +
        '<div class="rat-prize-text">' +
          '<div class="rat-prize-label">// PRIZE POOL</div>' +
          '<div class="rat-prize-amount">100 TON</div>' +
          '<div class="rat-prize-sub">Топ игроки получат TON в конце сезона</div>' +
        '</div>' +
        '<div class="rat-prize-right">' +
          '<div class="rat-prize-big">50×</div>' +
          '<div class="rat-prize-lbl">МЕСТ</div>' +
        '</div>' +
      '</div>' +

      '<div class="rat-divider"></div>' +

      '<div class="rat-sec">' +
        '<div class="rat-sec-title">PLAYERS</div>' +
        '<div class="rat-sec-count" id="ratPlayerCount">ЗАГРУЗКА...</div>' +
      '</div>' +

      '<div class="rat-list" id="ratingList"></div>';
  }

  window.addEventListener('load', _init);
})();

// ── СОСТОЯНИЕ ──────────────────────────────────────────
var _ratLoading = false;
var _ratData    = [];
var _ratMyId    = null;

// ── ГЛАВНАЯ ФУНКЦИЯ ────────────────────────────────────
function renderRating() {
  var list = document.getElementById('ratingList');
  if (!list) return;

  _ratMyId = (window.S && S.nick) ? S.nick
           : (window.Telegram && Telegram.WebApp &&
              Telegram.WebApp.initDataUnsafe &&
              Telegram.WebApp.initDataUnsafe.user)
             ? String(Telegram.WebApp.initDataUnsafe.user.id)
             : null;

  _ratShowLoader(list);
  _ratFetch();
}

// ── ЗАГРУЗКА ───────────────────────────────────────────
function _ratFetch() {
  if (_ratLoading) return;
  _ratLoading = true;

  fetch(RATING_API_URL + '?limit=50&t=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      _ratLoading = false;
      var players = data.players || data || [];
      _ratData = players;
      _ratRender(players, false);
    })
    .catch(function() {
      _ratLoading = false;
      _ratRenderOffline();
    });
}

// ── РЕНДЕР СПИСКА ──────────────────────────────────────
function _ratRender(players, offline) {
  var list = document.getElementById('ratingList');
  if (!list) return;

  if (!players || !players.length) { _ratRenderEmpty(list); return; }

  players = players.slice().sort(function(a, b) { return (b.gifts || 0) - (a.gifts || 0); });
  players = players.slice(0, 50);

  var myNick = (window.S && S.nick) || '';
  var myId   = _ratMyId;

  list.innerHTML = '';

  if (offline) {
    var banner = document.createElement('div');
    banner.className = 'rat-offline';
    banner.innerHTML =
      '<div class="rat-offline-title">⚡ РЕЙТИНГ АКТИВИРУЕТСЯ ПОСЛЕ ПОДКЛЮЧЕНИЯ СЕРВЕРА</div>' +
      '<div class="rat-offline-sub">Сейчас показаны только твои данные</div>';
    list.appendChild(banner);
  }

  players.forEach(function(p, i) {
    var isMe = (p.nick === myNick) || (String(p.id) === String(myId));
    list.appendChild(_ratMakeRow(p, i + 1, isMe));
  });

  var meInList = players.some(function(p) {
    return (p.nick === myNick) || (String(p.id) === String(myId));
  });

  if (!meInList && window.S) {
    var sep = document.createElement('div');
    sep.className = 'rat-sep';
    sep.textContent = '• • •';
    list.appendChild(sep);
    list.appendChild(_ratMakeRow({
      nick:   S.nick,
      gifts:  S.gifts,
      grinch: S.grinch,
      level:  (typeof getLevel === 'function') ? getLevel(S.gifts) : 1
    }, '?', true));
  }

  var cnt = document.getElementById('ratPlayerCount');
  if (cnt) cnt.textContent = offline ? 'OFFLINE MODE' : players.length + ' PLAYERS';
}

// ── ОФЛАЙН ─────────────────────────────────────────────
function _ratRenderOffline() {
  var nick   = (window.S && S.nick)   || localStorage.getItem('nick')   || 'Игрок';
  var gifts  = (window.S && S.gifts)  || parseInt(localStorage.getItem('gifts')  || '0', 10);
  var grinch = (window.S && S.grinch) || parseInt(localStorage.getItem('grinch') || '0', 10);
  var level  = (typeof getLevel === 'function') ? getLevel(gifts) : 1;
  _ratRender([{ nick: nick, gifts: gifts, grinch: grinch, level: level }], true);
}

// ── СТРОКА ИГРОКА ──────────────────────────────────────
function _ratMakeRow(p, rank, isMe) {
  var row = document.createElement('div');

  var cls = 'rat-row';
  if      (rank === 1) cls += ' rat-gold';
  else if (rank === 2) cls += ' rat-silver';
  else if (rank === 3) cls += ' rat-bronze';
  if (isMe) cls += ' rat-me';
  row.className = cls;

  var rankHtml = '';
  if      (rank === 1) rankHtml = '<div class="rat-rank medal">🥇</div>';
  else if (rank === 2) rankHtml = '<div class="rat-rank medal">🥈</div>';
  else if (rank === 3) rankHtml = '<div class="rat-rank medal">🥉</div>';
  else                 rankHtml = '<div class="rat-rank">#' + rank + '</div>';

  var letter  = (p.nick || '?')[0].toUpperCase();
  var avClass = 'rat-avatar' + (isMe ? ' me' : '') + (rank === 1 ? ' rank-1' : '');
  var avHtml  = '<div class="' + avClass + '">' +
    (p.avatar ? '<img src="' + p.avatar + '" onerror="this.outerHTML=\'' + letter + '\'">' : letter) +
    '</div>';

  var levelColor = rank <= 3 ? 'rgba(255,215,0,0.55)' : 'rgba(0,255,136,0.35)';
  var scoreColor = rank === 1 ? '#ffd700' : rank <= 3 ? 'rgba(255,215,0,0.85)' : 'rgba(255,215,0,0.65)';
  if (isMe && rank > 3) scoreColor = 'rgba(0,255,136,0.75)';

  var gifts = (p.gifts || 0).toLocaleString('ru-RU');
  var level = p.level || (typeof getLevel === 'function' ? getLevel(p.gifts || 0) : 1);

  row.innerHTML = rankHtml + avHtml +
    '<div class="rat-info">' +
      '<div class="rat-nick">' + (p.nick || 'Игрок') + '</div>' +
      '<div class="rat-level" style="color:' + levelColor + ';">LVL_' + String(level).padStart(2, '0') + '</div>' +
    '</div>' +
    '<div class="rat-score-wrap">' +
      '<div class="rat-score" style="color:' + scoreColor + ';">🎁 ' + gifts + '</div>' +
      (isMe ? '<div class="rat-me-tag">ТЫ</div>' : '') +
    '</div>';

  return row;
}

// ── ЛОАДЕР ─────────────────────────────────────────────
function _ratShowLoader(list) {
  list.innerHTML =
    '<div class="rat-loader">' +
      '<div class="rat-loader-ring"></div>' +
      '<div class="rat-loader-text">LOADING DATA...</div>' +
    '</div>';
}

// ── ПУСТО ──────────────────────────────────────────────
function _ratRenderEmpty(list) {
  list.innerHTML =
    '<div class="rat-empty">' +
      '<div class="rat-empty-icon">🏆</div>' +
      '<div class="rat-empty-title">РЕЙТИНГ ПУСТ</div>' +
      '<div class="rat-empty-sub">БУДЬ ПЕРВЫМ!</div>' +
    '</div>';
  var cnt = document.getElementById('ratPlayerCount');
  if (cnt) cnt.textContent = '0 PLAYERS';
}

// ── СИНХРОНИЗАЦИЯ ──────────────────────────────────────
function _ratSync() {
  if (!window.S) return;
  var tgUser = window.Telegram && Telegram.WebApp &&
    Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;

  fetch(RATING_API_URL + '/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id:       tgUser ? tgUser.id : null,
      nick:     S.nick,
      gifts:    S.gifts,
      grinch:   S.grinch,
      level:    (typeof getLevel === 'function') ? getLevel(S.gifts) : 1,
      initData: window.Telegram && Telegram.WebApp ? Telegram.WebApp.initData : ''
    })
  }).catch(function() {});
}
