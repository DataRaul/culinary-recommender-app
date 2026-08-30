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
- minimum 44px interactive target height for primary controls;
- no colour-only meaning;
- semantic headings and fieldsets;
- persistent six-item bottom navigation on mobile after the Search tab addition;
- progressive disclosure for recipe details;
- shortfalls are explicit state, not empty failure;
- reduced-motion media query disables nonessential motion;
- primary actions remain visually distinct from secondary actions;
- no generic AI gradients, glass-heavy surfaces or fake-luxury styling.

## Choice architecture
- do not force a permanent persona when user intent can vary by meal context;
- priority packs use visible checkbox cards rather than a single-select dropdown;
- the fieldset explicitly states **choose up to 3**;
- every selected priority pack exposes its scope beside it: all meals, lunch or dinner;
- a fourth selection is rejected immediately rather than silently replacing an earlier choice;
- cuisine uses the existing check-chip pattern because it is naturally multi-select;
- cuisine copy explicitly states that selections are soft preferences and that leaving all unchecked means no cuisine preference;
- broad discovery choices appear before the local Canarian option, while local relevance remains available.
