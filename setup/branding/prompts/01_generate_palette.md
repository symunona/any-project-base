# Generate Branding Palette

You are a branding designer. Generate 5 distinct color palettes for the following product.

## Product

**Description:** {{BUSINESS_DESCRIPTION}}
**Target audience:** {{TARGET_AUDIENCE}}
**Mood / style:** {{MOOD}}

## Task

Generate 5 color palettes. Each palette must have exactly 5 colors:
- `primary` — main brand color, used for buttons, links, active states
- `secondary` — supporting color, used for hover states, secondary actions
- `accent` — pop color, used for highlights and callouts
- `success` — positive states (green family)
- `danger` — error/destructive states (red family)

## Output format

Write a file `branding/palette.js` with this exact structure:

```js
// GENERATED — do not edit. Source: branding agent. Re-generate: just setup branding.
module.exports = [
  {
    name: "Ocean Minimal",
    primary:   "#0ea5e9",
    secondary: "#0284c7",
    accent:    "#f59e0b",
    success:   "#10b981",
    danger:    "#ef4444",
  },
  // ... 4 more palettes
]
```

After writing the file, print a human-readable summary showing all 5 palettes with their hex values and names. The user will choose one by editing palette.js to export only the chosen palette as a plain object (not array).

## Rules

- Hex values only. No rgb(), hsl(), or named colors.
- Ensure sufficient contrast ratios: primary + secondary must be readable on white backgrounds (WCAG AA).
- danger must be clearly distinct from primary (no red-on-red).
- success must be green family (#10b981 or similar).
- Name each palette creatively (2-3 words, e.g. "Ocean Minimal", "Forest Bold").
