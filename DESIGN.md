---
name: Innkeep
description: "Tinted glass on a pale mineral ground: the visual system of Innkeep's public pages."
colors:
  ground: "#f3f4ef"
  subtle: "#eaece4"
  sunken: "#e1e4da"
  line: "#d9dcd1"
  line-strong: "#bfc4b6"
  ink: "#15171c"
  muted: "#555a61"
  faint: "#868b90"
  panel: "#ffffff"
  glass-coral: "#ff5d73"
  glass-blue: "#3d6df2"
  glass-green: "#10a88f"
  overlap: "#4b2bbd"
  overlap-wash: "#ece6ff"
  block: "#8b8f94"
  ground-dark: "#0d0f13"
  subtle-dark: "#14171c"
  sunken-dark: "#1b1f26"
  line-dark: "#252a32"
  line-strong-dark: "#363c46"
  ink-dark: "#eef0ea"
  muted-dark: "#a3a8ae"
  faint-dark: "#6f757c"
  panel-dark: "#171a20"
  glass-coral-dark: "#ff6f83"
  glass-blue-dark: "#5b84ff"
  glass-green-dark: "#1fc2a6"
  overlap-dark: "#b6a2ff"
  overlap-wash-dark: "#251d44"
  block-dark: "#6f757c"
typography:
  display:
    fontFamily: "Funnel Display, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "6rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Funnel Display, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Funnel Display, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title-sm:
    fontFamily: "Funnel Display, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  term:
    fontFamily: "Funnel Display, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: '"ss01", "cv11"'
  prose:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 2.15
rounded:
  key: "4px"
  slab: "12px"
  card: "16px"
  panel: "28px"
  field: "40px"
  pill: "999px"
  arch: "999px 999px 2rem 2rem"
  tile: "22%"
spacing:
  gutter: "20px"
  gutter-wide: "32px"
  card-pad: "20px"
  card-pad-wide: "28px"
  field-pad: "48px"
  feature-gap: "96px"
  feature-gap-wide: "144px"
  section: "144px"
  section-wide: "192px"
  container: "72rem"
  measure: "48rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, #15171c 86%, #4b2bbd)"
  button-primary-lg:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 16px"
  button-secondary-lg:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  nav-bar:
    backgroundColor: "color-mix(in oklab, #f3f4ef 72%, transparent)"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0 8px 0 20px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  panel-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "28px"
  field:
    backgroundColor: "color-mix(in oklab, #10a88f 16%, #f3f4ef)"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "48px"
  booking-slab:
    backgroundColor: "color-mix(in oklab, #ff5d73 56%, #ffffff)"
    textColor: "{colors.ink}"
    typography: "{typography.micro}"
    rounded: "{rounded.slab}"
    padding: "0 12px"
  clash-chip:
    backgroundColor: "{colors.overlap-wash}"
    textColor: "{colors.overlap}"
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Innkeep

This file records the one world of Innkeep: the public pages (landing, guides, alternatives), the
dashboard in `web/`, the Chrome extension and the two-arch mark. How the dashboard uses it is in the
note at the end of the Overview.

## Overview

**Creative North Star: "The Glass Calendar"**

Every booking is a slab of tinted glass, and where two slabs overlap the colour deepens to violet. The
double booking is visible before any text explains it, and the whole system is built outward from that one
picture: the mark is two overlapping arches, the page furniture is large glass arches, pills and rounded
tiles, and the product itself is shown on white panels that float over a field of a single glass colour.

The ground is a pale mineral grey-green with near-black ink. Pages are light, airy and centred, with long
vertical pauses between sections. Glass is decorative and sits behind content; the white panel is where
reading happens. The system has two registers: a persuading register (glass, fields, panels, motion) and a
reading register (ground, ink and hairlines only, used for limits, guides and comparisons).

Dark mode is its own set of values, not an inversion: the ground goes near-black, the glass colours
brighten, the overlap becomes a light violet, and glass stops multiplying with what is beneath it.

### The dashboard

The dashboard in `web/` stands in the same world, in its working register. The tokens in
`web/src/tokens.stylex.ts` are the brand's: the mineral ground, white panels (`panel`) that float over it
on a low `card` shadow, the three source colours as glass, and violet (`clash`) wherever two stays share
a night. It differs from the public pages in four ways:

- **Glass is data, not decoration.** A slab of glass is always a booking (`web/src/ui/slab.tsx`); the
  only decorative glass is on the sign-in door and the first-run welcome.
- **States keep their own colours.** Good, warning and critical stay green, amber and red, because a
  working tool has errors to show; violet is kept for a clash, focus and selection. The public pages
  have no error state, so `critical` is violet there.
