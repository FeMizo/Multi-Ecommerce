// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require("pg")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs")

const connectionString = (process.env.MULTI_POSTGRES_URL_NON_POOLING ?? "")
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/[?&]pgbouncer=[^&]*/g, "")
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // ─── Cities ───────────────────────────────────────────────────────────────
  await Promise.all([
    db.city.upsert({ where: { slug: "cdmx" }, update: {}, create: { name: "Ciudad de México", slug: "cdmx", state: "CDMX", country: "MX" } }),
    db.city.upsert({ where: { slug: "guadalajara" }, update: {}, create: { name: "Guadalajara", slug: "guadalajara", state: "Jalisco", country: "MX" } }),
    db.city.upsert({ where: { slug: "monterrey" }, update: {}, create: { name: "Monterrey", slug: "monterrey", state: "Nuevo León", country: "MX" } }),
    db.city.upsert({ where: { slug: "puebla" }, update: {}, create: { name: "Puebla", slug: "puebla", state: "Puebla", country: "MX" } }),
    db.city.upsert({ where: { slug: "tijuana" }, update: {}, create: { name: "Tijuana", slug: "tijuana", state: "Baja California", country: "MX" } }),
  ])

  // ─── Categories ───────────────────────────────────────────────────────────
  await Promise.all([
    db.category.upsert({ where: { slug: "alimentos" }, update: {}, create: { name: "Alimentos", slug: "alimentos", icon: "🍎" } }),
    db.category.upsert({ where: { slug: "ropa" }, update: {}, create: { name: "Ropa y Moda", slug: "ropa", icon: "👗" } }),
    db.category.upsert({ where: { slug: "electronica" }, update: {}, create: { name: "Electrónica", slug: "electronica", icon: "📱" } }),
    db.category.upsert({ where: { slug: "hogar" }, update: {}, create: { name: "Hogar", slug: "hogar", icon: "🏠" } }),
    db.category.upsert({ where: { slug: "servicios" }, update: {}, create: { name: "Servicios", slug: "servicios", icon: "🔧" } }),
    db.category.upsert({ where: { slug: "artesanias" }, update: {}, create: { name: "Artesanías", slug: "artesanias", icon: "🎨" } }),
    db.category.upsert({ where: { slug: "mascotas" }, update: {}, create: { name: "Mascotas", slug: "mascotas", icon: "🐾" } }),
    db.category.upsert({ where: { slug: "deportes" }, update: {}, create: { name: "Deportes", slug: "deportes", icon: "⚽" } }),
  ])

  // ─── Plans ────────────────────────────────────────────────────────────────
  await db.plan.upsert({
    where: { slug: "free" },
    update: {
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 10,
      maxOrdersMonth: 20,
      commissionRate: 0.05,
      features: { analytics: false, customDomain: false, staffInvites: false, prioritySupport: false },
      stripePriceId: null,
      isActive: true,
    },
    create: {
      name: "Free",
      slug: "free",
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 10,
      maxOrdersMonth: 20,
      commissionRate: 0.05,
      features: { analytics: false, customDomain: false, staffInvites: false, prioritySupport: false },
    },
  })

  await db.plan.upsert({
    where: { slug: "starter" },
    update: {
      name: "Starter",
      priceMonthly: 50,
      priceYearly: 500,
      maxProducts: 50,
      maxOrdersMonth: 100,
      commissionRate: 0.03,
      features: { analytics: true, customDomain: false, staffInvites: false, prioritySupport: false },
      stripePriceId: "price_1Tsr4UIecXF2Xs1S0YmYEALi",
      isActive: true,
    },
    create: {
      name: "Starter",
      slug: "starter",
      priceMonthly: 50,
      priceYearly: 500,
      maxProducts: 50,
      maxOrdersMonth: 100,
      commissionRate: 0.03,
      features: { analytics: true, customDomain: false, staffInvites: false, prioritySupport: false },
      stripePriceId: "price_1Tsr4UIecXF2Xs1S0YmYEALi",
    },
  })

  await db.plan.upsert({
    where: { slug: "pro" },
    update: {
      name: "Pro",
      priceMonthly: 100,
      priceYearly: 1000,
      maxProducts: 200,
      maxOrdersMonth: 500,
      commissionRate: 0.02,
      features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: false },
      stripePriceId: "price_1Tsr4VIecXF2Xs1SDwRMFQIt",
      isActive: true,
    },
    create: {
      name: "Pro",
      slug: "pro",
      priceMonthly: 100,
      priceYearly: 1000,
      maxProducts: 200,
      maxOrdersMonth: 500,
      commissionRate: 0.02,
      features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: false },
      stripePriceId: "price_1Tsr4VIecXF2Xs1SDwRMFQIt",
    },
  })

  await db.plan.upsert({
    where: { slug: "business" },
    update: {
      name: "Business",
      priceMonthly: 400,
      priceYearly: 4000,
      maxProducts: null,
      maxOrdersMonth: null,
      commissionRate: 0,
      features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: true },
      stripePriceId: "price_1Tsr4WIecXF2Xs1S67pkNhdz",
      isActive: true,
    },
    create: {
      name: "Business",
      slug: "business",
      priceMonthly: 400,
      priceYearly: 4000,
      maxProducts: null,
      maxOrdersMonth: null,
      commissionRate: 0,
      features: { analytics: true, customDomain: true, staffInvites: true, prioritySupport: true },
      stripePriceId: "price_1Tsr4WIecXF2Xs1S67pkNhdz",
    },
  })

  // ─── Admin de plataforma ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12)
  await db.user.upsert({
    where: { email: "admin@mercadolocal.mx" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mercadolocal.mx",
      password: adminPassword,
      globalRole: "PLATFORM_ADMIN",
    },
  })

  console.log("✓ Seed completado")
  console.log("  Admin: admin@mercadolocal.mx / Admin1234!")
}

main().catch(console.error).finally(() => db.$disconnect())
