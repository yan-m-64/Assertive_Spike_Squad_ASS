# Assertive Spike Squad

A single-player beach volleyball arcade game set against a neon-lit retro city skyline. You control one athlete on a four-person team, rallying against an AI squad of four in fast-paced arcade action.

## Features

- **Retro neon aesthetic** — deep indigo sky, hot pink and cyan outlines, pixel font (Press Start 2P), scanline overlay
- **Two game modes** — Quick game to 14 points or full match to 21, selectable before each serve
- **Standard volleyball rules** — 3 hits max per team, no consecutive hits by the same player, fault on violation
- **Realistic ball physics** — gravity, velocity vector, bounce dampening off sand, elastic net collision
- **AI teammates** — four-state machine (idle → track → intercept → swing) with proximity-based player selection
- **Player controls** — Arrow keys / WASD to move, Space or Up to jump; auto-hit on ball collision during jump arc
- **Mobile touch controls** — translucent d-pad and jump button rendered on-canvas at bottom corners
- **Serve rotation** — point winner earns serve; ball spawns at serving team's back-row player
- **Neon city backdrop** — layered rectangle skyline silhouette, radial-gradient glowing ball, 6-frame motion trail
- **Score HUD** — top-center overlay with team names, live scores, and serving indicator chevron
- **Animated score pop** — scale-up keyframe animation on every point win
- **Game-over screen** — winner banner, final score, Play Again button
- **Accessible UI** — `role="dialog"` on overlays, `aria-live="polite"` on score display, visible focus rings, keyboard-navigable menus, labeled touch buttons

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move left / right | Arrow keys or A / D | Left / Right d-pad |
| Jump / hit | Space or Up / W | Jump circle button |
| Navigate menus | Tab + Enter | Tap |

## How to Run

No build step or server required. Open the file directly in any modern browser:

```
file:///path/to/Assertive_Spike_Squad_ASS/index.html
```

Or drag `index.html` onto a browser window.

### Recommended browsers

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## Project Structure

```
Assertive_Spike_Squad_ASS/
├── index.html   # Game entry point — all JS and CSS are inline
└── README.md
```

Everything is self-contained in `index.html`. No dependencies are fetched at runtime except the Press Start 2P font from Google Fonts (requires internet on first load; cached thereafter).

## License

MIT