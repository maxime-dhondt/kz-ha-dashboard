# Theming

All visual values are CSS variables. Define them in a Home Assistant theme (`themes/*.yaml`) or
with card-mod, on any ancestor of the cards.

| Variable                 | Default (light)                  | Meaning                          |
| ------------------------ | -------------------------------- | -------------------------------- |
| `--glass-accent`         | `#2f7bff`                        | Accent (active states, switches) |
| `--glass-green`          | `#1fb25a`                        | OK / disarmed / energy bars      |
| `--glass-orange`         | `#ff9f0a`                        | Climate icon, "pending"          |
| `--glass-yellow`         | `#ffc400`                        | Lights / energy icons            |
| `--glass-red`            | `#ff453a`                        | Alarm triggered, errors          |
| `--glass-slate`          | `#5b6477`                        | Neutral bubbles                  |
| `--glass-text`           | `#121a2e`                        | Primary text                     |
| `--glass-text-secondary` | `#5d6985`                        | Secondary text                   |
| `--glass-surface`        | `rgba(255,255,255,.6)`           | Card background                  |
| `--glass-chip`           | `rgba(255,255,255,.55)`          | Inner buttons / tiles            |
| `--glass-border`         | `rgba(255,255,255,.72)`          | 1 px border                      |
| `--glass-shadow`         | `0 8px 30px rgba(40,60,120,.14)` | Card shadow                      |
| `--glass-radius`         | `26px`                           | Corner radius                    |
| `--glass-blur`           | `26px`                           | Backdrop blur                    |
| `--glass-font`           | SF Pro / Inter / system          | Font stack                       |
| `--glass-sidebar-bg`     | = surface                        | Sidebar background               |
| `--glass-view-height`    | `100vh − header`                 | Height of the page area (layout) |

Dark mode is automatic (`hass.themes.darkMode`); dark defaults are defined in `shared/styles.ts`.

Example theme snippet:

```yaml
glass-purple:
  glass-accent: '#8b5cf6'
  glass-radius: 20px
```
