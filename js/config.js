// ── GRINCH THEME — зловещая рождественская ──────────────
// Ноты: C4=261.63 D4=293.66 Eb4=311.13 F4=349.23 G4=392
//       Ab4=415.30 Bb4=466.16 C5=523.25 D5=587.33 Eb5=622.25
//       F5=698.46 G5=783.99
const MELODY = [
  // === Часть 1 — Зловещий вход (cm minor) ===
  // Тема Гринча — нисходящая хроматика
  {f:523.25,d:.2},{f:493.88,d:.2},{f:466.16,d:.2},{f:440,d:.2},
  {f:415.30,d:.3},{f:392,d:.3},{f:0,d:.1},

  // Ответ — злорадный прыжок
  {f:311.13,d:.15},{f:311.13,d:.15},{f:622.25,d:.35},{f:0,d:.05},
  {f:466.16,d:.2},{f:415.30,d:.4},{f:0,d:.15},

  // === Часть 2 — Гринч крадёт подарки ===
  // Стаккато — лёгкие воровские шаги
  {f:261.63,d:.12},{f:0,d:.08},{f:311.13,d:.12},{f:0,d:.08},
  {f:392,d:.12},{f:0,d:.08},{f:466.16,d:.12},{f:0,d:.08},
  {f:523.25,d:.35},{f:0,d:.1},

  // Спуск с мешком
  {f:523.25,d:.15},{f:466.16,d:.15},{f:392,d:.15},{f:349.23,d:.15},
  {f:311.13,d:.4},{f:0,d:.15},

  // === Часть 3 — Злобный смех ===
  // Трель вверх
  {f:261.63,d:.1},{f:293.66,d:.1},{f:311.13,d:.1},{f:349.23,d:.1},
  {f:392,d:.1},{f:415.30,d:.1},{f:466.16,d:.1},{f:523.25,d:.1},
  {f:622.25,d:.4},{f:0,d:.1},

  // "Мне плевать на Рождество" — акцентированные ноты
  {f:311.13,d:.3},{f:311.13,d:.15},{f:466.16,d:.15},
  {f:415.30,d:.3},{f:415.30,d:.15},{f:392,d:.15},
  {f:349.23,d:.5},{f:0,d:.2},

  // === Часть 4 — Рождественский вальс Гринча ===
  // Ритм 3/4 — но мрачный
  {f:261.63,d:.3},{f:392,d:.2},{f:466.16,d:.2},
  {f:523.25,d:.3},{f:466.16,d:.2},{f:415.30,d:.2},
  {f:392,d:.3},{f:349.23,d:.2},{f:311.13,d:.2},
  {f:293.66,d:.6},{f:0,d:.15},

  {f:261.63,d:.3},{f:392,d:.2},{f:523.25,d:.2},
  {f:622.25,d:.3},{f:523.25,d:.2},{f:466.16,d:.2},
  {f:415.30,d:.3},{f:392,d:.15},{f:349.23,d:.15},
  {f:311.13,d:.7},{f:0,d:.2},

  // === Часть 5 — Финальный аккорд злодея ===
  {f:261.63,d:.15},{f:311.13,d:.15},{f:392,d:.15},{f:466.16,d:.15},
  {f:523.25,d:.15},{f:466.16,d:.15},{f:392,d:.15},{f:311.13,d:.15},
  {f:261.63,d:.6},{f:0,d:.4},
];
const GIFT_TYPES=[
  {img:'watch',   sz:82, fallback:'⌚'},
  {img:'heart',   sz:78, fallback:'💛'},
  {img:'cauldron',sz:82, fallback:'🧪'},
  {img:'cookie',  sz:78, fallback:'🍪'},
  {img:'bag',     sz:76, fallback:'👜'},
  {img:'jar',     sz:80, fallback:'🫙'},
  {img:'lollipop',sz:76, fallback:'🍫'},
  {img:'icegem',  sz:82, fallback:'🧊'},
];

