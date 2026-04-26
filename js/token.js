// ═══════════════════════════════════════════════════════
// GRINCH GAME — token.js — экран ТОКЕН GRINCH
// ═══════════════════════════════════════════════════════

// GRINCH_CONTRACT определён в config.js

function renderTokenScreen() {
  var screen = document.getElementById('s-token');
  if (!screen) return;

  if (!document.getElementById('_tokenStyle')) {
    var st = document.createElement('style');
    st.id = '_tokenStyle';
    st.textContent = ''
      + '#s-token .tok-card{background:rgba(0,0,0,0.55);border:1px solid rgba(46,204,113,0.25);border-radius:16px;padding:14px 16px;margin-bottom:12px;}'
      + '#s-token .tok-btn{width:100%;padding:13px;border:none;border-radius:14px;font-size:15px;font-weight:900;cursor:pointer;letter-spacing:1px;margin-bottom:10px;-webkit-tap-highlight-color:transparent;}'
      + '.tok-earn-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);}'
      + '.tok-earn-item:last-child{border-bottom:none;}'
      + '@keyframes tokSpin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }

  if (!document.getElementById('_tokenBg')) {
    var bg = document.createElement('div');
    bg.id = '_tokenBg';
    bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    bg.innerHTML = ''
      + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(46,204,113,0.08) 0%,transparent 60%);"></div>'
      + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(0,0,0,0.6) 0%,transparent 60%);"></div>';
    screen.insertBefore(bg, screen.firstChild);
  }

  var list = document.getElementById('tokenContent');
  if (!list) return;

  list.innerHTML = ''
    // ── HERO ──
    + '<div style="text-align:center;padding:10px 0 18px;">'
    + '<div style="margin-bottom:8px;"><img src="assets/img/Image_3979.png" style="width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 0 24px rgba(46,204,113,0.7));" onerror="this.outerHTML=\'<span style=font-size:80px>🟢</span>\'"></div>'
    + '<div style="font-family:\'Grinched\',cursive;font-size:32px;font-weight:900;color:#2ecc71;letter-spacing:3px;text-shadow:0 0 24px rgba(46,204,113,0.7);">GRINCH</div>'
    + '<div style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:2px;margin-top:4px;">TON BLOCKCHAIN TOKEN</div>'
    + '</div>'

    // ── ЦЕНА ──
    + '<div class="tok-card" style="border-color:rgba(46,204,113,0.4);background:linear-gradient(135deg,rgba(0,30,14,0.9),rgba(0,15,7,0.95));">'
    + '<div style="font-size:10px;color:rgba(46,204,113,0.7);font-weight:700;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">💹 Курс токена</div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
    + '<div>'
    + '<div style="font-size:28px;font-weight:900;color:#2ecc71;text-shadow:0 0 16px rgba(46,204,113,0.6);" id="_tokPrice">Загрузка...</div>'
    + '<div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px;" id="_tokChange"></div>'
    + '</div>'
    + '<div style="text-align:right;">'
    + '<div style="font-size:11px;color:rgba(255,255,255,0.4);">👥 Холдеры</div>'
    + '<div style="font-size:13px;font-weight:800;color:#fff;" id="_tokHolders">Загрузка...</div>'
    + '</div>'
    + '</div>'
    + '</div>'

    // ── ГРАФИК ──
    + '<div class="tok-card" style="padding:12px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    + '<div style="font-size:10px;color:rgba(46,204,113,0.7);font-weight:700;letter-spacing:1px;text-transform:uppercase;">📈 График цены</div>'
    + '<div style="display:flex;gap:5px;" id="_tokPeriodBtns">'
    + '<button onclick="_tokLoad(\'1H\',this)" style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;cursor:pointer;border:1px solid rgba(46,204,113,0.25);background:rgba(46,204,113,0.05);color:rgba(255,255,255,0.4);">1H</button>'
    + '<button onclick="_tokLoad(\'4H\',this)" style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;cursor:pointer;border:1px solid rgba(46,204,113,0.25);background:rgba(46,204,113,0.05);color:rgba(255,255,255,0.4);">4H</button>'
    + '<button onclick="_tokLoad(\'1D\',this)" id="_tokBtnDay" style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;cursor:pointer;border:1px solid rgba(46,204,113,0.7);background:rgba(46,204,113,0.2);color:#2ecc71;">1D</button>'
    + '<button onclick="_tokLoad(\'1W\',this)" style="padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;cursor:pointer;border:1px solid rgba(46,204,113,0.25);background:rgba(46,204,113,0.05);color:rgba(255,255,255,0.4);">1W</button>'
    + '</div>'
    + '</div>'
    + '<div id="_tokChartWrap" style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(46,204,113,0.2);height:200px;background:#060f08;">'
    + '<div id="_tokLoader" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;background:#060f08;">'
    + '<div style="width:28px;height:28px;border:3px solid rgba(46,204,113,0.15);border-top-color:#2ecc71;border-radius:50%;animation:tokSpin 0.8s linear infinite;"></div>'
    + '<div style="font-size:11px;color:rgba(46,204,113,0.6);">Загрузка графика...</div>'
    + '</div>'
    + '<div id="_tokChartDiv" style="width:100%;height:200px;"></div>'
    + '</div>'
    + '</div>'

    // ── КОНТРАКТ ──
    + '<div class="tok-card">'
    + '<div style="font-size:10px;color:rgba(255,255,255,0.45);font-weight:700;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">📋 Смарт-контракт</div>'
    + '<div onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + GRINCH_CONTRACT + '\');if(typeof toast===\'function\')toast(\'📋 Адрес скопирован!\')" style="font-size:10px;font-family:monospace;color:#f1c40f;word-break:break-all;background:rgba(0,0,0,0.4);padding:10px;border-radius:8px;border:1px solid rgba(241,196,15,0.2);cursor:pointer;">' + GRINCH_CONTRACT + '</div>'
    + '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:6px;">Нажми чтобы скопировать • TON Blockchain • Jetton</div>'
    + '</div>'

    // ── КАК ЗАРАБОТАТЬ ──
    + '<div class="tok-card">'
    + '<div style="font-size:10px;color:rgba(46,204,113,0.7);font-weight:700;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">⚡ Как получить GRINCH</div>'
    + '<div class="tok-earn-item"><div style="font-size:22px;">📅</div><div><div style="font-size:13px;font-weight:800;color:#fff;">Ежедневные награды</div><div style="font-size:11px;color:rgba(255,255,255,0.45);">Дни 8–30 серии</div></div></div>'
    + '<div class="tok-earn-item"><div style="font-size:22px;">⛏️</div><div><div style="font-size:13px;font-weight:800;color:#fff;">Майнинг в шахтах</div><div style="font-size:11px;color:rgba(255,255,255,0.45);">Пассивный доход 24/7</div></div></div>'
    + '<div class="tok-earn-item"><div style="font-size:22px;">⚔️</div><div><div style="font-size:13px;font-weight:800;color:#fff;">PVP арена</div><div style="font-size:11px;color:rgba(255,255,255,0.45);">Победы в битвах</div></div></div>'
    + '<div class="tok-earn-item"><div style="font-size:22px;">📋</div><div><div style="font-size:13px;font-weight:800;color:#fff;">Квесты и задания</div><div style="font-size:11px;color:rgba(255,255,255,0.45);">За выполнение заданий</div></div></div>'
    + '</div>'

    // ── ПРИМЕНЕНИЕ ──
    + '<div class="tok-card">'
    + '<div style="font-size:10px;color:rgba(241,196,15,0.7);font-weight:700;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">💎 Применение токена</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + '<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">🛒</div><div style="font-size:11px;font-weight:700;color:#fff;">Магазин</div><div style="font-size:9px;color:rgba(255,255,255,0.4);">Премиум предметы</div></div>'
    + '<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">🏆</div><div style="font-size:11px;font-weight:700;color:#fff;">Турниры</div><div style="font-size:9px;color:rgba(255,255,255,0.4);">Вход и призы</div></div>'
    + '<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">🎨</div><div style="font-size:11px;font-weight:700;color:#fff;">NFT скины</div><div style="font-size:9px;color:rgba(255,255,255,0.4);">Эксклюзивы</div></div>'
    + '<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">📈</div><div style="font-size:11px;font-weight:700;color:#fff;">Торговля</div><div style="font-size:9px;color:rgba(255,255,255,0.4);">STON.fi биржа</div></div>'
    + '</div>'
    + '</div>'

    // ── КНОПКИ ──
    + '<div style="margin-top:4px;">'
    + '<button class="tok-btn" onclick="window.open(\'https://app.ston.fi/swap?inputCurrency=TON&outputCurrency=' + GRINCH_CONTRACT + '\',\'_blank\')" style="background:linear-gradient(135deg,#2ecc71,#27ae60);color:#fff;box-shadow:0 4px 20px rgba(46,204,113,0.4);">🔄 Купить на STON.fi</button>'
    + '<button class="tok-btn" onclick="show(\'shop\')" style="background:linear-gradient(135deg,rgba(46,204,113,0.15),rgba(46,204,113,0.08));color:#2ecc71;border:1.5px solid rgba(46,204,113,0.4);">🛒 Магазин игры</button>'
    + '</div>';

  // Fetch live price — реальные данные
  function _tokFetchPrice() {
    fetch('https://api.dexscreener.com/latest/dex/tokens/' + GRINCH_CONTRACT)
      .then(function(r){ return r.json(); })
      .then(function(d) {
        if (!d || !d.pairs || !d.pairs.length) return;
        var pairs = d.pairs.sort(function(a,b){
          return ((b.liquidity&&b.liquidity.usd)||0) - ((a.liquidity&&a.liquidity.usd)||0);
        });
        var p = pairs[0];
        var realPrice = parseFloat(p.priceUsd) || 0;

        var priceEl  = document.getElementById('_tokPrice');
        var changeEl = document.getElementById('_tokChange');
        if (priceEl) priceEl.textContent = '$' + realPrice.toFixed(8).replace(/0+$/, '');
        if (changeEl) {
          var ch = p.priceChange && p.priceChange.h24;
          if (ch != null) {
            changeEl.textContent = (ch >= 0 ? '▲ +' : '▼ ') + Math.abs(ch).toFixed(2) + '% за 24ч';
            changeEl.style.color = ch >= 0 ? '#2ecc71' : '#e74c3c';
          }
        }
      }).catch(function() {
        var el = document.getElementById('_tokPrice');
        if (el && el.textContent === 'Загрузка...') el.textContent = '— USD';
      });

    // TonAPI — реальное число холдеров
    fetch('https://tonapi.io/v2/jettons/' + GRINCH_CONTRACT)
      .then(function(r){ return r.json(); })
      .then(function(d) {
        var holdEl = document.getElementById('_tokHolders');
        if (holdEl && d && d.holders_count != null) {
          holdEl.textContent = parseInt(d.holders_count).toLocaleString() + ' холдеров';
        }
      }).catch(function(){});
  }

  _tokFetchPrice();
  if (window._tokPriceInterval) clearInterval(window._tokPriceInterval);
  window._tokPriceInterval = setInterval(_tokFetchPrice, 30000);

  // Загружаем график
  setTimeout(_tokInitChart, 100);
}

