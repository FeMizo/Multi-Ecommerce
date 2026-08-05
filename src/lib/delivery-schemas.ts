import { z } from "zod"
import { DELIVERY_METHODS, DELIVERY_STATUSES, DRIVER_STATUSES } from "@/lib/delivery"

const nullableText = (max: number) => z.string().max(max).optional().transform((value) => value?.trim() || "")

export const driverCreateSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  plate: z.string().min(2).max(20),
  licenseNumber: z.string().min(3).max(60),
  notes: z.string().max(500).optional().transform((value) => value?.trim() || ""),
  status: z.enum(DRIVER_STATUSES).default("AVAILABLE"),
})

export const driverFormSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  plate: z.string().min(2).max(20),
  licenseNumber: z.string().min(3).max(60),
  notes: z.string().max(500),
  status: z.enum(DRIVER_STATUSES),
})

export const driverUpdateSchema = driverCreateSchema.extend({
  status: z.enum(DRIVER_STATUSES),
})

export const deliveryAssignmentSchema = z.object({
  driverId: z.string().min(1).nullable(),
})

export const riderDeliveryUpdateSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
  notes: z.string().max(500).optional().transform((value) => value?.trim() || ""),
})

export const deliveryLocationSchema = z.object({
  formattedAddress: z.string().min(3).max(255),
  lat: z.number(),
  lng: z.number(),
  notes: z.string().max(500).optional().transform((value) => value?.trim() || ""),
})

export const deliveryCreateSchema = z.object({
  deliveryMethod: z.enum(DELIVERY_METHODS),
  deliveryLocation: deliveryLocationSchema.nullable().optional(),
})

export function optionalText(max: number) {
  return nullableText(max)
}