- **The display face is for a page's title and its one figure.** Labels, buttons, tables and data are
  Geist. Controls are pills; fields have a 10px radius.
- **Each page has one signature, drawn from its own data:** the next fourteen nights on the overview,
  glass slabs on the calendar, a ledger with date stubs for reservations, the turnover window for
  cleaning, glass bars for revenue, the gap between the two platforms for pricing, a doorway for each
  property, and the reading register (ground, ink, hairlines) for settings.

The older Next.js dashboard under `src/app/(app)` keeps the monochrome tokens of `src/app/globals.css`
until the Vite app replaces it.

**Key Characteristics:**

- Tinted glass shapes with grain, an inner highlight and a coloured cast shadow.
- Three glass colours with fixed meaning; violet appears where two meet.
- White product panels floating over a field of one glass colour.
- Display type at regular weight, large and tightly tracked; never bold.
- Pills for every control; no square buttons.
- Slow, settling motion: glass drifts on scroll, nothing bounces.

## Colors

A pale mineral ground and near-black ink, with three saturated glass colours and one deep violet that
exists only because two of them overlap.

### Primary

- **Overlap Violet** (`overlap`, light violet `overlap-dark` in dark mode): the colour of a clash. It marks
  the overlapping nights in the calendar, the double-booking chip and urgent badge (on `overlap-wash`), the
  focus ring, text selection, the caret, numbered-list markers in guides, and the intersection of the mark.
  It also tints two fields (suggestions, closing section) at field strength. It is never a button colour.

### Secondary

- **Glass Coral** (`glass-coral`): Airbnb. Booking slabs, source dots, the left arch of the mark.
- **Glass Blue** (`glass-blue`): Booking.com. Booking slabs, source dots, the right arch of the mark.
- **Glass Green** (`glass-green`): a direct booking. Booking slabs, source dots.

### Neutral

- **Mineral Ground** (`ground`): the page background of every public page.
- **Subtle / Sunken** (`subtle`, `sunken`): inset areas inside a panel (the prompt block, key caps) and
  empty progress tracks.
- **Hairline / Strong Hairline** (`line`, `line-strong`): 1px dividers, calendar grid lines, the ring of
  the secondary button; `line-strong` is the resting colour of link underlines.
- **Ink** (`ink`): all headings and body text on reading surfaces, and the primary button.
- **Muted** (`muted`): supporting paragraphs, captions, navigation links at rest.
- **Faint** (`faint`): the terminal prompt sign and separators. It measures about 3:1 on the ground, so it
  is not a colour for sentences.
- **Panel White** (`panel`): the surface product material sits on, and the secondary button.
- **Block Grey** (`block`): a blocked period in the calendar, drawn hatched.

### Named Rules

**The Fixed Meaning Rule.** Coral is Airbnb, blue is Booking.com, green is a direct booking, on every
surface and in the dashboard too. A glass colour is never chosen for variety when it sits next to product
data.

**The Earned Violet Rule.** Violet is what two colours make together. Use it for a clash, for focus and
selection, and as a field tint; never for a call to action. The primary action is ink.

**The Drawn Overlap Rule.** In light mode glass multiplies with what is under it; in dark mode it does not.
The overlapping nights in the calendar are therefore drawn as their own violet block in both modes, never
left to the blend.

**The Field Text Rule.** Paragraphs set directly on a field use ink mixed with the field's own colour
(`color-mix(in oklab, ink 72%, field colour)`), which holds above 8:1; headings stay pure ink.

## Typography

**Display Font:** Funnel Display (with Geist, ui-sans-serif, system-ui, sans-serif)
**Body Font:** Geist (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace), for terminal commands only

**Character:** A wide, soft-cornered display face set large at regular weight against a neutral,
precise text face. Hierarchy comes from size and tracking, not from weight.

### Hierarchy

- **Display** (400, 96px from 640px up and 48px below, line-height 1, -0.035em): the landing headline
  only, centred, at most about 16 characters per line.
- **Headline** (400, 60px / 36px, line-height 1.04, -0.03em): section headings and the page title of
  guides and comparisons.
- **Title** (400, 36px / 30px, line-height 1.08, -0.025em): the heading of a feature row and of a
  call-to-action field.
- **Small title** (400, 24px, up to 30px in guides, -0.02em): headings inside a panel, guide section
  headings, the caption of a demo scene, a headline figure.
- **Term** (400, 20px, -0.01em): the term of a definition pair in the trust and limits lists.
- **Lead** (400, 20px / 18px, line-height 1.625, muted): the paragraph under a headline, 46 to 66
  characters wide.
