/**
 * Design tokens.
 *
 * Constraints that are not aesthetic preferences:
 *
 *   - Contrast is a safety feature. This gets used outdoors, in daylight, at
 *     speed, possibly by someone who is frightened. Core text and action pairs
 *     have been measured, not eyeballed. The tightest checked pair is white on
 *     the urgent red fill (4.71:1). Re-measure any pair introduced by a token
 *     change; do not infer contrast from a color's name or appearance.
 *   - Dark is the default. It costs less battery on OLED and is far less
 *     visible to the person standing behind you.
 *   - Status colour is never the only signal. Every state also carries a word,
 *     because colour alone fails for colour-blind users and in bright sun.
 *   - Tone is a scale of loudness, not a palette. `danger` is meant to be
 *     unmissable, `caution` to be read, `ok` to be quiet. A mode with weaker
 *     confidentiality must never render calmer than one with stronger.
 */

import { Platform } from 'react-native';

/**
 * A tone is the full recipe for rendering one confidence level, so a screen
 * never has to improvise a "slightly darker red" and drift out of contrast.
 *
 *   fg     — tone-coloured text on `bg` or `surface`
 *   fill   — a solid band; the loudest thing available
 *   onFill — text on `fill`
 *   tint   — a barely-there wash for a notice that must be read but not shouted
 *   edge   — border for `tint`, and the hairline that marks a toned container
 */
export type ToneColors = {
  fg: string;
  fill: string;
  onFill: string;
  tint: string;
  edge: string;
};

const dark = {
  // India kit's ink ground keeps OLED screens dark. Its warmer raised surface
  // adds depth without putting large, saturated color fields behind content.
  bg: '#000000',
  surface: '#0B0B0B',
  surfaceRaised: '#1A1714',
  surfaceSunken: '#000000',
  border: '#3A3530',
  borderStrong: '#B9B0A2',

  text: '#F6EFE2',
  textMuted: '#B9B0A2',
  textFaint: '#9B9386',

  bubbleIn: '#1A1714',
  bubbleOut: '#0D47A1',
  onBubbleOut: '#F6EFE2',

  accent: '#7FA6E8',
  accentFill: '#0D47A1',
  onAccentFill: '#F6EFE2',

  // Kept as flat aliases because "green means connected" is referenced by name
  // in a dozen places and renaming it buys nothing.
  green: '#4ADE8B',
  amber: '#FFB21A',
  red: '#FF5A5F',
  blue: '#7FA6E8',

  tone: {
    danger: {
      fg: '#FF5A5F',
      fill: '#E21F26',
      onFill: '#FFFFFF',
      tint: '#241011',
      edge: '#8B3A3D',
    },
    caution: {
      fg: '#FFB21A',
      fill: '#FFB21A',
      onFill: '#0B0B0B',
      tint: '#241D10',
      edge: '#82601E',
    },
    ok: {
      fg: '#4ADE8B',
      fill: '#17794A',
      onFill: '#FFFFFF',
      tint: '#10241A',
      edge: '#357F58',
    },
  } satisfies Record<string, ToneColors>,
};

const light = {
  bg: '#F6EFE2',
  surface: '#FFFFFF',
  surfaceRaised: '#FFF9F0',
  surfaceSunken: '#EEE5D6',
  border: '#D9CFBE',
  borderStrong: '#0B0B0B',

  text: '#0B0B0B',
  textMuted: '#5C554D',
  textFaint: '#625B51',

  bubbleIn: '#EEE5D6',
  bubbleOut: '#0D47A1',
  onBubbleOut: '#F6EFE2',

  accent: '#0D47A1',
  accentFill: '#0D47A1',
  onAccentFill: '#F6EFE2',

  green: '#0B7A43',
  amber: '#765000',
  red: '#C4141B',
  blue: '#0D47A1',

  tone: {
    danger: {
      fg: '#C4141B',
      fill: '#E21F26',
      onFill: '#FFFFFF',
      tint: '#FBE9E6',
      edge: '#BE7776',
    },
    caution: {
      fg: '#765000',
      fill: '#FFB21A',
      onFill: '#0B0B0B',
      tint: '#FFF3D8',
      edge: '#A67A2D',
    },
    ok: {
      fg: '#0B7A43',
      fill: '#0A6B3B',
      onFill: '#FFFFFF',
      tint: '#E6F6EC',
      edge: '#6BB48C',
    },
  } satisfies Record<string, ToneColors>,
};

export type Theme = typeof dark;

export const Colors: { dark: Theme; light: Theme } = { dark, light };

export type ToneName = keyof Theme['tone'];

// ---------------------------------------------------------------------------
// Rhythm

/**
 * One vertical scale, used everywhere. Steps are far enough apart that picking
 * the wrong one is visible, which is the point — it keeps the layout honest.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Minimum comfortable tap target. Non-negotiable — this is used one-handed. */
export const TAP_TARGET = 52;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace', rounded: 'ui-rounded' },
  default: { sans: 'normal', mono: 'monospace', rounded: 'normal' },
})!;

// ---------------------------------------------------------------------------
// Type

/**
 * A real scale, not four weights of the same size. The jumps between adjacent
 * steps are large enough to establish hierarchy at arm's length in sunlight;
 * line heights are generous because long safety sentences are the norm here,
 * not the exception.
 */
export const Type = {
  /** Reserved for the status banner headline — the one question users have. */
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 38 },
  hero: { fontSize: 27, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 33 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
  heading: { fontSize: 19, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 25 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 25 },
  bodyStrong: { fontSize: 17, fontWeight: '600' as const, lineHeight: 25 },
  callout: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  calloutStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  /** Section eyebrows. Uppercase at the call site, tracked out to stay legible. */
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.1, lineHeight: 16 },
  /** Status words next to a colour. Never smaller than this. */
  micro: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.4, lineHeight: 16 },
} as const;

// ---------------------------------------------------------------------------
// Motion

/**
 * Calm and fast. Nothing overshoots and nothing bounces — this is a tool people
 * open when they are frightened, and playful motion reads as a toy.
 *
 * Every animation built on these must also respect `useMotion()`, which returns
 * false when the OS asks for reduced motion.
 */
export const Duration = {
  fast: 130,
  base: 220,
  slow: 380,
  /** One half-cycle of the "still searching" pulse. Slow enough to read as breathing. */
  pulse: 1400,
} as const;
