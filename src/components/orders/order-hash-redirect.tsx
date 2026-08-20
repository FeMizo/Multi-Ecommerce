"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function normalizeHashId(value: string) {
  return value.trim().replace(/^#/, "")
}

export function OrderHashRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const existingId = searchParams.get("id")
    if (existingId) return

    const hashId = normalizeHashId(window.location.hash)
    if (!hashId) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("id", hashId)
    router.replace(`/orders?${params.toString()}`)
  }, [router, searchParams])

  return null
}
