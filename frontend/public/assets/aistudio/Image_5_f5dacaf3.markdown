---
name: Precision Editorial Workstation
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053d9'
  primary: '#0051d3'
  on-primary: '#ffffff'
  primary-container: '#2f6bf2'
  on-primary-container: '#fefbff'
  inverse-primary: '#b3c5ff'
  secondary: '#5e5e61'
  on-secondary: '#ffffff'
  secondary-container: '#e0dfe2'
  on-secondary-container: '#626265'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f4fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#00174a'
  on-primary-fixed-variant: '#003ea6'
  secondary-fixed: '#e3e2e4'
  secondary-fixed-dim: '#c7c6c9'
  on-secondary-fixed: '#1b1c1e'
  on-secondary-fixed-variant: '#464749'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  canvas-base: '#FFFFFF'
  surface-subtle: '#F5F6F8'
  surface-border: '#E5E7EB'
  surface-border-subtle: '#EEF0F2'
  ink-primary: '#030712'
  ink-secondary: '#4B5563'
  ink-muted: '#9CA3AF'
  status-online: '#10B981'
  brand-accent-glow: rgba(47, 107, 242, 0.08)
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system channels the refined, high-density clarity of developer-grade creative curation platforms, elevated for an enterprise document intelligence workstation. The aesthetic pairs purposeful minimalism with tactile precision: high-contrast ink-black typography against crisp cool-gray backgrounds, microscopic hairline borders, and sharp utility badges.

Key design principles:
- **Direct & Unadorned Clarity:** Eliminates ornamental gradients, heavy blurs, and skeuomorphic fluff in favor of sharp typographic balance and data density.
- **Micro-Structured Organization:** High visual order utilizing clean cards, pill badges, subtle active states, and discrete section dividers.
- **Productive Intensity:** Tuned for analytical immersion where users review high-fidelity document extractions, OCR models, annotations, and structured records without interface fatigue.

## Colors

The palette establishes an ultra-clean contrast architecture:
- **Primary (`#2F6BF2`):** A vibrant cobalt blue reserved strictly for actionable states, primary calls-to-action, bounding-box highlights, active navigation nodes, and focused selections.
- **Secondary (`#0F1012` & `#030712`):** Obsidian black utilized for solid authority actions, header micro-buttons, primary typography, and dark thematic blocks (such as the persistent bottom utility drawer or system status docks).
- **Tertiary (`#10B981`):** A sharp emerald indicator for automated validation status, parsing health, and live multi-agent sync indicators.
- **Neutral (`#F5F6F8`):** Crisp cool canvas tint providing soft definition against stark `#FFFFFF` document card containers and toolbar planes.

Hairline boundary rules use `#E5E7EB` to segment modular panes without visual heaviness.

## Typography

Typography prioritizes geometric precision and mechanical rhythm. `Geist` provides neutral, high-legibility readability across standard UI layers, while `JetBrains Mono` handles metadata tags, categorization pills, extraction confidence percentages, and document coordinate coordinates.

All category badges and status tags render in uppercase with positive letter spacing (`0.04em` to `0.06em`) for instant scanning across dense tables and document grids.

## Layout & Spacing

The workspace uses a dense, three-tier responsive layout model:
- **Left Navigation Rail (Fixed width: 220px on desktop):** Collapsible sidebar carrying categorized extraction feeds, presets, and filters.
- **Main Document Grid (Fluid):** Multi-column responsive layout scaling dynamically from 1 column on mobile, 2 columns on tablet, to 3–4 columns on widescreen displays.
- **Global Inset & Margins:** Clean `1.5rem` (`24px`) screen boundary with tight `1rem` (`16px`) gutters to maximize visible document space.
- **Micro Rhythms:** Internal card padding sticks tightly to `0.75rem` (`12px`) to `1rem` (`16px`) increments to maintain high visual compact density.

## Elevation & Depth

Visual hierarchy avoids heavy drop shadows, instead using crisp outlines and surface layering:
- **Base Surface:** Canvas background sits on `#F5F6F8` or pure `#FFFFFF`.
- **Containers & Cards:** Elevated via clean `1px solid #E5E7EB` borders. Hover states trigger an ink-black boundary tint (`#0F1012`) and a hairline shadow: `0 2px 4px rgba(0, 0, 0, 0.04)`.
- **Floating Modals & Inspection Popovers:** Rendered with double-layered ultra-soft ambient occlusion: `0 12px 32px -4px rgba(3, 7, 18, 0.08), 0 2px 6px rgba(3, 7, 18, 0.03)` with a hairline boundary of `rgba(3, 7, 18, 0.08)`.
- **Status Overlay Dock:** High-contrast inverse dark surfaces (`#0F1012`) floating above bottom margins with subtle backdrop shielding.

## Shapes

The design system maintains balanced corner curvatures:
- **Cards, Preview Frames, and Code Windows:** `0.5rem` (`8px`) to `0.75rem` (`12px`) corner radius to create disciplined geometric frames.
- **Interactive Buttons & Form Inputs:** Crisp `0.5rem` (`8px`) for standard controls; pill shape (`9999px`) reserved specifically for micro-badges, filter pills, counter tags, and status indicators.
- **Preview Canvases:** Embedded document previews carry an inner inset radius matching `0.375rem` (`6px`) within outer containers.

## Components

- **Document Extraction Cards:** 
  White rectangular cards with hairline border (`#E5E7EB`). The top section holds the visual document preview or bounding region. The footer row contains a category label in JetBrains Mono (`label-sm`), author/source avatar with text, and a favorite/inspect action trigger.
- **Action Buttons:**
  - *Primary:* Solid Obsidian (`#0F1012`) or Cobalt (`#2F6BF2`) with high-contrast white text, `8px` radius, padding `0.5rem 1rem`.
  - *Secondary / Ghost:* Transparent background, `1px solid #E5E7EB` border, text `#030712`, transitioning to `#F5F6F8` on hover.
  - *Quick Pill Buttons:* Fully rounded pills with subtle grey background and mono labels.
- **Filter Chips & Badges:**
  Micro-badges using `JetBrains Mono` uppercase text (`10px`). Border-radius set to full pill (`9999px`). Active chips receive black fill with white text; inactive chips feature light gray outline with subtle neutral text.
- **Search & Filter Inputs:**
  Low-profile input field (`36px` height) with embedded search glyph, hairline border, placeholder in `#9CA3AF`, and zero shadow. Focused state shifts border to `#2F6BF2` with a `2px` focus ring tinted in `rgba(47, 107, 242, 0.15)`.
- **Dark Bottom Directory Bar / Utility Tray:**
  High-contrast inverted dark container (`#0F1012`) featuring multi-column resource listings, verified system badges, and secondary action cards.