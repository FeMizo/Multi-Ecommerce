export type CategoryLabelSource = {
  name: string
  parent?: {
    name: string
  } | null
}

export function formatCategoryLabel(category: CategoryLabelSource) {
  return category.parent?.name ? `${category.parent.name} / ${category.name}` : category.name
}
