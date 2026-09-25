(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const field = $('flowerField');
  const modal = $('gameModal');
  const levels = [
    { name: 'EL ABRAZO', prize: 'Un abrazo', emoji: '🫂', goal: 8, seconds: 25, weeds: .09, detail: 'Vale por un abrazo de esos que hacen bien.' },
    { name: 'EL BESO', prize: 'Un beso', emoji: '💛', goal: 12, seconds: 28, weeds: .18, detail: 'Vale por un beso. Siempre con ganas de los dos.' },
    { name: 'LA SALIDA', prize: 'Una salida a comer', emoji: '🍽️', goal: 16, seconds: 32, weeds: .26, detail: 'Vale por una salida a comer. El lugar lo eligen ustedes.' }
  ];
  let level = 0, score = 0, remaining = levels[0].seconds;
  let playing = false, entered = false, musicOn = true;
  let timer, spawnTimer, messageTimeout, lastFocus, flowerId = 0;

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
    $('hudTime').textContent = `⏱ ${remaining} s`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(Math.min(score,current.goal)));
    $('progressBar').style.width = `${Math.min(100, score / current.goal * 100)}%`;
  }
  function buildFlower(weed = false) {
    const flower = document.createElement('button');
    flower.type = 'button';
    flower.className = `flower${weed ? ' weed' : ''}`;
    flower.setAttribute('aria-label', weed ? 'Yuyo: quita dos flores' : 'Flor amarilla: sumar al ramo');
    flower.id = `flower-${++flowerId}`;
    const scale = .86 + Math.random() * .36;
    flower.style.setProperty('--left', `${7 + Math.random() * 86}%`);
    flower.style.setProperty('--bottom', `${7 + Math.random() * 23}%`);
    flower.style.setProperty('--height', `${95 + Math.random() * 65}px`);
    flower.style.setProperty('--scale', scale.toFixed(2));
    flower.style.setProperty('--depth', String(Math.round(2 + scale * 5)));
    flower.style.setProperty('--sway', `${2.5 + Math.random() * 2}s`);
    flower.style.setProperty('--tilt', `${(Math.random() - .5) * 22}deg`);
    flower.innerHTML = `<span class="stem"></span><span class="leaf"></span><span class="leaf left"></span><span class="head">${Array.from({length:8}, (_, i) => `<span class="petal" style="--i:${i}"></span>`).join('')}<span class="center"></span></span>`;
    flower.addEventListener('click', () => pickFlower(flower, weed));
    field.appendChild(flower);
    while (field.children.length > (matchMedia('(max-width: 760px)').matches ? 18 : 24)) field.firstElementChild.remove();
  }
  function pickFlower(flower, weed) {
    if (flower.classList.contains('pop')) return;
    flower.classList.add('pop');
    flower.disabled = true;
    setTimeout(() => flower.remove(), 320);
    if (!playing) { showMessage(weed ? 'Un yuyo infiltrado 🌿' : 'Una flor para vos 💛'); return; }
    score = Math.max(0, score + (weed ? -2 : 1));
    showMessage(weed ? '¡Uy, un yuyo! −2 🌿' : ['¡Una más! 🌼','¡Ese ramo promete! ✨','¡Flor sumada! 💛'][score % 3]);
    updateScore();
    $('liveStatus').textContent = `${score} de ${levels[level].goal} flores, ${remaining} segundos`;
    if (score >= levels[level].goal) endGame(true);
  }
  for (let i = 0; i < (matchMedia('(max-width: 760px)').matches ? 10 : 15); i++) buildFlower();
  spawnTimer = setInterval(() => buildFlower(playing && Math.random() < levels[level].weeds), 620);

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
    playing = true;
    score = 0;
    remaining = levels[level].seconds;
    field.querySelectorAll('.weed').forEach(flower => flower.remove());
    updateLevel();
    $('playHud').hidden = false;
    $('gardenHint').textContent = `Juntá ${levels[level].goal} flores y esquivá los yuyos`;
    $('playBtn').textContent = 'Volver al jardín ↗';
    closeModal();
    $('garden').scrollIntoView({behavior:'smooth',block:'center'});
    showMessage(`¡Nivel ${level+1}: a jugar! ${levels[level].emoji}`);
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
    $('playHud').hidden = true;
    field.querySelectorAll('.weed').forEach(flower => flower.remove());
    $('gardenHint').textContent = 'Tocá las flores amarillas';
    const current = levels[level];
    if (won) {
      $('modalTitle').textContent = `¡Ganaste ${current.prize.toLowerCase()}! ${current.emoji}`;
      $('modalText').textContent = current.detail;
      $('gameState').textContent = level < levels.length-1 ? 'Un premio más te espera en el próximo nivel.' : '¡Completaste los tres niveles! Compartí esta página 💛';
      $('startBtn').textContent = level < levels.length-1 ? 'Ir al siguiente nivel ↗' : 'Volver a jugar desde el 1 ↗';
      level = (level + 1) % levels.length;
      $('startBtn').onclick = startGame;
    } else {
      $('modalTitle').textContent = '¡Casi, casi! 🌼';
      $('modalText').textContent = `Juntaste ${score} de ${current.goal} flores. Los premios no se escapan: probá de nuevo.`;
      $('gameState').textContent = 'Pista: las flores crecen sin parar.';
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
    $('modalText').textContent = `Juntá ${current.goal} flores en ${current.seconds} segundos. Los yuyos restan dos.`;
    $('gameState').textContent = `Tu premio: ${current.prize.toLowerCase()}.`;
    $('startBtn').textContent = '¡Empezar a juntar! ↗';
    $('startBtn').onclick = startGame;
    score = 0; remaining = current.seconds; updateLevel(); openModal();
  });
  $('closeBtn').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  updateLevel();
})();
