(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('runnerStage');
  const canvas = $('runnerCanvas');
  const ctx = canvas.getContext('2d');
  const modal = $('gameModal');
  const levels = [
    {name:'EL ABRAZO', prize:'un abrazo', emoji:'🫂', target:100, detail:'Vale por un abrazo de esos que hacen bien.'},
    {name:'EL BESO', prize:'un beso', emoji:'💛', target:200, detail:'Vale por un beso. Siempre con ganas de los dos.'},
    {name:'LA SALIDA', prize:'una salida a comer', emoji:'🍽️', target:300, detail:'Vale por una salida a comer. El lugar lo eligen ustedes.'}
  ];
  let level=0, score=0, lives=3, timeLeft=35, lane=1, running=false, entered=false, musicOn=true;
  let w=0,h=0,dpr=1,lastFrame=0,roadTime=0,spawnClock=.35,gateProgress=0,hitCooldown=0;
  let objects=[], lastFocus, messageTimeout, claimTimeout, claimStage=0, notificationPending=false;
  const random=(a,b)=>a+Math.random()*(b-a);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function setMusicState(on){
    musicOn=on;
    $('soundBtn').setAttribute('aria-pressed',String(on));
    $('soundBtn').setAttribute('aria-label',on?'Apagar música':'Encender música');
    $('soundBtn').classList.toggle('muted',!on);
  }
  function loadMusic(){
    $('playerSlot').replaceChildren();
    const iframe=document.createElement('iframe');
    iframe.title='Flores Amarillas de Floricienta en YouTube';
    iframe.allow='autoplay; encrypted-media';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.src='https://www.youtube.com/embed/gv63CGCx6vg?autoplay=1&playsinline=1&controls=0';
    $('playerSlot').appendChild(iframe);
  }
  $('enterBtn').addEventListener('click',()=>{
    if(entered)return;
    entered=true;
    loadMusic();
    $('entry').classList.add('open');
    document.body.classList.remove('awaiting-entry');
    setTimeout(()=>{$('entry').remove();$('playBtn').focus({preventScroll:true});},1100);
  });
  $('soundBtn').addEventListener('click',()=>{
    if(!entered)return;
    setMusicState(!musicOn);
    if(musicOn)loadMusic();else $('playerSlot').replaceChildren();
  });

  function resize(){
    const rect=stage.getBoundingClientRect();
    w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    setGirlPosition();
  }
  new ResizeObserver(resize).observe(stage);
  function setGirlPosition(){
    $('runnerGirl').style.left=(w/2+(lane-1)*w*.29)+'px';
  }
  function move(direction){
    if(!running||gateProgress)return;
    const next=clamp(lane+direction,0,2);
    if(next===lane)return;
    lane=next;setGirlPosition();
    $('liveStatus').textContent='Carril '+['izquierdo','central','derecho'][lane];
  }
  let pointerX=null;
  stage.addEventListener('pointerdown',e=>{if(!running)return;pointerX=e.clientX;});
  stage.addEventListener('pointerup',e=>{
    if(pointerX===null)return;
    const dx=e.clientX-pointerX;pointerX=null;
    if(Math.abs(dx)>30)move(dx>0?1:-1);
  });
  stage.addEventListener('pointercancel',()=>{pointerX=null;});
  $('laneLeft').addEventListener('click',()=>move(-1));
  $('laneRight').addEventListener('click',()=>move(1));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!modal.hidden)closeModal();
    if(!running)return;
    if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();move(-1);}
    if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();move(1);}
  });

  function showMessage(message){
    const el=$('runnerMessage');el.textContent=message;el.classList.add('show');
    clearTimeout(messageTimeout);messageTimeout=setTimeout(()=>el.classList.remove('show'),1150);
    $('liveStatus').textContent=message;
  }
  function updateLevel(){
    const current=levels[level];
    $('levelTitle').textContent='TRAMO '+(level+1)+' · '+current.name+' '+current.emoji;
    $('levelPath').querySelectorAll('span').forEach((item,i)=>{
      item.classList.toggle('current',i===level);
      item.classList.toggle('done',i<level);
    });
    $('modalKicker').textContent='TRAMO '+(level+1)+' DE 3 · '+current.name+' '+current.emoji;
    document.querySelector('.progress-track').setAttribute('aria-valuemax',String(current.target));
    updateHUD();
  }
  function updateHUD(){
    const target=levels[level].target;
    $('scoreValue').textContent=score+' / '+target;
    $('hudFlowers').textContent='🌼 '+score+' / '+target;
    const hearts='♥ '.repeat(lives)+'♡ '.repeat(3-lives);
    $('livesValue').textContent=hearts.trim();
    $('hudLives').textContent=hearts.trim();
    $('hudLives').setAttribute('aria-label',lives+' de 3 vidas');
    $('hudTime').textContent=Math.ceil(timeLeft)+' s';
    document.querySelector('.progress-track').setAttribute('aria-valuenow',String(Math.min(score,target)));
    $('progressBar').style.width=(clamp((score-level*100)/100,0,1)*100)+'%';
  }
  function openModal(){
    lastFocus=document.activeElement;
    modal.hidden=false;document.body.style.overflow='hidden';$('startBtn').focus();
  }
  function closeModal(){
    modal.hidden=true;document.body.style.overflow='';
    if(lastFocus?.focus)lastFocus.focus({preventScroll:true});
  }
  function startGame(){
    running=true;score=level*100;lives=3;timeLeft=35;lane=1;objects=[];spawnClock=.4;gateProgress=0;hitCooldown=0;
    updateLevel();setGirlPosition();closeModal();
    stage.classList.add('is-running');
    $('gardenHint').textContent='Deslizá · juntá '+levels[level].target+' flores';
    $('runnerCallout').textContent='Cada flor 🌼 suma 10';
    $('playBtn').textContent='Volver a la carrera ↗';
    stage.scrollIntoView({behavior:'smooth',block:'center'});
    stage.focus({preventScroll:true});
    showMessage('¡A correr por el vale! '+levels[level].emoji);
  }
  function endGame(won){
    if(!running)return;
    running=false;gateProgress=0;objects=[];stage.classList.remove('is-running');
    $('gardenHint').textContent='Deslizá a izquierda o derecha';
    const current=levels[level];
    updateHUD();
    if(won){
      $('modalTitle').textContent='¡Llegaste al vale de '+current.prize+'! '+current.emoji;
      $('modalText').textContent=current.detail+' Juntaste '+score+' flores amarillas.';
      $('gameState').textContent=level<2?'El próximo vale está en '+levels[level+1].target+' flores.':'¡Conseguiste los tres vales! Ahora viene la sorpresa.';
      $('startBtn').textContent=level<2?'Ir al siguiente tramo ↗':'Reclamar premios ↗';
      if(level<2){level++;$('startBtn').onclick=startGame;}
      else $('startBtn').onclick=openClaim;
    }else{
      $('modalTitle').textContent=lives?'¡Casi llegás al vale! 🌼':'¡Uy, una maceta! 🌼';
      $('modalText').textContent=(lives?'Se terminó este tramo.':'Se terminaron las tres vidas.')+' Juntaste '+score+' de '+current.target+' flores.';
      $('gameState').textContent='Reintentás este tramo desde '+(level*100)+' flores; los vales anteriores ya son tuyos.';
      $('startBtn').textContent='Reintentar tramo '+(level+1)+' ↗';
      $('startBtn').onclick=startGame;
    }
    showMessage($('modalTitle').textContent);openModal();
  }
  $('playBtn').addEventListener('click',()=>{
    if(running){stage.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(level>=3)level=0;
    const current=levels[level];
    score=level*100;lives=3;timeLeft=35;
    updateLevel();
    $('modalTitle').textContent='Una carrera para vos.';
    $('modalText').textContent='Deslizá a izquierda o derecha para cambiar de carril. Juntá flores de 10 en 10 y esquivá las macetas.';
    $('gameState').textContent='Tu vale de '+current.target+' flores: '+current.prize+'. Tenés tres vidas.';
    $('startBtn').textContent='¡Empezar a correr! ↗';
    $('startBtn').onclick=startGame;
    openModal();
  });
  $('closeBtn').addEventListener('click',closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click',closeModal);

  function spawnObject(){
    const bad=Math.random()<(.08+level*.02);
    objects.push({lane:Math.floor(Math.random()*3),p:-.08,kind:bad?'pot':'flower',twist:random(-.25,.25)});
  }
  function project(l,p){
    const depth=clamp(p,0,1);
    const spread=w*(.13+.38*Math.pow(depth,1.5));
    return{x:w/2+(l-1)*spread*.62,y:h*.23+(h*.72)*Math.pow(depth,1.45),scale:.38+depth*1.25};
  }
  function update(dt){
    roadTime+=dt*(running?2.2:.28);
    if(!running)return;
    if(gateProgress){
      gateProgress+=dt/2.8;
      if(gateProgress>=1)endGame(true);
      return;
    }
    timeLeft=Math.max(0,timeLeft-dt);
    hitCooldown=Math.max(0,hitCooldown-dt);
    spawnClock-=dt;
    if(spawnClock<=0){spawnObject();spawnClock=.55+Math.random()*.13;}
    for(const item of objects)item.p+=dt*(.30+level*.015);
    while(objects.length&&objects[0].p>.91){
      const item=objects.shift();
      if(item.lane!==lane)continue;
      if(item.kind==='flower'){
        score=Math.min(levels[level].target,score+10);
        showMessage('¡+10 flores! 🌼');
        if(score>=levels[level].target){
          gateProgress=.001;objects=[];$('runnerCallout').textContent='¡Ahí está tu vale! ✨';
          showMessage('¡Llegaste a '+score+'! Corré hacia el vale');
        }
      }else if(hitCooldown<=0){
        lives--;hitCooldown=1.1;
        stage.classList.add('hit');setTimeout(()=>stage.classList.remove('hit'),430);
        showMessage(lives?'¡Cuidado con la maceta! '+lives+' vidas':'¡Se terminaron las vidas!');
        if(lives<=0){updateHUD();endGame(false);return;}
      }
    }
    updateHUD();
    if(timeLeft<=0&&!gateProgress)endGame(false);
  }

  function drawFlower(x,y,s,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(s,s);
    ctx.shadowColor='#b77f2588';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
    for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.fillStyle=i%2?'#ffd454':'#f7c22f';ctx.beginPath();ctx.ellipse(0,-13,7.8,13,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.shadowBlur=0;ctx.fillStyle='#9b672e';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffe39a';ctx.beginPath();ctx.arc(-2,-2,3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawPot(x,y,s){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.shadowColor='#583d2399';ctx.shadowBlur=12;ctx.shadowOffsetY=5;
    ctx.fillStyle='#b86549';ctx.beginPath();ctx.moveTo(-20,-9);ctx.lineTo(20,-9);ctx.lineTo(14,19);ctx.quadraticCurveTo(0,26,-14,19);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e78c60';ctx.fillRect(-23,-14,46,9);
    ctx.shadowBlur=0;ctx.strokeStyle='#466d3f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(0,-37);ctx.stroke();
    ctx.fillStyle='#729958';ctx.beginPath();ctx.ellipse(-9,-30,11,5,-.6,0,Math.PI*2);ctx.ellipse(9,-37,11,5,.6,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function draw(){
    if(!w||!h)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#fff1ca');sky.addColorStop(.43,'#d6e8be');sky.addColorStop(1,'#a5cc82');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#ffdc72';ctx.beginPath();ctx.arc(w*.76,h*.14,Math.max(25,w*.065),0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff79';ctx.beginPath();ctx.ellipse(w*.2,h*.16,42,11,0,0,Math.PI*2);ctx.ellipse(w*.14,h*.17,25,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a7ca86';ctx.beginPath();ctx.moveTo(0,h*.26);ctx.quadraticCurveTo(w*.26,h*.13,w*.53,h*.27);ctx.quadraticCurveTo(w*.8,h*.16,w,h*.24);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    ctx.fillStyle='#75a262';ctx.beginPath();ctx.moveTo(0,h*.43);ctx.quadraticCurveTo(w*.25,h*.24,w*.5,h*.39);ctx.quadraticCurveTo(w*.82,h*.28,w,h*.38);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    // Moving roadside blossoms make the track feel like a spring garden.
    for(let i=0;i<24;i++){
      const p=((i/24+roadTime*.11)%1);
      const y=h*.26+h*.72*Math.pow(p,1.45);
      const half=w*(.13+.38*Math.pow(p,1.5));
      const x=w/2+(i%2?-1:1)*(half+9+p*11);
      drawFlower(x,y,clamp(.12+p*.48,.1,.65),roadTime*.4+i);
    }
    const top=w*.13,bottom=w*.51;
    ctx.fillStyle='#608f59';ctx.beginPath();ctx.moveTo(w/2-top-8,h*.23);ctx.lineTo(w/2+top+8,h*.23);ctx.lineTo(w/2+bottom+15,h);ctx.lineTo(w/2-bottom-15,h);ctx.closePath();ctx.fill();
    const road=ctx.createLinearGradient(0,h*.23,0,h);road.addColorStop(0,'#e5bd79');road.addColorStop(1,'#f6d997');
    ctx.fillStyle=road;ctx.beginPath();ctx.moveTo(w/2-top,h*.23);ctx.lineTo(w/2+top,h*.23);ctx.lineTo(w/2+bottom,h);ctx.lineTo(w/2-bottom,h);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff8ccad';ctx.lineWidth=2;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(w/2+side*top/3,h*.23);ctx.lineTo(w/2+side*bottom/3,h);ctx.stroke();}
    for(let i=0;i<9;i++){
      const p=((i/9+roadTime*.18)%1),y=h*.23+h*.72*p*p;
      const roadHalf=w*(.13+.38*Math.pow(p,1.5));
      ctx.strokeStyle='#fff7d2af';ctx.lineWidth=1+p*3;ctx.beginPath();ctx.moveTo(w/2-roadHalf*.86,y);ctx.lineTo(w/2+roadHalf*.86,y);ctx.stroke();
    }
    const sorted=[...objects].sort((a,b)=>a.p-b.p);
    for(const item of sorted){
      if(item.p<0)continue;
      const pos=project(item.lane,item.p);
      const size=pos.scale*(w<400?.78:1);
      if(item.kind==='flower')drawFlower(pos.x,pos.y,Math.min(size,1.55),item.twist+roadTime*.65);
      else drawPot(pos.x,pos.y,Math.min(size,1.5));
    }
    if(gateProgress){
      const pos=project(1,Math.min(.91,gateProgress*.92));
      const scale=.45+gateProgress*.95;
      ctx.save();ctx.translate(pos.x,pos.y);ctx.scale(scale,scale);
      ctx.fillStyle='#fff8de';ctx.strokeStyle='#d6a740';ctx.lineWidth=5;
      ctx.beginPath();ctx.roundRect(-63,-95,126,70,16);ctx.fill();ctx.stroke();
      ctx.fillStyle='#2d5037';ctx.font='bold 19px Georgia';ctx.textAlign='center';ctx.fillText('VALE '+levels[level].target,0,-54);
      drawFlower(-49,-20,.45);drawFlower(49,-20,.45);
      ctx.restore();
    }
  }
  function frame(now){
    const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):0;
    lastFrame=now;
    if(!document.hidden){update(dt);draw();}
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{lastFrame=0;});
  updateLevel();resize();requestAnimationFrame(frame);

  const taunts=[
    {text:'¿Estás segura?',x:65,y:29},
    {text:'Mirá que no se puede deshacer',x:35,y:69},
    {text:'En serio, no te conviene apretarlo',x:65,y:74},
    {text:'¿No entendés que no tenés que apretar?',x:35,y:31},
    {text:'Última oportunidad…',x:50,y:54}
  ];
  function openClaim(){
    closeModal();clearTimeout(claimTimeout);claimStage=0;
    $('claimOverlay').hidden=false;document.body.style.overflow='hidden';
    $('claimRunBtn').hidden=false;$('claimRunBtn').textContent='Reclamar premios ↗';
    $('claimRunBtn').style.left='50%';$('claimRunBtn').style.top='54%';
    $('claimProgress').hidden=true;$('claimFinal').hidden=true;
    $('flowerFlood').classList.remove('rising');$('flowerFlood').replaceChildren();
    $('claimStatus').textContent='';$('claimRunBtn').focus();
  }
  function closeClaim(){
    clearTimeout(claimTimeout);$('claimOverlay').hidden=true;document.body.style.overflow='';
    $('playBtn').textContent='Jugar otra vez ↗';level=0;score=0;lives=3;timeLeft=35;updateLevel();$('playBtn').focus();
  }
  $('claimClose').addEventListener('click',closeClaim);
  $('claimRunBtn').addEventListener('click',()=>{
    if(claimStage<taunts.length){
      const next=taunts[claimStage++];
      $('claimRunBtn').textContent=next.text;
      $('claimRunBtn').style.left=next.x+'%';$('claimRunBtn').style.top=next.y+'%';
      $('liveStatus').textContent=next.text;
    }else{
      $('claimRunBtn').hidden=true;$('claimProgress').hidden=false;
      const flood=$('flowerFlood'),cell=innerWidth<600?38:47;
      const columns=Math.ceil(innerWidth/cell)+1,rows=Math.ceil(innerHeight/cell)+1;
      const fragment=document.createDocumentFragment();
      for(let row=rows-1;row>=0;row--)for(let col=0;col<columns;col++){
        const flower=document.createElement('span');flower.className='flood-flower';
        flower.textContent=['✿','✽','✾'][Math.floor(Math.random()*3)];
        flower.style.left=(col*cell-cell*.3+(Math.random()-.5)*15)+'px';
        flower.style.top=(row*cell-cell*.3+(Math.random()-.5)*15)+'px';
        flower.style.fontSize=(cell*(1.35+Math.random()*.32))+'px';
        flower.style.setProperty('--drop-delay',(((rows-1-row)/rows*7.4+Math.random()*.55).toFixed(2))+'s');
        flower.style.setProperty('--drop-duration',(1.8+Math.random()*.9).toFixed(2)+'s');
        flower.style.setProperty('--drift',((Math.random()-.5)*160)+'px');
        flower.style.setProperty('--twist',((Math.random()-.5)*360)+'deg');
        fragment.appendChild(flower);
      }
      flood.appendChild(fragment);requestAnimationFrame(()=>flood.classList.add('rising'));
      claimTimeout=setTimeout(()=>{
        $('claimProgress').hidden=true;$('claimFinal').hidden=false;$('sendClaimBtn').focus();
      },10500);
    }
  });
  window.springClaimCallback=result=>{
    if(!notificationPending)return;
    notificationPending=false;clearTimeout(window.springClaimTimeout);
    $('sendClaimBtn').disabled=false;$('sendClaimBtn').textContent='Ahora sí, reclamar ↗';
    $('claimStatus').textContent=result?.ok?'¡Listo! El aviso por correo fue enviado 🌼':(result?.error||'No se pudo enviar el correo. Intentá otra vez.');
    if(result?.ok)$('sendClaimBtn').disabled=true;
  };
  $('sendClaimBtn').addEventListener('click',()=>{
    const endpoint=window.SPRING_CLAIM_ENDPOINT;
    if(!endpoint){$('claimStatus').textContent='El aviso por correo todavía está pendiente de conexión.';return;}
    if(notificationPending)return;
    notificationPending=true;$('sendClaimBtn').disabled=true;
    $('sendClaimBtn').textContent='Enviando aviso…';$('claimStatus').textContent='Avisando por correo…';
    const script=document.createElement('script');
    script.src=endpoint+'?action=claim&name=Amor&t='+Date.now();
    script.onerror=()=>window.springClaimCallback({ok:false,error:'No se pudo conectar con el correo. Intentá otra vez.'});
    document.head.appendChild(script);
    window.springClaimTimeout=setTimeout(()=>window.springClaimCallback({ok:false,error:'El correo tardó demasiado. Probá otra vez.'}),12000);
  });
})();