- **Body** (400, 15px, line-height 1.625): supporting copy and definitions, at most 62 to 68 characters.
- **Prose** (400, 17px, line-height 1.7, ink): long-form guide paragraphs and steps, at most 68 characters.
- **Label** (500, 13px): navigation, small buttons, panel headers, footer.
- **Micro** (500, 12px, 11px for day numbers and badges): slab labels, chips, key caps. Figures use
  tabular numerals.
- **Mono** (400, 13px, line-height 28px): the three install commands.

### Named Rules

**The Regular Weight Rule.** Funnel Display is always set at 400. The one exception is the wordmark beside
the mark, which is 500 at 19px. Emphasis in running text is Geist 500, never bold display.

**The Balanced Break Rule.** Headings use `text-wrap: balance` and lead paragraphs `text-wrap: pretty`,
each with a character-width cap, so lines break by sense at every width.

## Layout

One centred column, 72rem at most, with 20px gutters below 640px and 32px above. Reading pages narrow to
48rem (a guide) or 56rem (the guide list). Sections are separated by 144px on small screens and 192px
from 640px; feature rows within a section by 96px and 144px.

The persuading register alternates three arrangements: a centred heading block (heading, lead, pills); a
two-column row of text beside a field (1fr to 1.25fr, stacked below 768px, text first); and a full-width
field holding a heading and one panel. Each field holds exactly one white card and each card shows one
thing: one list, one sum, one exchange.

The first viewport is centred: mark, display headline, one lead paragraph, two pills, then the demo panel
rising from the fold. Glass arches sit at the left and right edges on separate depth planes and are
clipped horizontally by the page.

The reading register has no glass: a heading column beside a hairline-divided definition list, or a single
prose column. A guide ends with one field as its call to action.

Below 768px the header keeps the wordmark, the GitHub link and the primary pill; section links are
dropped, not collapsed into a menu. Decorative glass shrinks or is hidden inside narrow fields.

## Elevation & Depth

Depth is real and layered: glass shapes behind, a tinted field, a white panel floating above it. Shadows
are soft, long and either coloured by the glass that casts them or a diffuse ink ambient under a panel.
There are no hard or offset shadows and no borders used as shadows.

### Shadow Vocabulary

- **Panel float**: every white panel. An inset white top edge, a long ink ambient
  (`0 40px 80px -40px rgb(21 23 28 / 0.28)`), a closer one (`0 12px 28px -18px rgb(21 23 28 / 0.18)`) and
  a 5% ink ring. In dark mode the ambient deepens to `0 40px 80px -40px rgb(0 0 0 / 0.8)` with a 7% white
  ring.
- **Glass cast** (`0 56px 90px -44px` in the shape's own colour at 75%, with an inset top highlight, a
  1.5px inner rim and an inset shade at the foot): every decorative glass shape.
- **Slab cast** (`0 12px 20px -12px` in the slab's colour, with a 1.5px inset top highlight and 1px inner
  rim): a booking slab in the calendar.
- **Pill lift** (`0 0 0 1px line, 0 8px 20px -14px rgb(0 0 0 / 0.4)`): the secondary button; the ring
  moves to `line-strong` on hover.
- **Hairline ring** (`0 0 0 1px` ink at 7%): the floating header bar, over a 72% ground tint with a 24px
  backdrop blur.

### Named Rules

**The Three Planes Rule.** Glass further away moves less. Decorative shapes drift upward on scroll at
plane-specific distances (120px, 160px and 200px over the first 120vh in the hero; 36px inside a field),
linearly, tied to scroll position. A far echo shape is blurred 2px at half opacity.

**The Settle Rule.** Things arrive by settling: 28px of rise, a 10px blur clearing, 0.9s on
`cubic-bezier(0.16, 1, 0.3, 1)`, staggered 80ms apart. Controls respond in 200ms. Nothing bounces or
overshoots. With reduced motion nothing drifts or plays, and the demo rests on the scene that shows the
clash.

**The Material Rule.** Glass always carries grain (a soft-light noise layer) and a top highlight, so the
colour reads as a material and not as a gradient.

## Shapes

Three silhouettes, all soft: the arch (a doorway, fully round at the top, 2rem corners at the foot), the
pill, and the rounded tile (22% corners). The arch is the mark's own shape and the most used. Decorative
shapes are large, rotated between 3 and 32 degrees, and always cropped by their container or the page
edge; they are never shown whole and upright.

Containers step down in radius as they nest: a full-width field is 40px, a panel or a feature field 28px,
a card inside a field 16px, a booking slab 12px. Every control is a full pill. Dividers are 1px hairlines;
panels have no visible border, only the float shadow.

