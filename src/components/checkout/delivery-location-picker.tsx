"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DeliveryLocationDraft } from "@/lib/delivery"

type Props = {
  value: DeliveryLocationDraft
  onChange: (value: DeliveryLocationDraft) => void
  disabled?: boolean
}

let googleMapsLoader: Promise<void> | null = null

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps solo corre en cliente"))
  const mapsWindow = window as Window & { google?: { maps?: unknown } }
  if (mapsWindow.google?.maps) return Promise.resolve()
  if (googleMapsLoader) return googleMapsLoader

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps="checkout"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.dataset.googleMaps = "checkout"
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"))
    document.head.appendChild(script)
  })

  return googleMapsLoader
}

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }

export function DeliveryLocationPicker({ value, onChange, disabled }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [addressInput, setAddressInput] = useState(value.formattedAddress)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const addressInputRef = useRef(value.formattedAddress)

  useEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
    setAddressInput(value.formattedAddress)
    addressInputRef.current = value.formattedAddress
  }, [onChange, value])

  useEffect(() => {
    if (!apiKey) {
      setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.")
      return
    }
    let cancelled = false

    setLoading(true)
    loadGoogleMaps(apiKey)
      .then(() => {
        const mapsWindow = window as Window & { google?: { maps?: unknown } }
        if (cancelled || !mapRef.current || !inputRef.current || !mapsWindow.google?.maps) return

        const maps = mapsWindow.google!.maps as any
        const center = value.lat !== null && value.lng !== null ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER

        const map = new maps.Map(mapRef.current, {
          center,
          zoom: value.lat !== null && value.lng !== null ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

        const marker = new maps.Marker({
          map,
          position: center,
          draggable: true,
        })

        const geocoder = new maps.Geocoder()

        const syncLocation = async (lat: number, lng: number) => {
          const location = { lat, lng }
          marker.setPosition(location)
          map.panTo(location)
          if (map.getZoom() < 15) {
            map.setZoom(15)
          }
          let formattedAddress = addressInputRef.current
          try {
            const response = await geocoder.geocode({ location })
            formattedAddress = response.results?.[0]?.formatted_address ?? formattedAddress
          } catch {
            // Keep the last usable address text.
          }
          setAddressInput(formattedAddress)
          onChangeRef.current({
            ...valueRef.current,
            formattedAddress,
            lat,
            lng,
          })
        }

        if (value.lat !== null && value.lng !== null) {
          marker.setPosition({ lat: value.lat, lng: value.lng })
        }

        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
        })

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace()
          const location = place?.geometry?.location
          if (!location) return
          const lat = typeof location.lat === "function" ? location.lat() : location.lat
          const lng = typeof location.lng === "function" ? location.lng() : location.lng
          const formattedAddress = place.formatted_address ?? place.name ?? inputRef.current?.value ?? ""
          setAddressInput(formattedAddress)
          onChangeRef.current({
            ...valueRef.current,
            formattedAddress,
            lat,
            lng,
          })
          marker.setPosition({ lat, lng })
          map.panTo({ lat, lng })
          map.setZoom(15)
        })

        map.addListener("click", (event: any) => {
          const lat = event.latLng.lat()
          const lng = event.latLng.lng()
          void syncLocation(lat, lng)
        })

        marker.addListener("dragend", () => {
          const position = marker.getPosition()
          if (!position) return
          const lat = typeof position.lat === "function" ? position.lat() : position.lat
          const lng = typeof position.lng === "function" ? position.lng() : position.lng
          void syncLocation(lat, lng)
        })
        setMapsLoaded(true)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar Google Maps")
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Dirección</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={addressInput}
            onChange={(event) => {
              const next = event.target.value
              setAddressInput(next)
            onChangeRef.current({
              ...valueRef.current,
              formattedAddress: next,
              lat: null,
              lng: null,
            })
              addressInputRef.current = next
            }}
            disabled={disabled || !apiKey || loading}
            className="pl-9"
            placeholder="Busca una dirección"
          />
        </div>
      </div>

      <div
        ref={mapRef}
        className="h-72 overflow-hidden rounded-2xl border bg-muted/30"
      />

      <div className="rounded-2xl border bg-muted/20 p-3 text-xs text-muted-foreground">
        {error ? (
          <p>{error}</p>
        ) : loading ? (
          <p>Cargando Google Maps...</p>
        ) : mapsLoaded ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p>Haz clic en el mapa o arrastra el marcador para ajustar la ubicación.</p>
          </div>
        ) : (
          <p>Ingresa la clave de Google Maps para activar Places Autocomplete y el mapa.</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notas de entrega</label>
        <Textarea
          value={value.notes}
          onChange={(event) =>
            onChangeRef.current({
              ...valueRef.current,
              notes: event.target.value,
            })
          }
          disabled={disabled}
          rows={3}
          placeholder="Detalles para el repartidor"
        />
      </div>
    </div>
  )
}
