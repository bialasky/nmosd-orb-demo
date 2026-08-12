# NMOSD Orb Demo

Standalone interaction demo for the “Voice Assistant Motion Orb” concept from
the NMOSD visualisation proposal.

Built from:

- [shadcn-ui/chatbot-template](https://github.com/shadcn-ui/chatbot-template)
- [ElevenLabs UI Orb](https://ui.elevenlabs.io/docs/components/orb)
- Next.js, React, Tailwind CSS, Three.js, and React Three Fiber

## Included

- NMOSD wordmark intro
- ElevenLabs WebGL orb with branded colours
- Idle, listening, thinking, and speaking previews
- Popup chat flow with simulated responses
- Responsive layout and reduced-motion fallback

This version is intentionally visual-only. It needs no API keys and does not
send messages to a backend.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Next integration step

Replace the simulated response in `components/orb-experience.tsx` with the
OneRay chat endpoint and connect real input/output audio levels to the Orb
component.
