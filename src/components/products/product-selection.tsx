"use client"
import { createContext, useContext, useState } from "react"
import Image from "next/image"
import { defaultVariantSelection, getVariantImage, normalizeVariantOptions, type ProductVariantSelection } from "@/lib/product-variants"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
const Selection = createContext<{ selected: ProductVariantSelection[]; setSelected: (value: ProductVariantSelection[]) => void } | null>(null)
export function ProductSelectionProvider({ variantOptions, children }: { variantOptions: unknown; children: React.ReactNode }) {
  const [selected, setSelected] = useState(() => defaultVariantSelection(normalizeVariantOptions(variantOptions)))
  return <Selection.Provider value={{ selected, setSelected }}>{children}</Selection.Provider>
}
export const useProductSelection = () => useContext(Selection)
export function ProductGallery({ name, images, variantOptions }: { name: string; images: string[]; variantOptions: unknown }) {
  const selection = useProductSelection()
  const options = normalizeVariantOptions(variantOptions)
  const key = JSON.stringify(selection?.selected ?? [])
  const [preview, setPreview] = useState<{ key: string; image: string } | null>(null)
  const image = preview?.key === key ? preview.image : getVariantImage(options, selection?.selected ?? [], images) || DEFAULT_PRODUCT_IMAGE
  const variantImages = new Set(options.flatMap((option) => option.values.map((value) => value.imageUrl).filter(Boolean)))
  const generalImages = images.filter((image) => !variantImages.has(image))
  return <div className="space-y-3"><div className="relative aspect-square overflow-hidden rounded-[2rem] border bg-card"><Image src={image} alt={name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" preload /></div>
    {generalImages.length > 1 && <div className="grid grid-cols-4 gap-3">{generalImages.map((src, index) => <button key={src} type="button" aria-label={`Ver imagen ${index + 1} de ${name}`} onClick={() => setPreview({ key, image: src })} className="relative aspect-square overflow-hidden rounded-xl border"><Image src={src} alt="" fill sizes="120px" className="object-contain" /></button>)}</div>}
  </div>
}
