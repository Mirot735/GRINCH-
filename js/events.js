// ═══════════════════════════════════════════════════════
// events.js — экран СОБЫТИЯ (enhanced dark christmas style v2)
// ═══════════════════════════════════════════════════════

var EVENTS_DATA = [
  { id:'e4', icon:'🎁', title:'Двойные подарки',     desc:'Выходные с двойным доходом — все подарки x2 на 48 часов.', date:'26 апр — 27 апр', prize:'x2 подарки', status:'soon' },
  { id:'e5', icon:'👥', title:'Реферальный марафон', desc:'Пригласи больше всех друзей и получи эксклюзивный NFT Гринча!', date:'1 мая — 31 мая', prize:'NFT', status:'soon' }
];

var EVENT_STATUS = {
  active:{
    label:'● АКТИВНО',
    color:'#2ecc71',
    dim:'rgba(46,204,113,0.95)',
    bg:'rgba(46,204,113,0.14)',
    border:'rgba(46,204,113,0.55)',
    glow:'rgba(46,204,113,0.35)',
    glowHard:'rgba(46,204,113,0.6)',
    ibg:'rgba(46,204,113,0.2)',
    ib:'rgba(46,204,113,0.6)',
    card:'linear-gradient(160deg,rgba(0,28,14,0.97) 0%,rgba(0,16,7,0.99) 55%,rgba(0,10,4,1) 100%)',
    topline:'rgba(46,204,113,0.5)',
    prize:'#2ecc71',
    prizeGlow:'rgba(46,204,113,0.5)',
    shimmer:'rgba(46,204,113,0.07)'
  },
  soon:{
    label:'◎ СКОРО',
    color:'#5dade2',
    dim:'rgba(93,173,226,0.95)',
    bg:'rgba(52,152,219,0.14)',
    border:'rgba(52,152,219,0.5)',
    glow:'rgba(52,152,219,0.3)',
    glowHard:'rgba(52,152,219,0.55)',
    ibg:'rgba(52,152,219,0.18)',
    ib:'rgba(52,152,219,0.55)',
    card:'linear-gradient(160deg,rgba(0,14,28,0.97) 0%,rgba(0,8,18,0.99) 55%,rgba(0,4,12,1) 100%)',
    topline:'rgba(52,152,219,0.45)',
    prize:'#5dade2',
    prizeGlow:'rgba(52,152,219,0.45)',
    shimmer:'rgba(52,152,219,0.06)'
  },
  new:{
    label:'★ НОВОЕ',
    color:'#f5c518',
    dim:'rgba(245,197,24,0.95)',
    bg:'rgba(241,196,15,0.13)',
    border:'rgba(241,196,15,0.52)',
    glow:'rgba(241,196,15,0.3)',
    glowHard:'rgba(241,196,15,0.55)',
    ibg:'rgba(241,196,15,0.18)',
    ib:'rgba(241,196,15,0.55)',
    card:'linear-gradient(160deg,rgba(22,15,0,0.97) 0%,rgba(14,9,0,0.99) 55%,rgba(8,5,0,1) 100%)',
    topline:'rgba(241,196,15,0.45)',
    prize:'#f5c518',
    prizeGlow:'rgba(241,196,15,0.45)',
    shimmer:'rgba(241,196,15,0.06)'
  }
};

