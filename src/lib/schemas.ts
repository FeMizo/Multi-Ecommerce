import { z } from "zod"
import { positiveMxnSchema } from "@/lib/money"

const emptyToNull = (value: unknown) => (value === "" ? null : value)

const nullableText = (max: number) =>
  z.preprocess(emptyToNull, z.string().max(max).nullish())

const nullableUrl = z.preprocess(emptyToNull, z.string().url("URL invalida").nullish())

export const RESERVED_STORE_SLUGS = new Set([
  "admin",
  "dashboard",
  "api",
  "login",
  "register",
  "seller",
  "cart",
  "checkout",
  "products",
  "search",
  "account",
  "stores",
])

export const storeCreateSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(60),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras, numeros y guiones"),
  description: nullableText(300),
  cityId: z.preprocess(emptyToNull, z.string().nullish()),
})

export const storeUpdateSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(60, "Maximo 60 caracteres"),
  description: nullableText(300),
  logoUrl: nullableUrl,
  bannerUrl: nullableUrl,
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color invalido"),
  fontFamily: nullableText(60),
  cityId: z.preprocess(emptyToNull, z.string().nullish()),
  customDomain: nullableText(100),
  isActive: z.boolean(),
  transferEnabled: z.boolean(),
  transferAccountName: nullableText(120),
  transferAccountNumber: nullableText(40),
  transferBank: nullableText(80),
  transferReferencePrefix: nullableText(20),
  transferReferenceExtra: nullableText(20),
})

const productVariantValueSchema = z.object({
  value: z.string().min(1).max(40),
  quantity: z.number().int().positive().optional().nullable(),
})

const productVariantOptionSchema = z.object({
  name: z.string().min(1).max(40),
  values: z.array(productVariantValueSchema).min(1).max(20),
})

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: nullableText(2000),
  price: positiveMxnSchema,
  comparePrice: positiveMxnSchema.optional().nullable(),
  stock: z.number().int().min(0),
  manageStock: z.boolean(),
  sku: nullableText(60),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
  featured: z.boolean(),
  images: z.array(z.string().url()).max(8),
  tags: z.array(z.string()).max(10),
  variantOptions: z.array(productVariantOptionSchema).max(5).default([]),
})

export const productCreateSchema = productSchema.extend({
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  images: z.array(z.string().url()).max(8).default([]),
  tags: z.array(z.string()).max(10).default([]),
  variantOptions: z.array(productVariantOptionSchema).max(5).default([]),
})

export const productUpdateSchema = productSchema

