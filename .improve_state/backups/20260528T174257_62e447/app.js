const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 450;

const GND = 390, NX = 400, NT = 268, BR = 12, PW = 28, PH = 46;
let state = 'idle', mode = 14, ps = 0, as = 0, keys = {};
let ball, player, tms, ais, rally, hitLock;
let serveTeam = 'player', serveTimer = 0;
let faultMsg = null, pointFlash = null;
let particles = [];

const mkP = (x, id) => ({ x, y: GND - PH, vy: 0, g: true, id });

function initServeReady(srv) {
  serveTeam = srv;
  serveTimer = srv === 'ai' ? 90 : 0;
  state = 'serve-ready';
  // Clear held keys so a held SPACE doesn't instantly fire the serve
  keys.Space = false; keys.ArrowUp = false; keys.KeyW = false;
  rally = { hits: 0, last: null, side: srv };
  player = mkP(160, 'p');
  tms = [mkP(60, 't1'), mkP(240, 't2'), mkP(330, 't3')];
  ais = [mkP(490, 'a1'), mkP(570, 'a2'), mkP(660, 'a3'), mkP(730, 'a4')];
  ball = { x: srv === 'player' ? 160 : 650, y: GND - PH - 40, vx: 0, vy: 0 };
  updateDots();
  updateHitLabel();
}

function startServe() {
  if (state !== 'serve-ready') return;
  state = 'playing';
  ball.vx = serveTeam === 'player' ? 4 : -4;
  ball.vy = -9;
}

function updateDots() {
  for (let i = 1; i <= 3; i++)
    document.getElementById('hit-' + i).classList.toggle('active', i <= rally.hits);
}

function updateHitLabel() {
  const label = document.getElementById('hit-label');
  if (rally.side === 'player') {
    label.textContent = 'YOUR HITS';
    label.style.color = '#00f5ff';
  } else {
    label.textContent = 'AI HITS';
    label.style.color = '#ff2d78';
  }
}

function triggerScorePop(id) {
  const el = document.getElementById(id);
  el.classList.remove('pop');
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 400);
}

function showFault(text) {
  faultMsg = { text, timer: 110 };
  const wrapper = document.getElementById('game-wrapper');
  wrapper.classList.add('fault-flash');
  setTimeout(() => wrapper.classList.remove('fault-flash'), 500);
}

function point(who, reason) {
  if (reason) showFault(reason);

  if (who === 'player') {
    ps++;
    document.getElementById('player-score').textContent = ps;
    triggerScorePop('player-score');
    if (!reason) pointFlash = { text: 'POINT!', timer: 55, color: '#00f5ff', x: 200 };
  } else {
    as++;
    document.getElementById('ai-score').textContent = as;
    triggerScorePop('ai-score');
    if (!reason) pointFlash = { text: 'POINT!', timer: 55, color: '#ff2d78', x: 600 };
  }

  if (ps >= mode || as >= mode) {
    state = 'gameover';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('winner-banner').textContent = ps >= mode ? 'YOU WIN!' : 'NEON ACES WIN!';
    document.getElementById('final-score-player').textContent = ps;
    document.getElementById('final-score-ai').textContent = as;
  } else {
    initServeReady(who);
  }
}

const aabb = (p, b) => b.x + BR > p.x && b.x - BR < p.x + PW && b.y + BR > p.y && b.y - BR < p.y + PH;

function spawnHitParticles(x, y, side) {
  const color = side === 'player' ? '#00f5ff' : '#ff2d78';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
    const spd = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2,
      life: 20 + Math.random() * 12,
      maxLife: 32,
      color,
      size: 1.5 + Math.random() * 2
    });
  }
}

function tryHit(p, side) {
  if (hitLock || (ball.x < NX ? 'player' : 'ai') !== side) return;
  if (rally.last === p.id) {
    point(side === 'player' ? 'ai' : 'player', 'DOUBLE HIT!');
    return;
  }
  if (rally.hits >= 3) {
    point(side === 'player' ? 'ai' : 'player', '4TH HIT FAULT!');
    return;
  }
  rally.hits++; rally.last = p.id; hitLock = true;
  ball.vx = (side === 'player' ? 1 : -1) * (4 + Math.random() * 4);
  ball.vy = -11 - Math.random() * 3;
  spawnHitParticles(ball.x, ball.y, side);
  updateDots();
}