// ── LIGHTWEIGHT CHARTS ────────────────────────────────
var _tokCurrentTF = '1D';
var _tokChart = null;
var _tokSeries = null;
var _tokLoading2 = false;

function _tokLoad(tf, btn) {
  if (tf === _tokCurrentTF && _tokSeries) return;
  if (_tokLoading2) return;
  _tokCurrentTF = tf;

  // Подсвечиваем кнопку
  document.querySelectorAll('#_tokPeriodBtns button').forEach(function(b) {
    var active = b === btn;
    b.style.borderColor = active ? 'rgba(46,204,113,0.7)' : 'rgba(46,204,113,0.25)';
    b.style.background  = active ? 'rgba(46,204,113,0.2)' : 'rgba(46,204,113,0.05)';
    b.style.color       = active ? '#2ecc71' : 'rgba(255,255,255,0.4)';
  });

  var loader = document.getElementById('_tokLoader');
  if (loader) loader.style.display = 'flex';
  _tokLoading2 = true;

  // Библиотека уже должна быть загружена через _tokInitChart
  if (window.LightweightCharts) {
    _tokFetchCandles(tf);
  } else {
    // Ждём загрузки
    var check = setInterval(function() {
      if (window.LightweightCharts) {
        clearInterval(check);
        _tokFetchCandles(tf);
      }
    }, 100);
    setTimeout(function() { clearInterval(check); _tokLoading2 = false; _tokHideLoader(); }, 8000);
  }
}

