
const hero = document.getElementById('hero');
const fx = document.getElementById('fx');
const dc = document.getElementById('decals');
const c = fx.getContext('2d');
const d = dc.getContext('2d');

const flash = document.getElementById('flash');
const ammoEl = document.getElementById('ammo');
const ov = document.getElementById('ov');

let W=0,H=0,P=[],T=[];
let ammo=12,reloading=false,actx=null;

function size(){
  const r=hero.getBoundingClientRect();
  const k=Math.min(window.devicePixelRatio||1,2);

  [fx,dc].forEach(cv=>{
    cv.width=r.width*k;
    cv.height=r.height*k;
  });

  c.setTransform(k,0,0,k,0,0);
  d.setTransform(k,0,0,k,0,0);
  W=r.width;
  H=r.height;
}

size();
addEventListener('resize',size);

const dr=document.getElementById('drips');

for(let i=0;i<9;i++){
  const e=document.createElement('div');
  e.className='drip';
  e.style.left=(6+i*11+Math.random()*5)+'%';
  e.style.width=(5+Math.random()*6)+'px';
  e.style.setProperty('--h',(50+Math.random()*130)+'px');
  e.style.animationDelay=(-Math.random()*7)+'s';
  e.style.animationDuration=(5+Math.random()*5)+'s';
  dr.appendChild(e);
}

// Sound effects
function snd(){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();

    if(actx.state==='suspended')actx.resume();

    const n=actx.sampleRate*.35;
    const b=actx.createBuffer(1,n,actx.sampleRate);
    const a=b.getChannelData(0);

    for(let i=0;i<n;i++)
      a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.5);

    const s=actx.createBufferSource();
    const f=actx.createBiquadFilter();
    const g=actx.createGain();

    s.buffer=b;
    f.type='lowpass';
    f.frequency.value=1800;
    g.gain.value=.7;

    s.connect(f);
    f.connect(g);
    g.connect(actx.destination);
    s.start();

    const o=actx.createOscillator();
    const og=actx.createGain();

    o.frequency.setValueAtTime(140,actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40,actx.currentTime+.15);

    og.gain.setValueAtTime(.8,actx.currentTime);
    og.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.18);

    o.connect(og);
    og.connect(actx.destination);
    o.start();
    o.stop(actx.currentTime+.2);
  }catch(e){}
}

function clickSound(){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended')actx.resume();

    const o=actx.createOscillator();
    const g=actx.createGain();

    o.type='square';
    o.frequency.value=900;
    g.gain.setValueAtTime(.15,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.05);

    o.connect(g);
    g.connect(actx.destination);
    o.start();
    o.stop(actx.currentTime+.06);
  }catch(e){}
}

function hole(x,y){
  const g=d.createRadialGradient(x,y,0,x,y,16);
  g.addColorStop(0,'#000');
  g.addColorStop(.35,'#000c');
  g.addColorStop(1,'#0000');

  d.fillStyle=g;
  d.beginPath();
  d.arc(x,y,16,0,7);
  d.fill();

  d.strokeStyle='#ffffff40';
  d.lineWidth=1;

  for(let i=0;i<7;i++){
    const a=Math.random()*6.28;
    const l=10+Math.random()*26;

    d.beginPath();
    d.moveTo(x,y);
    d.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);
    d.stroke();
  }

  d.fillStyle='#050505';
  d.beginPath();
  d.arc(x,y,3.5,0,7);
  d.fill();
}

function stain(x,y,r){
  d.fillStyle='rgba('+(110+Math.random()*60|0)+',8,22,.8)';
  d.beginPath();
  d.arc(x,y,r,0,7);
  d.fill();
}

function blood(x,y,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.28;
    const s=1+Math.random()*7;

    P.push({
      x,y,
      vx:Math.cos(a)*s,
      vy:Math.sin(a)*s-2,
      r:1+Math.random()*3.2,
      l:1
    });
  }

  stain(x,y,6+Math.random()*8);

  for(let j=0;j<Math.ceil(n/6);j++){
    stain(
      x+(Math.random()-.5)*50,
      y+(Math.random()-.5)*50,
      2+Math.random()*5
    );
  }
}

function reload(){
  if(reloading)return;

  reloading=true;
  ammoEl.textContent='RELOADING...';

  setTimeout(()=>{
    ammo=12;
    reloading=false;
    ammoEl.textContent='AMMO 12 / 12';
  },1100);
}

