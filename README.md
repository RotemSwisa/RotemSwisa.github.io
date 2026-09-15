# rotemswisa.github.io

My personal site - portfolio, background and contact details.

**Live at [rotemswisa.github.io](https://rotemswisa.github.io/)**

---

## About the build

Hand-written. No framework, no site generator, no template - three files and a
folder of assets.

```
index.html      structure and all copy, in both languages
css/style.css   design system, layout, motion
js/main.js      language switching, reveals, filtering, the project wheel
assets/         agate artwork (SVG), logo, project emblems
```

### What it does

- **Bilingual, English and Hebrew**, switched at runtime. Every translatable
  string lives on the element as `data-en` / `data-he`, and the toggle swaps
  `textContent` and flips `dir` on the root element. The whole layout is written
  with CSS logical properties (`margin-inline`, `inset-inline-start`,
  `border-inline-start`) so right-to-left is a real mirror rather than a patch.
- **A rotating project wheel** built entirely from the project cards below it.
  It keeps no copy of its own, so it is bilingual for free and a new card joins
  it without touching the JavaScript.
- **Filterable project grid** by discipline - VR/AR, web, mobile, systems,
  security. An odd card left at the end is centred rather than stranded.
- **Circular type** set glyph by glyph rather than with `<textPath>`, which
  lays out Latin correctly and silently renders Hebrew as nothing at all.
- **Scroll-triggered reveals and counters** via `IntersectionObserver`, with
  staggered delays set per element in CSS custom properties.
- **Fully responsive**, down to a 320px viewport.
- **Accessible**: skip link, visible focus rings, `aria-expanded` on the menu,
  Escape to close, contrast checked against WCAG AA, and a complete
  `prefers-reduced-motion` path that turns every animation off rather than
  merely shortening it.
- **Print stylesheet**, so the page prints as a clean document.

### Design

The palette merges the agate artwork from my GitHub profile banner - cream,
peach, apricot and sage - with the deep forest green and bronze of a site whose
typography and pacing I admired. Display type is Cormorant Garamond, interface
type is Jost, and Hebrew headings are set in Calibri Light with Heebo behind
them. Latin words inside Hebrew text pick up the Latin face on their own, by
putting it first in the font stack - Cormorant carries no Hebrew glyphs, so
Hebrew falls through to the next face automatically.

Nothing is fetched from a third party except the web fonts. The agate backdrop
is SVG written by hand; every photograph is served from this repository at the
size the page actually uses.

---

## Running it locally

No build step. Clone and open `index.html`, or serve the folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Contact

- Email - rotemswisa1999@gmail.com
- LinkedIn - [in/rotem-swisa](https://www.linkedin.com/in/rotem-swisa)
- GitHub - [RotemSwisa](https://github.com/RotemSwisa)
