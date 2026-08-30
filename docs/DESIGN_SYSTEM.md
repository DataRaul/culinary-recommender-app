# Design System

## Design brief
Calm, sophisticated, appetite-adjacent without food clichés. The interface prioritizes planning clarity over decorative recipe-media treatment. It borrows interaction lessons—not theme—from the workout recommender.

## Tokens
| Token | V0 role |
|---|---|
| `--bg` | warm neutral page background |
| `--surface`, `--surface-2` | primary and secondary surfaces |
| `--text`, `--muted` | high-contrast text hierarchy |
| `--line` | controls/card separation |
| `--primary` | deep green primary action/navigation signal |
| `--accent` | restrained olive information accent |
| `--success`, `--warning`, `--danger` | semantic state |
| `--focus` | visible keyboard focus ring |
| `--radius-*`, `--shadow`, `--space-*` | structural rhythm |

Typography uses a robust system sans-serif stack with no proprietary font dependency.

## Interaction rules
- minimum 44px interactive target height;
- no colour-only meaning;
- semantic headings and fieldsets;
- persistent five-item bottom navigation on mobile;
- progressive disclosure for recipe details;
- shortfalls are explicit state, not empty failure;
- reduced-motion media query disables nonessential motion;
- primary actions remain visually distinct from secondary actions;
- no generic AI gradients, glass-heavy surfaces or fake-luxury styling.
