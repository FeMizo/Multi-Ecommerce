import { z } from "zod"
import { PROSPECT_ACTIVITY_TYPES, PROSPECT_CONTACT_CHANNELS, PROSPECT_PRIORITIES, PROSPECT_SOURCES, PROSPECT_STATUSES } from "@/lib/prospects"

const emptyToNull = (value: unknown) => (value === "" ? null : value)

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().min(1).max(max).nullish())

const optionalUrl = z.preprocess((value) => {
  if (value === "" || value == null) return null
  if (typeof value !== "string") return value
  const raw = value.trim()
  if (!raw) return null
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}, z.string().url("URL invalida").nullish())

export const prospectCreateSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  slug: optionalText(120),
  contactName: optionalText(180),
  phone: optionalText(40),
  email: z.preprocess(emptyToNull, z.string().trim().email("Email invalido").nullish()),
  website: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  googleMapsUrl: optionalUrl,
  address: optionalText(250),
  city: z.string().trim().min(2).max(120),
  category: optionalText(120),
  notes: optionalText(4000),
  source: z.enum(PROSPECT_SOURCES),
  status: z.enum(PROSPECT_STATUSES),
  priority: z.enum(PROSPECT_PRIORITIES),
  assignedToId: z.preprocess(emptyToNull, z.string().trim().min(1).nullish()),
  lastContactAt: z.preprocess(emptyToNull, z.union([z.string(), z.date()]).nullish()),
  nextFollowUpAt: z.preprocess(emptyToNull, z.union([z.string(), z.date()]).nullish()),
})

export const prospectUpdateSchema = prospectCreateSchema.partial().extend({
  businessName: z.string().trim().min(2).max(180).optional(),
})

export const prospectDuplicateCheckSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  slug: optionalText(120),
  phone: optionalText(40),
  email: z.preprocess(emptyToNull, z.string().trim().email("Email invalido").nullish()),
  website: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  googleMapsUrl: optionalUrl,
})

export const prospectActivitySchema = z.object({
  channel: z.enum(PROSPECT_CONTACT_CHANNELS),
  activityType: z.enum(PROSPECT_ACTIVITY_TYPES),
  comment: optionalText(4000),
  result: optionalText(120),
  nextFollowUpAt: z.preprocess(emptyToNull, z.union([z.string(), z.date()]).nullish()),
})

export const prospectFollowUpSchema = z.object({
  nextFollowUpAt: z.preprocess(emptyToNull, z.union([z.string(), z.date()]).nullish()),
})
