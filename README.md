# NMOSD Orb Demo

Docs-style playground for the NORA motion orb, plus the injected widget
launcher.

Customize the orb the same way as [ElevenLabs UI Orb](https://ui.elevenlabs.io/docs/components/orb):
agent state, a two-color pair, and a seed.

## Run locally

Needs Node 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

This is a client-only Vite + React app. `pnpm build` writes static files to
`dist/`. Point any host (nginx, Cloudflare Pages, Netlify, S3, etc.) at that
folder. There is no Node server and no required env vars.

```bash
pnpm install --frozen-lockfile
pnpm build
```

CI/CD is: install → build → publish `dist/`. If the host is a generic static
server, serve `index.html` for unknown paths.

```yaml
# example GitHub Actions job
- uses: pnpm/action-setup@v4
  with:
    version: 10
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm build
# then upload ./dist to the domain
```

## Next integration step

Replace the simulated turn in `components/nora-widget.tsx` with the OneRay
chat endpoint, and drive the orb from live input/output audio levels.
