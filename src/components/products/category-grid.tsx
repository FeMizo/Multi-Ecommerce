import Link from "next/link"

type Category = {
  id: string
  name: string
  slug: string
  icon?: string | null
  _count: { products: number }
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.slug}`}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-center"
        >
          <span className="text-2xl">{cat.icon ?? "🛍️"}</span>
          <span className="font-medium text-sm">{cat.name}</span>
          <span className="text-xs text-muted-foreground">{cat._count.products} productos</span>
        </Link>
      ))}
    </div>
  )
}
