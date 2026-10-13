# Validation

## Measured checks

- PASS: token validator parsed 2/2 JSON files; all aliases resolve. The palette revision defines teal and supporting-color roles.
- PASS: all 12 required light/dark semantic contrast pairs. Light body 12.58:1, secondary 5.67:1, links and primary action text 5.32:1; essential border 3.38:1. Dark body 13.79:1, secondary 9.45:1, action text 9.09:1; essential border 5.86:1.
- PASS: eight primary, hover, active and destructive action text pairs meet 4.5:1; exact results are in `contrast-states.txt`.
- PASS: clay, ochre, slate and plum on page surfaces meet 4.5:1 in both themes. Light ratios: 5.47, 4.69, 6.01 and 5.78. Dark ratios: 7.58, 8.98, 8.62 and 8.08. Terracotta remains decorative texture only.
- PASS: generated teal ramp text/UI checks are recorded in `contrast-states.txt`.
- PASS: CSS reference validator found 33 variables; all variable references resolve.
- PASS: both palette-treated speech variants preserve the source alpha mask exactly. Transparent horizontal PNG has alpha zero at its corner.
- PASS: all six final PDF pages rendered through Poppler and were inspected. Texture-page overlap corrected before final export. Logo, avatar, palette, type, texture and source pages checked visually.
- PASS: Canva imports returned success, with six pages for the guide and one for the logo.

Decorative divider colors are deliberately below 3:1; use `border.strong` for controls. This measures the supplied kit, not the running app. No app build, platform icon installation or app accessibility certification is claimed. The skill kit's `accuracy_report.mjs` checks its own example applications; that unrelated library suite is not evidence for this brand package.

## Anti-slop delivery gate

Hard gate:
- R-02 PASS: guide copy uses ordinary punctuation without em dashes.
- R-03 PASS: six fixed-size PDF pages rendered without clipped content after correction; responsive UI does not apply.
- R-17/R-18/R-36/R-38 PASS: no fictional statistics, testimonials, people or security promises; dimensions and contrast values were measured.
- R-23 PASS: user explicitly requested logo and brand kit from the supplied artwork.
- R-24/R-26/R-27/R-28/R-32/R-35: not applicable to static artwork; there are no navigation controls, forms, FAQ or running app changes.
- R-25 PASS: required semantic text pairs pass in both themes, with results above.
- R-33 PASS: authoring script generates exports and tokens directly; no external script patches app source or CSS.
- R-34 PASS: both theme palettes measured; light and dark artwork rendered. No theme-toggle UI is included.
- R-37 PASS: supplied kit, project audience and distinct-palette request establish direction before authoring.

Purpose gate:
- R-01/R-08/R-09/R-10/R-12/R-13/R-14/R-19/R-22 PASS: no gradients, glows, decorative arrows, badges, glass, shadows, filler cards, animations or stock illustration.
- R-04 PASS: supplied speech artwork represents the messaging domain.
- R-06 PASS: Anton retains the user's supplied type direction; Inter supports body reading. Reasons documented in README.
- R-07 PASS: texture comes from supplied craft assets and is confined to large artwork; reason and placement rules documented.

Liveliness:
- PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 declared in README.
- PASS: one large mark leads the cover; variants, palette, type and texture pages use different compositions.
- PASS: whitespace separates the mark, captions and texture rather than filling extra panels.
- PASS: teal is the tonal anchor, sea glass its dark-theme substitute. Supporting colors retain TIP's multicolor relationships, as expressly requested by the user.
- PASS: supplied distressed speech mark and folk texture provide the recurring identity motif.
- PASS: design read and rationale recorded before delivery.

Craftsmanship:
- C-1/R-31 PASS: palette, type, icon, texture, spacing and theme reasons recorded in README.
- C-2/C-4: interactive-state and keyboard checks do not apply to static exports. Tokens for future use are not a tested UI.
- C-3/R-05 PASS: pages serve mark usage, color, typography, texture and provenance; no marketing-template sections.
- C-5/R-16 PASS: no fabricated social proof, product claims or marketing filler.
- R-11/R-15: no UI controls or calls to action in this package.
- R-20/R-30 PASS: supplied artwork and project-specific palette drive identity; no popular app identity copied.
- R-21 PASS: light and dark artwork supplied; neither theme is forced on the app.
- R-29 PASS: the user expressly requested a complementary multicolor palette. Teal anchors UI actions, supporting colors have named roles, and full-color texture is confined to large artwork.
