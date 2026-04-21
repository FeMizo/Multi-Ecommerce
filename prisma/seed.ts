// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs")

const db = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Cities
  const cities = await Promise.all([
    db.city.upsert({ where: { slug: "lima" }, update: {}, create: { name: "Lima", slug: "lima", state: "Lima" } }),
    db.city.upsert({ where: { slug: "arequipa" }, update: {}, create: { name: "Arequipa", slug: "arequipa", state: "Arequipa" } }),
    db.city.upsert({ where: { slug: "cusco" }, update: {}, create: { name: "Cusco", slug: "cusco", state: "Cusco" } }),
    db.city.upsert({ where: { slug: "trujillo" }, update: {}, create: { name: "Trujillo", slug: "trujillo", state: "La Libertad" } }),
    db.city.upsert({ where: { slug: "chiclayo" }, update: {}, create: { name: "Chiclayo", slug: "chiclayo", state: "Lambayeque" } }),
  ])

  // Categories
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

  // Admin user
  const adminPassword = await bcrypt.hash("Admin1234!", 12)
  await db.user.upsert({
    where: { email: "admin@mercadolocal.pe" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mercadolocal.pe",
      password: adminPassword,
      role: "ADMIN",
      cityId: cities[0].id,
    },
  })

  // Demo seller
  const sellerPassword = await bcrypt.hash("Seller1234!", 12)
  const sellerUser = await db.user.upsert({
    where: { email: "vendedor@mercadolocal.pe" },
    update: {},
    create: {
      name: "María García",
      email: "vendedor@mercadolocal.pe",
      password: sellerPassword,
      role: "SELLER",
      cityId: cities[0].id,
    },
  })

  const seller = await db.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      cityId: cities[0].id,
      businessName: "Tienda de María",
      description: "Productos frescos y artesanales de Lima",
      status: "ACTIVE",
      rating: 4.5,
    },
  })

  // Demo products
  const productData = [
    { name: "Mermelada artesanal de fresa", price: 15, stock: 50, categorySlug: "alimentos", featured: true },
    { name: "Pollera bordada cusqueña", price: 180, stock: 10, categorySlug: "ropa", featured: true },
    { name: "Audífonos bluetooth", price: 89.90, stock: 25, categorySlug: "electronica", featured: false },
    { name: "Cojín tejido a mano", price: 45, stock: 30, categorySlug: "hogar", featured: true },
    { name: "Pulsera de plata con turquesa", price: 55, stock: 20, categorySlug: "artesanias", featured: false },
    { name: "Camiseta deportiva seca", price: 39.90, stock: 40, categorySlug: "deportes", featured: false },
  ]

  for (const p of productData) {
    const cat = categories.find((c: { slug: string }) => c.slug === p.categorySlug)!
    const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`
    await db.product.upsert({
      where: { slug },
      update: {},
      create: {
        sellerId: seller.id,
        cityId: cities[0].id,
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
  console.log("  Admin: admin@mercadolocal.pe / Admin1234!")
  console.log("  Vendedor: vendedor@mercadolocal.pe / Seller1234!")
}

main().catch(console.error).finally(() => db.$disconnect())
