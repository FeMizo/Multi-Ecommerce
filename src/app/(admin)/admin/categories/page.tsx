import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { CategoryManager } from "@/components/admin/category-manager"

export default async function AdminCategoriesPage() {
  await requireAdmin()

  const categories = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { products: true, children: true } },
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorias</h1>
      <CategoryManager categories={categories} />
    </div>
  )
}
