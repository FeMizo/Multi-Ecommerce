import { create } from "zustand"
import { persist } from "zustand/middleware"

type City = { id: string; name: string; slug: string; state: string }

const DEFAULT_CITIES: City[] = [
  { id: "1", name: "Lima", slug: "lima", state: "Lima" },
  { id: "2", name: "Arequipa", slug: "arequipa", state: "Arequipa" },
  { id: "3", name: "Cusco", slug: "cusco", state: "Cusco" },
  { id: "4", name: "Trujillo", slug: "trujillo", state: "La Libertad" },
  { id: "5", name: "Chiclayo", slug: "chiclayo", state: "Lambayeque" },
  { id: "6", name: "Piura", slug: "piura", state: "Piura" },
]

interface CityStore {
  city: City | null
  cities: City[]
  setCity: (city: City) => void
}

export const useCityStore = create<CityStore>()(
  persist(
    (set) => ({
      city: DEFAULT_CITIES[0],
      cities: DEFAULT_CITIES,
      setCity: (city) => set({ city }),
    }),
    { name: "city-store" }
  )
)
