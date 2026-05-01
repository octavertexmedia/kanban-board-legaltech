---
name: jira-atlassian-design-system
description: >
  Complete reference for the Atlassian Design System (ADS) used in Jira, Confluence,
  Trello, and all Atlassian products. Use this skill whenever building, reviewing, or
  styling UI that targets Jira or any Atlassian product — including React components
  with @atlaskit, Forge apps, custom UI, design tokens, theming, typography, spacing,
  color, elevation, and component patterns. Trigger on any mention of: Jira, Atlassian,
  Atlaskit, Forge UI, ADS, atlassian.design, design tokens for Atlassian, or any
  request to "match Jira's style / look and feel".
---

# Atlassian Design System (ADS) — Jira Skill

Reference for building UI that matches Jira and the broader Atlassian product family.
The system is called **ADS** (Atlassian Design System); the React component library
is **@atlaskit**. Tokens are distributed via **@atlaskit/tokens**.

---

## 1. Typefaces

| Role        | Typeface            | Notes                                          |
|-------------|---------------------|------------------------------------------------|
| UI / in-app | **Atlassian Sans**  | All product screens. Optimised for screens.   |
| Code        | **Atlassian Mono**  | Derived from JetBrains Mono. Code blocks only.|
| Brand       | **Charlie Sans**    | Marketing / external only. Not for product UI.|

```css
/* In-app font stack */
font-family: "Atlassian Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Code font stack */
font-family: "Atlassian Mono", "JetBrains Mono", "SFMono-Regular", monospace;
```

---

## 2. Typography Scale

Scale ratio: **minor third (×1.2)**. Units: **rem** (relative to browser default 16 px).
Minimum font size: **12 px**.

| Token                        | px   | rem      | Weight | Line-height |
|------------------------------|------|----------|--------|-------------|
| `font.heading.xxlarge`       | 29   | 1.8125   | 600    | 32 px       |
| `font.heading.xlarge`        | 24   | 1.5      | 600    | 28 px       |
| `font.heading.large`         | 20   | 1.25     | 600    | 24 px       |
| `font.heading.medium`        | 16   | 1.0      | 600    | 20 px       |
| `font.heading.small`         | 14   | 0.875    | 600    | 16 px       |
| `font.heading.xsmall`        | 12   | 0.75     | 600    | 16 px       |
| `font.body`                  | 14   | 0.875    | 400    | 20 px       |
| `font.body.large`            | 16   | 1.0      | 400    | 24 px       |
| `font.body.UNSAFE_small`     | 12   | 0.75     | 400    | 16 px       |
| `font.code`                  | 12   | 0.75     | 400    | 1em         |

### Font weights
- **400 Regular** — body paragraphs, generic text
- **500 Medium** — text beside line icons (matches icon stroke width)
- **600 Bold** — headings; use sparingly on body

> Semibold (500) falls back to bold on systems without Atlassian Sans — avoid it
> in contexts where the fallback would look heavy.

### CSS usage (tokens)
```css
.heading { font: var(--ds-font-heading-large); }
.body    { font: var(--ds-font-body); }
.code    { font: var(--ds-font-code); }
```

### React / @atlaskit/tokens
```ts
import { token } from '@atlaskit/tokens';
const styles = {
  heading: { font: token('font.heading.large') },
  body:    { font: token('font.body') },
};
```

---

## 3. Color Palette

### Brand Blues
| Name        | Hex       | Token key (light)                          | Usage               |
|-------------|-----------|---------------------------------------------|---------------------|
| Blue 900    | `#0747A6` | `color.background.selected.bold`            | Pressed, bold CTA   |
| Blue 700    | `#0052CC` | `color.background.brand.bold`               | Primary brand       |
| Blue 400    | `#2684FF` | `color.link`                                | Links, interactive  |
| Blue 200    | `#4C9AFF` | `color.background.selected`                 | Hover states        |
| Blue 100    | `#DEEBFF` | `color.background.selected.subtle`          | Selection bg        |
| Blue 50     | `#E9F2FF` | `color.background.information.hovered`      | Info bg hovered     |

### Neutrals
| Name          | Hex       | Token key                   | Usage                    |
|---------------|-----------|-----------------------------|--------------------------|
| Neutral 900   | `#172B4D` | `color.text`                | Primary body text        |
| Neutral 700   | `#42526E` | `color.text.subtle`         | Secondary / muted text   |
| Neutral 500   | `#97A0AF` | `color.text.disabled`       | Disabled / placeholder   |
| Neutral 300   | `#B3BAC5` | `color.text.subtlest`       | Hint / fine print        |
| Neutral 200   | `#DFE1E6` | `color.border`              | Default borders           |
| Neutral 100   | `#EBECF0` | `color.border.subtle`       | Subtle dividers          |
| Neutral 50    | `#F4F5F7` | `color.background.neutral`  | Page / canvas background |
| White         | `#FFFFFF` | `color.background.input`    | Input, card surface      |

