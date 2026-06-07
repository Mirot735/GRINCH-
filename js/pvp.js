// ═══════════════════════════════════════════════════════════════
// GRINCH GAME — pvp.js v4.2
// boss_troll.png      → 612×408, 4cols×2rows, кадр 153×204
// boss_troll_idle.png → 1774×887, 4cols×1row, кадр 443×887
//
// ИНТЕГРАЦИЯ map_tiles.js:
// Подключи map_tiles.js ДО этого файла в HTML:
//   <script src="map_tiles.js"></script>
//   <script src="pvp.js"></script>
// ═══════════════════════════════════════════════════════════════
'use strict';

// Безопасный fallback — если map_tiles.js не подключён
if (typeof window._MT === 'undefined') { window._MT = { ready: false }; }
if (typeof window._pvpDrawMapTiles === 'undefined') { window._pvpDrawMapTiles = null; }

var PVP_W = 0, PVP_H = 0, PVP_FLOOR = 0;
var PVP_WORLD_W = 0; // ширина мирового пространства арены (3× экрана)
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

// ── BOSS SPRITES & ANIMATION — см. pvp_map_patch.js ───────────────

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
    '@keyframes pvpPhase{0%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1)}}',
    '@keyframes pvpNeonPulse{0%,100%{box-shadow:0 0 6px rgba(0,255,136,0.5),0 0 14px rgba(0,255,136,0.2)}50%{box-shadow:0 0 10px rgba(0,255,136,0.8),0 0 22px rgba(0,255,136,0.35)}}',
    '@keyframes pvpAtkPulse{0%,100%{box-shadow:0 0 16px rgba(255,60,80,0.50),0 0 36px rgba(255,60,80,0.18)}50%{box-shadow:0 0 24px rgba(255,60,80,0.80),0 0 52px rgba(255,60,80,0.35)}}',
    /* Зональное управление */
    '#pvpControls{position:absolute;inset:0;pointer-events:none;z-index:20;}',
    '#pvpZoneLeft{position:absolute;left:0;top:0;width:50%;height:100%;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:none;}',
    '#pvpZoneRight{position:absolute;right:0;top:0;width:50%;height:100%;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:none;}',
    /* Кнопки атаки и прыжка */
    '#pvpAtkBtn{position:absolute;bottom:24px;right:24px;width:82px;height:82px;border-radius:50%;background:rgba(6,0,2,0.55);border:2px solid rgba(255,60,80,0.55);box-shadow:0 0 14px rgba(255,60,80,0.40),inset 0 0 10px rgba(255,60,80,0.06);font-size:34px;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);touch-action:none;pointer-events:auto;}',
    '#pvpJumpBtn{position:absolute;bottom:120px;right:28px;width:50px;height:50px;border-radius:50%;background:rgba(0,8,4,0.55);border:1.5px solid rgba(0,255,136,0.45);box-shadow:0 0 8px rgba(0,255,136,0.28),inset 0 0 6px rgba(0,255,136,0.05);font-size:18px;color:rgba(0,255,136,0.80);cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);touch-action:none;pointer-events:auto;}',
    /* Ripple анимация при тапе */
    '@keyframes pvpRipple{0%{transform:translate(-50%,-50%) scale(0);opacity:0.6;}100%{transform:translate(-50%,-50%) scale(1);opacity:0;}}',
    '.pvp-ripple{position:absolute;width:90px;height:90px;border-radius:50%;background:rgba(0,255,136,0.18);border:1.5px solid rgba(0,255,136,0.35);pointer-events:none;animation:pvpRipple 0.4s ease-out forwards;}',
    '#pvpAtkBtn:active{transform:scale(0.88);box-shadow:0 0 24px rgba(255,60,80,0.80),inset 0 0 14px rgba(255,60,80,0.15);}',
    '#pvpJumpBtn:active{transform:scale(0.88);background:rgba(0,255,136,0.18);border-color:rgba(0,255,136,0.90);}',
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
  PVP_WORLD_W = PVP_W * 3;  // мировая ширина арены
  _pvp.boss={x:PVP_WORLD_W*0.82,y:0,hp:bd.hp,maxHp:bd.hp,w:80,h:110,data:bd,
    state:'idle',knockX:0,facingRight:false,phase:0,windupTimer:0,windupActive:false};
  _pvp.player={x:PVP_WORLD_W*0.12,y:0,hp:100,maxHp:100,w:36,h:56,vx:0,vy:0,
    onGround:true,dir:1,state:'idle'};
  _pvp.projectiles=[];_pvp.waves=[];_pvp.particles=[];
  _pvp.lastAtk=0;_pvp.lastBossAtk=0;_pvp.lastWave=0;_pvp.attackAnim=0;
  _pvp.over=false;_pvp.won=false;_pvp.startTime=Date.now();
  _pvp.dmgDealt=0;_pvp.hitCount=0;
  _pvp.phase=0;_pvp.phaseShown=-1;_pvp.blocking=false;
  _pvp.lastFrame=Date.now();_pvp.screenShake=0;
  _pvp.bossHitFlash=0;_pvp.playerHitFlash=0;_pvp.impactRings=[];_pvp.screenRedFlash=0;
  _dmgNums=[];_pvpMoveDir=0;_slashFX=[];
  // Инит камеры — сразу ставим на игрока чтобы не было прыжка
  _pvp.camX = Math.max(0, Math.min(PVP_WORLD_W - PVP_W, PVP_WORLD_W * 0.12 - PVP_W * 0.4));
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
  );

  

  // ── Controls — вешаем на #s-pvp-battle как position:absolute ────
  // position:fixed ломается если у предка есть transform (TG WebApp).
  // Вешаем на сам экран боя — он position:fixed/.screen без transform.
  setTimeout(function(){
    var _oldCtrl = document.getElementById('pvpControls');
    if (_oldCtrl) _oldCtrl.parentNode.removeChild(_oldCtrl);

    var _battleEl = document.getElementById('s-pvp-battle');
    if (!_battleEl) return;

    // Убедимся что s-pvp-battle — positioned контейнер
    _battleEl.style.position = 'relative';

    var _ctrl = document.createElement('div');
    _ctrl.id = 'pvpControls';
    _ctrl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';

    // Левая зона — движение (50% ширины, полная высота)
    var _zl = document.createElement('div');
    _zl.id = 'pvpZoneLeft';
    _zl.style.cssText = 'position:absolute;left:0;top:0;width:35%;height:100%;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:none;';
    _ctrl.appendChild(_zl);

    // Кнопка прыжка
    var _jBtn = document.createElement('button');
    _jBtn.id = 'pvpJumpBtn';
    _jBtn.innerHTML = '&#11014;';
    _jBtn.style.cssText = 'position:absolute;bottom:120px;right:28px;width:50px;height:50px;border-radius:50%;background:rgba(0,8,4,0.55);border:1.5px solid rgba(0,255,136,0.45);box-shadow:0 0 8px rgba(0,255,136,0.28);font-size:18px;color:rgba(0,255,136,0.80);cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;touch-action:none;pointer-events:auto;';
    _jBtn.addEventListener('pointerdown', function(e){ e.preventDefault(); _pvpJump(); }, {passive:false});
    _ctrl.appendChild(_jBtn);

    // Кнопка атаки
    var _aBtn = document.createElement('button');
    _aBtn.id = 'pvpAtkBtn';
    _aBtn.innerHTML = '⚔️';
    _aBtn.style.cssText = 'position:absolute;bottom:24px;right:24px;width:82px;height:82px;border-radius:50%;background:rgba(6,0,2,0.55);border:2px solid rgba(255,60,80,0.55);box-shadow:0 0 14px rgba(255,60,80,0.40);font-size:34px;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;touch-action:none;pointer-events:auto;';
    _aBtn.addEventListener('pointerdown', function(e){ e.preventDefault(); _pvpAttack(); }, {passive:false});
    _ctrl.appendChild(_aBtn);

    _battleEl.appendChild(_ctrl);
    // Инит джойстика — зона и контейнер уже в DOM
    _pvpInitJoystick();
  }, 50);

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

      canvas.style.display = 'block';
      canvas.style.position = 'relative';
      canvas.style.left = '0';
      canvas.width         = vvW;
      canvas.height        = _canvasH;
      canvas.style.width   = vvW + 'px';
      canvas.style.height  = _canvasH + 'px';

      PVP_W   = vvW;
      PVP_H   = _canvasH;
      PVP_WORLD_W = vvW * 3;   // арена в 3× шире экрана
      // В портрете делаем пол ниже (0.78) чтобы был виден край арены
      var _isPortrait = _canvasH > vvW;
      var _floorY = Math.round(_canvasH * (_isPortrait ? 0.78 : 0.72));
      var _ts     = Math.round(vvW / 10);
      PVP_FLOOR = _floorY - _ts;  // верх мхового ряда — реальная поверхность

      _pvp.boss.x   = PVP_WORLD_W * 0.82;
      _pvp.player.x = PVP_WORLD_W * 0.12;
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

