let shopTabN = 0;

function shopTab(i, el) {
  document.querySelectorAll('.stab').forEach(t => {
    t.classList.remove('active');
    t.style.background = 'transparent';
    t.style.color = 'rgba(255,255,255,0.5)';
    t.style.boxShadow = 'none';
  });
  el.classList.add('active');
  el.style.background = 'rgba(46,204,113,0.3)';
  el.style.color = '#2ecc71';
  el.style.boxShadow = 'inset 0 0 0 1.5px rgba(46,204,113,0.6)';
  renderShop(i);
}

function renderShop(tab) {
  shopTabN = tab;
  const list = document.getElementById('shopList');
  if (!list) return;
  const sg = document.getElementById('shopGifts');
  const sc = document.getElementById('shopGrinch');
  if (sg) sg.textContent = (S.gifts || 0).toLocaleString();
  if (sc) sc.textContent = (S.grinch || 0).toLocaleString();
  list.innerHTML = '';
  if (tab === 0) renderBoostsGrid(list);
  else if (tab === 1) renderSkinsGrid(list);
  else if (tab === 2) renderTonShop();
}

function renderBoostsGrid(list) {
  const ICONS  = { slow:'⏱️', autobet:'🤖', hp:'❤️', totem:'🗿', magnet:'🌙', star:'⭐' };
  const COLORS = { slow:'#3498db', autobet:'#e67e22', hp:'#e74c3c', totem:'#9b59b6', magnet:'#8e44ad', star:'#f1c40f' };

  const grid = document.createElement('div');
  // Сетка 3 колонки, все строки одинаковой высоты
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:stretch;';

  SHOP.boosts.forEach(item => {
    const owned = S.inv[item.key] || 0;
    const maxed = owned >= item.max;
    const color = COLORS[item.key] || '#f1c40f';

    const card = document.createElement('div');
    // flex-direction:column + justify-content:space-between = кнопка всегда внизу
    card.style.cssText = `
      position:relative;
      background:linear-gradient(160deg,rgba(20,10,0,0.88),rgba(8,4,0,0.93));
      border:1.5px solid ${color}55;
      border-radius:16px;
      padding:10px 7px 8px;
      text-align:center;
      display:flex;flex-direction:column;align-items:center;justify-content:space-between;
      cursor:pointer;-webkit-tap-highlight-color:transparent;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      min-height:170px;
    `;

    if (owned > 0) {
      const badge = document.createElement('div');
      badge.style.cssText = `position:absolute;top:5px;right:5px;background:${color};border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#fff;z-index:2;`;
      badge.textContent = '×' + owned;
      card.appendChild(badge);
    }

    // Верхняя часть
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;';
    top.innerHTML = `
      <div style="font-size:34px;line-height:1;">${ICONS[item.key]}</div>
      <div style="font-size:11px;font-weight:800;color:#fff;line-height:1.2;">${item.name}</div>
      <div style="font-size:8px;color:rgba(255,255,255,0.4);line-height:1.3;">${item.desc}</div>
    `;
    card.appendChild(top);

    // Нижняя часть — цена + кнопка
    const bottom = document.createElement('div');
    bottom.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;margin-top:6px;';
    bottom.innerHTML = `
      <div style="background:rgba(0,0,0,0.4);border:1px solid ${color}66;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:800;color:${color};">
        ${item.price} 🟢
      </div>
      <button style="width:100%;padding:7px 4px;background:${maxed?'rgba(46,204,113,0.2)':`linear-gradient(135deg,#2ecc71,#27ae60)`};border:${maxed?'1px solid rgba(46,204,113,0.4)':`none`};border-radius:10px;font-size:11px;font-weight:900;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:${maxed?'none':'0 3px 10px rgba(46,204,113,0.4)'}">
        ${maxed ? '✅ MAX' : '🛒 Купить'}
      </button>
    `;
    card.appendChild(bottom);

    if (!maxed) {
      bottom.querySelector('button').onclick = (e) => { e.stopPropagation(); buyItem(item.key, 0); };
    }

    grid.appendChild(card);
  });
  list.appendChild(grid);
}

function renderSkinsGrid(list) {
  const SKIN_ICONS  = { lord:'👑', knight:'⚔️', ronin:'🥷', thief:'🕵️' };
  const SKIN_COLORS = { lord:'#9b59b6', knight:'#7f8c8d', ronin:'#e74c3c', thief:'#546e7a' };

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch;';

  SHOP.skins.forEach(item => {
    const owned = S.skin === item.key;
    const color = SKIN_COLORS[item.key] || '#9b59b6';

    const card = document.createElement('div');
    card.style.cssText = `
      background:linear-gradient(160deg,rgba(20,10,0,0.88),rgba(8,4,0,0.93));
      border:1.5px solid ${owned ? '#2ecc71' : color+'55'};
      border-radius:16px;padding:14px 10px 10px;
      text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
      cursor:pointer;-webkit-tap-highlight-color:transparent;
      box-shadow:0 2px 12px rgba(0,0,0,0.5);
      min-height:200px;
    `;

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;';
    top.innerHTML = `
      <div style="font-size:44px;line-height:1;">${SKIN_ICONS[item.key]||'🎭'}</div>
      <div style="font-size:13px;font-weight:800;color:#fff;">${item.name}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);line-height:1.4;">${item.desc}</div>
    `;
    card.appendChild(top);

    const bottom = document.createElement('div');
    bottom.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;margin-top:8px;';
    bottom.innerHTML = `
      <div style="background:rgba(0,0,0,0.4);border:1px solid ${owned?'#2ecc71':color}66;border-radius:8px;padding:3px 10px;font-size:10px;font-weight:800;color:${owned?'#2ecc71':color};">
        ${owned ? '✅ Надет' : item.price + ' 🟢'}
      </div>
      ${!owned ? `<button style="width:100%;padding:8px;background:linear-gradient(135deg,#2ecc71,#27ae60);border:none;border-radius:10px;font-size:12px;font-weight:900;color:#fff;cursor:pointer;box-shadow:0 3px 10px rgba(46,204,113,0.4);">🛒 Купить</button>` : ''}
    `;
    if (!owned) {
      bottom.querySelector('button').onclick = (e) => { e.stopPropagation(); buyItem(item.key, 1); };
    }
    card.appendChild(bottom);
    grid.appendChild(card);
  });
  list.appendChild(grid);
}

function renderTonShop() {
  const list = document.getElementById('shopList');
  if (!list) return;
  list.innerHTML = '';

  const wb = document.createElement('div');
  wb.style.cssText = 'background:rgba(0,136,204,0.1);border:1px solid rgba(0,136,204,0.3);border-radius:14px;padding:12px;margin-bottom:10px;';
  if (S.wallet) {
    wb.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><div style="font-size:12px;color:#29b6f6;font-weight:700;">💎 ${S.wallet}</div><button onclick="disconnectWallet()" style="background:rgba(231,76,60,.15);border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:4px 10px;font-size:10px;font-weight:700;color:#e74c3c;cursor:pointer;">Отключить</button></div>`;
  } else {
    wb.innerHTML = `<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;text-align:center;">Подключи кошелёк для покупки GRINCH</div><button onclick="connectWallet()" style="width:100%;padding:10px;background:linear-gradient(135deg,#0088cc,#006699);border:none;border-radius:10px;font-size:13px;font-weight:800;color:#fff;cursor:pointer;">💎 Подключить кошелёк</button>`;
  }
  list.appendChild(wb);

  const rate = document.createElement('div');
  rate.style.cssText = 'text-align:center;font-size:12px;font-weight:700;color:#29b6f6;padding:6px;margin-bottom:8px;';
  rate.textContent = '💎 1 TON = 10,000 GRINCH 🟢';
  list.appendChild(rate);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch;';
  TON_PACKAGES.forEach(pkg => {
    const card = document.createElement('div');
    const hot = pkg.popular;
    card.style.cssText = `
      background:linear-gradient(160deg,rgba(0,30,50,0.9),rgba(0,15,30,0.95));
      border:1.5px solid ${hot?'rgba(0,136,204,0.7)':'rgba(0,136,204,0.25)'};
      border-radius:16px;padding:14px 10px;
      text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
      cursor:pointer;position:relative;min-height:180px;
    `;
    card.innerHTML = `
      ${hot?'<div style="position:absolute;top:6px;right:6px;background:linear-gradient(135deg,#e67e22,#e74c3c);border-radius:6px;padding:2px 6px;font-size:8px;font-weight:800;color:#fff;">🔥 ХИТ</div>':''}
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="font-size:26px;">💎</div>
        <div style="font-size:17px;font-weight:900;color:#2ecc71;">${pkg.grinch.toLocaleString()}</div>
        <div style="font-size:9px;color:rgba(46,204,113,0.6);">GRINCH</div>
        ${pkg.bonus?`<div style="font-size:9px;font-weight:700;color:#f1c40f;">${pkg.bonus}</div>`:''}
        <div style="font-size:14px;font-weight:800;color:#29b6f6;">${pkg.ton} TON</div>
      </div>
      <button onclick="openTonDeposit('${pkg.id}')" style="width:100%;margin-top:8px;padding:8px;background:linear-gradient(135deg,#0088cc,#006699);border:none;border-radius:10px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;">💎 Купить</button>
    `;
    grid.appendChild(card);
  });
  list.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', () => {
  const first = document.querySelector('.stab');
  if (first) { first.style.background='rgba(46,204,113,0.3)'; first.style.color='#2ecc71'; first.style.boxShadow='inset 0 0 0 1.5px rgba(46,204,113,0.6)'; }
});
