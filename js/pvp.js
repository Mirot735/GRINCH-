// ═══════════════════════════════════════════════════════════════
// GRINCH GAME — pvp.js v4.1
// boss_troll.png      → 612×408, 4cols×2rows, кадр 153×204
// boss_troll_idle.png → 1774×887, 4cols×1row, кадр 443×887
// ═══════════════════════════════════════════════════════════════
'use strict';

var PVP_W = 0, PVP_H = 0, PVP_FLOOR = 0;
var PVP_RUNNING = false;
var PVP_RAF = null;

// ── TILES — assets/tiles/ ─────────────────────────────────────────
var _TILES = {};
(function(){
  var _tileNames = [
    'stone_1','stone_2','stone_3','stone_4','stone_5','stone_6',
    'stone_7','stone_8','stone_9','stone_10','stone_11','stone_12',
    'stone_13','stone_14','stone_15',
    'moss_1','moss_2','moss_3','moss_4','moss_5','moss_6',
    'moss_7','moss_8','moss_9','moss_10','moss_11','moss_12',
    'moss_13','moss_14','moss_15',
    'rune_1','rune_2','rune_3',
    'chain_1','chain_2','chain_hook',
    'spikes','chest','shroom_1','shroom_2','shroom_3',
    'coal_pile','coal_pile2','orb_green',
    'pyramid','floor_panel',
  ];
  _tileNames.forEach(function(name){
    var img=new Image();
    img.onload=function(){_TILES[name]=img;};
    img.onerror=function(){console.warn('Tile missing: '+name+'.png');};
    img.src='assets/tiles/'+name+'.png';
  });
})();


// ── SLASH EFFECTS — U0U.png 677×369, 4 rows × 8 cols, кадр 84×92 ─
// Ряд 0: дуга-взмах (sword)   — кадры 0-7
// Ряд 1: укол/вспышка (sword) — кадры 8-15
// Ряд 2: кольцо-спин (scythe) — кадры 16-23
// Ряд 3: взрыв/портал (crit)  — кадры 24-31
var SLASH_SPRITE = {
  img: null, loaded: false, src: 'assets/img/U0U.png',
  fw: 84, fh: 92, cols: 8,
};
(function(){
  var _si = new Image();
  _si.onload = function(){ SLASH_SPRITE.img = _si; SLASH_SPRITE.loaded = true; };
  _si.onerror = function(){ console.warn('U0U.png missing'); };
  _si.src = SLASH_SPRITE.src;
})();

// Активные slash-эффекты на сцене
var _slashFX = [];

// Таблица: какой ряд/кадры для каждого оружия
var SLASH_ANIMS = {
  sword:  { row: 0, frames: [0,1,2,3],    fps: 18 },  // дуга, 4 кадра
  scythe: { row: 2, frames: [0,1,2,3,4],  fps: 14 },  // кольцо, 5 кадров
  bow:    { row: 1, frames: [4,5,6],       fps: 20 },  // вспышка, 3 кадра
  crit:   { row: 3, frames: [0,1,2,3],    fps: 16 },  // взрыв, 4 кадра
};

function _spawnSlashFX(x, y, dir, weapon, isCrit) {
  if (!SLASH_SPRITE.loaded) return;
  var animKey = isCrit ? 'crit' : (weapon || 'sword');
  var anim = SLASH_ANIMS[animKey] || SLASH_ANIMS.sword;
  _slashFX.push({
    x: x, y: y,
    dir: dir || 1,        // 1 = вправо, -1 = влево
    row: anim.row,
    frames: anim.frames,
    fps: anim.fps,
    frameIdx: 0,
    timer: 0,
    done: false,
  });
}

