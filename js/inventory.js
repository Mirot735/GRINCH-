// ═══════════════════════════════════════════════════════════════
//  inventory.js
// ═══════════════════════════════════════════════════════════════

var _INV_META = {
  slow:    { emoji:'⏱️', name:'Замедление',   desc:'Подарки падают медленно 30 сек', where:'В игре',   price:50,   color:'#3498db' },
  magnet:  { emoji:'🌙', name:'Магнит',        desc:'Притягивает подарки 20 сек',     where:'В игре',   price:400,  color:'#8e44ad' },
  totem:   { emoji:'🗿', name:'Тотем',         desc:'Воскрешение после смерти',       where:'В игре',   price:500,  color:'#9b59b6' },
  star:    { emoji:'⭐', name:'x2 Хруст',      desc:'Двойная награда 15 сек',         where:'В игре',   price:200,  color:'#f1c40f' },
  hp:      { emoji:'❤️', name:'+1 Жизнь',      desc:'Доп. жизнь в раунде',            where:'В игре',   price:30,   color:'#e74c3c' },
  autobet: { emoji:'🤖', name:'Автосбор',       desc:'100 подарков/день авто',          where:'Пассивно', price:2000, color:'#e67e22' },
};

// Добавляем стили
(function(){
  if (document.getElementById('_invStyle')) return;
  var st = document.createElement('style');
  st.id = '_invStyle';
  st.textContent = '@keyframes goldPulse{0%,100%{box-shadow:0 0 10px rgba(241,196,15,0.6),0 0 20px rgba(241,196,15,0.2);}50%{box-shadow:0 0 18px rgba(241,196,15,1),0 0 36px rgba(241,196,15,0.5);}}'
  + '.inv-bg video,.prof-bg video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:0;}';
  document.head.appendChild(st);
})();

function renderInventoryScreen() { switchInvTab('boosts'); }

function switchInvTab(tab) {
  ['boosts','res','nft'].forEach(function(t) {
    var pane = document.getElementById('inv-content-' + t);
    var btn  = document.getElementById('itab-' + t);
    if (pane) pane.style.display = (t === tab) ? 'flex' : 'none';
    if (btn) {
      if (t === tab) {
        btn.style.cssText = 'flex:1;padding:10px 4px;text-align:center;border-radius:12px;cursor:pointer;'
          + 'background:rgba(0,0,0,0.85);border:2px solid #f1c40f;'
          + 'box-shadow:0 0 12px rgba(241,196,15,0.7);color:#f1c40f;'
          + 'font-size:12px;font-weight:900;letter-spacing:0.3px;';
      } else {
        btn.style.cssText = 'flex:1;padding:10px 4px;text-align:center;border-radius:12px;cursor:pointer;'
          + 'background:rgba(0,0,0,0.6);border:1.5px solid rgba(255,255,255,0.2);'
          + 'color:rgba(255,255,255,0.6);font-size:12px;font-weight:700;';
      }
    }
  });
  if (tab === 'boosts') _invRenderBoosts();
  if (tab === 'res')    _invRenderRes();
  if (tab === 'nft')    _invRenderNFT();
}

// ── Баффы — все 6 всегда видны ────────────────────────────
function _invRenderBoosts() {
  var grid = document.getElementById('invGridBoosts');
  if (!grid) return;

  // Читаем свежие данные
  var inv = {};
  try { inv = JSON.parse(localStorage.getItem('inv') || '{}'); } catch(e) {}
  if (window.S) window.S.inv = inv;

  grid.innerHTML = '';

  // Создаём попап если нет
  var popup = document.getElementById('_invPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = '_invPopup';
    popup.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);';
    popup.onclick = function(e){ if(e.target===popup) popup.style.display='none'; };
    document.body.appendChild(popup);
  }

  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:4px 0;';

  Object.keys(_INV_META).forEach(function(k) {
    var m   = _INV_META[k];
    var cnt = inv[k] || 0;
    var has = cnt > 0;
    if (!has) return; // Не показываем если нет

    var card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,rgba(8,8,8,0.95),rgba(18,18,18,0.95));'
      + 'border:2px solid ' + (has ? m.color : 'rgba(255,255,255,0.15)') + ';'
      + 'border-radius:16px;padding:10px 6px;'
      + 'display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;'
      + (has ? 'cursor:pointer;box-shadow:0 3px 12px ' + m.color + '44;' : 'opacity:0.5;');

    card.innerHTML = '<div style="font-size:28px;line-height:1;">' + m.emoji + '</div>'
      + '<div style="font-size:11px;font-weight:900;color:' + (has ? '#fff' : 'rgba(255,255,255,0.5)') + ';line-height:1.1;">' + m.name + '</div>'
      + '<div style="font-size:8px;color:rgba(255,255,255,0.4);line-height:1.2;">' + m.desc + '</div>'
      + '<div style="font-size:8px;background:rgba(46,204,113,0.12);border:1px solid rgba(46,204,113,0.3);border-radius:20px;padding:1px 5px;color:#2ecc71;font-weight:800;">' + m.price + ' 🟢</div>'
      + (has
        ? '<div style="background:' + m.color + ';border-radius:8px;padding:2px 10px;font-size:13px;font-weight:900;color:#fff;margin-top:1px;">×' + cnt + '</div>'
        : '<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:1px;">нет</div>');

    if (has) {
      (function(key, meta, count){
        card.onclick = function(){
          popup.style.display = 'flex';
          popup.innerHTML = '<div style="background:rgba(5,5,5,0.97);border:2px solid ' + meta.color + ';border-radius:22px;padding:28px 22px;width:82%;max-width:310px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;box-shadow:0 0 30px ' + meta.color + '55;">'
            + '<div style="font-size:56px;">' + meta.emoji + '</div>'
            + '<div style="font-size:20px;font-weight:900;color:#fff;">' + meta.name + '</div>'
            + '<div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">' + meta.desc + '</div>'
            + '<div style="font-size:11px;color:rgba(255,255,255,0.35);">📍 ' + meta.where + ' &nbsp;|&nbsp; 💰 ' + meta.price + ' GRINCH</div>'
            + '<div style="background:' + meta.color + '22;border:1.5px solid ' + meta.color + ';border-radius:12px;padding:6px 20px;font-size:14px;font-weight:800;color:' + meta.color + ';">В наличии: ×' + count + '</div>'
            + '<button onclick="document.getElementById(\'_invPopup\').style.display=\'none\';_invUseItem(\'' + key + '\')" style="width:100%;padding:14px;background:' + meta.color + ';border:none;border-radius:14px;font-size:15px;font-weight:900;color:#fff;cursor:pointer;">⚡ Использовать</button>'
            + '<div onclick="document.getElementById(\'_invPopup\').style.display=\'none\'" style="font-size:12px;color:rgba(255,255,255,0.3);cursor:pointer;">Закрыть</div>'
            + '</div>';
        };
      })(k, m, cnt);
    }

    wrap.appendChild(card);
  });

  if (wrap.children.length === 0) {
    grid.innerHTML = '<div style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">'
      + '<div style="font-size:56px;margin-bottom:14px;">🎒</div>'
      + '<div style="font-size:16px;font-weight:900;color:rgba(255,255,255,0.7);">Инвентарь пуст</div>'
      + '<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:8px;line-height:1.6;">Купи предметы в магазине!</div>'
      + '</div>';
    return;
  }
  grid.appendChild(wrap);
}

