import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { OrbPlayground } from "@/components/orb-playground"
import { ThemeProvider } from "@/components/theme-provider"

import "./globals.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Root element #root was not found")
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <OrbPlayground />
    </ThemeProvider>
  </StrictMode>
)
