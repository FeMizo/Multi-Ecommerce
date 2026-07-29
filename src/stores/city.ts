import { create } from "zustand"
import { persist } from "zustand/middleware"

type City = { id: string; name: string; slug: string; state: string }

const DEFAULT_CITIES: City[] = [
  { id: "7", name: "Ciudad del Carmen", slug: "ciudad-del-carmen", state: "Campeche" },
  { id: "1", name: "Ciudad de México", slug: "cdmx", state: "CDMX" },
  { id: "2", name: "Guadalajara", slug: "guadalajara", state: "Jalisco" },
  { id: "3", name: "Monterrey", slug: "monterrey", state: "Nuevo León" },
  { id: "4", name: "Puebla", slug: "puebla", state: "Puebla" },
  { id: "5", name: "Tijuana", slug: "tijuana", state: "Baja California" },
  { id: "6", name: "León", slug: "leon", state: "Guanajuato" },
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
    {
      name: "city-store",
      version: 2,
      migrate: (state) => {
        const migrated = state as Partial<CityStore> | undefined
        const city = migrated?.city && DEFAULT_CITIES.find((item) => item.slug === migrated.city?.slug)
          ? migrated.city
          : DEFAULT_CITIES[0]
        return {
          city,
          cities: DEFAULT_CITIES,
        } as CityStore
      },
    }
  )
)
