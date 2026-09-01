"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { Minus, Plus, RotateCcw, Square } from "lucide-react"

import { MotionOrb, type MotionOrbState } from "@/components/motion-orb"
import { cn } from "@/lib/utils"

type WidgetTheme = "dark" | "light"
type View = "idle" | MotionOrbState

const FONT_STEPS = [0.875, 1, 1.125, 1.25] as const
const DISCLAIMER =
  "This prototype is for demonstration only and is not medical advice. Talk with your healthcare team about your own care."

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return reduced
}

function Pill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-[0.62em] font-medium tracking-[0.14em] uppercase",
        className
      )}
    >
      {children}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full text-current outline-none transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-[#b9a4ff] active:scale-[0.96]"
      style={{
        border: "1px solid color-mix(in oklab, currentColor 28%, transparent)",
      }}
    >
      {children}
    </button>
  )
}

export function NoraWidget() {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const timersRef = useRef<number[]>([])
  const reducedMotion = usePrefersReducedMotion()

  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<WidgetTheme>("dark")
  const [fontIndex, setFontIndex] = useState(1)
  const [view, setView] = useState<View>("idle")
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)

  const fontScale = FONT_STEPS[fontIndex] ?? 1
  const isBusy = view === "listening" || view === "thinking" || view === "speaking"
  const orbState: MotionOrbState =
    view === "idle" ? "idle" : view

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  function queue(fn: () => void, ms: number) {
    const timer = window.setTimeout(fn, reducedMotion ? Math.min(ms, 180) : ms)
    timersRef.current.push(timer)
  }

  function resetToIdle() {
    clearTimers()
    setView("idle")
    setTyping(false)
  }

  function runTurn() {
    setTyping(false)
    setView("thinking")
    queue(() => {
      setView("speaking")
      queue(() => setView("idle"), 3200)
    }, 1400)
  }

  function startListening() {
    if (isBusy) return
    clearTimers()
    setInput("")
    setTyping(false)
    setView("listening")
    queue(runTurn, 2200)
  }

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    setInput("")
    clearTimers()
    runTurn()
  }

  function close() {
    resetToIdle()
    setOpen(false)
  }

  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    if (!open) return

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      clearTimers()
      setView("idle")
      setTyping(false)
      setOpen(false)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    if (open && typing) inputRef.current?.focus()
  }, [open, typing])

  const dark = theme === "dark"
  const fontPercent = Math.round(fontScale * 100)

  return (
    <div className="nora-widget pointer-events-none fixed inset-0 z-40">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "pointer-events-auto absolute bottom-6 left-6 flex w-[min(calc(100%-3rem),240px)] flex-col items-start rounded-[28px] p-5 text-left outline-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[#b9a4ff] active:scale-[0.96]",
          open
            ? "pointer-events-none translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        )}
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #2a1f55 0%, #0b0d16 62%)",
          boxShadow:
            "0 24px 60px rgba(8, 6, 20, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <MotionOrb state="thinking" className="mb-4 size-[7.5rem]" active={!open} />
        <p className="text-[0.95rem] leading-6 text-white">
          Chat with{" "}
          <span className="text-[1.35rem] font-semibold tracking-[-0.04em]">
            NORA
          </span>
        </p>
        <p className="mt-1 text-[0.78rem] text-white/60">
          Your NMOSD companion
        </p>
      </button>

      <div
        className={cn(
          "absolute inset-0 bg-black/45 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "pointer-events-auto opacity-100" : "opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        data-theme={theme}
        inert={!open}
        className={cn(
          "pointer-events-auto absolute inset-6 mx-auto flex max-w-[400px] flex-col overflow-hidden rounded-[32px] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:inset-auto md:top-1/2 md:right-8 md:bottom-auto md:left-auto md:h-[min(760px,calc(100svh-4rem))] md:w-[400px] md:-translate-y-1/2",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
        style={{
          color: dark ? "#f7f4ff" : "#1b1528",
          background: dark
            ? "radial-gradient(80% 55% at 50% 38%, #1c1638 0%, #0a0c16 58%, #05060c 100%)"
            : "radial-gradient(80% 55% at 50% 38%, #efe8ff 0%, #f6f3ec 58%, #f3efe6 100%)",
          boxShadow: dark
            ? "0 40px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 40px 90px rgba(40, 28, 80, 0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
          fontSize: `calc(16px * ${fontScale})`,
        }}
      >
        <header className="flex items-center justify-between px-5 pt-5">
          <Pill
            className={cn(
              "border",
              dark ? "border-white/15 bg-white/6" : "border-black/10 bg-white/70"
            )}
          >
            <span className="pr-1 tracking-[0.18em] opacity-55">Theme</span>
            <button
              type="button"
              aria-label="Use dark theme"
              aria-pressed={dark}
              onClick={() => setTheme("dark")}
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
                dark ? "bg-white text-[#1b1528]" : "text-current opacity-50"
              )}
            >
              <MoonIcon />
            </button>
            <button
              type="button"
              aria-label="Use light theme"
              aria-pressed={!dark}
              onClick={() => setTheme("light")}
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
                dark ? "text-current opacity-50" : "bg-[#1b1528] text-[#f6f3ec]"
              )}
            >
              <SunIcon />
            </button>
          </Pill>

          <Pill
            className={cn(
              "border tabular-nums",
              dark ? "border-white/15 bg-white/6" : "border-black/10 bg-white/70"
            )}
          >
            <button
              type="button"
              aria-label="Decrease text size"
              disabled={fontIndex === 0}
              onClick={() => setFontIndex((index) => Math.max(0, index - 1))}
              className="flex size-7 items-center justify-center rounded-full opacity-80 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] enabled:hover:opacity-100 enabled:active:scale-[0.96] disabled:opacity-30"
            >
              <Minus className="size-3.5" strokeWidth={1.6} />
            </button>
            <span className="min-w-[3.6em] text-center tracking-normal">
              AA {fontPercent}%
            </span>
            <button
              type="button"
              aria-label="Increase text size"
              disabled={fontIndex === FONT_STEPS.length - 1}
              onClick={() =>
                setFontIndex((index) => Math.min(FONT_STEPS.length - 1, index + 1))
              }
              className="flex size-7 items-center justify-center rounded-full opacity-80 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] enabled:hover:opacity-100 enabled:active:scale-[0.96] disabled:opacity-30"
            >
              <Plus className="size-3.5" strokeWidth={1.6} />
            </button>
          </Pill>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center px-6">
          {view === "idle" ? (
            <button
              type="button"
              onClick={startListening}
              aria-label="Start talking to NORA"
              className="relative mt-[10%] size-[min(70vw,268px)] rounded-full outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[#b9a4ff] active:scale-[0.96]"
            >
              <MotionOrb state="idle" className="h-full w-full" active={open} />
            </button>
          ) : (
            <div className="relative mt-[14%] size-[min(72vw,280px)]">
              <MotionOrb state={orbState} className="h-full w-full" active={open} />
            </div>
          )}

          {view === "idle" ? (
            <div className="mt-2 flex w-full flex-1 flex-col items-center text-center">
              <h2
                id={titleId}
                className="max-w-[14ch] text-[1.85em] leading-[1.12] font-semibold tracking-[-0.045em] text-balance"
              >
                Hello, I’m NORA.
              </h2>
              <p
                className={cn(
                  "mt-4 max-w-[32ch] text-[0.92em] leading-6 text-pretty",
                  dark ? "text-white/62" : "text-[#1b1528]/62"
                )}
              >
                Your NMOSD companion — ask me anything. Tap the microphone to
                start talking, or type your question below.
              </p>

              <form onSubmit={submitText} className="mt-auto w-full pb-2">
                {typing ? (
                  <label className="sr-only" htmlFor="nora-input">
                    Ask NORA a question
                  </label>
                ) : null}
                {typing ? (
                  <input
                    ref={inputRef}
                    id="nora-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a question"
                    className={cn(
                      "h-14 w-full rounded-full border bg-transparent px-5 text-center text-[0.95em] outline-none placeholder:opacity-45 focus-visible:ring-2 focus-visible:ring-[#b9a4ff]",
                      dark ? "border-white/25" : "border-black/15 bg-white/50"
                    )}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setTyping(true)}
                    className={cn(
                      "h-14 w-full rounded-full border text-[0.95em] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96]",
                      dark
                        ? "border-white/25 text-white/80"
                        : "border-black/15 bg-white/50 text-[#1b1528]/70"
                    )}
                  >
                    Tap to type a question.
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="mt-1 flex flex-1 flex-col items-center">
              <p
                id={titleId}
                className="text-[2em] font-semibold tracking-[-0.04em]"
                aria-live="polite"
              >
                {statusLabel(view)}
              </p>
              <div className="mt-auto mb-[18%] flex gap-5">
                <IconButton label="Stop" onClick={resetToIdle}>
                  <Square className="size-4 fill-current" strokeWidth={1.4} />
                </IconButton>
                <IconButton label="Start over" onClick={resetToIdle}>
                  <RotateCcw className="size-4" strokeWidth={1.4} />
                </IconButton>
              </div>
            </div>
          )}
        </div>

        <footer
          className={cn(
            "px-8 pt-2 pb-5 text-center text-[0.62em] leading-4",
            dark ? "text-white/38" : "text-[#1b1528]/40"
          )}
        >
          <p className="mx-auto max-w-[46ch]">{DISCLAIMER}</p>
          <p className="mt-3 tracking-[0.16em] uppercase">
            <a className="hover:text-current" href="#privacy">
              Privacy
            </a>
            <span className="mx-2 opacity-50">|</span>
            <a className="hover:text-current" href="#terms">
              Terms
            </a>
            <span className="mx-2 opacity-50">|</span>
            <a className="hover:text-current" href="#accessibility">
              Accessibility
            </a>
          </p>
        </footer>
      </section>
    </div>
  )
}

function statusLabel(view: View) {
  switch (view) {
    case "idle":
      return "Ready"
    case "listening":
      return "Listening"
    case "thinking":
      return "Thinking"
    case "speaking":
      return "Speaking"
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.6 10.4A6 6 0 0 1 6.1 2.3a6 6 0 1 0 6.5 8.1Z"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2.4" />
      <path d="M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1" />
    </svg>
  )
}
