// ═══════════════════════════════════════════════════════
// GRINCH GAME — token.js — экран ТОКЕН GRINCH
// ═══════════════════════════════════════════════════════

// GRINCH_CONTRACT определён в config.js

function _tokRoadmapItem(icon, color, title, desc) {
  return '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;position:relative;">'
    + '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;margin-top:3px;box-shadow:0 0 12px ' + color + ',0 0 24px ' + color + '55;"></div>'
    + '<div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:' + color + ';letter-spacing:3px;text-transform:uppercase;">' + icon + ' ' + title + '</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(0,255,136,0.4);line-height:1.6;margin-top:3px;">' + desc + '</div>'
    + '</div>'
    + '</div>';
}

function renderTokenScreen() {
  var screen = document.getElementById('s-token');
  if (!screen) return;

  if (!document.getElementById('_tokenFonts')) {
    var lnk = document.createElement('link');
    lnk.id = '_tokenFonts';
    lnk.rel = 'stylesheet';
    lnk.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Rajdhani:wght@600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(lnk);
  }

  if (!document.getElementById('_tokenStyle')) {
    var st = document.createElement('style');
    st.id = '_tokenStyle';
    st.textContent = ''
      // ── ЭКРАН ──
      + '#s-token{'
      +   'background:#000 !important;'
      +   'position:relative;overflow:hidden;'
      + '}'
      // Scanlines overlay
      + '#s-token::before{'
      +   'content:"";position:fixed;top:0;left:0;width:100%;height:100%;'
      +   'background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px);'
      +   'pointer-events:none;z-index:999;'
      + '}'
      // ── КАРТОЧКИ ──
      + '#s-token .tok-card{'
      +   'background:rgba(0,8,3,0.95);'
      +   'border:1px solid rgba(0,255,136,0.2);'
      +   'border-radius:4px;padding:14px 16px;margin-bottom:10px;'
      +   'position:relative;overflow:hidden;'
      +   'box-shadow:0 0 20px rgba(0,255,136,0.03),inset 0 0 30px rgba(0,0,0,0.5);'
      + '}'
      + '#s-token .tok-card::before{'
      +   'content:"";position:absolute;top:0;left:0;right:0;height:1px;'
      +   'background:linear-gradient(90deg,transparent,rgba(0,255,136,0.6),transparent);'
      + '}'
      // ── ЗАГОЛОВКИ ──
      + '#s-token .tok-label{'
      +   'font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:700;'
      +   'letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;'
      +   'display:flex;align-items:center;gap:8px;'
      + '}'
      + '#s-token .tok-label-green{color:#00ff88;text-shadow:0 0 10px rgba(0,255,136,0.8);}'
      + '#s-token .tok-label-gold{color:#ffd700;text-shadow:0 0 10px rgba(255,215,0,0.6);}'
      // ── ЦЕНА ──
      + '#s-token .tok-price{'
      +   'font-family:"IBM Plex Mono",monospace;font-size:28px;font-weight:700;'
      +   'color:#00ff88;text-shadow:0 0 20px rgba(0,255,136,0.8),0 0 40px rgba(0,255,136,0.3);'
      +   'letter-spacing:-1px;'
      + '}'
      // ── ОПИСАНИЯ ──
      + '#s-token .tok-desc{'
      +   'font-family:"IBM Plex Mono",monospace;font-size:10px;color:rgba(0,255,136,0.4);line-height:1.6;'
      + '}'
      // ── TF КНОПКИ ──
      + '#s-token .tok-tf{'
      +   'font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:700;'
      +   'padding:4px 10px;border-radius:2px;cursor:pointer;letter-spacing:2px;'
      +   'border:1px solid rgba(0,255,136,0.15);background:transparent;'
      +   'color:rgba(0,255,136,0.3);transition:all .15s;'
      + '}'
      + '#s-token .tok-tf.active{'
      +   'border-color:#00ff88;background:rgba(0,255,136,0.1);color:#00ff88;'
      +   'box-shadow:0 0 8px rgba(0,255,136,0.3);'
      + '}'
      // ── ОСНОВНЫЕ КНОПКИ ──
      + '#s-token .tok-btn{'
      +   'width:100%;padding:15px;border:none;border-radius:4px;'
      +   'font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:700;'
      +   'cursor:pointer;letter-spacing:3px;text-transform:uppercase;'
      +   '-webkit-tap-highlight-color:transparent;transition:all .15s;'
      + '}'
      + '#s-token .tok-btn:active{transform:scale(0.98);}'
      // ── РАЗДЕЛИТЕЛЬ ──
      + '#s-token .tok-divider{'
      +   'height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.2),transparent);'
      +   'margin:4px 0 14px;'
      + '}'
      // ── USE CARDS ──
      + '#s-token .tok-use-card{'
      +   'background:rgba(0,255,136,0.03);border:1px solid rgba(0,255,136,0.12);'
      +   'border-radius:4px;padding:12px 8px;text-align:center;'
      +   'transition:all .2s;cursor:pointer;'
      + '}'
      + '#s-token .tok-use-card:active{background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.4);}'
      // ── STAT BADGE ──
      + '#s-token .tok-stat{'
      +   'background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.15);'
      +   'border-radius:4px;padding:10px;text-align:center;'
      + '}'
      // ── АНИМАЦИИ ──
      + '@keyframes tokSpin{to{transform:rotate(360deg)}}'
      + '@keyframes tokGlow{0%,100%{opacity:0.5;text-shadow:0 0 10px rgba(0,255,136,0.5)}50%{opacity:1;text-shadow:0 0 20px rgba(0,255,136,1),0 0 40px rgba(0,255,136,0.5)}}'
      + '@keyframes tokBlink{0%,100%{opacity:1}50%{opacity:0}}'
      + '@keyframes tokSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'
      + '@keyframes tokPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.4)}70%{box-shadow:0 0 0 6px rgba(0,255,136,0)}}'
      + '.tok-card{animation:tokSlideIn .3s ease both;}'
      + '.tok-card:nth-child(1){animation-delay:.05s}'
      + '.tok-card:nth-child(2){animation-delay:.1s}'
      + '.tok-card:nth-child(3){animation-delay:.15s}'
      + '.tok-card:nth-child(4){animation-delay:.2s}'
      + '.tok-card:nth-child(5){animation-delay:.25s}';
    document.head.appendChild(st);
  }

  // Фон — матрица-стайл с частицами
  if (!document.getElementById('_tokenBg')) {
    var bg = document.createElement('div');
    bg.id = '_tokenBg';
    bg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;';

    // Градиентные блики
    bg.innerHTML = '<div style="position:absolute;top:-20%;left:-10%;width:60%;height:60%;'
      + 'background:radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 70%);"></div>'
      + '<div style="position:absolute;bottom:-20%;right:-10%;width:50%;height:50%;'
      + 'background:radial-gradient(ellipse,rgba(255,215,0,0.03) 0%,transparent 70%);"></div>';

    screen.style.background = '#000';
    screen.insertBefore(bg, screen.firstChild);
  }

  var list = document.getElementById('tokenContent');
  if (!list) return;

  list.innerHTML = ''
    // ── HERO — минималистичный терминал ──
    + '<div style="padding:16px 0 18px;border-bottom:1px solid rgba(0,255,136,0.1);margin-bottom:12px;">'
    // Строка статуса как в терминале
    + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.3);letter-spacing:2px;margin-bottom:12px;">'
    +   '> GRINCH <span style="color:rgba(0,255,136,0.6);">$TON</span> <span style="animation:tokBlink 1s step-end infinite;">█</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:16px;">'
    // Лого крупнее с ярким пульсирующим кольцом
    + '<div style="position:relative;flex-shrink:0;">'
    +   '<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(0,255,136,0.5);animation:tokPulse 2s ease infinite;"></div>'
    +   '<div style="position:absolute;inset:-16px;border-radius:50%;border:1px solid rgba(0,255,136,0.15);animation:tokPulse 2s ease infinite 0.5s;"></div>'
    +   '<img src="assets/img/Image_3979.png" style="width:80px;height:80px;object-fit:contain;'
    +     'filter:drop-shadow(0 0 16px rgba(0,255,136,0.7)) drop-shadow(0 0 32px rgba(0,255,136,0.4)) brightness(1.2);'
    +     'position:relative;" '
    +     'onerror="this.outerHTML=\'<div style=\\\'width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(0,255,136,0.3),rgba(0,255,136,0.05));border:2px solid rgba(0,255,136,0.5);display:flex;align-items:center;justify-content:center;font-size:36px;\\\'>🟢</div>\'">'
    + '</div>'
    + '<div>'
    +   '<div style="font-family:\'Grinched\',cursive;font-size:38px;color:#00ff88;letter-spacing:3px;line-height:1;text-shadow:0 0 20px rgba(0,255,136,0.9),0 0 40px rgba(0,255,136,0.4);">GRINCH</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.4);letter-spacing:3px;margin-top:4px;">TON BLOCKCHAIN TOKEN</div>'
    +   '<div style="display:flex;align-items:center;gap:6px;margin-top:8px;">'
    +     '<div style="width:7px;height:7px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:tokPulse 1.5s ease infinite;"></div>'
    +     '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.7);letter-spacing:1px;">LIVE ON STON.FI</div>'
    +   '</div>'
    + '</div>'
    + '</div>'
    + '</div>'

    // ── ЦЕНА — большой терминальный дисплей ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-green"><tg-emoji emoji-id="5264760470371328402">💹</tg-emoji> Курс токена</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;">'
    + '<div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.4);letter-spacing:2px;margin-bottom:4px;">USD PRICE</div>'
    +   '<div class="tok-price" id="_tokPrice" style="animation:tokGlow 3s ease infinite;">Загрузка...</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;margin-top:6px;" id="_tokChange"></div>'
    + '</div>'
    + '<div style="text-align:right;">'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.3);letter-spacing:2px;">HOLDERS</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:700;color:#ffd700;text-shadow:0 0 15px rgba(255,215,0,0.6);line-height:1.2;" id="_tokHolders">—</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,215,0,0.3);">TON NETWORK</div>'
    + '</div>'
    + '</div>'
    + '</div>'

    // ── ГРАФИК ──
    + '<div class="tok-card" style="padding:12px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    + '<div class="tok-label tok-label-green" style="margin-bottom:0;"><tg-emoji emoji-id="5282950412784117735">📈</tg-emoji> График цены</div>'
    + '<div style="display:flex;gap:4px;" id="_tokPeriodBtns">'
    + '<button onclick="_tokLoad(\'1H\',this)" class="tok-tf">1H</button>'
    + '<button onclick="_tokLoad(\'4H\',this)" class="tok-tf">4H</button>'
    + '<button onclick="_tokLoad(\'1D\',this)" class="tok-tf active" id="_tokBtnDay">1D</button>'
    + '<button onclick="_tokLoad(\'1W\',this)" class="tok-tf">1W</button>'
    + '</div>'
    + '</div>'
    + '<div id="_tokChartWrap" style="position:relative;border-radius:2px;overflow:hidden;border:1px solid rgba(0,255,136,0.1);height:200px;background:#000;">'
    + '<div id="_tokLoader" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:5;background:#000;">'
    + '<div style="width:24px;height:24px;border:1px solid rgba(0,255,136,0.15);border-top-color:#00ff88;border-radius:50%;animation:tokSpin 0.8s linear infinite;"></div>'
    + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(0,255,136,0.4);letter-spacing:2px;">LOADING...</div>'
    + '</div>'
    + '<div id="_tokChartDiv" style="width:100%;height:200px;"></div>'
    + '</div>'
    + '</div>'

    // ── КОНТРАКТ ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-gold">📋 Смарт-контракт</div>'
    + '<div class="tok-divider"></div>'
    + '<div onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + GRINCH_CONTRACT + '\');if(typeof toast===\'function\')toast(\'📋 Скопировано!\')" '
    +   'style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#ffd700;word-break:break-all;'
    +   'background:rgba(255,215,0,0.03);padding:10px;border-radius:4px;'
    +   'border:1px solid rgba(255,215,0,0.15);cursor:pointer;letter-spacing:1px;line-height:1.8;">'
    + GRINCH_CONTRACT
    + '</div>'
    + '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,215,0,0.3);margin-top:6px;letter-spacing:1px;">// tap to copy • TON Blockchain • Jetton</div>'
    + '</div>'

    // ── КАК ПОЛУЧИТЬ — карусель ──
    + '<div class="tok-card" style="padding:14px;">'
    + '<div class="tok-label tok-label-green">⚡ Как получить GRINCH</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="position:relative;width:100%;overflow:hidden;border-radius:4px;" id="_tokCarouselWrap">'
    + '<div id="_tokCarousel" style="display:flex;transition:transform 0.4s cubic-bezier(.4,0,.2,1);will-change:transform;">'
    + _tokMakeSlides()
    + '</div>'
    + '</div>'
    + '<div id="_tokDots" style="display:flex;justify-content:center;gap:5px;margin-top:10px;">'
    + '<div class="_tDot" style="width:16px;height:2px;border-radius:1px;background:#00ff88;transition:all .3s;box-shadow:0 0 6px #00ff88;"></div>'
    + '<div class="_tDot" style="width:4px;height:2px;border-radius:1px;background:rgba(0,255,136,0.2);transition:all .3s;"></div>'
    + '<div class="_tDot" style="width:4px;height:2px;border-radius:1px;background:rgba(0,255,136,0.2);transition:all .3s;"></div>'
    + '<div class="_tDot" style="width:4px;height:2px;border-radius:1px;background:rgba(0,255,136,0.2);transition:all .3s;"></div>'
    + '</div>'
    + '</div>'

    // ── ПРИМЕНЕНИЕ — горизонтальный скролл ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-gold">💎 Применение токена</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">'
    + '<div class="tok-use-card" onclick="show(\'shop\')">'
    +   '<div style="font-size:20px;margin-bottom:6px;">🛒</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:#00ff88;letter-spacing:1px;">Магазин</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.35);margin-top:2px;">Премиум предметы</div>'
    + '</div>'
    + '<div class="tok-use-card">'
    +   '<div style="font-size:20px;margin-bottom:6px;">🏆</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:#ffd700;letter-spacing:1px;">Турниры</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,215,0,0.35);margin-top:2px;">Вход и призы</div>'
    + '</div>'
    + '<div class="tok-use-card">'
    +   '<div style="font-size:20px;margin-bottom:6px;">🎨</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:#00ff88;letter-spacing:1px;">NFT скины</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.35);margin-top:2px;">Эксклюзивы</div>'
    + '</div>'
    + '<div class="tok-use-card">'
    +   '<div style="font-size:20px;margin-bottom:6px;">📈</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:#ffd700;letter-spacing:1px;">Торговля</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,215,0,0.35);margin-top:2px;">STON.fi биржа</div>'
    + '</div>'
    + '</div>'
    + '</div>'

    // ── ТОКЕНОМИКА — терминальный стиль ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-gold">🪙 Токеномика</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">'

    + '<div class="tok-stat">'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,215,0,0.4);letter-spacing:2px;margin-bottom:4px;">SUPPLY</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:700;color:#ffd700;text-shadow:0 0 12px rgba(255,215,0,0.6);">1B</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(255,215,0,0.25);">1,000,000,000</div>'
    + '</div>'

    + '<div class="tok-stat">'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.4);letter-spacing:2px;margin-bottom:4px;">FDV</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:700;color:#00ff88;text-shadow:0 0 12px rgba(0,255,136,0.6);">$11K</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(0,255,136,0.25);">ATH $29.29K</div>'
    + '</div>'

    + '<div class="tok-stat" style="border-color:rgba(255,68,68,0.3);background:rgba(255,68,68,0.04);">'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(255,68,68,0.5);letter-spacing:2px;margin-bottom:4px;">LP BURNED</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:700;color:#ff4444;text-shadow:0 0 12px rgba(255,68,68,0.6);">100%</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(255,68,68,0.3);">🔥 навсегда</div>'
    + '</div>'

    + '<div class="tok-stat" style="border-color:rgba(0,255,136,0.3);">'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.4);letter-spacing:2px;margin-bottom:4px;">OWNERSHIP</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:20px;font-weight:700;color:#00ff88;">✅</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(0,255,136,0.3);">отказ</div>'
    + '</div>'

    + '</div>'
    + '<div style="background:rgba(0,255,136,0.02);border:1px solid rgba(0,255,136,0.08);border-radius:4px;padding:8px 10px;">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(0,255,136,0.06);">'
    +     '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(0,255,136,0.35);">💧 Ликвидность</div>'
    +     '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#00ff88;font-weight:700;">$5.49K</div>'
    +   '</div>'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">'
    +     '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(255,215,0,0.35);">📊 ATH FDV</div>'
    +     '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#ffd700;font-weight:700;">$29.29K</div>'
    +   '</div>'
    + '</div>'
    + '</div>'

    // ── ПОЧЕМУ ВЫРАСТЕТ ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-green">🚀 Почему GRINCH вырастет</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="display:flex;flex-direction:column;gap:6px;">'

    + _tokWhyItem('📱', '#00ff88', 'GRINCH = КЛЮЧ К АПКЕ', 'Токен открывает доступ ко всем функциям — розыгрышам, NFT, играм, турнирам')
    + _tokWhyItem('💎', '#ffd700', 'TON РАСТЁТ → GRINCH РАСТЁТ', 'Telegram развивается, TON расширяется — GRINCH часть этого движа')
    + _tokWhyItem('🎯', '#00ff88', 'ВЕСЬ ДВИЖ ЧЕРЕЗ GRINCH', 'NFT, игры, розыгрыши — всё работает через токен. Спрос растёт с активностью')
    + _tokWhyItem('📣', '#ffd700', 'ИНФЛЫ + МАСШТАБНЫЙ ШИЛЛИНГ', 'Сеть инфлюенсеров готовится шиллить проект на весь Telegram')

    + '</div>'
    + '</div>'

    // ── РОАДМАП ──
    + '<div class="tok-card">'
    + '<div class="tok-label tok-label-gold">🗺 Роадмап</div>'
    + '<div class="tok-divider"></div>'
    + '<div style="position:relative;padding-left:18px;">'
    + '<div style="position:absolute;left:4px;top:6px;bottom:6px;width:1px;background:linear-gradient(to bottom,#00ff88,rgba(0,255,136,0.05));"></div>'

    + _tokRoadmapItem('✅', '#00ff88', 'ЗАПУЩЕНО', 'Токен на TON, STON.fi, LP сожжено 100%, отказ от владения')
    + _tokRoadmapItem('✅', '#00ff88', 'СЕЙЧАС', 'Мини-апп, PVP арена, ежедневные награды, магазин')
    + _tokRoadmapItem('🔥', '#ffd700', 'СКОРО', 'Запуск апки, NFT скины, коллаборации с TON проектами')
    + _tokRoadmapItem('🚀', 'rgba(0,255,136,0.25)', 'БУДУЩЕЕ', 'Розыгрыши, инфлюенсеры, новые игры, новые листинги')

    + '</div>'
    + '</div>'

    // ── КНОПКИ ──
    + '<div style="display:flex;flex-direction:column;gap:8px;padding-bottom:20px;margin-top:4px;">'
    + '<button class="tok-btn" onclick="window.open(\'https://app.ston.fi/swap?inputCurrency=TON&outputCurrency=' + GRINCH_CONTRACT + '\',\'_blank\')" '
    +   'style="background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;font-weight:900;box-shadow:0 4px 20px rgba(0,255,136,0.3),0 0 40px rgba(0,255,136,0.1);">// КУПИТЬ НА STON.FI</button>'
    + '<button class="tok-btn" onclick="show(\'shop\')" '
    +   'style="background:transparent;color:#ffd700;border:1px solid rgba(255,215,0,0.3);box-shadow:0 0 20px rgba(255,215,0,0.05);">// МАГАЗИН ИГРЫ</button>'
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
  // Запускаем карусель
  setTimeout(_tokInitCarousel, 150);
}

