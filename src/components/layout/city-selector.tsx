"use client"

import { useState, useEffect } from "react"
import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCityStore } from "@/stores/city"

export function CitySelector() {
  const { city, setCity, cities } = useCityStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{city?.name ?? "Tu ciudad"}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {cities.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => setCity(c)} className={city?.id === c.id ? "font-medium" : ""}>
            {c.name}, {c.state}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