function renderShop(tab){
  if(tab===2){ renderTonShop(); return; }
  shopTabN=tab;
  try{document.getElementById('shopGifts').textContent=S.gifts;document.getElementById('shopGrinch').textContent=S.grinch;}catch(e){}
  const list=document.getElementById('shopList'); list.innerHTML='';
  const items=tab===0?SHOP.boosts:SHOP.skins;
  const BOOST_IMGS={
    slow:'⏱️', autobet:'🤖', hp:'❤️', totem:'🗿', magnet:'🌙', star:'⭐'
  };
  items.forEach(it=>{
    const owned=tab===1&&S.skin===it.key;
    const cnt=tab===0?(S.inv[it.key]||0):0;
    const maxed=tab===0&&it.max&&cnt>=it.max;
    const d=document.createElement('div');
    d.className='shop-item';
    const iconHTML = tab===0
      ? `<span style="font-size:32px;">${BOOST_IMGS[it.key]||'✨'}</span>`
      : `<span style="font-size:32px;">😈</span>`;
    d.innerHTML=`
      <div class="si-icon-wrap" style="background:${it.color}22;border:1px solid ${it.color}44;">
        ${iconHTML}
      </div>
      <div class="si-info">
        <div class="si-name">${it.name}</div>
        <div class="si-desc">${it.desc}</div>
        <div class="si-tags">
          <span class="si-tag" style="background:${it.color}22;color:${it.color};border:1px solid ${it.color}33;">${it.price} GRINCH</span>
          ${cnt>0?`<span class="si-tag" style="background:rgba(46,204,113,.15);color:#2ecc71;border:1px solid rgba(46,204,113,.3);">×${cnt}</span>`:''}
          ${owned?`<span class="si-tag" style="background:rgba(46,204,113,.15);color:#2ecc71;border:1px solid rgba(46,204,113,.3);">НАДЕТ</span>`:''}
        </div>
      </div>
      <button class="si-btn gold-btn" onclick="buyItem('${it.key}',${tab})" ${maxed||owned?'disabled style="opacity:.4"':''}>
        ${owned?'Надет':maxed?'Макс':'Купить'}
      </button>`;
    list.appendChild(d);
  });
}
// ── Level config ──────────────────────────────────────────
const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500,
  7500, 10000, 13000, 17000, 22000, 28000, 35000, 45000, 60000, 80000, 100000
];
function getLevel(gifts) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (gifts >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return Math.min(lvl, LEVEL_THRESHOLDS.length);
}
function getLevelProgress(gifts) {
  const lvl = getLevel(gifts);
  const cur = LEVEL_THRESHOLDS[lvl - 1] || 0;
  const next = LEVEL_THRESHOLDS[lvl] || LEVEL_THRESHOLDS[lvl - 1];
  if (lvl >= LEVEL_THRESHOLDS.length) return { pct: 100, cur: gifts, next: gifts, lvl };
  const pct = Math.min(100, Math.round((gifts - cur) / (next - cur) * 100));
  return { pct, cur, next, lvl, need: next - gifts };
}

// Fake game history (в реальном приложении — сохранять в S.gameHistory)
function getGameHistory() {
  if (!S.gameHistory || S.gameHistory.length === 0) {
    // Генерим правдоподобную историю на основе текущего уровня
    const base = Math.max(50, Math.floor(S.gifts / 10));
    return [
      { score: Math.floor(base * (1 + Math.random()*.5)), boosts: true,  time: '2 мин назад' },
      { score: Math.floor(base * (0.6 + Math.random()*.4)), boosts: false, time: '15 мин назад' },
      { score: Math.floor(base * (0.8 + Math.random()*.4)), boosts: true,  time: '1 час назад' },
      { score: Math.floor(base * (0.4 + Math.random()*.3)), boosts: false, time: '2 часа назад' },
      { score: Math.floor(base * (0.5 + Math.random()*.5)), boosts: false, time: 'вчера' },
    ];
  }
  return S.gameHistory.slice(-5).reverse();
}

