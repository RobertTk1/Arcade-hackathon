# COMO design language

Sampled from https://trycomo.app. Tokens live in `src/app/globals.css` and are exposed as Tailwind utilities (`bg-forest`, `text-ink-mid`, `font-serif`, `shadow-frame`, ...).

## Feel
Warm, calm, non-clinical. Editorial serif headlines, soft cream surfaces, deep forest green as the anchor, peach as the friendly accent. Pill-shaped controls, generous whitespace. The tone is gentle and non-judgmental: no red-alert states, no scorekeeping.

## Color
| Token | Hex | Use |
|---|---|---|
| `forest` | #2F543B | Primary buttons, emphasis words, dark sections |
| `forest-light` | #3D6B4A | Button hover |
| `forest-pale` | #E8F0EA | Badges, active nav pill |
| `forest-deep` | #1A2E20 | Footer, notebook spine |
| `peach` | #EDB082 | Accent word, eyebrow labels, numbers, secondary CTA |
| `peach-light` | #F5D4B8 | Soft highlights |
| `peach-pale` | #FDF4EC | Feedback/callout sections |
| `raspberry` | #993955 | Errors and rare warm emphasis (also used in gradients with forest) |
| `warm-white` | #FFFDF9 | Page background |
| `off-white` | #FAF8F5 | Cards and alternate sections |
| `ink` | #1A1A18 | Headings, body |
| `ink-mid` | #4A4A44 | Paragraphs, secondary nav |
| `ink-light` | #8A8A82 | Captions, placeholders |
| `line` | #E8E4DC | Borders |

Light theme only. No dark mode.

## Typography
- **Playfair Display 700** for headings (h1 72/79, h2 44-52, h3 26), letter-spacing -0.02em. Highlight one or two words per headline in `forest` or `peach`.
- **Outfit 300/400/500** for body and UI. Body 16px, lead paragraphs 19px at ~1.7 line height, buttons 13-14px weight 500.
- **Nunito 800** for the lowercase "como" wordmark only.
- Eyebrows: Outfit 11px, weight 500, uppercase, letter-spacing 0.16em, `peach`.

## Shape and elevation
- Buttons, badges, nav items: fully rounded pills.
- Cards: 20px radius, 1px `line` border, `off-white` fill, no shadow.
- Framed media (screenshots, cover previews): 28px radius with `shadow-frame` (hairline ring + soft 48px drop).
- Section padding: ~80px vertical, 48px horizontal on desktop.

## Components
- **Primary button:** `forest` fill, white text, pill, 10-18px padding; hover `forest-light`.
- **Secondary button:** `peach` fill with `ink` text, or transparent with a 1.5px white/55% outline on dark.
- **Badge:** `forest-pale` fill, `forest` text, pill, 12px.
- **Nav item:** pill; active state is `forest-pale` with `forest` text.
- **Dark section:** `forest` background, white text, peach eyebrow.

## Voice
Second person, plain, kind. "You're not broken." Avoid diet or fitness language.
