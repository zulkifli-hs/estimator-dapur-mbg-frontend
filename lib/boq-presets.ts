export const FITTING_OUT_PRESETS: string[] = [
  "Partition Work",
  "Wall Finishes",
  "Door Work",
  "Ceiling Work",
  "Floor Work",
  "Other Work",
]

export const MEP_PRESETS: string[] = [
  "Switchboards, Cable Feeders, cable ladder, and its appurtenances",
  "Lighting",
  "Power Outlet",
  "Data / LAN Work",
  "Network Equipment",
  "AV",
  "Fire Alarm Installation Work",
  "Public Address Installation Work",
  "Wet Sprinkler",
  "Mechanical Ventilation and Air Conditioning Installation Work",
  "Miscellaneous",
]

export interface ProductItem {
  _id?: string
  name: string
  qty: number
  unit: string
  price: number
  productId?: string
  location?: string
  brand?: string
  note?: string
  tags?: string[]
  startDate?: string
  endDate?: string
}

export interface BOQCategory {
  _id?: string
  name: string
  isPreset: boolean
  products: ProductItem[]
}

const emptyProduct = (): ProductItem => ({
  name: "",
  qty: 0,
  unit: "",
  price: 0,
  tags: [],
  startDate: "",
  endDate: "",
})

export function initFittingOutCategories(): BOQCategory[] {
  return FITTING_OUT_PRESETS.map((name) => ({
    name,
    isPreset: true,
    products: [],
  }))
}

export function initMEPCategories(): BOQCategory[] {
  return MEP_PRESETS.map((name) => ({
    name,
    isPreset: true,
    products: [],
  }))
}

/**
 * Merges backend data into preset categories.
 * - Preset categories that match by name (case-insensitive) get their products filled.
 * - Categories from backend that don't match any preset are appended as custom categories.
 */
export function mergeFittingOutWithPresets(backendCategories: any[]): BOQCategory[] {
  const base = initFittingOutCategories()
  const unmatched: BOQCategory[] = []

  for (const cat of backendCategories) {
    const idx = base.findIndex(
      (p) => p.name.trim().toLowerCase() === cat.name?.trim().toLowerCase()
    )
    if (idx !== -1) {
      base[idx].products = (cat.products || []).map((p: any) => ({
        ...p,
        startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
        endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
      }))
      if (cat._id) base[idx]._id = cat._id
    } else {
      unmatched.push({
        _id: cat._id,
        name: cat.name,
        isPreset: false,
        products: (cat.products || []).map((p: any) => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
          endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
        })),
      })
    }
  }

  return [...base, ...unmatched]
}

export function mergeMEPWithPresets(backendCategories: any[]): BOQCategory[] {
  const base = initMEPCategories()
  const unmatched: BOQCategory[] = []

  for (const cat of backendCategories) {
    const idx = base.findIndex(
      (p) => p.name.trim().toLowerCase() === cat.name?.trim().toLowerCase()
    )
    if (idx !== -1) {
      base[idx].products = (cat.products || []).map((p: any) => ({
        ...p,
        startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
        endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
      }))
      if (cat._id) base[idx]._id = cat._id
    } else {
      unmatched.push({
        _id: cat._id,
        name: cat.name,
        isPreset: false,
        products: (cat.products || []).map((p: any) => ({
          ...p,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
          endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
        })),
      })
    }
  }

  return [...base, ...unmatched]
}

export { emptyProduct }
