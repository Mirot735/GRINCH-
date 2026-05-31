// pvp_map_patch.js — бесшовные фоны арены
// Подключать в HTML ПОСЛЕ pvp.js

(function () {
  'use strict';

  var _BG = { night: null, castle: null, walls: null };

  [
    { key: 'night',  src: 'assets/tiles/Night.jpg'  },
    { key: 'castle', src: 'assets/tiles/Castle.png' },
    { key: 'walls',  src: 'assets/tiles/Walls.png'  },
  ].forEach(function (d) {
    var img = new Image();
    img.onload  = function () { _BG[d.key] = img; };
    img.onerror = function () { console.warn('[pvp_map] не найден: ' + d.src); };
    img.src = d.src;
  });

  window._pvpDrawCaveBG = function (ctx, W, H, now, camX) {
    camX = camX || 0;

    var ts = Math.round(W / 10);
    var floorY = (typeof PVP_FLOOR !== 'undefined' && PVP_FLOOR > 0)
      ? PVP_FLOOR
      : Math.round(H * 0.78) - ts;

    // 1. Небо — весь экран
    if (_BG.night) {
      ctx.drawImage(_BG.night, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Замок — параллакс 0.35, нижний край врастает в пол
    if (_BG.castle) {
      var cImg    = _BG.castle;
      var castleY = floorY - cImg.naturalHeight + 60;
      var cOff    = (-(camX * 0.35) % cImg.naturalWidth) - cImg.naturalWidth;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, floorY + 60);
      ctx.clip();
      for (var cx = cOff; cx < W + cImg.naturalWidth; cx += cImg.naturalWidth) {
        ctx.drawImage(cImg, Math.round(cx), Math.round(castleY));
      }
      ctx.restore();
    }

    // 3. Walls.png — пол строго от floorY вниз
    if (_BG.walls) {
      var wImg = _BG.walls;
      var wH   = H - floorY;
      var wW   = Math.floor(wImg.naturalWidth * (wH / wImg.naturalHeight));
      if (wW < 1) wW = 1;
      var wOff = Math.floor(-(camX * 1.0) % wW) - wW;
      for (var wx = wOff; wx < W + wW; wx += wW) {
        ctx.drawImage(wImg, wx, floorY, wW + 1, wH);
      }
    }

    // 4. Туман над полом
    var fog = ctx.createLinearGradient(0, floorY - 60, 0, floorY + 30);
    fog.addColorStop(0,   'rgba(10,30,20,0)');
    fog.addColorStop(0.7, 'rgba(20,60,40,0.3)');
    fog.addColorStop(1,   'rgba(10,25,15,0.7)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, floorY - 60, W, 90);
  };

  console.log('[pvp_map_patch] загружен');
})();