The mark is two arches, each 11 units wide in a 24-unit box, the right one offset by 8 so they share a
3-unit strip. In colour it is coral, blue and violet where they meet. In ink it is two arches at half
opacity with the shared strip at full strength, so the overlap still reads darker.

## Components

### Buttons

Calm, solid pills; the page has two weights and no more.

- **Shape:** full pill (999px), 36px tall with 16px side padding and 13px medium text, or 48px with 24px
  and 15px.
- **Primary:** ink fill with white text (near-black text on a pale fill in dark mode). One per group,
  placed first.
- **Secondary:** panel white, ink text, hairline ring with the pill-lift shadow.
- **Hover / Focus:** primary warms 14% toward violet; secondary's ring darkens. Pressing scales to 0.97.
  Transitions take 200ms. Focus is a 2px violet outline offset by 2px.
- **Round control:** a 36px ink circle with a filled play or pause icon, for the demo.

### Chips

- **Clash chip:** violet text on `overlap-wash`, pill, 12px medium, 4px by 10px padding.
- **State badge:** 20px tall pill, 11px medium. Urgent is violet on `overlap-wash`; other states keep the
  dashboard's state colours, since a badge is product material.
- **Source dot:** a 10px circle in the source's glass colour, always beside the written name.
- **Key cap:** 18px, 4px radius, `subtle` fill with a `line-strong` border.

### Cards / Containers

- **Panel:** white, float shadow, no border. 28px radius as a standalone frame (the demo, the install
  request), 16px as a card inside a field, with 20px padding below 640px and 28px above.
- **Field:** the ground mixed with 16% of one glass colour, rising to 30% in a soft glow from the top
  right. It clips one or two glass shapes placed behind its content and holds one white card.
- **Definition list:** terms in display type with a muted definition, separated by hairlines, closed by a
  hairline above and below. On the ground it has no container; inside a field it sits on one panel.
- **Code block:** a 16px panel in Geist Mono with a faint prompt sign.

### Navigation

A floating pill-shaped bar, 56px tall, 12px from the top of the viewport, translucent ground with
backdrop blur and a hairline ring. Wordmark left; 13px muted links that turn ink on hover; one small
primary pill at the right. The footer is a single wrapped row at 13px muted: wordmark, disclaimer, links,
language and theme switches.

Text links in content are ink with a `line-strong` underline offset 4px; the underline turns ink on hover.

### Demo Film

The signature component: one 28px panel that plays the product in code. A header row (month, clash chip),
a 14-day calendar with two rows of booking slabs, a reading area (a small display title and caption
beside one card of detail), and a control row (round play button, one progress segment per scene, a note
that the data is an example).

Booking slabs are the glass of the calendar: the source colour mixed 56% into the panel, 12px radius,
grain, top highlight, coloured cast, with an ink label. A blocked period is grey and hatched. A late
booking slides in from the right and the shared nights turn violet as the chip appears. Scenes last 5.2
seconds; choosing a scene pauses the film.

## Do's and Don'ts

### Do:

- **Do** keep coral for Airbnb, blue for Booking.com and green for direct bookings wherever product data
  appears.
- **Do** put product material on a white panel, and float that panel over a field of one glass colour.
- **Do** give each panel one reading.
- **Do** set Funnel Display at 400 and let size carry the hierarchy.
- **Do** crop and rotate decorative glass, keep it behind content, and mark it `aria-hidden`.
- **Do** use ink for the primary action and a white pill for the second.
- **Do** drop to the reading register (ground, ink, hairlines) when the content is limits, steps or
  comparisons.
- **Do** write the source's name beside its colour; colour never carries the meaning alone.
- **Do** give dark mode its own values through the same token names.

### Don't:

- **Don't** use violet for a button or a link; it marks a clash, focus and selection.
- **Don't** set display type in bold, or in capitals.
- **Don't** put text on a decorative glass shape; only booking slabs carry labels.
- **Don't** use flat colour blocks or plain gradients where glass is meant; glass has grain, a highlight
  and a cast shadow.
- **Don't** add hard, offset or grey drop shadows; shadows are long, soft and coloured or ambient.
- **Don't** use `faint` for sentences, or `muted` for a label on a booking slab.
- **Don't** rely on the blend mode to show an overlap; draw it.
- **Don't** add motion that bounces, loops for decoration, or ignores the reduced-motion preference.
- **Don't** use glass as decoration in the dashboard, or bordered cards anywhere; a card is a white
  panel on a soft shadow.
- **Don't** show a double booking in red; it is violet. Red is for errors and for actions that destroy.
