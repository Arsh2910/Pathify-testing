# DESIGN.md — Trailhead Learning Platform

> Extracted from Stitch project **"Trailhead Learning Platform"** (`projects/7820970269232394633`)  
> Design system: **Luminous Focus**

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `background` / `deep-black` | `#000000` | Page background |
| `surface` | `#111317` | Nav, base surfaces |
| `surface-container-lowest` | `#0c0e12` | Deepest containers |
| `surface-container-low` | `#1a1c1f` | Card backgrounds |
| `surface-container` | `#1e2024` | Cards, panels |
| `surface-container-high` | `#282a2e` | Elevated elements |
| `surface-container-highest` | `#333539` | Chips, tags |
| `slate-surface` | `#1A1B1E` | Input fields |
| `on-surface` | `#e2e2e7` | Primary text |
| `on-surface-variant` | `#bacabf` | Secondary text |
| `outline` | `#85948a` | Borders |
| `outline-variant` | `#3c4a41` | Subtle borders |
| `primary` | `#a7ffd1` | Brand text, links |
| **`primary-container`** | **`#3feba8`** | **Action buttons (Electric Emerald)** |
| `primary-fixed` | `#58feb9` | Bright accents |
| `primary-fixed-dim` | `#2ee19f` | Surface tint |
| `on-primary` | `#003824` | Text on emerald buttons |
| `secondary` | `#5cd8da` | Secondary accents |
| `secondary-container` | `#00a4a6` | Progress bar gradient start |
| `tertiary-container` | `#ffc862` | Streak fire, warnings |
| `error` | `#ffb4ab` | Error states |
| `error-container` | `#93000a` | Error backgrounds |
| `text-muted` | `#969696` | Placeholder, meta text |
| `success-glow` | `rgba(63, 235, 168, 0.15)` | Glow effects |

---

## Typography

| Token | Font | Size | Weight | Line-Height | Notes |
|---|---|---|---|---|---|
| `headline-xl` | **Montserrat** | 40px | 700 | 48px | `-0.02em` tracking |
| `headline-xl-mobile` | **Montserrat** | 32px | 700 | 38px | |
| `headline-lg` | **Montserrat** | 24px | 600 | 32px | |
| `body-lg` | Inter | 18px | 400 | 28px | |
| `body-md` | Inter | 16px | 400 | 24px | |
| `label-sm` | Inter | 14px | 600 | 20px | `0.05em` tracking |
| `mono-label` | Inter | 12px | 500 | 16px | |

**Note from user brief:** User specified **Manrope for headings** and **Hanken Grotesk for body** — these match the older "Trailhead Learning Guide" design system. The active Stitch project ("Trailhead Learning Platform") uses **Montserrat + Inter**.

---

## Spacing

| Token | Value | Usage |
|---|---|---|
| `base` | 8px | Spacing unit |
| `container-max` | 1200px | Page max-width |
| `gutter` | 24px | Column gap |
| `margin-desktop` | 48px | Desktop side padding |
| `margin-mobile` | 16px | Mobile side padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `DEFAULT` | 0.25rem (4px) | Buttons, small elements |
| `lg` | 0.5rem (8px) | Cards |
| `xl` | 0.75rem (12px) | Modals, large containers |
| `full` | 9999px | Pills, chips |

---

## Elevation & Depth

Depth is communicated through **tonal layering** and **glassmorphism**, not drop shadows:

- **Level 0 (Base):** `#000000` — page background
- **Level 1 (Surface):** `#111317` — nav bar
- **Level 2 (Cards):** `rgba(26, 27, 30, 0.8)` glassmorphic cards
- **Glass Effect:** `backdrop-filter: blur(20px)` + `border: 1px solid #27292D`
- **Glow:** emerald glow via `box-shadow: 0 0 15px rgba(63, 235, 168, 0.15)`

---

## Components

### Buttons
- **Primary:** `background: #3feba8; color: #003824;` — Electric Emerald with deep green text
- **Ghost:** `border: 1px solid #3c4a41; color: #e2e2e7;` — hover changes border/text to emerald
- **Danger:** `border: 1px solid rgba(255, 180, 171, 0.3); color: #ffb4ab`
- Hover state: `box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.2)` + `-1px` translateY

### Input Fields
- Background: `#1A1B1E` (slate-surface)
- Border: `1px solid rgba(60, 74, 65, 0.5)`
- Focus: border `#3feba8` + `box-shadow: 0 0 0 3px rgba(63, 235, 168, 0.1)`

### Status Pills
- `generating` → teal: `rgba(92, 216, 218, 0.15)` bg, `#5cd8da` text
- `active` → emerald: `rgba(63, 235, 168, 0.15)` bg, `#3feba8` text
- `completed` → mint: `rgba(167, 255, 209, 0.15)` bg, `#a7ffd1` text
- `abandoned` → red: `rgba(147, 0, 10, 0.15)` bg, `#ffb4ab` text

### Progress Trail (Line-and-Node)
- Vertical line: `2px solid rgba(60, 74, 65, 0.5)`
- Completed node: 20px circle, `bg: #3feba8`, checkmark icon, `box-shadow: 0 0 8px rgba(63, 235, 168, 0.4)`
- Active node: transparent with `border: 2px solid #3feba8`, pulsing ring animation
- Pending node: transparent with `border: 2px solid #3c4a41`

### Progress Bar
- Track: `background: #333539`, 6px height, `border-radius: 9999px`
- Fill: `background: linear-gradient(90deg, #00a4a6, #3feba8)`

### Streak Badge
- Fire icon: `local_fire_department` (filled), `color: #ffc862`
- Container: `background: #333539`, `border: 1px solid rgba(60, 74, 65, 0.4)`, `border-radius: 9999px`

### Navbar
- Glassmorphic: `background: rgba(17, 19, 23, 0.8)`, `backdrop-filter: blur(20px)`
- Border bottom: `1px solid rgba(60, 74, 65, 0.4)`
- Height: `64px`

---

## Icons

**Material Symbols Outlined** — variable font  
`font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`  
Filled variant: `'FILL' 1`

Key icons used:
- `explore` — Trailhead brand logo
- `local_fire_department` — streak badge
- `my_location` — today's focus
- `bolt` — micro first step
- `lightbulb` — why now
- `check_circle` / `check` — completed
- `refresh` — generating / regenerate

---

## Screens

| Screen | Stitch ID | URL |
|---|---|---|
| Create Roadmap (Dark) | `549350b524f64e1589512c657674e906` | `/new` |
| Create Roadmap (Light) | `19f746e2c432478a92d2ee57ca13fc1b` | `/new` |
| Dashboard (Dark) | `a9c99549beb8428b8fe70ebffd43a1c8` | `/` |
| Dashboard (Light) | `22e3e691df174a9e8e9bb2d629fb991a` | `/` |
| Roadmap Detail (Dark) | `3419d13f49e942b984bcbeb987cdb519` | `/roadmaps/:id` |
| Roadmap Detail (Light) | `23607c7ae0c141b98576d03df3aac062` | `/roadmaps/:id` |
| Login & Register (Dark) | `e96d87e1a11344a68bebbf21f019834c` | `/login` |
| Login & Register (Light) | `6fbfda5f47884d56ba5fad420b7e06c3` | `/login` |
| Trailhead Logo | `e198b53907b84e2a8023c3186a9ea443` | — |
