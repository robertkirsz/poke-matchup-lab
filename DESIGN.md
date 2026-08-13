---
name: Poké Matchup Lab
description: A compact professor's field archive for instant Pokémon type matchups.
colors:
  pokedex-red: "#d93636"
  pokedex-red-deep: "#9f2029"
  archive-yellow: "#f6cf33"
  scanner-blue: "#3b82c4"
  control-blue-deep: "#1e4f7b"
  scan-glass: "#dbeae3"
  specimen-paper: "#fffaf0"
  tray-cream: "#f5edda"
  carbon-ink: "#17212b"
  pure-white: "#ffffff"
  header-red: "#df3d3d"
  focus-blue: "#1b65a0"
  status-green: "#2c8f67"
  text-primary-muted: "#4c5660"
  text-secondary: "#59636d"
  text-specimen: "#425d57"
  tray-danger: "#ffe3df"
  tray-safe: "#e3f1e6"
  tray-immune: "#e9e5ef"
  brand-ring: "#23303b"
  red-on-dark: "#ffe9e9"
  light-cyan: "#62d8ff"
  light-yellow: "#f4d63d"
  light-green: "#68d27b"
  text-placeholder: "#707983"
  text-hint: "#626c76"
  text-status: "#28524c"
  text-archive: "#506862"
  text-tray: "#4e5963"
  text-details: "#46505a"
  text-state: "#5b6670"
  type-dark-text: "#1d282f"
  divider-cream: "#e2d9c6"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.3rem, 5vw, 4.9rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.55
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(1.75rem, 3.4vw, 2.7rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.03rem"
    fontWeight: 700
    lineHeight: 1.2
  brand:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(1.15rem, 2vw, 1.55rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.035em"
  specimen-title:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(1.55rem, 3vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  body-small:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.5
  control-label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 800
    lineHeight: 1
  compact-label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.67rem"
    fontWeight: 850
    lineHeight: 1
  micro-label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.64rem"
    fontWeight: 850
    lineHeight: 1
  suggestion-title:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 800
    lineHeight: 1.2
  metric:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 850
    lineHeight: 1
  state-title:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 700
    lineHeight: 1
  alert-mark:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 900
    lineHeight: 1
  display-tablet:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.5rem, 11vw, 4.8rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  display-mobile:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.45rem, 14vw, 3.7rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 850
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  control: "10px"
  tray: "14px"
  panel: "16px"
  device: "26px"
  capsule: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "30px"
  xl: "48px"
components:
  scan-button:
    backgroundColor: "{colors.control-blue-deep}"
    textColor: "{colors.specimen-paper}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "50px"
  search-field:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.tray}"
    padding: "6px"
    height: "68px"
  type-capsule:
    textColor: "{colors.pure-white}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "5px 8px 5px 10px"
---

# Design System: Poké Matchup Lab

## Overview

**Creative North Star: "The Professor's Field Archive"**

The interface behaves like one compact piece of field equipment: a red outer shell contains a forgiving scanner, a cool specimen display, and a cream matchup report. Its personality comes from useful physical metaphors—labels, trays, indicator lights, and type capsules—while the information hierarchy remains that of a fast reference tool.

The system is playful but controlled. Large, compressed headlines create energy; dense labels and clearly separated trays make the answer scannable. The official Pokémon logo is not used, and live PokéAPI artwork provides the recognizable subject matter.

**Key Characteristics:**

- Pokédex-red device shell around warm paper and cool scan-glass surfaces.
- One dominant task per surface: identify a Pokémon, then read its matchup.
- Tactile seams and labels without decorative dashboard chrome.
- Type colors are semantic data, never arbitrary accents.

## Colors

The core palette uses committed red and yellow around calm paper and scan-glass surfaces, with deep navy for legible controls and structural ink.

### Primary

- **Pokédex Red** (`#d93636`): Outer device shell and strongest franchise-adjacent cue.
- **Pokédex Red Deep** (`#9f2029`): Structural seam, error state, and grounded red depth.

### Secondary

- **Archive Yellow** (`#f6cf33`): Page-scale background and energetic field-guide context.
- **Control Blue Deep** (`#1e4f7b`): Primary action and selected suggestion state.

### Neutral

- **Specimen Paper** (`#fffaf0`): Primary content surface.
- **Tray Cream** (`#f5edda`): Default report tray.
- **Scan Glass** (`#dbeae3`): Pokémon artwork stage and scanner state.
- **Carbon Ink** (`#17212b`): Headlines, outlines, and high-priority copy.

Functional colors cover focus, status, muted copy, and the three report outcomes. Tiny cyan, yellow, and green device lamps remain equipment indicators rather than general accents.

**The Semantic Type Rule.** The eighteen Pokémon type colors belong only to type capsules and the data they identify; they do not become general UI accents.

## Typography

**Display Font:** Geist (with sans-serif fallback)  
**Body Font:** Geist (with sans-serif fallback)  
**Label Font:** Geist in heavy uppercase settings

**Character:** One modern workhorse face shifts character through weight, compression, and scale. Display text feels compact and energetic; labels feel like equipment markings.

### Hierarchy

- **Display** (900, `clamp(2.3rem, 5vw, 4.9rem)`, 0.9): The single task-defining headline.
- **Headline** (700–900, `clamp(1.75rem, 3.4vw, 2.7rem)`): Report and specimen names.
- **Body** (400, `0.88rem`–`0.98rem`, 1.5–1.55): Explanations and recovery guidance, kept under roughly 47 characters where possible.
- **Label** (800–900, `0.67rem`–`0.78rem`, 0.08em–0.11em): Archive identifiers, device status, and action labels.
- **Micro Label** (800–900, `0.64rem`): Multiplier counters only; never body copy.

**The One Big Voice Rule.** Only the primary task headline reaches display scale; report headings and data labels step down decisively.

## Layout

The device is centered in a `1120px` maximum container. Its body uses an asymmetric two-column grid: the scanner and specimen occupy the narrower left deck, while the complete attack report occupies the wider right deck. Internal spacing follows a loose 6/12/18/30/48 scale.

At `820px`, the decks stack into one column while preserving their order. At `520px`, the device becomes edge-to-edge, headings compress, specimen metadata stacks, and report trays move from label-plus-data rows to a single column. Touch targets remain at least 50px high.

## Elevation & Depth

Depth is structural and limited. The complete device receives one broad ambient lift plus a red lower seam; dropdown suggestions receive a smaller temporary lift. Inside the device, hierarchy comes from color fields, borders, and inset scan-glass shading rather than a shadow on every panel.

### Shadow Vocabulary

- **Device Lift** (`0 22px 50px rgba(92, 42, 18, 0.28), 0 7px 0 #9f2029`): Only the outer desktop device.
- **Suggestion Lift** (`0 12px 24px rgba(23, 33, 43, 0.18)`): Only the open fuzzy-search menu.
- **Scan Inset** (`inset 0 0 34px rgba(32, 84, 77, 0.12)`): The artwork stage's glass depth.

**The Contained Depth Rule.** Shadow establishes the complete device or a temporary overlay; content trays stay flat.

## Shapes

The silhouette moves from a 26px device radius to 16px content panels, 14px report trays and search containers, and 10px controls. Pills are reserved for compact type capsules and their multiplier counters. Circles identify the Pokéball geometry, device lights, and scanner states.

## Components

### Buttons

- **Shape:** Compact rectangle with a 10px radius and 50px minimum height.
- **Primary:** Deep scanner blue, white heavy label, 16px horizontal padding.
- **Hover / Focus:** Darker blue on hover; a 3px blue focus outline with 3px offset. Disabled controls fade to 52% and use a blocked cursor.

### Chips

- **Style:** Each type capsule uses its canonical type color, a short heavy label, and an optional dark inset multiplier counter.
- **State:** Capsules are informational rather than interactive. Text switches between dark and light according to contrast needs.

### Cards / Containers

- **Corner Style:** 16px for decks and specimen panels; 14px for report trays.
- **Background:** Warm paper for decks, scan glass for artwork, and lightly tinted trays for weakness, resistance, and immunity groups.
- **Shadow Strategy:** Flat inside the device; use borders and tonal surfaces.
- **Internal Padding:** 16–32px depending on hierarchy and viewport.

### Inputs / Fields

- **Style:** White field inside a 3px carbon outline and 14px outer radius.
- **Focus:** A 4px translucent blue outer ring with a 2px offset.
- **Error / Disabled:** Recovery copy stays adjacent to the scanner; the submit button visibly disables when the query is empty.

### Matchup Tray

Each tray pairs a short verdict and explanation with wrapping type capsules. Weakness uses pale red, resistance pale green, and immunity pale violet. The strongest multipliers sort first.

### Evolution Archive

The specimen label extends directly into a compact evolution archive, without a visible section heading. Every family sits in one horizontal, scroll-safe row of small tactile buttons. Each button carries its stage number in the top-left plus its sprite, name, and archive number; the current specimen uses the deep scanner-blue selected state.

## Do's and Don'ts

### Do:

- **Do** treat type color as data and preserve each capsule's readable text contrast.
- **Do** keep the search-to-answer path visible within one surface.
- **Do** let live Pokémon artwork sit on the cool scan-glass stage.
- **Do** preserve clear `4×`, `2×`, `0.5×`, `0.25×`, and `0×` multipliers.
- **Do** keep every evolution branch reachable from the specimen archive.

### Don't:

- **Don't** use the official Pokémon logo or present the utility as official.
- **Don't** distribute type colors into unrelated controls or decoration.
- **Don't** add generic dashboard cards, metrics, navigation chrome, or extra routes around the core lookup.
- **Don't** give every inner surface a shadow; the physical hierarchy depends on restraint.
