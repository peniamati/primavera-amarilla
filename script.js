(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fallField = $('fallField');
  const field = $('flowerField');
  const modal = $('gameModal');
  const levels = [
    { name: 'EL ABRAZO', prize: 'Un abrazo', emoji: '🫂', goal: 8, seconds: 25, weeds: .09, detail: 'Vale por un abrazo de esos que hacen bien.' },
    { name: 'EL BESO', prize: 'Un beso', emoji: '💛', goal: 12, seconds: 28, weeds: .18, detail: 'Vale por un beso. Siempre con ganas de los dos.' },
    { name: 'LA SALIDA', prize: 'Una salida a comer', emoji: '🍽️', goal: 16, seconds: 32, weeds: .26, detail: 'Vale por una salida a comer. El lugar lo eligen ustedes.' }
  ];
  let level = 0, score = 0, lives = 3, remaining = levels[0].seconds;
  let playing = false, entered = false, musicOn = true;
  let timer, spawnTimer, messageTimeout, lastFocus, flowerId = 0, claimTimeout;
  let claimStage = 0, notificationPending = false;

  function setMusicState(on) {
    musicOn = on;
    $('soundBtn').setAttribute('aria-pressed', String(on));
    $('soundBtn').setAttribute('aria-label', on ? 'Apagar música' : 'Encender música');
    $('soundBtn').classList.toggle('muted', !on);
  }
  function loadMusic() {
    $('playerSlot').replaceChildren();
    const iframe = document.createElement('iframe');
    iframe.title = 'Flores Amarillas de Floricienta en YouTube';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = 'https://www.youtube.com/embed/gv63CGCx6vg?autoplay=1&playsinline=1&controls=0';
    $('playerSlot').appendChild(iframe);
  }
  $('enterBtn').addEventListener('click', () => {
    if (entered) return;
    entered = true;
    loadMusic();
    $('entry').classList.add('open');
    document.body.classList.remove('awaiting-entry');
    setTimeout(() => { $('entry').remove(); $('playBtn').focus({preventScroll:true}); }, 1100);
  });
  $('soundBtn').addEventListener('click', () => {
    if (!entered) return;
    setMusicState(!musicOn);
    if (musicOn) loadMusic(); else $('playerSlot').replaceChildren();
  });

  function showMessage(message) {
    const el = $('gardenMessage');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => el.classList.remove('show'), 1350);
  }
  function growAmbientFlower() {
    const flower = document.createElement('span');
    flower.className = 'ambient-flower';
    flower.textContent = '🌼';
    flower.style.left = `${5 + Math.random() * 90}%`;
    flower.style.bottom = `${12 + Math.random() * 18}%`;
    flower.style.setProperty('--sway', `${2 + Math.random() * 2}s`);
    flower.style.setProperty('--stem-height', `${52 + Math.random() * 65}px`);
    field.appendChild(flower);
    while (field.childElementCount > 18) field.firstElementChild.remove();
  }
  for (let i = 0; i < 10; i++) growAmbientFlower();
  setInterval(growAmbientFlower, 800);
  function updateLevel() {
    const current = levels[level];
    $('levelTitle').textContent = `NIVEL ${level + 1} · ${current.name} ${current.emoji}`;
    $('levelPath').querySelectorAll('span').forEach((element, index) => {
      element.classList.toggle('current', index === level);
      element.classList.toggle('done', index < level);
    });
    $('modalKicker').textContent = `NIVEL ${level + 1} DE 3 · ${current.name} ${current.emoji}`;
    document.querySelector('.progress-track').setAttribute('aria-valuemax', String(current.goal));
    updateScore();
  }
  function updateScore() {
    const current = levels[level];
    $('scoreValue').textContent = `${score} / ${current.goal}`;
    $('timeValue').textContent = `${remaining}s`;
    $('hudFlowers').textContent = `🌼 ${score} / ${current.goal}`;
    $('hudLives').textContent = `${'♥ '.repeat(lives)}${'♡ '.repeat(3 - lives)}`.trim();
    $('hudLives').setAttribute('aria-label', `${lives} de 3 vidas`);
    $('hudTime').textContent = `⏱ ${remaining} s`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(Math.min(score,current.goal)));
    $('progressBar').style.width = `${Math.min(100, score / current.goal * 100)}%`;
  }
  // Each falling object is a large touch target. Missed flowers never cost a life.
  const intruders = ['🪨', '🧦', '🐛', '☂️', '🍄'];
  function addToBouquet() {
    const bloom = document.createElement('span');
    bloom.className = 'bouquet-bloom';
    bloom.textContent = '🌼';
    const index = $('bouquetFlowers').childElementCount;
    bloom.style.setProperty('--x', `${(index % 5 - 2) * 20 + (Math.random() - .5) * 10}px`);
    bloom.style.setProperty('--y', `${-Math.floor(index / 5) * 13 + (index % 2) * 9}px`);
    bloom.style.setProperty('--r', `${(index % 5 - 2) * 10}deg`);
    $('bouquetFlowers').appendChild(bloom);
    $('bouquet').setAttribute('aria-label', `Ramo con ${score} flores`);
  }
  function spawnFalling() {
    if (!playing) return;
    const bad = Math.random() < levels[level].weeds;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `fall-item ${bad ? 'intruder' : 'yellow-bloom'}`;
    item.id = `fall-${++flowerId}`;
    item.setAttribute('aria-label', bad ? 'Objeto intruso: perdés una vida' : 'Flor amarilla: atraparla para el ramo');
    item.textContent = bad ? intruders[Math.floor(Math.random() * intruders.length)] : '🌼';
    item.style.left = `${9 + Math.random() * 82}%`;
    const duration = Math.max(2.9, 4.3 - level * .35 + Math.random() * .6);
    item.style.setProperty('--fall-duration', `${duration}s`);
    item.style.setProperty('--sway-distance', `${(Math.random() - .5) * 45}px`);
    item.addEventListener('animationend', () => item.remove(), {once:true});
    item.addEventListener('click', () => {
      if (!playing || item.disabled) return;
      item.disabled = true;
      item.classList.add('caught');
      setTimeout(() => item.remove(), 350);
      if (bad) {
        lives--;
        $('garden').classList.remove('ouch');
        void $('garden').offsetWidth;
        $('garden').classList.add('ouch');
        showMessage(lives ? `¡Uy! Te quedan ${lives} vidas 💚` : '¡Se terminaron las vidas!');
        if (!lives) { updateScore(); endGame(false); return; }
      } else {
        score++;
        addToBouquet();
        showMessage(['¡Una más para el ramo! 🌼','¡Qué lindo va quedando! ✨','¡Flor atrapada! 💛'][score % 3]);
      }
      updateScore();
      $('liveStatus').textContent = `${score} de ${levels[level].goal} flores, ${lives} vidas, ${remaining} segundos`;
      if (score >= levels[level].goal) endGame(true);
    });
    fallField.appendChild(item);
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('startBtn').focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus?.focus) lastFocus.focus();
  }
  function startGame() {
    clearInterval(timer);
    clearInterval(spawnTimer);
    playing = true;
    score = 0;
    lives = 3;
    remaining = levels[level].seconds;
    fallField.replaceChildren();
    $('bouquetFlowers').replaceChildren();
    $('bouquet').setAttribute('aria-label', 'Ramo vacío');
    updateLevel();
    $('playHud').hidden = false;
    $('garden').classList.add('playing');
    $('gardenHint').textContent = `Atrapá ${levels[level].goal} flores · 3 vidas`;
    $('playBtn').textContent = 'Volver al jardín ↗';
    closeModal();
    $('garden').scrollIntoView({behavior:'smooth',block:'center'});
    showMessage(`¡Nivel ${level+1}: a jugar! ${levels[level].emoji}`);
    spawnFalling();
    spawnTimer = setInterval(spawnFalling, [580,510,450][level]);
    timer = setInterval(() => {
      remaining--;
      updateScore();
      if (remaining <= 0) endGame(false);
    },1000);
  }
  function endGame(won) {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    clearInterval(spawnTimer);
    fallField.replaceChildren();
    $('garden').classList.remove('playing');
    $('playHud').hidden = true;
    $('gardenHint').textContent = 'Atrapá las flores que caen';
    const current = levels[level];
    if (won) {
      $('modalTitle').textContent = `¡Ganaste ${current.prize.toLowerCase()}! ${current.emoji}`;
      $('modalText').textContent = current.detail;
      $('gameState').textContent = level < levels.length-1 ? 'Un premio más te espera en el próximo nivel.' : '¡Completaste los tres niveles! Compartí esta página 💛';
      $('startBtn').textContent = level < levels.length-1 ? 'Ir al siguiente nivel ↗' : 'Reclamar premios ↗';
      if (level < levels.length-1) { level++; $('startBtn').onclick = startGame; }
      else $('startBtn').onclick = openClaim;
    } else {
      $('modalTitle').textContent = '¡Casi, casi! 🌼';
      $('modalText').textContent = `${lives ? 'Se terminó el tiempo.' : 'Te quedaste sin vidas.'} Atrapaste ${score} de ${current.goal} flores. ¡Probá de nuevo!`;
      $('gameState').textContent = 'Las flores que se escapan no te quitan vidas.';
      $('startBtn').textContent = `Reintentar nivel ${level+1} ↗`;
      $('startBtn').onclick = startGame;
    }
    $('liveStatus').textContent = $('modalTitle').textContent;
    openModal();
  }
  $('playBtn').addEventListener('click', () => {
    if (playing) { $('garden').scrollIntoView({behavior:'smooth',block:'center'}); return; }
    const current = levels[level];
    $('modalKicker').textContent = `NIVEL ${level+1} DE 3 · ${current.name} ${current.emoji}`;
    $('modalTitle').textContent = 'Cada flor cuenta.';
    $('modalText').textContent = `Atrapá ${current.goal} flores amarillas en ${current.seconds} segundos. Tenés tres vidas: no toques los objetos intrusos.`;
    $('gameState').textContent = `Tu premio: ${current.prize.toLowerCase()}.`;
    $('startBtn').textContent = '¡Empezar a juntar! ↗';
    $('startBtn').onclick = startGame;
    score = 0; remaining = current.seconds; updateLevel(); openModal();
  });
  $('closeBtn').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  const taunts = [
    { text: '¿Estás segura?', x: 65, y: 29 },
    { text: 'Mirá que no se puede deshacer', x: 35, y: 69 },
    { text: 'En serio, no te conviene apretarlo', x: 65, y: 74 },
    { text: '¿No entendés que no tenés que apretar?', x: 35, y: 31 },
    { text: 'Última oportunidad…', x: 50, y: 54 }
  ];
  function openClaim() {
    closeModal();
    clearTimeout(claimTimeout);
    claimStage = 0;
    $('claimOverlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('claimRunBtn').hidden = false;
    $('claimRunBtn').textContent = 'Reclamar premios ↗';
    $('claimRunBtn').style.left = '50%';
    $('claimRunBtn').style.top = '54%';
    $('claimProgress').hidden = true;
    $('claimFinal').hidden = true;
    $('flowerFlood').classList.remove('rising');
    $('flowerFlood').replaceChildren();
    $('claimStatus').textContent = '';
    $('claimRunBtn').focus();
  }
  function closeClaim() {
    clearTimeout(claimTimeout);
    $('claimOverlay').hidden = true;
    document.body.style.overflow = '';
    $('playBtn').textContent = 'Jugar otra vez ↗';
    level = 0;
    score = 0;
    remaining = levels[0].seconds;
    updateLevel();
    $('playBtn').focus();
  }
  $('claimClose').addEventListener('click', closeClaim);
  $('claimRunBtn').addEventListener('click', () => {
    if (claimStage < taunts.length) {
      const next = taunts[claimStage++];
      $('claimRunBtn').textContent = next.text;
      $('claimRunBtn').style.left = `${next.x}%`;
      $('claimRunBtn').style.top = `${next.y}%`;
      $('liveStatus').textContent = next.text;
    } else {
      $('claimRunBtn').hidden = true;
      $('claimProgress').hidden = false;
      const flood = $('flowerFlood');
      // Start at the bottom row. Every bloom falls from above and stays where it lands.
      const cell = innerWidth < 600 ? 38 : 47;
      const columns = Math.ceil(innerWidth / cell) + 1;
      const rows = Math.ceil(innerHeight / cell) + 1;
      const fragment = document.createDocumentFragment();
      for (let row = rows - 1; row >= 0; row--) {
        for (let col = 0; col < columns; col++) {
          const flower = document.createElement('span');
          flower.className = 'flood-flower';
          flower.textContent = ['✿','✽','✾'][Math.floor(Math.random() * 3)];
          flower.style.left = `${col * cell - cell * .3 + (Math.random() - .5) * 15}px`;
          flower.style.top = `${row * cell - cell * .3 + (Math.random() - .5) * 15}px`;
          flower.style.fontSize = `${cell * (1.35 + Math.random() * .32)}px`;
          flower.style.setProperty('--drop-delay', `${((rows - 1 - row) / rows * 7.4 + Math.random() * .55).toFixed(2)}s`);
          flower.style.setProperty('--drop-duration', `${(1.8 + Math.random() * .9).toFixed(2)}s`);
          flower.style.setProperty('--drift', `${(Math.random() - .5) * 160}px`);
          flower.style.setProperty('--twist', `${(Math.random() - .5) * 360}deg`);
          fragment.appendChild(flower);
        }
      }
      flood.appendChild(fragment);
      requestAnimationFrame(() => flood.classList.add('rising'));
      claimTimeout = setTimeout(() => {
        $('claimProgress').hidden = true;
        $('claimFinal').hidden = false;
        $('sendClaimBtn').focus();
      }, 10500);
    }
  });
  window.springClaimCallback = (result) => {
    if (!notificationPending) return;
    notificationPending = false;
    clearTimeout(window.springClaimTimeout);
    $('sendClaimBtn').disabled = false;
    $('sendClaimBtn').textContent = 'Ahora sí, reclamar ↗';
    $('claimStatus').textContent = result?.ok
      ? '¡Listo! El aviso por correo fue enviado 🌼'
      : (result?.error || 'No se pudo enviar el correo. Intentá otra vez.');
    if (result?.ok) $('sendClaimBtn').disabled = true;
  };
  $('sendClaimBtn').addEventListener('click', () => {
    const endpoint = window.SPRING_CLAIM_ENDPOINT;
    if (!endpoint) { $('claimStatus').textContent = 'El aviso por correo todavía está pendiente de conexión.'; return; }
    if (notificationPending) return;
    notificationPending = true;
    $('sendClaimBtn').disabled = true;
    $('sendClaimBtn').textContent = 'Enviando aviso…';
    $('claimStatus').textContent = 'Avisando por correo…';
    const script = document.createElement('script');
    script.src = `${endpoint}?action=claim&name=${encodeURIComponent('Amor')}&t=${Date.now()}`;
    script.onerror = () => window.springClaimCallback({ok:false,error:'No se pudo conectar con el correo. Intentá otra vez.'});
    document.head.appendChild(script);
    window.springClaimTimeout = setTimeout(() => window.springClaimCallback({ok:false,error:'El correo tardó demasiado. Probá otra vez.'}), 12000);
  });
  updateLevel();
})();