### Semantic Colors
| Role        | Background | Bold bg    | Text       | Usage                        |
|-------------|------------|------------|------------|------------------------------|
| Success     | `#E3FCEF`  | `#36B37E`  | `#006644`  | Done, approved, healthy      |
| Warning     | `#FFFAE6`  | `#FFAB00`  | `#FF8B00`  | At risk, needs attention     |
| Danger      | `#FFEBE6`  | `#DE350B`  | `#BF2600`  | Errors, destructive actions  |
| Information | `#DEEBFF`  | `#0052CC`  | `#0052CC`  | System messages, tooltips    |
| Discovery   | `#EAE6FF`  | `#6554C0`  | `#403294`  | New features, highlights     |

### Token naming convention
```
color.{property}.{role}.{emphasis}.{state}
        │          │        │          └── hovered | pressed | disabled
        │          │        └──────────── subtle | bold (omit = default)
        │          └───────────────────── text | background | border | icon | link
        └──────────────────────────────── (fixed)
```

Examples:
- `color.background.danger.bold` → `#DE350B`
- `color.text.success`           → `#006644`
- `color.border.focused`         → `#4C9AFF`
- `color.icon.warning`           → `#FF8B00`

### Dark mode
ADS ships light and dark token sets. Apply via HTML attribute:
```html
<html data-color-mode="dark" data-theme="dark:dark light:light">
```
All `--ds-*` CSS variables flip automatically. Never hardcode hex values in product UI —
always use design tokens so theming works.

---

## 4. Spacing System

Base unit: **8 px** (`space.100`). All tokens are multiples of 4 px.
Negative tokens (`space.negative.025` → `space.negative.400`) available for bleed.

| Token           | px  | rem    | Typical use                                      |
|-----------------|-----|--------|--------------------------------------------------|
| `space.025`     | 2   | 0.125  | Icon nudge, micro offsets                        |
| `space.050`     | 4   | 0.25   | Icon–label gap, tight inline spacing             |
| `space.075`     | 6   | 0.375  | Compact list item padding                        |
| `space.100`     | 8   | 0.5    | Base unit — component internal padding           |
| `space.150`     | 12  | 0.75   | Button padding, field gap                        |
| `space.200`     | 16  | 1.0    | Card padding, section internal gap               |
| `space.250`     | 20  | 1.25   | Medium component padding                         |
| `space.300`     | 24  | 1.5    | Large container padding, avatar–content gap      |
| `space.400`     | 32  | 2.0    | Section-level spacing, layout gaps               |
| `space.500`     | 40  | 2.5    | Page section separation                          |
| `space.600`     | 48  | 3.0    | Between major layout regions                     |
| `space.800`     | 64  | 4.0    | Large layout breathing room                      |
| `space.1000`    | 80  | 5.0    | Hero / page-level padding                        |

```css
/* CSS */
.card { padding: var(--ds-space-300); gap: var(--ds-space-200); }

/* @atlaskit/tokens */
import { token } from '@atlaskit/tokens';
const card = { padding: token('space.300'), gap: token('space.200') };
```

---

## 5. Grid & Layout

| Breakpoint | Name  | Min width | Columns | Gutter |
|------------|-------|-----------|---------|--------|
| xs         | —     | 0         | 4       | 8 px   |
| sm         | small | 480 px    | 8       | 8 px   |
| md         | med   | 768 px    | 12      | 8 px   |
| lg         | large | 1024 px   | 12      | 16 px  |
| xl         | xlarge| 1280 px   | 12      | 24 px  |
| xxl        | fluid | 1440 px   | 12      | 24 px  |

Standard Jira sidebar width: **240 px**. Content area: fluid, min **600 px**.

---

## 6. Elevation & Surfaces

| Level    | Token                   | Shadow value                                          | Use case                    |
|----------|-------------------------|-------------------------------------------------------|-----------------------------|
| Flat     | `--ds-surface`          | none                                                  | Default page surface        |
| Raised   | `--ds-surface-raised`   | `0 1px 2px rgba(9,30,66,.12)`                         | Cards, panels               |
| Overlay  | `--ds-surface-overlay`  | `0 4px 8px rgba(9,30,66,.15), 0 0 1px rgba(9,30,66,.2)` | Dropdowns, popovers      |
| Sunken   | *(inverted depth)*      | inner shadow or reduced bg                            | Input fields, wells         |