function _invUseItem(key) {
  if (!window.G || !window.G.running) {
    if (typeof toast === 'function') toast('⚡ Запусти игру чтобы использовать!');
    return;
  }
  if (typeof useItem === 'function') useItem(key);
  setTimeout(function() { _invRenderBoosts(); }, 100);
}

// ── Ресурсы ───────────────────────────────────────────────
function _invRenderRes() {
  var el = document.getElementById('invGridRes');
  if (!el) return;
  var inv = {};
  try { inv = JSON.parse(localStorage.getItem('inv') || '{}'); } catch(e) {}
  var chest7  = inv.chest7  || 0;
  var megaBox = inv.megaBox || 0;

  function resRow(emoji, name, val, color, sub) {
    return '<div style="background:rgba(0,0,0,0.6);border:1.5px solid ' + color + ';border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:14px;margin-bottom:10px;">'
      + '<div style="font-size:36px;flex-shrink:0;">' + emoji + '</div>'
      + '<div style="flex:1;"><div style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:700;letter-spacing:1px;text-transform:uppercase;">' + name + '</div>'
      + '<div style="font-size:26px;font-weight:900;color:#fff;">' + val + '</div>'
      + (sub ? '<div style="font-size:10px;color:rgba(255,255,255,0.35);">' + sub + '</div>' : '')
      + '</div></div>';
  }

  var html = '<div style="padding:4px 0;">';
  if (chest7 > 0)  html += resRow('🏆','Супер-сундук','×'+chest7,'rgba(241,196,15,0.8)','Награда за 7 дней подряд');
  if (megaBox > 0) html += resRow('🎀','Мега-бокс','×'+megaBox,'rgba(147,112,219,0.8)','Награда за 30 дней подряд');
  if (!chest7 && !megaBox) {
    html += '<div style="text-align:center;padding:50px 20px;">'
      + '<div style="font-size:48px;margin-bottom:12px;">📦</div>'
      + '<div style="font-size:15px;font-weight:700;color:rgba(255,255,255,0.6);">Боксов пока нет</div>'
      + '<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:6px;">Получи за 7 и 30 дней ежедневных наград!</div>'
      + '</div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

// ── NFT ───────────────────────────────────────────────────
function _invRenderNFT() {
  var el = document.getElementById('invGridNft') || document.getElementById('inv-content-nft');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px 20px;">'
    + '<div style="font-size:64px;margin-bottom:14px;">😈</div>'
    + '<div style="font-size:17px;font-weight:900;color:rgba(255,255,255,0.8);margin-bottom:8px;">GRINCH Collection</div>'
    + '<div style="font-size:12px;line-height:1.8;color:rgba(255,255,255,0.5);">NFT коллекция скоро будет доступна.</div>'
    + '<div style="margin-top:16px;background:rgba(46,204,113,0.12);border:1.5px solid rgba(46,204,113,0.4);border-radius:14px;padding:12px 16px;">'
    + '<div style="font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:1px;margin-bottom:6px;">КОНТРАКТ</div>'
    + '<div style="font-size:11px;font-weight:700;color:#2ecc71;word-break:break-all;">EQCjZmjHXzuFqx5J0o9oQbO-1d9o_fuKX5BOIvOH8sX6KQFj</div>'
    + '</div>'
    + '<div style="margin-top:14px;font-size:11px;color:rgba(255,255,255,0.3);">🔜 Скоро</div>'
    + '</div>';
}
