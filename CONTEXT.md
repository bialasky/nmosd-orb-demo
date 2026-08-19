# Context

Glossary of terms for the NORA orb demo. Definitions only — no implementation details.

## Terms

### Orb
The circular animated avatar representing NORA, the NMOSD patient companion. Always keeps the shared identity: purple glass rim, dark core, gold → violet palette.

### State
What the agent is currently doing, shown by the orb. Exactly one of: **Idle**, **Listening**, **Thinking**, **Speaking**. States morph into each other with smooth crossfades; they never snap.

### Reference
The design stills in `references/orb/` that Idle, Listening, and Speaking must match. Thinking is being redesigned and is no longer bound to its reference still.

### Thinking Variant
One of several candidate motion designs for the Thinking state, explored in parallel before one wins. Current candidates: **Flow** (layered silk sheets traveling left → right, like information being transferred — same silk rendering as Listening, look anchored to the Thinking reference still — the current favorite), **Orbit** (comet with trail), **Ripple** (rings converging inward), **Weave** (continuous line tracing figures). Each variant sets its own energy/tempo; all keep the Orb identity. A variant must read as deliberate processing — cyclic or rhythmic, not random drift.
