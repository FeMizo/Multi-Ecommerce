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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PLAN_CATALOG } = require("../src/lib/plan-catalog")

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

  const papeleriaCategory = await db.category.upsert({
    where: { slug: "papeleria" },
    update: { name: "Papelería", icon: "🗒️", parentId: null, active: true },
    create: { name: "Papelería", slug: "papeleria", icon: "🗒️" },
  })

  await Promise.all([
    db.category.upsert({
      where: { slug: "cuadernos-libretas" },
      update: { name: "Cuadernos y libretas", icon: "📓", parentId: papeleriaCategory.id, active: true },
      create: {
        name: "Cuadernos y libretas",
        slug: "cuadernos-libretas",
        icon: "📓",
        parentId: papeleriaCategory.id,
      },
    }),
    db.category.upsert({
      where: { slug: "escritura" },
      update: { name: "Escritura", icon: "✏️", parentId: papeleriaCategory.id, active: true },
      create: {
        name: "Escritura",
        slug: "escritura",
        icon: "✏️",
        parentId: papeleriaCategory.id,
      },
    }),
    db.category.upsert({
      where: { slug: "organizacion" },
      update: { name: "Organización", icon: "🗂️", parentId: papeleriaCategory.id, active: true },
      create: {
        name: "Organización",
        slug: "organizacion",
        icon: "🗂️",
        parentId: papeleriaCategory.id,
      },
    }),
    db.category.upsert({
      where: { slug: "oficina" },
      update: { name: "Oficina", icon: "🖇️", parentId: papeleriaCategory.id, active: true },
      create: {
        name: "Oficina",
        slug: "oficina",
        icon: "🖇️",
        parentId: papeleriaCategory.id,
      },
    }),
  ])

  // ─── Plans ────────────────────────────────────────────────────────────────
  for (const plan of PLAN_CATALOG) {
    await db.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxProducts: plan.maxProducts,
        maxOrdersMonth: plan.maxOrdersMonth,
        commissionRate: plan.commissionRate,
        features: plan.features,
        stripePriceId: plan.stripePriceId,
        isActive: true,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxProducts: plan.maxProducts,
        maxOrdersMonth: plan.maxOrdersMonth,
        commissionRate: plan.commissionRate,
        features: plan.features,
        stripePriceId: plan.stripePriceId,
      },
    })
  }

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

  const demoStore = await db.store.findFirst({
    where: {
      OR: [
        { name: "Tienda de prueba" },
        { name: "Tienda Prueba Codex" },
        { name: "Usuario Prueba" },
        { slug: "tienda-prueba" },
        { slug: "aion-e2e-20260713102332" },
      ],
    },
    select: { id: true },
  })

  if (demoStore) {
    const categories: Array<{ id: string; slug: string }> = await db.category.findMany({
      where: { slug: { in: ["alimentos", "artesanias"] } },
      select: { id: true, slug: true },
    })
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]))

    const demoProducts = [
      {
        slug: "cafe-de-la-casa",
        name: "Cafe de la casa",
        description: "Paquete de cafe tostado artesanal con perfil suave y notas de cacao.",
        price: 180,
        comparePrice: 220,
        stock: 24,
        sku: "DEMO-CAFE-001",
        categorySlug: "alimentos",
        images: ["/placeholders/product.webp"],
        tags: ["artesanal", "local", "cafe"],
      },
      {
        slug: "miel-cruda-de-aguacate",
        name: "Miel cruda de aguacate",
        description: "Miel mexicana de sabor intenso, ideal para desayunos, infusiones y postres.",
        price: 210,
        comparePrice: 250,
        stock: 16,
        sku: "DEMO-MIEL-001",
        categorySlug: "alimentos",
        images: ["/placeholders/product.webp"],
        tags: ["miel", "local", "organico"],
      },
      {
        slug: "vela-artesanal-citrica",
        name: "Vela artesanal citrica",
        description: "Vela decorativa con aroma fresco para mostrar el catalogo de la tienda de prueba.",
        price: 140,
        comparePrice: 170,
        stock: 18,
        sku: "DEMO-VELA-001",
        categorySlug: "artesanias",
        images: ["/placeholders/product.webp"],
        tags: ["hogar", "artesania", "decoracion"],
      },
      {
        slug: "bolsa-artesanal-de-yute",
        name: "Bolsa artesanal de yute",
        description: "Bolsa tejida a mano con acabados resistentes para uso diario.",
        price: 320,
        comparePrice: 380,
        stock: 12,
        sku: "DEMO-BOLSA-001",
        categorySlug: "artesanias",
        images: ["/placeholders/product.webp"],
        tags: ["artesania", "bolsa", "hecho-a-mano"],
      },
    ]

    for (const product of demoProducts) {
      const categoryId = categoryBySlug.get(product.categorySlug)
      if (!categoryId) continue

      const existing = await db.product.findFirst({
        where: { storeId: demoStore.id, slug: product.slug },
        select: { id: true },
      })

      const data = {
        storeId: demoStore.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        sku: product.sku,
        categoryId,
        status: "ACTIVE",
        featured: true,
        images: product.images,
        tags: product.tags,
      }

      if (existing) {
        await db.product.update({
          where: { id: existing.id },
          data,
        })
      } else {
        await db.product.create({ data })
      }
    }
  }

  console.log("✓ Seed completado")
  console.log("  Admin: admin@mercadolocal.mx / Admin1234!")
}

main().catch(console.error).finally(() => db.$disconnect())
