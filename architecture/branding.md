# Branding Architecture

## Directory

```
branding/
  logo-large.svg        ← full logo: icon + text
  logo-small.svg        ← icon only, simplified for small sizes
  logo-favicon.svg      ← 32×32 optimized, no text
  palette.js            ← agent-generated, loaded by preview HTML
  colors.yaml           ← source of truth for colors (editable directly)
  palette-template.html ← static HTML preview, in repo, never generated
  README.md             ← "edit these files, run just setup apply-branding"
```

## Setup Flow

Part of setup step 3 (Branding). Runs after business description captured.

1. Agent generates `palette.js` — 5 palettes × 5 colors + 3 SVG logo variants each
2. Script opens `palette-template.html` in system browser (`xdg-open` / `open`)
3. Browser auto-refreshes on `palette.js` change (polling `setInterval`)
4. Terminal loop:

```
  Palette browser open.

  Pick (1-5), or:
    r   → regenerate all
    c   → custom instructions, regenerate all
    1c  → custom instructions for palette 1 only

  Choice: _
```

5. User picks → `apply-branding` runs automatically
6. User can always re-run `just setup-apply-branding` after manual edits

## Logo propagation

`just setup-apply-branding` handles three targets:
- Copies `branding/logo-*.svg` → `{client-portal,admin-portal,landing}/public/`
- Replaces inline SVG in `landing/index.html` between `<!-- LOGO-MARK-START -->` / `<!-- LOGO-MARK-END -->` markers with `branding/logo-small.svg` (sized `width="48" height="48"`)

**Rule:** never edit inline SVGs in `index.html` directly for logo changes — edit `branding/logo-small.svg` and re-run `just setup-apply-branding`.

## palette.js Structure

Agent writes this file. Template HTML loads it as a script tag.

```javascript
const selectedPalette = 1  // updated by apply-branding

const palettes = [
  {
    id: 1,
    name: "Ocean Focus",
    colors: {
      primary:   "#6366f1",
      secondary: "#8b5cf6",
      accent:    "#06b6d4",
      success:   "#10b981",
      danger:    "#ef4444"
    },
    logos: {
      large:   `<svg>...</svg>`,   // full lockup: icon + wordmark
      small:   `<svg>...</svg>`,   // icon only
      favicon: `<svg>...</svg>`    // 32×32, minimal
    }
  },
  // × 5
]
```

## palette-template.html

Static, in repo. Never generated. Loads `palette.js` via script tag.

Shows per palette column:
- Large logo at top
- Small logo + favicon preview side by side
- 5 color swatches with hex values + names
- Sample UI: navbar, button (primary/secondary), card, success/danger badges
- Dark mode toggle (shows palette in dark context)

Footer: "Type your choice in the terminal"

## colors.yaml

Written by `apply-branding` after selection. Editable directly.

```yaml
primary:   "#6366f1"
secondary: "#8b5cf6"
accent:    "#06b6d4"
success:   "#10b981"
danger:    "#ef4444"
```

`apply-branding` reads from here — not from `palette.js`. Decoupled.

## just setup apply-branding

Reads `branding/colors.yaml` + SVG files. No questions. Propagates everywhere.

### CSS vars updated

`commons/styles/globals.css`, `landing/styles/globals.css`:
```css
:root {
  --color-primary:   #6366f1;
  --color-secondary: #8b5cf6;
  --color-accent:    #06b6d4;
  --color-success:   #10b981;
  --color-danger:    #ef4444;
}
```

### Files updated

| Source | Destination |
|--------|-------------|
| `colors.yaml` → primary | `client-portal/public/manifest.json` → `theme_color` |
| `colors.yaml` → primary | `admin-portal/public/manifest.json` → `theme_color` |
| `colors.yaml` → primary | `mobile-app/app.json` → `primaryColor`, `splash.backgroundColor`, `android.navigationBarColor` |
| `colors.yaml` | `project.yaml` → `theme_colors` block |
| `logo-large.svg` | `client-portal/public/logo.svg` |
| `logo-large.svg` | `admin-portal/public/logo.svg` |
| `logo-large.svg` | `landing/assets/logo.svg` |
| `logo-small.svg` | `client-portal/public/logo-small.svg` |
| `logo-small.svg` | `admin-portal/public/logo-small.svg` |
| `logo-small.svg` | `mobile-app/assets/logo.svg` |
| `logo-favicon.svg` | `client-portal/public/favicon.svg` |
| `logo-favicon.svg` | `admin-portal/public/favicon.svg` |
| `logo-favicon.svg` | `landing/assets/favicon.svg` |

### Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BRANDING APPLIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  CSS vars updated       commons, landing
  ✓  PWA manifests updated  client-portal, admin-portal
  ✓  Mobile theme updated   app.json
  ✓  Logos copied           3 variants → 4 destinations
  ✓  project.yaml updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Run: just dev  to see changes
```

## Checker

`setup/checks/branding_check.sh` — verifies:
- All CSS var files use only `--color-*` vars (no hardcoded hex)
- All manifest `theme_color` values match `colors.yaml` primary
- All SVG destinations exist and are non-empty
- Fails with exact file + line if drift detected

## Manual override

Edit any file in `branding/` directly, then:
```bash
just setup apply-branding
```

SVGs: any vector editor (Figma, Inkscape, Illustrator). Export as SVG, replace file, re-run.
Colors: edit `branding/colors.yaml` directly, re-run.
