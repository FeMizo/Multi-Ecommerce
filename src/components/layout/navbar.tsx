"use client"

import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { User, Package, LogOut, LayoutDashboard, Heart } from "lucide-react"
import { InteractiveMorphIcon } from "@/components/ui/interactive-morph-icon"
import {
  Menu as MorphMenu,
  Search as MorphSearch,
  ShoppingCart as MorphShoppingCart,
  X as MorphX,
  Home as MorphHome,
  Store as MorphStore,
  Package as MorphPackage,
  User as MorphUser,
} from "lucide"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCartStore } from "@/stores/cart"
import { CartDrawer } from "@/components/layout/cart-drawer"
import type { Session } from "next-auth"
import { useRef, useState, useTransition, type ReactNode, type ComponentProps } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

function NavbarSearch({ autoFocus = false, submitLabel = "Buscar" }: { autoFocus?: boolean; submitLabel?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const value = searchParams.get("q") ?? ""

  function navigate(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    const q = nextValue.trim()

    if (q) {
      params.set("q", q)
    } else {
      params.delete("q")
    }
    params.delete("page")

    startTransition(() => {
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`)
    })
  }

  return (
    <form
      action="/search"
      method="get"
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        navigate(inputRef.current?.value ?? value)
      }}
      >
      <div className="relative flex-1">
        <InteractiveMorphIcon
          icon={MorphSearch}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          spring="snappy"
          reducedMotion="never"
        />
        <input
          key={value}
          ref={inputRef}
          name="q"
          defaultValue={value}
          onChange={(event) => {
            const nextValue = event.target.value
            if (!nextValue.trim() && value) {
              navigate("")
            }
          }}
          autoFocus={autoFocus}
          placeholder="Buscar productos, tiendas..."
          className="w-full h-10 rounded-full border border-input bg-muted/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ""
              navigate("")
            }}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <InteractiveMorphIcon icon={MorphX} className="h-3.5 w-3.5" spring="snappy" reducedMotion="never" />
          </button>
        )}
      </div>
      <Button type="submit" className="shrink-0">
        {submitLabel}
      </Button>
    </form>
  )
}

function MorphNavLink({
  href,
  icon,
  children,
  className,
  onClick,
  active = false,
  iconClassName = "h-4 w-4",
}: {
  href: string
  icon: ComponentProps<typeof InteractiveMorphIcon>["icon"]
  children: ReactNode
  className?: string
  onClick?: () => void
  active?: boolean
  iconClassName?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      <InteractiveMorphIcon icon={icon} hovered={hovered} className={iconClassName} spring="snappy" reducedMotion="never" />
      {children}
    </Link>
  )
}

function MorphNavButton({
  onClick,
  icon,
  children,
  className,
  ariaLabel,
  ariaExpanded,
  variant = "ghost",
  size = "icon",
  iconClassName = "h-5 w-5",
  ...buttonProps
}: {
  onClick?: () => void
  icon: ComponentProps<typeof InteractiveMorphIcon>["icon"]
  children?: ReactNode
  className?: string
  ariaLabel?: string
  ariaExpanded?: boolean
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  iconClassName?: string
} & Omit<ComponentProps<typeof Button>, "onClick" | "children" | "className" | "variant" | "size">) {
  const [hovered, setHovered] = useState(false)

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={className}
      {...buttonProps}
    >
      <InteractiveMorphIcon icon={icon} hovered={hovered} className={iconClassName} spring="snappy" reducedMotion="never" />
      {children}
    </Button>
  )
}

type NavbarProps = {
  session: Session | null
  dashboardSlug: string | null
}

export function Navbar({ session, dashboardSlug }: NavbarProps) {
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const openCart = useCartStore((s) => s.openCart)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const sessionUser = session?.user
  const accountHref = sessionUser ? "/account/orders" : "/login"
  const mobileNavItems = [
    { href: "/", label: "Inicio", icon: MorphHome },
    { href: "/stores", label: "Tiendas", icon: MorphStore },
    { href: "/search", label: "Buscar", icon: MorphSearch },
  ] as const

  return (
    <>
      <CartDrawer />
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <Image
                  src="/logo-icon.png"
                  alt="AionSite Shop"
                  width={36}
                  height={36}
                  className="rounded-xl sm:hidden"
                />
                <Image
                  src="/logo.png"
                  alt="AionSite Shop"
                  width={140}
                  height={40}
                  className="hidden sm:block h-9 w-auto object-contain"
                  priority
                />
                <span className="hidden text-sm font-semibold tracking-wide text-foreground">
                  AionSite Shop
                </span>
              </Link>
            </div>

            {/* Search - Desktop */}
            <div className="flex-1 max-w-xl hidden md:block">
              <NavbarSearch submitLabel="Buscar" />
            </div>

            {/* Nav Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              <MorphNavLink
                href="/stores"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                icon={MorphStore}
              >
                Tiendas
              </MorphNavLink>
              <MorphNavLink
                href="/search"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                icon={MorphPackage}
              >
                Productos
              </MorphNavLink>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Mobile */}
              <Dialog>
                <DialogTrigger asChild>
                  <MorphNavButton
                    className="md:hidden rounded-full"
                    ariaLabel="Abrir búsqueda"
                    icon={MorphSearch}
                    iconClassName="h-5 w-5"
                  />
                </DialogTrigger>
                <DialogContent className="top-[72px] left-4 right-4 translate-x-0 translate-y-0 w-[calc(100%-2rem)] max-w-none rounded-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 sm:left-auto sm:right-4 sm:w-96 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Buscar</DialogTitle>
                    <DialogDescription>Escribe lo que buscas y ve a resultados.</DialogDescription>
                  </DialogHeader>
                  <NavbarSearch autoFocus submitLabel="Ir" />
                </DialogContent>
              </Dialog>
              
              {/* Cart */}
                            <MorphNavButton 
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-primary/10"
                onClick={openCart}
                ariaLabel="Abrir carrito"
                icon={MorphShoppingCart}
                iconClassName="h-5 w-5"
              >
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {itemCount}
                  </span>
                )}
              </MorphNavButton>

              {sessionUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                      <Avatar className="h-9 w-9 border-2 border-border">
                        <AvatarImage src={sessionUser.image ?? ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {sessionUser.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                    <DropdownMenuLabel className="font-normal p-3 rounded-lg bg-muted/50">
                      <p className="font-semibold">{sessionUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sessionUser.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/account/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Mis pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/account/favorites" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Mis favoritos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/account/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Mi perfil
                      </Link>
                    </DropdownMenuItem>
                    {dashboardSlug && (
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href={`/dashboard/${dashboardSlug}`} className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Panel de vendedor
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {sessionUser.globalRole === "PLATFORM_ADMIN" && (
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href="/admin" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Panel de administrador
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-destructive focus:text-destructive rounded-lg cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" asChild>
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button size="sm" className="rounded-full px-5" asChild>
                    <Link href="/register">Registrarse</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <MorphNavButton 
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                ariaLabel={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                ariaExpanded={mobileMenuOpen}
                icon={mobileMenuOpen ? MorphX : MorphMenu}
                iconClassName="h-5 w-5"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <nav className="flex flex-col gap-1">
                <MorphNavLink
                  href="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  icon={MorphStore}
                  iconClassName="h-5 w-5 text-muted-foreground"
                >
                  Tiendas
                </MorphNavLink>
                <MorphNavLink
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  icon={MorphPackage}
                  iconClassName="h-5 w-5 text-muted-foreground"
                >
                  Productos
                </MorphNavLink>
                {!session && (
                  <MorphNavLink
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors sm:hidden"
                    icon={MorphUser}
                    iconClassName="h-5 w-5 text-muted-foreground"
                  >
                    Iniciar sesión
                  </MorphNavLink>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-lg md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Button
                key={href}
                variant="ghost"
                className={`h-auto flex-col gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
                asChild
              >
                <Link href={href} aria-current={active ? "page" : undefined}>
                  <InteractiveMorphIcon icon={Icon} className="h-4 w-4" hovered={active} spring="snappy" reducedMotion="never" />
                  <span>{label}</span>
                </Link>
              </Button>
            )
          })}

          <Button
            type="button"
            variant="ghost"
            className={`h-auto flex-col gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
              itemCount > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
            onClick={openCart}
            aria-label="Abrir carrito"
          >
              <span className="relative">
              <InteractiveMorphIcon icon={MorphShoppingCart} className="h-4 w-4" spring="snappy" reducedMotion="never" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </span>
            <span>Carrito</span>
          </Button>

          <Button
            variant="ghost"
            className={`h-auto flex-col gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
              pathname.startsWith("/account") || pathname.startsWith("/login") ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
            asChild
          >
            <Link href={accountHref} aria-current={pathname.startsWith("/account") || pathname.startsWith("/login") ? "page" : undefined}>
              <InteractiveMorphIcon icon={MorphUser} className="h-4 w-4" spring="snappy" reducedMotion="never" />
              <span>Cuenta</span>
            </Link>
          </Button>
        </div>
      </nav>
    </>
  )
}








