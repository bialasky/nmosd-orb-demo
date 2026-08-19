"use client"

import { useEffect, useRef } from "react"

export type MotionOrbState = "idle" | "listening" | "thinking" | "speaking"

export type ThinkingVariant = "flow" | "orbit" | "ripple" | "weave"

export const DEFAULT_ORB_COLORS: [string, string] = ["#E8B44A", "#C084FC"]

export const ORB_COLOR_PRESETS: [string, string][] = [
  ["#E8B44A", "#C084FC"],
  ["#CADCFC", "#A0B9D1"],
  ["#F6E7D8", "#E0CFC2"],
]

type Rgb = [number, number, number]

type Palette = {
  warm: Rgb
  cool: Rgb
  cream: Rgb
}

export type OrbTweak = {
  radius: number
  borderWidth: number
  borderGlow: number
  borderMix: number
  micScale: number
  micStroke: number
  idleShadow: number
  polarAmp: number
  polarThick: number
  polarSpeed: number
  polarInset: number
  polarAlpha: number
  waveAmp: number
  waveSpread: number
  waveSpeed: number
  waveThick: number
  waveAlpha: number
  centerline: number
}

export const DEFAULT_ORB_TWEAK: OrbTweak = {
  radius: 0.395,
  borderWidth: 1.26,
  borderGlow: 1.34,
  borderMix: 0.42,
  micScale: 1,
  micStroke: 1,
  idleShadow: 1,
  polarAmp: 1,
  polarThick: 1,
  polarSpeed: 1,
  polarInset: 0,
  polarAlpha: 1,
  waveAmp: 1,
  waveSpread: 0.72,
  waveSpeed: 1,
  waveThick: 1,
  waveAlpha: 1,
  centerline: 1,
}

export const STATE_TWEAK_DEFAULTS: Record<MotionOrbState, OrbTweak> = {
  idle: {
    ...DEFAULT_ORB_TWEAK,
    waveAmp: 0.2,
    waveSpread: 0.28,
  },
  listening: {
    ...DEFAULT_ORB_TWEAK,
    polarAmp: 1,
    polarThick: 1,
    polarInset: 0,
    polarAlpha: 1,
    waveAmp: 0.3,
    waveSpread: 0.3,
  },
  thinking: {
    ...DEFAULT_ORB_TWEAK,
    waveAmp: 2.1,
    waveSpread: 0.94,
    waveSpeed: 0.9,
    waveThick: 1.12,
    waveAlpha: 0.92,
    centerline: 1.64,
  },
  speaking: {
    ...DEFAULT_ORB_TWEAK,
    waveAmp: 1.7,
    waveSpread: 0.55,
    waveSpeed: 1.15,
    centerline: 1.3,
  },
}

type MotionOrbProps = {
  state?: MotionOrbState
  agentState?: MotionOrbState
  colors?: [string, string]
  seed?: number
  tweak?: OrbTweak
  thinkingVariant?: ThinkingVariant
  className?: string
}

type Visual = {
  idle: number
  polar: number
  waves: number
  think: number
  glow: number
}

type BandMode = "gold" | "violet" | "magenta" | "cream" | "deep"

type SilkSheet = {
  f1: number
  f2: number
  f3: number
  s1: number
  s2: number
  s3: number
  phase: number
  reach: number
  base: number
  alpha: number
  edgeAlpha: number
  mode: "cream" | "deep" | "lavender" | "pink"
}

const SILK_SHEETS: SilkSheet[] = [
  { f1: 3, f2: 5, f3: 8, s1: 0.5, s2: 0.34, s3: 0.75, phase: 0.4, reach: 1.6, base: 0.16, alpha: 0.65, edgeAlpha: 0.8, mode: "cream" },
  { f1: 4, f2: 7, f3: 10, s1: 0.42, s2: 0.6, s3: 0.3, phase: 2.3, reach: 2.3, base: 0.2, alpha: 0.66, edgeAlpha: 0.4, mode: "deep" },
  { f1: 2, f2: 5, f3: 9, s1: 0.62, s2: 0.4, s3: 0.52, phase: 4.2, reach: 1.8, base: 0.12, alpha: 0.44, edgeAlpha: 0.7, mode: "lavender" },
  { f1: 5, f2: 8, f3: 11, s1: 0.36, s2: 0.55, s3: 0.42, phase: 1.3, reach: 1.3, base: 0.1, alpha: 0.36, edgeAlpha: 0.85, mode: "pink" },
  { f1: 3, f2: 6, f3: 9, s1: 0.55, s2: 0.3, s3: 0.62, phase: 5.4, reach: 1.9, base: 0.14, alpha: 0.3, edgeAlpha: 0.6, mode: "lavender" },
]

