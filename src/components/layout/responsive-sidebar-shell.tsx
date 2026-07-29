"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SidebarIconName =
  | "ArrowLeft"
  | "ArrowUpRight"
  | "BarChart3"
  | "CreditCard"
  | "LayoutDashboard"
  | "MapPin"
  | "Package"
  | "ShoppingBag"
  | "Store"
  | "Settings"
  | "Tag"
  | "Users"

export type SidebarItem = {
  href: string
  label: string
  iconKey: SidebarIconName
}

type ResponsiveSidebarShellProps = {
  brandHref: string
  brandTitle: string
  brandSubtitle?: string
  brandImageAlt: string
  brandImageClassName?: string
  items: SidebarItem[]
  topFooterHref?: string
  topFooterLabel?: string
  topFooterIconKey?: SidebarIconName
  topFooterExternal?: boolean
  footerHref: string
  footerLabel: string
  footerIconKey: SidebarIconName
  footerExternal?: boolean
  variant: "dashboard" | "admin"
  children: ReactNode
  storageKey: string
}

const DESKTOP_BREAKPOINT = 1280
const ICONS: Record<SidebarIconName, LucideIcon> = {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Settings,
  Tag,
  Users,
}

export function ResponsiveSidebarShell({
  brandHref,
  brandTitle,
  brandSubtitle,
  brandImageAlt,
  brandImageClassName,
  items,
  topFooterHref,
  topFooterLabel,
  topFooterIconKey,
  topFooterExternal = false,
  footerHref,
  footerLabel,
  footerIconKey,
  footerExternal = false,
  variant,
  children,
  storageKey,
}: ResponsiveSidebarShellProps) {
  const pathname = usePathname()
  const [isDesktop, setIsDesktop] = useState(false)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const syncViewport = () => {
      setIsDesktop(media.matches)
    }

    syncViewport()
    media.addEventListener("change", syncViewport)

    return () => media.removeEventListener("change", syncViewport)
  }, [])

  useEffect(() => {
    const nextCollapsed = !isDesktop ? true : (window.localStorage.getItem(storageKey) === "collapsed")
    const frame = window.requestAnimationFrame(() => setCollapsed(nextCollapsed))
    return () => window.cancelAnimationFrame(frame)
  }, [isDesktop, storageKey])

  useEffect(() => {
    if (!isDesktop) {
      return
    }
    window.localStorage.setItem(storageKey, collapsed ? "collapsed" : "expanded")
  }, [collapsed, isDesktop, storageKey])

  const sidebarWidth = isDesktop ? (collapsed ? 64 : 256) : 64
  const asideTheme =
    variant === "admin"
      ? "border-background/10 bg-foreground text-background"
      : "border-border bg-card text-foreground"
  const footerTheme =
    variant === "admin"
      ? "border-background/10 text-background/60 hover:text-background"
      : "border-border text-muted-foreground hover:text-foreground"
  const activeTheme =
    variant === "admin"
      ? "bg-primary text-primary-foreground"
      : "bg-primary/10 text-primary"
  const idleTheme =
    variant === "admin"
      ? "text-background/60 hover:bg-background/10 hover:text-background"
      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
  const toggleTheme =
    variant === "admin"
      ? "text-background hover:bg-background/10 hover:text-background"
      : "text-foreground hover:bg-muted"
  const topFooterTheme =
    variant === "admin"
      ? "border-background/10 text-background/60 hover:text-background"
      : "border-border text-muted-foreground hover:text-foreground"
  const FooterIcon = ICONS[footerIconKey]
  const TopFooterIcon = topFooterIconKey ? ICONS[topFooterIconKey] : null

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside
        className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-[width] duration-300 ease-in-out", asideTheme)}
        style={{ width: sidebarWidth }}
      >
        <div
          className={cn(
            "relative flex items-center border-b px-3 py-4",
            collapsed ? "justify-center" : "justify-start",
            variant === "admin" ? "border-background/10" : "border-border"
          )}
        >
          <Link
            href={brandHref}
            className={cn("flex min-w-0 items-center gap-3", collapsed ? "justify-center" : "flex-1")}
            aria-label={brandTitle}
          >
            {collapsed ? (
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src="/logo.png"
                  alt={brandImageAlt}
                  fill
                  sizes="40px"
                  className={cn("object-contain", variant === "admin" && "brightness-0 invert", brandImageClassName)}
                />
              </span>
            ) : (
              <Image
                src="/logo.png"
                alt={brandImageAlt}
                width={110}
                height={32}
                className={cn("h-7 w-auto shrink-0 object-contain", variant === "admin" && "brightness-0 invert", brandImageClassName)}
              />
            )}
          </Link>
          {!collapsed && brandSubtitle && (
            <p className={cn("mt-2 text-xs tracking-wide", variant === "admin" ? "text-background/60" : "text-muted-foreground")}>
              {brandSubtitle}
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {items.map(({ href, label, iconKey }) => {
            const Icon = ICONS[iconKey]
            const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors",
                  collapsed ? "mx-auto h-11 w-11 justify-center" : "gap-3 px-3 py-2",
                  active ? activeTheme : idleTheme
                )}
              >
                <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed ? <span className="truncate">{label}</span> : <span className="sr-only">{label}</span>}
              </Link>
            )
          })}
        </nav>

        {topFooterHref && topFooterLabel && TopFooterIcon && (
          <div className={cn("border-t px-3 py-3", topFooterTheme)}>
            <Link
              href={topFooterHref}
              className={cn("flex items-center gap-2 text-xs font-medium transition-colors", collapsed && "justify-center")}
              target={topFooterExternal ? "_blank" : undefined}
              rel={topFooterExternal ? "noreferrer" : undefined}
              title={topFooterLabel}
              aria-label={topFooterLabel}
            >
              <TopFooterIcon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{topFooterLabel}</span> : <span className="sr-only">{topFooterLabel}</span>}
            </Link>
          </div>
        )}
        <div className={cn("border-t px-3 py-3", footerTheme)}>
          <Link
            href={footerHref}
            className={cn("flex items-center gap-2 text-xs font-medium transition-colors", collapsed && "justify-center")}
            target={footerExternal ? "_blank" : undefined}
            rel={footerExternal ? "noreferrer" : undefined}
            title={footerLabel}
            aria-label={footerLabel}
          >
            <FooterIcon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{footerLabel}</span> : <span className="sr-only">{footerLabel}</span>}
          </Link>
        </div>
      </aside>

      <main
        className={cn(
          "min-h-screen min-w-0 transition-[margin-left] duration-300 ease-in-out",
          variant === "admin" ? "bg-muted/30" : "bg-background"
        )}
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("hidden h-9 w-9 shrink-0 xl:inline-flex", toggleTheme)}
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Mostrar textos" : "Mostrar solo iconos"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="min-w-0 flex-1" />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
