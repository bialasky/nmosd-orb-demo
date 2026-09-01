import { NewChatButton } from "@/components/new-chat-button"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-2 px-6 py-3">
      <a href="/" className="text-sm font-medium">
        Chat
      </a>
      <NewChatButton />
    </header>
  )
}
