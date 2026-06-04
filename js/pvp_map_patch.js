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
  var inner = document.getElementById('pvpBattleInner');
  if(!inner) return;

  // ── Build overlay HTML ────────────────────────────────────────────
  var ol = document.createElement('div');
  ol.id = '_pvpRewardOverlay';
  ol.className = '_rwd_overlay active';
  ol.style.cssText = 'background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;';

  ol.innerHTML = [
    // Scanline effect
    '<div class="_rwd_scanline_bar"></div>',
    // Radial glow BG
    '<div id="_rwd_bg" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(0,80,30,0.0),#000);transition:background 1.2s;pointer-events:none;"></div>',
    // Gift explosion canvas
    '<canvas id="_rwd_canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>',
    // ── Content stack ─────────────────────────────────────────────────
    '<div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:18px;padding:0 20px;width:100%;">',
      // GRINCH token animation
      '<div id="_rwd_grinch" style="opacity:0;font-family:\'IBM Plex Mono\',monospace;font-size:13px;font-weight:700;letter-spacing:3px;color:#00ff88;text-shadow:0 0 18px rgba(0,255,136,0.9);margin-bottom:-6px;">',
        '<span id="_rwd_grinch_txt" style="display:inline-block;">+GRINCH</span>',
      '</div>',
      // Trophy + ПОБЕДА
      '<div id="_rwd_trophy" style="font-size:72px;line-height:1;transform:scale(0);filter:drop-shadow(0 0 20px rgba(0,255,136,0.6));">🏆</div>',
      '<div id="_rwd_title" style="font-family:\'IBM Plex Mono\',monospace;font-size:28px;font-weight:900;letter-spacing:5px;color:#00ff88;text-shadow:0 0 28px rgba(0,255,136,0.9),0 0 60px rgba(0,255,136,0.4);opacity:0;transform:scale(0.6);">ПОБЕДА!</div>',
      // Time
      '<div id="_rwd_time" style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:2px;opacity:0;">⏱ '+time+' СЕК</div>',
      // Reward chips
      '<div id="_rwd_chips" style="display:flex;gap:12px;margin-top:4px;">',
        '<div id="_rwd_chip0" style="opacity:0;transform:translateY(30px) scale(0.6);font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:700;color:#00ff88;background:rgba(0,255,136,0.06);border:1.5px solid rgba(0,255,136,0.25);border-radius:8px;padding:12px 18px;text-align:center;min-width:90px;">',
          '<div style="font-size:22px;margin-bottom:4px;">🎁</div>',
          '<div>+'+reward.gifts+'</div>',
        '</div>',
        '<div id="_rwd_chip1" style="opacity:0;transform:translateY(30px) scale(0.6);font-family:\'IBM Plex Mono\',monospace;font-size:15px;font-weight:700;color:#ffd700;background:rgba(255,215,0,0.06);border:1.5px solid rgba(255,215,0,0.25);border-radius:8px;padding:12px 18px;text-align:center;min-width:90px;">',
          '<div style="font-size:22px;margin-bottom:4px;">🟢</div>',
          '<div>+'+reward.grinch+' GRINCH</div>',
        '</div>',
      '</div>',
      // CTA buttons (appear last)
      '<div id="_rwd_btns" style="opacity:0;display:flex;gap:8px;width:100%;max-width:320px;margin-top:8px;">',
        '<button class="pvp-btn" onclick="_pvpStartBoss()" style="flex:1;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;font-weight:900;animation:_rwd_btn_pulse 2s infinite;">🔄 СНОВА</button>',
        '<button class="pvp-btn" onclick="_pvpGoMenu()" style="flex:1;background:transparent;color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);">🏠 МЕНЮ</button>',
      '</div>',
    '</div>',
  ].join('');

  inner.appendChild(ol);

  // ── Setup canvas for gift explosion ──────────────────────────────
  var rwdCanvas = document.getElementById('_rwd_canvas');
  if(rwdCanvas){
    rwdCanvas.width = inner.offsetWidth || window.innerWidth;
    rwdCanvas.height = inner.offsetHeight || window.innerHeight;
  }

  // ── Animate sequence with timed steps ────────────────────────────
  var _giftEmojis = ['🎁','🎀','🎊','⭐','🌟','✨','💫','🎁','🎁'];
  var _gifts = [];
  var _giftRAF = null;

  function _spawnGiftBurst(cx, cy, count) {
    for(var i=0;i<count;i++){
      var angle = (Math.PI*2/count)*i + Math.random()*0.4;
      var speed = 5 + Math.random()*8;
      _gifts.push({
        x:cx, y:cy,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed - 4,
        emoji:_giftEmojis[Math.floor(Math.random()*_giftEmojis.length)],
        life:1.0, decay:0.012+Math.random()*0.008,
        size:18+Math.floor(Math.random()*16),
        rot:Math.random()*Math.PI*2,
        rotV:(Math.random()-0.5)*0.18,
        gravity:0.28
      });
    }
  }

  function _tickGifts() {
    if(!rwdCanvas) return;
    var ctx2 = rwdCanvas.getContext('2d');
    ctx2.clearRect(0,0,rwdCanvas.width,rwdCanvas.height);
    _gifts = _gifts.filter(function(g){
      g.x += g.vx; g.y += g.vy; g.vy += g.gravity;
      g.vx *= 0.98; g.rot += g.rotV; g.life -= g.decay;
      if(g.life <= 0) return false;
      ctx2.save();
      ctx2.globalAlpha = Math.min(1, g.life * 2);
      ctx2.translate(g.x, g.y);
      ctx2.rotate(g.rot);
      ctx2.font = g.size+'px serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText(g.emoji, 0, 0);
      ctx2.restore();
      return true;
    });
    if(_gifts.length > 0) _giftRAF = requestAnimationFrame(_tickGifts);
  }

  // ── Timed reveal sequence (fast arcade style) ─────────────────────
  var W2 = (rwdCanvas ? rwdCanvas.width : window.innerWidth);
  var H2 = (rwdCanvas ? rwdCanvas.height : window.innerHeight);

  // Phase 1 — 0ms: flash + gift burst
  var _bg = document.getElementById('_rwd_bg');
  if(_bg) _bg.style.background = 'radial-gradient(ellipse at 50% 55%,rgba(0,140,50,0.35),#000 70%)';
  ol.style.background = 'rgba(255,255,255,0.15)';
  setTimeout(function(){ ol.style.background='#000'; }, 80);
  _spawnGiftBurst(W2*0.5, H2*0.45, 32);
  _spawnGiftBurst(W2*0.15, H2*0.55, 8);
  _spawnGiftBurst(W2*0.85, H2*0.55, 8);
  _tickGifts();

  // Phase 2 — 80ms: trophy pops in
  setTimeout(function(){
    var trophy = document.getElementById('_rwd_trophy');
    if(trophy){ trophy.style.transition='transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'; trophy.style.transform='scale(1)'; }
  }, 80);

  // Phase 3 — 280ms: ПОБЕДА! + second burst
  setTimeout(function(){
    var title = document.getElementById('_rwd_title');
    if(title){ title.style.transition='all 0.35s cubic-bezier(0.34,1.56,0.64,1)'; title.style.opacity='1'; title.style.transform='scale(1)'; }
    _spawnGiftBurst(W2*0.5, H2*0.4, 16);
  }, 280);

  // Phase 4 — 450ms: +GRINCH counter drops in
  setTimeout(function(){
    var gr = document.getElementById('_rwd_grinch');
    if(gr){
      gr.style.transition='none'; gr.style.opacity='0'; gr.style.transform='translateY(-30px)';
      var _gEl = document.getElementById('_rwd_grinch_txt');
      var _target = reward.grinch, _cur = 0, _step = Math.ceil(_target/12);
      function _countUp(){ _cur=Math.min(_cur+_step,_target); if(_gEl)_gEl.textContent='+'+_cur+' GRINCH'; if(_cur<_target)setTimeout(_countUp,35); }
      _countUp();
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        gr.style.transition='all 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        gr.style.opacity='1'; gr.style.transform='translateY(0)';
      }); });
    }
  }, 450);

  // Phase 5 — 550ms: time + both chips at once
  setTimeout(function(){
    var t2=document.getElementById('_rwd_time');
    if(t2){t2.style.transition='opacity 0.3s';t2.style.opacity='1';}
    var c0=document.getElementById('_rwd_chip0');
    if(c0){c0.style.transition='all 0.38s cubic-bezier(0.34,1.56,0.64,1)';c0.style.opacity='1';c0.style.transform='translateY(0) scale(1)';}
  }, 550);
  setTimeout(function(){
    var c1=document.getElementById('_rwd_chip1');
    if(c1){c1.style.transition='all 0.38s cubic-bezier(0.34,1.56,0.64,1)';c1.style.opacity='1';c1.style.transform='translateY(0) scale(1)';}
    _spawnGiftBurst(W2*0.5, H2*0.6, 14);
  }, 680);

  // Phase 6 — 900ms: buttons + final burst
  setTimeout(function(){
    var btns=document.getElementById('_rwd_btns');
    if(btns){btns.style.transition='opacity 0.35s';btns.style.opacity='1';}
    _spawnGiftBurst(W2*0.5, H2*0.5, 18);
  }, 900);

  // Float on trophy only (not chips — too distracting)
  setTimeout(function(){
    var t=document.getElementById('_rwd_trophy');
    if(t) t.style.animation='_rwd_float 2s ease-in-out infinite';
  }, 1300);
}

