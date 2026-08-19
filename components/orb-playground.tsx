"use client"

import { useEffect, useMemo, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DEFAULT_ORB_COLORS,
  DEFAULT_ORB_TWEAK,
  MotionOrb,
  STATE_TWEAK_DEFAULTS,
  type MotionOrbState,
  type OrbTweak,
  type ThinkingVariant,
} from "@/components/motion-orb"

const STATES: { id: MotionOrbState; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "listening", label: "Listening" },
  { id: "thinking", label: "Thinking" },
  { id: "speaking", label: "Speaking" },
]

const THINKING_VARIANTS: { id: ThinkingVariant; label: string }[] = [
  { id: "flow", label: "Flow" },
  { id: "orbit", label: "Orbit" },
  { id: "ripple", label: "Ripple" },
  { id: "weave", label: "Weave" },
]

const STORAGE_KEY = "nora-orb-tweak-v1"
const VARIANT_KEY = "nora-orb-thinking-variant-v1"

const SHARED_KEYS = [
  "radius",
  "borderWidth",
  "borderGlow",
  "borderMix",
] as const satisfies readonly (keyof OrbTweak)[]

const STATE_KEYS: Record<MotionOrbState, readonly (keyof OrbTweak)[]> = {
  idle: ["micScale", "micStroke", "idleShadow"],
  listening: ["polarAmp", "polarThick", "polarSpeed", "polarInset", "polarAlpha"],
  thinking: ["waveAmp", "waveSpread", "waveSpeed", "waveThick", "waveAlpha", "centerline"],
  speaking: ["waveAmp", "waveSpread", "waveSpeed", "waveThick", "waveAlpha", "centerline"],
}

const SLIDER_META: Record<
  keyof OrbTweak,
  { label: string; min: number; max: number; step: number }
> = {
  radius: { label: "Size", min: 0.22, max: 0.46, step: 0.005 },
  borderWidth: { label: "Border width", min: 0.2, max: 2.4, step: 0.02 },
  borderGlow: { label: "Border glow", min: 0, max: 2.4, step: 0.02 },
  borderMix: { label: "Border brightness", min: 0, max: 1, step: 0.01 },
  micScale: { label: "Mic size", min: 0.4, max: 2.2, step: 0.02 },
  micStroke: { label: "Mic stroke", min: 0.4, max: 2.2, step: 0.02 },
  idleShadow: { label: "Inner shadow", min: 0, max: 2.4, step: 0.02 },
  polarAmp: { label: "Voice amplitude", min: 0, max: 2.4, step: 0.02 },
  polarThick: { label: "Voice thickness", min: 0.2, max: 2.4, step: 0.02 },
  polarSpeed: { label: "Voice speed", min: 0, max: 3, step: 0.02 },
  polarInset: { label: "Ring gap", min: 0, max: 0.35, step: 0.005 },
  polarAlpha: { label: "Voice opacity", min: 0, max: 2.2, step: 0.02 },
  waveAmp: { label: "Wave amplitude", min: 0, max: 2.2, step: 0.02 },
  waveSpread: { label: "Wave spread", min: 0.08, max: 1.2, step: 0.01 },
  waveSpeed: { label: "Wave speed", min: 0, max: 3, step: 0.02 },
  waveThick: { label: "Wave thickness", min: 0.2, max: 2.4, step: 0.02 },
  waveAlpha: { label: "Wave opacity", min: 0, max: 2.2, step: 0.02 },
  centerline: { label: "Centerline", min: 0, max: 2, step: 0.02 },
}

type StoredTweaks = Record<MotionOrbState, OrbTweak>

function cloneDefaults(): StoredTweaks {
  return {
    idle: { ...STATE_TWEAK_DEFAULTS.idle },
    listening: { ...STATE_TWEAK_DEFAULTS.listening },
    thinking: { ...STATE_TWEAK_DEFAULTS.thinking },
    speaking: { ...STATE_TWEAK_DEFAULTS.speaking },
  }
}

function loadTweaks(): StoredTweaks {
  const fallback = cloneDefaults()
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<StoredTweaks>
    for (const state of STATES) {
      fallback[state.id] = { ...DEFAULT_ORB_TWEAK, ...parsed[state.id] }
    }
    return fallback
  } catch {
    return fallback
  }
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        className="w-full accent-foreground"
      />
    </label>
  )
}