function _tickSlashFX(dt, ctx) {
  if (!SLASH_SPRITE.loaded || !SLASH_SPRITE.img) return;
  _slashFX = _slashFX.filter(function(fx) {
    fx.timer += dt;
    var fd = 1000 / fx.fps;
    if (fx.timer >= fd) {
      fx.timer -= fd;
      fx.frameIdx++;
      if (fx.frameIdx >= fx.frames.length) { fx.done = true; return false; }
    }
    var fi   = fx.frames[fx.frameIdx];
    var sx   = fi * SLASH_SPRITE.fw;
    var sy   = fx.row * SLASH_SPRITE.fh;
    var dw   = SLASH_SPRITE.fw * 2.2;   // масштаб ×2.2 — хорошо читается
    var dh   = SLASH_SPRITE.fh * 2.2;
    var prog = fx.frameIdx / Math.max(1, fx.frames.length - 1);
    var alpha = 1 - prog * 0.6;         // плавный fade к концу

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(fx.x), Math.round(fx.y - dh * 0.7));
    if (fx.dir < 0) ctx.scale(-1, 1);  // зеркало относительно точки эффекта
    ctx.drawImage(
      SLASH_SPRITE.img,
      sx, sy, SLASH_SPRITE.fw, SLASH_SPRITE.fh,
      Math.round(-dw / 2), 0,
      Math.round(dw), Math.round(dh)
    );
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  });
}

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

  ctx.save();
  if(_pvp.boss&&_pvp.boss.facingRight){ctx.translate(x*2,0);ctx.scale(-1,1);}
  ctx.globalAlpha=alpha;
  // Тень на полу под боссом
  ctx.save();
  ctx.globalAlpha=alpha*0.5;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.beginPath();ctx.ellipse(x,y,Math.round(dw*0.38),6,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
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
    ctx.drawImage(_deathImg, 0, 0, _dw2, _dh2, Math.round(x-_ddw/2), Math.round(y-BOSS_H), _ddw, BOSS_H);
  } else if (_atkImg) {
    var _aw=_atkImg.naturalWidth, _ah=_atkImg.naturalHeight;
    var _asc=BOSS_H/_ah, _adw=Math.round(_aw*_asc);
    ctx.drawImage(_atkImg, 0, 0, _aw, _ah, Math.round(x-_adw/2), Math.round(y-BOSS_H), _adw, BOSS_H);
  } else if (_flameIdx >= 0 && BOSS_FLAMES[_flameIdx]) {
    var _fi = BOSS_FLAMES[_flameIdx];
    ctx.drawImage(_fi, 0, 0, _fi.naturalWidth, _fi.naturalHeight, Math.round(x-dw/2), Math.round(y-dh), dw, dh);
  } else {
    ctx.drawImage(SP.img, sx, sy, SP.fw, SP.fh, Math.round(x-dw/2), Math.round(y-dh), dw, dh);
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

// ── ОРУЖИЯ ───────────────────────────────────────────────────────
var PVP_WEAPONS={
  sword:{name:'Меч',emoji:'⚔️',dmg:[18,28],range:85,type:'melee',color:'#c0c0c0',cooldown:800,desc:'Быстрый ближний'},
  bow:  {name:'Лук',emoji:'🏹',dmg:[12,20],range:400,type:'ranged',color:'#f5c518',cooldown:1200,desc:'Дальний урон'},
  scythe:{name:'Коса',emoji:'💀',dmg:[30,45],range:105,type:'melee',color:'#a855f7',cooldown:1600,desc:'Мощный медленный'},
};

var PVP_BOSSES=[{
  id:'troll',name:'ТРОЛЛЬ',emoji:'👹',hp:320,atk:[8,16],speed:1.1,color:'#6b8c3a',
  reward:{gifts:500,grinch:30},atkRange:88,atkCooldown:1800,
  phases:[
    {threshold:1.0,name:'ОХОТА',  color:'#6b8c3a',speed:1.1,atkCooldown:1800,mode:'melee'},
    {threshold:0.7,name:'ЯРОСТЬ', color:'#cc4400',speed:0.6,atkCooldown:1400,mode:'ranged'},
    {threshold:0.4,name:'БЕРСЕРК',color:'#ff0000',speed:1.8,atkCooldown:1000,mode:'berserk'},
  ],
}];

var _pvp={
  boss:null,player:null,projectiles:[],waves:[],particles:[],
  weapon:'sword',lastAtk:0,lastBossAtk:0,lastWave:0,
  canvas:null,ctx:null,over:false,won:false,startTime:0,
  phase:0,phaseShown:-1,blocking:false,lastFrame:0,screenShake:0,
};

// ── ОТКРЫТЬ ───────────────────────────────────────────────────────
function _pvpOpenBossLobby(){
  _bossLoadSprite();_pvpInjectStyles();
  // Пропускаем лобби — сразу в бой
  _pvpStartBoss();
}
function openPVP(){_bossLoadSprite();_pvpInjectStyles();show('pvp');}

function _pvpInjectStyles(){
  if(document.getElementById('_pvpStyle'))return;
  var st=document.createElement('style');st.id='_pvpStyle';
  st.textContent=[
    '#s-pvp{background:#000!important;font-family:"IBM Plex Mono",monospace!important;}',
    '#s-pvp-battle{background:#000!important;}',

    '#pvpCanvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;}',
    '.pvp-btn{font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:700;letter-spacing:2px;border:none;border-radius:4px;cursor:pointer;padding:12px 20px;-webkit-tap-highlight-color:transparent;}',
    '.pvp-wpn-btn{font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:700;border-radius:6px;cursor:pointer;padding:8px 6px;border:1px solid rgba(0,255,136,0.35);background:rgba(0,10,6,0.72);color:rgba(0,255,136,0.6);flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;-webkit-tap-highlight-color:transparent;transition:all .15s;backdrop-filter:blur(4px);}',
    '.pvp-wpn-btn.active{border-color:#00ff88;background:rgba(0,255,136,0.12);color:#00ff88;box-shadow:0 0 10px rgba(0,255,136,0.45),inset 0 0 8px rgba(0,255,136,0.08);}',
    '.pvp-ctrl-btn{display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.3);border-radius:6px;font-size:20px;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;}',

    /* ── keyframes ── */
    '@keyframes pvpPhase{0%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1)}}',
    '@keyframes pvpNeonPulse{0%,100%{box-shadow:0 0 6px rgba(0,255,136,0.5),0 0 14px rgba(0,255,136,0.2),inset 0 0 6px rgba(0,255,136,0.06)}50%{box-shadow:0 0 10px rgba(0,255,136,0.8),0 0 22px rgba(0,255,136,0.35),inset 0 0 10px rgba(0,255,136,0.12)}}',
    '@keyframes pvpBlockPulse{0%,100%{border-color:rgba(60,160,255,0.5);box-shadow:0 0 8px rgba(60,160,255,0.4),inset 0 0 6px rgba(60,160,255,0.08)}50%{border-color:rgba(120,200,255,0.9);box-shadow:0 0 16px rgba(60,160,255,0.7),0 0 30px rgba(60,160,255,0.25),inset 0 0 12px rgba(60,160,255,0.15)}}',
    '.pvp-block-active{animation:pvpBlockPulse 0.5s infinite!important;}',

    /* ── layout (unchanged) ── */
    '#pvpControls{position:absolute;bottom:0;left:0;right:0;height:96px;pointer-events:none;z-index:20;}',
    '#pvpCtrlLeft{position:absolute;bottom:10px;left:8px;display:flex;gap:6px;pointer-events:auto;}',
    '#pvpCtrlRight{position:absolute;bottom:10px;right:8px;display:flex;flex-direction:row;align-items:flex-end;gap:6px;pointer-events:auto;}',
    '#pvpCtrlSecondary{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;pointer-events:auto;}',

    /* ── move buttons — neon green outline ── */
    '.pvp-move-btn{'+
      'width:58px;height:58px;border-radius:50%;'+
      'background:rgba(0,8,4,0.68);'+
      'border:1.5px solid rgba(0,255,136,0.45);'+
      'box-shadow:0 0 8px rgba(0,255,136,0.30),0 0 18px rgba(0,255,136,0.10),inset 0 0 8px rgba(0,255,136,0.05);'+
      'font-size:22px;color:rgba(0,255,136,0.70);'+
      'cursor:pointer;-webkit-tap-highlight-color:transparent;'+
      'display:flex;align-items:center;justify-content:center;'+
      'backdrop-filter:blur(6px);transition:box-shadow .08s,background .08s;}',
    '.pvp-move-btn:active{'+
      'background:rgba(0,255,136,0.14);'+
      'border-color:rgba(0,255,136,0.95);'+
      'box-shadow:0 0 14px rgba(0,255,136,0.75),0 0 28px rgba(0,255,136,0.30),inset 0 0 12px rgba(0,255,136,0.15);'+
      'color:#00ff88;transform:scale(0.93);}',

    /* ── attack button — bigger neon, red accent ── */
    '.pvp-atk-btn{'+
      'width:78px;height:78px;border-radius:50%;'+
      'background:rgba(6,0,2,0.72);'+
      'border:2px solid rgba(255,60,80,0.60);'+
      'box-shadow:0 0 10px rgba(255,60,80,0.35),0 0 24px rgba(255,60,80,0.12),inset 0 0 10px rgba(255,60,80,0.06);'+
      'font-size:32px;'+
      'cursor:pointer;-webkit-tap-highlight-color:transparent;'+
      'display:flex;align-items:center;justify-content:center;'+
      'backdrop-filter:blur(6px);transition:box-shadow .08s,background .08s;}',
    '.pvp-atk-btn:active{'+
      'background:rgba(255,60,80,0.18);'+
      'border-color:rgba(255,80,100,0.98);'+
      'box-shadow:0 0 18px rgba(255,60,80,0.80),0 0 36px rgba(255,60,80,0.35),inset 0 0 14px rgba(255,60,80,0.18);'+
      'transform:scale(0.90);}',

    /* ── secondary (jump / block) — neon green smaller ── */
    '.pvp-sec-btn{'+
      'width:40px;height:40px;border-radius:50%;'+
      'background:rgba(0,8,4,0.65);'+
      'border:1.5px solid rgba(0,255,136,0.38);'+
      'box-shadow:0 0 6px rgba(0,255,136,0.22),inset 0 0 5px rgba(0,255,136,0.04);'+
      'font-size:16px;color:rgba(0,255,136,0.65);'+
      'cursor:pointer;-webkit-tap-highlight-color:transparent;'+
      'display:flex;align-items:center;justify-content:center;'+
      'backdrop-filter:blur(5px);transition:box-shadow .08s,background .08s;}',
    '.pvp-sec-btn:active{'+
      'background:rgba(0,255,136,0.16);'+
      'border-color:rgba(0,255,136,0.95);'+
      'box-shadow:0 0 12px rgba(0,255,136,0.65),0 0 22px rgba(0,255,136,0.22),inset 0 0 10px rgba(0,255,136,0.12);'+
      'color:#00ff88;transform:scale(0.91);}',

    /* ── weapon selector mini buttons ── */
    '.pvp-wpn-mini{'+
      'width:36px;height:36px;border-radius:50%;'+
      'background:rgba(0,8,4,0.62);'+
      'border:1.5px solid rgba(0,255,136,0.28);'+
      'box-shadow:0 0 4px rgba(0,255,136,0.14);'+
      'font-size:15px;'+
      'cursor:pointer;-webkit-tap-highlight-color:transparent;'+
      'display:flex;align-items:center;justify-content:center;'+
      'transition:all .12s;opacity:0.6;backdrop-filter:blur(4px);}',
    '.pvp-wpn-mini.active{'+
      'opacity:1;'+
      'border-color:rgba(0,255,136,0.90);'+
      'background:rgba(0,255,136,0.13);'+
      'box-shadow:0 0 10px rgba(0,255,136,0.55),0 0 20px rgba(0,255,136,0.18),inset 0 0 8px rgba(0,255,136,0.10);'+
      'animation:pvpNeonPulse 2s ease-in-out infinite;}',
  ].join('');
  document.head.appendChild(st);
}

function _pvpShowLobby(){return;}
function _pvpPickWeapon(key){
  _pvp.weapon=key;
  document.querySelectorAll('.pvp-wpn-btn').forEach(function(b){b.classList.toggle('active',b.id==='wpnBtn_'+key);});
}

// ── СТАРТ ─────────────────────────────────────────────────────────
function _pvpBuildWeaponBtns(){
  // called at build time - returns empty string, fills #pvpWpnRow after render
  setTimeout(function(){
    var row = document.getElementById('pvpWpnRow');
    if(!row) return;
    var html = '';
    Object.keys(PVP_WEAPONS).forEach(function(k){
      var w = PVP_WEAPONS[k];
      var active = _pvp.weapon===k ? 'border-color:#00ff88;background:rgba(0,255,136,0.15);color:#00ff88;' : '';
      html += '<button id="wpnBtn_'+k+'" onclick="_pvpSwitchWeapon(\'' +k+ '\')" style="width:46px;height:52px;border-radius:10px;padding:4px 2px;border:1px solid rgba(0,255,136,0.2);background:rgba(0,255,136,0.05);color:rgba(0,255,136,0.5);cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;align-items:center;gap:2px;'+active+'"><div style="font-size:16px;">'+w.emoji+'</div><div style="font-size:8px;">'+w.name+'</div></button>';
    });
    html += '<button id="pvpBlockBtn" onpointerdown="_pvpBlockStart()" onpointerup="_pvpBlockEnd()" onpointercancel="_pvpBlockEnd()" style="width:46px;height:52px;background:rgba(0,100,200,0.15);border:1px solid rgba(0,150,255,0.3);border-radius:10px;font-size:18px;color:#4af;cursor:pointer;-webkit-tap-highlight-color:transparent;">&#128737;</button>';
    row.innerHTML = html;
  }, 0);
  return '';
}

function _pvpStartBoss(){
  _bossLoadSprite();

  // ── Попытка заблокировать landscape (в TG обычно не работает — это нормально) ──
  try{
    if(screen.orientation&&screen.orientation.lock){
      screen.orientation.lock('landscape').catch(function(){});
    }
  }catch(e){}

  // ── Экран-заглушка "поверни телефон" ─────────────────────────────
  _pvpShowOrientationGate(function(){ _pvpLaunchBattle(); });
  return;
}

// ── Ориентация: игра только в портрете ───────────────────────────
function _pvpShowOrientationGate(onReady) {
  // Убираем старый оверлей если есть
  var _old=document.getElementById('pvpOrientGate');
  if(_old)_old.parentNode.removeChild(_old);

  // Уже портрет — сразу запускаем
  if(window.innerHeight >= window.innerWidth){
    onReady();
    return;
  }

  // Landscape — показываем оверлей "поверни обратно"
  if(!document.getElementById('_pvpGateStyle')){
    var _gs=document.createElement('style');
    _gs.id='_pvpGateStyle';
    _gs.textContent=
      '@keyframes pvpPhoneRock{0%{transform:rotate(90deg)}40%{transform:rotate(80deg)}60%{transform:rotate(80deg)}100%{transform:rotate(90deg)}}'
      +'@keyframes pvpGateFadeIn{from{opacity:0}to{opacity:1}}'
      +'#pvpOrientGate{position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;animation:pvpGateFadeIn .3s ease;}'
      +'#pvpOrientGate .og-icon{font-size:72px;margin-bottom:24px;animation:pvpPhoneRock 1.5s ease-in-out infinite;display:inline-block;}'
      +'#pvpOrientGate .og-title{font-family:-apple-system,sans-serif;font-size:20px;font-weight:800;color:#fff;text-align:center;line-height:1.4;padding:0 32px;}';
    document.head.appendChild(_gs);
  }

  var _gate=document.createElement('div');
  _gate.id='pvpOrientGate';
  _gate.innerHTML='<div class="og-icon">📱</div><div class="og-title">Поверни телефон<br>вертикально</div>';
  document.body.appendChild(_gate);

  // Авто-скрыть когда вернули портрет
  var _mql=window.matchMedia('(orientation:portrait)');
  function _onOrient(e){
    if(e.matches){
      try{_mql.removeEventListener('change',_onOrient);}catch(e2){}
      var g=document.getElementById('pvpOrientGate');
      if(g)g.parentNode.removeChild(g);
      onReady();
    }
  }
  try{_mql.addEventListener('change',_onOrient);}catch(e){}
}

// ── Реальный запуск боя (после gate) ─────────────────────────────
function _pvpLaunchBattle() {
  var bd=JSON.parse(JSON.stringify(PVP_BOSSES[0]));

  show('pvp-battle');
  var inner=document.getElementById('pvpBattleInner');
  if(!inner)return;

  // ── РАЗМЕР ───────────────────────────────────────────────────────
  // После gate телефон уже landscape — берём реальные размеры окна
  PVP_W=window.innerWidth;
  PVP_H=window.innerHeight;
  _pvp.boss={x:PVP_W*0.80,y:0,hp:bd.hp,maxHp:bd.hp,w:80,h:110,data:bd,
    state:'idle',knockX:0,facingRight:false,phase:0,windupTimer:0,windupActive:false};
  _pvp.player={x:PVP_W*0.15,y:0,hp:100,maxHp:100,w:36,h:56,vx:0,vy:0,
    onGround:true,dir:1,state:'idle'};
  _pvp.projectiles=[];_pvp.waves=[];_pvp.particles=[];
  _pvp.lastAtk=0;_pvp.lastBossAtk=0;_pvp.lastWave=0;
  _pvp.over=false;_pvp.won=false;_pvp.startTime=Date.now();
  _pvp.phase=0;_pvp.phaseShown=-1;_pvp.blocking=false;
  _pvp.lastFrame=Date.now();_pvp.screenShake=0;
  _pvp.bossHitFlash=0;_pvp.playerHitFlash=0;_pvp.impactRings=[];_pvp.screenRedFlash=0;
  _dmgNums=[];_pvpMoveDir=0;_pvp.camX=0;_slashFX=[];
  _bossAnim.cur='walk';_bossAnim.frameIdx=0;_bossAnim.timer=0;_bossAnim.onDone=null;_bossAnim.locked=false;
  _bossPlayAnim('walk');

  // ── HUD + КОНТРОЛЫ КАК НА МАКЕТЕ ───────────────────────────────
  var _hudH=52, _ctrlH=0;  // контролы теперь overlay, не занимают высоту

  inner.innerHTML = (
    // ── HUD ──────────────────────────────────────────────────────────
    '<div id="pvpHUD" style="display:flex;align-items:center;gap:8px;padding:6px 12px;flex-shrink:0;background:rgba(0,0,0,0.92);border-bottom:1px solid rgba(0,255,136,0.12);height:'+_hudH+'px;box-sizing:border-box;">'
    +'<div style="width:40px;height:40px;flex-shrink:0;border:2px solid #00ff88;border-radius:6px;background:#0d1f0c;display:flex;align-items:center;justify-content:center;overflow:hidden;"><svg width="30" height="30" viewBox="0 0 16 16" style="image-rendering:pixelated;"><rect x="5" y="1" width="6" height="6" fill="#3d8b37"/><rect x="4" y="2" width="2" height="3" fill="#2a5c26"/><rect x="5" y="7" width="6" height="5" fill="#2a5c26"/><rect x="4" y="9" width="2" height="3" fill="#3d8b37"/><rect x="10" y="9" width="2" height="3" fill="#3d8b37"/><rect x="5" y="12" width="2" height="4" fill="#1e4a1a"/><rect x="9" y="12" width="2" height="4" fill="#1e4a1a"/><rect x="5" y="3" width="2" height="2" fill="#ffdd00"/><rect x="9" y="3" width="2" height="2" fill="#ffdd00"/></svg></div>'
    +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;"><span style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#00ff88;font-weight:700;">YOU</span><span style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(0,255,136,0.45);">LV.1</span><div id="pvpBlockIcon" style="font-size:9px;opacity:0;">🛡</div></div>'
      +'<div style="height:9px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:2px;"><div id="pvpPlayerHP" style="height:100%;background:linear-gradient(90deg,#00ff88,#00cc6a);width:100%;transition:width .2s;border-radius:3px;"></div></div>'
      +'<div id="pvpPlayerHPTxt" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(0,255,136,0.7);">100/100</div>'
    +'</div>'
    +'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:13px;color:rgba(255,255,255,0.25);flex-shrink:0;padding:0 6px;">VS</div>'
    +'<div style="flex:1;min-width:0;text-align:right;">'
      +'<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:2px;"><span id="pvpBossNameHUD" style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;color:#e74c3c;font-weight:700;">ТРОЛЛЬ</span></div>'
      +'<div style="height:9px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:2px;"><div id="pvpBossHP" style="height:100%;background:linear-gradient(90deg,#e74c3c,#c0392b);width:100%;transition:width .2s;border-radius:3px;"></div></div>'
      +'<div id="pvpBossHPTxt" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(231,76,60,0.7);">'+bd.hp+'/'+bd.hp+'</div>'
    +'</div>'
    +'<div style="width:40px;height:40px;flex-shrink:0;border:2px solid #e74c3c;border-radius:6px;background:#1a0a00;display:flex;align-items:center;justify-content:center;font-size:24px;">👹</div>'
    +'</div>'
    // Phase banner
    +'<div id="pvpPhaseBanner" style="position:absolute;top:56px;left:0;right:0;text-align:center;pointer-events:none;z-index:10;display:none;"><div id="pvpPhaseTxt" style="display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:18px;font-weight:700;letter-spacing:4px;color:#ff4400;text-shadow:0 0 20px rgba(255,68,0,0.8);background:rgba(0,0,0,0.8);border:1px solid rgba(255,68,0,0.4);border-radius:4px;padding:6px 16px;">PHASE 2</div></div>'
    // Canvas (absolute, fills container)
    +'<canvas id="pvpCanvas" style="position:absolute;top:0;left:0;width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;"></canvas>'
    // Overlay controls
    +'<div id="pvpControls">'
      // Левый кластер — движение
      +'<div id="pvpCtrlLeft">'
        +'<button class="pvp-move-btn" onpointerdown="_pvpMove(-1)" onpointerup="_pvpStopMove()" onpointercancel="_pvpStopMove()">&#9664;</button>'
        +'<button class="pvp-move-btn" onpointerdown="_pvpMove(1)" onpointerup="_pvpStopMove()" onpointercancel="_pvpStopMove()">&#9654;</button>'
      +'</div>'
      // Центр — оружия (мини)
      +'<div id="pvpWpnRow" style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:auto;"></div>'
      // Правый кластер — secondary + атака
      +'<div id="pvpCtrlRight">'
        +'<div style="display:flex;flex-direction:column;gap:6px;align-items:center;">'
          +'<button id="pvpBlockBtn" class="pvp-sec-btn" onpointerdown="_pvpBlockStart()" onpointerup="_pvpBlockEnd()" onpointercancel="_pvpBlockEnd()">&#128737;</button>'
          +'<button class="pvp-sec-btn" onpointerdown="_pvpJump()">&#11014;</button>'
        +'</div>'
        +'<button class="pvp-atk-btn" onpointerdown="_pvpAttack()">&#9876;</button>'
      +'</div>'
    +'</div>'
  );

  // Заполняем кнопки оружий (мини, круглые)
  setTimeout(function(){
    var row = document.getElementById('pvpWpnRow');
    if(!row) return;
    var html = '';
    Object.keys(PVP_WEAPONS).forEach(function(k){
      var w = PVP_WEAPONS[k];
      var active = _pvp.weapon===k ? ' active' : '';
      html += '<button id="wpnBtn_'+k+'" class="pvp-wpn-mini'+active+'" onclick="_pvpSwitchWeapon(\''+k+'\')">'+w.emoji+'</button>';
    });
    // Блок теперь в правом кластере — из wpnRow убираем
    row.innerHTML = html;
  }, 0);

  // ── Запуск: растягиваем экран и canvas на всю высоту окна ─────────
  var _battleScreen = document.getElementById('s-pvp-battle');
  if (_battleScreen) {
    _battleScreen.style.display        = 'flex';
    _battleScreen.style.flexDirection  = 'column';
    _battleScreen.style.width          = '100%';
    _battleScreen.style.height         = '100%';
    _battleScreen.style.overflow       = 'hidden';
    _battleScreen.style.background     = '#000';
  }
  inner.style.display       = 'flex';
  inner.style.flexDirection = 'column';
  inner.style.width         = '100%';
  inner.style.height        = '100%';
  inner.style.flex          = '1';
  inner.style.overflow      = 'hidden';
  inner.style.position      = 'relative';

  // Ждём 2 rAF — DOM рендерится, потом замеряем
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      var canvas = document.getElementById('pvpCanvas');
      var hud    = document.getElementById('pvpHUD');
      var ctrl   = document.getElementById('pvpControls');
      if (!canvas) return;

      // Ширина — всегда берём window.innerWidth (самый надёжный в TG/браузере)
      var vvW = window.innerWidth;
      // Высота контейнера
      var vvH = inner.offsetHeight > 50 ? inner.offsetHeight
               : (document.documentElement.clientHeight || window.innerHeight);

      var _hudH  = hud  ? hud.offsetHeight  : 44;
      var _canvasH = Math.max(vvH - _hudH, 120);  // контролы — overlay, не отнимают высоту

      // Растягиваем canvas на полную ширину экрана
      canvas.style.display = 'block';
      canvas.style.position = 'relative';
      canvas.style.left = '0';
      canvas.width         = vvW;
      canvas.height        = _canvasH;
      canvas.style.width   = vvW + 'px';
      canvas.style.height  = _canvasH + 'px';

      PVP_W   = vvW;
      PVP_H   = _canvasH;
      // В портрете делаем пол ниже (0.78) чтобы был виден край арены
      var _isPortrait = _canvasH > vvW;
      PVP_FLOOR = Math.round(_canvasH * (_isPortrait ? 0.78 : 0.72));

      _pvp.boss.x   = PVP_W * 0.78;
      _pvp.player.x = PVP_W * 0.18;
      _pvp.player.y = PVP_FLOOR;
      _pvp.boss.y   = PVP_FLOOR;

      _pvp.canvas = canvas;
      _pvp.ctx    = canvas.getContext('2d');
      PVP_RUNNING = true;
      _pvp.lastFrame = Date.now();
      _pvpLoop();
    });
  });
}

