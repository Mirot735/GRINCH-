// ═══════════════════════════════════════════════════════════════
// GRINCH GAME — pvp.js v4.1
// boss_troll.png      → 612×408, 4cols×2rows, кадр 153×204
// boss_troll_idle.png → 1774×887, 4cols×1row, кадр 443×887
// ═══════════════════════════════════════════════════════════════
'use strict';

var PVP_W = 0, PVP_H = 0, PVP_FLOOR = 0;
var PVP_RUNNING = false;
var PVP_RAF = null;

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
  var BOSS_H = _canvas ? Math.round(_canvas.height * 0.40) : Math.round(PVP_FLOOR * 0.62);
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
    '#s-pvp,#s-pvp-battle{background:#000!important;}',
    // (portrait rotate removed — handled by gate screen)
    
    
    '#pvpCanvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;}',
    '.pvp-btn{font-family:"IBM Plex Mono",monospace;font-size:13px;font-weight:700;letter-spacing:2px;border:none;border-radius:4px;cursor:pointer;padding:12px 20px;-webkit-tap-highlight-color:transparent;}',
    '.pvp-wpn-btn{font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:700;border-radius:4px;cursor:pointer;padding:8px 6px;border:1px solid rgba(0,255,136,0.2);background:rgba(0,255,136,0.05);color:rgba(0,255,136,0.5);flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;-webkit-tap-highlight-color:transparent;transition:all .15s;}',
    '.pvp-wpn-btn.active{border-color:#00ff88;background:rgba(0,255,136,0.15);color:#00ff88;box-shadow:0 0 8px rgba(0,255,136,0.3);}',
    '.pvp-ctrl-btn{display:flex;align-items:center;justify-content:center;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:4px;font-size:20px;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;}',
    '@keyframes pvpPhase{0%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1)}}',
    '@keyframes pvpBlockPulse{0%,100%{box-shadow:0 0 8px rgba(0,150,255,0.3)}50%{box-shadow:0 0 20px rgba(0,150,255,0.8)}}',
    '.pvp-block-active{animation:pvpBlockPulse 0.5s infinite!important;}',
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

