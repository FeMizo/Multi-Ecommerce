import Link from "next/link"
import { ArrowRight } from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
  _count: { products: number }
}

// Icon mapping for better visuals
const categoryIcons: Record<string, string> = {
  "ropa": "👕",
  "tecnologia": "📱",
  "hogar": "🏠",
  "deportes": "⚽",
  "belleza": "💄",
  "juguetes": "🧸",
  "libros": "📚",
  "comida": "🍕",
  "arte": "🎨",
  "mascotas": "🐕",
  "jardin": "🌱",
  "electronica": "💻",
}

function getCategoryIcon(slug: string, icon?: string | null): string {
  if (icon) return icon
  const normalizedSlug = slug.toLowerCase().replace(/-/g, "")
  return categoryIcons[normalizedSlug] || "🛍️"
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat, index) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.slug}`}
          className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${
            index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
          }`}
        >
          <div className={`p-6 ${index === 0 ? 'sm:p-8' : ''}`}>
            {/* Icon */}
            <div className={`mb-4 ${index === 0 ? 'text-5xl sm:text-6xl' : 'text-4xl'}`}>
              {getCategoryIcon(cat.slug, cat.icon)}
            </div>
            
            {/* Content */}
            <div>
              <h3 className={`font-semibold group-hover:text-primary transition-colors ${
                index === 0 ? 'text-xl sm:text-2xl' : 'text-base'
              }`}>
                {cat.name}
              </h3>
              <p className={`text-muted-foreground mt-1 ${
                index === 0 ? 'text-sm' : 'text-xs'
              }`}>
                {cat._count.products} productos
              </p>
            </div>
            
            {/* Arrow */}
            <div className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        </Link>
      ))}
    </div>
  )
}
