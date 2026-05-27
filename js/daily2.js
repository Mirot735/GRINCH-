// ═══════════════════════════════════════════════════════
// GRINCH GAME — daily2.js v22
// ═══════════════════════════════════════════════════════

var D_COOLDOWN = 20 * 3600 * 1000;
var D_MAX_GAP  = 48 * 3600 * 1000;

var DAILY_REWARDS = [
  {day:1,  type:'gifts',  amount:100,  img:'giftR',  label:'Первый шаг'},
  {day:2,  type:'gifts',  amount:150,  img:'giftR',  label:'Разогрев'},
  {day:3,  type:'gifts',  amount:200,  img:'giftG',  label:'Войди во вкус'},
  {day:4,  type:'gifts',  amount:280,  img:'giftG',  label:'Набираем темп'},
  {day:5,  type:'gifts',  amount:380,  img:'giftAu', label:'Гринч доволен'},
  {day:6,  type:'gifts',  amount:500,  img:'giftAu', label:'Почти!'},
  {day:7,  type:'chest7', amount:1,    img:'chest7', label:'СУПЕР-СУНДУК!'},
  {day:8,  type:'grinch', amount:15,   img:'token',  label:'Токен-старт'},
  {day:9,  type:'grinch', amount:18,   img:'token',  label:'Ещё больше'},
  {day:10, type:'gifts',  amount:600,  img:'giftAu', label:'Двойной удар'},
  {day:11, type:'grinch', amount:25,   img:'token',  label:'GRINCH растёт'},
  {day:12, type:'gifts',  amount:700,  img:'giftAu', label:'Подарочный дождь'},
  {day:13, type:'grinch', amount:35,   img:'token',  label:'Серьёзно'},
  {day:14, type:'gifts',  amount:1000, img:'giftAu', label:'2 НЕДЕЛИ! 🔥'},
  {day:15, type:'grinch', amount:45,   img:'token',  label:'Полпути'},
  {day:16, type:'gifts',  amount:1200, img:'giftAu', label:'Снежный шторм'},
  {day:17, type:'grinch', amount:60,   img:'token',  label:'Токен-буст'},
  {day:18, type:'gifts',  amount:1500, img:'giftAu', label:'Куча подарков'},
  {day:19, type:'grinch', amount:78,   img:'token',  label:'Близко к цели'},
  {day:20, type:'gifts',  amount:2000, img:'giftAu', label:'Богатство!'},
  {day:21, type:'chest7', amount:1,    img:'chest7', label:'3 НЕДЕЛИ — СУНДУК!'},
  {day:22, type:'grinch', amount:100,  img:'token',  label:'Сотка!'},
  {day:23, type:'grinch', amount:120,  img:'token',  label:'Легенда'},
  {day:24, type:'gifts',  amount:2500, img:'giftAu', label:'Рождество!'},
  {day:25, type:'grinch', amount:150,  img:'token',  label:'Полтора!'},
  {day:26, type:'grinch', amount:180,  img:'token',  label:'Финишная!'},
  {day:27, type:'gifts',  amount:3000, img:'giftAu', label:'Гора подарков'},
  {day:28, type:'grinch', amount:220,  img:'token',  label:'Почти МЕГА'},
  {day:29, type:'grinch', amount:260,  img:'token',  label:'Последний шаг'},
  {day:30, type:'mega',   amount:1,    img:'mega',   label:'МЕГА-БОКС 🎀'},
];

var IMG = {
  giftR:  'assets/img/Image_3993.jpg',
  giftG:  'assets/img/Image_3991.jpg',
  giftAu: 'assets/img/Image_3992.jpg',
  chest7: 'assets/img/Image_3990.jpg',
  mega:   'assets/img/Image_3989.jpg',
  token:  'assets/img/Image_3986.jpg',
  grinch: 'assets/img/Image_3994.jpg',
  winter: 'assets/img/Image_3980.jpg',
  scene:  'assets/img/Image_3981.png',
  xmas:   'assets/img/Image_3995.jpg',
  lock:   'assets/img/Image_3988.jpg',
  check:  'assets/img/Image_3987.jpg',
  // обратная совместимость
  giftB:   'assets/img/Image_3993.jpg',
  giftGold:'assets/img/Image_3992.jpg',
  giftGrn: 'assets/img/Image_3991.jpg',
  chest30: 'assets/img/Image_3989.jpg',
};