---

## 7. Border Radius

| Token                   | Value  | Use                          |
|-------------------------|--------|------------------------------|
| `border.radius.050`     | 2 px   | Lozenges, small chips        |
| `border.radius.100`     | 4 px   | Buttons, form inputs, tags   |
| `border.radius.200`     | 8 px   | Cards, panels                |
| `border.radius.300`     | 12 px  | Modals, large containers     |
| `border.radius.circle`  | 50%    | Avatars                      |

---

## 8. Components Reference

### Buttons
```tsx
import Button from '@atlaskit/button/standard-button';

// Hierarchy: primary → default → subtle → link → danger
<Button appearance="primary">Create</Button>
<Button appearance="default">Cancel</Button>
<Button appearance="subtle">Learn more</Button>
<Button appearance="link">View details</Button>
<Button appearance="danger">Delete</Button>

// Sizes: default (32px), compact (24px)
<Button spacing="compact">Filter</Button>
```

Height: **32 px** default | **24 px** compact.
Border-radius: **4 px**.
Font: **14 px / 500** Atlassian Sans.

### Lozenge (Status badges)
```tsx
import Lozenge from '@atlaskit/lozenge';
// Appearances: default | inprogress | moved | new | removed | success
<Lozenge appearance="inprogress">In Progress</Lozenge>
<Lozenge appearance="success">Done</Lozenge>
<Lozenge appearance="removed">Blocked</Lozenge>
```
Style: **3 px** radius, **ALL CAPS**, weight **700**, font 11 px.

### Jira issue status colors
| Status      | Background  | Text       |
|-------------|-------------|------------|
| To Do       | `#DFE1E6`   | `#42526E`  |
| In Progress | `#DEEBFF`   | `#0747A6`  |
| In Review   | `#EAE6FF`   | `#403294`  |
| Done        | `#E3FCEF`   | `#006644`  |
| Blocked     | `#FFEBE6`   | `#BF2600`  |

### Priority icons
| Priority | Color     |
|----------|-----------|
| Highest  | `#CD1316` |
| High     | `#E97F33` |
| Medium   | `#E2B203` |
| Low      | `#2D8738` |
| Lowest   | `#57A55A` |

### Form inputs
```tsx
import TextField from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Checkbox from '@atlaskit/checkbox';
```
Height: **32 px**. Border: `1.5px solid #DFE1E6`. Focused: `#4C9AFF` ring.

### Avatar
```tsx
import Avatar from '@atlaskit/avatar';
// sizes: xsmall(16) | small(24) | medium(32) | large(40) | xlarge(96) | xxlarge(128)
<Avatar size="medium" src={url} name="User Name" />
```

### Flag (Toast / notification)
```tsx
import Flag from '@atlaskit/flag';
// appearance: info | success | warning | error
```

### Modal
```tsx
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
// width: small(400) | medium(600) | large(800) | x-large(968)
```

### Inline Edit
```tsx
import InlineEdit from '@atlaskit/inline-edit';
// Used heavily in Jira issue detail view
```

---

## 9. Design Token CSS Variables (light theme defaults)

```css
/* Text */
--ds-text:                #172B4D;
--ds-text-subtle:         #42526E;
--ds-text-subtlest:       #97A0AF;
--ds-text-disabled:       #97A0AF;
--ds-text-inverse:        #FFFFFF;
--ds-link:                #0052CC;

/* Backgrounds */
--ds-background-neutral:         #F4F5F7;
--ds-background-input:           #FFFFFF;
--ds-background-brand-bold:      #0052CC;
--ds-background-selected:        #DEEBFF;
--ds-background-selected-bold:   #0052CC;
--ds-background-success:         #E3FCEF;
--ds-background-warning:         #FFFAE6;
--ds-background-danger:          #FFEBE6;
--ds-background-information:     #DEEBFF;
--ds-background-discovery:       #EAE6FF;

/* Borders */
--ds-border:         #DFE1E6;
--ds-border-subtle:  #EBECF0;
--ds-border-bold:    #B3BAC5;
--ds-border-focused: #4C9AFF;
--ds-border-danger:  #DE350B;

/* Icons */
--ds-icon:           #42526E;
--ds-icon-subtle:    #97A0AF;
--ds-icon-success:   #36B37E;
--ds-icon-warning:   #FF8B00;
--ds-icon-danger:    #DE350B;
--ds-icon-discovery: #6554C0;
--ds-icon-information: #0052CC;

/* Surfaces / elevation */
--ds-surface:          #FFFFFF;
--ds-surface-raised:   #FFFFFF;
--ds-surface-overlay:  #FFFFFF;

/* Space */
--ds-space-025: 2px;  --ds-space-050: 4px;  --ds-space-075: 6px;
--ds-space-100: 8px;  --ds-space-150: 12px; --ds-space-200: 16px;
--ds-space-250: 20px; --ds-space-300: 24px; --ds-space-400: 32px;
--ds-space-500: 40px; --ds-space-600: 48px; --ds-space-800: 64px;
--ds-space-1000: 80px;

/* Typography */
--ds-font-heading-xxlarge: 600 1.8125rem/2rem "Atlassian Sans", sans-serif;
--ds-font-heading-xlarge:  600 1.5rem/1.75rem "Atlassian Sans", sans-serif;
--ds-font-heading-large:   600 1.25rem/1.5rem "Atlassian Sans", sans-serif;
--ds-font-heading-medium:  600 1rem/1.25rem "Atlassian Sans", sans-serif;
--ds-font-heading-small:   600 0.875rem/1rem "Atlassian Sans", sans-serif;
--ds-font-body:            400 0.875rem/1.25rem "Atlassian Sans", sans-serif;
--ds-font-body-large:      400 1rem/1.5rem "Atlassian Sans", sans-serif;
--ds-font-code:            400 0.875rem/1rem "Atlassian Mono", monospace;
```