function updateProfile() {
  const lp = getLevelProgress(S.gifts);
  const skinNames = { default:'DEFAULT', lord:'ЛОРД', knight:'РЫЦАРЬ', ronin:'РОНИН', thief:'ВОР' };

  // Basic info
  document.getElementById('profileName').textContent = S.nick;
  document.getElementById('profileId').textContent = 'ID: #' + S.nick.replace(/\D/g,'').padStart(4,'0').slice(0,4);
  document.getElementById('profileLevel').textContent = '🎄 LVL ' + lp.lvl;
  document.getElementById('pGifts').textContent = S.gifts.toLocaleString();
  document.getElementById('pGrinch').textContent = S.grinch.toLocaleString();
  document.getElementById('pRefs').textContent = S.refs;
  document.getElementById('pRefEarned').textContent = S.refEarned.toLocaleString();

  const skinBadge = document.getElementById('skinBadge');
  if (skinBadge) skinBadge.textContent = skinNames[S.skin] || 'DEFAULT';

  // ── Level progress bar ──
  const lvlBar = document.getElementById('profileLvlBar');
  const lvlFill = document.getElementById('profileLvlFill');
  const lvlNext = document.getElementById('profileLvlNext');
  const lvlFrom = document.getElementById('profileLvlFrom');
  const lvlTo   = document.getElementById('profileLvlTo');
  if (lvlFill) lvlFill.style.width = lp.pct + '%';
  if (lvlNext) lvlNext.textContent = lp.lvl >= 21 ? 'МАКС' : 'До LVL ' + (lp.lvl + 1) + ': ' + lp.need?.toLocaleString() + ' 🎁';
  if (lvlFrom) lvlFrom.textContent = 'LVL ' + lp.lvl;
  if (lvlTo)   lvlTo.textContent   = lp.lvl >= 21 ? 'МАКС' : 'LVL ' + (lp.lvl + 1);

  // ── Season bank ──
  const sbVal  = document.getElementById('profileSeasonBank');
  const sbRank = document.getElementById('profileSeasonRank');
  if (sbVal) sbVal.textContent = (S.seasonBank || S.gifts).toLocaleString();
  if (sbRank) {
    const rank = S.gifts < 500 ? '#???' : S.gifts < 2000 ? 'Топ 1000' : S.gifts < 5000 ? 'Топ 500' : S.gifts < 15000 ? 'Топ 100' : 'Топ 50';
    sbRank.textContent = rank;
  }

  // ── Game history ──
  const histEl = document.getElementById('profileHistory');
  if (histEl) {
    const history = getGameHistory();
    histEl.innerHTML = history.map((g, i) => {
      const badge = g.score >= 300 ? ['great','🔥 ТОП'] : g.score >= 150 ? ['good','⭐ ХОРОШО'] : ['ok','OK'];
      return `
        <div class="ph-row">
          <div class="ph-num">${i+1}</div>
          <div class="ph-icon">🎁</div>
          <div class="ph-info">
            <div class="ph-score">${g.score.toLocaleString()} подарков</div>
            <div class="ph-meta">${g.time}${g.boosts ? ' · с бафами' : ''}</div>
          </div>
          <div class="ph-badge ${badge[0]}">${badge[1]}</div>
        </div>`;
    }).join('');
  }

  renderProfileInv();
  if (S.wallet) showWalletConn(S.wallet);
}
// ===== WALLET =====
const FAKE_PLAYERS=[
  'CryptoGrinch','TonHunter','GiftMaster','GreenDemon','SantaKiller',
  'FrostBite','XmasRekt','TonBoy','GrinchKing','WhovillePlayer',
  'DarkElf','GiftSniper','NightGrinch','StarCatcher','MoonWalker',
  'IceDragon','SnowHunter','GiftBandit','TonWhale','XmasGhost',
  'NightOwl','GiftRaider','ColdWave','SnowBall','GiftHunter42',
  'WinterKing','FrostMage','SnowQueen','GiftLord','TonMaster99',
  'XmasRaider','IceKnight','GiftWizard','ColdBlood','SnowTiger',
  'NightRider','TonLegend','GiftPhantom','FrostBlade','SnowWolf',
  'GiftNinja','CryptoElf','TonWarrior','XmasDevil','IceGiant',
  'SnowGhost','GiftReaper','WinterWolf','TonGhost','FrostKing50',
];
function renderRating(){
  const list=document.getElementById('ratingList');list.innerHTML='';
  const players=[...FAKE_PLAYERS.map((n,i)=>({name:n,gifts:Math.floor(5000-i*80-Math.random()*50)}))];
  // Insert self
  const myScore=S.gifts;
  const myIdx=players.findIndex(p=>p.gifts<=myScore);
  if(myIdx>=0) players.splice(myIdx,0,{name:S.nick,gifts:myScore,isMe:true});
  else players.push({name:S.nick,gifts:myScore,isMe:true});
  players.slice(0,50).forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='ri'+(p.isMe?' me':'');
    const pos=i+1;
    const posStr=pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':('#'+pos);
    const avatarEmoji=p.isMe?'😈':'🎄';
    d.innerHTML=`<div class="ri-pos">${posStr}</div><div class="ri-avatar">${avatarEmoji}</div><div class="ri-name">${p.name}${p.isMe?'<span class="ri-you">ТЫ</span>':''}</div><div class="ri-gifts">🎁 ${p.gifts}</div>`;
    list.appendChild(d);
  });
}

