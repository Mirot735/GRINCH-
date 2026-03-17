const S = {
  nick: localStorage.getItem('nick') || ('Игрок_'+Math.floor(Math.random()*9999)),
  refBy: localStorage.getItem('refBy')||null,
  gifts: +localStorage.getItem('gifts')||0,
  grinch: +localStorage.getItem('grinch')||0,
  seasonBank: +localStorage.getItem('seasonBank')||0,
  refs: +localStorage.getItem('refs')||0,
  refEarned: +localStorage.getItem('refEarned')||0,
  refTonEarned: +localStorage.getItem('refTonEarned')||0,
  // Фикс null-кошелька: не берём если строка "null"
  wallet: (localStorage.getItem('wallet') && localStorage.getItem('wallet') !== 'null') ? localStorage.getItem('wallet') : null,
  walletFull: (localStorage.getItem('walletFull') && localStorage.getItem('walletFull') !== 'null') ? localStorage.getItem('walletFull') : null,
  skin: localStorage.getItem('skin')||'default',
  inv: JSON.parse(localStorage.getItem('inv')||'{"slow":0,"autobet":0,"hp":0,"totem":0,"magnet":0,"star":0}'),
  questsDone: JSON.parse(localStorage.getItem('questsDone')||'[]'),
  miners: JSON.parse(localStorage.getItem('miners')||'{}'),
  miningPendingGifts:  +localStorage.getItem('miningPendingGifts')||0,
  miningPendingGrinch: +localStorage.getItem('miningPendingGrinch')||0,
  claimLog: JSON.parse(localStorage.getItem('claimLog')||'{}'),
  lastReset: localStorage.getItem('lastReset')||'',
};

function save() {
  Object.keys(S).forEach(k => {
    if(typeof S[k]==='object') localStorage.setItem(k,JSON.stringify(S[k]));
    else localStorage.setItem(k, S[k] === null ? '' : S[k]);
  });
  // Чистим мусорный "null" из localStorage
  if(localStorage.getItem('wallet')==='null') localStorage.removeItem('wallet');
  if(localStorage.getItem('walletFull')==='null') localStorage.removeItem('walletFull');
}

function getTodayKey() {
  return new Date().toISOString().slice(0,10);
}

function resetDailyIfNeeded() {
  const today = getTodayKey();
  if(S.lastReset !== today) {
    S.claimLog = {};
    S.lastReset = today;
    save();
  }
}

function canClaim(id, maxPerDay) {
  resetDailyIfNeeded();
  const count = S.claimLog[id] || 0;
  return count < maxPerDay;
}

function logClaim(id) {
  S.claimLog[id] = (S.claimLog[id] || 0) + 1;
}

// Постоянная проверка (не сбрасывается каждый день)
function isDonePerm(key) {
  const list = JSON.parse(localStorage.getItem('questsDonePerm')||'[]');
  return list.includes(key);
}
function markDonePerm(key) {
  const list = JSON.parse(localStorage.getItem('questsDonePerm')||'[]');
  if(!list.includes(key)){ list.push(key); localStorage.setItem('questsDonePerm', JSON.stringify(list)); }
}

function runLoad() {
  const bar=document.getElementById('loadBar'),st=document.getElementById('loadStatus');
  const msgs=['ИНИЦИАЛИЗАЦИЯ...','ЗАГРУЗКА АКТИВОВ...','ГРИНЧ КРАДЁТ ДАННЫЕ...','ПОДАРКИ ГОТОВЫ!'];
  let p=0;
  // Тап по загрузочному экрану тоже разблокирует музыку
  const loadScreen = document.getElementById('s-load');
  if(loadScreen) {
    loadScreen.addEventListener('touchstart', ()=>{
      if(typeof startMusic==='function') startMusic();
    }, {once:true, passive:true});
  }
  const iv=setInterval(()=>{
    p+=Math.random()*6+2;
    if(p>100)p=100;
    bar.style.width=p+'%';
    st.textContent=msgs[Math.floor(p/26)%4];
    if(p>=100){clearInterval(iv);setTimeout(()=>{
      document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
      const m=document.getElementById('s-menu');
      if(m) m.classList.add('active');
      // Ждём полной загрузки всех скриптов перед updateMenu
      const tryUpdateMenu = (attempts) => {
        if(typeof updateMenu==='function' && typeof S!=='undefined'){
          try{ updateMenu(); }catch(e){ console.warn('updateMenu:',e); }
        } else if(attempts > 0){
          setTimeout(()=>tryUpdateMenu(attempts-1), 100);
        }
      };
      tryUpdateMenu(10);
    },400);}
  },70);
}

function useItem(key) {
  if(!G||!G.running){toast('Сначала начни игру!');return;}
  if(!S.inv[key]||S.inv[key]<=0){toast('Нет предмета');return;}
  S.inv[key]--;save();
  if(key==='slow'){slowActive=true;slowEnd=Date.now()+30000;toast('⏱️ Замедление активно 30с!');}
  if(key==='hp'){G.hp=Math.min(G.hp+1,G.maxHp+3);updateHud();toast('❤️ +1 HP!');}
  if(key==='magnet'){magnetActive=true;magnetEnd=Date.now()+20000;toast('🌙 Магнит активен 20с!');}
  if(key==='star'){G.starDouble=true;setTimeout(()=>{G.starDouble=false;},15000);toast('⭐ Двойной хруст 15с!');}
  if(key==='totem'){toast('🗿 Тотем готов к воскрешению!');}
  updateBoostPanel();
}

