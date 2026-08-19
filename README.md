# NMOSD Orb Demo

Docs-style playground for the NORA motion orb, plus the injected widget
launcher.

Customize the orb the same way as [ElevenLabs UI Orb](https://ui.elevenlabs.io/docs/components/orb):
agent state, a two-color pair, and a seed.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Next integration step

Replace the simulated turn in `components/nora-widget.tsx` with the OneRay
chat endpoint, and drive the orb from live input/output audio levels.
