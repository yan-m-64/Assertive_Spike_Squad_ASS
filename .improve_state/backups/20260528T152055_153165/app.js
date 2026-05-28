const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 450;

const GND = 390, NX = 400, NT = 268, BR = 12, PW = 28, PH = 46;
let state = 'idle', mode = 14, ps = 0, as = 0, keys = {};
let ball, player, tms, ais, rally, hitLock;

const mkP = (x, id) => ({ x, y: GND - PH, vy: 0, g: true, id });

function initRally(srv) {
  rally = { hits: 0, last: null, side: srv };
  player = mkP(160, 'p');
  tms = [mkP(60, 't1'), mkP(240, 't2'), mkP(330, 't3')];
  ais = [mkP(490, 'a1'), mkP(570, 'a2'), mkP(660, 'a3'), mkP(730, 'a4')];
  ball = { x: srv === 'player' ? 160 : 650, y: GND - PH - 40, vx: srv === 'player' ? 4 : -4, vy: -9 };
  updateDots();
}

function updateDots() {
  for (let i = 1; i <= 3; i++) document.getElementById('hit-' + i).classList.toggle('active', i <= rally.hits);
}

function point(who) {
  if (who === 'player') ps++; else as++;
  document.getElementById('player-score').textContent = ps;
  document.getElementById('ai-score').textContent = as;
  if (ps >= mode || as >= mode) {
    state = 'gameover';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('winner-banner').textContent = ps >= mode ? 'YOU WIN!' : 'NEON ACES WIN!';
    document.getElementById('final-score-player').textContent = ps;
    document.getElementById('final-score-ai').textContent = as;
  } else initRally(who);
}

const aabb = (p, b) => b.x + BR > p.x && b.x - BR < p.x + PW && b.y + BR > p.y && b.y - BR < p.y + PH;

function tryHit(p, side) {
  if (hitLock || (ball.x < NX ? 'player' : 'ai') !== side) return;
  if (rally.last === p.id || rally.hits >= 3) { point(side === 'player' ? 'ai' : 'player'); return; }
  rally.hits++; rally.last = p.id; hitLock = true;
  ball.vx = (side === 'player' ? 1 : -1) * (4 + Math.random() * 4);
  ball.vy = -11 - Math.random() * 3;
  updateDots();
}

function moveAI(p, home, side) {
  const onBall = side === 'player' ? ball.x < NX : ball.x > NX;
  const tx = onBall ? ball.x - PW / 2 : home;
  if (Math.abs(p.x - tx) > 3) p.x += Math.sign(tx - p.x) * 2.5;
  p.x = side === 'player' ? Math.max(0, Math.min(NX - PW - 5, p.x)) : Math.max(NX + 5, Math.min(800 - PW, p.x));
  if (onBall && Math.abs(p.x - ball.x) < 55 && ball.y > p.y - 55 && p.g) { p.vy = -12; p.g = false; }
  p.vy += 0.5; p.y += p.vy;
  if (p.y >= GND - PH) { p.y = GND - PH; p.vy = 0; p.g = true; }
  if (aabb(p, ball)) tryHit(p, side);
}

function update() {
  if (state !== 'playing') return;
  hitLock = false;
  if (keys.ArrowLeft || keys.KeyA) player.x = Math.max(0, player.x - 3);
  if (keys.ArrowRight || keys.KeyD) player.x = Math.min(NX - PW - 5, player.x + 3);
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
  if (ns !== rally.side) { rally.side = ns; rally.hits = 0; rally.last = null; updateDots(); }
}

function draw() {
  ctx.fillStyle = '#0d0a1f'; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = '#130c2e';
  [[30,130,70],[140,95,55],[250,145,65],[530,110,80],[635,90,60],[718,130,72]].forEach(([x,h,w]) => ctx.fillRect(x, GND - h, w, h));
  ctx.fillStyle = '#ff2d78';
  [[45,GND-105],[155,GND-72],[265,GND-115],[545,GND-85],[650,GND-68],[733,GND-105]].forEach(([x,y]) => ctx.fillRect(x, y, 8, 6));
  ctx.fillStyle = '#00f5ff55';
  [[72,GND-75],[170,GND-50],[278,GND-88],[560,GND-58],[668,GND-42],[748,GND-78]].forEach(([x,y]) => ctx.fillRect(x, y, 6, 5));
  ctx.fillStyle = '#c4914e'; ctx.fillRect(0, GND, 800, 60);
  ctx.fillStyle = '#d4a464'; ctx.fillRect(0, GND, 800, 8);
  ctx.strokeStyle = '#ff2d78'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(NX, NT); ctx.lineTo(NX, GND); ctx.stroke();
  ctx.fillStyle = '#00f5ff'; ctx.fillRect(NX - 5, NT - 7, 10, 10);

  if (!ball || !player) return;

  const dP = (p, c) => {
    ctx.fillStyle = c; ctx.fillRect(p.x, p.y, PW, PH);
    ctx.fillStyle = '#fff8'; ctx.fillRect(p.x + 6, p.y + 6, 16, 12);
  };
  dP(player, '#00f5ff');
  tms.forEach(t => dP(t, '#008cff'));
  ais.forEach(a => dP(a, '#ff2d78'));
  const g = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BR);
  g.addColorStop(0, '#fff'); g.addColorStop(1, '#c8ff00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, Math.PI * 2); ctx.fill();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.addEventListener('keydown', e => { keys[e.code] = true; if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });

document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.mode-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed','true'); mode = +btn.dataset.points;
}));

document.getElementById('serve-btn').addEventListener('click', () => {
  document.getElementById('start-btn').style.display = 'none';
  ps = 0; as = 0; state = 'playing';
  document.getElementById('player-score').textContent = '0';
  document.getElementById('ai-score').textContent = '0';
  initRally('player');
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  document.getElementById('game-over-screen').classList.add('hidden');
  ps = 0; as = 0; state = 'playing';
  document.getElementById('player-score').textContent = '0';
  document.getElementById('ai-score').textContent = '0';
  initRally('player');
});

['btn-left','btn-right','btn-jump'].forEach(id => {
  const btn = document.getElementById(id);
  const key = {left:'ArrowLeft',right:'ArrowRight',jump:'Space'}[btn.dataset.action];
  btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
});

requestAnimationFrame(loop);