function moveAI(p, home, side) {
  const onBall = side === 'player' ? ball.x < NX : ball.x > NX;
  const tx = onBall ? ball.x - PW / 2 : home;
  if (Math.abs(p.x - tx) > 3) p.x += Math.sign(tx - p.x) * 2.2;
  p.x = side === 'player' ? Math.max(0, Math.min(NX - PW - 5, p.x)) : Math.max(NX + 5, Math.min(800 - PW, p.x));
  if (onBall && Math.abs(p.x - ball.x) < 55 && ball.y > p.y - 55 && p.g) { p.vy = -12; p.g = false; }
  p.vy += 0.5; p.y += p.vy;
  if (p.y >= GND - PH) { p.y = GND - PH; p.vy = 0; p.g = true; }
  if (aabb(p, ball)) tryHit(p, side);
}

function update() {
  // Particles and timers update regardless of game state
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; });
  if (faultMsg && faultMsg.timer > 0) faultMsg.timer--;
  if (pointFlash && pointFlash.timer > 0) pointFlash.timer--;

  if (state === 'serve-ready') {
    if (keys.ArrowLeft || keys.KeyA) player.x = Math.max(0, player.x - 3.5);
    if (keys.ArrowRight || keys.KeyD) player.x = Math.min(NX - PW - 5, player.x + 3.5);
    if (serveTeam === 'player') {
      if (keys.Space || keys.ArrowUp || keys.KeyW) startServe();
    } else {
      if (--serveTimer <= 0) startServe();
    }
    return;
  }

  if (state !== 'playing') return;
  hitLock = false;
  if (keys.ArrowLeft || keys.KeyA) player.x = Math.max(0, player.x - 3.5);
  if (keys.ArrowRight || keys.KeyD) player.x = Math.min(NX - PW - 5, player.x + 3.5);
  if ((keys.Space || keys.ArrowUp || keys.KeyW) && player.g) { player.vy = -13; player.g = false; }
  player.vy += 0.5; player.y += player.vy;
  if (player.y >= GND - PH) { player.y = GND - PH; player.vy = 0; player.g = true; }
  if (aabb(player, ball)) tryHit(player, 'player');
  tms.forEach((t, i) => moveAI(t, [60, 240, 330][i], 'player'));
  ais.forEach((a, i) => moveAI(a, [490, 570, 660, 730][i], 'ai'));
  ball.vy += 0.42; ball.x += ball.vx; ball.y += ball.vy; ball.vx *= 0.999;
  if (ball.y > NT) {
    if (ball.vx > 0 && ball.x + BR > NX - 5 && ball.x < NX) { ball.vx *= -0.7; ball.x = NX - 5 - BR; }
    else if (ball.vx < 0 && ball.x - BR < NX + 5 && ball.x > NX) { ball.vx *= -0.7; ball.x = NX + 5 + BR; }
  }
  if (ball.y + BR > GND) { point(ball.x < NX ? 'ai' : 'player'); return; }
  if (ball.x - BR < 0) { ball.x = BR; ball.vx = Math.abs(ball.vx) * 0.8; }
  if (ball.x + BR > 800) { ball.x = 800 - BR; ball.vx = -Math.abs(ball.vx) * 0.8; }
  const ns = ball.x < NX ? 'player' : 'ai';
  if (ns !== rally.side) { rally.side = ns; rally.hits = 0; rally.last = null; updateDots(); updateHitLabel(); }
}