// ── STATE ─────────────────────────────────────────────
function dGet() {
  try {
    var r=localStorage.getItem('gd2');
    if(r) return JSON.parse(r);
    if(window.S && S.daily && S.daily.lastClaim) return S.daily;
  } catch(e) {}
  return {streak:0,lastClaim:0};
}
function dSet(st) {
  localStorage.setItem('gd2',JSON.stringify(st));
  if(window.S){
    S.daily = st;
    if(typeof save==='function') save();
  }
}
function dCanClaim() { return Date.now()-dGet().lastClaim>=D_COOLDOWN; }
function dMsLeft()   { return Math.max(0,D_COOLDOWN-(Date.now()-dGet().lastClaim)); }
function dHMS(ms) {
  if(ms<=0) return '00:00:00';
  var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;
}
function dFmt(n){ return n>=1000?(n/1000).toFixed(n%1000===0?0:1)+'K':String(n); }
function dPlural(n){
  if(n%10===1&&n%100!==11) return 'день';
  if(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)) return 'дня';
  return 'дней';
}

// ── CSS карточек ───────────────────────────────────────
function dCSS() {
  ['d_css_v14','d_css_v15','d_css_v16','d_css_v17','d_css_v18','d_css_v19','d_css_v20','d_css_v21'].forEach(function(id){
    var old=document.getElementById(id);if(old)old.remove();
  });
}

// ── TAB SWITCH ────────────────────────────────────────
var _dTab=0;
function dTab2Switch(n){
  _dTab=n;
  var t0=document.getElementById('dTab2_0'),t1=document.getElementById('dTab2_1');
  if(t0){
    t0.style.background=n===0?'rgba(241,196,15,0.15)':'transparent';
    var c0=t0.querySelector('.dtab-name');if(c0)c0.style.color=n===0?'#f1c40f':'rgba(255,255,255,0.28)';
    var s0=t0.querySelector('.dtab-sub');if(s0)s0.style.color=n===0?'rgba(241,196,15,0.6)':'rgba(255,255,255,0.18)';
  }
  if(t1){
    t1.style.background=n===1?'rgba(46,204,113,0.12)':'transparent';
    var c1=t1.querySelector('.dtab-name');if(c1)c1.style.color=n===1?'#2ecc71':'rgba(255,255,255,0.28)';
    var s1=t1.querySelector('.dtab-sub');if(s1)s1.style.color=n===1?'rgba(46,204,113,0.55)':'rgba(255,255,255,0.18)';
  }
  dRenderCards();
}

// ── IMG helper ────────────────────────────────────────
function dMkImg(src,fb){
  var el=document.createElement('img');
  el.src=src;
  el.onerror=function(){
    var sp=document.createElement('span');
    sp.className='dcard-fb';sp.textContent=fb||'🎁';
    if(el.parentNode)el.parentNode.replaceChild(sp,el);
  };
  return el;
}