function _tokWhyItem(icon, color, title, desc) {
  return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px;'
    + 'background:rgba(0,255,136,0.02);border:1px solid ' + (color === '#00ff88' ? 'rgba(0,255,136,0.12)' : 'rgba(255,215,0,0.12)') + ';border-radius:4px;">'
    + '<div style="font-size:20px;flex-shrink:0;line-height:1.3;">' + icon + '</div>'
    + '<div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:' + color + ';letter-spacing:1px;text-shadow:0 0 8px ' + color + '55;">' + title + '</div>'
    +   '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(0,255,136,0.35);line-height:1.5;margin-top:3px;">' + desc + '</div>'
    + '</div>'
    + '</div>';
}


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
    b.classList.toggle('active', b === btn);
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

var GRINCH_POOL = 'EQDuE8Ez0mVCitHi5eQuWSemKpUnGGe-u3WnVoQBoV3Z2KZ2';
var GRINCH_POOL_GT = 'EQDue8ez0mvCItHI5EquWSEMKpuNGGE-u3wnvoqBoV3z2kZ2';

function _tokFetchCandles(tf) {
  var tfMap = {
    '1H': { timeframe:'hour', aggregate:1, limit:24  },  // 24 часа
    '4H': { timeframe:'hour', aggregate:1, limit:96  },  // 4 дня почасово
    '1D': { timeframe:'day',  aggregate:1, limit:30  },  // 30 дней
    '1W': { timeframe:'day',  aggregate:1, limit:90  }   // 90 дней
  };
  var cfg = tfMap[tf] || tfMap['1D'];

  var url = 'https://api.geckoterminal.com/api/v2/networks/ton/pools/'
    + GRINCH_POOL_GT
    + '/ohlcv/' + cfg.timeframe
    + '?aggregate=' + cfg.aggregate
    + '&limit=' + cfg.limit
    + '&currency=usd';

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      _tokLoading2 = false;
      var list = d && d.data && d.data.attributes && d.data.attributes.ohlcv_list;
      if (!list || !list.length) { _tokShowError(); return; }

      var candles = list.map(function(c) {
        var ts = Number(c[0]);
        // GeckoTerminal отдаёт секунды (10 цифр), миллисекунды (13 цифр) делим
        if (ts > 1e12) ts = Math.floor(ts / 1000);
        return {
          time:  ts,
          open:  parseFloat(c[1]),
          high:  parseFloat(c[2]),
          low:   parseFloat(c[3]),
          close: parseFloat(c[4])
        };
      }).filter(function(c) {
        return c.open > 0 && c.close > 0 && c.time > 1000000000;
      }).sort(function(a, b) { return a.time - b.time; });

      if (!candles.length) { _tokShowError(); return; }
      _tokDrawLW(candles);
    })
    .catch(function() {
      _tokLoading2 = false;
      _tokShowError();
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
      background: { color: '#000' },
      textColor:  'rgba(0,255,136,0.3)',
      fontSize:   10,
    },
    grid: {
      vertLines: { color: 'rgba(0,255,136,0.04)' },
      horzLines: { color: 'rgba(0,255,136,0.04)' },
    },
    crosshair: {
      vertLine: { color: 'rgba(0,255,136,0.5)', width: 1, style: 3 },
      horzLine: { color: 'rgba(0,255,136,0.5)', width: 1, style: 3 },
    },
    rightPriceScale: {
      borderColor: 'rgba(0,255,136,0.08)',
      textColor:   'rgba(0,255,136,0.3)',
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    timeScale: {
      borderColor:     'rgba(0,255,136,0.08)',
      timeVisible:     true,
      secondsVisible:  false,
      fixLeftEdge:     true,
      fixRightEdge:    true,
    },
    handleScroll:   { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
    handleScale:    { mouseWheel: false, pinch: false, axisPressedMouseMove: false },
  });

  _tokSeries = _tokChart.addCandlestickSeries({
    upColor:          '#2ecc71',
    downColor:        '#e74c3c',
    borderUpColor:    '#2ecc71',
    borderDownColor:  '#e74c3c',
    wickUpColor:      '#2ecc71',
    wickDownColor:    '#e74c3c',
    priceFormat: {
      type: 'custom',
      formatter: function(price) {
        if (!price || price === 0) return '0';
        var s = price.toExponential();
        var exp = parseInt(s.split('e-')[1]) || 0;
        if (exp >= 2) {
          var digits = price.toFixed(exp+3).replace('0.','').replace(/^0+/,'').slice(0,3);
          var subs = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
          var subExp = String(exp-1).split('').map(function(c){ return subs[c]||c; }).join('');
          return '0.' + subExp + digits;
        }
        return price.toFixed(6);
      },
      minMove: 0.000000001,
    },
  });

  _tokSeries.setData(candles);
  _tokChart.timeScale().fitContent();
  _tokHideLoader();
}

