# Design Direction — Front Desk Report

## Three stylistic approaches

### Theme Name: Heritage Operations
Very Brief Intro: A calm, hospitality-led operations console that pairs deep hotel navy with brushed brass, Khmer-friendly typography, and editorial paper-like surfaces. It should feel trusted and precise without becoming sterile.
Probability: 0.07

### Theme Name: Quiet Ledger
Very Brief Intro: A warm, monochrome reporting workspace inspired by archival ledgers, linen, and graphite annotations. Dense data is softened through generous whitespace, muted mineral colors, and clear typographic rhythm.
Probability: 0.03

### Theme Name: Blue Hour Control
Very Brief Intro: A darker, atmospheric command center with twilight blue surfaces and restrained amber status lights. It emphasizes rapid shift decisions and high signal-to-noise rather than decorative spectacle.
Probability: 0.09

## Chosen approach: Heritage Operations

### Design Movement
Contemporary hospitality editorial: the visual language of a boutique hotel operations binder translated into a responsive digital control room, with subtle Southeast Asian material cues and disciplined enterprise UX.

### Core Principles
1. **Trusted at a glance:** information hierarchy, labels, and statuses must read immediately during a busy shift.
2. **Hospitality without softness:** warm brass accents and generous surfaces create welcome, while navy anchors operational confidence.
3. **Editorial rhythm:** asymmetrical composition, strong section headings, and intentional whitespace prevent dashboard fatigue.
4. **Respectful localization:** Khmer is first-class content, not a decorative translation layer; English metadata is used only when it adds operational clarity.

### Color Philosophy
Deep navy is the visual backbone because it signals reliability and authority across the login shell, sidebar, and primary actions. Brushed brass is reserved for moments of progress, active shift context, and important highlights, making it feel earned rather than ornamental. A fog-white canvas and blue-gray ink keep long tables comfortable to scan. Status colors are softened, never neon: sage for complete, amber for attention, and oxblood for variance or risk.

### Layout Paradigm
Use a persistent left operations rail and an offset content canvas rather than a centered marketing layout. The main dashboard opens with a wide “today at a glance” band, then shifts into a 2:1 rhythm: one wide analytical panel beside one narrow alert panel, followed by full-width operational tables. Forms use labeled horizontal bands and grouped field clusters so staff can work top-to-bottom in a consistent sequence.

### Signature Elements
- A brass “shift pulse” marker that appears beside active shift context, chart highlights, and current report status.
- Slim ruled separators and small uppercase metadata labels inspired by a hotel folio, used to frame sections without heavy borders.
- A deep-navy login split panel with a softly lit hotel lobby image and a stamped FDR mark.

### Interaction Philosophy
Every interaction should confirm progress clearly. Buttons use brief tactile compression, navigation swaps views without disorienting the user, and record creation happens in focused modal sheets with visible success feedback. Filters remain close to their data, and empty states explain what action to take next. Errors are phrased as operational guidance, not technical failures.

### Animation
Use short, confident transitions: page sections fade and rise 8px over 180ms, cards lift 2px on hover, and status updates pulse once in brass. Avoid floating or looping motion in the core dashboard. The sidebar collapses with a 220ms ease-out; modal sheets enter from 96% scale with opacity rather than from zero. Respect reduced-motion preferences and keep keyboard-triggered actions immediate.

### Typography System
Use **Noto Sans Khmer** for Khmer content and **DM Sans** for English/Latin metadata and numerals. Headings are 650–750 weight with tight tracking; body copy stays 400–500 for legibility. Small labels use DM Sans 11–12px uppercase with 0.11em letter spacing, while Khmer labels use 13–14px without forced uppercase. Numbers in stat cards use DM Sans 700 with tabular-figure treatment.

### Brand Essence
**FDR is the front desk’s living shift book for hotel teams who need every handoff, number, and guest request to stay accountable.**
Personality adjectives: dependable, composed, attentive.

### Brand Voice
Headlines are concise and observant; CTAs are verbs that describe the next operational action; microcopy is warm, specific, and never vague.

Example lines:
- “Keep the handoff clean.”
- “Review today’s exceptions before the next shift begins.”

### Wordmark & Logo
Use an abstract **FDR seal**: three nested doorway arches reduced to a compact navy-and-brass symbol, with the center arch forming a subtle checkmark to represent a completed handoff. The mark should appear without text in the app icon and alongside the FDR wordmark in the rail; never use the hotel name as the logo itself.

### Signature Brand Color
**Brass Ledger — #B68A45**. It is a muted antique-gold that feels specific to a hospitality folio and is visually distinct from generic yellow or orange accents.

## File-level reminder
All page and component files should reinforce Heritage Operations: hospitality editorial, navy + brass, Khmer-first content, persistent operations rail, ruled section framing, and restrained motion. When in doubt, ask: “Does this choice reinforce or dilute our design philosophy?”

## Style Decisions

- The FDR seal is presented as a stamped emblem with nested framing so it stays legible and ownable at both rail and auth sizes.
- Auth and dashboard surfaces use hotel-folio structure: ruled dividers, compact uppercase metadata, grouped operational bands, and Brass Ledger reserved for active and progress signals.
- Headlines and CTAs must imply a concrete shift action such as review, handoff, report, exception, or accountability rather than generic account software language.