function drawCharacter(p, color, isControlled) {
  ctx.fillStyle = color;
  ctx.fillRect(p.x, p.y, PW, PH);
  ctx.fillStyle = '#fff8';
  ctx.fillRect(p.x + 6, p.y + 6, 16, 12);

  if (isControlled) {
    const ax = p.x + PW / 2;
    const ay = p.y - 14;
    ctx.save();
    ctx.fillStyle = '#c8ff00';
    ctx.shadowColor = '#c8ff00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ax, ay + 10);
    ctx.lineTo(ax - 7, ay);
    ctx.lineTo(ax + 7, ay);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function draw() {
  ctx.fillStyle = '#0d0a1f'; ctx.fillRect(0, 0, 800, 450);

  // Skyline
  ctx.fillStyle = '#130c2e';
  [[30,130,70],[140,95,55],[250,145,65],[530,110,80],[635,90,60],[718,130,72]].forEach(([x,h,w]) => ctx.fillRect(x, GND - h, w, h));
  ctx.fillStyle = '#ff2d78';
  [[45,GND-105],[155,GND-72],[265,GND-115],[545,GND-85],[650,GND-68],[733,GND-105]].forEach(([x,y]) => ctx.fillRect(x, y, 8, 6));
  ctx.fillStyle = '#00f5ff55';
  [[72,GND-75],[170,GND-50],[278,GND-88],[560,GND-58],[668,GND-42],[748,GND-78]].forEach(([x,y]) => ctx.fillRect(x, y, 6, 5));

  // Sand
  ctx.fillStyle = '#c4914e'; ctx.fillRect(0, GND, 800, 60);
  ctx.fillStyle = '#d4a464'; ctx.fillRect(0, GND, 800, 8);

  if (!ball || !player) return;

  // Ball shadow — grows larger as ball nears ground
  const ballAbove = GND - ball.y;
  const shadowAlpha = Math.max(0, 0.45 - ballAbove / 320);
  const shadowScale = Math.max(0.25, 1 - ballAbove / 260);
  if (shadowAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(ball.x, GND + 2, BR * 1.8 * shadowScale, BR * 0.55 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Net
  ctx.strokeStyle = '#ff2d78'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(NX, NT); ctx.lineTo(NX, GND); ctx.stroke();
  ctx.fillStyle = '#00f5ff'; ctx.fillRect(NX - 5, NT - 7, 10, 10);

  // Characters (player glows brighter)
  drawCharacter(player, '#00f5ff', true);
  tms.forEach(t => drawCharacter(t, '#0077dd', false));
  ais.forEach(a => drawCharacter(a, '#ff2d78', false));

  // Hit particles
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Ball
  const g = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BR);
  g.addColorStop(0, '#fff'); g.addColorStop(1, '#c8ff00');
  ctx.shadowColor = '#c8ff00'; ctx.shadowBlur = 14;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Serve-ready prompt
  if (state === 'serve-ready') {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 290);
    ctx.save();
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    if (serveTeam === 'player') {
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#c8ff00';
      ctx.shadowColor = '#c8ff00';
      ctx.shadowBlur = 14;
      ctx.fillText('▲  PRESS SPACE TO SERVE', 200, GND - 78);
    } else {
      const aiPulse = 0.5 + 0.3 * Math.sin(Date.now() / 400);
      ctx.globalAlpha = aiPulse;
      ctx.fillStyle = '#ff2d78';
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 10;
      ctx.fillText('AI SERVING...', 600, GND - 78);
    }
    ctx.restore();
  }

  // Fault message (floats upward and fades)
  if (faultMsg && faultMsg.timer > 0) {
    const alpha = Math.min(1, faultMsg.timer / 30);
    const rise = Math.max(0, (110 - faultMsg.timer) * 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2d78';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 18;
    ctx.fillText(faultMsg.text, 400, 175 - rise);
    ctx.restore();
  }

  // Point flash (team-side, brief)
  if (pointFlash && pointFlash.timer > 0) {
    const alpha = Math.min(1, pointFlash.timer / 18);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = pointFlash.color;
    ctx.shadowColor = pointFlash.color;
    ctx.shadowBlur = 22;
    ctx.fillText('POINT!', pointFlash.x, 225);
    ctx.restore();
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.mode-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed','true'); mode = +btn.dataset.points;
}));

document.getElementById('serve-btn').addEventListener('click', () => {
  document.getElementById('start-btn').style.display = 'none';
  ps = 0; as = 0; particles = []; faultMsg = null; pointFlash = null;
  document.getElementById('player-score').textContent = '0';
  document.getElementById('ai-score').textContent = '0';
  initServeReady('player');
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  document.getElementById('game-over-screen').classList.add('hidden');
  ps = 0; as = 0; particles = []; faultMsg = null; pointFlash = null;
  document.getElementById('player-score').textContent = '0';
  document.getElementById('ai-score').textContent = '0';
  initServeReady('player');
});

['btn-left','btn-right','btn-jump'].forEach(id => {
  const btn = document.getElementById(id);
  const key = { left: 'ArrowLeft', right: 'ArrowRight', jump: 'Space' }[btn.dataset.action];
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
});

requestAnimationFrame(loop);