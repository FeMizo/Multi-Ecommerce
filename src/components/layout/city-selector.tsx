"use client"

import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CitySelector() {
  return (
    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" type="button">
      <MapPin className="h-4 w-4" />
      <span className="hidden sm:inline">Ciudad del Carmen, Camp</span>
      <ChevronDown className="h-3 w-3" />
    </Button>
  )
}
