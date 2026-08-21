# CollabAI — Style Guide (Light Premium)

The house style for every CollabAI page. Built on the **Unified ToolHub** design
system (gradient, type scale, radii, motion, mono caps labels), re-based onto a
**light** canvas. Dark mode is not used anywhere in this product.

Reference implementation: `CollabAI Landing.dc.html`. When in doubt, copy from it.

---

## 1. Setup — put this in every page's `<helmet>`

```html
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/tokens/fonts.css">
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/tokens/colors.css">
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/tokens/typography.css">
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/tokens/spacing.css">
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/tokens/effects.css">
<link rel="stylesheet" href="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/styles.css">
<script src="_ds/unified-toolhub-design-system-82960714-f533-4fec-8670-0b4176ab560b/_ds_bundle.js"></script>
<style>
:root{
  --bg:#FAFAFB; --bg-2:#F3F3F7; --panel:#FFFFFF; --panel-2:#F7F7FA; --panel-3:#EDEDF3;
  --border:rgba(18,18,40,.09); --border-2:rgba(18,18,40,.18);
  --text:#111119; --muted:#5B5B6B; --faint:#8B8B99;
  --accent-soft:#6152e8;
  --sh-1:0 1px 2px rgba(18,18,40,.05), 0 8px 24px -16px rgba(18,18,40,.28);
  --sh-2:0 2px 6px rgba(18,18,40,.06), 0 30px 60px -30px rgba(18,18,40,.35);
  --sh-accent:0 10px 30px -14px rgba(124,108,255,.65);
  --selection:rgba(124,108,255,.22);
}
html,body{margin:0;padding:0;background:#FAFAFB;color:#111119;-webkit-font-smoothing:antialiased;}
::selection{background:rgba(124,108,255,.22);}
a{color:#6152e8;text-decoration:none;}
a:hover{color:#a855f7;}
@keyframes om-shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes om-float-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,-30px,0) scale(1.08)}}
@keyframes om-float-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-50px,26px,0) scale(1.12)}}
@keyframes om-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes om-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes om-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes om-pulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
@media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important}}
</style>
```

Overriding the token variables is the whole light-mode strategy: design-system
components (`Button`, `Chip`, `Tag`, `Panel`…) read `var(--panel)`, `var(--text)`
etc., so they turn light automatically. **Never hardcode a hex that a token
covers** — the only literal colors allowed are the gradient stops and status
tints listed below.

---

## 2. Color

| Role | Token | Value |
|---|---|---|
| Page canvas | `--bg` | `#FAFAFB` |
| Inset band / field | `--bg-2` | `#F3F3F7` |
| Card surface | `--panel` | `#FFFFFF` |
| Raised control | `--panel-2` | `#F7F7FA` |
| Track / highest | `--panel-3` | `#EDEDF3` |
| Hairline | `--border` | `rgba(18,18,40,.09)` |
| Hairline hover | `--border-2` | `rgba(18,18,40,.18)` |
| Primary text | `--text` | `#111119` |
| Secondary text | `--muted` | `#5B5B6B` |
| Tertiary / labels | `--faint` | `#8B8B99` |
| Link / accent text | `--accent-soft` | `#6152e8` |

**Signature gradient** — `var(--grad)` = `linear-gradient(100deg,#7c6cff,#a855f7,#22d3ee)`.
The identity. Used on: one headline phrase, primary buttons, icon tiles, active
pills/tabs, progress bars, the scroll-progress bar, 1.5px "glow border" wrappers,
user chat bubbles, ambient orbs. **Never introduce a second gradient family.**
Avatars are the one exception: two-stop slices of the same ramp
(`#7c6cff→#a855f7`, `#a855f7→#22d3ee`, `#22d3ee→#7c6cff`).

**Status colors on light** (darkened from the dark-mode set for contrast):

- success / positive — text `#0f9b6c` on `rgba(52,211,153,.14)`
- danger / restricted — text `#d43d57` on `rgba(251,113,133,.14)`
- warning / running — text `#a06a00` on `rgba(251,191,36,.18)`
- info / active — text `#0b7f96` on `rgba(34,211,238,.16)`
- neutral — text `var(--muted)` on `var(--bg-2)`

