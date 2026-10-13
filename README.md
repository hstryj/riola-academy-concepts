# RIOLA Academy — three responsive design directions

Static GitHub Pages showcase containing three visual directions for the same
workshop content:

- `refined/` — a polished version of the current RIOLA identity;
- `cinematic/` — a bolder, atmospheric studio direction;
- `editorial/` — an experimental, fashion-forward direction.

The root page is a concept selector. All variants share the same accessible
modals, optimized local assets and responsive behavior.

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