export function parseOrbHex(hex: string): Rgb {
  const raw = hex.trim().replace("#", "")
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [232, 180, 74]
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbCss(rgb: Rgb, alpha = 1) {
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${alpha})`
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function paletteFrom(colors: [string, string]): Palette {
  const warm = parseOrbHex(colors[0])
  const cool = parseOrbHex(colors[1])
  return {
    warm,
    cool,
    cream: mixRgb(warm, [255, 248, 230], 0.55),
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function damp(current: number, target: number, dt: number, lambda: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

function preset(state: MotionOrbState): Visual {
  switch (state) {
    case "idle":
      return { idle: 1, polar: 0, waves: 0, think: 0, glow: 0.75 }
    case "listening":
      return { idle: 0, polar: 1, waves: 0, think: 0, glow: 1.55 }
    case "thinking":
      return { idle: 0, polar: 0, waves: 0, think: 1, glow: 1 }
    case "speaking":
      return { idle: 0, polar: 0, waves: 1, think: 0, glow: 1.1 }
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}

function waveGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  r: number,
  palette: Palette,
  alpha: number
) {
  const gradient = ctx.createLinearGradient(cx - r, 0, cx + r, 0)
  const mid = mixRgb(palette.warm, palette.cool, 0.5)
  gradient.addColorStop(0, rgbCss(palette.warm, alpha))
  gradient.addColorStop(0.32, rgbCss(mixRgb(palette.warm, mid, 0.45), alpha))
  gradient.addColorStop(0.55, rgbCss(mid, alpha))
  gradient.addColorStop(0.78, rgbCss(mixRgb(mid, palette.cool, 0.4), alpha))
  gradient.addColorStop(1, rgbCss(palette.cool, alpha))
  return gradient
}

function bandGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  r: number,
  palette: Palette,
  alpha: number,
  mode: BandMode
) {
  const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0)
  switch (mode) {
    case "gold": {
      const gold = mixRgb(palette.warm, [255, 198, 74], 0.6)
      const mauve = mixRgb(palette.warm, palette.cool, 0.55)
      g.addColorStop(0, rgbCss(gold, alpha))
      g.addColorStop(0.4, rgbCss(mixRgb(gold, mauve, 0.55), alpha * 0.85))
      g.addColorStop(1, rgbCss(palette.cool, alpha * 0.6))
      return g
    }
    case "violet": {
      const vivid = mixRgb(palette.cool, [140, 52, 255], 0.62)
      const mauve = mixRgb(palette.warm, palette.cool, 0.6)
      g.addColorStop(0, rgbCss(mixRgb(palette.warm, mauve, 0.5), alpha * 0.6))
      g.addColorStop(0.45, rgbCss(mixRgb(mauve, vivid, 0.6), alpha))
      g.addColorStop(1, rgbCss(vivid, alpha))
      return g
    }
    case "magenta": {
      const pink = mixRgb(palette.cool, [255, 96, 208], 0.38)
      g.addColorStop(0, rgbCss(palette.warm, alpha * 0.6))
      g.addColorStop(0.55, rgbCss(pink, alpha))
      g.addColorStop(1, rgbCss(mixRgb(pink, palette.cool, 0.55), alpha * 0.9))
      return g
    }
    case "cream": {
      const cream = mixRgb(palette.cream, [255, 250, 240], 0.6)
      const lav = mixRgb(palette.cool, [236, 220, 255], 0.6)
      g.addColorStop(0, rgbCss(cream, alpha))
      g.addColorStop(0.55, rgbCss(mixRgb(cream, lav, 0.6), alpha * 0.85))
      g.addColorStop(1, rgbCss(lav, alpha * 0.7))
      return g
    }
    case "deep": {
      const brown = mixRgb(palette.warm, [112, 44, 14], 0.78)
      const plum = mixRgb(palette.cool, [64, 18, 122], 0.75)
      g.addColorStop(0, rgbCss(brown, alpha))
      g.addColorStop(0.5, rgbCss(mixRgb(brown, plum, 0.55), alpha * 0.92))
      g.addColorStop(1, rgbCss(plum, alpha))
      return g
    }
    default: {
      const _exhaustive: never = mode
      return _exhaustive
    }
  }
}

function drawOrbBorder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: Palette,
  glow: number,
  tweak: OrbTweak
) {
  const rim = mixRgb(palette.cool, [236, 228, 255], tweak.borderMix)

  ctx.save()
  const halo = Math.max(0, glow - 1)
  if (halo > 0.05) {
    const reach = r * (1.14 + 0.3 * halo)
    const ring = ctx.createRadialGradient(cx, cy, r * 0.88, cx, cy, reach)
    ring.addColorStop(0, rgbCss(palette.cool, 0))
    ring.addColorStop(0.3, rgbCss(mixRgb(palette.cool, [232, 214, 255], 0.55), 0.5 * halo))
    ring.addColorStop(0.5, rgbCss(mixRgb(palette.cool, [210, 180, 255], 0.4), 0.26 * halo))
    ring.addColorStop(1, rgbCss(palette.cool, 0))
    ctx.fillStyle = ring
    ctx.beginPath()
    ctx.arc(cx, cy, reach, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowColor = rgbCss(palette.cool, 0.8)
  ctx.shadowBlur = r * 0.34 * tweak.borderGlow * glow
  ctx.strokeStyle = rgbCss(rim, 0.3 * Math.min(1.4, glow))
  ctx.lineWidth = r * 0.055 * tweak.borderWidth
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.shadowBlur = r * 0.12 * tweak.borderGlow * glow
  ctx.strokeStyle = rgbCss(
    mixRgb(rim, [255, 253, 255], Math.min(0.85, Math.max(0, glow - 1) * 1.2)),
    0.95
  )
  ctx.lineWidth = Math.max(1.6, r * 0.02 * tweak.borderWidth)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawGoldArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: Palette,
  alpha: number,
  tweak: OrbTweak
) {
  if (alpha < 0.02) return
  const start = Math.PI * 0.98
  const end = Math.PI * 1.42
  const gold = mixRgb(palette.warm, [255, 214, 128], 0.35)

  ctx.save()
  ctx.lineCap = "round"
  ctx.shadowColor = rgbCss(palette.warm, 0.7 * alpha)
  ctx.shadowBlur = r * 0.2
  ctx.strokeStyle = rgbCss(gold, 0.5 * alpha)
  ctx.lineWidth = r * 0.055 * tweak.borderWidth
  ctx.beginPath()
  ctx.arc(cx, cy, r, start, end)
  ctx.stroke()

  ctx.shadowBlur = r * 0.08
  ctx.strokeStyle = rgbCss(mixRgb(gold, [255, 240, 200], 0.4), 0.95 * alpha)
  ctx.lineWidth = Math.max(1.8, r * 0.024 * tweak.borderWidth)
  ctx.beginPath()
  ctx.arc(cx, cy, r, start + 0.04, end - 0.04)
  ctx.stroke()
  ctx.restore()
}

function drawSphere(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number
) {
  if (alpha < 0.02) return
  const fill = ctx.createRadialGradient(cx, cy - r * 0.18, r * 0.08, cx, cy, r)
  fill.addColorStop(0, `rgb(48 42 78 / ${0.22 * alpha})`)
  fill.addColorStop(0.55, `rgb(16 18 32 / ${0.18 * alpha})`)
  fill.addColorStop(1, `rgb(8 10 20 / ${0.08 * alpha})`)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function drawIdle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number,
  tweak: OrbTweak
) {
  if (alpha < 0.02) return
  ctx.save()
  ctx.globalAlpha = alpha
  const disc = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
  disc.addColorStop(0, "rgb(18 22 34)")
  disc.addColorStop(0.78, "rgb(14 18 28)")
  disc.addColorStop(1, "rgb(10 13 22)")
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.strokeStyle = `rgb(0 0 0 / ${0.4 * tweak.idleShadow})`
  ctx.lineWidth = r * 0.1 * tweak.idleShadow
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawMic(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  palette: Palette,
  alpha: number,
  tweak: OrbTweak
) {
  if (alpha < 0.05) return
  const color = mixRgb(palette.cool, [230, 220, 255], 0.4)
  const scale = r * 0.00115 * tweak.micScale
  ctx.save()
  ctx.translate(cx, cy + r * 0.02)
  ctx.scale(scale, scale)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = rgbCss(color, 0.92)
  ctx.lineWidth = 18 * tweak.micStroke
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  ctx.beginPath()
  ctx.roundRect(-42, -118, 84, 168, 42)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 40, 78, 0.08 * Math.PI, 0.92 * Math.PI)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, 118)
  ctx.lineTo(0, 168)
  ctx.stroke()
  ctx.restore()
}

function drawCenterline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number
) {
  if (alpha < 0.02) return
  const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
  gradient.addColorStop(0, "rgb(255 255 255 / 0)")
  gradient.addColorStop(0.18, `rgb(255 255 255 / ${0.45 * alpha})`)
  gradient.addColorStop(0.5, `rgb(255 255 255 / ${0.95 * alpha})`)
  gradient.addColorStop(0.82, `rgb(255 255 255 / ${0.45 * alpha})`)
  gradient.addColorStop(1, "rgb(255 255 255 / 0)")
  ctx.strokeStyle = gradient
  ctx.lineWidth = Math.max(1, r * 0.01)
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.94, cy)
  ctx.lineTo(cx + r * 0.94, cy)
  ctx.stroke()
}

function drawGlowSpot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: Rgb,
  alpha: number
) {
  if (alpha < 0.02) return
  const spot = ctx.createRadialGradient(x, y, 0, x, y, radius)
  spot.addColorStop(0, rgbCss(color, alpha))
  spot.addColorStop(0.55, rgbCss(color, alpha * 0.35))
  spot.addColorStop(1, rgbCss(color, 0))
  ctx.fillStyle = spot
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

// Tight, syllabic silk sheets for speaking. Same construction as the
// thinking flow but hugging the centerline with more, faster lobes.
const SPEAK_SHEETS: FlowSheet[] = [
  {
    top: { off: -0.07, amp: 0.11, f1: 3.4, f2: 6.2, s1: 2.6, s2: 3.4, phase: 0.5 },
    bottom: { off: 0.16, amp: 0.12, f1: 3.8, f2: 6.8, s1: 3.0, s2: 2.3, phase: 3.2 },
    alpha: 0.5,
    edgeAlpha: 0.35,
    mode: "deep",
  },
  {
    top: { off: -0.13, amp: 0.13, f1: 3.1, f2: 5.6, s1: 2.8, s2: 3.7, phase: 1.4 },
    bottom: { off: 0.03, amp: 0.1, f1: 3.6, f2: 6.4, s1: 2.4, s2: 3.1, phase: 4.8 },
    alpha: 0.34,
    edgeAlpha: 0.6,
    mode: "gold",
  },
  {
    top: { off: -0.05, amp: 0.09, f1: 4.2, f2: 7.6, s1: 3.2, s2: 2.5, phase: 2.3 },
    bottom: { off: 0.09, amp: 0.1, f1: 3.9, f2: 7.1, s1: 2.7, s2: 3.5, phase: 5.6 },
    alpha: 0.3,
    edgeAlpha: 0.85,
    mode: "cream",
  },
  {
    top: { off: -0.02, amp: 0.12, f1: 4.4, f2: 6.9, s1: 2.5, s2: 3.3, phase: 3.1 },
    bottom: { off: 0.13, amp: 0.11, f1: 3.5, f2: 6.1, s1: 3.1, s2: 2.2, phase: 0.3 },
    alpha: 0.28,
    edgeAlpha: 0.65,
    mode: "magenta",
  },
  {
    top: { off: -0.11, amp: 0.12, f1: 3.7, f2: 7.3, s1: 2.9, s2: 2.2, phase: 4.3 },
    bottom: { off: 0.02, amp: 0.13, f1: 3.3, f2: 5.9, s1: 2.6, s2: 3.6, phase: 1.9 },
    alpha: 0.3,
    edgeAlpha: 0.7,
    mode: "violet",
  },
]

// Simulated speech loudness: fast syllable flutter gated by slower phrase
// bursts, dipping near-silent between phrases but never fully dead.
function voiceEnvelope(t: number) {
  const syllable =
    0.62 + 0.38 * Math.sin(t * 7.1) * Math.sin(t * 4.7 + 0.6)
  const phrase =
    0.5 + 0.5 * Math.sin(t * 0.8) + 0.3 * Math.sin(t * 0.33 + 1.7)
  const gate = Math.pow(Math.min(1, Math.max(0, phrase)), 0.8)
  return (0.18 + 0.82 * gate) * syllable
}

function speakEdgeY(
  nx: number,
  t: number,
  edge: FlowEdge,
  seed: number,
  spread: number,
  amp: number,
  voice: number
) {
  const chord = Math.sqrt(Math.max(0, 1 - nx * nx))
  const c = (nx - 0.15) / 0.5
  const env = Math.pow(chord, 0.85) * (1 + 0.3 * Math.exp(-c * c))
  const p = edge.phase + seed * 0.013
  const wave =
    Math.sin(nx * edge.f1 - t * edge.s1 + p) * 0.62 +
    Math.sin(nx * edge.f2 - t * edge.s2 + p * 1.9) * 0.38
  return (
    (edge.off * spread * (0.6 + 0.4 * voice) +
      wave * edge.amp * amp * voice) *
    env
  )
}

function drawSilkWaves(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  seed: number,
  waves: number,
  palette: Palette,
  tweak: OrbTweak
) {
  if (waves < 0.03) return
  const time = t * tweak.waveSpeed
  const amp = waves * tweak.waveAmp
  const spread = tweak.waveSpread * 1.4
  const voice = voiceEnvelope(time)
  const steps = 110

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.985, 0, Math.PI * 2)
  ctx.clip()

  for (const sheet of SPEAK_SHEETS) {
    const alpha = sheet.alpha * waves * tweak.waveAlpha * (0.55 + 0.45 * voice)
    const topPts: [number, number][] = []
    const botPts: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const nx = -1 + (2 * i) / steps
      const x = cx + nx * r
      topPts.push([
        x,
        cy + speakEdgeY(nx, time, sheet.top, seed, spread, amp, voice) * r,
      ])
      botPts.push([
        x,
        cy +
          speakEdgeY(nx, time, sheet.bottom, seed + 40, spread, amp, voice) * r,
      ])
    }

    ctx.globalCompositeOperation =
      sheet.mode === "deep" ? "source-over" : "lighter"
    ctx.beginPath()
    for (let i = 0; i < topPts.length; i++) {
      const [x, y] = topPts[i]
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let i = botPts.length - 1; i >= 0; i--) {
      ctx.lineTo(botPts[i][0], botPts[i][1])
    }
    ctx.closePath()
    ctx.fillStyle = bandGradient(ctx, cx, r, palette, alpha, sheet.mode)
    ctx.fill()

    ctx.globalCompositeOperation = "lighter"
    ctx.shadowColor = rgbCss(
      mixRgb(palette.cool, [220, 190, 255], 0.5),
      alpha * 0.8
    )
    ctx.shadowBlur = r * 0.045
    ctx.strokeStyle = bandGradient(
      ctx,
      cx,
      r,
      palette,
      Math.min(1, alpha * sheet.edgeAlpha * 2.2),
      sheet.mode === "deep" ? "violet" : sheet.mode
    )
    ctx.lineWidth = Math.max(1.1, r * 0.009 * tweak.waveThick)
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    for (const pts of [topPts, botPts]) {
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }

  drawGlowSpot(
    ctx,
    cx - r * 0.72,
    cy,
    r * 0.3,
    mixRgb(palette.warm, [255, 236, 190], 0.45),
    (0.14 + 0.16 * voice) * waves * tweak.waveAlpha
  )

  drawCenterline(
    ctx,
    cx,
    cy,
    r,
    waves * tweak.centerline * (0.5 + 0.5 * voice)
  )
  ctx.restore()
}

type FlowEdge = {
  off: number
  amp: number
  f1: number
  f2: number
  s1: number
  s2: number
  phase: number
}

type FlowSheet = {
  top: FlowEdge
  bottom: FlowEdge
  alpha: number
  edgeAlpha: number
  mode: BandMode
}

// Broad silk sheets spanning the sphere, same recipe as the listening
// ribbons but in Cartesian space. Every sine travels rightward (nx*f - t*s)
// so the whole field reads as information flowing left -> right.
const FLOW_SHEETS: FlowSheet[] = [
  {
    top: { off: -0.16, amp: 0.17, f1: 2.2, f2: 4.1, s1: 1.7, s2: 2.4, phase: 0.6 },
    bottom: { off: 0.34, amp: 0.18, f1: 2.6, f2: 4.6, s1: 2.0, s2: 1.5, phase: 3.4 },
    alpha: 0.5,
    edgeAlpha: 0.35,
    mode: "deep",
  },
  {
    top: { off: -0.3, amp: 0.2, f1: 2.0, f2: 3.6, s1: 1.9, s2: 2.7, phase: 1.2 },
    bottom: { off: 0.08, amp: 0.17, f1: 2.5, f2: 4.3, s1: 1.5, s2: 2.2, phase: 4.6 },
    alpha: 0.34,
    edgeAlpha: 0.6,
    mode: "gold",
  },
  {
    top: { off: -0.11, amp: 0.15, f1: 2.4, f2: 4.8, s1: 2.2, s2: 1.6, phase: 2.1 },
    bottom: { off: 0.15, amp: 0.16, f1: 2.1, f2: 3.9, s1: 1.8, s2: 2.5, phase: 5.3 },
    alpha: 0.3,
    edgeAlpha: 0.85,
    mode: "cream",
  },
  {
    top: { off: -0.05, amp: 0.2, f1: 2.7, f2: 4.4, s1: 1.6, s2: 2.3, phase: 3.0 },
    bottom: { off: 0.3, amp: 0.17, f1: 2.3, f2: 4.0, s1: 2.1, s2: 1.4, phase: 0.2 },
    alpha: 0.28,
    edgeAlpha: 0.65,
    mode: "magenta",
  },
  {
    top: { off: -0.26, amp: 0.18, f1: 2.5, f2: 4.7, s1: 2.0, s2: 1.4, phase: 4.1 },
    bottom: { off: 0.03, amp: 0.2, f1: 2.2, f2: 3.7, s1: 1.7, s2: 2.6, phase: 1.8 },
    alpha: 0.3,
    edgeAlpha: 0.7,
    mode: "violet",
  },
]

// Height profile matching the reference: medium waves entering on the
// left, a low waist just before center, tallest billows on the right.
function flowProfile(nx: number) {
  const w = (nx + 0.05) / 0.4
  const waist = Math.exp(-w * w)
  const rise = 0.5 + 0.5 * Math.tanh((nx - 0.3) / 0.3)
  return 0.74 - 0.3 * waist + 0.55 * rise
}

function flowEdgeY(
  nx: number,
  t: number,
  edge: FlowEdge,
  seed: number,
  spread: number,
  amp: number
) {
  const chord = Math.sqrt(Math.max(0, 1 - nx * nx))
  const env = Math.pow(chord, 0.5)
  const prof = flowProfile(nx)
  const p = edge.phase + seed * 0.013
  // Slow incommensurate drifts keep the lobes from ever repeating cleanly.
  const m1 = 0.72 + 0.28 * Math.sin(t * 0.23 + p * 2.3)
  const m2 = 0.72 + 0.28 * Math.sin(t * 0.31 + p * 1.1)
  const m3 = 0.6 + 0.4 * Math.sin(t * 0.17 + p * 3.1)
  const wave =
    Math.sin(nx * edge.f1 - t * edge.s1 + p) * 0.5 * m1 +
    Math.sin(nx * edge.f2 - t * edge.s2 + p * 1.9) * 0.32 * m2 +
    Math.sin(nx * edge.f1 * 1.73 - t * edge.s1 * 0.61 + p * 3.7) * 0.3 * m3
  return (
    (edge.off * spread * (0.55 + 0.45 * prof) +
      wave * edge.amp * amp * prof) *
    env
  )
}

function drawThinkingFlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  seed: number,
  think: number,
  palette: Palette,
  tweak: OrbTweak
) {
  const time = t * tweak.waveSpeed
  const amp = think * tweak.waveAmp
  const spread = tweak.waveSpread * 1.4
  const steps = 110

  for (const sheet of FLOW_SHEETS) {
    const alpha = sheet.alpha * think * tweak.waveAlpha
    const topPts: [number, number][] = []
    const botPts: [number, number][] = []
    for (let i = 0; i <= steps; i++) {
      const nx = -1 + (2 * i) / steps
      const x = cx + nx * r
      topPts.push([
        x,
        cy + flowEdgeY(nx, time, sheet.top, seed, spread, amp) * r,
      ])
      botPts.push([
        x,
        cy + flowEdgeY(nx, time, sheet.bottom, seed + 40, spread, amp) * r,
      ])
    }

    ctx.globalCompositeOperation =
      sheet.mode === "deep" ? "source-over" : "lighter"
    ctx.beginPath()
    for (let i = 0; i < topPts.length; i++) {
      const [x, y] = topPts[i]
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    for (let i = botPts.length - 1; i >= 0; i--) {
      ctx.lineTo(botPts[i][0], botPts[i][1])
    }
    ctx.closePath()
    ctx.fillStyle = bandGradient(ctx, cx, r, palette, alpha, sheet.mode)
    ctx.fill()

    ctx.globalCompositeOperation = "lighter"
    ctx.shadowColor = rgbCss(
      mixRgb(palette.cool, [220, 190, 255], 0.5),
      alpha * 0.8
    )
    ctx.shadowBlur = r * 0.045
    ctx.strokeStyle = bandGradient(
      ctx,
      cx,
      r,
      palette,
      Math.min(1, alpha * sheet.edgeAlpha * 2.2),
      sheet.mode === "deep" ? "violet" : sheet.mode
    )
    ctx.lineWidth = Math.max(1.1, r * 0.009 * tweak.waveThick)
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    for (const pts of [topPts, botPts]) {
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i]
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.shadowBlur = 0
  }

  drawCenterline(ctx, cx, cy, r, think * tweak.centerline * 0.3)
  ctx.globalCompositeOperation = "source-over"
}

function drawThinkingOrbit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  think: number,
  palette: Palette,
  tweak: OrbTweak
) {
  const speed = tweak.waveSpeed
  const scaleR = tweak.waveSpread / 0.72
  const gold = mixRgb(palette.warm, [255, 224, 150], 0.4)
  const violet = mixRgb(palette.cool, [176, 118, 255], 0.35)
  const cream = mixRgb(palette.cream, [255, 250, 240], 0.5)
  const comets = [
    { rad: 0.68, sp: 0.55, phase: 0, size: 0.05, tint: gold },
    { rad: 0.52, sp: -0.4, phase: 2.4, size: 0.038, tint: violet },
    { rad: 0.8, sp: 0.42, phase: 4.2, size: 0.032, tint: cream },
  ]

  ctx.globalCompositeOperation = "lighter"
  for (const comet of comets) {
    const rad =
      r * comet.rad * scaleR * (1 + 0.03 * Math.sin(t * 0.8 + comet.phase))

    ctx.strokeStyle = rgbCss(comet.tint, 0.05 * think * tweak.waveAlpha)
    ctx.lineWidth = Math.max(1, r * 0.004)
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.stroke()

    const baseAngle = t * comet.sp * speed * 1.6 + comet.phase
    const dir = Math.sign(comet.sp) || 1
    const segments = 26
    let prevX = cx + Math.cos(baseAngle) * rad
    let prevY = cy + Math.sin(baseAngle) * rad
    for (let i = 1; i <= segments; i++) {
      const a = baseAngle - dir * i * 0.055
      const x = cx + Math.cos(a) * rad
      const y = cy + Math.sin(a) * rad
      const fade = Math.pow(1 - i / segments, 1.7)
      ctx.strokeStyle = rgbCss(comet.tint, fade * 0.5 * think * tweak.waveAlpha)
      ctx.lineWidth = Math.max(1, r * comet.size * fade * tweak.waveThick)
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(x, y)
      ctx.stroke()
      prevX = x
      prevY = y
    }

    const headX = cx + Math.cos(baseAngle) * rad
    const headY = cy + Math.sin(baseAngle) * rad
    drawGlowSpot(
      ctx,
      headX,
      headY,
      r * comet.size * 2.6,
      comet.tint,
      0.5 * think * tweak.waveAlpha
    )
    ctx.fillStyle = rgbCss(comet.tint, 0.95 * think * tweak.waveAlpha)
    ctx.beginPath()
    ctx.arc(headX, headY, Math.max(1.4, r * comet.size * 0.55 * tweak.waveAmp), 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawThinkingRipple(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  think: number,
  palette: Palette,
  tweak: OrbTweak
) {
  const speed = Math.max(0.15, tweak.waveSpeed)
  const period = 2.8 / speed
  const rings = 3
  const scaleR = tweak.waveSpread / 0.72
  const cream = mixRgb(palette.cream, [255, 250, 240], 0.5)

  ctx.globalCompositeOperation = "lighter"
  for (let i = 0; i < rings; i++) {
    const u = (t / period + i / rings) % 1
    const eased = u * u * (3 - 2 * u)
    const rad = r * (0.92 - 0.7 * eased) * scaleR
    const alpha =
      Math.pow(Math.sin(Math.PI * u), 1.3) * 0.45 * think * tweak.waveAlpha
    if (alpha < 0.01 || rad < r * 0.05) continue
    ctx.strokeStyle = waveGradient(ctx, cx, r, palette, alpha)
    ctx.lineWidth = Math.max(1.2, r * 0.018 * (1 - eased * 0.45) * tweak.waveThick)
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.stroke()
  }

  const corePulse = Math.pow(
    0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2),
    1.6
  )
  drawGlowSpot(
    ctx,
    cx,
    cy,
    r * 0.26 * tweak.waveAmp,
    cream,
    (0.12 + 0.28 * corePulse) * think * tweak.waveAlpha
  )
}

function drawThinkingWeave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  think: number,
  palette: Palette,
  tweak: OrbTweak
) {
  const speed = tweak.waveSpeed
  const phase1 = t * 0.45 * speed
  const phase2 = t * 0.58 * speed
  const sizeScale = (tweak.waveSpread / 0.72) * (0.6 + 0.4 * tweak.waveAmp)
  const ampX = r * 0.66 * sizeScale
  const ampY = r * 0.5 * sizeScale
  const points = 220
  const cream = mixRgb(palette.cream, [255, 250, 240], 0.5)

  const pointAt = (s: number): [number, number] => [
    cx + Math.sin(3 * s + phase1) * ampX,
    cy + Math.sin(2 * s + phase2) * ampY,
  ]

  const traceCurve = (from: number, to: number, samples: number) => {
    ctx.beginPath()
    for (let i = 0; i <= samples; i++) {
      const s = from + ((to - from) * i) / samples
      const [x, y] = pointAt(s)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }

  ctx.globalCompositeOperation = "lighter"
  ctx.lineJoin = "round"
  ctx.lineCap = "round"

  ctx.filter = `blur(${Math.max(1.5, r * 0.01)}px)`
  traceCurve(0, Math.PI * 2, points)
  ctx.strokeStyle = waveGradient(ctx, cx, r, palette, 0.2 * think * tweak.waveAlpha)
  ctx.lineWidth = Math.max(2, r * 0.02 * tweak.waveThick)
  ctx.stroke()
  ctx.filter = "none"

  traceCurve(0, Math.PI * 2, points)
  ctx.strokeStyle = waveGradient(ctx, cx, r, palette, 0.55 * think * tweak.waveAlpha)
  ctx.lineWidth = Math.max(1.1, r * 0.006 * tweak.waveThick)
  ctx.stroke()

  const pen = (t * 0.9 * speed) % (Math.PI * 2)
  traceCurve(pen - 0.6, pen, 30)
  ctx.strokeStyle = rgbCss(cream, 0.6 * think * tweak.waveAlpha)
  ctx.lineWidth = Math.max(1.4, r * 0.01 * tweak.waveThick)
  ctx.stroke()

  const [penX, penY] = pointAt(pen)
  drawGlowSpot(ctx, penX, penY, r * 0.1, cream, 0.5 * think * tweak.waveAlpha)
  ctx.fillStyle = rgbCss(cream, 0.95 * think * tweak.waveAlpha)
  ctx.beginPath()
  ctx.arc(penX, penY, Math.max(1.4, r * 0.014), 0, Math.PI * 2)
  ctx.fill()
}

function drawThinking(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  seed: number,
  think: number,
  palette: Palette,
  tweak: OrbTweak,
  variant: ThinkingVariant
) {
  if (think < 0.03) return
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.985, 0, Math.PI * 2)
  ctx.clip()
  switch (variant) {
    case "flow":
      drawThinkingFlow(ctx, cx, cy, r, t, seed, think, palette, tweak)
      break
    case "orbit":
      drawThinkingOrbit(ctx, cx, cy, r, t, think, palette, tweak)
      break
    case "ripple":
      drawThinkingRipple(ctx, cx, cy, r, t, think, palette, tweak)
      break
    case "weave":
      drawThinkingWeave(ctx, cx, cy, r, t, think, palette, tweak)
      break
    default: {
      const _exhaustive: never = variant
      return _exhaustive
    }
  }
  ctx.restore()
}

function silkDepth(
  angle: number,
  t: number,
  sheet: SilkSheet,
  seed: number,
  speed: number
) {
  const s = t * speed
  const p = sheet.phase + seed * 0.013
  const w =
    Math.sin(angle * sheet.f1 + s * sheet.s1 + p) * 0.55 +
    Math.sin(angle * sheet.f2 - s * sheet.s2 + p * 1.7) * 0.3 +
    Math.sin(angle * sheet.f3 + s * sheet.s3 + p * 0.45) * 0.15
  const n = w * 0.5 + 0.5
  return sheet.base + Math.pow(n, 2.2) * sheet.reach
}

function sheetConic(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: Palette,
  alpha: number,
  mode: SilkSheet["mode"]
) {
  const g = ctx.createConicGradient(-Math.PI / 2, cx, cy)
  switch (mode) {
    case "cream": {
      const cream = mixRgb(palette.cream, [255, 252, 246], 0.72)
      const soft = mixRgb(palette.cool, [238, 224, 255], 0.6)
      g.addColorStop(0, rgbCss(cream, alpha))
      g.addColorStop(0.22, rgbCss(soft, alpha * 0.72))
      g.addColorStop(0.5, rgbCss(mixRgb(cream, palette.cool, 0.35), alpha * 0.6))
      g.addColorStop(0.78, rgbCss(soft, alpha * 0.72))
      g.addColorStop(1, rgbCss(cream, alpha))
      return g
    }
    case "deep": {
      const deep = mixRgb(palette.cool, [38, 14, 74], 0.8)
      const mid = mixRgb(palette.cool, [84, 42, 140], 0.6)
      g.addColorStop(0, rgbCss(mid, alpha * 0.8))
      g.addColorStop(0.2, rgbCss(deep, alpha))
      g.addColorStop(0.45, rgbCss(mixRgb(deep, [30, 14, 58], 0.4), alpha * 0.95))
      g.addColorStop(0.7, rgbCss(deep, alpha))
      g.addColorStop(1, rgbCss(mid, alpha * 0.8))
      return g
    }
    case "lavender": {
      const lav = mixRgb(palette.cool, [214, 186, 255], 0.5)
      const dim = mixRgb(palette.cool, [130, 90, 190], 0.4)
      g.addColorStop(0, rgbCss(lav, alpha))
      g.addColorStop(0.3, rgbCss(dim, alpha * 0.8))
      g.addColorStop(0.55, rgbCss(lav, alpha * 0.9))
      g.addColorStop(0.8, rgbCss(dim, alpha * 0.8))
      g.addColorStop(1, rgbCss(lav, alpha))
      return g
    }
    case "pink": {
      const pink = mixRgb(palette.cool, [255, 198, 226], 0.42)
      const rose = mixRgb(palette.cool, [220, 140, 200], 0.35)
      g.addColorStop(0, rgbCss(pink, alpha))
      g.addColorStop(0.35, rgbCss(rose, alpha * 0.75))
      g.addColorStop(0.6, rgbCss(pink, alpha * 0.85))
      g.addColorStop(0.85, rgbCss(rose, alpha * 0.75))
      g.addColorStop(1, rgbCss(pink, alpha))
      return g
    }
    default: {
      const _exhaustive: never = mode
      return _exhaustive
    }
  }
}

function drawListeningRibbons(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
  seed: number,
  polar: number,
  palette: Palette,
  tweak: OrbTweak
) {
  if (polar < 0.03) return
  const steps = 220
  const inset = Math.min(0.4, Math.max(0, tweak.polarInset))
  const band = r * 0.2 * tweak.polarThick

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.995, 0, Math.PI * 2)
  ctx.clip()

  for (let si = 0; si < SILK_SHEETS.length; si++) {
    const sheet = SILK_SHEETS[si]
    if (!sheet) continue
    const outerBase = r * (0.99 - inset)
    const alpha = sheet.alpha * polar * tweak.polarAlpha

    ctx.globalCompositeOperation = sheet.mode === "deep" ? "source-over" : "lighter"
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2
      const dOut = silkDepth(a, t * 0.9, sheet, seed + 71, tweak.polarSpeed)
      const rad = outerBase - band * dOut * 0.16 * tweak.polarAmp
      const x = cx + Math.cos(a) * rad
      const y = cy + Math.sin(a) * rad
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    const inner: [number, number][] = []
    for (let i = steps; i >= 0; i--) {
      const a = (i / steps) * Math.PI * 2
      const depth = silkDepth(a, t, sheet, seed, tweak.polarSpeed) * tweak.polarAmp
      const rad = Math.max(r * 0.5, outerBase - band * depth)
      inner.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad])
      ctx.lineTo(inner[inner.length - 1][0], inner[inner.length - 1][1])
    }
    ctx.closePath()
    ctx.fillStyle = sheetConic(ctx, cx, cy, palette, alpha, sheet.mode)
    ctx.fill()

    ctx.globalCompositeOperation = "lighter"
    ctx.beginPath()
    for (let i = 0; i < inner.length; i++) {
      const [x, y] = inner[i]
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.shadowColor = rgbCss(mixRgb(palette.cool, [220, 190, 255], 0.5), alpha * 0.8)
    ctx.shadowBlur = r * 0.045
    ctx.strokeStyle = sheetConic(
      ctx,
      cx,
      cy,
      palette,
      alpha * sheet.edgeAlpha,
      sheet.mode === "deep" ? "lavender" : sheet.mode
    )
    ctx.lineWidth = Math.max(1.1, r * 0.009)
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

const TWEAK_KEYS = Object.keys(DEFAULT_ORB_TWEAK) as (keyof OrbTweak)[]

export function MotionOrb({
  state,
  agentState,
  colors = DEFAULT_ORB_COLORS,
  seed = 1000,
  tweak,
  thinkingVariant = "flow",
  className,
}: MotionOrbProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resolved = agentState ?? state ?? "idle"
  const stateRef = useRef(resolved)
  const colorsRef = useRef(colors)
  const seedRef = useRef(seed)
  const tweakRef = useRef(tweak ?? STATE_TWEAK_DEFAULTS[resolved])
  const variantRef = useRef(thinkingVariant)
  stateRef.current = resolved
  colorsRef.current = colors
  seedRef.current = seed
  tweakRef.current = tweak ?? STATE_TWEAK_DEFAULTS[resolved]
  variantRef.current = thinkingVariant

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const visual: Visual = { ...preset(stateRef.current) }
    const smooth: OrbTweak = { ...tweakRef.current }
    let frame = 0
    let running = true
    let last = performance.now()
    let elapsed = 0.6

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const bounds = wrap.getBoundingClientRect()
      const size = Math.max(1, Math.floor(Math.min(bounds.width, bounds.height)))
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
    }

    const draw = (dt: number) => {
      const target = preset(stateRef.current)
      const tweakTarget = tweakRef.current
      visual.idle = damp(visual.idle, target.idle, dt, 5)
      visual.polar = damp(visual.polar, target.polar, dt, 5)
      visual.waves = damp(visual.waves, target.waves, dt, 5)
      visual.think = damp(visual.think, target.think, dt, 5)
      visual.glow = damp(visual.glow, target.glow, dt, 5)
      for (const key of TWEAK_KEYS) {
        smooth[key] = damp(smooth[key], tweakTarget[key], dt, 7)
      }

      const palette = paletteFrom(colorsRef.current)
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height / 2
      const r = Math.min(width, height) * smooth.radius
      const seed = seedRef.current

      drawIdle(ctx, cx, cy, r, visual.idle, smooth)
      drawSphere(ctx, cx, cy, r, Math.max(visual.waves, visual.think))
      drawListeningRibbons(ctx, cx, cy, r, elapsed, seed, visual.polar, palette, smooth)
      drawSilkWaves(ctx, cx, cy, r, elapsed, seed, visual.waves, palette, smooth)
      drawThinking(ctx, cx, cy, r, elapsed, seed, visual.think, palette, smooth, variantRef.current)
      drawMic(ctx, cx, cy, r, palette, visual.idle, smooth)
      drawOrbBorder(ctx, cx, cy, r, palette, visual.glow, smooth)
      drawGoldArc(ctx, cx, cy, r, palette, visual.idle, smooth)
    }

    resize()
    draw(0)
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)

    if (reduced) {
      return () => observer.disconnect()
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt
      draw(dt)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  )
}
