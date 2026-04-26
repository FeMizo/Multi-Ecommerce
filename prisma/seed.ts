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
  const cities = await Promise.all([
    db.city.upsert({ where: { slug: "lima" }, update: {}, create: { name: "Lima", slug: "lima", state: "Lima" } }),
    db.city.upsert({ where: { slug: "arequipa" }, update: {}, create: { name: "Arequipa", slug: "arequipa", state: "Arequipa" } }),
    db.city.upsert({ where: { slug: "cusco" }, update: {}, create: { name: "Cusco", slug: "cusco", state: "Cusco" } }),
    db.city.upsert({ where: { slug: "trujillo" }, update: {}, create: { name: "Trujillo", slug: "trujillo", state: "La Libertad" } }),
    db.city.upsert({ where: { slug: "chiclayo" }, update: {}, create: { name: "Chiclayo", slug: "chiclayo", state: "Lambayeque" } }),
  ])

  // ─── Categories ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
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
  const freePlan = await db.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      priceMonthly: 0,
      priceYearly: 0,
      maxProducts: 10,
      maxOrdersMonth: 20,
      commissionRate: 0.05,
      features: { analytics: false, customDomain: false, staffInvites: false },
    },
  })

  await db.plan.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      name: "Starter",
      slug: "starter",
      priceMonthly: 15,
      priceYearly: 144,
      maxProducts: 100,
      maxOrdersMonth: null,
      commissionRate: 0.02,
      features: { analytics: true, customDomain: false, staffInvites: false },
    },
  })

  await db.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      priceMonthly: 39,
      priceYearly: 374,
      maxProducts: null,
      maxOrdersMonth: null,
      commissionRate: 0,
      features: { analytics: true, customDomain: true, staffInvites: true },
    },
  })

  // ─── Admin de plataforma ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin1234!", 12)
  await db.user.upsert({
    where: { email: "admin@mercadolocal.pe" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mercadolocal.pe",
      password: adminPassword,
      globalRole: "PLATFORM_ADMIN",
    },
  })

  // ─── Dueño de tienda demo ─────────────────────────────────────────────────
  const ownerPassword = await bcrypt.hash("Owner1234!", 12)
  const ownerUser = await db.user.upsert({
    where: { email: "maria@mercadolocal.pe" },
    update: {},
    create: {
      name: "María García",
      email: "maria@mercadolocal.pe",
      password: ownerPassword,
      globalRole: "USER",
    },
  })

  // ─── Tienda demo ──────────────────────────────────────────────────────────
  const demoStore = await db.store.upsert({
    where: { slug: "tienda-maria" },
    update: {},
    create: {
      slug: "tienda-maria",
      name: "Tienda de María",
      description: "Productos frescos y artesanales de Lima",
      primaryColor: "#e85d04",
      cityId: cities[0].id,
      isActive: true,
      isVerified: true,
    },
  })

  // Asignar como OWNER
  await db.storeMember.upsert({
    where: { storeId_userId: { storeId: demoStore.id, userId: ownerUser.id } },
    update: {},
    create: {
      storeId: demoStore.id,
      userId: ownerUser.id,
      role: "OWNER",
    },
  })

  // Suscripción al plan free
  await db.storeSubscription.upsert({
    where: { storeId: demoStore.id },
    update: {},
    create: {
      storeId: demoStore.id,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  })

  // ─── Cliente demo ─────────────────────────────────────────────────────────
  const buyerPassword = await bcrypt.hash("Buyer1234!", 12)
  const buyerUser = await db.user.upsert({
    where: { email: "comprador@mercadolocal.pe" },
    update: {},
    create: {
      name: "Carlos Pérez",
      email: "comprador@mercadolocal.pe",
      password: buyerPassword,
      globalRole: "USER",
    },
  })

  await db.storeMember.upsert({
    where: { storeId_userId: { storeId: demoStore.id, userId: buyerUser.id } },
    update: {},
    create: {
      storeId: demoStore.id,
      userId: buyerUser.id,
      role: "CUSTOMER",
    },
  })

  // ─── Productos demo ───────────────────────────────────────────────────────
  const productData = [
    { name: "Mermelada artesanal de fresa", price: 15, stock: 50, categorySlug: "alimentos", featured: true },
    { name: "Pollera bordada cusqueña", price: 180, stock: 10, categorySlug: "ropa", featured: true },
    { name: "Audífonos bluetooth", price: 89.9, stock: 25, categorySlug: "electronica", featured: false },
    { name: "Cojín tejido a mano", price: 45, stock: 30, categorySlug: "hogar", featured: true },
    { name: "Pulsera de plata con turquesa", price: 55, stock: 20, categorySlug: "artesanias", featured: false },
    { name: "Camiseta deportiva seca", price: 39.9, stock: 40, categorySlug: "deportes", featured: false },
  ]

  for (const p of productData) {
    const cat = categories.find((c: { slug: string }) => c.slug === p.categorySlug)!
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    await db.product.upsert({
      where: { storeId_slug: { storeId: demoStore.id, slug } },
      update: {},
      create: {
        storeId: demoStore.id,
        categoryId: cat.id,
        name: p.name,
        slug,
        price: p.price,
        stock: p.stock,
        status: "ACTIVE",
        featured: p.featured,
        images: [],
      },
    })
  }

  console.log("✓ Seed completado")
  console.log("  Admin:     admin@mercadolocal.pe     / Admin1234!")
  console.log("  Dueño:     maria@mercadolocal.pe     / Owner1234!")
  console.log("  Comprador: comprador@mercadolocal.pe / Buyer1234!")
  console.log("  Tienda demo: /tienda-maria")
}

main().catch(console.error).finally(() => db.$disconnect())
