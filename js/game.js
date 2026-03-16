// ══════════════════════════════════════════════════════
// МУЗЫКА — MP3 файлы
// ══════════════════════════════════════════════════════
let menuAudio = null;
let gameAudio = null;
let gameFastAudio = null;
let currentTrack = null;
let musicEnabled = true;

// ── Инициализируем объекты Audio СРАЗУ (без play) ───────
// Браузер разрешает создавать Audio без жеста, но play() — только после
function initAudio() {
  if (menuAudio) return; // уже инициализированы
  menuAudio     = new Audio('assets/audio/menu.mp3');
  gameAudio     = new Audio('assets/audio/game.mp3');
  gameFastAudio = new Audio('assets/audio/game_fast.mp3');
  [menuAudio, gameAudio, gameFastAudio].forEach(a => {
    a.loop    = true;
    a.volume  = 0.5;
    a.preload = 'auto'; // начинаем буферизацию сразу
  });
}

// Вызываем initAudio сразу при загрузке скрипта — объекты создаём заранее
initAudio();

function playTrack(track) {
  if (!musicEnabled) return;
  if (currentTrack === track) return;
  if (currentTrack) {
    currentTrack.pause();
    currentTrack.currentTime = 0;
  }
  currentTrack = track;
  if (track) {
    track.currentTime = 0;
    const p = track.play();
    // Если браузер заблокировал — повторяем при следующем жесте
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        const retry = () => {
          track.play().catch(() => {});
          document.removeEventListener('touchstart', retry);
          document.removeEventListener('click', retry);
        };
        document.addEventListener('touchstart', retry, { once: true });
        document.addEventListener('click', retry, { once: true });
      });
    }
  }
}

function stopAllMusic() {
  if (currentTrack) {
    currentTrack.pause();
    currentTrack.currentTime = 0;
    currentTrack = null;
  }
}

function playMenuMusic()     { playTrack(menuAudio); }
function playGameMusic()     { playTrack(gameAudio); }
function playGameFastMusic() { playTrack(gameFastAudio); }

function updateGameMusic() {
  if (!G || !G.running) return;
  const lowHp = G.hp <= 1;
  const hasFast = G.starDouble || slowActive;
  playTrack(lowHp || hasFast ? gameFastAudio : gameAudio);
}

// startMusic — основной вход для запуска музыки
// Вызывается и по тапу, и автоматически при старте в Telegram
function startMusic() {
  if (currentTrack) return; // уже играет — не перезапускаем
  musicEnabled = true;
  if (!menuAudio) initAudio();

  // Разблокировка AudioContext (нужно на iOS и некоторых Android)
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume().catch(()=>{});
  } catch(e) {}

  // В Telegram WebView play() обычно разрешён сразу
  menuAudio.volume = 0.5;
  const p = menuAudio.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      currentTrack = menuAudio;
    }).catch(() => {
      // Браузер заблокировал — будет включена при первом тапе через _resumePending
      _pendingTrack = menuAudio;
    });
  }
}

// Sfx звуки (оставляем WebAudio для коротких эффектов)
function sfxCatch() {
  if (typeof SETTINGS !== 'undefined' && !SETTINGS.sfx) return;
  try {
    const a = new(window.AudioContext||window.webkitAudioContext)();
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(880, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, a.currentTime + .08);
    g.gain.setValueAtTime(.12, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .12);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + .12);
  } catch(e) {}
}

function sfxMiss() {
  if (typeof SETTINGS !== 'undefined' && !SETTINGS.sfx) return;
  try {
    const a = new(window.AudioContext||window.webkitAudioContext)();
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, a.currentTime + .2);
    g.gain.setValueAtTime(.08, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .2);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + .2);
  } catch(e) {}
}

let canvas, ctx;
function startGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  document.getElementById('gOverlay').classList.remove('show');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight -
    (document.getElementById('boostBar') ? document.getElementById('boostBar').offsetHeight : 80) -
    (canvas.previousElementSibling ? canvas.previousElementSibling.offsetHeight : 60);
  if(canvas.height < 100) canvas.height = window.innerHeight * 0.7;
  slowActive=false; magnetActive=false;
  G={
    score:0, hp:5+(S.inv.hp>0?1:0),
    maxHp:5+(S.inv.hp>0?1:0),
    gifts:[], basket:{x:canvas.width/2,w:90,h:20},
    spawnT:0, speed:2.2, running:true,
    particles:[], comboTimer:0, starDouble:false
  };
  updateHud();
  if(raf) cancelAnimationFrame(raf);
  raf=requestAnimationFrame(gFrame);
  setupControls();

  // Запускаем игровую музыку
  if (!gameAudio) initAudio();
  playGameMusic();
}