const QUESTS_GAME = [
  {id:'catch10',   icon:'🎁', name:'Первые шаги',        desc:'Поймай 10 подарков',   reward:50,   rewardType:'grinch', goal:10,   progress:()=>S.gifts},
  {id:'catch100',  icon:'🎄', name:'Коллекционер',        desc:'Поймай 100 подарков',  reward:200,  rewardType:'grinch', goal:100,  progress:()=>S.gifts},
  {id:'catch500',  icon:'🏆', name:'Охотник за подарками',desc:'Поймай 500 подарков',  reward:1000, rewardType:'grinch', goal:500,  progress:()=>S.gifts},
  {id:'catch2000', icon:'🔥', name:'Мастер подарков',     desc:'Поймай 2000 подарков', reward:5000, rewardType:'grinch', goal:2000, progress:()=>S.gifts},
  {id:'invite1',   icon:'👥', name:'Социальная сеть',     desc:'Пригласи 1 друга',     reward:300,  rewardType:'grinch', goal:1,    progress:()=>S.refs},
  {id:'invite5',   icon:'🌟', name:'Лидер',               desc:'Пригласи 5 друзей',    reward:1500, rewardType:'grinch', goal:5,    progress:()=>S.refs},
  {id:'buy_boost', icon:'🛒', name:'Первая покупка',      desc:'Купи любой буст',      reward:100,  rewardType:'grinch', goal:1,    progress:()=>Object.values(S.inv).reduce((a,b)=>a+b,0)},
  {id:'wallet',    icon:'💎', name:'Crypto-Grinch',       desc:'Подключи TON кошелёк', reward:500,  rewardType:'grinch', goal:1,    progress:()=>S.wallet?1:0},
];

const QUESTS_CHANNELS_TG = [
  {id:'ch_main',    icon:'📣', name:'Основной канал',   desc:'Подпишись на @GrinchGameOfficial', url:'https://t.me/GrinchGameOfficial', reward:500,  rewardGifts:0},
  {id:'ch_news',    icon:'📰', name:'Новости проекта',  desc:'Подпишись на @GrinchGameNews',     url:'https://t.me/GrinchGameNews',     reward:300,  rewardGifts:0},
  {id:'ch_chat',    icon:'💬', name:'Чат сообщества',   desc:'Вступи в @GrinchGameChat',         url:'https://t.me/GrinchGameChat',     reward:200,  rewardGifts:0},
  {id:'ch_blum',    icon:'🌸', name:'Blum',             desc:'Торгуй GRINCH на Blum',            url:'https://t.me/blum/app?startapp=ref_90QjFKH4Jc', reward:400, rewardGifts:500},
];
const QUESTS_CHANNELS_SOCIAL = [
  {id:'ch_twitter', icon:'🐦', name:'Twitter / X',      desc:'Подпишись на @GrinchGameX',        url:'https://x.com/GrinchGameX',       reward:400,  rewardGifts:200},
  {id:'ch_youtube', icon:'▶️', name:'YouTube',          desc:'Подпишись на GrinchGame YouTube',  url:'https://youtube.com/@GrinchGame', reward:300,  rewardGifts:100},
];
const QUESTS_CHANNELS = [...QUESTS_CHANNELS_TG, ...QUESTS_CHANNELS_SOCIAL];