// ── RENDER CARDS ──────────────────────────────────────
function dRenderCards(){
  var track=document.getElementById('dCardsTrack');
  if(!track)return;

  var st=dGet(),streak=st.streak,can=dCanClaim();
  var curDay=can?(streak+1):streak;
  if(curDay<1)curDay=1;
  var rng=_dTab===0?{s:1,e:7}:{s:8,e:30};

  var days=[];
  for(var d=rng.s;d<=rng.e;d++)days.push(d);

  track.innerHTML='';

  days.forEach(function(num){
    var r=DAILY_REWARDS[num-1];if(!r)return;
    var isDone=num<curDay;
    var isCur=num===curDay;
    var isNext=num===curDay+1;
    var isLocked=num>curDay;
    var isG=r.type==='grinch'||r.type==='mega';

    var cls='dcard';
    if(isDone)cls+=' done';
    else if(isCur&&isG)cls+=' gcur';
    else if(isCur)cls+=' cur';
    else if(isNext)cls+=' next';

    var card=document.createElement('div');
    card.className=cls;
    if(isCur)card.id='dCardCurrent';

    var dl=document.createElement('div');
    dl.className='dcard-day';
    dl.textContent='День '+num;
    card.appendChild(dl);

    var wrap=document.createElement('div');
    wrap.className='dcard-img';
    var imgKey = r.img || (r.type==='mega'?'mega':r.type==='chest7'?'chest7':isG?'token':isDone?'giftAu':isCur?'giftG':'giftR');
    var fb = r.type==='mega'?'🎀':r.type==='chest7'?'🏆':isG?'🟢':'🎁';
    var src = IMG[imgKey] || IMG.giftR;
    wrap.appendChild(dMkImg(src,fb));

    if(isDone){
      var ov=document.createElement('div');ov.className='dcard-ov';
      ov.appendChild(dMkImg(IMG.check,'✓'));wrap.appendChild(ov);
    }else if(isLocked){
      var ov2=document.createElement('div');ov2.className='dcard-ov';
      ov2.appendChild(dMkImg(IMG.lock,'🔒'));wrap.appendChild(ov2);
    }
    card.appendChild(wrap);

    var amt=document.createElement('div');
    amt.className='dcard-amt';
    if(r.type==='mega'){
      var tx=document.createElement('span');
      tx.textContent='МЕГА';
      amt.appendChild(tx);
    } else if(num===7){
      var tx=document.createElement('span');
      tx.textContent='СУНДУК';
      tx.style.cssText='font-size:9px;font-weight:900;color:#f5c518;letter-spacing:0.5px;';
      amt.appendChild(tx);
    } else {
      if(isG){
        var ti=dMkImg(IMG.token,'🟢');
        ti.style.cssText='width:10px;height:10px;object-fit:contain;flex-shrink:0;border-radius:50%;';
        amt.appendChild(ti);
      } else {
        var ti=document.createElement('span');
        ti.style.cssText='font-size:10px;flex-shrink:0;line-height:1;';
        ti.textContent='🎁';
        amt.appendChild(ti);
      }
      var tx2=document.createElement('span');
      tx2.textContent=isG?dFmt(r.amount):String(r.amount);
      amt.appendChild(tx2);
    }
    card.appendChild(amt);

    // Лейбл для текущей карточки
    if(isCur && r.label){
      var lbl=document.createElement('div');
      lbl.style.cssText='font-size:7px;color:rgba(0,255,136,0.6);text-align:center;'
        +'margin-top:2px;line-height:1.2;padding:0 2px;overflow:hidden;'
        +'text-overflow:ellipsis;white-space:nowrap;max-width:100%;'
        +'font-family:"IBM Plex Mono",monospace;letter-spacing:0.3px;';
      lbl.textContent=r.label;
      card.appendChild(lbl);
    }

    track.appendChild(card);
  });

  // Scroll current card into view
  setTimeout(function(){
    var cur=document.getElementById('dCardCurrent');
    if(cur&&track){
      var tl=track.getBoundingClientRect().left;
      var cl=cur.getBoundingClientRect().left;
      track.parentNode.scrollLeft+=cl-tl-8;
    }
  },50);
}

