const IMGS={
  'grinch':'assets/img/image_10.png',
  'heart':'assets/img/image_11.png',
  'cauldron':'assets/img/image_12.png',
  'cookie':'assets/img/image_13.png',
  'bag':'assets/img/image_14.png',
  'jar':'assets/img/image_15.png',
  'lollipop':'assets/img/image_16.png',
  'icegem':'assets/img/image_17.png',
  'watch':'assets/img/image_18.png',
  'ring':'assets/img/image_19.png',
  'crystal':'assets/img/image_20.png',
  'lolpop':'assets/img/image_21.png',
  'candle':'assets/img/image_22.png',
  'logoG':'assets/img/image_23.jpg',
  'grinchBasket':'assets/img/image_24.png',
  'giftBox3D':'assets/img/image_25.jpg',
};
const _IC={};
const BG_IMG_SRC = 'assets/img/image_26.jpg';
let bgImage = null;
function preloadImgs(){
  bgImage = new Image(); bgImage.src = BG_IMG_SRC;
  Object.entries(IMGS).forEach(([k,v])=>{const im=new Image();im.src=v;_IC[k]=im;});
}

// ===== STATE =====
// ===== SCREENS =====
// ===== TOAST =====
// ===== MUSIC =====
let audioCtx=null, musicOn=false;
function sfxCatch() {
  try {
    const a=new(window.AudioContext||window.webkitAudioContext)();
    const o=a.createOscillator(),g=a.createGain();
    o.frequency.setValueAtTime(660,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(1100,a.currentTime+.12);
    g.gain.setValueAtTime(.14,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.15);
    o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.15);
  }catch(e){}
}
function sfxMiss() {
  try {
    const a=new(window.AudioContext||window.webkitAudioContext)();
    const o=a.createOscillator(),g=a.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(220,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(80,a.currentTime+.25);
    g.gain.setValueAtTime(.1,a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.25);
    o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.25);
  }catch(e){}
}

// ===== LOADING =====
// ===== MENU =====
function updateMenu() {
  document.getElementById('menuNick').textContent = S.nick;
  document.getElementById('menuGifts').textContent = S.gifts.toLocaleString();
  document.getElementById('menuGrinch').textContent = S.grinch.toLocaleString();
  const sbEl = document.getElementById('menuSeasonBank');
  if(sbEl) sbEl.textContent = S.seasonBank.toLocaleString();

  // Аватар — первая буква ника
  const av = document.getElementById('menuAvatar');
  if(av) av.textContent = (S.nick||'И')[0].toUpperCase();

  // Прибыль в час
  const miners = (S.miners||{});
  let income = (S.inv.autobet||0)>0 ? 100 : 0;
  Object.keys(miners).forEach(k=>{ income += (miners[k]||0) * (MINER_INCOME[k]||0); });
  const incEl = document.getElementById('menuIncome');
  if(incEl) incEl.textContent = income > 0 ? '+'+income : '—';

  // Уровень
  const lvl = getLevel(S.gifts) || 1;
  const lvlData = getLevelProgress(S.gifts); const pct = lvlData.pct || 0;
  const lvlEl = document.getElementById('menuLevel');
  if(lvlEl) lvlEl.textContent = '★ Уровень ' + lvl;
  const barEl = document.getElementById('menuLevelBar');
  if(barEl) barEl.style.width = pct + '%';
  const pctEl = document.getElementById('menuLevelPct');
  if(pctEl) pctEl.textContent = pct + '%';
  const lblEl = document.getElementById('menuLevelLabel');
  if(lblEl) lblEl.textContent = 'До уровня ' + (lvl+1);

  // Ранг
  const rankEl = document.getElementById('menuRank');
  if(rankEl) rankEl.textContent = '#' + (S.rank||'—');
  // Энергия
  if(typeof updateEnergyUI==='function') updateEnergyUI();
  // Таймеры
  if(typeof updateDailyTimer==='function') updateDailyTimer();
  if(typeof updateEventTimer==='function') updateEventTimer();
}

// ===== GAME ENGINE =====
let G=null, raf=null, slowActive=false, magnetActive=false, slowEnd=0, magnetEnd=0;

function toggleInv(){}
function renderInvGrid(){ updateBoostPanel(); }
function drawTree(c,x,y,w,h){
  c.fillStyle='#0a1a0c';
  c.beginPath();c.moveTo(x,y-h);c.lineTo(x-w,y);c.lineTo(x+w,y);c.closePath();c.fill();
  c.beginPath();c.moveTo(x,y-h*.7);c.lineTo(x-w*.8,y-h*.2);c.lineTo(x+w*.8,y-h*.2);c.closePath();c.fill();
  c.fillStyle='rgba(200,230,255,0.6)';
  c.beginPath();c.arc(x-w*.3,y-h*.6,3,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(x+w*.2,y-h*.35,2,0,Math.PI*2);c.fill();
}
function spawnParticle(x,y,color){
  for(let i=0;i<8;i++){
    G.particles.push({x,y,vx:(Math.random()-.5)*4,vy:Math.random()*3+2,life:30,maxLife:30,r:Math.random()*3+1,color});
  }
}
function updateHud(){
  const hp=document.getElementById('gHp');
  hp.innerHTML='';
  for(let i=0;i<Math.max(G.maxHp,G.hp);i++){
    const s=document.createElement('span');
    s.className='hp-heart'+(i>=G.hp?' dead':'');
    s.textContent='❤️'; hp.appendChild(s);
  }
  updateBoostPanel();
}
// ===== SHOP =====
// ===== PROFILE =====
// ===== RATING =====
// ===== FRIENDS =====
// ===== QUESTS =====
// ===== QUEST DATA =====
// Подразделы каналов
// Объединённый массив для claimChannelQuest
// Биржи для покупки GRINCH
// GRINCH_CONTRACT defined in config.js
// Задания за покупку GRINCH
let currentQuestTab = 0;

function questTab(n){
  currentQuestTab = n;
  document.querySelectorAll('.qtab').forEach((t,i)=>{
    const active = i===n;
    t.style.color = active ? 'var(--green)' : 'var(--text2)';
    t.style.borderBottomColor = active ? 'var(--green)' : 'transparent';
  });
  renderQuests();
}
function makeSectionHeader(label){
  const h = document.createElement('div');
  h.className = 'quest-section-header';
  h.innerHTML = `<span class="quest-section-title">${label}</span>`;
  return h;
}

function renderChannelQuests(list){
  // Telegram section
  list.appendChild(makeSectionHeader('📣 TELEGRAM'));
  QUESTS_CHANNELS_TG.forEach(q => list.appendChild(makeChannelCard(q)));

  // Social section
  const spacer = document.createElement('div');
  spacer.style.height = '4px';
  list.appendChild(spacer);
  list.appendChild(makeSectionHeader('🌐 СОЦСЕТИ'));
  QUESTS_CHANNELS_SOCIAL.forEach(q => list.appendChild(makeChannelCard(q)));
}

function openChannel(url){
  const twa = window.Telegram?.WebApp;
  if(twa){
    if(url.includes('t.me')){
      // Telegram-native deep link — opens channel inside TG without leaving mini app
      twa.openTelegramLink(url);
    } else {
      // External link (Twitter, YouTube etc.) — opens in TG in-app browser
      twa.openLink(url, {try_instant_view: false});
    }
  } else {
    window.open(url, '_blank');
  }
}

function claimQuest(id){
  claimGameQuest(id);
}


function toggleBoostPanel(){}
function closeBoostPanel(){}
let selectedPkg = null;

const REF_BONUS_PCT = 0.20; // 20% реферальный бонус
