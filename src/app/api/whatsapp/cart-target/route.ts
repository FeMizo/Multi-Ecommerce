import { NextResponse } from "next/server"
export async function POST() {
  return NextResponse.json(
    { message: "El contacto directo por WhatsApp no está disponible" },
    { status: 410 },
  )
}