// ── OPEN DAILY SCREEN ─────────────────────────────────
function openDaily2(){
  dCSS();
  var st=dGet(),streak=st.streak;
  var nick=(window.S&&S.nick)||'Игрок';
  var lvl=(window.S&&typeof getLevel==='function')?getLevel(S.gifts||0):1;

  function set(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  set('dPlayerNick2',nick);
  set('dPlayerLvl2','УРОВЕНЬ '+lvl);

  var streakEl=document.getElementById('dStreakTxt2');
  if(streakEl)streakEl.textContent='◆  СЕРИЯ: '+streak+' '+dPlural(streak)+'  ◆';

  var curDay2=dCanClaim()?(streak+1):streak;
  if(curDay2<1)curDay2=1;
  _dTab=(curDay2>7)?1:0;

  var tm=document.getElementById('dTimerMain');
  if(tm) tm.removeAttribute('data-mode');

  setTimeout(function(){
    dTab2Switch(_dTab);
    dUpdBtn2();
  },20);
}

// ── КНОПКА ────────────────────────────────────────────
function dUpdBtn2(){
  var btn=document.getElementById('dClaimBtn2');
  if(!btn)return;
  var can=dCanClaim();
  var lbl=document.getElementById('dClaimLbl');

  if(btn.tagName==='IMG'){
    btn.style.opacity=can?'1':'0.5';
    btn.style.cursor=can?'pointer':'default';
    btn.style.pointerEvents=can?'auto':'none';
    if(lbl) lbl.textContent=can?'':('✓ Получено — '+dHMS(dMsLeft()));

    var tm=document.getElementById('dTimerMain');
    if(can){
      if(tm && tm.getAttribute('data-mode')!=='ready'){
        tm.setAttribute('data-mode','ready');
        tm.removeAttribute('style');
        tm.innerHTML='ПОРА ЗАБРАТЬ НАГРАДУ!<span id="dTimerVal2" style="display:none"></span>';
      }
    } else {
      if(tm && tm.getAttribute('data-mode')!=='timer'){
        tm.setAttribute('data-mode','timer');
        tm.removeAttribute('style');
        tm.innerHTML='<span id="dTimerVal2">'+dHMS(dMsLeft())+'</span>';
      }
    }
    return;
  }

  btn.disabled=!can;
  if(can){
    btn.innerHTML='🎁 ЗАБРАТЬ НАГРАДУ';
    btn.style.cssText='width:100%;padding:13px 14px;border:none;border-radius:14px;font-size:17px;font-weight:900;color:#fff;cursor:pointer;background:linear-gradient(160deg,#d32f2f,#c62828,#b71c1c);box-shadow:0 4px 24px rgba(220,30,30,0.9);letter-spacing:2px;font-family:"Grinched",cursive;display:flex;align-items:center;justify-content:center;gap:8px;';
  } else {
    btn.innerHTML='✓ Получено — '+dHMS(dMsLeft());
    btn.style.cssText='width:100%;padding:9px 14px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.28);cursor:default;background:rgba(0,0,0,0.45);letter-spacing:0.3px;';
  }
}

// ── CLAIM ─────────────────────────────────────────────
function claimDaily(){
  var st=dGet(),now=Date.now();
  if(now-st.lastClaim<D_COOLDOWN){
    if(typeof toast==='function')toast('⏳ Следующая через '+dHMS(dMsLeft()));
    return;
  }

  // Сбрасываем серию если пропустил больше 48ч
  if(st.lastClaim>0&&now-st.lastClaim>D_MAX_GAP) st.streak=0;

  // Правильный индекс — streak уже равен числу полученных наград
  var idx = st.streak % DAILY_REWARDS.length;
  var rw  = DAILY_REWARDS[idx];
  st.streak += 1;
  st.lastClaim = now;

  // 1. Сохраняем стрик сразу
  dSet(st);

  // 2. Читаем свежие данные
  var curGifts  = (window.S && S.gifts)  || parseInt(localStorage.getItem('gifts')||'0',10);
  var curGrinch = (window.S && S.grinch) || parseInt(localStorage.getItem('grinch')||'0',10);
  var curBank   = (window.S && S.seasonBank) || parseInt(localStorage.getItem('seasonBank')||'0',10);
  var curInv    = {};
  try {
    curInv = JSON.parse(localStorage.getItem('inv')||'{}');
    if(window.S && S.inv) curInv = Object.assign({}, S.inv, curInv);
  } catch(e) {}

  // 3. Начисляем награду
  if(rw.type==='gifts'){
    curGifts += rw.amount;
    curBank  += rw.amount;
  }
  if(rw.type==='grinch'){
    curGrinch += rw.amount;
  }
  if(rw.type==='chest7'){
    curInv.chest7 = (curInv.chest7||0) + 1;
  }
  if(rw.type==='mega'){
    curInv.megaBox = (curInv.megaBox||0) + 1;
  }

  // 4. Сохраняем всё синхронно
  localStorage.setItem('gifts',     String(curGifts));
  localStorage.setItem('grinch',    String(curGrinch));
  localStorage.setItem('seasonBank',String(curBank));
  localStorage.setItem('inv',       JSON.stringify(curInv));

  if(window.S){
    S.daily      = st;
    S.gifts      = curGifts;
    S.grinch     = curGrinch;
    S.seasonBank = curBank;
    S.inv        = curInv;
    if(typeof save==='function') try{save();}catch(e){}
  }

  // 5. Анимация
  var cols=['#f1c40f','#2ecc71','#e74c3c','#fff'];
  var cx=window.innerWidth/2, cy=window.innerHeight*.55;
  for(var i=0;i<24;i++){
    var p=document.createElement('div'); p.className='dpt';
    var ang=Math.random()*Math.PI*2, dist=80+Math.random()*150, sz=(4+Math.random()*8).toFixed(0);
    p.style.cssText='left:'+cx+'px;top:'+cy+'px;width:'+sz+'px;height:'+sz+'px;background:'+cols[i%4]+';--tx:'+(Math.cos(ang)*dist).toFixed(0)+'px;--ty:'+(-(Math.abs(Math.sin(ang)*dist)+40)).toFixed(0)+'px;animation-duration:'+(0.5+Math.random()*.8).toFixed(2)+'s;';
    document.body.appendChild(p);
    setTimeout((function(e){return function(){if(e.parentNode)e.parentNode.removeChild(e);};})(p),1500);
  }

  var label = rw.type==='mega'    ? '🎀 МЕГА-БОКС!'
            : rw.type==='chest7'  ? '🏆 СУПЕР-СУНДУК!'
            : rw.type==='grinch'  ? '🟢 +'+rw.amount+' GRINCH'
            :                       '🎁 +'+rw.amount+' подарков';

  var fl=document.createElement('div'); fl.className='dfl';
  fl.style.color = rw.type==='mega'?'#ff69b4':rw.type==='chest7'?'#f5c518':rw.type==='grinch'?'#2ecc71':'#f1c40f';
  fl.textContent = label;
  document.body.appendChild(fl);
  setTimeout(function(){if(fl.parentNode)fl.parentNode.removeChild(fl);},2000);
  if(typeof toast==='function') toast(label, 3000);
  _dailyAutoShown=true;

  // 6. Обновляем UI
  function _refreshUI(){
    var g  = window.S ? S.gifts      : parseInt(localStorage.getItem('gifts')||'0',10);
    var gr = window.S ? S.grinch     : parseInt(localStorage.getItem('grinch')||'0',10);
    var gb = window.S ? S.seasonBank : parseInt(localStorage.getItem('seasonBank')||'0',10);

    ['menuGifts','shopGifts','pGifts','dBalGifts2'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.textContent=g.toLocaleString();
    });
    ['menuGrinch','shopGrinch','pGrinch','dBalGrinch2'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.textContent=gr.toLocaleString();
    });
    ['menuSeasonBank','profileSeasonBank'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.textContent=gb.toLocaleString();
    });
    try{if(typeof updateMenu==='function')updateMenu();}catch(e){}
    try{if(typeof updateMenuTopbar==='function')updateMenuTopbar();}catch(e){}
  }

  setTimeout(function(){
    _refreshUI();
    var tm=document.getElementById('dTimerMain');
    if(tm) tm.removeAttribute('data-mode');
    var sk=dGet().streak;
    var es=document.getElementById('dStreakTxt2');
    if(es) es.textContent='◆  СЕРИЯ: '+sk+' '+dPlural(sk)+'  ◆';
    dRenderCards();
    dUpdBtn2();
  }, 300);

  // 7. Закрываем экран через 2 сек
  setTimeout(function(){
    _refreshUI();
    try{if(typeof show==='function')show('menu');}catch(e){
      document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
      var m=document.getElementById('s-menu');
      if(m) m.classList.add('active');
    }
  }, 2000);
}

