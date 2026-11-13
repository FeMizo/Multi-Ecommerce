# Shop AionSite: lanzamiento y tarjeta TEST

Fecha: 12 de noviembre de 2026. Rama: `codex/shop-promo-test`.

Estado: implementación local preparada; aceptación de pagos y revisión visual pendientes de configurar el entorno TEST. Sin despliegue, push, cambios de datos o migraciones ejecutadas. Se conservaron los cambios locales que ya existían.

## Exploración y alcance

- Planes públicos: `src/app/(public)/plans/page.tsx`; adquisición para vendedores: onboarding y `src/app/api/stores/[storeSlug]/subscription/route.ts`.
- Stripe ya estaba integrado para Checkout, Billing, Connect y webhooks. No se añadió otra pasarela.
- La configuración local existente contiene claves LIVE. No se cambiaron ni usaron para cobrar. No hay claves TEST ni base de pruebas configuradas.
- Consulta de solo lectura a los cuatro planes existentes: Starter 50 MXN, 20 productos, 100 pedidos, 3%; Pro 100 MXN, 80 productos, 150 pedidos, 2%; Business 400 MXN, 150 productos, 250 pedidos, 1%; Agency 1,000 MXN, ilimitado, 0%.
- Atención: el catálogo estático preexistente `src/lib/plan-catalog.ts` declara Business al 0%, mientras la base consultada declara 1%. Se conservó el catálogo original. La migración promo clona la base, por lo que conserva el 1%. No ejecutar el seed general para crear estas promociones.

## Cambios

- Migración INSERT-only para Starter Promo 40 MXN, Pro Promo 80 MXN, Business Promo 320 MXN y Agency Promo 800 MXN. Copia límites, comisión y características de las filas originales; no actualiza ni elimina esas filas. Las migraciones están pendientes de aplicación en una base aislada.
- `/plans` y panel de planes muestran etiqueta `-20% Lanzamiento`, precio anterior tachado, ahorro y condiciones. El enlace de adquisición conserva el plan seleccionado.
- Altas del 13 al 30 de noviembre de 2026, con límites de fecha en America/Mexico_City. Texto de lanzamiento para Ciudad del Carmen, Mérida, Villahermosa y Cancún, sin filtros geográficos.
- Cupón de suscripción `LANZAMIENTO20`, 20% durante tres meses. Stripe factura el precio mensual normal con descuento temporal y después recupera automáticamente el precio normal. El webhook conserva los límites del plan base.
- Tarjeta aparece como `Tarjeta (TEST)`. Sin configuración queda visible y deshabilitada. Contraentrega y transferencia mantienen sus rutas existentes.
- TEST requiere clave separada y base separada, sin fallback a las credenciales ni base existentes. Tanto la aplicación como las migraciones usan la base TEST al seleccionar ese modo. Se rechaza reutilizar el mismo host/puerto/nombre de base con otras credenciales o parámetros.
- Checkout TEST almacena un intento separado (`TestCheckoutDraft`). No crea pedido, no descuenta inventario y no consume cupones antes de confirmar el pago. Una tarjeta rechazada deja solamente un intento, sin pedido.
- El webhook o la página de regreso verifican el pago en Stripe y crean un pedido PAID con número. La creación es transaccional, con bloqueo de filas e idempotencia. Si cambian existencias o límites durante el pago, se reembolsa el pago TEST sin crear un pedido inválido.
- No se usan las cuentas Connect LIVE del vendedor en los pagos TEST. No se envían correos de pedido ni WhatsApp en ese modo.
- Las URLs de regreso TEST apuntan al entorno desde el que se inició la compra.

## Verificación obligatoria

1. Build final: terminó con código 0. Typecheck independiente pasa. Pruebas automatizadas: 62 aprobadas, cero fallos. Lint: cero errores y 14 advertencias existentes. El build imprimió errores de consulta por columnas ausentes (`stores.address`, `orders.shippingFee`) correspondientes a cambios locales preexistentes y migraciones no aplicadas. Esto impide afirmar que el entorno está libre de errores.
2. Ocho planes: implementación y migración preparadas. Precios y fechas cubiertos con pruebas; visualización de las ocho filas en `/plans` pendiente de aplicar migraciones en TEST. La base existente no recibió planes nuevos.
3. Adquirir promoción: código preparado para cobrar 80% del precio mensual normal durante tres meses y mantener límites/comisión. Verificación del importe en Stripe Checkout pendiente de claves TEST. Hoy 12 de noviembre el servidor rechaza altas promo; la vigencia comienza el día 13.
4. Invitado → ISLA PAPEL → FOAMY DIAMANTADO → Verde → carrito → checkout → 4242 4242 4242 4242: no ejecutado. Faltan claves, webhook, base aislada y copia anonimizada de esos datos. No se creó un pedido ni se realizó un cargo real. Caducidad de prueba 12/34 y CVC 123.
5. 4000 0000 0000 0002: prueba real en Stripe pendiente. La prueba automatizada verifica que sesiones impagadas, LIVE, de suscripción o sin intento reconocido no alcanzan la persistencia de pedidos. El mensaje de rechazo corresponde al Checkout alojado de Stripe y requiere verificación con esa tarjeta.
6. Contraentrega y transferencia: rutas conservadas; pruebas generales pasan. Compras completas con ambas modalidades pendientes de base TEST. No se realizaron pedidos reales.
7. Móvil de aproximadamente 390 px: pendiente de revisión visual de `/plans` y `/checkout` con el entorno TEST preparado. No se afirma aprobación visual.
8. Sin despliegue a producción. Cambios locales en `codex/shop-promo-test`; sin commit ni PR para evitar mezclar cambios previos ajenos a esta solicitud.

## Para completar las verificaciones

Configurar localmente, sin pegar secretos en el chat:

```dotenv
STRIPE_MODE=test
STRIPE_TEST_SECRET_KEY=<clave sk_test del sandbox>
STRIPE_TEST_WEBHOOK_SECRET=<secreto del webhook TEST local>
STRIPE_TEST_DATABASE_URL=<PostgreSQL aislado con datos anonimizados>
```

Mantener `NEXT_PUBLIC_APP_URL` y `AUTH_URL` en `http://localhost:1500` para las pruebas. El Checkout alojado no requiere una clave pública nueva para la redirección.

Aplicar las migraciones únicamente con ese modo y esa base aislada configurados. No ejecutar migraciones ni el seed general sobre la base existente. Preparar ISLA PAPEL y FOAMY DIAMANTADO/Verde como fixtures anonimizados en TEST, sin modificar la tienda real. Reenviar eventos Stripe TEST al webhook local `/api/webhooks/stripe` y después ejecutar los puntos 2–7.

Evidencia local: `outputs/promo-build.log`, `outputs/promo-typecheck.log`, `outputs/promo-lint.log`, `outputs/promo-tests.log`. Las pruebas unitarias no sustituyen una compra real en el sandbox de Stripe ni validan la infraestructura de PostgreSQL.

Referencia consultada mediante Context7: documentación oficial de Stripe sobre cupones temporales (`duration=repeating`, `duration_in_months=3`) y descuentos de suscripción.