const EXCHANGES = [
  {id:'ex_blum',  icon:'🌸', name:'Blum',       desc:'Telegram Mini App биржа',      url:'https://t.me/blum/app?startapp=ref_90QjFKH4Jc'},
  {id:'ex_ston',  icon:'⚡', name:'STON.fi',     desc:'DEX на TON блокчейне',         url:'https://app.ston.fi/swap?chartVisible=false&chartInterval=24h'},
  {id:'ex_coffee',icon:'☕', name:'swap.coffee', desc:'TON DEX агрегатор',            url:'https://swap.coffee/dex'},
];

const QUESTS_BUY = [
  {id:'buy_q1', icon:'🌱', name:'Первая покупка',   tonAmount:1,   grinchMin:10000,  rewardGifts:2000,  rewardGrinch:1000,  desc:'Купи GRINCH на сумму от 1 TON'},
  {id:'buy_q2', icon:'🪙', name:'Инвестор',         tonAmount:5,   grinchMin:50000,  rewardGifts:8000,  rewardGrinch:5000,  desc:'Купи GRINCH на сумму от 5 TON'},
  {id:'buy_q3', icon:'💎', name:'Серьёзный игрок',  tonAmount:10,  grinchMin:100000, rewardGifts:20000, rewardGrinch:12000, desc:'Купи GRINCH на сумму от 10 TON'},
  {id:'buy_q4', icon:'🔷', name:'Крупный игрок',    tonAmount:25,  grinchMin:250000, rewardGifts:50000, rewardGrinch:30000, desc:'Купи GRINCH на сумму от 25 TON'},
  {id:'buy_q5', icon:'🐋', name:'Кит',              tonAmount:50,  grinchMin:500000, rewardGifts:120000,rewardGrinch:70000, desc:'Купи GRINCH на сумму от 50 TON'},
  {id:'buy_q6', icon:'👑', name:'Легенда',          tonAmount:100, grinchMin:1000000,rewardGifts:250000,rewardGrinch:150000,desc:'Купи GRINCH на сумму от 100 TON'},
];

function renderGameQuests(list){
  QUESTS_GAME.forEach(q=>{
    const done = S.questsDone.includes(q.id);
    const prog = q.progress();
    const pct = Math.min(1, prog/q.goal);
    const canClaim = pct>=1 && !done;
    const d = document.createElement('div');
    d.className = 'quest-item' + (done?' done':'');
    d.innerHTML = `
      <div class="qi-icon">${q.icon}</div>
      <div class="qi-info">
        <div class="qi-name">${q.name}</div>
        <div class="qi-desc">${q.desc}</div>
        <div class="qi-prog-wrap"><div class="qi-prog" style="width:${pct*100}%"></div></div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px;">${Math.min(prog,q.goal)} / ${q.goal}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="qi-reward">+${q.reward} GRINCH</div>
        ${canClaim ? `<button class="qi-claim" onclick="claimGameQuest('${q.id}')">Забрать</button>` : done ? '<div class="qi-done-badge">✅ Готово</div>' : ''}
      </div>`;
    list.appendChild(d);
  });
}