// ── УПРАВЛЕНИЕ ────────────────────────────────────────────────────
var _pvpMoveDir=0,_pvpMoveInterval=null;
function _pvpMove(dir){if(_pvp.blocking)return;_pvpMoveDir=dir;if(_pvp.player)_pvp.player.dir=dir;}
function _pvpStopMove(){_pvpMoveDir=0;if(_pvpMoveInterval){clearInterval(_pvpMoveInterval);_pvpMoveInterval=null;}if(_pvp.player)_pvp.player.state='idle';}
function _pvpSwitchWeapon(key){_pvp.weapon=key;document.querySelectorAll('.pvp-wpn-mini').forEach(function(b){b.classList.toggle('active',b.id==='wpnBtn_'+key);});}
function _pvpBlockStart(){if(_pvp.over)return;_pvpStopMove();_pvp.blocking=true;var b=document.getElementById('pvpBlockBtn');if(b)b.classList.add('pvp-block-active');var i=document.getElementById('pvpBlockIcon');if(i)i.style.opacity='1';}
function _pvpBlockEnd(){_pvp.blocking=false;var b=document.getElementById('pvpBlockBtn');if(b)b.classList.remove('pvp-block-active');var i=document.getElementById('pvpBlockIcon');if(i)i.style.opacity='0';}
function _pvpJump(){if(_pvp.over||!_pvp.player||!_pvp.player.onGround)return;_pvp.player.vy=-12;_pvp.player.onGround=false;}

