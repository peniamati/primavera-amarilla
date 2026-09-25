(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const field = $('flowerField');
  const modal = $('gameModal');
  const target = 12;
  let score = 0;
  let remaining = 30;
  let playing = false;
  let timer = null;
  let spawnTimer = null;
  let flowerId = 0;
  let musicOn = true;
  let entered = false;
  let messageTimeout;
  let lastFocus;

  function setMusicState(on) {
    musicOn = on;
    $('soundBtn').setAttribute('aria-pressed', String(on));
    $('soundBtn').setAttribute('aria-label', on ? 'Apagar música' : 'Encender música');
    $('soundLabel').textContent = on ? 'Apagar música' : 'Encender música';
    $('soundIcon').textContent = on ? '♫' : '♪';
  }
  function loadMusic() {
    const iframe = document.createElement('iframe');
    iframe.id = 'youtubePlayer';
    iframe.title = 'Flores Amarillas de Floricienta en YouTube';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = 'https://www.youtube.com/embed/gv63CGCx6vg?enablejsapi=1&autoplay=1&playsinline=1&controls=1&rel=0';
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

  function showMessage(message) {
    const el = $('gardenMessage');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => el.classList.remove('show'), 1750);
  }

  function updateScore() {
    $('scoreValue').textContent = `${score} / ${target}`;
    $('timeValue').textContent = `${remaining}s`;
    const bar = document.querySelector('.progress-track');
    bar.setAttribute('aria-valuenow', String(Math.min(score, target)));
    $('progressBar').style.width = `${Math.min(100, score / target * 100)}%`;
  }

  function buildFlower(weed = false) {
    const flower = document.createElement('button');
    flower.type = 'button';
    flower.className = `flower${weed ? ' weed' : ''}`;
    flower.setAttribute('aria-label', weed ? 'Yuyo: quita dos flores' : 'Flor amarilla: sumar al ramo');
    flower.id = `flower-${++flowerId}`;
    const left = 5 + Math.random() * 90;
    const bottom = 7 + Math.random() * 23;
    const scale = .63 + Math.random() * .55;
    flower.style.setProperty('--left', `${left}%`);
    flower.style.setProperty('--bottom', `${bottom}%`);
    flower.style.setProperty('--height', `${95 + Math.random() * 65}px`);
    flower.style.setProperty('--scale', scale.toFixed(2));
    flower.style.setProperty('--depth', String(Math.round(2 + scale * 5)));
    flower.style.setProperty('--sway', `${2.5 + Math.random() * 2}s`);
    flower.style.setProperty('--tilt', `${(Math.random() - .5) * 22}deg`);
    flower.innerHTML = `<span class="stem"></span><span class="leaf"></span><span class="leaf left"></span><span class="head">${Array.from({length:8}, (_, i) => `<span class="petal" style="--i:${i}"></span>`).join('')}<span class="center"></span></span>`;
    flower.addEventListener('click', () => pickFlower(flower, weed));
    field.appendChild(flower);
    // Keep a bounded number of flowers even after hours with the tab open.
    while (field.children.length > 27) field.firstElementChild.remove();
  }

  function pickFlower(flower, weed) {
    if (flower.classList.contains('pop')) return;
    flower.classList.add('pop');
    flower.disabled = true;
    setTimeout(() => flower.remove(), 320);
    if (playing) {
      score = Math.max(0, score + (weed ? -2 : 1));
      showMessage(weed ? '¡Uy, era un yuyo! −2 🌿' : ['¡Una más! 🌼', '¡Ese ramo promete! ✨', '¡Flor sumada! 💛'][score % 3]);
      updateScore();
      $('liveStatus').textContent = `${score} de ${target} flores, ${remaining} segundos restantes`;
      if (score >= target) endGame(true);
    } else {
      showMessage(weed ? 'Un yuyo infiltrado 🌿' : 'Una flor para vos 💛');
    }
  }

  function spawn() { buildFlower(playing && Math.random() < .15); }
  for (let i = 0; i < 13; i++) buildFlower(false);
  spawnTimer = setInterval(spawn, 700);

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('startBtn').focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function startGame() {
    clearInterval(timer);
    playing = true;
    score = 0;
    remaining = 30;
    field.querySelectorAll('.weed').forEach((flower) => flower.remove());
    updateScore();
    $('startBtn').textContent = 'Ver mi jardín ↗';
    $('startBtn').onclick = closeModal;
    $('modalTitle').textContent = '¡A juntar flores!';
    $('modalText').textContent = 'Tocá las flores amarillas del jardín. Esquivá los yuyos grisáceos.';
    $('gameState').textContent = 'El reloj ya está corriendo. ¡Suerte!';
    $('gardenHint').textContent = '¡Juntá 12 flores antes de que se acabe el tiempo!';
    closeModal();
    showMessage('¡A por esas flores! 🌼');
    timer = setInterval(() => {
      remaining--;
      updateScore();
      if (remaining <= 0) endGame(false);
    }, 1000);
  }
  function endGame(won) {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    field.querySelectorAll('.weed').forEach((flower) => flower.remove());
    $('gardenHint').textContent = 'Tocá las flores. Sí, en serio.';
    $('modalTitle').textContent = won ? '¡Sos pura primavera! 🌼' : '¡Casi florece ese ramo!';
    $('modalText').textContent = won ? `Juntaste ${score} flores con ${remaining} segundos de sobra. Este ramo imaginario es todo tuyo.` : `Juntaste ${score} flores. En este jardín siempre hay otra oportunidad.`;
    $('gameState').textContent = won ? 'Compartí la alegría: mandale esta página a alguien 💛' : 'Pista: las flores reaparecen sin parar.';
    $('startBtn').textContent = 'Jugar de nuevo ↗';
    $('startBtn').onclick = startGame;
    $('liveStatus').textContent = $('modalTitle').textContent;
    openModal();
  }

  $('playBtn').addEventListener('click', () => {
    if (playing) { $('garden').scrollIntoView({behavior:'smooth',block:'center'}); return; }
    $('modalTitle').textContent = 'Tu ramo empieza acá.';
    $('modalText').textContent = 'Juntá 12 flores en 30 segundos. Esquivá los yuyos. Y, sobre todo, divertite.';
    $('gameState').textContent = 'Cuando empiece, tocá las flores amarillas del jardín.';
    $('startBtn').textContent = '¡Empezar a juntar! ↗';
    $('startBtn').onclick = startGame;
    score = 0; remaining = 30; updateScore(); openModal();
  });
  $('startBtn').addEventListener('click', () => { if (!$('startBtn').onclick) startGame(); });
  $('closeBtn').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  $('soundBtn').addEventListener('click', () => {
    if (!entered) return;
    setMusicState(!musicOn);
    if (musicOn) loadMusic();
    else $('playerSlot').replaceChildren();
  });
})();
