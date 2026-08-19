"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import type { ComponentProps } from "react"
import { InteractiveMorphIcon } from "@/components/ui/interactive-morph-icon"

type MorphLinkProps = {
  href: ComponentProps<typeof Link>["href"]
  children: ReactNode
  className?: string
  icon: ComponentProps<typeof InteractiveMorphIcon>["icon"]
  iconClassName?: string
  iconPosition?: "left" | "right"
  hoverIcon?: ComponentProps<typeof InteractiveMorphIcon>["icon"]
  activeIcon?: ComponentProps<typeof InteractiveMorphIcon>["icon"]
  onClick?: ComponentProps<typeof Link>["onClick"]
  ariaCurrent?: "page" | "step" | "location" | "date" | "time" | true | false
}

export function MorphLink({
  href,
  children,
  className,
  icon,
  iconClassName = "h-4 w-4",
  iconPosition = "right",
  hoverIcon,
  activeIcon,
  onClick,
  ariaCurrent,
}: MorphLinkProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-current={ariaCurrent}
      className={className}
    >
      {iconPosition === "left" && (
        <InteractiveMorphIcon
          icon={icon}
          hoverIcon={hoverIcon}
          activeIcon={activeIcon}
          hovered={hovered}
          className={iconClassName}
          spring="snappy"
          reducedMotion="never"
        />
      )}
      {children}
      {iconPosition === "right" && (
        <InteractiveMorphIcon
          icon={icon}
          hoverIcon={hoverIcon}
          activeIcon={activeIcon}
          hovered={hovered}
          className={iconClassName}
          spring="snappy"
          reducedMotion="never"
        />
      )}
    </Link>
  )
}
