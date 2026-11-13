# Shop AionSite: revisión de plataforma

Fecha: 12 de noviembre de 2026. Rama: codex/shop-platform-fixes.

## Alcance y entorno

Cambios locales, sin push, despliegue ni pedidos enviados. Se conservaron los cambios que ya existían en checkout, webhook, utilidades y pruebas de variantes, y docs/continuous-improvement.md. No se editaron productos, imágenes, precios, descripciones ni planes de vendedores.

La revisión de navegador usó una base PostgreSQL sintética en memoria, accesible únicamente por loopback. Los nombres ISLA PAPEL, FOAMY y sacapuntas en las evidencias corresponden a fixtures locales, no a lecturas ni cambios en la tienda real. No se comprobó producción.

## Verificación técnica

- npm run build: aprobado, salida 0; compilación, TypeScript y generación de páginas completados sin errores.
- npm run lint: aprobado, 0 errores y 19 advertencias en código ya existente.
- npx tsc --noEmit: aprobado.
- npm test: 52 pruebas aprobadas, 0 fallos. Se añadieron dos casos de imágenes de variante, incluido fallback que excluye imágenes de otras variantes.
- git diff --check: aprobado.
- Migración nueva: probada sobre tablas locales con registros antiguos; datos de tienda permanecen null y shippingFee del pedido existente queda en 0.

## Cambios y revisión por punto

1. Checkout: CardTitle usa interlineado suficiente y espacio vertical; CardHeader separa contenido. Revisados títulos de entrega y pago completos en escritorio y móvil de 390 px. Evidencia: [checkout móvil](shop-platform-review-assets/checkout-mobile.png).

2. Texto: helper plural compartido en inicio, tiendas, resultados, categorías, carrito lateral, /cart y detalle de producto. Revisados “1 tienda activa”, “1 producto” y “0 productos”. Corregidos acentos de registro, checkout, ayuda, textos legales y utilidades de pago/entrega.

3. Búsqueda: mínimo y máximo en MXN, conservados en minPrice/maxPrice y enlaces de categorías/paginación; compatibilidad con min/max antiguos. Se ignoran precios negativos/no finitos en la URL. Formulario real probado con 20–30: incluye FOAMY de 25 y excluye sacapuntas de 10. Encabezado identifica categoría y filtros; rango visible como badge. Placeholder “Buscar productos” completo, sin desbordamiento. [Búsqueda móvil](shop-platform-review-assets/search-mobile.png).

4. Variantes: selección compartida entre galería y botón de compra. imageUrl por valor se conserva al normalizar, editar y guardar; el vendedor puede asociar imágenes existentes desde el editor. Verde cambia imagen principal, carrito lateral y /cart. Rojo sin imagen vuelve a la imagen general; las imágenes explícitamente asociadas a otra variante se excluyen del fallback. Los datos sin asociaciones no permiten inferir un color: se usa la imagen general del vendedor. No se asignaron ni modificaron imágenes reales. El editor autenticado no se verificó manualmente; sí tipado, validación y pruebas de normalización.

5. Recogida: dirección, teléfono y horario obligatorios en alta de tienda y configuración, con validación en API. Campos persistentes y mostrados en tienda y checkout. Revisados datos sintéticos y respuesta sin datos mediante simulación de API: aviso claro y campos pendientes. Formularios autenticados de alta/configuración pendientes de revisión manual con una cuenta de prueba; no se crearon cuentas reales.

6. Entrega: tienda configura zona, costo, latitud y longitud. Carrito lateral, /cart y checkout muestran costo/zona; recogida sin costo. En checkout local se observó subtotal 25 + envío 45 = total 70. Servidor calcula y guarda shippingFee desde la tienda, sin confiar en el carrito; el envío queda separado de descuentos en Stripe ya existente. No se habilitaron métodos nuevos. Centro de Maps verificado con API simulada: 20.9674, -89.5926 (tienda sintética), no CDMX. Sin coordenadas no se carga un centro inventado y se bloquea entrega local. Google Maps real requiere validar credenciales y restricciones de dominio en el entorno de pruebas; no se verificó su servicio externo ni se enviaron pagos.

7. Tienda: badge con capa superior y fondo legible; prueba de hit-testing confirmó que la portada no lo tapa. Banner en object-contain y tarjeta de información sin solaparlo. No se cambió el archivo de imagen del vendedor; la imagen real de ISLA PAPEL no se evaluó. [Tarjetas de tienda](shop-platform-review-assets/stores-desktop.png).

8. URLs: tarjetas utilizan slug de tienda también desde inicio/búsqueda. /products/:slug responde con HTTP 308 a /:storeSlug/:productSlug. Verificado 308 y Location /isla-papel/sacapuntas-mediano-con con fixture local.

9. Registro: panel lateral explica ventajas para compradores, vendedores y repartidores; logos con preload. Verificados carga de logos y ausencia de desbordamiento a 390 px. [Registro móvil](shop-platform-review-assets/register-mobile.png), [panel de escritorio](shop-platform-review-assets/register-desktop.png).

10. Legales y categorías: términos con 8 secciones, privacidad con 7 y cookies con 6; incluyen compras, entregas, cancelaciones, datos, derechos y almacenamiento local. Son textos base: falta validar identidad/domicilio legal del operador y políticas concretas antes de publicación; no se inventaron esos datos. Se ocultan categorías e hijas sin productos públicos activos; el conteo de la categoría incluye hijas. Comprobado con categoría sintética vacía que no aparece.

## Recorrido y regresiones

- Inicio → directorio → tienda → producto → Verde → agregar → /cart → checkout completado como invitado, sin enviar el formulario.
- Confirmar pedido deshabilitado con datos vacíos; con datos válidos y entrega local sin ubicación sigue deshabilitado. Con selección sintética válida de Maps se habilita. No se hizo clic para confirmar.
- Búsqueda zzzznoresult muestra 0 productos; Limpiar búsqueda vuelve a /search.
- Enlaces internos de header/footer revisados: /, /stores, /search, /login, /register, /categories, /offers, /rider, /plans, /help, /terms, /privacy y /cookies. Todos respondieron 200 o redirigieron al login previsto; ninguno devolvió 404. No se validaron redes sociales externas ni envíos de correo/teléfono.
- Móvil 390 × 844: registro, búsqueda, checkout, tiendas y tienda sin desbordamiento horizontal. Capturas revisadas visualmente.

## Antes de publicar

Aplicar prisma migrate deploy en el entorno de pruebas/revisión antes de arrancar esta versión: migración 20261112000000_store_fulfillment. No se aplicó a ninguna base externa. Los registros antiguos muestran avisos hasta que el vendedor complete sus datos. Las coordenadas se configuran explícitamente; no se geocodifica ni se inventa la dirección de una tienda.

Pendiente: instalación de migración y revisión autenticada en un entorno de pruebas compartido, Google Maps real, banner real del vendedor y aprobación de textos legales del operador. No hay despliegue ni verificación de Hostinger en este trabajo.

Referencias consultadas para los textos base: [Protección al consumidor](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo12974.html), [Protección de datos personales](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf). No constituyen una certificación jurídica del sitio.

Logs técnicos locales: C:/Users/mizo_/Documents/Codex/2026-11-12/shop-platform-review/artifacts/.