function _pvpAttack(){
  if(_pvp.over||_pvp.blocking)return;
  var now=Date.now(),wpn=PVP_WEAPONS[_pvp.weapon];
  if(now-_pvp.lastAtk<wpn.cooldown)return;
  _pvp.lastAtk=now;
  var px=_pvp.player.x,bx=_pvp.boss.x,dist=Math.abs(bx-px);
  if(wpn.type==='ranged'){
    _pvp.projectiles.push({x:px+(_pvp.player.dir>0?20:-20),y:_pvp.player.y-30,
      vx:px<bx?7:-7,vy:0,owner:'player',wpn:_pvp.weapon,color:wpn.color,r:5});
  } else {
    // Точка кончика оружия (совпадает с _pvpDrawPlayer координатами)
    var _slashX, _slashY;
    if(_pvp.weapon==='sword'){
      // Меч: x+14..17, tip y-38  (в системе координат с учётом dir)
      _slashX = _pvp.player.x + _pvp.player.dir * 26;
      _slashY = _pvp.player.y - 36;
    } else if(_pvp.weapon==='scythe'){
      // Коса: x+22, y-44 верхушка дуги
      _slashX = _pvp.player.x + _pvp.player.dir * 32;
      _slashY = _pvp.player.y - 44;
    } else {
      // Лук: x+16, y-24 середина лука
      _slashX = _pvp.player.x + _pvp.player.dir * 28;
      _slashY = _pvp.player.y - 28;
    }
    if(dist<wpn.range){
      var dmg=_rnd(wpn.dmg[0],wpn.dmg[1]);
      var isCrit = dmg >= wpn.dmg[1] - 2;
      _pvpDamageBoss(dmg,true);
      _pvpSpawnParticles(bx,_pvp.boss.y-40,wpn.color,10);
      _bossPlayAnim('hurt',function(){_bossPlayAnim('walk');});
      _spawnSlashFX(_slashX, _slashY, _pvp.player.dir, _pvp.weapon, isCrit);
    } else {
      _spawnSlashFX(_slashX, _slashY, _pvp.player.dir, _pvp.weapon, false);
      _pvpShowHint('Подойди ближе!');
    }
  }
}

// ── AI ────────────────────────────────────────────────────────────
function _pvpBossAI(now,dt){
  if(_pvp.over)return;
  if(_pvp.boss.hp<=0)return;
  if(_bossAnim.locked)return; // идёт атака — не прерываем
  var boss=_pvp.boss;
  var phase=_pvp.boss.data.phases[_pvp.boss.phase]||_pvp.boss.data.phases[0];
  var px=_pvp.player.x;
  var bx=boss.x;
  var dx=px-bx;
  var dist=Math.abs(dx);
  var atkRange=_pvp.boss.data.atkRange; // 88px

  // Инит таймера атаки
  if(!boss._atkTimer) boss._atkTimer=0;
  boss._atkTimer-=dt;

  // БЛИЗКО — атака
  if(dist<atkRange){
    boss.facingRight=dx>0;
    _bossPlayAnim('walk');
    if(boss._atkTimer<=0){
      boss._atkTimer=_pvp.boss.data.atkCooldown;
      _pvpBossMeleeAttack(phase);
    }
    return;
  }

  // ДАЛЕКО — идём к игроку
  var speed = dist > 200 ? 1.2 : 0.5;
  boss.x += dx>0 ? speed : -speed;
  boss.facingRight = dx>0;
  _bossPlayAnim('walk');
}

function _pvpBossMeleeAttack(phase){
  _bossPlayAnim('windup',function(){
    _bossPlayAnim('attack',function(){
      if(!_pvp.over){
        var dmg=_rnd(_pvp.boss.data.atk[0],_pvp.boss.data.atk[1]);
        if(Math.abs(_pvp.player.x-_pvp.boss.x)<_pvp.boss.data.atkRange+20){
          _pvpDamagePlayer(dmg);_pvpSpawnParticles(_pvp.player.x,_pvp.player.y-20,'#e74c3c',8);
        }
      }
      _bossPlayAnim('recover',function(){_bossAnim.locked=false;_bossPlayAnim('walk');});
    });
  });
}

function _pvpBossThrowRock(phase){
  var dx=_pvp.player.x-_pvp.boss.x,speed=4+Math.random()*2;
  var count=phase.mode==='berserk'?3:1;
  for(var i=0;i<count;i++){
    var sp=(i-1)*1.5;
    _pvp.projectiles.push({x:_pvp.boss.x,y:_pvp.boss.y-50,vx:(dx>0?-speed:speed)+sp*0.5,vy:-3+sp,owner:'boss',color:'#cc6600',r:7+Math.random()*3});
  }
}

function _pvpBossWave(){
  var dir=_pvp.player.x<_pvp.boss.x?-1:1;
  _pvp.waves.push({x:_pvp.boss.x,y:PVP_FLOOR-6,vx:dir*5,w:30,h:14,life:80,maxL:80,color:'#ff4400'});
  _pvp.screenShake=6;
}

function _pvpDamageBoss(dmg,kb){
  if(_pvp.boss.hp<=0)return;
  _pvp.boss.hp=Math.max(0,_pvp.boss.hp-dmg);
  _pvpShowDmgNum(dmg,_pvp.boss.x,_pvp.boss.y-60,'#00ff88');
  _pvpUpdateHUD();
  // ── Hit effects ──────────────────────────────────────────────────
  _pvp.bossHitFlash=10;
  _pvp.screenShake=Math.max(_pvp.screenShake,dmg>30?16:dmg>15?11:7);
  if(_pvp.impactRings){
    _pvp.impactRings.push({x:_pvp.boss.x,y:_pvp.boss.y-80,r:0,maxR:65,life:12,maxLife:12,color:'rgba(0,255,136,0.85)'});
    if(dmg>20) _pvp.impactRings.push({x:_pvp.boss.x,y:_pvp.boss.y-80,r:0,maxR:38,life:8,maxLife:8,color:'rgba(255,255,255,0.6)'});
  }
  _pvpSpawnParticles(_pvp.boss.x,_pvp.boss.y-80,'#00ff88',8);
  _pvpSpawnParticles(_pvp.boss.x,_pvp.boss.y-80,'#ffffff',5);
  _pvpSpawnParticles(_pvp.boss.x,_pvp.boss.y-40,'#00ff88',4);
  // ─────────────────────────────────────────────────────────────────
  if(kb){var dir=_pvp.boss.x>_pvp.player.x?1:-1;_pvp.boss.knockX=dir*60;}
  if(_pvp.boss.hp<=0){
    _bossPlayAnim('dead');
    // Отдельный RAF для анимации смерти
    setTimeout(function(){
      if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
      PVP_RUNNING=false;
      var _deadStart=Date.now();
      var _deadCtx=_pvp.ctx,_deadCanvas=_pvp.canvas;
      var _frozenCamX=Math.round(_pvp.camX); // фиксируем камеру
      function _deadLoop(){
        var _elapsed=Date.now()-_deadStart;
        var _fi=Math.min(Math.floor(_elapsed/180),5);
        var _img=BOSS_DEATH_FRAMES[_fi+1];
        if(_deadCtx&&_deadCanvas){
          var _W=_deadCanvas.width,_H=_deadCanvas.height;
          _deadCtx.clearRect(0,0,_W,_H);
          _pvpDrawCaveBG(_deadCtx,_W,_H,Date.now());
          _deadCtx.fillStyle='rgba(0,0,0,0.62)';_deadCtx.fillRect(0,0,_W,_H);
          _deadCtx.save();_deadCtx.translate(-_frozenCamX,0);
          _pvpDrawFloor(_deadCtx,_W,_H);
          _pvpDrawPlayer(_deadCtx,_pvp.player);
          if(_img){
            var _isLS=_W>_H;
            var _bh=Math.round(_H*(_isLS?0.66:0.43));
            var _bw=Math.round(_img.naturalWidth*(_bh/_img.naturalHeight));
            if(_bw>_W*0.6){var _s=(_W*0.6)/_bw;_bw=Math.round(_bw*_s);_bh=Math.round(_bh*_s);}
            var _fallProg=Math.min(1,_elapsed/900);
            var _fallY=Math.round(_pvp.boss.y+_fallProg*(_bh*0.25));
            var _alpha=Math.max(0,1-Math.max(0,_elapsed-600)/500);
            _deadCtx.globalAlpha=_alpha;
            _deadCtx.drawImage(_img,0,0,_img.naturalWidth,_img.naturalHeight,
              Math.round(_pvp.boss.x-_bw/2),Math.round(_fallY-_bh),_bw,_bh);
            _deadCtx.globalAlpha=1;
          }
          _deadCtx.restore();
        }
        if(_elapsed<1100){requestAnimationFrame(_deadLoop);}
        else{_pvpWin();}
      }
      requestAnimationFrame(_deadLoop);
    },50);
  }
}

function _pvpDamagePlayer(dmg){
  if(_pvp.player.hp<=0)return;
  if(_pvp.blocking)dmg=Math.max(1,Math.round(dmg*0.20));
  _pvp.player.hp=Math.max(0,_pvp.player.hp-dmg);
  _pvpShowDmgNum(dmg,_pvp.player.x,_pvp.player.y-65,_pvp.blocking?'#4488ff':'#e74c3c');
  _pvpUpdateHUD();_pvp.screenShake=_pvp.blocking?4:14;
  _pvp.playerHitFlash=_pvp.blocking?6:14;
  _pvp.screenRedFlash=_pvp.blocking?0:8; // red vignette on player hit
  if(_pvp.impactRings){
    var _rc=_pvp.blocking?'rgba(68,136,255,0.8)':'rgba(231,76,60,0.9)';
    _pvp.impactRings.push({x:_pvp.player.x,y:_pvp.player.y-30,r:0,maxR:55,life:12,maxLife:12,color:_rc});
    if(!_pvp.blocking) _pvp.impactRings.push({x:_pvp.player.x,y:_pvp.player.y-30,r:0,maxR:30,life:7,maxLife:7,color:'rgba(255,255,255,0.5)'});
  }
  _pvpSpawnParticles(_pvp.player.x,_pvp.player.y-30,_pvp.blocking?'#4488ff':'#e74c3c',_pvp.blocking?4:12);
  _pvpSpawnParticles(_pvp.player.x,_pvp.player.y-50,_pvp.blocking?'#aaccff':'#ff6644',_pvp.blocking?0:5);
  if(_pvp.player.hp<=0)_pvpLose();
}