// ── ВИРТУАЛЬНЫЙ ДЖОЙСТИК ─────────────────────────────────────────────
function _pvpInitJoystick(){
  var zoneL = document.getElementById('pvpZoneLeft');
  if(!zoneL) return;

  // ── Левая зона — движение ────────────────────────────────────────
  // Поддержка мультитач: несколько пальцев одновременно
  var _lPids = {}; // pointerId → направление

  function _spawnRipple(zone, x, y){
    var r = document.createElement('div');
    r.className = 'pvp-ripple';
    var rect = zone.getBoundingClientRect();
    r.style.left = (x - rect.left) + 'px';
    r.style.top  = (y - rect.top)  + 'px';
    zone.appendChild(r);
    setTimeout(function(){ if(r.parentNode) r.parentNode.removeChild(r); }, 420);
  }

  function _updateMoveFromPids(){
    // Если хоть один палец есть — берём последний
    var pids = Object.keys(_lPids);
    if(pids.length === 0){ _pvpStopMove(); return; }
    var last = _lPids[pids[pids.length-1]];
    _pvpMove(last);
  }

  zoneL.addEventListener('pointerdown', function(e){
    e.preventDefault();
    zoneL.setPointerCapture(e.pointerId);
    var rect = zoneL.getBoundingClientRect();
    var mid  = rect.left + rect.width / 2;
    var dir  = e.clientX < mid ? -1 : 1;
    _lPids[e.pointerId] = dir;
    _updateMoveFromPids();
    _spawnRipple(zoneL, e.clientX, e.clientY);
  }, {passive:false});

  zoneL.addEventListener('pointermove', function(e){
    if(!_lPids.hasOwnProperty(e.pointerId)) return;
    e.preventDefault();
    var rect = zoneL.getBoundingClientRect();
    var mid  = rect.left + rect.width / 2;
    _lPids[e.pointerId] = e.clientX < mid ? -1 : 1;
    _updateMoveFromPids();
  }, {passive:false});

  function _lUp(e){
    delete _lPids[e.pointerId];
    _updateMoveFromPids();
  }
  zoneL.addEventListener('pointerup',     _lUp);
  zoneL.addEventListener('pointercancel', _lUp);
}

