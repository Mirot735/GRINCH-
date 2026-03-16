const SHOP={
  boosts:[
    {key:'slow',icon:'shop-slow',name:'Замедление',desc:'Подарки падают медленно 30 сек. До 10 шт.',price:50,color:'#3498db',max:10},
    {key:'autobet',icon:'shop-auto',name:'Автосбор',desc:'100 подарков/день. 7 дней.',price:2000,color:'#e67e22',max:1},
    {key:'hp',icon:'shop-hp',name:'Доп. Жизнь',desc:'+1 HP в раунде. До 10 шт.',price:30,color:'#e74c3c',max:10},
    {key:'totem',icon:'shop-totem',name:'Тотем',desc:'Воскрешение после смерти. 19 сек замедление.',price:500,color:'#9b59b6',max:3},
    {key:'magnet',icon:'shop-magnet',name:'Магнит',desc:'20 сек притягивает подарки.',price:400,color:'#8e44ad',max:5},
    {key:'star',icon:'shop-star',name:'Звёздный хруст',desc:'Двойная награда 15 сек.',price:200,color:'#f1c40f',max:10},
  ],
  skins:[
    {key:'lord',name:'Лорд Гринч',desc:'Тёмная королевская мантия с короной.',price:1500,color:'#9b59b6'},
    {key:'knight',name:'Рыцарь Гринч',desc:'Стальные доспехи. Средневековый стиль.',price:800,color:'#7f8c8d'},
    {key:'ronin',name:'Ронин Гринч',desc:'Самурайский стиль. Катана и кимоно.',price:1200,color:'#e74c3c'},
    {key:'thief',name:'Вор Гринч',desc:'Маска и лом. Тёмный плащ.',price:1000,color:'#2c3e50'},
  ]
};

function renderProfileInv(){
  const grid=document.getElementById('profileInvGrid');
  const INV_META={slow:{icon:'⏱️',name:'Замедление'},hp:{icon:'❤️',name:'Доп.HP'},totem:{icon:'🗿',name:'Тотем'},magnet:{icon:'🌙',name:'Магнит'},star:{icon:'⭐',name:'Звёзд.хруст'},autobet:{icon:'🤖',name:'Автосбор'}};
  const keys=Object.keys(S.inv).filter(k=>S.inv[k]>0);
  if(!keys.length){grid.innerHTML='<div class="pi-empty">Инвентарь пуст 😢<br>Купи в магазине!</div>';return;}
  grid.innerHTML='';
  keys.forEach(k=>{
    const m=INV_META[k]||{icon:'❓',name:k};
    const d=document.createElement('div');d.className='pi-item';
    d.innerHTML=`<div class="pi-item-icon">${m.icon}</div><div class="pi-item-name">${m.name}</div><div class="pi-item-count">×${S.inv[k]}</div>`;
    grid.appendChild(d);
  });
}
