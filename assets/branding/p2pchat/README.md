# P2PCHAT brand kit

P2PCHAT uses teal as its tonal anchor, complemented by clay, ochre, slate blue and muted plum. The speech artwork, type and folk texture come from the supplied TIP kit. Its warm and cool color relationships remain visible, with a quieter, distinct palette for messaging. TIP's logo is not included or adapted. No Material, Dracula, Tokyo Night or Catppuccin palette was copied.

## Use the files

- `logo.svg` / `logo.png`: transparent horizontal logo.
- `logo-paper.svg` / `logo-paper.png`: logo on paper.
- `logo-reverse.svg` / `logo-reverse.png`: transparent light logo for dark backgrounds.
- `logo-dark.svg` / `logo-dark.png`: dark-background composition.
- `wordmark*.svg`: fully vector lettering for large-scale production.
- `symbol*.svg`: speech mark with the original raster detail embedded.
- `app-icon.png`: symbol-only square artwork, 512 x 512.
- `avatar.png`: square mark plus wordmark, 512 x 512.
- `banner.png`: 1600 x 640 composition with a supplied texture band.
- `texture-palette.png`: multicolor treatment of the original texture, 1254 x 1254.
- `p2pchat-brand-kit.pdf`: six-page visual guide.
- `tokens/`: primitive, semantic, component and scale tokens in DTCG JSON.
- `theme.css`: light and dark CSS variables and local font declarations.
- `build.py`: repeatable palette treatment, font outlines, exports and token generation.
- `source/originals/`: unchanged graphic inputs with SHA-256 checksums.

The app uses these assets and tokens in its native screens, launcher and splash. `native/android-foreground.png` adds adaptive-icon padding around the supplied mark. Kit export checks are recorded in `VALIDATION.md`; app runtime checks are recorded separately in the release validation document.

## Palette and type

| Role | Color |
|---|---|
| Teal / tonal anchor and primary action | `#246C73` |
| Clay / warm complement | `#A04434` |
| Ochre / warm supporting color | `#91611B` |
| Slate / cool supporting color | `#485A83` |
| Plum / cool supporting color | `#745271` |
| Terracotta / lighter clay texture tone | `#B96543` |
| Charcoal / text | `#202C31` |
| Paper / page | `#F3F0E8` |
| Mist / secondary surface | `#DCE7E5` |
| Sea glass / dark-theme action | `#9CCED0` |
| Night / dark page | `#17252C` |

Anton carries the wordmark and short display headings. Inter carries messages, labels and body text. Use sentence case in the app. The base body size is 16 px, with a 1.25 type scale and 4 px spacing unit. Teal carries navigation and primary actions. Use one supporting color at a time in app composition; the supplied texture can show the full palette. Terracotta is a texture tone, not a small-text color. Status colors are functional and always paired with text or a symbol.

TIP red becomes clay; orange becomes terracotta; yellow becomes ochre; blue becomes slate; the dominant purple texture becomes teal. Plum retains a quieter purple relationship in the supporting palette. The source's light ground and dark pattern details become paper and charcoal. This transformation preserves the original motif placement and pixel alpha; it does not invent a new illustration.

Keep one P-stem width of clear space around the mark. Use the horizontal lockup at 200 px wide or larger, and the speech mark at 48 px wide or larger. At smaller sizes prefer the wordmark. Use textures on covers and banners, with text on a plain surface. Textured artwork does not belong behind chat messages or controls.

## Design decisions

Domain: peer-to-peer messaging. Audience: people exchanging messages in unreliable connectivity. Mood: grounded. Motion: static artwork, with only brief feedback timings supplied for future UI adoption. Layout: large mark, practical variant sheet, palette table, type specimen, texture specimen and source notes. Reference: printed communication materials rather than a campaign collage. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

- Teal distinguishes P2PCHAT from TIP's dominant purple while keeping a cool tonal center.
- Clay complements teal; ochre, slate and plum extend TIP's multicolor vocabulary without copying an external theme.
- Charcoal and paper give the artwork a quiet reading surface.
- The supplied speech mark relates directly to messaging; no shield or lock was invented.
- Anton retains the supplied kit's typographic character. Inter supports longer reading.
- Palette treatment changes color only: source pixel placement and alpha are preserved.
- The texture band keeps the supplied craft visible without competing with the logo.
- Light and dark exports allow intentional contrast rather than automatic inversion.

## Sources and rights

Graphic inputs are the supplied The India Project repository's `public/brand/icons/speech.png` (425 x 411) and `docs/brand/source/Texture.png` (1254 x 1254). Unchanged copies and checksums are included. The earlier 123 x 119 speech crop is not the current input. No image synthesis, purchased stock or redrawn motifs were used.

The supplied graphic collection does not identify its artist or include a graphic reuse license. Use follows the user's explicit instruction to build from their kit; this package does not certify independent authorship, grant graphic rights or place these graphics under the repository's MIT license. The originals remain intact. The new derivatives remap their colors into the P2PCHAT palette.

Anton: The Anton Project Authors, https://github.com/google/fonts/tree/main/ofl/anton.
Inter: The Inter Project Authors, https://github.com/google/fonts/tree/main/ofl/inter.
Both fonts are supplied with their SIL Open Font License 1.1 files. Exports contain outlined lettering and require no installed fonts.

The speech mark remains raster even inside its SVG. Do not describe the full logo as a vector master. Avoid enlarging the icon beyond its 425-pixel source for print; use the pure-vector wordmark or obtain a larger original.

## Rebuild and checks

Run `python build.py` from any directory. Dependencies: Python fontTools, Pillow, NumPy, librsvg's `rsvg-convert`, and Poppler's `pdfunite`. PDF pages and SVG source remain editable compositions; outlined text is editable as shapes rather than as live type.

See `VALIDATION.md` for measured contrast, source preservation and visual-review evidence.
