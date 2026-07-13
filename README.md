# AionSite (mercado-local)

Marketplace multi-tenant para México (MXN). Vendedores crean tiendas, publican productos y reciben pagos vía Stripe Connect. La plataforma cobra comisión según el plan (Free / Starter / Pro / Business).

## Stack

- Next.js 16, React 19, TypeScript
- PostgreSQL + Prisma 7
- NextAuth v5 (credentials + Google OAuth)
- Stripe Checkout + Connect + Billing
- Tailwind CSS 4, shadcn/ui
- Vercel Blob (imágenes), Resend (emails)

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (local, Neon o Vercel Postgres)
- Cuenta Stripe con claves test para desarrollo y claves live obligatorias en producción
- Cuenta Resend y Vercel Blob (opcional en local)

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 3. Base de datos
npm run db:push      # prototipado local
# o en producción:
# npx prisma migrate deploy

npm run db:seed

# 4. Servidor de desarrollo (puerto 1500)
npm run dev
```

Abre [http://localhost:1500](http://localhost:1500).

### Credenciales seed

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin plataforma | admin@mercadolocal.mx | Admin1234! |

## Variables de entorno

Ver [.env.example](.env.example) para la lista completa.

## Stripe en desarrollo

```bash
# Terminal 1: app
npm run dev

# Terminal 2: reenviar webhooks
stripe listen --forward-to localhost:1500/api/webhooks/stripe
# Copia el whsec_... a STRIPE_WEBHOOK_SECRET en .env
```

Eventos requeridos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `account.updated`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded` y `refund.updated`.

## Flujos de prueba manual

### Comprador
1. Registrarse en `/register`
2. Explorar tiendas en `/stores`
3. Agregar producto al carrito → `/checkout`
4. Pagar con tarjeta test `4242 4242 4242 4242`
5. Ver pedido en `/account/orders`

### Vendedor
1. Registrarse e iniciar sesión
2. Crear tienda en `/onboarding`
3. Conectar Stripe en `/dashboard/[slug]/settings`
4. Crear producto en `/dashboard/[slug]/products/new`
5. Gestionar pedidos en `/dashboard/[slug]/orders`

### Admin
1. Login con `admin@mercadolocal.mx`
2. Panel en `/admin`: usuarios, tiendas, planes, ciudades, métricas

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server (puerto 1500) |
| `npm run build` | Generate Prisma + migrate + build |
| `npm run start` | Servidor producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync schema (solo dev) |
| `npm run db:seed` | Datos iniciales |
| `npm run db:studio` | Prisma Studio |

## Estructura de rutas

```
/                    Storefront
/stores, /search     Explorar
/[storeSlug]         Tienda
/cart, /checkout     Compra
/dashboard/[slug]    Panel vendedor
/admin               Panel plataforma
/onboarding          Crear tienda
```

## Deploy (Vercel)

1. Conectar repo a Vercel
2. PostgreSQL managed (Vercel Postgres o Neon)
3. Configurar todas las env vars de `.env.example`
4. Build: `prisma generate && prisma migrate deploy && next build --webpack`
5. Webhook Stripe apuntando a `https://tudominio.com/api/webhooks/stripe`
6. Google OAuth redirect: `https://tudominio.com/api/auth/callback/google`
7. Usar exclusivamente `sk_live_...` y `pk_live_...`; el runtime rechaza claves test bajo `NODE_ENV=production`
8. Programar `GET /api/internal/checkout-reservations` cada 10 minutos con `Authorization: Bearer $CRON_SECRET`

## Limitaciones conocidas

- **Una tienda por checkout:** el carrito puede tener items de una sola tienda.
- **Carrito client-side:** Zustand + localStorage (sin sync en DB por ahora).

## Licencia

Privado — uso interno.
