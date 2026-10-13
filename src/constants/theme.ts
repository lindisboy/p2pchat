import { Platform } from 'react-native';
import tokens from '../../assets/branding/p2pchat/tokens/colors.json';

export type ToneColors = { fg: string; fill: string; onFill: string; tint: string; edge: string };

function valueAt(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) =>
    node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined, tokens);
}

function resolve(path: string): string {
  const token = valueAt(path) as { $value?: unknown } | undefined;
  if (typeof token?.$value !== 'string') throw new Error(`Missing brand token: ${path}`);
  const alias = /^\{(.+)\}$/.exec(token.$value);
  return alias ? resolve(alias[1]) : token.$value;
}

function palette(mode: 'light' | 'dark') {
  const color = (role: string) => resolve(`${mode === 'dark' ? 'dark' : 'semantic'}.${role}`);
  const tone = (role: string): ToneColors => {
    const fill = color(`feedback.${role}`);
    return { fg: fill, fill, onFill: color('text.on-action'), tint: `${fill}18`, edge: fill };
  };
  return {
    bg: color('surface.page'), surface: color('surface.card'),
    surfaceRaised: color('surface.raised'), surfaceSunken: color('surface.page'),
    border: color('border.default'), borderStrong: color('border.strong'),
    text: color('text.primary'), textMuted: color('text.secondary'), textFaint: color('text.tertiary'),
    bubbleIn: color('surface.raised'), bubbleOut: color('action.primary'), onBubbleOut: color('text.on-action'),
    accent: color('text.link'), accentFill: color('action.primary'), onAccentFill: color('text.on-action'),
    accentPressed: color('action.primary-active'),
    clay: color('accent.clay'), ochre: color('accent.ochre'), slate: color('accent.slate'), plum: color('accent.plum'),
    green: color('feedback.success'), amber: color('feedback.warning'), red: color('feedback.error'), blue: color('feedback.info'),
    tone: { danger: tone('error'), caution: tone('warning'), ok: tone('success') },
  };
}

export type Theme = ReturnType<typeof palette>;
export const Colors = { dark: palette('dark'), light: palette('light') };
export type ToneName = keyof Theme['tone'];
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 } as const;
export const TAP_TARGET = 52;
export const Fonts = Platform.select({
  ios: { sans: 'Inter', mono: 'ui-monospace', rounded: 'Inter' },
  default: { sans: 'Inter', mono: 'monospace', rounded: 'Inter' },
})!;
const body = { fontFamily: 'Inter' };
const display = { fontFamily: 'Anton', fontWeight: '400' as const };
export const Type = {
  display: { ...display, fontSize: 34, lineHeight: 42 },
  hero: { ...display, fontSize: 28, lineHeight: 36 },
  title: { ...body, fontSize: 23, fontWeight: '700' as const, lineHeight: 30 },
  heading: { ...body, fontSize: 20, fontWeight: '600' as const, lineHeight: 27 },
  body: { ...body, fontSize: 17, fontWeight: '400' as const, lineHeight: 25 },
  bodyStrong: { ...body, fontSize: 17, fontWeight: '600' as const, lineHeight: 25 },
  callout: { ...body, fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  calloutStrong: { ...body, fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { ...body, fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  label: { ...body, fontSize: 13, fontWeight: '600' as const, lineHeight: 19 },
  micro: { ...body, fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
} as const;
export const Duration = { fast: 120, base: 200, slow: 300, pulse: 1400 } as const;
