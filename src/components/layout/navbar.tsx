"use client"

import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { ShoppingCart, User, Package, LogOut, Search, Store, Menu, X, LayoutDashboard } from "lucide-react"
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
import { CitySelector } from "@/components/layout/city-selector"
import { CartDrawer } from "@/components/layout/cart-drawer"
import type { Session } from "next-auth"
import { useState } from "react"

type NavbarProps = {
  session: Session | null
  dashboardSlug: string | null
}

export function Navbar({ session, dashboardSlug }: NavbarProps) {
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const openCart = useCartStore((s) => s.openCart)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sessionUser = session?.user

  return (
    <>
      <CartDrawer />
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo & City */}
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
              <div className="hidden md:block">
                <CitySelector />
              </div>
            </div>

            {/* Search - Desktop */}
            <div className="flex-1 max-w-xl hidden md:block">
              <form action="/search" className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  name="q"
                  placeholder="Buscar productos, tiendas..."
                  className="w-full h-10 rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </form>
            </div>

            {/* Nav Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                href="/stores" 
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Store className="h-4 w-4" />
                Tiendas
              </Link>
              <Link 
                href="/search" 
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Package className="h-4 w-4" />
                Productos
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Mobile */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full"
                    aria-label="Abrir búsqueda"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="top-[72px] left-4 right-4 translate-x-0 translate-y-0 w-[calc(100%-2rem)] max-w-none rounded-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 sm:left-auto sm:right-4 sm:w-96 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Buscar</DialogTitle>
                    <DialogDescription>Escribe lo que buscas y ve a resultados.</DialogDescription>
                  </DialogHeader>
                  <form action="/search" method="get" className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        name="q"
                        autoFocus
                        placeholder="Buscar productos, tiendas..."
                        className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <Button type="submit">Ir</Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Cart */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full hover:bg-primary/10" 
                onClick={openCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {itemCount}
                  </span>
                )}
              </Button>

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
                          Admin
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="md:hidden border-t border-border/50 py-2">
            <CitySelector />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <nav className="flex flex-col gap-1">
                <Link 
                  href="/stores" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Store className="h-5 w-5 text-muted-foreground" />
                  Tiendas
                </Link>
                <Link 
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Productos
                </Link>
                {!session && (
                  <Link 
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors sm:hidden"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    Iniciar sesión
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
