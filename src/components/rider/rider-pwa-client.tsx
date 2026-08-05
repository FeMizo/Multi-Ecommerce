"use client"

import { useEffect, useState } from "react"
import { Smartphone, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function RiderPwaClient() {
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)")
    const syncInstalled = () => {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
      setInstalled(displayMode.matches || navigatorWithStandalone.standalone === true)
    }
    syncInstalled()
    displayMode.addEventListener("change", syncInstalled)

    return () => {
      displayMode.removeEventListener("change", syncInstalled)
    }
  }, [])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/rider/" })
      } catch {
        // PWA enhancement only.
      }
    }

    void register()
  }, [])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const promptEvent = event as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      setCanInstall(true)
    }

    const onAppInstalled = () => {
      setCanInstall(false)
      setInstallPrompt(null)
      setInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setCanInstall(false)
    setInstallPrompt(null)
  }

  if (!canInstall || installed || hidden) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Instala el panel del repartidor</p>
          <p className="text-sm text-muted-foreground">
            Funciona como app y abre más rápido desde la pantalla de inicio.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => void installApp()}>
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHidden(true)}>
              <X className="mr-2 h-4 w-4" />
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