export function OrbPlayground() {
  const [agentState, setAgentState] = useState<MotionOrbState>("idle")
  const [colors, setColors] = useState<[string, string]>(DEFAULT_ORB_COLORS)
  const [seed, setSeed] = useState(1000)
  const [tweaks, setTweaks] = useState<StoredTweaks>(cloneDefaults)
  const [thinkingVariant, setThinkingVariant] = useState<ThinkingVariant>("flow")
  const [copied, setCopied] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTweaks(loadTweaks())
    const storedVariant = window.localStorage.getItem(VARIANT_KEY)
    if (THINKING_VARIANTS.some((variant) => variant.id === storedVariant)) {
      setThinkingVariant(storedVariant as ThinkingVariant)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(VARIANT_KEY, thinkingVariant)
  }, [thinkingVariant, ready])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks))
  }, [tweaks, ready])

  const tweak = tweaks[agentState]

  function setTweak<K extends keyof OrbTweak>(key: K, value: OrbTweak[K]) {
    setTweaks((current) => {
      const next = { ...current[agentState], [key]: value }
      if ((SHARED_KEYS as readonly string[]).includes(key)) {
        return {
          idle: { ...current.idle, [key]: value },
          listening: { ...current.listening, [key]: value },
          thinking: { ...current.thinking, [key]: value },
          speaking: { ...current.speaking, [key]: value },
        }
      }
      return { ...current, [agentState]: next }
    })
  }

  function resetState() {
    setTweaks((current) => ({
      ...current,
      [agentState]: {
        ...STATE_TWEAK_DEFAULTS[agentState],
        radius: current[agentState].radius,
        borderWidth: current[agentState].borderWidth,
        borderGlow: current[agentState].borderGlow,
        borderMix: current[agentState].borderMix,
      },
    }))
  }

  async function copyValues() {
    const payload = {
      state: agentState,
      colors,
      seed,
      tweak,
    }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const stateLabel = useMemo(
    () => STATES.find((item) => item.id === agentState)?.label ?? agentState,
    [agentState]
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <p className="text-sm font-medium tracking-tight">NORA UI · Orb tuner</p>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Tune one state</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Reference on the left, live orb on the right. Border knobs stay shared.
          Everything else is saved per state.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATES.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={agentState === item.id ? "default" : "outline"}
              onClick={() => setAgentState(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {agentState === "thinking" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              Variant
            </span>
            {THINKING_VARIANTS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="xs"
                variant={thinkingVariant === item.id ? "secondary" : "ghost"}
                onClick={() => setThinkingVariant(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-xl border">
            <figcaption className="border-b px-4 py-2 text-xs font-medium tracking-wide uppercase">
              Reference · {stateLabel}
            </figcaption>
            <div className="flex items-center justify-center" style={{ background: "#121722" }}>
              <img
                src={`/orb-ref/${agentState}.png`}
                alt={`${stateLabel} design reference`}
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          </figure>

          <figure className="overflow-hidden rounded-xl border">
            <figcaption className="border-b px-4 py-2 text-xs font-medium tracking-wide uppercase">
              Live · {stateLabel}
            </figcaption>
            <div
              className="flex min-h-[420px] flex-col items-center justify-center px-6 py-8"
              style={{ background: "#121722" }}
            >
              <div className="size-[min(70vw,320px)]">
                <MotionOrb
                  className="h-full w-full"
                  agentState={agentState}
                  colors={colors}
                  seed={seed}
                  tweak={tweak}
                  thinkingVariant={thinkingVariant}
                />
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{stateLabel}</p>
            </div>
          </figure>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Shared border</h2>
              <div className="flex gap-2">
                <Button type="button" size="xs" variant="outline" onClick={resetState}>
                  Reset {stateLabel}
                </Button>
                <Button type="button" size="xs" variant="outline" onClick={copyValues}>
                  {copied ? "Copied" : "Copy values"}
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {SHARED_KEYS.map((key) => (
                <Slider
                  key={key}
                  label={SLIDER_META[key].label}
                  value={tweak[key]}
                  min={SLIDER_META[key].min}
                  max={SLIDER_META[key].max}
                  step={SLIDER_META[key].step}
                  onChange={(value) => setTweak(key, value)}
                />
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="text-xs">
                  <span className="text-muted-foreground mb-1.5 block">Color 1</span>
                  <input
                    type="color"
                    value={colors[0]}
                    onChange={(event) => setColors([event.target.value, colors[1]])}
                    className="h-8 w-full cursor-pointer rounded-md border bg-transparent"
                  />
                </label>
                <label className="text-xs">
                  <span className="text-muted-foreground mb-1.5 block">Color 2</span>
                  <input
                    type="color"
                    value={colors[1]}
                    onChange={(event) => setColors([colors[0], event.target.value])}
                    className="h-8 w-full cursor-pointer rounded-md border bg-transparent"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="mb-4 text-sm font-semibold">{stateLabel} only</h2>
            <div className="space-y-4">
              {STATE_KEYS[agentState].map((key) => (
                <Slider
                  key={key}
                  label={SLIDER_META[key].label}
                  value={tweak[key]}
                  min={SLIDER_META[key].min}
                  max={SLIDER_META[key].max}
                  step={SLIDER_META[key].step}
                  onChange={(value) => setTweak(key, value)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
