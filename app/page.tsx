import type { Metadata } from "next"

import { OrbExperience } from "@/components/orb-experience"

export const metadata: Metadata = {
  title: "Aria — NMOSD Orb Concept",
  description:
    "An interactive NMOSD voice assistant orb and chat experience concept.",
}

export default function Page() {
  return <OrbExperience />
}
