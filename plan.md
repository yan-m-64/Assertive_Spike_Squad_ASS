Assertive Spike Squad is a single-player beach volleyball arcade game set against a neon-lit retro city skyline. The player controls one athlete on a four-person team facing an AI-controlled squad of four, with rallies following standard volleyball rules. A pre-game modal lets the player choose Quick (14 pts) or Full (21 pts) before serving begins.

Key UI components and layout:
- `#game-canvas` fills the viewport (fixed 800×450 logical resolution, CSS-scaled); all gameplay renders here including background, court, net, players, ball, and particle effects
- `#score-display` is a HUD overlay anchored top-center: team name left, score center, opponent score right, with a small "serving" indicator chevron
- `#start-btn` lives inside a full-canvas overlay with mode selector (14 / 21 toggle), game title in neon block font, and a pulsing SERVE button
- `#game-over-screen` is a centered card overlay: winner banner, final score, Play Again button
- Touch d-pad (left/right arrows + jump circle) rendered as translucent canvas shapes at bottom corners for mobile

JavaScript functionality:
- `requestAnimationFrame` game loop with fixed timestep; separate update and draw passes
- Ball physics: gravity constant, velocity vector, bounce dampening off sand; net treated as solid wall below net height
- Hit tracking object per rally: `{teamHits: 0, lastHitter: id}` — resets on net cross; fault triggers if same player hits consecutively or team reaches 4 hits
- Four AI teammates use a simple state machine: idle formation → track ball → move toward intercept point → swing when within reach radius; AI player chosen by proximity
- Player-controlled character moves via arrow keys / WASD; Space or Up to jump; auto-hit triggers on collision with ball during jump arc
- Serve rotation: winner of point earns serve; ball spawns at serving team's back-row player
- Collision: AABB between ball circle and each player rectangle; net AABB with elastic bounce if ball contacts top of net

Color scheme and style: deep indigo `#0d0a1f` sky, hot pink `#ff2d78` and cyan `#00f5ff` neon outlines, yellow-green `#c8ff00` score text, pixel font (Press Start 2P via Google Fonts). City silhouette drawn as layered rect fills. Ball has a radial gradient glow and 6-frame motion trail. Scanline overlay via a semi-transparent repeating linear-gradient CSS layer over the canvas. Score pop animates with a brief scale-up keyframe on point win.

Accessibility: `role="dialog"` on overlays, `aria-live="polite"` on `#score-display`, all buttons have visible focus rings (`outline: 2px solid #ff2d78`), keyboard-navigable menu (Tab + Enter), touch buttons labeled with `aria-label`.

State management: pure in-memory game state object (mode, scores, rally state, positions); no localStorage needed beyond optional `bestStreak` stored on game-over.