function _pvpUpdateHUD(){
  var pb=document.getElementById('pvpPlayerHP'),ptx=document.getElementById('pvpPlayerHPTxt');
  var bb=document.getElementById('pvpBossHP'),btx=document.getElementById('pvpBossHPTxt');
  var p=_pvp.player,b=_pvp.boss;
  if(pb)pb.style.width=Math.max(0,p.hp/p.maxHp*100)+'%';
  if(ptx)ptx.textContent=p.hp+'/'+p.maxHp;
  if(bb)bb.style.width=Math.max(0,b.hp/b.maxHp*100)+'%';
  if(btx)btx.textContent=b.hp+'/'+b.maxHp;
  if(bb)bb.style.background=['linear-gradient(90deg,#e74c3c,#c0392b)','linear-gradient(90deg,#ff6600,#cc3300)','linear-gradient(90deg,#ff0000,#880000)'][_pvp.boss.phase]||'';
}

function _pvpShowPhase(n){
  if(_pvp.phaseShown>=n)return;_pvp.phaseShown=n;_pvp.screenShake=15;
  var banner=document.getElementById('pvpPhaseBanner'),txt=document.getElementById('pvpPhaseTxt');
  if(!banner||!txt)return;
  txt.textContent='// PHASE '+(n+1)+' — '+['','ЯРОСТЬ!','БЕРСЕРК!!!'][n];
  txt.style.color=n===2?'#ff0000':'#ff6600';
  banner.style.display='block';banner.style.animation='pvpPhase 2s forwards';
  setTimeout(function(){banner.style.display='none';banner.style.animation='';},2000);
}

var _dmgNums=[];
function _pvpShowDmgNum(dmg,x,y,color){
  var _crit=dmg>=30;
  _dmgNums.push({
    val:dmg, x:x+(Math.random()-0.5)*20, y:y,
    vx:(Math.random()-0.5)*1.2,
    vy:-3.2-Math.random()*1.5,
    life:55, maxLife:55,
    color:color, crit:_crit,
    scale:_crit?2.0:1.2,
    targetScale:_crit?1.4:1.0
  });
}
function _pvpSpawnParticles(x,y,color,count){
  for(var i=0;i<count;i++){
    var a=Math.random()*Math.PI*2;
    var spd=2+Math.random()*7;
    _pvp.particles.push({
      x:x,y:y,
      vx:Math.cos(a)*spd, vy:Math.sin(a)*spd-3,
      r:1.5+Math.random()*4,
      life:35+Math.random()*30, maxLife:65,
      color:color
    });
  }
}
function _pvpShowHint(txt){if(typeof toast==='function')toast(txt,1000);}

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

function _pvpLose(){
  if(_pvp.over)return;_pvp.over=true;PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  setTimeout(function(){_pvpEndScreen(false,null,Math.floor((Date.now()-_pvp.startTime)/1000));},700);
}

function _pvpEndScreen(won,reward,time){
  // Loss screen (win uses _pvpShowRewardSequence instead)
  var inner=document.getElementById('pvpBattleInner');if(!inner)return;
  inner.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;gap:16px;text-align:center;background:radial-gradient(circle at center,rgba(231,76,60,0.08),#000);">'
    +'<div style="font-size:72px;animation:_rwd_float 2s ease-in-out infinite">💀</div>'
    +'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:26px;font-weight:700;letter-spacing:4px;color:#e74c3c;text-shadow:0 0 24px rgba(231,76,60,0.8);">ПОРАЖЕНИЕ</div>'
    +'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:rgba(255,255,255,0.3);">⏱ '+time+' секунд</div>'
    +'<div style="display:flex;gap:8px;width:100%;margin-top:8px;">'
    +'<button class="pvp-btn" onclick="_pvpStartBoss()" style="flex:1;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-weight:900;">🔄 СНОВА</button>'
    +'<button class="pvp-btn" onclick="_pvpGoMenu()" style="flex:1;background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);">🏠 МЕНЮ</button>'
    +'</div></div>';
}

// Корректный выход в меню: останавливаем всё, чистим экран, потом show()
function _pvpGoMenu(){
  PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  // Удаляем overlay
  var ol=document.getElementById('_pvpRewardOverlay');
  if(ol&&ol.parentNode)ol.parentNode.removeChild(ol);
  // Чистим inner
  var inner=document.getElementById('pvpBattleInner');
  if(inner)inner.innerHTML='';
  // Принудительно скрываем battle экран и показываем pvp меню
  // — работает независимо от того как устроена show()
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var pvpScreen=document.getElementById('s-pvp');
  var battleScreen=document.getElementById('s-pvp-battle');
  if(battleScreen){battleScreen.style.display='none';battleScreen.classList.remove('active');}
  if(pvpScreen){pvpScreen.style.display='';pvpScreen.classList.add('active');}
  // Также вызываем show() если есть — для обновления состояния меню
  if(typeof show==='function')try{show('pvp');}catch(e){}
  if(typeof updateMenu==='function')try{updateMenu();}catch(e){}
}

// ── ИГРОВОЙ ЦИКЛ ─────────────────────────────────────────────────
function _pvpLoop(){
  if(!PVP_RUNNING&&_bossAnim.cur!=='dead')return;
  var ctx=_pvp.ctx,canvas=_pvp.canvas;
  if(!ctx||!canvas)return;
  var now=Date.now(),dt=Math.min(now-_pvp.lastFrame,50);
  _pvp.lastFrame=now;
  var W=canvas.width,H=canvas.height;
  var sx=0,sy2=0;
  if(_pvp.screenShake>0){sx=(Math.random()-0.5)*_pvp.screenShake;sy2=(Math.random()-0.5)*_pvp.screenShake;_pvp.screenShake=Math.max(0,_pvp.screenShake-1);}
  var _tcam=Math.min(0,_pvp.player.x-PVP_W*0.5);
  _pvp.camX+=(_tcam-_pvp.camX)*0.08;
  var _cx=Math.round(_pvp.camX);
  // Очищаем и рисуем фон БЕЗ сдвига камеры — фон всегда на весь canvas
  ctx.save();
  ctx.clearRect(0,0,W,H);
  _pvpDrawCaveBG(ctx,W,H,now);
  // Лёгкое затемнение — арена читаема
  ctx.fillStyle='rgba(0,0,0,0.22)';
  ctx.fillRect(0,0,W,H);
  ctx.restore();

  // Теперь применяем сдвиг камеры для игровых объектов
  ctx.save();ctx.translate(sx-_cx,sy2);

  _pvpBossAI(now,dt);_bossTickAnim(dt);

  // Гравитация
  if(!_pvp.player.onGround){
    _pvp.player.vy+=0.6;_pvp.player.y+=_pvp.player.vy;
    if(_pvp.player.y>=PVP_FLOOR){_pvp.player.y=PVP_FLOOR;_pvp.player.vy=0;_pvp.player.onGround=true;}
  }

  // Снаряды
  _pvp.projectiles=_pvp.projectiles.filter(function(p){
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;
    if(p.owner==='player'){
      var ddx=p.x-_pvp.boss.x,ddy=p.y-(_pvp.boss.y-50);
      if(Math.sqrt(ddx*ddx+ddy*ddy)<50){var wpn=PVP_WEAPONS[p.wpn]||PVP_WEAPONS.bow;_pvpDamageBoss(_rnd(wpn.dmg[0],wpn.dmg[1]),false);_pvpSpawnParticles(p.x,p.y,p.color,6);return false;}
    } else {
      var ddx2=p.x-_pvp.player.x,ddy2=p.y-(_pvp.player.y-28);
      if(Math.sqrt(ddx2*ddx2+ddy2*ddy2)<28){_pvpDamagePlayer(_rnd(_pvp.boss.data.atk[0],_pvp.boss.data.atk[1]));_pvpSpawnParticles(p.x,p.y,'#e74c3c',5);return false;}
    }
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;ctx.restore();
    return p.x>-30&&p.x<W+30&&p.y<H+30;
  });

  // Волны
  _pvp.waves=_pvp.waves.filter(function(w){
    w.x+=w.vx;w.life--;
    if(Math.abs(w.x-_pvp.player.x)<w.w/2+15&&_pvp.player.onGround){_pvpDamagePlayer(_rnd(5,12));return false;}
    ctx.save();ctx.globalAlpha=w.life/w.maxL;ctx.fillStyle=w.color;ctx.shadowColor=w.color;ctx.shadowBlur=12;
    ctx.fillRect(w.x-w.w/2,w.y-w.h,w.w,w.h);ctx.fillRect(w.x-w.w/2-8,w.y-w.h*0.6,8,w.h*0.6);ctx.fillRect(w.x+w.w/2,w.y-w.h*0.6,8,w.h*0.6);
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    return w.life>0&&w.x>-50&&w.x<W+50;
  });

  // Движение
  if(_pvpMoveDir!==0&&!_pvp.blocking&&!_pvp.over){
    _pvp.player.x+=_pvpMoveDir*3.5;
    _pvp.player.x=Math.max(-PVP_W+20,Math.min(PVP_W-30,_pvp.player.x));
    _pvp.player.state='walk';_pvp.player.dir=_pvpMoveDir;
  }

  _pvpDrawPlayer(ctx,_pvp.player);

  // ── Slash effects — спрайтовые эффекты удара ─────────────────────
  _tickSlashFX(dt, ctx);

  // ── Красная аура вокруг босса ────────────────────────────────────
  if(_pvp.boss.hp>0&&_bossAnim.cur!=='dead'){
    var _bax=_pvp.boss.x, _bay=_pvp.boss.y-80;
    var _baPulse=0.18+Math.sin(now/300)*0.07;
    var _baR=80+(_pvp.boss.phase||0)*20;
    var _baGrad=ctx.createRadialGradient(_bax,_bay,10,_bax,_bay,_baR);
    _baGrad.addColorStop(0,'rgba(200,30,0,'+_baPulse+')');
    _baGrad.addColorStop(1,'rgba(200,30,0,0)');
    ctx.save();ctx.globalCompositeOperation='screen';
    ctx.fillStyle=_baGrad;ctx.fillRect(_bax-_baR,_bay-_baR,_baR*2,_baR*2);
    ctx.restore();
  }

  if(_pvp.boss.hp>0||_bossAnim.cur==='dead')_bossDrawSprite(ctx,_pvp.boss.x,_pvp.boss.y);

  // ── Lighting: dark overlay с radial light вокруг игрока ──────────
  // Рисуем без camera offset (в screen space)
  ctx.restore(); // закрываем camera translate
  ctx.save();
  ctx.translate(sx,sy2); // только shake, без camX
  var _lx=_pvp.player.x-_cx, _ly=_pvp.player.y-40;
  var _lRadius=W*0.45;
  var _lGrad=ctx.createRadialGradient(_lx,_ly,20,_lx,_ly,_lRadius);
  _lGrad.addColorStop(0,'rgba(0,0,0,0)');
  _lGrad.addColorStop(0.55,'rgba(0,0,0,0.08)');
  _lGrad.addColorStop(1,'rgba(0,0,0,0.35)');
  ctx.fillStyle=_lGrad;
  ctx.fillRect(-sx,  -sy2, W+Math.abs(sx)*2, H+Math.abs(sy2)*2);
  ctx.restore();
  // Восстанавливаем camera translate для оставшихся объектов (частицы, цифры)
  ctx.save();ctx.translate(sx-_cx,sy2);

  // ── Hit flash на боссе — radial burst ────────────────────────────
  if(_pvp.bossHitFlash>0){
    var _bfa=_pvp.bossHitFlash/10;
    var _canvas=_pvp.canvas;
    var _bHh=_canvas?Math.round(_canvas.height*(_canvas.width>_canvas.height?0.66:0.43)):80;
    ctx.save();
    var _bfg=ctx.createRadialGradient(_pvp.boss.x,_pvp.boss.y-_bHh*0.5,5,_pvp.boss.x,_pvp.boss.y-_bHh*0.5,_bHh*0.55);
    _bfg.addColorStop(0,'rgba(255,255,255,'+(_bfa*0.7)+')');
    _bfg.addColorStop(0.4,'rgba(180,255,180,'+(_bfa*0.3)+')');
    _bfg.addColorStop(1,'rgba(0,255,136,0)');
    ctx.fillStyle=_bfg;
    ctx.fillRect(_pvp.boss.x-_bHh,_pvp.boss.y-_bHh*1.1,_bHh*2,_bHh*1.1);
    ctx.restore();
    _pvp.bossHitFlash--;
  }
  // ── Hit flash на игроке — radial burst ───────────────────────────
  if(_pvp.playerHitFlash>0){
    var _pfa=_pvp.playerHitFlash/14;
    var _pfColor=_pvp.blocking?'rgba(100,160,255,':'rgba(255,60,40,';
    ctx.save();
    var _pfg=ctx.createRadialGradient(_pvp.player.x,_pvp.player.y-35,3,_pvp.player.x,_pvp.player.y-35,52);
    _pfg.addColorStop(0,_pfColor+(_pfa*0.75)+')');
    _pfg.addColorStop(1,_pfColor+'0)');
    ctx.fillStyle=_pfg;
    ctx.fillRect(_pvp.player.x-55,_pvp.player.y-90,110,90);
    ctx.restore();
    _pvp.playerHitFlash--;
  }
  // ── Red screen vignette on player hit ────────────────────────────
  if(_pvp.screenRedFlash>0){
    ctx.restore(); // exit camera space for full-screen effect
    ctx.save();
    var _rva=(_pvp.screenRedFlash/8)*0.38;
    var _rvg=ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,H*0.75);
    _rvg.addColorStop(0,'rgba(180,0,0,0)');
    _rvg.addColorStop(1,'rgba(200,0,0,'+_rva+')');
    ctx.fillStyle=_rvg; ctx.fillRect(0,0,W,H);
    ctx.restore();
    ctx.save(); ctx.translate(sx-_cx,sy2); // back to camera space
    _pvp.screenRedFlash--;
  }
  // ── Impact rings — dual line ──────────────────────────────────────
  if(_pvp.impactRings){
    _pvp.impactRings=_pvp.impactRings.filter(function(ring){
      ring.r+=ring.maxR/ring.maxLife*2.2;
      ring.life--;
      if(ring.life<=0)return false;
      var _ra=ring.life/ring.maxLife;
      ctx.save();
      ctx.globalAlpha=_ra*0.85;
      ctx.strokeStyle=ring.color;
      ctx.lineWidth=2.5*(1-_ra)+0.5;
      ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2);ctx.stroke();
      // inner thin ring
      if(ring.r>10){
        ctx.globalAlpha=_ra*0.4;
        ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r*0.6,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
      return true;
    });
  }
  // ── Частицы — с glow ─────────────────────────────────────────────
  _pvp.particles=_pvp.particles.filter(function(p){
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.22; p.vx*=0.96; p.life--;
    if(p.life<=0)return false;
    var _pa=p.life/p.maxLife;
    ctx.save();
    ctx.globalAlpha=_pa*_pa; // квадратичный fade — резче угасает
    ctx.shadowColor=p.color; ctx.shadowBlur=p.r*2.5;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*(0.5+_pa*0.5),0,Math.PI*2);
    ctx.fillStyle=p.color; ctx.fill();
    ctx.shadowBlur=0;
    ctx.restore();
    return true;
  });

  // ── Цифры урона — pop scale + crit style ─────────────────────────
  _dmgNums=_dmgNums.filter(function(d){
    d.x+=d.vx; d.y+=d.vy; d.vy*=0.88; d.vx*=0.92; d.life--;
    if(d.life<=0)return false;
    var _da=d.life/d.maxLife;
    // Scale: pop from big down to target
    var _lifeRatio=d.life/d.maxLife;
    d.scale+=(d.targetScale-d.scale)*0.18;
    var _fadeAlpha=_lifeRatio<0.35?_lifeRatio/0.35:1;
    ctx.save();
    ctx.globalAlpha=_da*_fadeAlpha;
    var _fs=d.crit?Math.round(26*d.scale):Math.round(16*d.scale);
    ctx.font='900 '+_fs+'px "IBM Plex Mono",monospace';
    ctx.textAlign='center';
    ctx.shadowColor=d.color; ctx.shadowBlur=d.crit?20:10;
    // thick black outline
    ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineWidth=d.crit?5:3;
    ctx.strokeText('-'+d.val,d.x,d.y);
    ctx.fillStyle=d.crit?'#ffffff':d.color;
    ctx.fillText('-'+d.val,d.x,d.y);
    // crit: coloured shadow text underneath
    if(d.crit){
      ctx.globalAlpha=_da*_fadeAlpha*0.6;
      ctx.fillStyle=d.color;
      ctx.fillText('-'+d.val,d.x+2,d.y+2);
    }
    ctx.shadowBlur=0; ctx.textAlign='left';
    ctx.restore();
    return true;
  });

  ctx.restore();
  PVP_RAF=requestAnimationFrame(_pvpLoop);
}

