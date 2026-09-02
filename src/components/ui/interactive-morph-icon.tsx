"use client"

import { useState, type PointerEvent, type FocusEvent } from "react"
import { MorphIcon, type MorphIconProps, type IconInput } from "morphicons/react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  Grid2X2Plus,
  GripVertical,
  Heart,
  HeartPlus,
  Home,
  HousePlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Minus,
  MoveVertical,
  Package,
  PackagePlus,
  Search,
  SearchX,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  UserPlus,
  SquareArrowOutUpRight,
  X,
} from "lucide"

const DEFAULT_HOVER_ICON = new WeakMap<object, IconInput>([
  [Menu as unknown as object, X],
  [Search as unknown as object, Sparkles],
  [ShoppingCart as unknown as object, ShoppingBag],
  [ArrowRight as unknown as object, SquareArrowOutUpRight],
  [ArrowLeft as unknown as object, ArrowUpLeft],
  [ChevronRight as unknown as object, SquareArrowOutUpRight],
  [ChevronLeft as unknown as object, ArrowLeft],
  [Plus as unknown as object, Minus],
  [Minus as unknown as object, Plus],
  [GripVertical as unknown as object, MoveVertical],
  [Home as unknown as object, HousePlus],
  [Store as unknown as object, Home],
  [Package as unknown as object, PackagePlus],
  [User as unknown as object, UserPlus],
  [Heart as unknown as object, HeartPlus],
  [LogOut as unknown as object, LogIn],
  [LayoutDashboard as unknown as object, Grid2X2Plus],
  [X as unknown as object, SearchX],
])

function resolveDefaultHoverIcon(icon: IconInput) {
  if (typeof icon === "string") {
    return undefined
  }
  return DEFAULT_HOVER_ICON.get(icon as unknown as object)
}

type InteractiveMorphIconProps = Omit<MorphIconProps, "icon"> & {
  icon: IconInput
  hoverIcon?: IconInput
  activeIcon?: IconInput
  hovered?: boolean
  pressed?: boolean
}

export function InteractiveMorphIcon({
  icon,
  hoverIcon,
  activeIcon,
  hovered: hoveredProp,
  pressed: pressedProp,
  spring = "snappy",
  reducedMotion = "never",
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onFocus,
  onBlur,
  ...props
}: InteractiveMorphIconProps) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isHovered = hoveredProp ?? hovered
  const isPressed = pressedProp ?? pressed
  const resolvedHoverIcon = hoverIcon ?? resolveDefaultHoverIcon(icon)
  const currentIcon = isPressed ? activeIcon ?? resolvedHoverIcon ?? icon : isHovered ? resolvedHoverIcon ?? icon : icon

  function handlePointerEnter(event: PointerEvent<SVGSVGElement>) {
    if (hoveredProp === undefined) setHovered(true)
    onPointerEnter?.(event)
  }

  function handlePointerLeave(event: PointerEvent<SVGSVGElement>) {
    if (hoveredProp === undefined) setHovered(false)
    if (pressedProp === undefined) setPressed(false)
    onPointerLeave?.(event)
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (pressedProp === undefined) setPressed(true)
    onPointerDown?.(event)
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (pressedProp === undefined) setPressed(false)
    onPointerUp?.(event)
  }

  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    if (pressedProp === undefined) setPressed(false)
    onPointerCancel?.(event)
  }

  function handleFocus(event: FocusEvent<SVGSVGElement>) {
    if (hoveredProp === undefined) setHovered(true)
    onFocus?.(event)
  }

  function handleBlur(event: FocusEvent<SVGSVGElement>) {
    if (hoveredProp === undefined) setHovered(false)
    if (pressedProp === undefined) setPressed(false)
    onBlur?.(event)
  }

  return (
    <MorphIcon
      icon={currentIcon}
      spring={spring}
      reducedMotion={reducedMotion}
      data-morph-icon="true"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
}