function _tokHideLoader() {
  var loader = document.getElementById('_tokLoader');
  if (loader) loader.style.display = 'none';
}

function _tokShowError() {
  var loader = document.getElementById('_tokLoader');
  if (loader) {
    loader.style.display = 'flex';
    loader.innerHTML = '<div style="font-size:12px;color:rgba(231,76,60,0.7);">⚠️ Нет данных</div>';
  }
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

// ── 3D КАРУСЕЛЬ ───────────────────────────────────────
var _TOK_SLIDES = [
  { img:'assets/img/Image_3975.png', emoji:'📅', title:'Ежедневные награды', desc:'Заходи каждый день серией 8-30 и получай GRINCH токены', color:'#f1c40f', btn:'Забрать',    action:"show('daily')"  },
  { img:'assets/img/Image_3978.png', emoji:'⛏️', title:'Майнинг шахты',      desc:'Купи шахту и получай пассивный доход в GRINCH 24/7',    color:'#ff69b4', btn:'Майнинг',   action:"show('mining')" },
  { img:'assets/img/Image_3977.png', emoji:'⚔️', title:'PVP арена',          desc:'Побеждай соперников и зарабатывай GRINCH в битвах',      color:'#e74c3c', btn:'Сразиться', action:"show('pvp')"    },
  { img:'assets/img/Image_3976.png', emoji:'📋', title:'Квесты и задания',   desc:'Выполняй задания и получай награды в GRINCH токенах',    color:'#3498db', btn:'Задания',   action:"show('quests')" },
];

var _tokSlideIdx = 0;
var _tokSlideTimer = null;
var _tokTouchStartX = 0;

function _tokMakeSlides() {
  return _TOK_SLIDES.map(function(s, i) {
    return '<div class="_tSlide" style="flex:0 0 100%;width:100%;cursor:pointer;border-radius:16px;overflow:hidden;border:1.5px solid ' + s.color + '55;" onclick="' + s.action + '">'

      // Картинка на весь слайд
      + '<img src="' + s.img + '" style="width:100%;display:block;border-radius:16px 16px 0 0;">'

      // Кнопка отдельно под картинкой, внутри рамки
      + '<div style="background:#0d0d0d;padding:10px 14px;">'
      + '<div style="background:' + s.color + '22;border:1.5px solid ' + s.color + '88;border-radius:10px;padding:10px;text-align:center;">'
      + '<span style="font-size:13px;font-weight:900;color:' + s.color + ';">' + s.btn + ' →</span>'
      + '</div>'
      + '</div>'

      + '</div>';
  }).join('');
}

function _tokGoSlide(idx) {
  var wrap  = document.getElementById('_tokCarouselWrap');
  var track = document.getElementById('_tokCarousel');
  if (!track || !wrap) return;
  var w = wrap.offsetWidth;
  track.style.transition = 'transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  track.style.transform  = 'translateX(-' + (idx * w) + 'px)';
  _tokSlideIdx = idx;
  _tokUpdateDots();
}


function _tokInitCarousel() {
  var wrap  = document.getElementById('_tokCarouselWrap');
  var track = document.getElementById('_tokCarousel');
  if (!wrap || !track) return;

  var w = wrap.offsetWidth;
  var slides = track.querySelectorAll('._tSlide');
  slides.forEach(function(s) {
    s.style.flex  = '0 0 ' + w + 'px';
    s.style.width = w + 'px';
  });
  track.style.width = (w * slides.length) + 'px';

  var startX   = 0;
  var startOff = 0;
  var isDrag   = false;

  function getOffset() {
    return _tokSlideIdx * w;
  }

  function setPos(x, animated) {
    track.style.transition = animated
      ? 'transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none';
    track.style.transform = 'translateX(-' + x + 'px)';
  }

  wrap.addEventListener('touchstart', function(e) {
    isDrag   = true;
    startX   = e.touches[0].clientX;
    startOff = getOffset();
    track.style.transition = 'none';
    _tokRestartTimer();
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!isDrag) return;
    var dx  = e.touches[0].clientX - startX;
    var pos = startOff - dx;
    // Резиновый эффект на краях
    var max = (_TOK_SLIDES.length - 1) * w;
    if (pos < 0)   pos = pos * 0.25;
    if (pos > max) pos = max + (pos - max) * 0.25;
    setPos(pos, false);
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!isDrag) return;
    isDrag = false;
    var dx   = e.changedTouches[0].clientX - startX;
    var next = _tokSlideIdx;
    if (Math.abs(dx) > 35) {
      next = _tokSlideIdx + (dx < 0 ? 1 : -1);
      next = Math.max(0, Math.min(_TOK_SLIDES.length - 1, next));
    }
    setPos(next * w, true);
    _tokSlideIdx = next;
    _tokUpdateDots();
    _tokRestartTimer();
  }, { passive: true });

  _tokRestartTimer();
}


function _tokRestartTimer() {
  if (_tokSlideTimer) clearInterval(_tokSlideTimer);
  _tokSlideTimer = setInterval(function() {
    var next  = (_tokSlideIdx + 1) % _TOK_SLIDES.length;
    var wrap  = document.getElementById('_tokCarouselWrap');
    var track = document.getElementById('_tokCarousel');
    if (!wrap || !track) return;
    var w = wrap.offsetWidth;
    track.style.transition = 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform  = 'translateX(-' + (next * w) + 'px)';
    _tokSlideIdx = next;
    _tokUpdateDots();
  }, 4000);
}

function _tokUpdateDots() {
  var dots = document.querySelectorAll('._tDot');
  dots.forEach(function(d, i) {
    d.style.width      = i === _tokSlideIdx ? '16px' : '4px';
    d.style.background = i === _tokSlideIdx ? '#00ff88' : 'rgba(0,255,136,0.2)';
    d.style.boxShadow  = i === _tokSlideIdx ? '0 0 6px #00ff88' : 'none';
  });
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
