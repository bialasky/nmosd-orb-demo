import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function NewChatButton() {
  return (
    <Button variant="secondary" render={<a href="/" />} nativeButton={false}>
      <PlusIcon data-icon="inline-start" />
      New Chat
    </Button>
  )
}
