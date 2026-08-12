"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react"
import {
  ArrowUp,
  MessageCircle,
  Mic,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Orb, type AgentState } from "@/components/ui/orb"

type DemoState = "idle" | Exclude<AgentState, null>
type Message = {
  id: number
  role: "assistant" | "user"
  text: string
}

const ORB_COLORS: [string, string] = ["#6D55F7", "#82DDE4"]

const STATE_DETAILS: Record<
  DemoState,
  { label: string; description: string }
> = {
  idle: {
    label: "Ready",
    description: "Ask about NMOSD whenever you are ready",
  },
  listening: {
    label: "Listening",
    description: "Aria is listening to your question",
  },
  thinking: {
    label: "Thinking",
    description: "Finding a clear, helpful answer",
  },
  talking: {
    label: "Speaking",
    description: "Aria is responding",
  },
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "Hello, I’m Aria. I can help explain NMOSD in clear, everyday language. What would you like to know?",
  },
]

const SUGGESTIONS = [
  "What is NMOSD?",
  "How is NMOSD diagnosed?",
  "Help me prepare for an appointment",
]

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return reducedMotion
}

function OrbVisual({
  state,
  reducedMotion,
  className,
}: {
  state: DemoState
  reducedMotion: boolean
  className: string
}) {
  if (reducedMotion) {
    return (
      <div
        className={`${className} rounded-full bg-[radial-gradient(circle_at_34%_30%,#fff_0%,#c9c0ff_18%,#6d55f7_52%,#82dde4_78%,#fff0_100%)] shadow-[0_0_60px_rgba(109,85,247,0.28)]`}
        aria-hidden="true"
      />
    )
  }

  return (
    <Orb
      className={className}
      colors={ORB_COLORS}
      seed={15537}
      agentState={state === "idle" ? null : state}
    />
  )
}