function stopGame() {
  if(raf){cancelAnimationFrame(raf);raf=null;}
  if(G)G.running=false;
  boostPanelOpen=false;
  const p=document.getElementById('boostPanel');
  if(p) p.style.left='-110px';
  // Возвращаем меню музыку
  playMenuMusic();
}

function setupControls() {
  canvas.ontouchmove=e=>{e.preventDefault();if(!G)return;const r=canvas.getBoundingClientRect();G.basket.x=e.touches[0].clientX-r.left;};
  canvas.ontouchstart=e=>{e.preventDefault();if(!G)return;const r=canvas.getBoundingClientRect();G.basket.x=e.touches[0].clientX-r.left;};
  canvas.onmousemove=e=>{if(!G)return;const r=canvas.getBoundingClientRect();G.basket.x=e.clientX-r.left;};
}

function spawnGift() {
  const t=GIFT_TYPES[Math.floor(Math.random()*GIFT_TYPES.length)];
  G.gifts.push({x:Math.random()*(canvas.width-50)+25,y:-30,vy:G.speed+Math.random()*1.2,type:t,rot:0,rotV:(Math.random()-.5)*.04});
}

function drawBg(W,H) {
  if(bgImage && bgImage.complete && bgImage.naturalWidth){
    const imgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasAspect = W / H;
    let sx=0,sy=0,sw=bgImage.naturalWidth,sh=bgImage.naturalHeight;
    if(imgAspect > canvasAspect){
      sw = bgImage.naturalHeight * canvasAspect;
      sx = (bgImage.naturalWidth - sw) / 2;
    } else {
      sh = bgImage.naturalWidth / canvasAspect;
      sy = (bgImage.naturalHeight - sh) / 2;
    }
    ctx.globalAlpha = 0.85;
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0,0,W,H);
  } else {
    const sky=ctx.createLinearGradient(0,0,0,H*.65);
    sky.addColorStop(0,'#0a1520');
    sky.addColorStop(1,'#1a3040');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*.65);
    ctx.fillStyle='rgba(255,255,255,0.7)';
    for(let i=0;i<35;i++){
      const sx=(i*137+20)%W,sy=(i*71+10)%(H*.5);
      const r=i%3===0?1.5:.8;
      ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
    }
    const grd=ctx.createLinearGradient(0,H*.6,0,H);
    grd.addColorStop(0,'#1a3a2a');
    grd.addColorStop(1,'#0d2018');
    ctx.fillStyle=grd;ctx.fillRect(0,H*.6,W,H*.4);
  }
  ctx.fillStyle='rgba(232,244,248,0.55)';
  ctx.beginPath();ctx.ellipse(W/2,H-40,W*.7,22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(208,234,245,0.5)';
  ctx.fillRect(0,H-52,W,8);
}

