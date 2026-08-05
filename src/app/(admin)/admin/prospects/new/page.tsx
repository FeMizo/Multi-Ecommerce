import { requireAdmin } from "@/lib/admin-auth"
import { ProspectEditorForm } from "@/components/admin/prospects/prospect-editor-form"

export default async function AdminNewProspectPage() {
  await requireAdmin()

  return (
    <ProspectEditorForm
      mode="create"
      actionLabel="Nuevo prospecto"
      submitLabel="Crear prospecto"
      successHref="/admin/prospects/:id"
      defaultValues={{
        source: "MANUAL",
        status: "NEW",
        priority: "MEDIUM",
      }}
    />
  )
}
