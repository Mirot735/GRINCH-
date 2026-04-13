const S = {
  nick: localStorage.getItem('nick') || ('Игрок_'+Math.floor(Math.random()*9999)),
  refBy: localStorage.getItem('refBy')||null,
  gifts: +localStorage.getItem('gifts')||0,
  grinch: +localStorage.getItem('grinch')||0,
  seasonBank: +localStorage.getItem('seasonBank')||0,
  refs: +localStorage.getItem('refs')||0,
  refEarned: +localStorage.getItem('refEarned')||0,
  refTonEarned: +localStorage.getItem('refTonEarned')||0,
  wallet: localStorage.getItem('wallet')||null,
  skin: localStorage.getItem('skin')||'default',
  inv: JSON.parse(localStorage.getItem('inv')||'{"slow":0,"autobet":0,"hp":0,"totem":0,"magnet":0,"star":0}'),
  questsDone: JSON.parse(localStorage.getItem('questsDone')||'[]'),
  claimLog: JSON.parse(localStorage.getItem('claimLog')||'{}'),
  lastReset: localStorage.getItem('lastReset')||'',
};

function save() {
  Object.keys(S).forEach(k => {
    if(typeof S[k]==='object') localStorage.setItem(k,JSON.stringify(S[k]));
    else localStorage.setItem(k,S[k]);
  });
}


function getTodayKey() {
  return new Date().toISOString().slice(0,10); // "2025-03-14"
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

function runLoad() {
  const bar=document.getElementById('loadBar'),st=document.getElementById('loadStatus');
  const msgs=['ИНИЦИАЛИЗАЦИЯ...','ЗАГРУЗКА АКТИВОВ...','ГРИНЧ КРАДЁТ ДАННЫЕ...','ПОДАРКИ ГОТОВЫ!'];
  let p=0;
  const iv=setInterval(()=>{
    p+=Math.random()*6+2;
    if(p>100)p=100;
    bar.style.width=p+'%';
    st.textContent=msgs[Math.floor(p/26)%4];
    if(p>=100){clearInterval(iv);setTimeout(()=>{
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const m=document.getElementById('s-menu');
    if(m) m.classList.add('active');
    try{ updateMenu(); }catch(e){ console.warn('updateMenu:',e); }
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

function claimGameQuest(id){
  const q=QUESTS_GAME.find(q=>q.id===id);
  if(!q||S.questsDone.includes(id)){toast('❌ Задание уже выполнено!');return;}
  if(!canClaim('gq_'+id,1)){toast('❌ Уже получено сегодня!');return;}
  S.questsDone.push(id);S.grinch+=q.reward;
  logClaim('gq_'+id);
  save();toast('🎉 +'+q.reward+' GRINCH!');renderQuests();updateMenu();
}

function claimChannelQuest(id){
  const q=QUESTS_CHANNELS.find(q=>q.id===id);
  if(!q||S.questsDone.includes(id)){toast('❌ Задание уже выполнено!');return;}
  if(!canClaim('cq_'+id,1)){toast('❌ Уже получено!');return;}
  S.questsDone.push(id);S.grinch+=q.reward;
  if(q.rewardGifts>0){S.gifts+=q.rewardGifts;S.seasonBank+=q.rewardGifts;}
  logClaim('cq_'+id);
  save();toast('✅ +'+q.reward+' GRINCH!');renderQuests();updateMenu();
}

function claimTonQuest(id){
  const q=QUESTS_TON?QUESTS_TON.find(q=>q.id===id):null;
  if(!q||S.questsDone.includes(id))return;
  S.questsDone.push(id);S.gifts+=q.rewardGifts;S.seasonBank+=q.rewardGifts;S.grinch+=q.rewardGrinch;
  save();toast('🎉 +'+q.rewardGifts+' 🎁 + '+q.rewardGrinch+' GRINCH!');renderQuests();
}

function claimBuyQuest(id){
  const q=QUESTS_BUY.find(q=>q.id===id);
  if(!q||S.questsDone.includes(id)){toast('❌ Уже выполнено!');return;}
  if(!canClaim('bq_'+id,1)){toast('❌ Уже получено!');return;}
  toast('⏳ Проверяем...');
  setTimeout(()=>{
    S.questsDone.push(id);S.gifts+=q.rewardGifts;S.seasonBank+=q.rewardGifts;S.grinch+=q.rewardGrinch;
    logClaim('bq_'+id);
    save();toast('🎉 +'+q.rewardGifts+' 🎁 + '+q.rewardGrinch+' GRINCH!');renderQuests();updateMenu();
  },2000);
}

window.addEventListener('load',()=>{
  if(window.Telegram?.WebApp){
    Telegram.WebApp.ready();Telegram.WebApp.expand();
    const u=Telegram.WebApp.initDataUnsafe?.user;
    if(u){S.nick=u.first_name+(u.last_name?' '+u.last_name:'');save();}
    const sp=Telegram.WebApp.initDataUnsafe?.start_param||'';
    if(sp.startsWith('ref_')&&!S.refBy){S.refBy=sp.replace('ref_','');localStorage.setItem('refBy',S.refBy);}
  }
  document.body.addEventListener('touchstart',startMusic,{once:true});
  document.body.addEventListener('click',startMusic,{once:true});
  preloadImgs();
  runLoad();
});
