# DESIGN.md — PageWise AI Design System Specification

**Brand:** PageWise AI  
**Archetype:** Swiss Precision Editorial Workstation  
**Philosophy:** 80% Proven Ergonomic Patterns, 20% Distinctive Craft. Zero AI Slop.

---

## 1. Brand Identity & Philosophy

PageWise AI is an enterprise document intelligence and verification platform used by analysts, researchers, legal counsels, and engineers. The visual identity rejects decorative AI clichés (rainbow gradients, fuzzy glowing orbs, emoji badges, marketing filler) in favor of high-craft typographic discipline, mathematical precision, and calm editorial authority.

* **Personality:** Authoritative, calm, exact, forensic, minimal.
* **Core Signal:** Upload → Parse → Retrieve → Verify with Page-Level Coordinates.

---

## 2. Color System & Semantic Tokens

Strict 80/15/5 distribution rule: 80% neutrals, 15% structural surfaces, 5% single accent + verification semantic state.

```css
:root {
  /* Canvas & Surfaces */
  --bg: #f9fafb;
  --surface: #ffffff;
  --surface-subtle: #f4f5f7;
  --surface-raised: #ffffff;
  --surface-border: #e2e8f0;
  --surface-border-subtle: #edf2f7;

  /* Typography / Inks */
  --fg: #090a0f;
  --fg-secondary: #475569;
  --fg-muted: #64748b;
  --fg-faint: #94a3b8;

  /* Single Accent — Precision Cobalt (Strictly max 2 prominent focal points per screen) */
  --accent: #0052cc;
  --accent-hover: #0040a8;
  --accent-subtle: #edf5ff;
  --accent-border: #b3d4ff;

  /* Semantic Verification & Ground Truth */
  --grounded-fg: #047857;
  --grounded-bg: #ecfdf5;
  --grounded-border: #a7f3d0;
  --warning-fg: #b45309;
  --warning-bg: #fffbeb;
  --danger-fg: #b91c1c;
  --danger-bg: #fef2f2;
}
```

---

## 3. Typography Craft Discipline

* **Primary Body & Display:** `Geist`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
* **Technical Metadata & Citations:** `JetBrains Mono`, `ui-monospace`, `monospace`.

| Token | Size | Weight | Tracking | Line-Height | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | 36px–40px | 600 (Announce) | `-0.025em` | 1.15 | Hero Statement (Solid ink, NO gradients) |
| **H2 / Section** | 20px–22px | 600 (Announce) | `-0.015em` | 1.25 | Primary Section Headings |
| **H3 / Card Title** | 14px–15px | 600 (Announce) | `-0.01em` | 1.35 | Tool & Module Headings |
| **Body** | 13.5px–14px | 400 (Read) | `0` | 1.6 | Narrative & Synthesis Copy (`max-w-[65ch]`) |
| **Micro / Caption** | 12px–12.5px | 400–500 | `0.01em` | 1.45 | Secondary Descriptions |
| **ALL CAPS Labels** | 10px–11px | 500 (Emphasize) | `0.08em` | 1.2 | Metadata categories (Strict positive tracking) |
| **Code / Coordinates** | 11px–12px | 500 (Emphasize) | `0` | 1.3 | Page numbers, Latency, Token counts |

---

## 4. Anti-AI-Slop Directives (Mandatory Quality Gates)

1. **NO Two-Stop Gradients:** Do not use purple→blue, indigo→pink, or blue→indigo gradient hero text or background blobs.
2. **NO Emoji Icons:** Never use ✨, 🚀, 🎯, ⚡, 🔥, 💡 in headers, buttons, or badges. Use clean, 1.5–1.75px stroke Lucide SVGs with `currentColor`.
3. **NO Excessive Glassmorphism / Glows:** Avoid gratuitous `blur-3xl` gradient spheres. Use structured flat surfaces with hairline borders (`#e2e8f0`).
4. **NO Untracked Uppercase:** Every uppercase label MUST have positive letter spacing (`letter-spacing: 0.08em`).
5. **NO Marketing Hyperbole:** Ground all microcopy in technical realities (PyMuPDF parser, sentence-boundary chunking, Gemini 1536d vectors, BM25 token frequencies, Reciprocal Rank Fusion).