function shoot(x,y,big){
  if(reloading)return;

  if(ammo<=0){
    clickSound();
    reload();
    return;
  }

  ammo--;
  ammoEl.textContent='AMMO '+ammo+' / 12';

  snd();

  T.push({
    x0:W*(.3+Math.random()*.4),
    y0:H+10,
    x1:x,y1:y,l:1
  });

  flash.style.transition='none';
  flash.style.opacity=.35;

  requestAnimationFrame(()=>{
    flash.style.transition='opacity .18s';
    flash.style.opacity=0;
  });

  hero.classList.remove('shake');
  void hero.offsetWidth;
  hero.classList.add('shake');

  hole(x,y);
  blood(x,y,big?55:28);

  if(ammo===0)setTimeout(reload,500);
}

function loop(){
  c.clearRect(0,0,W,H);

  for(let i=T.length-1;i>=0;i--){
    const t=T[i];
    t.l-=.12;

    if(t.l<=0){
      T.splice(i,1);
      continue;
    }

    const g=c.createLinearGradient(t.x0,t.y0,t.x1,t.y1);
    g.addColorStop(0,'rgba(255,200,110,0)');
    g.addColorStop(1,'rgba(255,230,160,'+t.l+')');

    c.strokeStyle=g;
    c.lineWidth=2.2;
    c.beginPath();
    c.moveTo(t.x0,t.y0);
    c.lineTo(t.x1,t.y1);
    c.stroke();
  }

  for(let k=P.length-1;k>=0;k--){
    const p=P[k];

    p.vy+=.35;
    p.x+=p.vx;
    p.y+=p.vy;
    p.vx*=.97;
    p.l-=.02;

    if(p.l<=0||p.y>H){
      if(p.y<H&&Math.random()<.5)
        stain(p.x,p.y,p.r*.8);

      P.splice(k,1);
      continue;
    }

    c.fillStyle='rgba(190,15,35,'+Math.min(1,p.l*1.5)+')';
    c.beginPath();
    c.arc(p.x,p.y,p.r,0,7);
    c.fill();
  }

  requestAnimationFrame(loop);
}

loop();

// Discord demo account
const CFG={
  clientId:'',
  redirect:'',
  scope:'identify'
};

const $=id=>document.getElementById(id);

function save(u){
  try{
    localStorage.setItem('omerta_user',JSON.stringify(u));
  }catch(e){}
}

function load(){
  try{
    return JSON.parse(localStorage.getItem('omerta_user'));
  }catch(e){
    return null;
  }
}

function clearUser(){
  try{
    localStorage.removeItem('omerta_user');
  }catch(e){}
}

const q=new URLSearchParams(location.search);

if(q.get('discord_id')){
  save({
    id:q.get('discord_id'),
    name:q.get('discord_name')||'Player',
    wl:q.get('wl')||'PENDING'
  });
}

function view(){
  const u=load();

  $('s1').style.display=u?'none':'block';
  $('s2').style.display=u?'block':'none';

  if(u){
    $('un').textContent=u.name;
    $('did').textContent=u.id;
    $('wl').textContent=u.wl;
    $('wl').style.color=
      u.wl==='APPROVED'?'#69df9b':'#d5ad65';

    $('av').textContent=u.name.charAt(0).toUpperCase();
    $('meta').textContent='CONNECTED';
    $('go').innerHTML='<b>◆</b> CONNECTED — OPEN PROFILE';
  }else{
    $('go').innerHTML='<b>◆</b> LOGIN WITH DISCORD';
  }
}

function openOv(){
  view();
  ov.classList.add('on');
}

hero.addEventListener('pointerdown',e=>{
  if(ov.classList.contains('on'))return;

  const r=hero.getBoundingClientRect();
  const gb=e.target.closest('#go');

  if(gb){
    const b=gb.getBoundingClientRect();

    shoot(
      b.left-r.left+b.width/2,
      b.top-r.top+b.height/2,
      true
    );

    setTimeout(openOv,650);
    return;
  }

  shoot(e.clientX-r.left,e.clientY-r.top,false);
});

$('close').addEventListener('click',()=>{
  ov.classList.remove('on');
});

$('auth').addEventListener('click',()=>{
  if(CFG.clientId&&CFG.redirect){
    location.href=
      'https://discord.com/api/oauth2/authorize?client_id='+
      CFG.clientId+
      '&redirect_uri='+encodeURIComponent(CFG.redirect)+
      '&response_type=code&scope='+CFG.scope;
    return;
  }

  save({
    id:String(Math.floor(1e17+Math.random()*9e17)),
    name:'DemoPlayer',
    wl:'PENDING'
  });

  view();
});

$('logout').addEventListener('click',()=>{
  clearUser();
  view();
});

$('launch').addEventListener('click',()=>{
  $('meta').textContent='LAUNCHER COMING SOON';
});

view();