function renderEvents() {
  var list = document.getElementById('eventsList');
  if (!list) return;

  // Inject styles once
  if (!document.getElementById('_eventsStyle')) {
    var st = document.createElement('style');
    st.id = '_eventsStyle';
    st.textContent = ''
      + '#eventsList{padding:6px 4px 28px;}'
      + '.ev-card{transition:transform 0.15s,box-shadow 0.15s;-webkit-tap-highlight-color:transparent;cursor:pointer;}'
      + '.ev-card:active{transform:scale(0.975);}'
      + '.ev-prize-btn{transition:box-shadow 0.2s;}';
    document.head.appendChild(st);
  }

  // Background
  var screen = document.getElementById('s-events');
  if (screen) {
    var existBg = document.getElementById('_eventsBg');
    if (existBg) existBg.remove();

    var bg = document.createElement('div');
    bg.id = '_eventsBg';
    bg.style.cssText = 'position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;';
    bg.innerHTML = ''
      + '<div style="position:absolute;inset:0;background-image:url(assets/img/Image_3980.jpg);background-size:cover;background-position:center;filter:blur(6px) brightness(0.18) saturate(0.45);transform:scale(1.1);"></div>'
      // Main dark overlay
      + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,10,4,0.88) 0%,rgba(0,6,2,0.4) 30%,rgba(0,5,2,0.55) 65%,rgba(0,2,1,0.97) 100%);"></div>'
      // Bottom vignette
      + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 115%,rgba(0,0,0,0.75) 0%,transparent 58%);"></div>'
      // Top vignette
      + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -15%,rgba(0,0,0,0.6) 0%,transparent 50%);"></div>'
      // Subtle green ambient top
      + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -5%,rgba(0,0,0,0) 0%,transparent 50%);"></div>'
      // Side vignettes
      + '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.35) 0%,transparent 20%,transparent 80%,rgba(0,0,0,0.35) 100%);"></div>';
    screen.insertBefore(bg, screen.firstChild);
    screen.style.position = 'relative';
    screen.style.overflow = 'hidden';

    var hdr = screen.querySelector('.page-header');
    if (hdr) { hdr.style.position='relative'; hdr.style.zIndex='2'; }
    list.style.position = 'relative';
    list.style.zIndex = '2';
  }

  if (!EVENTS_DATA.length) {
    list.innerHTML = '<div style="text-align:center;padding:60px 20px;">'
      + '<div style="font-size:52px;margin-bottom:12px;">📭</div>'
      + '<div style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.4);">Событий пока нет</div>'
      + '</div>';
    return;
  }

  list.innerHTML = EVENTS_DATA.map(function(e) {
    var s = EVENT_STATUS[e.status] || EVENT_STATUS.soon;

    var prizeHtml = e.prize ? ''
      + '<div class="ev-prize-btn" style="'
      + 'display:inline-flex;align-items:center;gap:5px;'
      + 'background:' + s.bg + ';'
      + 'border:1.5px solid ' + s.border + ';'
      + 'border-radius:11px;padding:6px 14px;'
      + 'font-size:13px;font-weight:900;color:' + s.prize + ';'
      + 'box-shadow:0 0 14px ' + s.prizeGlow + ',0 0 4px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.07);'
      + 'text-shadow:0 0 12px ' + s.dim + ',0 1px 3px rgba(0,0,0,0.8);'
      + 'flex-shrink:0;letter-spacing:0.5px;'
      + '">🏆 ' + e.prize + '</div>' : '';

    return ''
      + '<div class="ev-card" style="'
      + 'background:' + s.card + ';'
      + 'border:1.5px solid ' + s.border + ';'
      + 'border-radius:24px;'
      + 'padding:20px 16px 18px;'
      + 'margin-bottom:14px;'
      + 'display:flex;gap:14px;align-items:flex-start;'
      + 'box-shadow:'
        + '0 8px 36px ' + s.glow + ','
        + '0 3px 12px rgba(0,0,0,0.7),'
        + '0 1px 3px rgba(0,0,0,0.5),'
        + 'inset 0 1px 0 rgba(255,255,255,0.07),'
        + 'inset 0 0 40px ' + s.shimmer + ';'
      + 'position:relative;overflow:hidden;'
      + '">'

      // Top shimmer line
      + '<div style="position:absolute;top:0;left:8%;right:8%;height:1.5px;'
      + 'background:linear-gradient(90deg,transparent,' + s.topline + ',transparent);'
      + 'border-radius:2px;"></div>'

      // Inner corner glow top-left
      + '<div style="position:absolute;top:-10px;left:-10px;width:100px;height:100px;'
      + 'background:radial-gradient(circle,' + s.ibg + ' 0%,transparent 65%);'
      + 'pointer-events:none;"></div>'

      // Inner corner glow bottom-right
      + '<div style="position:absolute;bottom:-15px;right:-15px;width:80px;height:80px;'
      + 'background:radial-gradient(circle,' + s.shimmer + ' 0%,transparent 65%);'
      + 'pointer-events:none;"></div>'

      // Icon container
      + '<div style="'
      + 'width:66px;height:66px;flex-shrink:0;'
      + 'background:' + s.ibg + ';'
      + 'border:2px solid ' + s.ib + ';'
      + 'border-radius:20px;'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'font-size:32px;'
      + 'box-shadow:'
        + '0 0 22px ' + s.glow + ','
        + '0 0 8px ' + s.glow + ','
        + '0 3px 10px rgba(0,0,0,0.6),'
        + 'inset 0 1px 0 rgba(255,255,255,0.1);'
      + 'position:relative;z-index:1;'
      + '">' + e.icon + '</div>'

      // Content
      + '<div style="flex:1;min-width:0;position:relative;z-index:1;">'

      // Title row
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">'
      + '<div style="font-size:16px;font-weight:900;color:#fff;'
      + 'text-shadow:0 1px 8px rgba(0,0,0,0.95),0 0 20px rgba(0,0,0,0.5);'
      + 'line-height:1.2;">' + e.title + '</div>'
      + '<div style="'
      + 'background:' + s.bg + ';'
      + 'border:1px solid ' + s.border + ';'
      + 'border-radius:8px;padding:3px 9px;'
      + 'font-size:9px;font-weight:900;color:' + s.color + ';'
      + 'letter-spacing:1.3px;flex-shrink:0;'
      + 'box-shadow:0 0 12px ' + s.glow + ',inset 0 1px 0 rgba(255,255,255,0.06);'
      + 'text-shadow:0 0 12px ' + s.dim + ';'
      + '">' + s.label + '</div>'
      + '</div>'

      // Description
      + '<div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.65;margin-bottom:14px;">'
      + e.desc + '</div>'

      // Footer: date + prize
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
      + '<div style="'
      + 'font-size:10px;color:rgba(255,255,255,0.3);'
      + 'background:rgba(255,255,255,0.04);'
      + 'border:1px solid rgba(255,255,255,0.09);'
      + 'border-radius:7px;padding:4px 10px;'
      + 'letter-spacing:0.2px;'
      + '">📅 ' + e.date + '</div>'
      + prizeHtml
      + '</div>'

      + '</div>'
      + '</div>';
  }).join('');
}
