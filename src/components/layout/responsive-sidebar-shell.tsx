"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SidebarItem = {
  href: string
  label: string
  icon: LucideIcon
}

type ResponsiveSidebarShellProps = {
  brandHref: string
  brandTitle: string
  brandSubtitle?: string
  brandImageAlt: string
  brandImageClassName?: string
  items: SidebarItem[]
  footer: (collapsed: boolean) => ReactNode
  variant: "dashboard" | "admin"
  children: ReactNode
  storageKey: string
}

const DESKTOP_BREAKPOINT = 1280

export function ResponsiveSidebarShell({
  brandHref,
  brandTitle,
  brandSubtitle,
  brandImageAlt,
  brandImageClassName,
  items,
  footer,
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
    if (!isDesktop) {
      setCollapsed(true)
      return
    }

    const stored = window.localStorage.getItem(storageKey)
    setCollapsed(stored ? stored === "collapsed" : false)
  }, [isDesktop, storageKey])

  useEffect(() => {
    if (!isDesktop) return
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside
        className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-[width] duration-300 ease-in-out", asideTheme)}
        style={{ width: sidebarWidth }}
      >
        <div className={cn("flex items-center gap-3 border-b px-3 py-4", variant === "admin" ? "border-background/10" : "border-border")}>
          <Link
            href={brandHref}
            className={cn("flex min-w-0 flex-1 items-center gap-3", collapsed && "justify-center")}
            aria-label={brandTitle}
          >
            <Image
              src="/logo.png"
              alt={brandImageAlt}
              width={110}
              height={32}
              className={cn("h-7 w-auto shrink-0 object-contain", variant === "admin" && "brightness-0 invert", brandImageClassName)}
            />
            {!collapsed && (
              <div className="min-w-0">
                {brandSubtitle ? (
                  <p className={cn("text-[10px] uppercase tracking-[0.2em]", variant === "admin" ? "text-background/50" : "text-muted-foreground")}>
                    {brandSubtitle}
                  </p>
                ) : null}
                <p className="truncate text-sm font-semibold">{brandTitle}</p>
              </div>
            )}
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("hidden h-8 w-8 shrink-0 xl:inline-flex", toggleTheme)}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Mostrar textos" : "Mostrar solo iconos"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {items.map(({ href, label, icon: Icon }) => {
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

        <div className={cn("border-t px-3 py-3", footerTheme)}>
          {footer(collapsed)}
        </div>
      </aside>

      <main
        className={cn(
          "min-h-screen min-w-0 p-4 transition-[margin-left] duration-300 ease-in-out sm:p-6 lg:p-8",
          variant === "admin" ? "bg-muted/30" : "bg-background"
        )}
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  )
}