// ── ПЕЩЕРНЫЙ ФОН ─────────────────────────────────────────────────
// ── ФОН картинка ─────────────────────────────────────────────────
var _pvpBgImg = null;
(function(){
  var img = new Image();
  img.onload = function(){ _pvpBgImg = img; };
  img.onerror = function(){ console.warn('Image_3973.jpg missing'); };
  img.src = 'assets/img/Image_3973.jpg';
})();

function _pvpDrawCaveBG(ctx,W,H,now){
  var T=_TILES;
  var floorY = PVP_FLOOR || Math.round(H*0.78);
  var ts = Math.round(W/10);

  var ceilRows = 2;
  var allStone=[
    'stone_1','stone_2','stone_3','stone_4','stone_5',
    'stone_6','stone_7','stone_8','stone_9','stone_10',
    'stone_11','stone_12','stone_13','stone_14','stone_15',
  ];
  var allMoss=[
    'moss_1','moss_2','moss_3','moss_4','moss_5',
    'moss_6','moss_7','moss_8','moss_9','moss_10',
    'moss_11','moss_12','moss_13','moss_14','moss_15',
  ];
  var wallTop = ceilRows*ts;
  var wallH   = floorY - wallTop;
  var sideW   = ts;

  // ════════════════════════════════════════════════════════════════
  // LAYER 1 — FAR BACKGROUND (глубина, самый дальний план)
  // ════════════════════════════════════════════════════════════════

  // Базовый цвет — тёмно-зелёный грот
  ctx.fillStyle='#0d1a0e';
  ctx.fillRect(0,0,W,H);

  // Далёкие арки — уходят в темноту, только силуэты
  // Арка 1 — левая зона
  (function(){
    var archX=W*0.20, archBaseY=floorY, archW=W*0.22, archH=wallH*0.75;
    ctx.save();
    ctx.globalAlpha=0.22;
    // Внутренность арки — абсолютная темнота = ощущение бездны
    ctx.fillStyle='#050a05';
    ctx.beginPath();
    ctx.moveTo(archX-archW/2, archBaseY);
    ctx.lineTo(archX-archW/2, archBaseY-archH*0.55);
    ctx.quadraticCurveTo(archX, archBaseY-archH, archX+archW/2, archBaseY-archH*0.55);
    ctx.lineTo(archX+archW/2, archBaseY);
    ctx.closePath();
    ctx.fill();
    // Каменный обвод арки
    ctx.globalAlpha=0.18;
    ctx.strokeStyle='#2a3d1e';
    ctx.lineWidth=Math.round(ts*0.18);
    ctx.stroke();
    ctx.restore();
  })();

  // Арка 2 — правая зона
  (function(){
    var archX=W*0.80, archBaseY=floorY, archW=W*0.22, archH=wallH*0.72;
    ctx.save();
    ctx.globalAlpha=0.20;
    ctx.fillStyle='#050a05';
    ctx.beginPath();
    ctx.moveTo(archX-archW/2, archBaseY);
    ctx.lineTo(archX-archW/2, archBaseY-archH*0.55);
    ctx.quadraticCurveTo(archX, archBaseY-archH, archX+archW/2, archBaseY-archH*0.55);
    ctx.lineTo(archX+archW/2, archBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha=0.15;
    ctx.strokeStyle='#2a3d1e';
    ctx.lineWidth=Math.round(ts*0.18);
    ctx.stroke();
    ctx.restore();
  })();

  // Далёкие «окна» — узкие световые бойницы высоко на стенах (слабый мистический свет)
  var windowSlots=[
    {x:W*0.08, y:wallTop+wallH*0.12, w:ts*0.12, h:wallH*0.22},
    {x:W*0.92, y:wallTop+wallH*0.15, w:ts*0.12, h:wallH*0.20},
    {x:W*0.04, y:wallTop+wallH*0.42, w:ts*0.10, h:wallH*0.16},
    {x:W*0.96, y:wallTop+wallH*0.44, w:ts*0.10, h:wallH*0.15},
  ];
  windowSlots.forEach(function(win,i){
    ctx.save();
    // Холодное зеленоватое свечение из бойницы
    var glow=ctx.createRadialGradient(win.x,win.y+win.h*0.4,0, win.x,win.y+win.h*0.4, win.h*1.8);
    var pulse=0.08+Math.sin(now/2400+i*1.7)*0.03;
    glow.addColorStop(0,'rgba(80,160,60,'+pulse+')');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;
    ctx.fillRect(win.x-win.h*2,win.y-win.h,win.h*4,win.h*4);
    // Сама бойница — тёмный прямоугольник с заострённым верхом
    ctx.globalAlpha=0.35;
    ctx.fillStyle='#030805';
    ctx.beginPath();
    ctx.moveTo(win.x-win.w/2, win.y+win.h);
    ctx.lineTo(win.x-win.w/2, win.y+win.h*0.3);
    ctx.lineTo(win.x, win.y);
    ctx.lineTo(win.x+win.w/2, win.y+win.h*0.3);
    ctx.lineTo(win.x+win.w/2, win.y+win.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Затемнение дальнего плана — создаёт атмосферную дымку
  var farFog=ctx.createLinearGradient(0,wallTop,0,floorY);
  farFog.addColorStop(0,'rgba(5,10,5,0.55)');
  farFog.addColorStop(0.4,'rgba(5,10,5,0.30)');
  farFog.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=farFog;
  ctx.fillRect(0,wallTop,W,wallH);

  // ════════════════════════════════════════════════════════════════
  // LAYER 2 — MIDGROUND (средний план — стены, потолок, руны, цепи)
  // ════════════════════════════════════════════════════════════════

  // Ambient свет середины арены — поднимает читаемость зоны боя
  var midLight=ctx.createRadialGradient(W*0.5,H*0.45,0,W*0.5,H*0.45,W*0.55);
  midLight.addColorStop(0,'rgba(60,90,55,0.18)');
  midLight.addColorStop(0.6,'rgba(40,65,38,0.08)');
  midLight.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=midLight;
  ctx.fillRect(0,0,W,H);

  // ── 2. Потолок ───────────────────────────────────────────────────
  function _htile(col,row){
    var h=((col*2654435761)^(row*2246822519))>>>0;
    return row===0 ? allStone[h%allStone.length] : allMoss[h%allMoss.length];
  }
  var wallCols=Math.ceil(W/ts)+1;
  for(var row=0;row<ceilRows;row++){
    for(var col=0;col<wallCols;col++){
      var img=T[_htile(col,row)];
      ctx.globalAlpha=0.95;
      if(img) ctx.drawImage(img,col*ts,row*ts,ts,ts);
      else { ctx.globalAlpha=1;ctx.fillStyle='#2a3e2b'; ctx.fillRect(col*ts,row*ts,ts,ts); }
    }
  }
  ctx.globalAlpha=1;

  // ── 3. Боковые стены ─────────────────────────────────────────────
  function _stile(col,row){
    var h=((col*1234567)^(row*7654321))>>>0;
    return allStone[h%allStone.length];
  }
  var sideRows=Math.ceil(wallH/ts)+1;
  for(var r=0;r<sideRows;r++){
    var img2=T[_stile(0,r)];
    ctx.globalAlpha=0.92;
    if(img2) ctx.drawImage(img2,0,wallTop+r*ts,sideW,ts);
    var img3=T[_stile(1,r)];
    if(img3) ctx.drawImage(img3,W-sideW,wallTop+r*ts,sideW,ts);
  }
  ctx.globalAlpha=1;

  // ── 4. Тени от стен ──────────────────────────────────────────────
  var lgr=ctx.createLinearGradient(0,0,sideW*1.5,0);
  lgr.addColorStop(0,'rgba(0,0,0,0.45)'); lgr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=lgr; ctx.fillRect(0,0,sideW*1.5,H);
  var rgr=ctx.createLinearGradient(W,0,W-sideW*1.5,0);
  rgr.addColorStop(0,'rgba(0,0,0,0.45)'); rgr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rgr; ctx.fillRect(W-sideW*1.5,0,sideW*1.5,H);

  // ── 5. Тень от потолка ───────────────────────────────────────────
  var ceilShadow=ctx.createLinearGradient(0,ceilRows*ts,0,ceilRows*ts+ts*1.2);
  ceilShadow.addColorStop(0,'rgba(0,0,0,0.32)');
  ceilShadow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ceilShadow;
  ctx.fillRect(0,ceilRows*ts,W,ts*1.2);

  // ── 6. Руны ──────────────────────────────────────────────────────
  var runeY=Math.round(wallTop + wallH*0.38);
  var runeTs=Math.round(ts*0.9);
  [['rune_1',sideW*0.1],['rune_2',W/2-runeTs/2],['rune_3',W-sideW-runeTs*0.9]].forEach(function(r,i){
    var img=T[r[0]]; if(!img)return;
    var rx=Math.round(r[1]);
    var pulse=0.7+Math.sin(now/900+i*2.1)*0.2;
    ctx.globalAlpha=pulse*0.85;
    ctx.drawImage(img,rx,runeY,runeTs,runeTs);
    ctx.globalAlpha=1;
  });

  // ── 7. Цепи midground — средние, умеренная видимость ─────────────
  var chainW=Math.round(ts*0.35);
  var chainH=Math.round(wallH*0.4);
  var sway=Math.sin(now/1800)*3;
  [[T['chain_1'],W*0.25],[T['chain_2'],W*0.75]].forEach(function(c,i){
    var cimg=c[0]; if(!cimg)return;
    ctx.save();
    ctx.globalAlpha=0.70;
    ctx.translate(Math.round(c[1]),ceilRows*ts);
    ctx.rotate((i===0?1:-1)*sway*0.008);
    ctx.drawImage(cimg,-chainW/2,0,chainW,chainH);
    ctx.restore();
  });
  ctx.globalAlpha=1;
  var hookImg=T['chain_hook'];
  if(hookImg){
    var hw=Math.round(ts*0.45),hh=Math.round(ts*0.6);
    ctx.globalAlpha=0.7;
    ctx.drawImage(hookImg,Math.round(W/2-hw/2),ceilRows*ts,hw,hh);
    ctx.globalAlpha=1;
  }

  // ════════════════════════════════════════════════════════════════
  // LAYER 3 — FOREGROUND (передний план — цепи ближние + туман)
  // ════════════════════════════════════════════════════════════════

  // Ближние цепи — крупнее, ярче, висят у краёв (не в gameplay зоне)
  var fgChainW=Math.round(ts*0.28);
  var fgChainH=Math.round(wallH*0.55);
  var fgSway=Math.sin(now/1400)*4;
  // Левая ближняя цепь — прижата к левой стене
  var fgChainImg=T['chain_2']||T['chain_1'];
  if(fgChainImg){
    ctx.save();
    ctx.globalAlpha=0.55;
    ctx.filter='brightness(0.55)';
    ctx.translate(Math.round(sideW*0.55), ceilRows*ts);
    ctx.rotate(fgSway*0.010);
    ctx.drawImage(fgChainImg,-fgChainW/2,0,fgChainW,fgChainH);
    ctx.filter='none';
    ctx.restore();
  }
  // Правая ближняя цепь
  var fgChainImg2=T['chain_1']||T['chain_2'];
  if(fgChainImg2){
    ctx.save();
    ctx.globalAlpha=0.50;
    ctx.filter='brightness(0.50)';
    ctx.translate(Math.round(W-sideW*0.55), ceilRows*ts);
    ctx.rotate(-fgSway*0.010);
    ctx.drawImage(fgChainImg2,-fgChainW/2,0,fgChainW,fgChainH);
    ctx.filter='none';
    ctx.restore();
  }

  // Туман у пола — мягкий, только вдоль нижней трети, не закрывает персонажей
  // Слой 1: широкий базовый туман
  var fogBase=ctx.createLinearGradient(0,floorY-wallH*0.30,0,floorY);
  fogBase.addColorStop(0,'rgba(10,20,10,0)');
  fogBase.addColorStop(0.55,'rgba(8,18,8,0.12)');
  fogBase.addColorStop(1,'rgba(5,12,5,0.28)');
  ctx.fillStyle=fogBase;
  ctx.fillRect(0,floorY-wallH*0.30,W,wallH*0.30);

  // Слой 2: анимированный дрейф тумана — горизонтальные полосы у самого пола
  var fogDrift=Math.sin(now/3200)*W*0.06;
  var fog2=ctx.createLinearGradient(fogDrift,floorY-ts*0.8,fogDrift+W,floorY-ts*0.8);
  fog2.addColorStop(0,'rgba(15,30,12,0)');
  fog2.addColorStop(0.3,'rgba(12,25,10,0.09)');
  fog2.addColorStop(0.5,'rgba(20,40,15,0.14)');
  fog2.addColorStop(0.7,'rgba(12,25,10,0.09)');
  fog2.addColorStop(1,'rgba(15,30,12,0)');
  ctx.fillStyle=fog2;
  ctx.fillRect(0,floorY-ts*0.8,W,ts*0.8);

  // Слой 3: тонкая полоска густого тумана прямо у основания пола
  var fogDense=ctx.createLinearGradient(0,floorY-ts*0.25,0,floorY);
  fogDense.addColorStop(0,'rgba(0,0,0,0)');
  fogDense.addColorStop(1,'rgba(5,10,5,0.35)');
  ctx.fillStyle=fogDense;
  ctx.fillRect(0,floorY-ts*0.25,W,ts*0.25);

  // Угловые тени переднего плана — углы экрана темнее (виньетка)
  var vigSize=Math.round(ts*2.2);
  // Верхние углы
  var vtl=ctx.createRadialGradient(0,0,0,0,0,vigSize);
  vtl.addColorStop(0,'rgba(0,0,0,0.50)'); vtl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=vtl; ctx.fillRect(0,0,vigSize,vigSize);
  var vtr=ctx.createRadialGradient(W,0,0,W,0,vigSize);
  vtr.addColorStop(0,'rgba(0,0,0,0.50)'); vtr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=vtr; ctx.fillRect(W-vigSize,0,vigSize,vigSize);
  // Нижние углы
  var vbl=ctx.createRadialGradient(0,H,0,0,H,vigSize);
  vbl.addColorStop(0,'rgba(0,0,0,0.45)'); vbl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=vbl; ctx.fillRect(0,H-vigSize,vigSize,vigSize);
  var vbr=ctx.createRadialGradient(W,H,0,W,H,vigSize);
  vbr.addColorStop(0,'rgba(0,0,0,0.45)'); vbr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=vbr; ctx.fillRect(W-vigSize,H-vigSize,vigSize,vigSize);

  // ── 8. Пол — 2 ряда тайлов (камень + мох) ───────────────────────
  var floorCols=Math.ceil(W/ts)+1;
  var floorRow2Y = floorY - ts;   // верхний ряд — мох (то что игрок стоит НА нём)
  var floorRow1Y = floorY;        // нижний ряд — камень (глубина)

  // Нижний ряд: камень — тёмный, создаёт depth под платформой
  ctx.save();
  // Тёмная подложка под каменным рядом для extra depth
  ctx.fillStyle='#0a1209';
  ctx.fillRect(0, floorRow1Y, W, ts + 4);
  ctx.restore();
  for(var col=0;col<floorCols;col++){
    var _hf0=((col*1597)^(0*2017))>>>0;
    var fn0=allStone[_hf0%allStone.length];
    var fi0=T[fn0];
    // Камень темнее — уходит в тень, создаёт ощущение толщины
    ctx.globalAlpha=0.70;
    if(fi0){
      ctx.save();
      ctx.filter='brightness(0.65)';
      ctx.drawImage(fi0,col*ts,floorRow1Y,ts,ts);
      ctx.filter='none';
      ctx.restore();
    } else { ctx.globalAlpha=1;ctx.fillStyle='#0e1a0f';ctx.fillRect(col*ts,floorRow1Y,ts,ts); }
  }

  // Верхний ряд: мох — ярче, это поверхность на которой стоят персонажи
  for(var col=0;col<floorCols;col++){
    var _hf1=((col*3141592)^(1*2718281))>>>0;
    var fn1=allMoss[_hf1%allMoss.length];
    var fi1=T[fn1];
    // Мох полная яркость — хорошо читается
    ctx.globalAlpha=1.0;
    if(fi1){
      ctx.save();
      ctx.filter='brightness(1.25) saturate(1.3)';
      ctx.drawImage(fi1,col*ts,floorRow2Y,ts,ts);
      ctx.filter='none';
      ctx.restore();
    } else { ctx.globalAlpha=1;ctx.fillStyle='#2e5230';ctx.fillRect(col*ts,floorRow2Y,ts,ts); }
  }
  ctx.globalAlpha=1;

  // Тёмная линия-граница между мхом и камнем — разделяет слои
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.55)';
  ctx.fillRect(0, floorRow1Y, W, 3);
  ctx.restore();

  // Верхний край платформы — яркая зелёная линия (green glow edge)
  ctx.save();
  ctx.shadowColor='rgba(80,220,80,0.9)';
  ctx.shadowBlur=8;
  ctx.strokeStyle='rgba(100,220,80,0.85)';
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(0,floorRow2Y);ctx.lineTo(W,floorRow2Y);ctx.stroke();
  // второй, более тонкий и светлый пиксель поверх
  ctx.shadowBlur=3;
  ctx.strokeStyle='rgba(180,255,140,0.5)';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,floorRow2Y+1);ctx.lineTo(W,floorRow2Y+1);ctx.stroke();
  ctx.shadowBlur=0;
  ctx.restore();

  // ── 9. Декор у пола ──────────────────────────────────────────────
  var decorH=Math.round(ts*0.75);
  var decorY=floorRow2Y - decorH + Math.round(ts*0.12);
  var decors=[
    {name:'shroom_1',   xp:0.05},
    {name:'coal_pile',  xp:0.16},
    {name:'shroom_2',   xp:0.88},
    {name:'coal_pile2', xp:0.78},
    {name:'orb_green',  xp:0.50, pulse:true},
    {name:'chest',      xp:0.93},
  ];
  decors.forEach(function(d){
    var img=T[d.name]; if(!img)return;
    var dh=decorH;
    var dw=Math.round(img.naturalWidth*(dh/img.naturalHeight));
    var dx=Math.round(W*d.xp-dw/2);
    if(d.pulse){
      ctx.globalAlpha=0.85+Math.sin(now/600)*0.12;
    } else {
      ctx.globalAlpha=0.92;
    }
    ctx.drawImage(img,dx,decorY,dw,dh);
    ctx.globalAlpha=1;
  });

  // ── 10. Ambient свет у пола — усиленный ─────────────────────────
  // Широкий мягкий glow поднимающийся от поверхности
  var gf=ctx.createLinearGradient(0,floorRow2Y-ts*0.5,0,floorRow2Y+ts*0.5);
  gf.addColorStop(0,'rgba(60,160,50,0.0)');
  gf.addColorStop(0.35,'rgba(50,140,40,0.10)');
  gf.addColorStop(0.65,'rgba(30,90,25,0.07)');
  gf.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gf;
  ctx.fillRect(0,floorRow2Y-ts*0.5,W,ts);
}
function _pvpDrawFloor(ctx,W,H){
  var fy=PVP_FLOOR;
  ctx.save();
  // Широкий мягкий glow под линией
  ctx.shadowColor='rgba(80,220,80,0.6)';ctx.shadowBlur=12;
  ctx.strokeStyle='rgba(120,220,90,0.7)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,fy);ctx.lineTo(W,fy);ctx.stroke();
  // Яркий тонкий highlight поверх
  ctx.shadowColor='rgba(180,255,140,0.8)';ctx.shadowBlur=4;
  ctx.strokeStyle='rgba(200,255,160,0.45)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,fy);ctx.lineTo(W,fy);ctx.stroke();
  ctx.shadowBlur=0;
  ctx.restore();
}
function _pvpDrawPlayer(ctx,p){
  var x=Math.round(p.x),y=Math.round(p.y);
  ctx.save();
  if(p.dir<0){ctx.scale(-1,1);x=-x;}
  // Тень на полу
  ctx.save();
  ctx.globalAlpha=0.45;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.beginPath();ctx.ellipse(x,y,18,5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // Зелёный glow вокруг персонажа
  if(_pvp.blocking){ctx.shadowColor='#0096ff';ctx.shadowBlur=20;}
  else{ctx.shadowColor='rgba(0,255,100,0.7)';ctx.shadowBlur=14;}
  // Ноги
  ctx.fillStyle='#1e4a1a';ctx.fillRect(x-8,y-14,7,14);ctx.fillRect(x+1,y-14,7,14);
  ctx.fillStyle='#162e13';ctx.fillRect(x-10,y-5,9,5);ctx.fillRect(x+1,y-5,9,5);
  // Тело
  ctx.fillStyle='#2a5c26';ctx.fillRect(x-11,y-36,22,22);
  ctx.fillStyle='#5a4020';ctx.fillRect(x-11,y-36,22,5);
  ctx.fillStyle='#6b4f25';ctx.fillRect(x-11,y-31,4,17);ctx.fillRect(x+7,y-31,4,17);
  // Руки
  ctx.fillStyle='#3d8b37';ctx.fillRect(x-16,y-34,6,15);ctx.fillRect(x+10,y-34,6,15);
  ctx.fillStyle='#2d6b28';ctx.fillRect(x-17,y-22,7,6);ctx.fillRect(x+10,y-22,7,6);
  // Голова
  ctx.fillStyle='#3d8b37';ctx.fillRect(x-11,y-56,22,20);
  ctx.fillStyle='#1a3a18';ctx.fillRect(x-11,y-60,22,6);ctx.fillRect(x-13,y-56,4,12);ctx.fillRect(x+9,y-56,4,8);
  ctx.fillStyle='#ffdd00';ctx.fillRect(x-7,y-50,5,5);ctx.fillRect(x+2,y-50,5,5);
  ctx.fillStyle='#000';ctx.fillRect(x-6,y-49,2,3);ctx.fillRect(x+3,y-49,2,3);
  ctx.fillStyle='#c8a87a';ctx.fillRect(x-4,y-41,8,3);
  ctx.fillStyle='#fff';ctx.fillRect(x-3,y-42,2,3);ctx.fillRect(x+1,y-42,2,3);
  // Оружие
  var wpn=PVP_WEAPONS[_pvp.weapon];ctx.shadowBlur=0;
  if(_pvp.weapon==='sword'){
    ctx.fillStyle='#ddd';ctx.fillRect(x+14,y-38,3,26);
    ctx.fillStyle=wpn.color;ctx.fillRect(x+10,y-30,11,3);
    ctx.fillStyle='#8b6914';ctx.fillRect(x+15,y-20,2,8);
  } else if(_pvp.weapon==='bow'){
    ctx.strokeStyle='#8b6914';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+16,y-24,14,-Math.PI*0.6,Math.PI*0.6);ctx.stroke();
    ctx.strokeStyle='#f5c518';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+16,y-37);ctx.lineTo(x+16,y-11);ctx.stroke();
  } else {
    ctx.strokeStyle=wpn.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+12,y-8);ctx.lineTo(x+22,y-44);ctx.stroke();
    ctx.beginPath();ctx.arc(x+26,y-44,11,Math.PI*0.7,Math.PI*1.9);ctx.stroke();
  }
  ctx.shadowBlur=0;ctx.restore();
}

