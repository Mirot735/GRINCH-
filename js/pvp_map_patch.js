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


// ═══════════════════════════════════════════════════════════════
// BOSS SPRITES & ANIMATION (перенесено из pvp.js)
// ═══════════════════════════════════════════════════════════════
// ── СПРАЙТ1: walk/attack ─────────────────────────────────────────
var BOSS_SPRITE = {
  img: null, loaded: false, src: 'assets/boss/walk.png',
  fw: 184, fh: 226, cols: 2, rows: 3,
  anims: {
    walk:    { frames: [10,11,12,3,4,5], fps: 5, loop: true  },
    dead:    { frames: [1,2,3,4,5,6],     fps: 4, loop: false },
    windup:  { frames: [2,3],         fps: 4, loop: false },
    attack:  { frames: [4,5],         fps: 6, loop: false },
    recover: { frames: [0,1],         fps: 3, loop: false },
  },
};

// ── FLAME кадры (замена кадров 0,1,2 из walk.png) ───────────────
var BOSS_FLAMES = [null, null, null];
(function(){
  [0,1,2].forEach(function(i){
    var img = new Image();
    img.onload = function(){ BOSS_FLAMES[i] = img; };
    img.onerror = function(){ console.warn('Flame'+i+'.png missing'); };
    img.src = 'assets/boss/Flame'+i+'.png';
  });
})();

// ── СМЕРТЬ (кадры 1-6) ───────────────────────────────────────────
var BOSS_DEATH_FRAMES = new Array(7).fill(null);
(function(){
  for(var i=1;i<=6;i++){
    (function(n){
      var img=new Image();
      img.onload=function(){BOSS_DEATH_FRAMES[n]=img;};
      img.onerror=function(){console.warn('death'+n+'.png missing');};
      img.src='assets/boss/death'+n+'.png';
    })(i);
  }
})();

// ── СПРАЙТ АТАКИ (6 отдельных файлов) ───────────────────────────
var BOSS_ATTACK_FRAMES = new Array(6).fill(null);
(function(){
  for(var i=0;i<6;i++){
    (function(n){
      var img=new Image();
      img.onload=function(){BOSS_ATTACK_FRAMES[n]=img;};
      img.onerror=function(){console.warn('attack'+n+'.png missing');};
      img.src='assets/boss/attack'+n+'.png';
    })(i);
  }
})();
var BOSS_ATTACK = {
  loaded: true, img: true,
  fw: 220, fh: 160, cols: 1, rows: 1,
  anims: {
    windup:  { frames: [0,1],   fps: 5, loop: false },
    attack:  { frames: [2,3],   fps: 7, loop: false },
    recover: { frames: [4,5],   fps: 5, loop: false },
    dead:    { frames: [1,2,3,4,5,6], fps: 4, loop: false },
  },
};

// ── СПРАЙТ2: idle/hurt/dead ──────────────────────────────────────
var BOSS_SPRITE2 = {
  img: null, loaded: false, src: 'assets/img/boss_troll_idle.png',
  fw: 443, fh: 887, cols: 4,
  anims: {
    idle: { frames: [0,1], fps: 2, loop: true  },
    hurt: { frames: [2],   fps: 4, loop: false },
    dead: { frames: [2,3], fps: 3, loop: false },
  },
};

// ── АНИМАЦИЯ ─────────────────────────────────────────────────────
var _bossAnim = { cur:'walk', frameIdx:0, timer:0, onDone:null, locked:false };

function _bossPlayAnim(name, onDone) {
  var isCombat = (name==='windup'||name==='attack'||name==='recover'||name==='dead');
  var isIdle   = (name==='idle'||name==='walk'||name==='hurt');
  if (_bossAnim.locked && isIdle && !onDone) return;
  if (_bossAnim.cur===name && !onDone && !isCombat) return;
  _bossAnim.cur=name; _bossAnim.frameIdx=0; _bossAnim.timer=0;
  _bossAnim.onDone=onDone||null; _bossAnim.locked=isCombat;
}

function _bossTickAnim(dt) {
  var useAtk=(_bossAnim.cur==='windup'||_bossAnim.cur==='attack'||_bossAnim.cur==='recover');
  var useS2=(_bossAnim.cur==='hurt');
  var SP=useAtk?BOSS_ATTACK:(useS2?BOSS_SPRITE2:BOSS_SPRITE);
  var anim=(useAtk?BOSS_ATTACK.anims:(useS2?BOSS_SPRITE2.anims:BOSS_SPRITE.anims))[_bossAnim.cur];
  if(!anim)return;
  _bossAnim.timer+=Math.min(dt,100);
  var fd=1000/anim.fps;
  if(_bossAnim.timer>=fd){
    _bossAnim.timer-=fd; _bossAnim.frameIdx++;
    if(_bossAnim.frameIdx>=anim.frames.length){
      if(anim.loop){ _bossAnim.frameIdx=0; }
      else {
        _bossAnim.frameIdx=anim.frames.length-1;
        if(_bossAnim.onDone){var cb=_bossAnim.onDone;_bossAnim.onDone=null;_bossAnim.locked=false;cb();}
      }
    }
  }
}