---

## 10. @atlaskit/tokens — JS Usage

```bash
npm install @atlaskit/tokens
```

```ts
import { token, setGlobalTheme } from '@atlaskit/tokens';

// Use tokens in CSS-in-JS
const buttonStyle = {
  backgroundColor: token('color.background.brand.bold'),   // #0052CC
  color:           token('color.text.inverse'),              // #FFFFFF
  padding:         `${token('space.075')} ${token('space.150')}`,
  font:            token('font.body'),
  borderRadius:    token('border.radius.100'),
};

// Switch theme globally
setGlobalTheme({ colorMode: 'dark' });
setGlobalTheme({ colorMode: 'light' });
```

---

## 11. Theming — Forge / Custom UI

```html
<!-- Enable dark mode in Forge custom UI -->
<html data-color-mode="dark" data-theme="dark:dark light:light">
```

```ts
// Inherit theme from host Jira app (Forge)
import { useThemeObserver } from '@atlaskit/tokens';

const { colorMode } = useThemeObserver();
// colorMode: 'light' | 'dark'
```

Forge UI Kit components inherit ADS tokens automatically. For Custom UI, inject tokens
manually via `@atlaskit/tokens` and the HTML attribute approach above.

---

## 12. Accessibility Rules

- Minimum contrast: **WCAG AA** (4.5:1 text, 3:1 large text)
- Minimum font size: **12 px** (avoid; 14 px preferred for body)
- Comfortable reading minimum: **16 px** for long-form text
- Use **rem units** so text scales with browser zoom
- Use correct **HTML heading hierarchy** (h1 → h2 → h3) for screen readers
- Avoid **ALL CAPS** text except in Lozenge component
- Icon-only buttons must have `aria-label`
- Color must not be the **only** differentiator — pair with shape, text, or pattern

---

## 13. Writing / Voice Principles

- Clear, concise, conversational
- Sentence case everywhere (not Title Case)
- Active voice, present tense
- No jargon; avoid passive constructions
- Numeric digits for numbers (not "three items" → "3 items")

---

## 14. Quick Reference — Common Patterns

### Issue card
```tsx
// Background: --ds-surface-raised
// Border: 1px solid --ds-border
// Padding: space.200 (16px)
// Border-radius: border.radius.200 (8px)
// Title: font.heading.small (14px/600)
// Metadata: font.body (14px/400), color.text.subtle
```

### Sidebar nav item
```tsx
// Height: 32px, border-radius: 4px
// Padding: 0 space.150 (12px)
// Active bg: color.background.selected (#DEEBFF)
// Active text: color.text.selected (#0052CC)
// Hover bg: color.background.neutral.hovered (#EBECF0)
```

### Page header
```tsx
// Title: font.heading.xlarge (24px/600)
// Breadcrumb: font.body (14px/400), color.text.subtle
// Action buttons: right-aligned, Button primary + Button default
```

---

## 15. External Resources

- Design system docs: https://atlassian.design
- All tokens reference: https://atlassian.design/foundations/tokens/all-tokens
- Typography: https://atlassian.design/foundations/typography
- Color: https://atlassian.design/foundations/color
- Spacing: https://atlassian.design/foundations/spacing
- @atlaskit components: https://atlassian.design/components
- Figma library: Atlassian Design System (authenticated users)
