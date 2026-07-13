<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AionSite — reglas para agentes

## Producto

Marketplace multi-tenant (México, MXN). Vendedores = `StoreMember` con rol `OWNER` o `STAFF`. Admin plataforma = `User.globalRole === PLATFORM_ADMIN`.

## Convenciones

- **Moneda:** siempre MXN (`formatPrice` en `src/lib/utils.ts`, checkout Stripe `currency: "mxn"`)
- **Puerto dev:** 1500 (`npm run dev`)
- **Auth:** NextAuth v5 JWT en `src/lib/auth.ts`; middleware en `src/middleware.ts`
- **DB:** Prisma client en `src/lib/db.ts`; migraciones en `prisma/migrations/`
- **Pagos:** Stripe en `src/lib/stripe.ts`; webhook en `src/app/api/webhooks/stripe/route.ts`
- **Límites de plan:** helper en `src/lib/plan-limits.ts`

## Roles

| Rol | Modelo |
|-----|--------|
| Admin plataforma | `User.globalRole = PLATFORM_ADMIN` |
| Vendedor | `StoreMember.role = OWNER \| STAFF` |
| Comprador | cualquier `User` autenticado |

## Archivos clave

- Schema: `prisma/schema.prisma`
- Auth: `src/lib/auth.ts`, `src/middleware.ts`
- Stripe: `src/lib/stripe.ts`, `src/app/api/checkout/route.ts`
- Connect: `src/app/api/stores/[storeSlug]/stripe/`
- Emails: `src/lib/email.ts`
- Upload: `src/app/api/upload/route.ts`

## No hacer

- No usar `db:push` en producción — usar `prisma migrate deploy`
- No hardcodear PEN; mercado es MX
- No editar `next.config.mjs` directamente (usa `next.user-config.ts` si existe)
- Rutas `/seller/*` están deprecadas — usar `/dashboard/[storeSlug]`
