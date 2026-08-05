import { requireAdmin } from "@/lib/admin-auth"
import { ProspectImportWorkbench } from "@/components/admin/prospects/prospect-import-workbench"

export default async function AdminProspectsImportPage() {
  await requireAdmin()

  return <ProspectImportWorkbench />
}
