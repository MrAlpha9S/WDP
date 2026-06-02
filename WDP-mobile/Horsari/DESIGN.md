---
name: High-Stakes Racing
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e0bfbc'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a78a87'
  outline-variant: '#58413f'
  surface-tint: '#ffb3ad'
  primary: '#ffb3ad'
  on-primary: '#680009'
  primary-container: '#982121'
  on-primary-container: '#ffaca5'
  inverse-primary: '#ad312e'
  secondary: '#e9c176'
  on-secondary: '#412d00'
  secondary-container: '#604403'
  on-secondary-container: '#dab36a'
  tertiary: '#90cfed'
  on-tertiary: '#003546'
  tertiary-container: '#005670'
  on-tertiary-container: '#8bcae8'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#8c171a'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#bee9ff'
  tertiary-fixed-dim: '#90cfed'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#004d65'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style
The design system is engineered to evoke the prestige and adrenaline of elite horse racing. It targets a professional betting and enthusiast audience, prioritizing high-stakes energy with a refined, "members-only" aesthetic. 

The style is **Corporate / Modern** with a lean toward **High-Contrast**. It utilizes expansive dark surfaces to make the signature deep red and prestigious accents pop, creating an environment that feels both technologically advanced and steeped in sporting tradition. Precision, speed, and luxury are the guiding principles for every visual decision.

## Colors
This design system utilizes a sophisticated dark-mode palette to emphasize the "high-stakes" atmosphere. 

- **Primary (#982121):** A deep, blood-red used for primary actions, branding, and active states. It represents passion and the "Turf."
- **Secondary (#C5A059):** A muted metallic gold used for "VIP" features, odds highlights, and prestigious winners.
- **Neutrals:** The background is a rich, near-black (#121212), with elevated surfaces using a dark charcoal (#1E1E1E) to maintain depth without losing contrast.
- **Semantic Colors:** Success (Green), Warning (Amber), and Error (Red) are saturated and vibrant to ensure critical betting information is never missed.

## Typography
The typography strategy pairs the assertive, geometric nature of **Montserrat** for headings with the extreme legibility of **Inter** for data-heavy content. 

- **Headlines:** Use Montserrat in Bold or ExtraBold weights. All-caps styling is recommended for section headers to increase the "prestige" feel.
- **Body:** Inter is used for all descriptive text and betting forms to ensure clarity under pressure.
- **Data/Labels:** **JetBrains Mono** is introduced specifically for numeric data like odds, race times, and horse numbers. Its monospaced nature ensures that fluctuating numbers don't cause layout shifts and remain easy to scan in tabular formats.

## Layout & Spacing
The layout follows a strict **4pt grid system** to maintain mathematical precision. On mobile, we utilize a fluid grid with a 20px side margin.

- **Betting Slips & Data:** Use compact spacing (8px) to maximize information density.
- **Marketing & Editorial:** Use generous spacing (40px+) to allow hero imagery of horses and riders to breathe.
- **Desktop:** Transition to a 12-column fixed grid (1200px max-width) with 24px gutters to organize complex multi-race views.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and subtle **Ambient Shadows**. In this dark-themed design system, we do not use pure black shadows. Instead, shadows are tinted with the primary red or a deep navy to keep the UI from feeling "muddy."

- **Level 0 (Background):** #121212.
- **Level 1 (Cards/Surface):** #1E1E1E.
- **Level 2 (Modals/Popovers):** #2A2A2A with a 15% blur shadow.
- **Interactive States:** Use subtle linear gradients (e.g., Primary Red to a slightly darker shade) to give buttons a tactile, "pressable" feel. High-priority elements use a thin 1px inner-border (stroke) of #C5A059 to denote "Gold" status.

## Shapes
The shape language is **Rounded**, balancing professional structure with modern mobile aesthetics. 

- **Standard Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Betting Odds Chips:** 0.25rem (4px) for a sharper, data-centric look.
- **Featured Cards:** 1rem (16px) corner radius to create a soft, premium container for imagery.
- **Selection States:** When an item is selected, use a 2px stroke of the Primary Red rather than a solid fill to maintain a sophisticated look.

## Components
- **Buttons:** Primary buttons use a subtle vertical gradient of the Primary Red. Text is white and uppercase Montserrat. Secondary buttons are "Ghost" style with a Secondary Gold outline.
- **Odds Chips:** High-contrast containers. Background: #2A2A2A; Text: #C5A059 (Gold). On hover/tap, they fill with Gold and flip text to Dark Charcoal.
- **Cards:** Used for race cards. They should feature a "scrim" (dark gradient overlay) at the bottom to ensure white typography remains legible over horse/jockey photography.
- **Input Fields:** Dark backgrounds (#121212) with a 1px border of #333333. On focus, the border transitions to Primary Red with a subtle outer glow.
- **Status Indicators:** Small, circular "Live" indicators should pulse using the Primary Red to create a sense of urgency and "Real-time" action.
- **Lists:** Race entries use tight vertical spacing with thin #2A2A2A dividers. Every second row uses a very subtle #161616 background for zebrafication to aid readability.