function _tokFetchCandles(tf) {
  var tfMap  = { '1H':'minute', '4H':'minute', '1D':'hour', '1W':'hour' };
  var aggMap = { '1H':'5',      '4H':'15',     '1D':'1',    '1W':'4'   };
  var limMap = { '1H':'24',     '4H':'32',     '1D':'48',   '1W':'42'  };

  var url = 'https://api.geckoterminal.com/api/v2/networks/ton/pools/'
    + GRINCH_CONTRACT + '/ohlcv/' + (tfMap[tf]||'hour')
    + '?aggregate=' + (aggMap[tf]||'1')
    + '&limit=' + (limMap[tf]||'48')
    + '&currency=usd';

  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function(r){ return r.json(); })
    .then(function(d) {
      _tokLoading2 = false;
      var ohlcv = d && d.data && d.data.attributes && d.data.attributes.ohlcv_list;
      if (!ohlcv || !ohlcv.length) { _tokHideLoader(); return; }

      // Конвертируем в формат LightweightCharts
      var candles = ohlcv.map(function(c) {
        return {
          time: Math.floor(c[0] / 1000),
          open:  parseFloat(c[1]),
          high:  parseFloat(c[2]),
          low:   parseFloat(c[3]),
          close: parseFloat(c[4])
        };
      }).sort(function(a,b){ return a.time - b.time; });

      _tokDrawLW(candles);
    })
    .catch(function() {
      _tokLoading2 = false;
      _tokHideLoader();
    });
}

