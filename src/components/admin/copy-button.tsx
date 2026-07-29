"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

type CopyButtonProps = {
  text: string
  label?: string
}

export function CopyButton({ text, label = "Copiar" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copiado" : label}
    </Button>
  )
}