function _pvpAttack(){
  if(_pvp.over||_pvp.blocking)return;
  var now=Date.now(),wpn=PVP_WEAPONS[_pvp.weapon];
  if(now-_pvp.lastAtk<wpn.cooldown)return;
  _pvp.lastAtk=now;
  // Запускаем анимацию атаки
  _pvp.player.state='attack';
  _pvp.attackAnim=30; // ~30 кадров = ~0.5 сек
  _heroSpecialLocked=false; // сбрасываем special если была
  _heroAnim.mode='attack'; _heroAnim.frame=0; _heroAnim.timer=0;
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
  _pvp.dmgDealt=((_pvp.dmgDealt||0)+dmg);
  _pvp.hitCount=((_pvp.hitCount||0)+1);
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
          _pvpDrawCaveBG(_deadCtx,_W,_H,Date.now(),_frozenCamX);
          var _darkAlpha=Math.min(0.45,_elapsed/1100*0.45);_deadCtx.fillStyle='rgba(0,0,0,'+_darkAlpha.toFixed(3)+')';_deadCtx.fillRect(0,0,_W,_H);
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

// ── REWARD SEQUENCE — см. pvp_map_patch.js ─────────────────────────

function _pvpRemoveControls(){var c=document.getElementById("pvpControls");if(c&&c.parentNode)c.parentNode.removeChild(c);}
function _pvpLose(){
  if(_pvp.over)return;_pvp.over=true;PVP_RUNNING=false;
  if(PVP_RAF){cancelAnimationFrame(PVP_RAF);PVP_RAF=null;}
  _pvpRemoveControls();
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
  var _tcam = _pvp.player.x - PVP_W * 0.4;  // держим игрока на 40% от левого края
  _tcam = Math.max(0, Math.min(PVP_WORLD_W - PVP_W, _tcam));  // зажим по миру
  _pvp.camX+=(_tcam-_pvp.camX)*0.10;   // плавный follow
  var _cx=Math.round(_pvp.camX);
  // Очищаем и рисуем фон БЕЗ сдвига камеры — фон всегда на весь canvas
  ctx.save();
  ctx.clearRect(0,0,W,H);
  _pvpDrawCaveBG(ctx,W,H,now,_pvp.camX);
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
    return p.x>-30&&p.x<PVP_WORLD_W+30&&p.y<H+30;
  });

  // Волны
  _pvp.waves=_pvp.waves.filter(function(w){
    w.x+=w.vx;w.life--;
    if(w.owner!=='player'&&Math.abs(w.x-_pvp.player.x)<w.w/2+15&&_pvp.player.onGround){_pvpDamagePlayer(_rnd(5,12));return false;}
    ctx.save();ctx.globalAlpha=w.life/w.maxL;ctx.fillStyle=w.color;ctx.shadowColor=w.color;ctx.shadowBlur=12;
    ctx.fillRect(w.x-w.w/2,w.y-w.h,w.w,w.h);ctx.fillRect(w.x-w.w/2-8,w.y-w.h*0.6,8,w.h*0.6);ctx.fillRect(w.x+w.w/2,w.y-w.h*0.6,8,w.h*0.6);
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    return w.life>0&&w.x>-50&&w.x<PVP_WORLD_W+50;
  });

  // Тик анимации атаки
  if(_pvp.attackAnim>0){
    _pvp.attackAnim--;
    if(_pvp.attackAnim<=0){ _pvp.player.state='idle'; }
  }

  // Движение
  if(_pvpMoveDir!==0&&!_pvp.blocking&&!_pvp.over){
    _pvp.player.x+=_pvpMoveDir*3.5;
    _pvp.player.x=Math.max(20,Math.min(PVP_WORLD_W-30,_pvp.player.x));
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


// _pvpDrawCaveBG определена в pvp_map_patch.js (подключён до этого файла)

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
// ── HERO SPRITES — отдельные PNG из assets/hero/ ────────────────
// walk_frame_01..07  — ходьба/idle
// attack_flame_01..07 — атака (01-03 замах, 04 удар с эффектами, 05 нижняя стойка, 06 удар, 07 к стойке)
// special_flame_01..05 + special_frame_06 — спецудар/прыжок
//   01 готовность, 02 прыжок, 03 приземление+удар, 04 удар прямо, 05 красивая анимация, 06 стойка
var _HS = { walk: [], attack: [], special: [] };
var _heroAnim = { mode: 'walk', frame: 0, timer: 0 };
// флаг: special анимация играет (не прерывать пока не закончится)
var _heroSpecialLocked = false;
// какие кадры special уже стрельнули эффект (чтобы не повторять)
var _heroSpecialFiredFx = { f3: false, f4: false, f5: false };

(function(){
  function _load(src, arr){ var img=new Image(); img.onload=function(){arr.push(img);}; img.onerror=function(){arr.push(null);}; img.src=src; }
  for(var i=1;i<=7;i++) _load('assets/hero/walk_frame_0'+i+'.png', _HS.walk);
  ['attack_flame_01','attack_flame_02','attack_flame_03',
   'attack_flame_04','attack_flame_05','attack_flame_06','attack_flame_07'
  ].forEach(function(n){ _load('assets/hero/'+n+'.png', _HS.attack); });
  ['special_flame_01','special_flame_02','special_flame_03',
   'special_flame_04','special_flame_05','special_frame_06'
  ].forEach(function(n){ _load('assets/hero/'+n+'.png', _HS.special); });
})();

function _pvpDrawPlayer(ctx,p){
  var x=Math.round(p.x), y=Math.round(p.y);

  // ── Тень ────────────────────────────────────────────────────────
  ctx.save();
  var _shadowY=PVP_FLOOR, _airDist=Math.max(0,_shadowY-p.y);
  var _ss=Math.max(0.45,1-_airDist*0.008), _sa=Math.max(0.18,0.52-_airDist*0.005);
  var _sw=Math.round(20*_ss), _sh=Math.round(5*_ss);
  ctx.globalAlpha=_sa*0.30; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(x,_shadowY,_sw+5,_sh+3,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=_sa*0.55;
  ctx.beginPath(); ctx.ellipse(x,_shadowY,_sw,_sh,0,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=_sa*0.80;
  ctx.beginPath(); ctx.ellipse(x,_shadowY,Math.round(_sw*0.55),Math.round(_sh*0.7),0,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // ── Выбираем набор кадров ────────────────────────────────────────
  // Определяем режим анимации
  // special_flame:  0=готовность, 1=прыжок, 2=приземление(03), 3=удар(04), 4=красивая(05), 5=стойка(06)
  var wantMode;
  if(!p.onGround){
    wantMode='special';
    // При взлёте — запускаем special заново только если не играет
    if(_heroAnim.mode!=='special'){ _heroSpecialLocked=true; _heroSpecialFiredFx={f3:false,f4:false,f5:false}; _heroAnim.mode='special'; _heroAnim.frame=0; _heroAnim.timer=0; }
  } else if(_heroSpecialLocked){
    // Приземлились — прыгаем на кадр 2 (03-приземление) если ещё на кадрах 0-1
    wantMode='special';
    if(_heroAnim.frame < 2){ _heroAnim.frame=2; _heroAnim.timer=0; }
  } else if(p.state==='attack'||_pvp.attackAnim>0){
    wantMode='attack';
  } else {
    wantMode='walk';
  }

  if(_heroAnim.mode !== wantMode){
    _heroAnim.mode  = wantMode;
    _heroAnim.frame = 0;
    _heroAnim.timer = 0;
  }

  var frames = _HS[_heroAnim.mode] || _HS.walk;
  // Атака — быстрее (fps 14), ходьба — 8, спецудар — 10
  var fps = wantMode==='attack' ? 14 : (wantMode==='special' ? 10 : 8);
  // Только walk зацикливается; attack и special — до конца, держат последний кадр
  var loopAnim = (wantMode === 'walk');

  // ── Тик анимации ─────────────────────────────────────────────────
  // В воздухе: держим кадр 1 (прыжок) пока не приземлимся
  var _holdInAir = (wantMode==='special' && !p.onGround && _heroAnim.frame >= 1);

  _heroAnim.timer++;
  if(_heroAnim.timer >= Math.round(60/fps)){
    _heroAnim.timer = 0;
    if(loopAnim){
      _heroAnim.frame = (_heroAnim.frame+1) % frames.length;
    } else if(_holdInAir){
      _heroAnim.frame = 1; // держим кадр прыжка пока в воздухе
    } else {
      if(_heroAnim.frame < frames.length-1){
        _heroAnim.frame++;
      } else {
        // special закончила — снимаем лок, следующий тик вернёт walk
        if(wantMode==='special'){ _heroSpecialLocked=false; }
      }
    }
  }

  // ── Эффекты special по кадрам ──────────────────────────────────
  if(wantMode==='special'){
    var _spx=_pvp.player.x, _spy=_pvp.player.y;
    var _bdir=_pvp.player.dir;
    // Кадр 2 (03) — приземление: земляной удар, shockwave по полу
    if(_heroAnim.frame===2 && !_heroSpecialFiredFx.f3){
      _heroSpecialFiredFx.f3=true;
      _pvp.screenShake=Math.max(_pvp.screenShake,10);
      // Земляные частицы в стороны
      for(var _ei=0;_ei<18;_ei++){
        var _ea=Math.PI+(Math.random()-0.5)*1.2; // в стороны по полу
        var _es=3+Math.random()*6;
        _pvp.particles.push({x:_spx,y:_spy,vx:Math.cos(_ea)*_es,vy:Math.sin(_ea)*_es-1,
          r:2+Math.random()*3,life:28+Math.random()*18,maxLife:46,color:Math.random()<0.5?'#a07040':'#c8a060'});
      }
      // Две волны в стороны
      _pvp.waves.push({x:_spx,y:PVP_FLOOR-4,vx: 4.5,w:22,h:10,life:45,maxL:45,color:'#c89050',owner:'player'});
      _pvp.waves.push({x:_spx,y:PVP_FLOOR-4,vx:-4.5,w:22,h:10,life:45,maxL:45,color:'#c89050',owner:'player'});
      // Кольцо удара
      if(_pvp.impactRings){
        _pvp.impactRings.push({x:_spx,y:_spy-8,r:0,maxR:55,life:14,maxLife:14,color:'rgba(200,160,80,0.9)'});
      }
    }
    // Кадр 3 (04) — удар прямо: slash + урон
    if(_heroAnim.frame===3 && !_heroSpecialFiredFx.f4){
      _heroSpecialFiredFx.f4=true;
      _pvp.screenShake=Math.max(_pvp.screenShake,8);
      _spawnSlashFX(_spx+_bdir*34, _spy-42, _bdir, 'sword', false);
      _pvpSpawnParticles(_spx+_bdir*30,_spy-40,'#00ff88',8);
      _pvpSpawnParticles(_spx+_bdir*30,_spy-40,'#ffffff',4);
      if(_pvp.impactRings){
        _pvp.impactRings.push({x:_spx+_bdir*30,y:_spy-44,r:0,maxR:44,life:10,maxLife:10,color:'rgba(0,255,136,0.8)'});
      }
      // Урон если рядом с боссом
      if(Math.abs(_pvp.boss.x-_spx)<110){
        var _sd4=_rnd(18,28);
        _pvpDamageBoss(_sd4,true);
        _bossPlayAnim('hurt',function(){_bossPlayAnim('walk');});
      }
    }
    // Кадр 4 (05) — красивый удар: crit slash + сильный эффект
    if(_heroAnim.frame===4 && !_heroSpecialFiredFx.f5){
      _heroSpecialFiredFx.f5=true;
      _pvp.screenShake=Math.max(_pvp.screenShake,13);
      _spawnSlashFX(_spx+_bdir*38, _spy-50, _bdir, 'scythe', true);
      _pvpSpawnParticles(_spx+_bdir*36,_spy-50,'#ffcc00',12);
      _pvpSpawnParticles(_spx+_bdir*36,_spy-50,'#ff8800',7);
      _pvpSpawnParticles(_spx+_bdir*36,_spy-50,'#ffffff',5);
      if(_pvp.impactRings){
        _pvp.impactRings.push({x:_spx+_bdir*36,y:_spy-52,r:0,maxR:70,life:14,maxLife:14,color:'rgba(255,200,0,0.9)'});
        _pvp.impactRings.push({x:_spx+_bdir*36,y:_spy-52,r:0,maxR:42,life:10,maxLife:10,color:'rgba(255,255,255,0.6)'});
      }
      // Урон если рядом с боссом (более сильный)
      if(Math.abs(_pvp.boss.x-_spx)<120){
        var _sd5=_rnd(28,42);
        _pvpDamageBoss(_sd5,true);
        _bossPlayAnim('hurt',function(){_bossPlayAnim('walk');});
      }
    }
  }

  // ── Рисуем кадр ─────────────────────────────────────────────────
  var img=frames[_heroAnim.frame];
  ctx.save();
  if(_pvp.blocking){ctx.shadowColor='#0096ff';ctx.shadowBlur=20;}
  else{ctx.shadowColor='rgba(0,255,100,0.7)';ctx.shadowBlur=14;}

  // Если текущий кадр не готов — ищем ближайший готовый кадр назад
  if(!img || !img.complete || !img.naturalWidth){
    for(var _fi2=_heroAnim.frame-1;_fi2>=0;_fi2--){
      if(frames[_fi2]&&frames[_fi2].complete&&frames[_fi2].naturalWidth){img=frames[_fi2];break;}
    }
  }
  if(img && img.complete && img.naturalWidth>0){
    var dstH = 100; // высота персонажа в пикселях
    var dstW = Math.round(img.naturalWidth * (dstH / img.naturalHeight));
    var dstX = x - Math.round(dstW / 2);
    var dstY = y - dstH;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if(p.dir < 0){ ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, dstX, dstY, dstW, dstH);
    ctx.restore();
  }
  // Fallback убран — не рисуем зелёного чела если PNG не загружен
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
  PVP_WORLD_W = vvW * 3;
  var _isPortrait2 = _canvasH > vvW;
  var _floorY2 = Math.round(_canvasH * (_isPortrait2 ? 0.78 : 0.72));
  PVP_FLOOR = _floorY2 - Math.round(vvW / 10);

  // Пересчитываем позиции
  if(_pvp.player){ _pvp.player.y = PVP_FLOOR; }
  if(_pvp.boss)  { _pvp.boss.y   = PVP_FLOOR; _pvp.boss.x = PVP_WORLD_W * 0.82; }
}

window.addEventListener('resize', function(){
  // Небольшой debounce чтобы не дёргать на каждый px
  clearTimeout(window._pvpResizeTimer);
  window._pvpResizeTimer = setTimeout(_pvpResizeCanvas, 150);
});
