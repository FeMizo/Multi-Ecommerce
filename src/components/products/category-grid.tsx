import Link from "next/link"
import { ArrowRight, Shirt, Smartphone, Home, Dumbbell, Sparkles, Gamepad2, BookOpen, UtensilsCrossed, Palette, Dog, Flower2, Laptop } from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
  _count: { products: number }
}

// Icon mapping with Lucide icons and gradient colors
const categoryConfig: Record<string, { icon: React.ElementType; gradient: string }> = {
  "ropa": { icon: Shirt, gradient: "from-rose-500/20 to-pink-500/10" },
  "tecnologia": { icon: Smartphone, gradient: "from-blue-500/20 to-cyan-500/10" },
  "hogar": { icon: Home, gradient: "from-amber-500/20 to-orange-500/10" },
  "deportes": { icon: Dumbbell, gradient: "from-green-500/20 to-emerald-500/10" },
  "belleza": { icon: Sparkles, gradient: "from-purple-500/20 to-pink-500/10" },
  "juguetes": { icon: Gamepad2, gradient: "from-indigo-500/20 to-violet-500/10" },
  "libros": { icon: BookOpen, gradient: "from-yellow-500/20 to-amber-500/10" },
  "comida": { icon: UtensilsCrossed, gradient: "from-red-500/20 to-orange-500/10" },
  "arte": { icon: Palette, gradient: "from-fuchsia-500/20 to-purple-500/10" },
  "mascotas": { icon: Dog, gradient: "from-teal-500/20 to-cyan-500/10" },
  "jardin": { icon: Flower2, gradient: "from-lime-500/20 to-green-500/10" },
  "electronica": { icon: Laptop, gradient: "from-slate-500/20 to-gray-500/10" },
}

function getCategoryConfig(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/-/g, "")
  return categoryConfig[normalizedSlug] || { icon: Sparkles, gradient: "from-primary/20 to-primary/5" }
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {categories.map((cat, index) => {
        const config = getCategoryConfig(cat.slug)
        const Icon = config.icon
        const isFirst = index === 0
        
        return (
          <Link
            key={cat.id}
            href={`/search?category=${cat.slug}`}
            className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover-lift ${
              isFirst ? 'sm:col-span-2 sm:row-span-2' : ''
            }`}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className={`relative p-6 h-full flex flex-col ${isFirst ? 'sm:p-10' : ''}`}>
              {/* Icon */}
              <div className={`inline-flex items-center justify-center rounded-2xl bg-muted/80 group-hover:bg-card/80 backdrop-blur-sm transition-colors mb-4 ${
                isFirst ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-14 w-14'
              }`}>
                <Icon className={`text-muted-foreground group-hover:text-primary transition-colors ${
                  isFirst ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-7 w-7'
                }`} />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className={`font-bold group-hover:text-primary transition-colors ${
                  isFirst ? 'text-xl sm:text-2xl' : 'text-base'
                }`}>
                  {cat.name}
                </h3>
                <p className={`text-muted-foreground mt-1 ${
                  isFirst ? 'text-sm' : 'text-xs'
                }`}>
                  {cat._count.products} {cat._count.products === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              
              {/* Arrow indicator */}
              <div className={`absolute right-4 flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-all ${
                isFirst ? 'bottom-6 sm:bottom-10' : 'bottom-4'
              }`}>
                <span className={`font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${
                  isFirst ? 'text-sm' : 'text-xs'
                }`}>
                  Ver mas
                </span>
                <div className={`rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-all ${
                  isFirst ? 'h-10 w-10' : 'h-8 w-8'
                }`}>
                  <ArrowRight className={`group-hover:translate-x-0.5 transition-transform ${
                    isFirst ? 'h-5 w-5' : 'h-4 w-4'
                  }`} />
                </div>
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <div className="absolute -top-8 -left-8 h-20 w-20 rounded-full bg-primary/3 group-hover:bg-primary/5 transition-colors" />
          </Link>
        )
      })}
    </div>
  )
}