// ── Экран поворота (как в референсе) ─────────────────────────────
function _pvpShowOrientationGate(onReady) {
  // Inject styles once
  if(!document.getElementById('_pvpGateStyle')){
    var _gs=document.createElement('style');
    _gs.id='_pvpGateStyle';
    _gs.textContent=[
      '@keyframes pvpPhoneRock{',
        '0%{transform:rotate(0deg);}',
        '30%{transform:rotate(-80deg);}',
        '60%{transform:rotate(-80deg);}',
        '90%{transform:rotate(0deg);}',
        '100%{transform:rotate(0deg);}',
      '}',
      '@keyframes pvpGateFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes pvpGateFadeOut{from{opacity:1}to{opacity:0;pointer-events:none}}',
      '#pvpOrientGate{',
        'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;',
        'background:radial-gradient(ellipse at 70% 60%,rgba(120,20,0,0.55) 0%,#000 65%);',
        'display:flex;flex-direction:column;align-items:center;justify-content:center;',
        'gap:0;animation:pvpGateFadeIn .3s ease;',
      '}',
      '#pvpOrientGate .og-icon-wrap{',
        'width:80px;height:80px;margin-bottom:28px;',
        'animation:pvpPhoneRock 2s ease-in-out infinite;',
      '}',
      '#pvpOrientGate .og-icon-wrap svg{width:80px;height:80px;}',
      '#pvpOrientGate .og-title{',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'font-size:22px;font-weight:800;color:#fff;text-align:center;',
        'line-height:1.3;padding:0 32px;margin-bottom:32px;',
      '}',
      '#pvpOrientGate .og-btn{',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'font-size:16px;font-weight:700;color:#000;',
        'background:#fff;border:none;border-radius:50px;',
        'padding:14px 44px;cursor:pointer;',
        '-webkit-tap-highlight-color:transparent;',
        'box-shadow:0 4px 20px rgba(255,255,255,0.15);',
      '}',
      // В landscape — скрываем gate автоматически
      '@media(orientation:landscape){#pvpOrientGate{display:none!important;}}',
    ].join('');
    document.head.appendChild(_gs);
  }

  // Убираем старый gate если есть
  var _old=document.getElementById('pvpOrientGate');
  if(_old)_old.parentNode.removeChild(_old);

  // Уже landscape — сразу запускаем, без gate
  if(window.matchMedia('(orientation:landscape)').matches){
    onReady();
    return;
  }

  var _gate=document.createElement('div');
  _gate.id='pvpOrientGate';
  _gate.innerHTML=
    '<div class="og-icon-wrap">'+
      '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">'+
        // Стрелка сверху-слева
        '<path d="M22 14 C10 14 6 26 6 38" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/>'+
        '<polyline points="14,8 22,14 16,22" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
        // Телефон (вертикальный прямоугольник)
        '<rect x="26" y="16" width="28" height="48" rx="5" stroke="white" stroke-width="3.5" fill="none"/>'+
        '<circle cx="40" cy="58" r="2.5" fill="white"/>'+
        // Стрелка снизу-справа
        '<path d="M58 66 C70 66 74 54 74 42" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/>'+
        '<polyline points="66,72 58,66 64,58" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
      '</svg>'+
    '</div>'+
    '<div class="og-title">Turn your phone<br>sideways for the best<br>game experience</div>'+
    '<button class="og-btn" id="pvpOrientPlayBtn">Let&#39;s play</button>';

  document.body.appendChild(_gate);

  function _dismiss(){
    _gate.style.animation='pvpGateFadeOut .25s ease forwards';
    setTimeout(function(){
      if(_gate.parentNode)_gate.parentNode.removeChild(_gate);
      onReady();
    },250);
  }

  document.getElementById('pvpOrientPlayBtn').addEventListener('click',_dismiss);

  // Бонус: авто-скрыть при повороте (работает вне TG; в TG кнопка Let's play основной способ)
  try{
    var _mql=window.matchMedia('(orientation:landscape)');
    function _onOrient(e){
      if(e.matches){
        try{_mql.removeEventListener('change',_onOrient);}catch(e2){}
        _dismiss();
      }
    }
    _mql.addEventListener('change',_onOrient);
  }catch(e){}
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
  _dmgNums=[];_pvpMoveDir=0;_pvp.camX=0;
  _bossPlayAnim('walk');

  // ── HUD КАК НА РЕФЕРЕНСЕ ────────────────────────────────────────
  var _hudH=44, _ctrlH=72;

  inner.innerHTML=[
    // HUD верхний: [аватар игрока | HP | VS | HP | аватар босса]
    '<div id="pvpHUD" style="display:flex;align-items:center;gap:8px;padding:4px 10px;flex-shrink:0;background:rgba(0,0,0,0.88);border-bottom:1px solid rgba(0,255,136,0.08);height:'+_hudH+'px;box-sizing:border-box;">',
    // Левая часть
    '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">',
      '<div style="width:34px;height:34px;flex-shrink:0;border:2px solid #00ff88;border-radius:4px;background:#1a3a18;display:flex;align-items:center;justify-content:center;overflow:hidden;">',
        '<svg width="26" height="26" viewBox="0 0 16 16" style="image-rendering:pixelated;"><rect x="5" y="1" width="6" height="6" fill="#3d8b37"/><rect x="4" y="2" width="2" height="3" fill="#2a5c26"/><rect x="5" y="7" width="6" height="5" fill="#2a5c26"/><rect x="4" y="9" width="2" height="3" fill="#3d8b37"/><rect x="10" y="9" width="2" height="3" fill="#3d8b37"/><rect x="5" y="12" width="2" height="4" fill="#1e4a1a"/><rect x="9" y="12" width="2" height="4" fill="#1e4a1a"/><rect x="5" y="3" width="2" height="2" fill="#ffdd00"/><rect x="9" y="3" width="2" height="2" fill="#ffdd00"/></svg>',
      '</div>',
      '<div style="flex:1;min-width:0;">',
        '<div style="display:flex;align-items:center;gap:4px;margin-bottom:1px;">',
          '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#00ff88;letter-spacing:1px;font-weight:700;">ВЫ</div>',
          '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:7px;color:rgba(0,255,136,0.4);">LV.1</div>',
          '<div id="pvpBlockIcon" style="font-size:9px;opacity:0;">🛡</div>',
        '</div>',
        '<div style="height:7px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;margin-bottom:1px;">',
          '<div id="pvpPlayerHP" style="height:100%;background:linear-gradient(90deg,#00ff88,#00cc6a);width:100%;transition:width .2s;border-radius:2px;"></div>',
        '</div>',
        '<div id="pvpPlayerHPTxt" style="font-family:\'IBM Plex Mono\',monospace;font-size:8px;color:rgba(0,255,136,0.6);">100/100</div>',
      '</div>',
    '</div>',
    // VS
    '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:rgba(255,255,255,0.3);flex-shrink:0;padding:0 8px;">VS</div>',
    // Правая часть
    '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;justify-content:flex-end;">',
      '<div style="flex:1;min-width:0;text-align:right;">',
        '<div id="pvpBossNameHUD" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:#cc4400;letter-spacing:1px;font-weight:700;margin-bottom:1px;">ТРОЛЛЬ</div>',
        '<div style="height:7px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;margin-bottom:1px;">',
          '<div id="pvpBossHP" style="height:100%;background:linear-gradient(90deg,#e74c3c,#c0392b);width:100%;transition:width .2s;border-radius:2px;"></div>',
        '</div>',
        '<div id="pvpBossHPTxt" style="font-family:\'IBM Plex Mono\',monospace;font-size:9px;color:rgba(231,76,60,0.6);">',bd.hp,'/',bd.hp,'</div>',
      '</div>',
      '<div style="width:34px;height:34px;flex-shrink:0;border:2px solid #cc4400;border-radius:4px;background:#1a0a00;display:flex;align-items:center;justify-content:center;font-size:22px;">👹</div>',
    '</div>',
    '</div>',
    // Phase banner
    '<div id="pvpPhaseBanner" style="position:absolute;top:48px;left:0;right:0;text-align:center;pointer-events:none;z-index:10;display:none;">',
      '<div style="display:inline-block;font-family:\'IBM Plex Mono\',monospace;font-size:18px;font-weight:700;letter-spacing:4px;color:#ff4400;text-shadow:0 0 20px rgba(255,68,0,0.8);background:rgba(0,0,0,0.8);border:1px solid rgba(255,68,0,0.4);border-radius:4px;padding:6px 16px;" id="pvpPhaseTxt">PHASE 2</div>',
    '</div>',
    // Canvas
    '<canvas id="pvpCanvas" style="flex:1;width:100%;display:block;image-rendering:pixelated;touch-action:none;"></canvas>',
    // Контролы нижние
    _pvpBuildWeaponBtns()+
    '<div id="pvpControls" style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px;flex-shrink:0;background:rgba(8,8,8,0.97);border-top:1px solid rgba(255,255,255,0.05);height:'+_ctrlH+'px;box-sizing:border-box;">'+
      '<div style="display:flex;gap:5px;align-items:center;">'+
        '<button style="width:56px;height:56px;background:rgba(50,50,50,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:22px;color:#ccc;cursor:pointer;-webkit-tap-highlight-color:transparent;" onpointerdown="_pvpMove(-1)" onpointerup="_pvpStopMove()" onpointercancel="_pvpStopMove()">&#9664;</button>'+
        '<button style="width:56px;height:56px;background:rgba(50,50,50,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:22px;color:#ccc;cursor:pointer;-webkit-tap-highlight-color:transparent;" onpointerdown="_pvpMove(1)" onpointerup="_pvpStopMove()" onpointercancel="_pvpStopMove()">&#9654;</button>'+
      '</div>'+
      '<div id="pvpWpnRow" style="display:flex;gap:4px;align-items:center;"></div>'+
      '<div style="display:flex;align-items:center;gap:8px;">'+
        '<button style="width:44px;height:44px;background:rgba(30,30,30,0.85);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:18px;cursor:pointer;-webkit-tap-highlight-color:transparent;">💀</button>'+
        '<button style="width:68px;height:68px;background:linear-gradient(145deg,#e74c3c,#c0392b);border:none;border-radius:50%;font-size:28px;cursor:pointer;box-shadow:0 0 24px rgba(231,76,60,0.7),0 4px 12px rgba(0,0,0,0.5);-webkit-tap-highlight-color:transparent;" onpointerdown="_pvpAttack()">&#9876;</button>'+
        '<button style="width:44px;height:44px;background:rgba(50,50,50,0.85);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:18px;color:#ccc;cursor:pointer;-webkit-tap-highlight-color:transparent;" onpointerdown="_pvpJump()">&#11014;</button>'+
      '</div>'+
    '</div>',
  ].join('');

  // ── TG-совместимый запуск ────────────────────────────────────────
  // В Telegram WebApp нельзя position:fixed — используем flex на всю высоту
  var _battleScreen=document.getElementById('s-pvp-battle');
  if(_battleScreen){
    _battleScreen.style.display='flex';
    _battleScreen.style.flexDirection='column';
    _battleScreen.style.width='100%';
    _battleScreen.style.height='100%';
    _battleScreen.style.overflow='hidden';
    _battleScreen.style.background='#000';
  }
  inner.style.display='flex';
  inner.style.flexDirection='column';
  inner.style.width='100%';
  inner.style.height='100%';
  inner.style.flex='1';
  inner.style.overflow='hidden';

  // Ждём 2 rAF — браузер/TG успевает отрендерить DOM и посчитать offsetHeight
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      var canvas=document.getElementById('pvpCanvas');
      var hud=document.getElementById('pvpHUD');
      var ctrl=document.getElementById('pvpControls');
      if(!canvas)return;

      // TG: используем visualViewport если доступен (точнее чем innerHeight в TG)
      var vvW = window.visualViewport ? window.visualViewport.width  : window.innerWidth;
      var vvH = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      PVP_W = vvW;
      var _hudH  = hud  ? hud.offsetHeight  : 44;
      var _ctrlH = ctrl ? ctrl.offsetHeight : 72;
      var _canvasH = Math.max(vvH - _hudH - _ctrlH, 100);

      canvas.width  = PVP_W;
      canvas.height = _canvasH;
      // явно выставляем размер через style тоже
      canvas.style.width  = PVP_W + 'px';
      canvas.style.height = _canvasH + 'px';
      canvas.style.display = 'block';

      PVP_FLOOR = Math.round(_canvasH * 0.82);

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
function _pvpSwitchWeapon(key){_pvp.weapon=key;document.querySelectorAll('.pvp-wpn-btn').forEach(function(b){b.classList.toggle('active',b.id==='wpnBtn_'+key);});}
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
    if(dist<wpn.range){
      var dmg=_rnd(wpn.dmg[0],wpn.dmg[1]);
      _pvpDamageBoss(dmg,true);
      _pvpSpawnParticles(bx,_pvp.boss.y-40,wpn.color,10);
      _bossPlayAnim('hurt',function(){_bossPlayAnim('walk');});
    } else {_pvpShowHint('Подойди ближе!');}
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
  if(kb){var dir=_pvp.boss.x>_pvp.player.x?1:-1;_pvp.boss.knockX=dir*60;}
  if(_pvp.boss.hp<=0){
    _bossPlayAnim('dead');
    // Запускаем отдельный RAF для смерти после остановки основного
    setTimeout(function(){
      if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
      PVP_RUNNING=false;
      var _deadStart=Date.now();
      var _deadCtx=_pvp.ctx,_deadCanvas=_pvp.canvas;
      function _deadLoop(){
        var _elapsed=Date.now()-_deadStart;
        var _fi=Math.min(Math.floor(_elapsed/280),5);
        var _img=BOSS_DEATH_FRAMES[_fi+1];
        if(_deadCtx&&_deadCanvas){
          _deadCtx.clearRect(0,0,_deadCanvas.width,_deadCanvas.height);
          _pvpDrawCaveBG(_deadCtx,_deadCanvas.width,_deadCanvas.height,Date.now());
          if(_img){
            var _bh=Math.round(PVP_FLOOR*0.55);
            var _bw=Math.round(_img.naturalWidth*(_bh/_img.naturalHeight));
            // Не больше половины экрана по ширине
            if(_bw>_deadCanvas.width*0.5){var _s=(_deadCanvas.width*0.5)/_bw;_bw=Math.round(_bw*_s);_bh=Math.round(_bh*_s);}
            _deadCtx.drawImage(_img,0,0,_img.naturalWidth,_img.naturalHeight,
              Math.round(_pvp.boss.x-_bw/2),Math.round(_pvp.boss.y-_bh),_bw,_bh);
          }
        }
        if(_elapsed<1800){requestAnimationFrame(_deadLoop);}
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
  _pvpUpdateHUD();_pvp.screenShake=_pvp.blocking?2:8;
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
function _pvpShowDmgNum(dmg,x,y,color){_dmgNums.push({val:dmg,x:x,y:y,vy:-1.8,life:55,maxLife:55,color:color});}
function _pvpSpawnParticles(x,y,color,count){
  for(var i=0;i<count;i++){var a=Math.random()*Math.PI*2;
    _pvp.particles.push({x:x,y:y,vx:Math.cos(a)*(1+Math.random()*4),vy:Math.sin(a)*(1+Math.random()*4)-2,r:2+Math.random()*3,life:30+Math.random()*20,maxLife:50,color:color});}
}
function _pvpShowHint(txt){if(typeof toast==='function')toast(txt,1000);}

function _pvpWin(){
  if(_pvp.won)return;
  _pvp.won=true;_pvp.over=true;PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  var boss=_pvp.boss.data,time=Math.floor((Date.now()-_pvp.startTime)/1000);
  if(window.S){S.gifts=(S.gifts||0)+boss.reward.gifts;S.grinch=(S.grinch||0)+boss.reward.grinch;if(typeof save==='function')try{save();}catch(e){}}
  setTimeout(function(){_pvpEndScreen(true,boss.reward,time);},700);
}
function _pvpLose(){
  if(_pvp.over)return;_pvp.over=true;PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  setTimeout(function(){_pvpEndScreen(false,null,Math.floor((Date.now()-_pvp.startTime)/1000));},700);
}
function _pvpEndScreen(won,reward,time){
  var inner=document.getElementById('pvpBattleInner');if(!inner)return;
  inner.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;gap:16px;text-align:center;background:radial-gradient(circle at center,'+(won?'rgba(0,255,136,0.05)':'rgba(231,76,60,0.05)')+',#000);">'
    +'<div style="font-size:72px;">'+(won?'🏆':'💀')+'</div>'
    +'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:26px;font-weight:700;letter-spacing:4px;color:'+(won?'#00ff88':'#e74c3c')+';text-shadow:0 0 24px '+(won?'rgba(0,255,136,0.8)':'rgba(231,76,60,0.8)')+';">'+(won?'ПОБЕДА!':'ПОРАЖЕНИЕ')+'</div>'
    +'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:rgba(255,255,255,0.3);">⏱ '+time+' секунд</div>'
    +(won&&reward?'<div style="display:flex;gap:10px;"><div style="font-family:\'IBM Plex Mono\',monospace;font-size:13px;font-weight:700;color:#00ff88;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:4px;padding:8px 14px;">🎁 +'+reward.gifts+'</div><div style="font-family:\'IBM Plex Mono\',monospace;font-size:13px;font-weight:700;color:#ffd700;background:rgba(255,215,0,0.06);border:1px solid rgba(255,215,0,0.2);border-radius:4px;padding:8px 14px;">🟢 +'+reward.grinch+' GRINCH</div></div>':'')
    +'<div style="display:flex;gap:8px;width:100%;margin-top:8px;">'
    +'<button class="pvp-btn" onclick="_pvpStartBoss()" style="flex:1;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#000;font-weight:900;">🔄 СНОВА</button>'
    +'<button class="pvp-btn" onclick="show(\'pvp\');" style="flex:1;background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);">🏠 МЕНЮ</button>'
    +'</div></div>';
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
  _pvp.camX+=(_tcam-_pvp.camX)*0.12;
  var _cx=Math.round(_pvp.camX);
  ctx.save();ctx.translate(sx-_cx,sy2);ctx.clearRect(_cx-10,-10,W+20,H+20);

  // ФОН ПЕЩЕРЫ
  _pvpDrawCaveBG(ctx,W,H,now);
  _pvpDrawFloor(ctx,W,H);

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
  if(_pvp.boss.hp>0||_bossAnim.cur==='dead')_bossDrawSprite(ctx,_pvp.boss.x,_pvp.boss.y);
  if(_bossAnim.cur==='dead'){
    ctx.save();
    ctx.fillStyle='red';
    ctx.font='bold 40px monospace';
    ctx.fillText('DEAD fi='+_bossAnim.frameIdx+' f='+JSON.stringify(BOSS_DEATH_FRAMES.map(function(x){return x?1:0;})), 10, 100);
    ctx.restore();
  }



  // Частицы
  _pvp.particles=_pvp.particles.filter(function(p){
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;if(p.life<=0)return false;
    ctx.globalAlpha=p.life/p.maxLife;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.globalAlpha=1;return true;
  });

  // Цифры урона
  _dmgNums=_dmgNums.filter(function(d){
    d.y+=d.vy;d.life--;if(d.life<=0)return false;
    ctx.globalAlpha=d.life/d.maxLife;ctx.font='bold 15px "IBM Plex Mono",monospace';
    ctx.fillStyle=d.color;ctx.shadowColor=d.color;ctx.shadowBlur=6;
    ctx.fillText('-'+d.val,d.x-12,d.y);ctx.shadowBlur=0;ctx.globalAlpha=1;return true;
  });

  ctx.restore();
  PVP_RAF=requestAnimationFrame(_pvpLoop);
}

// ── ПЕЩЕРНЫЙ ФОН ─────────────────────────────────────────────────
function _pvpDrawCaveBG(ctx,W,H,now){
  // Тёмный фон
  var bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#040c05');bg.addColorStop(0.5,'#060f07');bg.addColorStop(1,'#020803');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // Каменная стена — горизонтальные ряды
  var bH=20,bW=42;
  for(var r=0;r<Math.ceil(H*0.85/bH);r++){
    var ry=r*bH,off=(r%2)*(bW/2);
    for(var c=-1;c<Math.ceil(W/bW)+1;c++){
      var bx=c*bW+off;
      ctx.strokeStyle='rgba(0,25,8,0.9)';ctx.lineWidth=1;
      ctx.strokeRect(bx+1,ry+1,bW-2,bH-2);
    }
  }

  // Сталактиты сверху
  var stalH=[35,22,42,18,30,45,25,38,20,34,28,40,15,33];
  stalH.forEach(function(sh,i){
    var sx2=Math.round(W*(i+0.5)/stalH.length);
    var sw2=5+Math.sin(i*1.7)*2;
    ctx.fillStyle='#060f07';
    ctx.beginPath();
    ctx.moveTo(sx2-sw2,0);ctx.lineTo(sx2+sw2,0);
    ctx.lineTo(sx2,sh);ctx.closePath();ctx.fill();
    // капля
    ctx.fillStyle='rgba(0,120,40,0.4)';
    ctx.beginPath();ctx.arc(sx2,sh,2,0,Math.PI*2);ctx.fill();
  });

  // Факелы — 3 штуки, высоко на стене
  var torchY=Math.round(H*0.32);
  [0.25,0.5,0.75].forEach(function(xp,i){
    var tx=Math.round(W*xp);
    var fl=Math.sin(now/110+i*1.9)*2+Math.sin(now/70+i)*1.5;

    // Кронштейн
    ctx.fillStyle='#2a1a08';
    ctx.fillRect(tx-2,torchY,4,10);
    ctx.fillRect(tx-5,torchY+8,10,3);

    // Свечение на стене (широкое, мягкое)
    var wallG=ctx.createRadialGradient(tx,torchY,3,tx,torchY,55);
    wallG.addColorStop(0,'rgba(0,160,50,0.18)');wallG.addColorStop(1,'rgba(0,80,20,0)');
    ctx.fillStyle=wallG;ctx.fillRect(tx-55,torchY-20,110,75);

    // Пламя внешнее
    var fg=ctx.createRadialGradient(tx,torchY+fl,1,tx,torchY+fl,14+Math.abs(fl));
    fg.addColorStop(0,'rgba(0,255,80,0.85)');fg.addColorStop(0.4,'rgba(0,180,50,0.5)');fg.addColorStop(1,'rgba(0,80,20,0)');
    ctx.fillStyle=fg;
    ctx.beginPath();ctx.ellipse(tx,torchY+fl,9+Math.abs(fl)*0.5,14+Math.abs(fl),0,0,Math.PI*2);ctx.fill();

    // Ядро
    var fc=ctx.createRadialGradient(tx,torchY+2+fl,0,tx,torchY+2+fl,5);
    fc.addColorStop(0,'rgba(220,255,220,1)');fc.addColorStop(0.5,'rgba(0,255,100,0.9)');fc.addColorStop(1,'rgba(0,200,60,0)');
    ctx.fillStyle=fc;ctx.beginPath();ctx.ellipse(tx,torchY+2+fl,3,7,0,0,Math.PI*2);ctx.fill();
  });

  // Цепи — тонкие, только по бокам, не на весь экран
  [[W*0.07],[W*0.93]].forEach(function(arr,ci){
    var cx=Math.round(arr[0]);
    var sway=Math.sin(now/1500+ci)*2;
    for(var l=0;l<7;l++){
      var ly=l*16;
      ctx.strokeStyle=l%2===0?'#2a2a12':'#1e1e0c';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(cx+sway,ly+8,4,7,0,0,Math.PI*2);ctx.stroke();
    }
    // Маленькая клетка внизу цепи
    ctx.strokeStyle='#2a2a12';ctx.lineWidth=1;
    ctx.strokeRect(cx+sway-7,7*16,14,14);
  });

  // Арка входа/окна (тёмный проём) по центру-правой части
  ctx.fillStyle='rgba(0,8,2,0.7)';
  ctx.beginPath();
  ctx.arc(W*0.78,H*0.35,32,Math.PI,0,false);
  ctx.rect(W*0.78-32,H*0.35,64,50);ctx.fill();
  ctx.strokeStyle='rgba(0,60,20,0.5)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(W*0.78,H*0.35,32,Math.PI,0,false);ctx.stroke();

  // Мох — вертикальные полосы на стене
  for(var m=0;m<6;m++){
    ctx.fillStyle='rgba(0,'+(60+m*8)+',15,0.1)';
    ctx.fillRect(W*m/5+W*0.05,H*0.15,2+Math.sin(m)*1,H*0.55);
  }

  // Зелёное свечение снизу (у пола)
  var botG=ctx.createLinearGradient(0,H*0.78,0,H*0.85);
  botG.addColorStop(0,'rgba(0,100,30,0)');botG.addColorStop(1,'rgba(0,140,40,'+(0.06+Math.sin(now/900)*0.03)+')');
  ctx.fillStyle=botG;ctx.fillRect(0,H*0.78,W,H*0.07);
}

function _pvpDrawFloor(ctx,W,H){
  var fy=PVP_FLOOR;
  ctx.fillStyle='#08100a';ctx.fillRect(0,fy,W,H-fy);
  // Плиты
  var tw=52;
  for(var t=0;t<Math.ceil(W/tw);t++){
    ctx.strokeStyle='rgba(0,35,10,0.9)';ctx.lineWidth=1;
    ctx.strokeRect(t*tw+1,fy+1,tw-2,16);
  }
  // Линия края — зелёный glow
  ctx.shadowColor='rgba(0,200,60,0.5)';ctx.shadowBlur=10;
  ctx.strokeStyle='rgba(0,180,50,0.6)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,fy);ctx.lineTo(W,fy);ctx.stroke();
  ctx.shadowBlur=0;

  // Подарки у пола — маленькие, не мешают
  var gifts=[
    {x:0.38,s:0.55,c:'#cc0000',r:'#ff3333'},
    {x:0.43,s:0.45,c:'#006600',r:'#00aa00'},
    {x:0.62,s:0.5, c:'#0044aa',r:'#0066dd'},
    {x:0.66,s:0.4, c:'#880044',r:'#cc0066'},
  ];
  gifts.forEach(function(g){
    var gx=Math.round(W*g.x);
    var gs=Math.round(12*g.s);
    ctx.fillStyle=g.c;ctx.fillRect(gx-gs,fy-gs*2,gs*2,gs*2);
    ctx.fillStyle=g.r;ctx.fillRect(gx-gs,fy-gs*2,gs*2,Math.round(gs*0.3));
    ctx.fillStyle='#ffd700';
    ctx.fillRect(gx-1,fy-gs*2,3,gs*2);
    ctx.fillRect(gx-gs,fy-gs-1,gs*2,3);
  });
}

// ── ИГРОК ────────────────────────────────────────────────────────
function _pvpDrawPlayer(ctx,p){
  var x=Math.round(p.x),y=Math.round(p.y);
  ctx.save();
  if(p.dir<0){ctx.scale(-1,1);x=-x;}
  if(_pvp.blocking){ctx.shadowColor='#0096ff';ctx.shadowBlur=16;}
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