function gFrame() {
  if(!G||!G.running)return;
  const W=canvas.width;
  const H=canvas.height;
  ctx.clearRect(0,0,W,H);
  drawBg(W,H);

  if(slowActive&&Date.now()>slowEnd)slowActive=false;
  if(magnetActive&&Date.now()>magnetEnd)magnetActive=false;
  const spd=slowActive?G.speed*.35:G.speed;

  G.spawnT++;
  const spawnRate=Math.max(18,55-G.score*.4);
  if(G.spawnT>spawnRate){spawnGift();G.spawnT=0;}
  G.speed=2.2+G.score*.04;

  // Динамическое переключение музыки
  if(G.score % 30 === 0) updateGameMusic();

  const bx=Math.max(G.basket.w/2+5,Math.min(W-G.basket.w/2-5,G.basket.x));
  const by=H-75;
  drawGrinchBasket(ctx,bx,by);

  if(slowActive){
    ctx.fillStyle='rgba(52,152,219,0.15)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#3498db';ctx.font='bold 11px sans-serif';ctx.textAlign='left';
    ctx.fillText('⏱️ '+(((slowEnd-Date.now())/1000).toFixed(0))+'с',8,H-8);
  }
  if(magnetActive){
    ctx.fillStyle='rgba(155,89,182,0.08)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#9b59b6';ctx.font='bold 11px sans-serif';
    ctx.fillText('🌙 '+(((magnetEnd-Date.now())/1000).toFixed(0))+'с',60,H-8);
  }

  for(let i=G.gifts.length-1;i>=0;i--){
    const g=G.gifts[i];
    if(magnetActive){
      const dx=bx-g.x,dy=by-g.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>5){g.x+=dx/dist*5;g.y+=dy/dist*3;}
    }
    g.y+=spd+g.vy*.3;
    g.rot+=g.rotV;
    drawGift(ctx,g);

    // Зона поимки
    const catchW = G.basket.w / 2 + g.type.sz * 0.35;
    if(g.y > by-28 && g.y < by+20 && Math.abs(g.x-bx) < catchW){
      G.gifts.splice(i,1);
      const pts=G.starDouble?2:1;
      G.score+=pts; S.gifts+=pts; S.seasonBank+=pts;
      G.comboTimer=60;
      spawnParticle(g.x,g.y,g.type.color);
      document.getElementById('gScore').textContent=G.score;
      sfxCatch(); save();
      // Переключаем на fast при x2
      if(G.starDouble) playGameFastMusic();
      continue;
    }

    // Промах — сразу -HP
    if(g.y > by + 40 && !g._missed){
      g._missed = true;
      G.hp--;
      updateHud();
      sfxMiss();
      // Мало HP — fast музыка!
      if(G.hp <= 1) playGameFastMusic();
      if(G.hp <= 0){
        if(S.inv.totem>0){S.inv.totem--;save();G.hp=3;toast('🗿 Тотем воскресил тебя!');updateHud();}
        else{endGame();return;}
      }
    }
    if(g.y > H + 40){ G.gifts.splice(i,1); }
  }

  for(let i=G.particles.length-1;i>=0;i--){
    const p=G.particles[i];
    p.y-=p.vy;p.x+=p.vx;p.life--;p.vy*=.92;
    if(p.life<=0){G.particles.splice(i,1);continue;}
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  raf=requestAnimationFrame(gFrame);
}

function drawGrinchBasket(c,x,y){
  const t=Date.now()*.002;
  const gl=c.createRadialGradient(x,y+20,0,x,y+20,85);
  gl.addColorStop(0,'rgba(46,204,113,.15)');
  gl.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gl;
  c.beginPath();c.ellipse(x,y+25,85,30,0,0,Math.PI*2);c.fill();
  const im=_IC['grinchBasket'];
  if(im&&im.complete&&im.naturalWidth){
    const aspect=im.naturalWidth/im.naturalHeight;
    const gh=160, gw=gh*aspect;
    c.save();
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality='high';
    c.shadowColor=`rgba(46,204,113,${.5+Math.sin(t)*.2})`;
    c.shadowBlur=30;
    c.drawImage(im,x-gw/2,y-gh+35,gw,gh);
    c.restore();
  } else {
    c.font='80px serif';
    c.textAlign='center';
    c.textBaseline='middle';
    c.fillText('🎅',x,y-40);
  }
}

function drawGift(c,g){
  const sz=g.type.sz, t=Date.now()*.002;
  const pulse=1+Math.sin(t*1.2+g.y*.03)*.035;
  c.save();
  c.translate(g.x,g.y);
  c.rotate(g.rot);
  c.scale(pulse,pulse);
  const im=_IC[g.type.img];
  if(im&&im.complete&&im.naturalWidth>0){
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality='high';
    c.shadowColor='rgba(120,220,180,.6)';
    c.shadowBlur=14+Math.sin(t+g.x*.05)*6;
    c.drawImage(im,-sz/2,-sz/2,sz,sz);
  } else {
    c.shadowColor='rgba(255,220,100,.8)';
    c.shadowBlur=20;
    c.font=sz*.75+'px serif';
    c.textAlign='center';
    c.textBaseline='middle';
    c.fillText(g.type.fallback||'🎁',0,0);
  }
  c.restore();
}

function endGame(){
  G.running=false;
  document.getElementById('gOverScore').textContent=G.score;
  document.getElementById('gOverlay').classList.add('show');
  save();
  // Возвращаем меню музыку
  playMenuMusic();
}