function renderTonQuests(list){
  // Contract info banner
  const contractBanner = document.createElement('div');
  contractBanner.style.cssText = 'background:linear-gradient(135deg,rgba(241,196,15,.1),rgba(46,204,113,.08));border:1px solid rgba(241,196,15,.25);border-radius:14px;padding:12px 14px;margin-bottom:2px;';
  contractBanner.innerHTML = `
    <div style="font-size:10px;color:var(--text2);margin-bottom:4px;letter-spacing:1px;">КОНТРАКТ GRINCH TOKEN</div>
    <div style="font-size:11px;font-weight:700;color:#f1c40f;word-break:break-all;margin-bottom:8px;">${GRINCH_CONTRACT}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${EXCHANGES.map(e=>`<button onclick="openChannel('${e.url}')" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;color:white;cursor:pointer;display:flex;align-items:center;gap:4px;">${e.icon} ${e.name}</button>`).join('')}
    </div>`;
  list.appendChild(contractBanner);

  // Section header
  list.appendChild(makeSectionHeader('🏆 ЗАДАНИЯ ЗА ПОКУПКУ'));

  // Info note
  const note = document.createElement('div');
  note.style.cssText = 'background:rgba(0,136,204,.08);border:1px solid rgba(0,136,204,.15);border-radius:10px;padding:8px 12px;font-size:10px;color:var(--text2);line-height:1.5;';
  note.innerHTML = '💡 Купи токен <b style="color:white;">GRINCH</b> на любой из бирж и нажми «Подтвердить». Вознаграждение зачисляется после проверки транзакции.';
  list.appendChild(note);

  QUESTS_BUY.forEach(q => {
    const done = S.questsDone.includes(q.id);
    const d = document.createElement('div');
    d.className = 'ton-quest' + (done?' done':'');
    d.innerHTML = `
      <div class="tq-icon">${q.icon}</div>
      <div class="tq-info" style="flex:1;">
        <div class="tq-name">${q.name}</div>
        <div class="tq-ton">${q.desc}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0;">
          <span style="font-size:12px;font-weight:700;color:#f1c40f;">+${q.rewardGifts.toLocaleString()} 🎁</span>
          <span style="font-size:12px;font-weight:700;color:#2ecc71;">+${q.rewardGrinch.toLocaleString()} GRINCH</span>
        </div>
      </div>
      <div style="flex-shrink:0;">
        ${done
          ? '<div class="qi-done-badge">✅ Готово</div>'
          : `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
              <button class="tq-btn" style="font-size:10px;padding:5px 8px;" onclick="openChannel('${EXCHANGES[0].url}')">Купить</button>
              <button class="tq-btn" style="font-size:10px;padding:5px 8px;background:rgba(46,204,113,.2);border:1px solid rgba(46,204,113,.3);color:#2ecc71;" onclick="openTxModal('${q.id}')">Подтвердить</button>
            </div>`
        }
      </div>`;
    list.appendChild(d);
  });
}

function updateBoostPanel(){
  try {
    const keys = ['slow','magnet','totem','star','hp'];
    keys.forEach(k=>{
      const cnt = S.inv[k]||0;
      // Update count labels (may have duplicates in DOM, update all)
      document.querySelectorAll('#bp-'+k).forEach(el=>{ el.textContent='×'+cnt; });
      // Update parent button opacity
      const btn = document.getElementById('bb-'+k);
      if(btn) btn.style.opacity = cnt>0?'1':'0.4';
    });
  } catch(e){}
}

const TON_PACKAGES = [
  {id:'ton1', ton:0.5,  grinch:5000,   icon:'💎',  label:'Старт',   bonus:''},
  {id:'ton2', ton:1,    grinch:11000,  icon:'💎💎', label:'Базовый', bonus:'+10%', popular:false},
  {id:'ton3', ton:2,    grinch:25000,  icon:'🔷',   label:'Продвинутый', bonus:'+25%', popular:true},
  {id:'ton4', ton:5,    grinch:70000,  icon:'🏆',   label:'Кит',     bonus:'+40%', popular:false},
  {id:'ton5', ton:10,   grinch:160000, icon:'👑',   label:'Легенда', bonus:'+60%', popular:false},
  {id:'ton6', ton:0.1,  grinch:900,    icon:'🪙',   label:'Попробовать', bonus:''},
];

const PROJECT_WALLET = 'UQANtz4OYsv19QgYAzsvmPp8vCA6RtNLrP-Q-PvBNtcQLkYk';
// MINER_INCOME: доход/час для updateMenu (key = miner.id)
const MINER_INCOME = {
  m_g1: Math.floor(250/24),   m_g2: Math.floor(1000/24),
  m_g3: Math.floor(3000/24),  m_g4: Math.floor(10000/24),  m_g5: Math.floor(30000/24),
  m_t1: Math.floor(250/24),   m_t2: Math.floor(1000/24),
  m_t3: Math.floor(2500/24),  m_t4: Math.floor(7500/24),   m_t5: Math.floor(25000/24),
};
const GRINCH_CONTRACT = 'EQCjZmjHXzuFqx5J0o9oQbO-1d9o_fuKX5BOIvOH8sX6KQFj';
function renderTonShop(){
  const list = document.getElementById('shopList');
  list.style.padding = '0';
  list.style.gap = '0';
  list.innerHTML = '';

  // Hero block
  const hero = document.createElement('div');
  hero.className = 'ton-hero';
  hero.innerHTML = `
    <div class="ton-hero-title">💎 TON → GRINCH</div>
    <div class="ton-hero-sub">Купи токены GRINCH за TON криптовалюту.<br>Токены используются для покупки бустов и скинов.</div>
    <div class="ton-rate-badge">1 TON = 10,000 GRINCH</div>
  `;
  list.appendChild(hero);

  // Wallet status row
  const walletRow = document.createElement('div');
  walletRow.style.cssText = 'padding:10px 12px 0;';
  walletRow.innerHTML = `
    <div class="ton-wallet-row">
      ${S.wallet
        ? `<div class="ton-wallet-addr">✅ ${S.wallet}</div><button class="ton-conn-btn" onclick="disconnectWallet()">Отключить</button>`
        : `<div style="font-size:12px;color:var(--text2);">💳 Кошелёк не подключён</div><button class="ton-conn-btn" onclick="connectWallet()">💎 Подключить</button>`
      }
    </div>`;
  list.appendChild(walletRow);

  // Packages grid
  const grid = document.createElement('div');
  grid.className = 'ton-packages';
  TON_PACKAGES.forEach(pkg => {
    const d = document.createElement('div');
    d.className = 'ton-pkg' + (pkg.popular ? ' popular' : '');
    d.innerHTML = `
      ${pkg.popular ? '<div class="ton-pkg-badge">🔥 ХИТ</div>' : ''}
      <div class="ton-pkg-icon">${pkg.icon}</div>
      <div style="font-size:10px;color:var(--text2);letter-spacing:1px;text-transform:uppercase;">${pkg.label}</div>
      <div class="ton-pkg-grinch">${pkg.grinch.toLocaleString()} <span>GRINCH</span></div>
      <div class="ton-pkg-ton">${pkg.ton} <span>TON</span></div>
      ${pkg.bonus ? `<div class="ton-pkg-bonus">${pkg.bonus} бонус</div>` : ''}
      <button class="ton-buy-btn" onclick="openTonDeposit('${pkg.id}')">Купить</button>
    `;
    grid.appendChild(d);
  });
  list.appendChild(grid);

  // Info block
  const info = document.createElement('div');
  info.className = 'ton-info-block';
  info.innerHTML = `
    <div style="font-size:13px;font-weight:700;margin-bottom:2px;">ℹ️ Как это работает</div>
    <div class="ton-info-row"><span>1️⃣</span><span>Нажми "Купить" и скопируй адрес кошелька</span></div>
    <div class="ton-info-row"><span>2️⃣</span><span>Отправь TON через любой кошелёк (Tonkeeper, Tonhub и др.)</span></div>
    <div class="ton-info-row"><span>3️⃣</span><span>В комментарии укажи свой Telegram username</span></div>
    <div class="ton-info-row"><span>4️⃣</span><span>GRINCH токены зачислятся в течение 1-5 минут</span></div>
    <div class="ton-info-row"><span>⚠️</span><span>Минимальная сумма: 0.1 TON. Комиссия сети ~0.01 TON.</span></div>
  `;
  list.appendChild(info);
}