Ratio to keep: roughly **90% neutral, 10% gradient**. If a screen has more than
two gradient-filled surfaces above the fold, remove one.

---

## 3. Typography

- **UI:** `var(--font)` (Inter), weights 400 / 500 / 600 / 650 / 700 / 800.
- **Mono:** `var(--mono)` (JetBrains Mono) for labels, file names, timings, code,
  page/section refs, counters, footer legal.

| Use | Size / weight / tracking |
|---|---|
| Hero H1 | 66px · 800 · `-.036em` · `line-height:1.03` |
| Section H2 | 44px · 800 · `-.03em` · `1.1` |
| Sub-section H3 | 34px · 800 · `-.03em` · `1.15` |
| Card title | 19–20px · 700 · `-.02em` |
| Hero sub | 19px · 400 · `1.6` · `--muted` |
| Section sub / body | 16.5–17px · 400 · `1.6–1.65` · `--muted` |
| Card body | 14.5–15px · 400 · `1.6` · `--muted` |
| UI / list text | 13–14px |
| **Mono caps label** | 11px · 700 · `.05–.06em` · uppercase · `--faint` (or `--accent-soft` for section eyebrows) |
| Micro mono | 10–10.5px · 700 · `.05em` |

Rules: sentence case for all headings and buttons. UPPERCASE only for mono caps
labels and status chips. Always digits ("3 users", "4%", "214 pages"). Use
`text-wrap:balance` on headlines, `text-wrap:pretty` on paragraphs. Constrain
prose to ~640px (centered) or ~520px (in a column).

---

## 4. Layout & spacing

- Content width **1180px**, page padding **30px**. Narrow reading sections
  (FAQ, legal, docs) use **880px**.
- Vertical rhythm between major sections: **110–120px** top padding.
  Inside a section: heading → content **40–44px**; zig-zag blocks **110px** apart.
- Two-column zig-zag: `grid-template-columns:1fr 1fr; gap:70px; align-items:center`.
- Bento: `grid-template-columns:repeat(6,1fr); gap:18px`; spans 4+2 then 3+3.
- **Always flex/grid + `gap`.** Never margin-spaced inline siblings.
- Radii: **8** small chips/tags · **10–12** rows, inner tiles, controls ·
  **14** inner panels, FAQ cards, chat bubbles · **18** cards and panels ·
  **24** the big CTA slab · **100px** pills.
- Card padding: 26px (bento), 30px (pricing), 18–22px (inner panels).

---

## 5. Surfaces & depth

- Standard card: `background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:var(--sh-1)`.
- Hover: `transform:translateY(-5px); box-shadow:var(--sh-2); border-color:var(--border-2)` over `.35s cubic-bezier(.2,.7,.2,1)`.
- Inner/inset panel: `background:var(--panel-2); border:1px solid var(--border); border-radius:14px`.
- **Highlight card** (pricing Pro, featured anything): 1.5px `var(--grad)` padding
  wrapper around a `#fff` inner card at `border-radius:17px`, plus
  `box-shadow:0 24px 60px -30px rgba(124,108,255,.75)`.
- **Product mockups** get a browser chrome bar (three dots + mono URL on
  `var(--panel-2)`), an 18px radius, `--sh-2`, and a blurred `var(--grad)` glow
  behind them at `opacity:.26–.34; filter:blur(70px)`.
- Shadows are soft and downward only. No inner bevels, no colored borders except
  the gradient wrapper.

---

## 6. Ambient background

Once per page, in a `position:absolute; inset:0 0 auto 0; height:~1100px; overflow:hidden; pointer-events:none; z-index:0` layer behind the hero:

- 3 blurred orbs (`blur(90px)`): indigo `rgba(124,108,255,.34)`, cyan
  `rgba(34,211,238,.28)`, violet `rgba(168,85,247,.20)`, floating on
  `om-float-a` / `om-float-b` at 18–26s.
- A 52px grid of `rgba(18,18,40,.045)` lines, radially masked
  (`mask-image:radial-gradient(ellipse 80% 60% at 50% 20%,#000,transparent 75%)`).

Content sits at `z-index:1`. No photography, no illustration, no stock art.

---

## 7. Motion

Signature ease everywhere: `cubic-bezier(.2,.7,.2,1)`.