// ── ТАЙМЕР В МЕНЮ ─────────────────────────────────────
function updateDailyTimer(){
  var el=document.getElementById('dailyTimer');
  if(!el)return;
  if(dCanClaim()){el.textContent='Забрать!';el.style.color='#2ecc71';}
  else{el.textContent=dHMS(dMsLeft());el.style.color='#f1c40f';}
}
var dailyUpdMenuTile=updateDailyTimer;

// ── TICK 1s ────────────────────────────────────────────
setInterval(function(){
  updateDailyTimer();
  var scr=document.getElementById('s-daily');
  if(!scr||!scr.classList.contains('active'))return;
  if(!dCanClaim()){
    var e=document.getElementById('dTimerVal2');
    if(e)e.textContent=dHMS(dMsLeft());
  }
  var es=document.getElementById('dStreakTxt2');
  if(es){var sk=dGet().streak;es.textContent='◆  СЕРИЯ: '+sk+' '+dPlural(sk)+'  ◆';}
  dUpdBtn2();
},1000);

// ── SESSION FLAG ───────────────────────────────────────
var _dailyAutoShown=false;

function dailyMaybeShow(){
  // Отключено — окно daily открывается только по нажатию кнопки игроком
  return;
}

// ── INIT ──────────────────────────────────────────────
function _dailyInit(){
  ['d_css_v14','d_css_v15','d_css_v16','d_css_v17','d_css_v18','d_css_v19','d_css_v20','d_css_v21'].forEach(function(id){
    var old=document.getElementById(id);if(old)old.remove();
  });
  dCSS();
  updateDailyTimer();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_dailyInit);
else setTimeout(_dailyInit,50);