function _tokDrawLW(candles) {
  var wrap = document.getElementById('_tokChartDiv');
  if (!wrap || !window.LightweightCharts) { _tokHideLoader(); return; }

  // Удаляем старый chart
  if (_tokChart) { try { _tokChart.remove(); } catch(e){} _tokChart = null; }
  wrap.innerHTML = '';

  var w = wrap.parentElement.clientWidth || 340;

  _tokChart = LightweightCharts.createChart(wrap, {
    width: w,
    height: 200,
    layout: {
      background: { color: '#060f08' },
      textColor:  'rgba(255,255,255,0.4)',
      fontSize:   10,
    },
    grid: {
      vertLines: { color: 'rgba(46,204,113,0.06)' },
      horzLines: { color: 'rgba(46,204,113,0.06)' },
    },
    crosshair: {
      vertLine: { color: 'rgba(46,204,113,0.4)', width: 1, style: 3 },
      horzLine: { color: 'rgba(46,204,113,0.4)', width: 1, style: 3 },
    },
    rightPriceScale: {
      borderColor: 'rgba(46,204,113,0.15)',
      textColor:   'rgba(255,255,255,0.3)',
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    timeScale: {
      borderColor:     'rgba(46,204,113,0.15)',
      timeVisible:     true,
      secondsVisible:  false,
      fixLeftEdge:     true,
      fixRightEdge:    true,
    },
    handleScroll:   { mouseWheel: false, pressedMouseMove: true },
    handleScale:    { mouseWheel: false, pinch: true, axisPressedMouseMove: false },
  });

  _tokSeries = _tokChart.addCandlestickSeries({
    upColor:          '#2ecc71',
    downColor:        '#e74c3c',
    borderUpColor:    '#2ecc71',
    borderDownColor:  '#e74c3c',
    wickUpColor:      '#2ecc71',
    wickDownColor:    '#e74c3c',
  });

  _tokSeries.setData(candles);
  _tokChart.timeScale().fitContent();
  _tokHideLoader();
}

function _tokHideLoader() {
  var loader = document.getElementById('_tokLoader');
  if (loader) loader.style.display = 'none';
}

function _tokInitChart() {
  // Сначала грузим библиотеку
  if (!window.LightweightCharts) {
    var loader = document.getElementById('_tokLoader');
    if (loader) loader.style.display = 'flex';
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js';
    s.onload = function() {
      _tokLoading2 = false;
      _tokFetchCandles('1D');
    };
    s.onerror = function() {
      _tokLoading2 = false;
      var loader = document.getElementById('_tokLoader');
      if (loader) loader.innerHTML = '<div style="font-size:11px;color:rgba(231,76,60,0.7);">Ошибка загрузки</div>';
    };
    document.head.appendChild(s);
    _tokLoading2 = true;
  } else {
    _tokFetchCandles('1D');
  }
}

// Автовызов когда экран становится активным
(function(){
  function _checkToken(){
    var scr = document.getElementById('s-token');
    if(scr && scr.classList.contains('active')){
      var content = document.getElementById('tokenContent');
      if(content && content.innerHTML.trim() === ''){
        renderTokenScreen();
      }
    }
  }
  // Следим за изменениями классов на экранах
  var obs = new MutationObserver(function(muts){
    muts.forEach(function(m){
      if(m.target.id === 's-token') _checkToken();
    });
  });
  document.addEventListener('DOMContentLoaded', function(){
    var scr = document.getElementById('s-token');
    if(scr) obs.observe(scr, {attributes:true, attributeFilter:['class']});
  });
  // Также патчим show() после загрузки
  window.addEventListener('load', function(){
    var origShow = window.show;
    if(typeof origShow === 'function'){
      window.show = function(name){
        origShow(name);
        if(name === 'token') setTimeout(function(){
          var c = document.getElementById('tokenContent');
          if(c && c.innerHTML.trim() === '') renderTokenScreen();
        }, 50);
      };
    }
  });
})();
