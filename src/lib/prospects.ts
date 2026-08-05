import type { Prisma } from "@prisma/client"

export const PROSPECT_SOURCES = ["MANUAL", "GOOGLE_MAPS", "FACEBOOK", "INSTAGRAM", "REFERRAL", "OTHER"] as const
export type ProspectSourceValue = (typeof PROSPECT_SOURCES)[number]

export const PROSPECT_SOURCE_LABELS: Record<ProspectSourceValue, string> = {
  MANUAL: "Manual",
  GOOGLE_MAPS: "Google Maps",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  REFERRAL: "Referencia",
  OTHER: "Otro",
}

export const PROSPECT_CONTACT_CHANNELS = ["IN_PERSON", "EMAIL", "PHONE", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "OTHER"] as const
export type ProspectContactChannelValue = (typeof PROSPECT_CONTACT_CHANNELS)[number]

export const PROSPECT_CONTACT_CHANNEL_LABELS: Record<ProspectContactChannelValue, string> = {
  IN_PERSON: "En persona",
  EMAIL: "Correo",
  PHONE: "Llamada",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  OTHER: "Otro",
}

export const PROSPECT_STATUSES = [
  "NEW",
  "PENDING_CONTACT",
  "CONTACTED",
  "REPLIED",
  "FOLLOW_UP",
  "SECOND_MESSAGE",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "NO_RESPONSE",
  "DISCARDED",
] as const
export type ProspectStatusValue = (typeof PROSPECT_STATUSES)[number]

export const PROSPECT_STATUS_LABELS: Record<ProspectStatusValue, string> = {
  NEW: "Nuevo",
  PENDING_CONTACT: "Pendiente de contacto",
  CONTACTED: "Contactado",
  REPLIED: "Respondió",
  FOLLOW_UP: "Seguimiento",
  SECOND_MESSAGE: "Segundo mensaje",
  MEETING_SCHEDULED: "Reunión agendada",
  PROPOSAL_SENT: "Propuesta enviada",
  NEGOTIATION: "Negociación",
  WON: "Ganado",
  NO_RESPONSE: "Sin respuesta",
  DISCARDED: "Descartado",
}

export const PROSPECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const
export type ProspectPriorityValue = (typeof PROSPECT_PRIORITIES)[number]

export const PROSPECT_PRIORITY_LABELS: Record<ProspectPriorityValue, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
}

export const PROSPECT_ACTIVITY_TYPES = [
  "CREATED",
  "CONTACT_ATTEMPT",
  "MESSAGE_SENT",
  "EMAIL_SENT",
  "IN_PERSON_VISIT",
  "PHONE_CALL",
  "RESPONSE_RECEIVED",
  "FOLLOW_UP",
  "MEETING",
  "PROPOSAL_SENT",
  "STATUS_CHANGED",
  "NOTE_ADDED",
] as const
export type ProspectActivityTypeValue = (typeof PROSPECT_ACTIVITY_TYPES)[number]

export const PROSPECT_ACTIVITY_TYPE_LABELS: Record<ProspectActivityTypeValue, string> = {
  CREATED: "Creado",
  CONTACT_ATTEMPT: "Intento de contacto",
  MESSAGE_SENT: "Mensaje enviado",
  EMAIL_SENT: "Correo enviado",
  IN_PERSON_VISIT: "Visita física",
  PHONE_CALL: "Llamada",
  RESPONSE_RECEIVED: "Respuesta recibida",
  FOLLOW_UP: "Seguimiento",
  MEETING: "Reunión",
  PROPOSAL_SENT: "Propuesta enviada",
  STATUS_CHANGED: "Cambio de estado",
  NOTE_ADDED: "Nota",
}

const SEARCHABLE_WHITESPACE = /\s+/g
const STRIP_DIACRITICS = /[\u0300-\u036f]/g

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeProspectText(value: string | null | undefined) {
  const trimmed = emptyToNull(value)
  if (!trimmed) return null
  return trimmed
    .normalize("NFD")
    .replace(STRIP_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(SEARCHABLE_WHITESPACE, " ")
    .trim()
}

export function slugifyProspectText(value: string | null | undefined) {
  const normalized = normalizeProspectText(value)
  if (!normalized) return null
  return normalized.replace(/\s+/g, "-")
}

export function normalizeProspectPhone(value: string | null | undefined) {
  const raw = emptyToNull(value)
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, "")
  return digits || null
}

export function normalizeProspectEmail(value: string | null | undefined) {
  const raw = emptyToNull(value)
  return raw ? raw.toLowerCase() : null
}

export function normalizeProspectUrl(value: string | null | undefined) {
  const raw = emptyToNull(value)
  if (!raw) return null

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const url = new URL(candidate)
    url.hash = ""
    url.search = ""
    url.hostname = url.hostname.toLowerCase()
    url.protocol = url.protocol.toLowerCase()
    url.pathname = url.pathname.replace(/\/+$/, "") || "/"
    return url.toString().replace(/\/$/, "")
  } catch {
    return raw.toLowerCase()
  }
}

