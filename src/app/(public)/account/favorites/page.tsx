import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FavoritesPage } from "@/components/account/favorites-page"

export default async function AccountFavoritesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return <FavoritesPage />
}
