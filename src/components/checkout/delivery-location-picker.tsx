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

type GoogleMapsLatLng = {
  lat: () => number
  lng: () => number
}

type GoogleMapsPoint = {
  lat: number
  lng: number
}

type GoogleMapsPlace = {
  formatted_address?: string
  name?: string
  geometry?: {
    location?: GoogleMapsLatLng | GoogleMapsPoint | null
  }
}

type GoogleMapsListener = {
  remove?: () => void
}

type GoogleMapsMap = {
  panTo: (location: GoogleMapsPoint) => void
  setZoom: (zoom: number) => void
  getZoom: () => number
  addListener: (eventName: "click", handler: (event: { latLng: GoogleMapsLatLng }) => void) => GoogleMapsListener
}

type GoogleMapsMarker = {
  setPosition: (location: GoogleMapsPoint) => void
  getPosition: () => GoogleMapsLatLng | GoogleMapsPoint | null
  addListener: (eventName: "dragend", handler: () => void) => GoogleMapsListener
}

type GoogleMapsGeocoder = {
  geocode: (request: { location: GoogleMapsPoint }) => Promise<{ results?: Array<{ formatted_address?: string }> }>
}

type GoogleMapsAutocomplete = {
  getPlace: () => GoogleMapsPlace
  addListener: (eventName: "place_changed", handler: () => void) => GoogleMapsListener
}

type GoogleMapsApi = {
  Map: new (
    element: HTMLElement,
    options: {
      center: GoogleMapsPoint
      zoom: number
      mapTypeControl: boolean
      streetViewControl: boolean
      fullscreenControl: boolean
      clickableIcons: boolean
    },
  ) => GoogleMapsMap
  Marker: new (options: { map: GoogleMapsMap; position: GoogleMapsPoint; draggable: boolean }) => GoogleMapsMarker
  Geocoder: new () => GoogleMapsGeocoder
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      options: { fields: string[]; types: string[] },
    ) => GoogleMapsAutocomplete
  }
}

let googleMapsLoader: Promise<void> | null = null

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps solo corre en cliente"))

  const mapsWindow = window as Window & { google?: { maps?: GoogleMapsApi } }
  if (mapsWindow.google?.maps) return Promise.resolve()
  if (googleMapsLoader) return googleMapsLoader

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps="checkout"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener(
        "error",
        () => {
          googleMapsLoader = null
          reject(new Error("No se pudo cargar Google Maps"))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement("script")
    script.dataset.googleMaps = "checkout"
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`
    script.onload = () => resolve()
    script.onerror = () => {
      googleMapsLoader = null
      reject(new Error("No se pudo cargar Google Maps"))
    }
    document.head.appendChild(script)
  })

  return googleMapsLoader
}

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }

export function DeliveryLocationPicker({ value, onChange, disabled }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    valueRef.current = value
    onChangeRef.current = onChange
  }, [onChange, value])

  useEffect(() => {
    if (!apiKey) return

    let cancelled = false

    loadGoogleMaps(apiKey)
      .then(() => {
        const mapsWindow = window as Window & { google?: { maps?: GoogleMapsApi } }
        const mapsApi = mapsWindow.google?.maps
        const currentValue = valueRef.current

        if (cancelled || !mapRef.current || !inputRef.current || !mapsApi) return
        if (!mapsApi.places?.Autocomplete || !mapsApi.Geocoder || !mapsApi.Map || !mapsApi.Marker) {
          setLoadError("Activa Maps JavaScript API, Places API y Geocoding API para esta clave.")
          return
        }

        const center =
          currentValue.lat !== null && currentValue.lng !== null
            ? { lat: currentValue.lat, lng: currentValue.lng }
            : DEFAULT_CENTER

        const map = new mapsApi.Map(mapRef.current, {
          center,
          zoom: currentValue.lat !== null && currentValue.lng !== null ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })

        const marker = new mapsApi.Marker({
          map,
          position: center,
          draggable: true,
        })

        const geocoder = new mapsApi.Geocoder()

        const syncLocation = async (lat: number, lng: number) => {
          const location = { lat, lng }
          marker.setPosition(location)
          map.panTo(location)
          if (map.getZoom() < 15) {
            map.setZoom(15)
          }

          let formattedAddress = valueRef.current.formattedAddress
          try {
            const response = await geocoder.geocode({ location })
            formattedAddress = response.results?.[0]?.formatted_address ?? formattedAddress
          } catch {
            // Keep the last usable address text.
          }

          onChangeRef.current({
            ...valueRef.current,
            formattedAddress,
            lat,
            lng,
          })
        }

        if (currentValue.lat !== null && currentValue.lng !== null) {
          marker.setPosition({ lat: currentValue.lat, lng: currentValue.lng })
        }

        autocompleteRef.current = new mapsApi.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
        })

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace()
          const location = place?.geometry?.location
          if (!location) return

          const lat = typeof location.lat === "function" ? location.lat() : location.lat
          const lng = typeof location.lng === "function" ? location.lng() : location.lng
          const formattedAddress = place.formatted_address ?? place.name ?? inputRef.current?.value ?? ""

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

        map.addListener("click", (event) => {
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
        setLoadError(loadError instanceof Error ? loadError.message : "No se pudo cargar Google Maps")
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  const statusMessage = !apiKey
    ? "Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
    : loadError
  const isLoading = Boolean(apiKey) && !mapsLoaded && !loadError

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Direccion</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value.formattedAddress}
            onChange={(event) => {
              const next = event.target.value
              onChangeRef.current({
                ...valueRef.current,
                formattedAddress: next,
                lat: null,
                lng: null,
              })
            }}
            disabled={disabled || !apiKey || isLoading}
            className="pl-9"
            placeholder="Busca una direccion"
          />
        </div>
      </div>

      <div ref={mapRef} className="h-72 overflow-hidden rounded-2xl border bg-muted/30" />

      <div className="rounded-2xl border bg-muted/20 p-3 text-xs text-muted-foreground">
        {statusMessage ? (
          <p>{statusMessage}</p>
        ) : isLoading ? (
          <p>Cargando Google Maps...</p>
        ) : mapsLoaded ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p>Haz clic en el mapa o arrastra el marcador para ajustar la ubicacion.</p>
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