export function normalizeProspectDraft(input: {
  businessName: string
  slug?: string | null
  contactName?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  googleMapsUrl?: string | null
  address?: string | null
  city: string
  category?: string | null
  notes?: string | null
  source: ProspectSourceValue
  status: ProspectStatusValue
  priority: ProspectPriorityValue
  assignedToId?: string | null
  lastContactAt?: Date | string | null
  nextFollowUpAt?: Date | string | null
}) {
  return {
    businessName: input.businessName.trim(),
    businessNameNormalized: normalizeProspectText(input.businessName) ?? input.businessName.trim().toLowerCase(),
    slug: slugifyProspectText(input.slug),
    contactName: emptyToNull(input.contactName),
    phone: emptyToNull(input.phone),
    phoneNormalized: normalizeProspectPhone(input.phone),
    email: emptyToNull(input.email),
    emailNormalized: normalizeProspectEmail(input.email),
    website: emptyToNull(input.website),
    websiteNormalized: normalizeProspectUrl(input.website),
    facebookUrl: emptyToNull(input.facebookUrl),
    facebookUrlNormalized: normalizeProspectUrl(input.facebookUrl),
    instagramUrl: emptyToNull(input.instagramUrl),
    instagramUrlNormalized: normalizeProspectUrl(input.instagramUrl),
    googleMapsUrl: emptyToNull(input.googleMapsUrl),
    googleMapsUrlNormalized: normalizeProspectUrl(input.googleMapsUrl),
    address: emptyToNull(input.address),
    city: input.city.trim(),
    category: emptyToNull(input.category),
    notes: emptyToNull(input.notes),
    source: input.source,
    status: input.status,
    priority: input.priority,
    assignedToId: emptyToNull(input.assignedToId),
    lastContactAt: input.lastContactAt ? new Date(input.lastContactAt) : null,
    nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null,
  }
}

export function isProspectTerminalStatus(status: ProspectStatusValue) {
  return status === "WON" || status === "DISCARDED"
}

export function normalizeTerminalProspectState(status: ProspectStatusValue, nextFollowUpAt: Date | null | undefined) {
  return {
    status,
    nextFollowUpAt: isProspectTerminalStatus(status) ? null : nextFollowUpAt ?? null,
  }
}

type ProspectLike = {
  id: string
  businessNameNormalized: string
  phoneNormalized: string | null
  emailNormalized: string | null
  websiteNormalized: string | null
  googleMapsUrlNormalized: string | null
  facebookUrlNormalized: string | null
  instagramUrlNormalized: string | null
}

export function buildProspectDuplicateWhere(
  input: Partial<ProspectLike>,
  excludeId?: string
): Prisma.ProspectWhereInput | null {
  const clauses: Prisma.ProspectWhereInput[] = []

  if (input.businessNameNormalized) clauses.push({ businessNameNormalized: input.businessNameNormalized })
  if (input.phoneNormalized) clauses.push({ phoneNormalized: input.phoneNormalized })
  if (input.emailNormalized) clauses.push({ emailNormalized: input.emailNormalized })
  if (input.websiteNormalized) clauses.push({ websiteNormalized: input.websiteNormalized })
  if (input.googleMapsUrlNormalized) clauses.push({ googleMapsUrlNormalized: input.googleMapsUrlNormalized })
  if (input.facebookUrlNormalized) clauses.push({ facebookUrlNormalized: input.facebookUrlNormalized })
  if (input.instagramUrlNormalized) clauses.push({ instagramUrlNormalized: input.instagramUrlNormalized })

  if (!clauses.length) return null

  const where: Prisma.ProspectWhereInput = { OR: clauses }
  if (excludeId) {
    return { AND: [{ id: { not: excludeId } }, where] }
  }

  return where
}

export function buildProspectSearchWhere(query: string | null | undefined): Prisma.ProspectWhereInput | undefined {
  const term = emptyToNull(query)
  if (!term) return undefined

  const normalized = normalizeProspectText(term) ?? term.toLowerCase()
  return {
    OR: [
      { businessName: { contains: term, mode: "insensitive" } },
      { businessNameNormalized: { contains: normalized } },
      { contactName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { website: { contains: term, mode: "insensitive" } },
      { facebookUrl: { contains: term, mode: "insensitive" } },
      { instagramUrl: { contains: term, mode: "insensitive" } },
      { googleMapsUrl: { contains: term, mode: "insensitive" } },
    ],
  }
}

export function isProspectOverdueFollowUp(nextFollowUpAt: Date | string | null | undefined, status: ProspectStatusValue) {
  if (!nextFollowUpAt || isProspectTerminalStatus(status)) return false
  return new Date(nextFollowUpAt).getTime() < Date.now()
}

export function getProspectDuplicateKeys(prospect: {
  businessNameNormalized: string
  phoneNormalized: string | null
  emailNormalized: string | null
  websiteNormalized: string | null
  googleMapsUrlNormalized: string | null
  facebookUrlNormalized: string | null
  instagramUrlNormalized: string | null
}) {
  return [
    prospect.businessNameNormalized,
    prospect.phoneNormalized,
    prospect.emailNormalized,
    prospect.websiteNormalized,
    prospect.googleMapsUrlNormalized,
    prospect.facebookUrlNormalized,
    prospect.instagramUrlNormalized,
  ].filter(Boolean) as string[]
}

export function prospectStatusBadgeVariant(status: ProspectStatusValue) {
  if (status === "WON") return "success"
  if (status === "DISCARDED") return "destructive"
  if (status === "NO_RESPONSE") return "secondary"
  return "outline"
}

export function prospectPriorityBadgeVariant(priority: ProspectPriorityValue) {
  if (priority === "HIGH") return "destructive"
  if (priority === "MEDIUM") return "default"
  return "secondary"
}

export const PROSPECT_LIST_PAGE_SIZE = 20

export function parseProspectSort(sort: string | null | undefined) {
  switch (sort) {
    case "lastContactAt":
      return [{ lastContactAt: "desc" as const }, { createdAt: "desc" as const }]
    case "nextFollowUpAt":
      return [{ nextFollowUpAt: "asc" as const }, { createdAt: "desc" as const }]
    case "createdAt":
    default:
      return [{ createdAt: "desc" as const }]
  }
}