function _bossDrawSprite(ctx, x, y) {
  var _canvas = _pvp.canvas;
  var _isLandscape = _canvas && _canvas.width > _canvas.height;
  var BOSS_H = _canvas ? Math.round(_canvas.height * (_isLandscape ? 0.66 : 0.43)) : Math.round(PVP_FLOOR * 0.62);
  var BOSS_Y_OFFSET = _isLandscape ? 0 : Math.round(_canvas.height * 0.04); // сдвиг вниз для портрета
  var useAtk = (_bossAnim.cur==='windup'||_bossAnim.cur==='attack'||_bossAnim.cur==='recover');
  var useS2  = (_bossAnim.cur==='hurt');
  var SP     = useAtk ? BOSS_ATTACK : (useS2 ? BOSS_SPRITE2 : BOSS_SPRITE);
  var anims  = useAtk ? BOSS_ATTACK.anims : (useS2 ? BOSS_SPRITE2.anims : BOSS_SPRITE.anims);

  // Пока спрайт не загружен — ничего не рисуем (не зелёный квадрат)
  if (!SP.loaded || !SP.img) return;

  var anim = anims[_bossAnim.cur];
  if (!anim) { anim = anims.idle || anims.walk; }
  if (!anim) return;

  var fi  = Math.min(_bossAnim.frameIdx, anim.frames.length-1);
  var frameNum = anim.frames[fi];
  var col  = frameNum % SP.cols;
  var row  = Math.floor(frameNum / SP.cols);
  var sx   = col * SP.fw;
  var sy   = row * SP.fh;
  var sc   = BOSS_H / SP.fh;
  var dw   = Math.round(SP.fw * sc);
  var dh   = BOSS_H;

  var alpha=1;
  if(_bossAnim.cur==='dead'){
    var prog=Math.min(1,fi/Math.max(1,anim.frames.length-1));
    alpha=Math.max(0,1-prog);
  }

  // Тень на полу под боссом — рисуем ДО flip, в нормальных координатах
  (function(){
    var _bsw = Math.round(dw * 0.30);
    var _bsh = Math.max(4, Math.round(5 * (dw / 140)));
    ctx.save();
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x, y, _bsw+5, _bsh+3, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = alpha * 0.30;
    ctx.beginPath(); ctx.ellipse(x, y, _bsw, _bsh, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = alpha * 0.42;
    ctx.beginPath(); ctx.ellipse(x, y, Math.round(_bsw*0.5), Math.round(_bsh*0.65), 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  })();

  ctx.save();
  if(_pvp.boss&&_pvp.boss.facingRight){ctx.translate(x*2,0);ctx.scale(-1,1);}
  ctx.globalAlpha=alpha;
  // Красный glow вокруг босса
  ctx.shadowColor='rgba(220,60,30,0.8)';
  ctx.shadowBlur=18;
  // Рисуем кадр
  var _flameIdx = frameNum >= 10 ? frameNum - 10 : -1;
  var _deathImg = null;
  if(_bossAnim.cur==='dead'){
    var _dfi = Math.min(fi+1, 6);
    for(var _dj=_dfi; _dj>=1; _dj--){
      if(BOSS_DEATH_FRAMES[_dj]){_deathImg=BOSS_DEATH_FRAMES[_dj];break;}
    }
  }
  var _atkImg = useAtk && BOSS_ATTACK_FRAMES[frameNum] ? BOSS_ATTACK_FRAMES[frameNum] : null;
  if (_deathImg) {
    var _dw2=_deathImg.naturalWidth, _dh2=_deathImg.naturalHeight;
    var _dsc=BOSS_H/_dh2, _ddw=Math.round(_dw2*_dsc);
    ctx.drawImage(_deathImg, 0, 0, _dw2, _dh2, Math.round(x-_ddw/2), Math.round(y-BOSS_H+BOSS_Y_OFFSET), _ddw, BOSS_H);
  } else if (_atkImg) {
    var _aw=_atkImg.naturalWidth, _ah=_atkImg.naturalHeight;
    var _asc=BOSS_H/_ah, _adw=Math.round(_aw*_asc);
    ctx.drawImage(_atkImg, 0, 0, _aw, _ah, Math.round(x-_adw/2), Math.round(y-BOSS_H+BOSS_Y_OFFSET), _adw, BOSS_H);
  } else if (_flameIdx >= 0 && BOSS_FLAMES[_flameIdx]) {
    var _fi = BOSS_FLAMES[_flameIdx];
    ctx.drawImage(_fi, 0, 0, _fi.naturalWidth, _fi.naturalHeight, Math.round(x-dw/2), Math.round(y-dh+BOSS_Y_OFFSET), dw, dh);
  } else {
    ctx.drawImage(SP.img, sx, sy, SP.fw, SP.fh, Math.round(x-dw/2), Math.round(y-dh+BOSS_Y_OFFSET), dw, dh);
  }
  ctx.globalAlpha=1;
  ctx.shadowBlur=0;
  ctx.restore();

  // Красная аура фаза3
  if(_pvp.boss&&_pvp.boss.phase>=2&&_bossAnim.cur!=='dead'){
    ctx.save();
    ctx.globalAlpha=0.12+Math.sin(Date.now()/200)*0.06;
    var gr=ctx.createRadialGradient(x,y-dh/2,5,x,y-dh/2,dw*0.6);
    gr.addColorStop(0,'rgba(255,0,0,0.5)');gr.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=gr;ctx.fillRect(x-dw,y-dh-10,dw*2,dh+10);
    ctx.globalAlpha=1;ctx.restore();
  }
}

function _bossLoadSprite(){
  if(!BOSS_SPRITE.loaded&&!BOSS_SPRITE._loading){
    BOSS_SPRITE._loading=true;
    var i=new Image();
    i.onload=function(){BOSS_SPRITE.img=i;BOSS_SPRITE.loaded=true;};
    i.onerror=function(){BOSS_SPRITE._loading=false;console.warn('boss_troll.png missing');};
    i.src=BOSS_SPRITE.src;
  }
  if(!BOSS_SPRITE2.loaded&&!BOSS_SPRITE2._loading){
    BOSS_SPRITE2._loading=true;
    var i2=new Image();
    i2.onload=function(){BOSS_SPRITE2.img=i2;BOSS_SPRITE2.loaded=true;};
    i2.onerror=function(){BOSS_SPRITE2._loading=false;console.warn('boss_troll_idle.png missing');};
    i2.src=BOSS_SPRITE2.src;
  }
}


// ═══════════════════════════════════════════════════════════════
// REWARD SEQUENCE (перенесено из pvp.js)
// ═══════════════════════════════════════════════════════════════
// ── REWARD SEQUENCE ───────────────────────────────────────────────
var _rewardRAF = null;
var _rewardParticles = [];
var _rewardGifts = [];
var _rewardState = { phase: 'idle', t: 0, flashAlpha: 0, titleScale: 0, titleAlpha: 0,
  grinchY: 0, grinchAlpha: 0, grinchBounce: 0,
  giftsPopped: 0, rewardItemsAlpha: [0,0], rewardItemsY: [0,0], done: false };

function _pvpWin(){
  if(_pvp.won)return;
  _pvp.won=true;_pvp.over=true;PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  if(typeof _pvpRemoveControls==="function")_pvpRemoveControls();
  var _hud=document.getElementById('pvpHUD');if(_hud)_hud.style.display='none';
  if(_pvp&&_pvp.canvas){var _fh=window.innerHeight;_pvp.canvas.height=_fh;_pvp.canvas.style.height=_fh+'px';_pvp.canvas.style.top='0';}
  var boss=_pvp.boss.data, time=Math.floor((Date.now()-_pvp.startTime)/1000);
  // Apply rewards to state (existing architecture untouched)
  if(window.S){
    S.gifts=(S.gifts||0)+boss.reward.gifts;
    S.grinch=(S.grinch||0)+boss.reward.grinch;
    if(typeof save==='function')try{save();}catch(e){}
  }
  // Inject reward overlay CSS once
  if(!document.getElementById('_pvpRewardStyle')){
    var _rs=document.createElement('style');_rs.id='_pvpRewardStyle';
    _rs.textContent=[
      '@keyframes _rwd_trophy{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.25) rotate(5deg)}80%{transform:scale(0.95) rotate(-2deg)}100%{transform:scale(1) rotate(0)}}',
      '@keyframes _rwd_grinch{0%{transform:translateY(60px) scale(0.5);opacity:0}50%{transform:translateY(-12px) scale(1.08);opacity:1}70%{transform:translateY(4px) scale(0.97);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}',
      '@keyframes _rwd_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
      '@keyframes _rwd_shimmer{0%{opacity:0.5}50%{opacity:1}100%{opacity:0.5}}',
      '@keyframes _rwd_chip_in{0%{transform:translateY(30px) scale(0.6);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}',
      '@keyframes _rwd_btn_pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,0.4)}50%{box-shadow:0 0 0 10px rgba(0,255,136,0)}}',
      '@keyframes _rwd_scanline{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}',
      '@keyframes _rwd_giftpop{0%{transform:scale(0) rotate(-30deg);opacity:1}60%{transform:scale(1.3) rotate(8deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:0.85}}',
      '._rwd_overlay{position:absolute;inset:0;z-index:100;overflow:hidden;pointer-events:none;}',
      '._rwd_overlay.active{pointer-events:auto;}',
      '._rwd_scanline_bar{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.4),transparent);animation:_rwd_scanline 2s linear infinite;pointer-events:none;}',
    ].join('');
    document.head.appendChild(_rs);
  }
  setTimeout(function(){ _pvpShowRewardSequence(boss.reward, time); }, 400);
}

function _pvpShowRewardSequence(reward, time) {
  var bossName = (_pvp.boss && _pvp.boss.data && _pvp.boss.data.name) ? _pvp.boss.data.name : 'ТРОЛЛЬ';
  var dmgDealt = Math.round(_pvp.dmgDealt || 0);
  var hitCount = _pvp.hitCount || 0;

  // Останавливаем canvas loop если ещё крутится
  if(_pvp && _pvp.canvas) {
    var _c = _pvp.canvas; _c.style.display = 'none';
  }

  // Инжектим стили один раз
  if(!document.getElementById('_pvpWinStyle')){
    var _ws=document.createElement('style');_ws.id='_pvpWinStyle';
    _ws.textContent=[
      '@keyframes _win_in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes _win_pop{0%{transform:scale(0.5);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}',
      '@keyframes _win_blink{0%,100%{opacity:1}50%{opacity:0}}',
      '@keyframes _win_pulse{0%,100%{box-shadow:0 0 6px rgba(0,255,136,0.4),0 0 0 0 rgba(0,255,136,0.2)}50%{box-shadow:0 0 14px rgba(0,255,136,0.7),0 0 0 6px rgba(0,255,136,0)}}',
      '@keyframes _win_scan{0%{top:-2px}100%{top:100%}}',
      '#_pvpWin{position:fixed;inset:0;z-index:999;background:#000;font-family:"IBM Plex Mono",monospace;display:flex;flex-direction:column;overflow:hidden;}',
      /* CRT scanline */
      '#_pvpWin::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px);pointer-events:none;z-index:10;}',
      /* скользящая линия */
      '#_pvpWin .win-scanline{position:absolute;left:0;right:0;height:2px;background:rgba(0,255,136,0.12);animation:_win_scan 3s linear infinite;pointer-events:none;z-index:11;}',
      /* внешняя рамка */
      '#_pvpWin .win-border{position:absolute;inset:6px;border:1px solid rgba(0,200,60,0.5);box-shadow:0 0 4px rgba(0,255,136,0.15);pointer-events:none;z-index:9;}',
      /* топ-бар */
      '#_pvpWin .win-topbar{display:flex;justify-content:space-between;padding:14px 20px 0;font-size:9px;letter-spacing:2px;color:rgba(0,255,136,0.5);flex-shrink:0;}',
      /* зона босса */
      '#_pvpWin .win-boss-zone{flex:0 0 auto;display:flex;align-items:flex-end;justify-content:center;position:relative;padding:10px 60px 0;}',
      '#_pvpWin .win-boss-zone img.win-boss{width:72%;max-width:300px;display:block;image-rendering:pixelated;image-rendering:crisp-edges;}',
      '#_pvpWin .win-torch{position:absolute;bottom:0;width:10%;max-width:44px;image-rendering:pixelated;image-rendering:crisp-edges;}',
      '#_pvpWin .win-torch.left{left:10px;}',
      '#_pvpWin .win-torch.right{right:10px;}',
      /* body */
      '#_pvpWin .win-body{flex:1;display:flex;flex-direction:column;padding:8px 12px 10px;gap:6px;overflow:hidden;}',
      /* заголовки */
      '#_pvpWin .win-sub{text-align:center;font-size:13px;font-weight:700;letter-spacing:3px;color:#00cc66;text-shadow:0 0 8px rgba(0,255,136,0.5);animation:_win_in .4s ease both;}',
      '#_pvpWin .win-main{text-align:center;font-size:clamp(34px,9vw,48px);font-weight:900;letter-spacing:4px;color:#00ff88;text-shadow:0 0 16px rgba(0,255,136,0.7);animation:_win_pop .5s .1s ease both;}',
      /* divider */
      '#_pvpWin .win-div{height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,136,0.35),transparent);margin:0 8px;flex-shrink:0;}',
      /* секция */
      '#_pvpWin .win-sec{font-size:9px;font-weight:700;letter-spacing:3px;color:rgba(0,255,136,0.5);text-align:center;flex-shrink:0;}',
      /* награды */
      '#_pvpWin .win-rewards{display:flex;gap:8px;flex-shrink:0;animation:_win_in .4s .25s ease both;}',
      '#_pvpWin .win-chip{flex:1;border-radius:4px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;gap:4px;}',
      '#_pvpWin .win-chip.gold{background:rgba(80,55,0,0.5);border:1px solid rgba(210,160,0,0.7);}',
      '#_pvpWin .win-chip.green{background:rgba(0,35,12,0.5);border:1px solid rgba(0,180,60,0.7);}',
      '#_pvpWin .win-chip img{width:52px;height:52px;image-rendering:pixelated;image-rendering:crisp-edges;}',
      '#_pvpWin .win-chip-val{font-size:clamp(20px,6vw,28px);font-weight:900;letter-spacing:1px;line-height:1.1;}',
      '#_pvpWin .win-chip-val.gold{color:#f1c40f;text-shadow:0 0 8px rgba(241,196,15,0.5);}',
      '#_pvpWin .win-chip-val.green{color:#00ff88;text-shadow:0 0 8px rgba(0,255,136,0.5);}',
      '#_pvpWin .win-chip-sub{font-size:8px;font-weight:700;letter-spacing:2px;}',
      '#_pvpWin .win-chip-sub.gold{color:rgba(210,160,0,0.8);}',
      '#_pvpWin .win-chip-sub.green{color:rgba(0,180,60,0.8);}',
      /* статистика горизонтально */
      '#_pvpWin .win-stats{display:flex;gap:4px;flex-shrink:0;animation:_win_in .4s .4s ease both;}',
      '#_pvpWin .win-stat{flex:1;border:1px solid rgba(0,255,136,0.18);border-radius:4px;background:rgba(0,10,4,0.8);padding:10px 6px;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;}',
      '#_pvpWin .win-stat img{width:32px;height:32px;image-rendering:pixelated;image-rendering:crisp-edges;opacity:0.9;flex-shrink:0;}',
      '#_pvpWin .win-stat-info{display:flex;flex-direction:column;align-items:flex-start;}',
      '#_pvpWin .win-stat-val{font-size:clamp(16px,4.5vw,22px);font-weight:700;color:rgba(255,255,255,0.9);white-space:nowrap;line-height:1.1;}',
      '#_pvpWin .win-stat-val span{font-size:0.6em;opacity:0.6;margin-left:2px;}',
      '#_pvpWin .win-stat-sub{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,0.3);}',
      /* кнопки */
      '#_pvpWin .win-btns{display:flex;gap:8px;flex-shrink:0;animation:_win_pulse 2s 1s infinite,_win_in .4s .55s ease both;animation-fill-mode:both;}',
      '#_pvpWin .win-btn{flex:1;height:clamp(46px,11vw,58px);border:none;border-radius:4px;font-family:"IBM Plex Mono",monospace;font-size:clamp(11px,3vw,13px);font-weight:900;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;-webkit-tap-highlight-color:transparent;}',
      '#_pvpWin .win-btn:active{opacity:0.75;transform:scale(0.97);}',
      '#_pvpWin .win-btn img{width:18px;height:18px;image-rendering:pixelated;}',
      '#_pvpWin .win-btn.primary{background:rgba(0,40,14,0.9);border:2px solid #00cc44;color:#00ff88;box-shadow:0 0 10px rgba(0,255,136,0.25);}',
      '#_pvpWin .win-btn.secondary{background:rgba(15,15,15,0.9);border:1px solid rgba(100,100,100,0.4);color:rgba(160,160,160,0.6);}',
      /* footer */
      '#_pvpWin .win-footer{text-align:center;font-size:8px;letter-spacing:3px;color:rgba(0,255,136,0.18);flex-shrink:0;}',
    ].join('');
    document.head.appendChild(_ws);
  }

  // Удаляем старый если есть
  var _old=document.getElementById('_pvpWin');
  if(_old)_old.parentNode.removeChild(_old);

  // Скрываем все оверлеи контролов
  ['pvpControls','pvpJoystick','pvpControlsOverlay','pvpMobileControls'].forEach(function(id){
    var el2=document.getElementById(id);if(el2)el2.style.display='none';
  });
  // Скрываем всё с z-index выше кнопок через класс
  document.querySelectorAll('[id*="joystick"],[id*="control"],[id*="Control"],[id*="Joystick"]').forEach(function(el2){
    if(el2.id!=='_pvpWin')el2.style.display='none';
  });

  var el=document.createElement('div');
  el.id='_pvpWin';
  el.innerHTML=[
    '<div class="win-scanline"></div>',
    '<div class="win-border"></div>',
    '<div class="win-topbar"><span>● GRINCH GAME</span><span>// BOSS RAID</span></div>',
    '<div class="win-boss-zone">',
      '<img class="win-torch left" src="assets/ui/torch.png" alt="">',
      '<img class="win-boss" src="assets/ui/boss_dead.png" alt="">',
      '<img class="win-torch right" src="assets/ui/torch.png" alt="">',
    '</div>',
    '<div class="win-body">',
      '<div class="win-sub">'+bossName.toUpperCase()+' ПОВЕРЖЕН!</div>',
      '<div class="win-main">ПОБЕДА!</div>',
      '<div class="win-div"></div>',
      '<div class="win-sec">НАГРАДЫ</div>',
      '<div class="win-rewards">',
        '<div class="win-chip gold">',
          '<img src="assets/ui/gift.png" alt="">',
          '<div class="win-chip-val gold" id="_wg">+0</div>',
          '<div class="win-chip-sub gold">ПОДАРКОВ</div>',
        '</div>',
        '<div class="win-chip green">',
          '<img src="assets/ui/coin.png" alt="">',
          '<div class="win-chip-val green" id="_wc">+0</div>',
          '<div class="win-chip-sub green">GRINCH</div>',
        '</div>',
      '</div>',
      '<div class="win-div"></div>',
      '<div class="win-sec">СТАТИСТИКА</div>',
      '<div class="win-stats">',
        '<div class="win-stat"><img src="assets/ui/icon_time.png" alt=""><div class="win-stat-info"><div class="win-stat-val">'+time+' <span>СЕК</span></div><div class="win-stat-sub">ВРЕМЯ БОЯ</div></div></div>',
        '<div class="win-stat"><img src="assets/ui/icon_damage.png" alt=""><div class="win-stat-info"><div class="win-stat-val" id="_wd">0</div><div class="win-stat-sub">УРОН</div></div></div>',
        '<div class="win-stat"><img src="assets/ui/icon_hits.png" alt=""><div class="win-stat-info"><div class="win-stat-val" id="_wh">0</div><div class="win-stat-sub">ПОПАДАНИЙ</div></div></div>',
      '</div>',
      '<div class="win-btns">',
        '<button class="win-btn primary" id="_winBtnFight"><img src="assets/ui/icon_sword.png" onerror="this.style.display=\'none\'"> СНОВА В БОЙ</button>',
        '<button class="win-btn secondary" id="_winBtnMenu"><img src="assets/ui/icon_home.png" onerror="this.style.display=\'none\'"> В МЕНЮ</button>',
      '</div>',
      '<div class="win-footer">· — // KEEP FIGHTING // — ·</div>',
    '</div>',
  ].join('');
  document.body.appendChild(el);

  // Вешаем обработчики через addEventListener — надёжнее onclick
  document.getElementById('_winBtnFight').addEventListener('click', function(){
    if(window._pvpWinCleanup){window._pvpWinCleanup();window._pvpWinCleanup=null;}
    if(typeof _pvpStartBoss==='function')_pvpStartBoss();
  });
  document.getElementById('_winBtnMenu').addEventListener('click', function(){
    if(window._pvpWinCleanup){window._pvpWinCleanup();window._pvpWinCleanup=null;}
    if(typeof _pvpGoMenu==='function')_pvpGoMenu();
    else if(typeof show==='function')show('menu');
  });

  // Счётчики
  function _cnt(id, target, delay) {
    setTimeout(function(){
      var el2=document.getElementById(id); if(!el2)return;
      var start=Date.now(), dur=600;
      var prefix=id==='_wg'||id==='_wc'?'+':'';
      (function tick(){
        var p=Math.min(1,(Date.now()-start)/dur);
        var v=Math.round(p*target);
        el2.textContent=prefix+v;
        if(p<1)requestAnimationFrame(tick);
      })();
    }, delay);
  }
  _cnt('_wg', reward.gifts||0,  350);
  _cnt('_wc', reward.grinch||0, 350);
  _cnt('_wd', dmgDealt,          500);
  _cnt('_wh', hitCount,          500);

  // Cleanup при уходе
  window._pvpWinCleanup=function(){
    var w=document.getElementById('_pvpWin');
    if(w)w.parentNode.removeChild(w);
    if(_pvp&&_pvp.canvas)_pvp.canvas.style.display='';
  };
  return; // дальше старый canvas-код не выполняется
  // ---- DEAD CODE BELOW (старый canvas draw) ----
  var canvas = _pvp && _pvp.canvas;
  var ctx    = _pvp && _pvp.ctx;
  if (!canvas || !ctx) return;
  var dmgDealt2=dmgDealt; // prevent lint error
  var hitCount = _pvp.hitCount || 0;

  // ── Load assets ──────────────────────────────────────────────────
  var A = {};
  var loadTotal = 7, loadDone = 0;
  function onLoad() { loadDone++; if (loadDone >= loadTotal && !_running) startScreen(); }
  [
    ['boss_dead',   'assets/ui/boss_dead.png'],
    ['torch',       'assets/ui/torch.png'],
    ['coin',        'assets/ui/coin.png'],
    ['gift',        'assets/ui/gift.png'],
    ['icon_time',   'assets/ui/icon_time.png'],
    ['icon_damage', 'assets/ui/icon_damage.png'],
    ['icon_hits',   'assets/ui/icon_hits.png'],
  ].forEach(function(p) {
    var im = new Image();
    im.onload  = function() { A[p[0]] = im; onLoad(); };
    im.onerror = function() { A[p[0]] = null; onLoad(); };
    im.src = p[1];
  });
  setTimeout(function() { if (!_running) startScreen(); }, 700);

  // ── State ────────────────────────────────────────────────────────
  var _running = false;
  var _raf = null, _startT = null;
  var _hov = -1;
  var _btnR = null, _btnM = null;
  var _cntG = 0, _cntC = 0, _cntD = 0, _cntH = 0;

  // ── Pointer ──────────────────────────────────────────────────────
  function _pt(e) {
    var rc = canvas.getBoundingClientRect();
    var sx = canvas.width / rc.width, sy = canvas.height / rc.height;
    var src = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x: (src.clientX - rc.left)*sx, y: (src.clientY - rc.top)*sy };
  }
  function _inR(p, r) { return r && p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h; }
  function _onMove(e) {
    var p = _pt(e), prev = _hov;
    _hov = _inR(p,_btnR)?0:_inR(p,_btnM)?1:-1;
    if (_hov !== prev) draw(performance.now());
  }
  function _onDown(e) {
    e.preventDefault(); e.stopPropagation();
    var p = _pt(e);
    if (_inR(p,_btnR)) { cleanup(); _pvpStartBoss(); }
    else if (_inR(p,_btnM)) { cleanup(); _pvpGoMenu(); }
  }
  canvas.addEventListener('pointermove', _onMove, {passive:true});
  canvas.addEventListener('pointerdown', _onDown, {passive:false});
  canvas.addEventListener('touchstart',  _onDown, {passive:false});
  function cleanup() {
    cancelAnimationFrame(_raf);
    canvas.removeEventListener('pointermove', _onMove);
    canvas.removeEventListener('pointerdown', _onDown);
    canvas.removeEventListener('touchstart',  _onDown);
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function rrect(x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }
  function ease(t,d) { var x=Math.max(0,Math.min(1,t/d)); return x<.5?2*x*x:-1+(4-2*x)*x; }
  function spring(t,d) { var x=Math.max(0,Math.min(1,t/d)); return x<.72?(x/.72)*1.10:1+(x-.72)/.28*(-.10); }

  // ── DRAW ─────────────────────────────────────────────────────────
  function draw(now) {
    if (_startT === null) _startT = now;
    var t  = now - _startT;
    var W  = canvas.width;
    var H  = canvas.height;
    var pad = 8;
    var gap = 8;

    // Pixel-crisp rendering
    ctx.imageSmoothingEnabled = false;

    // ── BACKGROUND ──────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // subtle green glow in boss zone
    var gr = ctx.createRadialGradient(W*.5, H*.22, 0, W*.5, H*.22, W*.6);
    gr.addColorStop(0,   'rgba(0,30,10,0.8)');
    gr.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H*0.55);

    // ── OUTER BORDER ────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#00cc44';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 10;
    ctx.strokeRect(pad, pad, W-pad*2, H-pad*2);
    ctx.restore();

    // Corner L-brackets
    var bL = 16;
    ctx.save();
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
    [[pad,pad,1,1],[W-pad,pad,-1,1],[pad,H-pad,1,-1],[W-pad,H-pad,-1,-1]].forEach(function(c){
      ctx.beginPath();
      ctx.moveTo(c[0]+c[2]*bL, c[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0], c[1]+c[3]*bL);
      ctx.stroke();
    });
    ctx.restore();

    // ── TOP BAR ─────────────────────────────────────────────────────
    ctx.save();
    ctx.font = '9px "IBM Plex Mono",monospace';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(0,255,136,0.55)';
    ctx.textAlign = 'left';  ctx.fillText('● GRINCH GAME', pad+10, pad+12);
    ctx.textAlign = 'right'; ctx.fillText('// BOSS RAID',  W-pad-10, pad+12);
    ctx.restore();

    // ── TORCHES — clean drawImage, no code decorations ───────────────
    var tW  = Math.round(W * 0.09);
    var tH  = Math.round(tW * 2.2);
    var tY  = pad + 28;
    var tLx = Math.round(W * 0.05);
    var tRx = W - tLx - tW;
    var fl1 = 0.82 + 0.18*Math.sin(t*0.012);
    var fl2 = 0.82 + 0.18*Math.sin(t*0.015+1.1);
    var bossA = ease(t, 500);

    if (A.torch) {
      ctx.save();
      ctx.globalAlpha = bossA * fl1;
      ctx.shadowBlur = 0;
      ctx.drawImage(A.torch, tLx, tY, tW, tH);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = bossA * fl2;
      ctx.shadowBlur = 0;
      ctx.drawImage(A.torch, tRx, tY, tW, tH);
      ctx.restore();
    }

    // ── BOSS HEAD — clean drawImage, nothing drawn on top ────────────
    var bossW  = Math.round(W * 0.56);
    var bossH2 = Math.round(bossW * 0.88);
    var bossX  = Math.round(W/2 - bossW/2);
    var bossY  = Math.round(H * 0.05);

    if (A.boss_dead) {
      ctx.save();
      ctx.globalAlpha = bossA;
      ctx.drawImage(A.boss_dead, bossX, bossY, bossW, bossH2);
      ctx.restore();
    }

    // ── TITLES ───────────────────────────────────────────────────────
    var titleBaseY = bossY + bossH2 + 10;

    var subA  = ease(t-400, 280);
    var subSz = Math.max(10, Math.round(W * 0.036));
    ctx.save();
    ctx.globalAlpha = subA;
    ctx.font = 'bold '+subSz+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#00cc66';
    ctx.fillText(bossName.toUpperCase()+' ПОВЕРЖЕН!', W/2, titleBaseY + subSz*0.8);
    ctx.restore();

    var titA  = ease(t-560, 320);
    var titSc = spring(t-560, 320);
    var titSz = Math.max(28, Math.round(W * 0.105));
    var titCY = titleBaseY + subSz*2.0 + titSz*0.55;
    ctx.save();
    ctx.globalAlpha = titA;
    ctx.translate(W/2, titCY); ctx.scale(titSc, titSc);
    ctx.font = 'bold '+titSz+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 14 + 7*Math.sin(t*0.0022);
    ctx.fillStyle = '#00ff88';
    ctx.fillText('ПОБЕДА!', 0, 0);
    ctx.restore();

    // divider
    var divY = titCY + titSz*0.65;
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,136,0.2)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(W*0.08, divY); ctx.lineTo(W*0.92, divY); ctx.stroke();
    ctx.restore();

    // ── REWARDS ──────────────────────────────────────────────────────
    var rewA  = ease(t-820, 320);
    var rewLY = divY + 14;

    ctx.save(); ctx.globalAlpha = rewA*0.75;
    ctx.font = 'bold 9px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 4;
    ctx.fillStyle = '#00ff88';
    ctx.fillText('НАГРАДЫ', W/2, rewLY);
    ctx.restore();

    if (t > 870) {
      _cntG = Math.round(Math.min(1,(t-870)/480) * (reward.gifts||0));
      _cntC = Math.round(Math.min(1,(t-870)/480) * (reward.grinch||0));
    }

    var rewY2 = rewLY + 10;
    var rH    = Math.round(H * 0.115);
    var cW    = (W - pad*2 - gap) / 2;
    var icS   = Math.round(rH * 0.32); // icon size inside reward chip

    // Reward chip LEFT (gifts) — green neon border on the chip only
    ctx.save(); ctx.globalAlpha = rewA;
    rrect(pad, rewY2, cW, rH, 8);
    ctx.fillStyle = 'rgba(160,110,0,0.14)'; ctx.fill();
    ctx.strokeStyle = 'rgba(210,160,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(220,170,0,0.5)'; ctx.shadowBlur = 8;
    ctx.stroke();
    // gift icon — clean drawImage
    if (A.gift) {
      ctx.shadowBlur = 0;
      ctx.drawImage(A.gift, pad+cW/2-icS/2, rewY2+rH*0.14, icS, icS);
    }
    ctx.font = 'bold '+Math.round(rH*0.28)+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f1c40f'; ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 10;
    ctx.fillText('+'+_cntG, pad+cW/2, rewY2+rH*0.62);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px "IBM Plex Mono",monospace';
    ctx.fillStyle = 'rgba(210,160,0,0.8)';
    ctx.fillText('ПОДАРКОВ', pad+cW/2, rewY2+rH*0.84);
    ctx.restore();

    // Reward chip RIGHT (grinch coin) — green neon border on the chip only
    var c2x = pad+cW+gap;
    ctx.save(); ctx.globalAlpha = rewA;
    rrect(c2x, rewY2, cW, rH, 8);
    ctx.fillStyle = 'rgba(0,70,25,0.14)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,200,70,0.6)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0,200,70,0.5)'; ctx.shadowBlur = 8;
    ctx.stroke();
    // coin icon — clean drawImage
    if (A.coin) {
      ctx.shadowBlur = 0;
      ctx.drawImage(A.coin, c2x+cW/2-icS/2, rewY2+rH*0.14, icS, icS);
    }
    ctx.font = 'bold '+Math.round(rH*0.28)+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 10;
    ctx.fillText('+'+_cntC, c2x+cW/2, rewY2+rH*0.62);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px "IBM Plex Mono",monospace';
    ctx.fillStyle = 'rgba(0,200,70,0.8)';
    ctx.fillText('GRINCH', c2x+cW/2, rewY2+rH*0.84);
    ctx.restore();

    // ── STATS ────────────────────────────────────────────────────────
    var stA  = ease(t-1100, 280);
    var stY  = rewY2 + rH + 8;

    ctx.save(); ctx.globalAlpha = stA*0.5;
    ctx.font = 'bold 9px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaa'; ctx.shadowBlur = 0;
    ctx.fillText('СТАТИСТИКА', W/2, stY+7);
    ctx.restore();

    stY += 14;
    var sH   = Math.round(H * 0.09);
    var sw3  = (W - pad*2 - 4) / 3;
    var icoS = 24; // fixed icon size — crisp, no squash

    if (t > 1150) {
      var sp = Math.min(1,(t-1150)/380);
      _cntD = Math.round(sp*dmgDealt);
      _cntH = Math.round(sp*hitCount);
    }

    var statItems = [
      {icon:'icon_time',   val:time+' СЕК', sub:'ВРЕМЯ БОЯ'},
      {icon:'icon_damage', val:String(_cntD), sub:'УРОН'},
      {icon:'icon_hits',   val:String(_cntH), sub:'ПОПАДАНИЙ'},
    ];

    statItems.forEach(function(sl, i) {
      var sx2 = pad + i*(sw3+2);
      ctx.save(); ctx.globalAlpha = stA;
      // slot border only — no icon border
      rrect(sx2, stY, sw3-2, sH, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,255,136,0.2)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
      ctx.stroke();

      // icon — clean drawImage at fixed 24x24, left side
      if (A[sl.icon]) {
        ctx.globalAlpha = stA * 0.85;
        ctx.shadowBlur = 0;
        ctx.drawImage(A[sl.icon], sx2+7, stY + sH/2 - icoS/2, icoS, icoS);
      }
      ctx.globalAlpha = stA;

      // value
      ctx.font = 'bold '+Math.round(sH*0.33)+'px "IBM Plex Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.shadowBlur = 0;
      ctx.fillText(sl.val, sx2 + sw3/2 + icoS*0.25, stY + sH*0.36);
      // sublabel
      ctx.font = '8px "IBM Plex Mono",monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.fillText(sl.sub, sx2 + sw3/2 + icoS*0.25, stY + sH*0.73);
      ctx.restore();
    });

    // ── BUTTONS ──────────────────────────────────────────────────────
    var btnA = ease(t-1350, 280);
    var bY   = stY + sH + 6;
    var bH   = Math.round(H * 0.078);
    var bW   = (W - pad*2 - gap) / 2;

    // СНОВА В БОЙ
    _btnR = {x:pad, y:bY, w:bW, h:bH};
    ctx.save(); ctx.globalAlpha = btnA;
    rrect(pad, bY, bW, bH, 8);
    ctx.fillStyle = _hov===0 ? 'rgba(0,255,136,0.18)' : 'rgba(0,50,18,0.7)';
    ctx.fill();
    ctx.strokeStyle = '#00cc44'; ctx.lineWidth = _hov===0 ? 2.5 : 1.5;
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = _hov===0 ? 18 : 6+4*Math.sin(t*0.004);
    ctx.stroke();
    ctx.font = 'bold '+Math.round(bH*0.30)+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 6;
    ctx.fillText('🗡  СНОВА В БОЙ', pad+bW/2, bY+bH/2);
    ctx.restore();

    // В МЕНЮ
    _btnM = {x:pad+bW+gap, y:bY, w:bW, h:bH};
    ctx.save(); ctx.globalAlpha = btnA;
    rrect(pad+bW+gap, bY, bW, bH, 8);
    ctx.fillStyle = _hov===1 ? 'rgba(255,255,255,0.07)' : 'rgba(25,25,25,0.6)';
    ctx.fill();
    ctx.strokeStyle = _hov===1 ? 'rgba(255,255,255,0.4)' : 'rgba(110,110,110,0.4)';
    ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.font = 'bold '+Math.round(bH*0.30)+'px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(180,180,180,0.55)'; ctx.shadowBlur = 0;
    ctx.fillText('🏠  В МЕНЮ', pad+bW+gap+bW/2, bY+bH/2);
    ctx.restore();

    // footer
    ctx.save(); ctx.globalAlpha = btnA*0.22;
    ctx.font = '8px "IBM Plex Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff88'; ctx.shadowBlur = 0;
    ctx.fillText('·  —  // KEEP FIGHTING //  —  ·', W/2, bY+bH+12);
    ctx.restore();

    _raf = requestAnimationFrame(draw);
  }

  function startScreen() {
    if (_running) return; _running = true;
    _startT = null;
    _raf = requestAnimationFrame(draw);
  }
}

// Патч: чистим HTML-экран победы при старте нового боя или выходе в меню
(function(){
  var _origStart = window._pvpStartBoss;
  window._pvpStartBoss = function(){
    if(window._pvpWinCleanup){ window._pvpWinCleanup(); window._pvpWinCleanup=null; }
    if(_origStart) _origStart.apply(this, arguments);
  };
  var _origMenu = window._pvpGoMenu;
  window._pvpGoMenu = function(){
    if(window._pvpWinCleanup){ window._pvpWinCleanup(); window._pvpWinCleanup=null; }
    if(_origMenu) _origMenu.apply(this, arguments);
  };
})();

