import { z } from "zod"

export const checkoutCustomerSchema = z.object({
  fullName: z.string().trim().min(3, "Nombre requerido").max(120),
  email: z.string().trim().email("Correo inválido").max(120),
  phone: z.string().trim().max(30).regex(/^\+?[\d\s().-]+$/, "Teléfono inválido").refine((value) => {
    const digits = value.replace(/\D/g, "").length
    return digits >= 9 && digits <= 15
  }, "Teléfono inválido"),
  city: z.string().trim().min(2, "Ciudad requerida").max(100),
  notes: z.string().max(500).optional(),
})