| Effect | Spec |
|---|---|
| Above-the-fold entrance | `om-rise .7–1s both`, stagger `.06s` |
| Scroll reveal | `[data-reveal]` → opacity 0 + `translateY(26px)` → in view via IntersectionObserver (`rootMargin:"0px 0px -12% 0px"`), `.8s` |
| Headline shimmer | gradient text, `background-size:200% auto`, `om-shimmer 6s linear infinite` |
| Scroll progress | 3px `var(--grad)` bar, `position:fixed; top:0; z-index:60` |
| Card hover | lift 5px, `.35s` |
| Button hover | lift 2px, deepen glow (built into DS `Button`) |
| Logo marquee | `om-marquee 26s linear infinite`, edges masked |
| Live/typing dots | `om-pulse 1.2–2.4s`, `.2s` stagger |
| Accordion | `max-height .4s` + `opacity .3s`, chevron `rotate(180deg)` |
| Toggle knob | `.3s` slide, track fills with `var(--grad)` |

Scroll-reveal must not hide content that is already on screen at mount — only
elements below `innerHeight * .92` get the hidden start state.

**Every page carries at least one "living product" moment**: a looping,
JS-driven mockup demo (drop → index → ask → stream → cite) or an interactive
toggle/accordion. Drive it from a single tick counter in state, derive phases
with a `clamp((t-a)/(b-a))` helper, and gate the interval on an
IntersectionObserver so off-screen pages don't animate.

All motion respects `prefers-reduced-motion` via the blanket rule in the helmet.

---

## 8. Components

Use design-system components rather than restyling raw HTML:

```html
<x-import component-from-global-scope="UnifiedToolHubDesignSystem_829607.Button" hint-size="150px,44px">Get started</x-import>
```

- **Button** — `variant`: `primary` (gradient, default CTA) · `secondary`
  (surface, paired CTA) · `ghost` · `danger`. `size`: `md` | `sm` (nav).
  Pass `style="{{ obj }}"` for pill radius or `width:100%`.
- **Chip / Tag / StatTile / Panel / CodeBlock / Terminal / Field / Input /
  Select / StatusChip / Banner** — available from the same namespace.
- Hand-built patterns (keep consistent across pages): announcement pill, mono
  caps eyebrow, bento card, zig-zag block, pricing card, FAQ accordion, footer
  4-column grid, avatar stack, citation card.

**Icon tiles:** Lucide glyph, 2px stroke, white, on a `var(--grad)` tile —
38×38 at radius 11 with `var(--sh-accent)` (cards); 26–30 at radius 8–9 (inline,
brand mark). Inline SVG only — no emoji, no icon fonts. Brand mark is `hexagon`.

**Citation card** (the product's signature object): white, `--border-2`,
radius 12, `--sh-1`; mono caps source line (`FILE.PDF · PAGE 9 · §4.2`), then the
quote in 12.5px `--muted` with a 2px `var(--accent)` left rule.

---

## 9. Voice

Confident, terse, benefit-first — developer-to-developer, no marketing fluff.

- Second person: "your documents", "you keep working while it indexes".
- Sentence case; one idea per line; em-dash asides are welcome.
- The `·` middle dot separates metadata; `→` ends links and CTAs; `✓` marks
  feature list items (green `#0f9b6c`, weight 700).
- Privacy is a running theme — restate it in the hero, the CTA, and the footer.
- Never invent numbers you can't defend. Concrete beats vague:
  "214 pages in 1.8s" over "blazing fast".
- No emoji anywhere in the UI.

---

## 10. Checklist before shipping a page

- [ ] Helmet block above pasted verbatim; no stray hex where a token exists.
- [ ] Exactly one gradient family; ≤2 gradient surfaces above the fold.
- [ ] 1180px container, 30px padding, 110–120px between sections.
- [ ] Mono caps eyebrow on every major section.
- [ ] At least one animated/interactive product moment.
- [ ] `[data-reveal]` on each major block; scroll-progress bar present.
- [ ] Cards: 18px radius, hairline border, `--sh-1`, 5px hover lift.
- [ ] `data-screen-label` on every top-level section.
- [ ] Text ≥13px; body copy `--muted`, not `--text`.
- [ ] Reduced-motion rule present.
