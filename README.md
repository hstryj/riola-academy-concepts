# RIOLA Academy — four responsive directions + one playful bonus

Static GitHub Pages showcase containing four visual directions for the same
workshop content:

- `refined/` — a polished version of the current RIOLA identity;
- `cinematic/` — a bolder, atmospheric studio direction;
- `editorial/` — an experimental, fashion-forward direction;
- `afterglow/` — warm sculptural imagery, editorial typography and paper-toned folders.
- `folderverse/` — a deliberately playful bonus: decorative folders fly across the viewport while actual navigation remains stationary.

The root page is a concept selector. All variants share the same accessible
modals, optimized local assets and responsive behavior.

Workshop navigation retains the floating-folder identity in four treatments:
muted dimensional folders, a luminous archive, a bold graphic catalogue and a
warm paper atelier. These are presentation differences, not different course
difficulty levels. Button hit areas and labels stay still while only decorative
SVG artwork floats. Mobile layouts and reduced-motion preferences disable the
animation; desktop visitors can pause it, with the preference saved locally.

The folder enhancement is isolated in `assets/floating-folders.css` and
`assets/folder-motion.js`. Existing `data-page` modal contracts remain unchanged.

Folderverse adds its own scoped theme and motion files. Its flight controls can
pause or remix the decorative orbits. It respects reduced-motion preferences and
keeps the four original directions available; it is a bonus, not their replacement.

## Important

This is a static concept preview. The registration form intentionally does not
send data because GitHub Pages cannot host `/api/registrations` or validate
Cloudflare Turnstile server-side. Production registration should remain behind
an edge-protected backend.

## Local preview

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.
