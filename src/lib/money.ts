import { z } from "zod"

const CENTS_PER_MXN = 100
const DECIMAL_TOLERANCE = 1e-8

export function hasAtMostTwoDecimals(value: number) {
  if (!Number.isFinite(value)) return false
  const cents = value * CENTS_PER_MXN
  return Math.abs(cents - Math.round(cents)) < DECIMAL_TOLERANCE
}

export function toMinorUnits(value: number) {
  if (!hasAtMostTwoDecimals(value)) {
    throw new Error("El monto MXN debe tener como máximo dos decimales")
  }
  return Math.round(value * CENTS_PER_MXN)
}

export function fromMinorUnits(value: number) {
  if (!Number.isInteger(value)) throw new Error("El monto en centavos debe ser entero")
  return value / CENTS_PER_MXN
}

export const positiveMxnSchema = z.number().finite().positive().refine(hasAtMostTwoDecimals, {
  message: "Usa máximo dos decimales",
})

export const nonnegativeMxnSchema = z.number().finite().nonnegative().refine(hasAtMostTwoDecimals, {
  message: "Usa máximo dos decimales",
})