function DemoChat({
  open,
  state,
  reducedMotion,
  messages,
  inputRef,
  onClose,
  onSubmit,
  onSuggestion,
}: {
  open: boolean
  state: DemoState
  reducedMotion: boolean
  messages: Message[]
  inputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  onSubmit: (text: string) => void
  onSuggestion: (text: string) => void
}) {
  const [input, setInput] = useState("")
  const isBusy = state === "thinking" || state === "talking"

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    onSubmit(text)
    setInput("")
  }

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
      aria-hidden={!open}
      inert={!open}
      className={`fixed z-40 flex overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_28px_80px_rgba(42,31,83,0.22)] backdrop-blur-2xl transition-[opacity,transform] duration-500 max-md:inset-3 md:top-24 md:right-6 md:bottom-6 md:w-[420px] ${
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <div className="flex min-h-0 w-full flex-col">
        <header className="flex items-center gap-3 border-b border-[#211a3b]/8 px-5 py-4">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#f5f2ff]">
            <OrbVisual
              state={state}
              reducedMotion={reducedMotion}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="chat-title" className="font-semibold text-[#211a3b]">
              Aria
            </h2>
            <p className="truncate text-xs text-[#6f6883]" aria-live="polite">
              {STATE_DETAILS[state].label}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close conversation"
            className="rounded-full"
          >
            <X />
          </Button>
        </header>

        <div
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <p
                className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#211a3b] text-white"
                    : "rounded-bl-md bg-[#f2eff9] text-[#332b4c]"
                }`}
              >
                {message.text}
              </p>
            </div>
          ))}
          {state === "thinking" && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-[#f2eff9] px-4 py-4"
                aria-label="Aria is thinking"
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-1.5 animate-bounce rounded-full bg-[#756d88]"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 pb-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion)}
                className="shrink-0 rounded-full border border-[#211a3b]/10 bg-white px-3 py-2 text-xs font-medium text-[#51496a] transition-colors hover:bg-[#f5f2fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d55f7]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="border-t border-[#211a3b]/8 p-4">
          <div className="flex items-center gap-2 rounded-full border border-[#211a3b]/10 bg-[#f8f6fb] p-1.5 pl-4 focus-within:border-[#6d55f7]/45 focus-within:ring-4 focus-within:ring-[#6d55f7]/10">
            <label htmlFor="chat-input" className="sr-only">
              Ask Aria a question
            </label>
            <input
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Aria anything…"
              disabled={isBusy}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#211a3b] outline-none placeholder:text-[#8f899e]"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Use voice input"
              className="rounded-full text-[#5f5774]"
            >
              <Mic />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isBusy}
              aria-label="Send message"
              className="rounded-full bg-[#6d55f7] text-white hover:bg-[#5942d5]"
            >
              <ArrowUp />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#8a8498]">
            Prototype only — not medical advice
          </p>
        </form>
      </div>
    </aside>
  )
}

export function OrbExperience() {
  const [state, setState] = useState<DemoState>("idle")
  const [chatOpen, setChatOpen] = useState(false)
  const [introVisible, setIntroVisible] = useState(true)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const inputRef = useRef<HTMLInputElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!introVisible) return
    const duration = reducedMotion ? 250 : 2200
    const timer = setTimeout(() => setIntroVisible(false), duration)
    return () => clearTimeout(timer)
  }, [introVisible, reducedMotion])

  useEffect(() => {
    if (chatOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 520)
      return () => clearTimeout(timer)
    }
  }, [chatOpen])

  useEffect(
    () => () => timersRef.current.forEach((timer) => clearTimeout(timer)),
    []
  )

  function replayIntro() {
    setIntroVisible(false)
    requestAnimationFrame(() => setIntroVisible(true))
  }

  function sendMessage(text: string) {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current = []
    setChatOpen(true)
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text },
    ])
    setState("thinking")

    const responseTimer = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "NMOSD is a rare autoimmune condition that mainly affects the optic nerves and spinal cord. Symptoms can be different for each person, so a specialist can help explain what they mean for you.",
        },
      ])
      setState("talking")

      const idleTimer = setTimeout(() => setState("idle"), 3200)
      timersRef.current.push(idleTimer)
    }, 1100)

    timersRef.current.push(responseTimer)
  }

  const stateOrder: DemoState[] = [
    "idle",
    "listening",
    "thinking",
    "talking",
  ]

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#f8f6fb] text-[#211a3b]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-[8%] size-[520px] rounded-full bg-[#d8d0ff]/55 blur-[120px]" />
        <div className="absolute right-[-12%] bottom-[-28%] size-[680px] rounded-full bg-[#c9edf0]/65 blur-[150px]" />
      </div>

      <header className="relative z-20 flex h-20 items-center justify-between px-5 md:px-10">
        <a
          href="#main"
          className="text-lg font-semibold tracking-[0.22em] text-[#30274e]"
        >
          NMOSD
        </a>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium tracking-wide text-[#766f88] uppercase sm:inline">
            AI patient tool concept
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={replayIntro}
            aria-label="Replay NMOSD intro"
            className="rounded-full"
          >
            <RotateCcw />
          </Button>
        </div>
      </header>

      <main
        id="main"
        className={`relative z-10 flex min-h-[calc(100svh-8rem)] items-center justify-center px-5 pb-16 transition-[margin] duration-700 ${
          chatOpen ? "md:mr-[444px]" : ""
        }`}
      >
        <section className="flex w-full max-w-3xl flex-col items-center text-center">
          <div className="relative mb-3 size-[min(72vw,340px)]">
            <div
              className="absolute inset-[10%] rounded-full bg-[#8c74ff]/20 blur-3xl"
              aria-hidden="true"
            />
            <OrbVisual
              state={state}
              reducedMotion={reducedMotion}
              className="relative h-full w-full"
            />
          </div>

          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-xs font-medium text-[#665e7a] shadow-sm backdrop-blur-xl"
            aria-live="polite"
          >
            <span
              className={`size-1.5 rounded-full ${
                state === "idle" ? "bg-emerald-500" : "bg-[#6d55f7]"
              }`}
            />
            {STATE_DETAILS[state].label}
            <span className="text-[#aaa4b6]">·</span>
            {STATE_DETAILS[state].description}
          </div>

          <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#6d55f7] uppercase">
            <Sparkles className="size-3.5" />
            Your NMOSD companion
          </p>
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-[-0.045em] text-[#211a3b] sm:text-6xl">
            Hello, I’m Aria.
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-[#6f6883] sm:text-lg">
            A calm place to ask questions, understand NMOSD, and prepare for
            conversations with your healthcare team.
          </p>

          <Button
            type="button"
            size="lg"
            onClick={() => setChatOpen(true)}
            className="mt-8 h-12 rounded-full bg-[#211a3b] px-6 text-white shadow-[0_14px_32px_rgba(33,26,59,0.22)] hover:bg-[#33294f]"
          >
            <MessageCircle />
            Start a conversation
          </Button>

          <div className="mt-8">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-[#8f899e] uppercase">
              Preview orb states
            </p>
            <div
              className="flex flex-wrap justify-center gap-2"
              role="group"
              aria-label="Preview orb states"
            >
              {stateOrder.map((demoState) => (
                <button
                  key={demoState}
                  type="button"
                  onClick={() => setState(demoState)}
                  aria-pressed={state === demoState}
                  className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d55f7] ${
                    state === demoState
                      ? "bg-[#6d55f7] text-white shadow-md"
                      : "border border-[#211a3b]/10 bg-white/55 text-[#665e7a] hover:bg-white"
                  }`}
                >
                  {STATE_DETAILS[demoState].label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex h-12 items-center justify-center gap-5 px-5 text-[11px] font-medium tracking-wide text-[#8c8699] uppercase">
        <a href="#privacy" className="hover:text-[#4d4563]">
          Privacy
        </a>
        <a href="#terms" className="hover:text-[#4d4563]">
          Terms
        </a>
        <a href="#accessibility" className="hover:text-[#4d4563]">
          Accessibility
        </a>
      </footer>

      <DemoChat
        open={chatOpen}
        state={state}
        reducedMotion={reducedMotion}
        messages={messages}
        inputRef={inputRef}
        onClose={() => setChatOpen(false)}
        onSubmit={sendMessage}
        onSuggestion={sendMessage}
      />

      <div
        aria-hidden="true"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#f8f6fb] transition-opacity duration-700 ${
          introVisible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`flex items-center text-[clamp(3.2rem,11vw,8rem)] font-semibold tracking-[-0.07em] text-[#211a3b] transition-[transform,filter,opacity] duration-1000 ${
            introVisible
              ? "scale-100 opacity-100"
              : "scale-110 opacity-0 blur-sm"
          }`}
        >
          <span>NM</span>
          <span className="mx-[0.02em] inline-block size-[0.78em] overflow-hidden rounded-full align-middle">
            <OrbVisual
              state="idle"
              reducedMotion={reducedMotion}
              className="h-full w-full"
            />
          </span>
          <span>SD</span>
        </div>
      </div>
    </div>
  )
}
