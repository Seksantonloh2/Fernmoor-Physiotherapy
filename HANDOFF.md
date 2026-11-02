# Fernmoor Physiotherapy — build notes & Framer handoff

Concept site by THINGBESIDE. Static HTML/CSS/JS prototype of the Framer build.

## Files
| File | Page |
| --- | --- |
| `index.html` | Home (`/`) |
| `services.html` | Services (`/services`) |
| `about.html` | About (`/about`) |
| `book.html` | Book (`/book`): Cliniko mock-up, contact, map, FAQ, call-back form |
| `privacy.html` | Privacy policy (draft) |
| `assets/styles.css` | Tokens + all styles |
| `assets/main.js` | Motion, booking widget, form validation |

Preview locally: `python -m http.server 5173` in this folder, then open http://localhost:5173.

## Decisions where the brief conflicted
- **Fonts / colour:** the Brand table wins over the earlier "Switzer + Inter, sage green" lines → Schibsted Grotesk only, Pickled Bluewood `#2b3d54` as the single accent. The map pin uses the accent, not sage.
- **Logo:** bolt icon stand-in + letter-spaced FERNMOOR wordmark, as the Brand table says.
- **Hero subtitle:** uses the Site brief version (§1), which supersedes the Home page draft.
- **Photos:** labelled flat placeholders (`.ph` with `data-label`). To swap, replace the `<div class="ph" …>` with `<img src="…" alt="…">` inside the same `.media` wrapper; the zoom and parallax still work.

## Tokens
| Token | Value |
| --- | --- |
| Background | `#FFFFFF` |
| Surface / surface-2 | `#F3F5F7` / `#E9EDF1` |
| Text | `#1B2636` |
| Muted | `#5B6573` |
| Line | `#E2E6EB` |
| Accent | `#2B3D54` (soft tint `#E6EBF1`) |
| Ink (CTA band, header button) | `#111A26` |
| Status | open/success `#16A34A`, closed/error `#DC2626`, used only for status |
| Radius | 14px (cards, images), 10px (buttons, inputs, chips) |
| Max width | 1240px, gutter 24px (16px mobile) |
| Section padding | clamp(88px → 144px) |

## Type scale (title / subtitle)
| Use | Desktop | Mobile |
| --- | --- | --- |
| Hero | 96 / 22 | 44 / 17 |
| Section H2 | 64 / 18 | 36 / 16 |
| Service title | 48 / 18 | 30 / 16 |
| H3 | 26 | 21 |
| Body | 17, line-height 1.6 | 16 |
Weight 600 for headings, tracking −3%.

## Motion → Framer
- **Load:** Appear effect on hero title/subtitle: blur 10 → 0, opacity 0 → 1, y 16 → 0, 0.7s, ease `cubic-bezier(.22,1,.36,1)`, stagger 70ms per word.
- **Scroll:** scroll-triggered Appear (blur 8, y 20, 0.8s), grid children staggered 80ms.
- **Buttons:** hover variant: fill wipes up from the bottom (accent → ink), label slides up and is replaced by a copy, arrow slides out right and back in from the left. Press scale 0.97. 0.4s. Primary has a soft button shadow; cards never do.
- **Cards:** image zoom 1.045 inside the clipped frame, background shifts to surface-2, lift of 3px. No shadows.
- **Count-up:** stats count from 0 over 1.5s, ease-out, once. Suffixes stay static.
- **Parallax:** hero image moves at −0.08× scroll.
- **Sticky headline:** left column sticks on How it works, Location, Prices and FAQ.
- **Page transition:** blur + fade out/in (0.4–0.5s) between pages only. Section links only smooth-scroll.
- **Reduced motion:** blur/translate off, simple fades only.

## Before launch (from the brief)
- [ ] Replace every placeholder contact detail, ABN and Ahpra number
- [ ] Replace sample stats and reviews with real, non-clinical ones (or remove)
- [ ] Check copy against Ahpra advertising rules
- [ ] Add the Google Business Profile link
- [ ] Finalise the privacy policy
- [ ] Swap placeholders for real clinic and team photos
- [ ] Embed the real Cliniko widget; connect the call-back form to Formspree and send a test