function _rnd(a,b){return a+Math.floor(Math.random()*(b-a+1));}

window.openPVP=openPVP;window._pvpStartBoss=_pvpStartBoss;window._pvpShowLobby=_pvpShowLobby;
window._pvpAttack=_pvpAttack;window._pvpMove=_pvpMove;window._pvpStopMove=_pvpStopMove;
window._pvpSwitchWeapon=_pvpSwitchWeapon;window._pvpPickWeapon=_pvpPickWeapon;
window._pvpOpenBossLobby=_pvpOpenBossLobby;window._pvpBlockStart=_pvpBlockStart;
window._pvpBlockEnd=_pvpBlockEnd;window._pvpJump=_pvpJump;

// Инжектим стили сразу при загрузке чтобы экран s-pvp корректно отображался
window.addEventListener('load', _pvpInjectStyles);

// Пересчёт canvas при повороте / изменении размера окна
function _pvpResizeCanvas(){
  if(!PVP_RUNNING) return;
  var canvas = document.getElementById('pvpCanvas');
  var hud    = document.getElementById('pvpHUD');
  var ctrl   = document.getElementById('pvpControls');
  var inner  = document.getElementById('pvpBattleInner');
  if(!canvas) return;

  var vvW = window.innerWidth;
  var vvH = window.innerHeight;
  var _hudH  = hud  ? hud.offsetHeight  : 52;
  var _canvasH = Math.max(vvH - _hudH, 120);  // контролы — overlay, не отнимают высоту

  canvas.width         = vvW;
  canvas.height        = _canvasH;
  canvas.style.width   = vvW + 'px';
  canvas.style.height  = _canvasH + 'px';

  PVP_W     = vvW;
  PVP_H     = _canvasH;
  var _isPortrait2 = _canvasH > vvW;
  PVP_FLOOR = Math.round(_canvasH * (_isPortrait2 ? 0.78 : 0.72));

  // Пересчитываем позиции
  if(_pvp.player){ _pvp.player.y = PVP_FLOOR; }
  if(_pvp.boss)  { _pvp.boss.y   = PVP_FLOOR; _pvp.boss.x = PVP_W * 0.78; }
}

window.addEventListener('resize', function(){
  // Небольшой debounce чтобы не дёргать на каждый px
  clearTimeout(window._pvpResizeTimer);
  window._pvpResizeTimer = setTimeout(_pvpResizeCanvas, 150);
});