function buyItem(key,tab){
  const items=tab===0?SHOP.boosts:SHOP.skins;
  const it=items.find(i=>i.key===key);
  if(!it)return;
  if(S.grinch<it.price){toast('Недостаточно токенов GRINCH 🟢');return;}
  if(tab===1&&S.skin===key){toast('Уже надет!');return;}
  S.grinch-=it.price;
  if(tab===0){S.inv[it.key]=(S.inv[it.key]||0)+1;toast(`✅ ${it.name} куплен!`);}
  else{S.skin=key;toast(`✅ Скин "${it.name}" активирован!`);}
  save();renderShop(tab);
}

// ── ИГРОВЫЕ ЗАДАНИЯ — выполняются 1 раз навсегда ──────────
function claimGameQuest(id){
  const q=QUESTS_GAME.find(q=>q.id===id);
  if(!q){toast('❌ Задание не найдено!');return;}
  if(S.questsDone.includes(id)||isDonePerm('gq_'+id)){toast('❌ Задание уже выполнено!');return;}
  S.questsDone.push(id);
  S.grinch+=q.reward;
  markDonePerm('gq_'+id);
  logClaim('gq_'+id);
  save();toast('🎉 +'+q.reward+' GRINCH!');renderQuests();updateMenu();
}

// ── КАНАЛЬНЫЕ ЗАДАНИЯ — 1 раз навсегда + таймер визита ────
function claimChannelQuest(id){
  const q=QUESTS_CHANNELS.find(q=>q.id===id);
  if(!q){toast('❌ Задание не найдено!');return;}
  if(S.questsDone.includes(id)||isDonePerm('cq_'+id)){toast('❌ Задание уже выполнено!');return;}

  // Проверяем что юзер реально заходил (visitTime должен быть)
  const visitTime = +localStorage.getItem('visit_'+id)||0;
  if(!visitTime){toast('❌ Сначала перейди по ссылке!');return;}
  const elapsed = Date.now() - visitTime;
  if(elapsed < 28000){
    const s = Math.ceil((28000-elapsed)/1000);
    toast('⏳ Подожди ещё '+s+' сек!');return;
  }

  S.questsDone.push(id);
  S.grinch+=q.reward;
  if(q.rewardGifts>0){S.gifts+=q.rewardGifts;S.seasonBank+=q.rewardGifts;}
  markDonePerm('cq_'+id);
  logClaim('cq_'+id);
  save();toast('✅ +'+q.reward+' GRINCH!');renderQuests();updateMenu();
}

function claimTonQuest(id){
  const q=QUESTS_TON?QUESTS_TON.find(q=>q.id===id):null;
  if(!q){return;}
  if(S.questsDone.includes(id)||isDonePerm('tq_'+id)){toast('❌ Уже выполнено!');return;}
  S.questsDone.push(id);
  S.gifts+=q.rewardGifts;S.seasonBank+=q.rewardGifts;S.grinch+=q.rewardGrinch;
  markDonePerm('tq_'+id);
  save();toast('🎉 +'+q.rewardGifts+' 🎁 + '+q.rewardGrinch+' GRINCH!');renderQuests();updateMenu();
}

// ── ЗАДАНИЯ ЗА ПОКУПКУ — требуют уникальный txid ──────────
function claimBuyQuest(id, txid){
  const q=QUESTS_BUY.find(q=>q.id===id);
  if(!q){toast('❌ Задание не найдено!');return;}

  // Уже выполнено навсегда
  if(S.questsDone.includes(id)||isDonePerm('bq_'+id)){
    toast('❌ Задание уже выполнено!');return;
  }

  // Нужен txid
  if(!txid||txid.trim().length<20){
    toast('❌ Введи хэш транзакции!');return;
  }
  const txClean = txid.trim().toLowerCase();

  // txid уже использовался?
  const usedTx = JSON.parse(localStorage.getItem('usedTxids')||'[]');
  if(usedTx.includes(txClean)){
    toast('❌ Этот хэш уже использован!');return;
  }

  toast('⏳ Проверяем транзакцию...');
  setTimeout(()=>{
    // Записываем txid
    usedTx.push(txClean);
    localStorage.setItem('usedTxids', JSON.stringify(usedTx));

    S.questsDone.push(id);
    S.gifts+=q.rewardGifts;
    S.seasonBank+=q.rewardGifts;
    S.grinch+=q.rewardGrinch;
    markDonePerm('bq_'+id);
    logClaim('bq_'+id);
    save();
    toast('🎉 +'+q.rewardGifts+' 🎁 + '+q.rewardGrinch+' GRINCH!');
    renderQuests();updateMenu();
  }, 1500);
}

window.addEventListener('load',()=>{
  if(window.Telegram?.WebApp){
    Telegram.WebApp.ready();Telegram.WebApp.expand();
    const u=Telegram.WebApp.initDataUnsafe?.user;
    if(u){S.nick=u.first_name+(u.last_name?' '+u.last_name:'');save();}
    const sp=Telegram.WebApp.initDataUnsafe?.start_param||'';
    if(sp.startsWith('ref_')&&!S.refBy){S.refBy=sp.replace('ref_','');localStorage.setItem('refBy',S.refBy);}
  }
  // Предзагружаем изображения
  preloadImgs();
  // Музыка стартует при первом касании — вешаем на document сразу
  // {once:true} = сработает один раз и снимется
  const _startMusicOnce = () => {
    if(typeof startMusic==='function') startMusic();
  };
  document.addEventListener('touchstart', _startMusicOnce, {once:true, passive:true});
  document.addEventListener('touchend',   _startMusicOnce, {once:true, passive:true});
  document.addEventListener('click',      _startMusicOnce, {once:true});
  // Запускаем загрузочный экран
  runLoad();
});
