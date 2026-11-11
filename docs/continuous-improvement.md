# Mejora continua de flujos

## Ejecución 2026-11-04 (America/Mexico_City)

Estado: implementado y probado localmente; pendiente de publicar.

### Referencia y entorno

- Leído AGENTS.md real. Rama main, cuatro archivos previamente modificados conservados: style-publish-due/route.ts, add-to-cart-button.tsx, social-cron.ts y social-marketing-image.ts.
- No se detectaron procesos node con Multi-Ecommerce en su línea de comandos. No constituye un bloqueo global contra otros editores; se volvió a revisar el estado al terminar.
- Entorno permitido utilizado: proceso Node local con datos sintéticos en memoria. Sin servidor, base de datos ni servicios externos. No se ha identificado un entorno web de prueba aislado; no se usaron credenciales del proyecto.
- Comandos verificados: node --import tsx --test; node node_modules/eslint/bin/eslint.js; node node_modules/typescript/bin/tsc --noEmit. Se evita pnpm exec porque en la sesión anterior intentó instalar dependencias.

### Mejora acotada: validación de cantidades del carrito

- Evidencia previa: prueba local falló porque updateQuantity(id, -1) conservaba -1 y permitía subtotal negativo. También se aceptaban fracciones, NaN e infinitos.
- Cambio: src/stores/cart.ts rechaza cantidades que no sean enteros seguros o sean negativas antes de mutar estado. Cero conserva la eliminación de un artículo.
- Pruebas: src/stores/cart.test.ts reproduce valores inválidos, verifica total intacto, actualización válida y eliminación sin modificar artículos de otra tienda.
- Resultado posterior: seis pruebas aprobadas (carrito, dinero y recuperación de checkout); ESLint de ambos archivos y TypeScript completo terminaron con código 0. git diff --check sin errores.
- Advertencia esperada de pruebas: persistencia del navegador no disponible en Node. No se comprobó recarga ni localStorage real.
- Intentos: primer arranque del test intentó configurar persistencia no disponible en Node; retirado ese ajuste, se reprodujo el fallo. Después de la corrección las pruebas pasaron.
- Revisión de conexiones: checkout valida cantidad positiva y máxima de 99; consultas de productos y descuento de stock incluyen storeId. getStoreAccess filtra membresía por usuario, tienda y rol. Esta lectura no demuestra aislamiento mediante solicitudes autenticadas.
- Sin cambios visuales; sin prueba de navegador. No se probaron doble envío ni fallo de red en checkout, al no existir entorno web de prueba identificado. La corrección no llama a red ni altera permisos, pedidos, catálogo o precios.
- Archivos propios recuperables: src/stores/cart.ts, src/stores/cart.test.ts y este registro. No se tocaron los cambios preexistentes. Sin commit, push, despliegue, migraciones ni publicación social.

### Pendientes priorizados y siguiente paso

1. Identificar un entorno web propio de prueba y cuentas de dos tiendas antes de pruebas activas de compra, pedidos y permisos. No usar producción.
2. Verificar restauración de cantidades inválidas desde almacenamiento del navegador; la validación nueva cubre updateQuantity, no datos persistidos previamente.
3. Revisar variantes incompletas y límites de inventario en checkout mediante datos sintéticos; no cambiar reglas sin reproducción.
4. Con entorno aislado confirmado, recorrer doble envío, recarga y fallos de red; mantener catálogo, compra, pedidos y tiendas separados.

Siguiente ejecución: retomar el punto 2 con reproducción local y una sola mejora acotada, preservando todos los cambios actuales.

## Ejecución 2026-11-05 (America/Mexico_City)

Estado: implementado y probado localmente; pendiente de publicar.

### Referencia y concurrencia

- Releídos AGENTS.md, este registro y los cambios actuales de carrito. main ahora figura ahead 1; último commit observado 3f954e6 (README), ajeno a esta ejecución. Se conserva sin publicar ni modificarlo.
- Estado inicial: los cinco archivos modificados y docs/ + cart.test.ts de ejecuciones anteriores permanecen. No se detectaron procesos Node cuya línea de comandos contuviera Multi-Ecommerce; no prueba ausencia de otros editores.
- Solo pruebas en Node local con artículos sintéticos de store-a y store-b. No se abrió servidor, ni se consultó producción, base de datos o terceros para probar flujos.

### Mejora acotada: cantidades al restaurar el carrito

- Reproducción previa con src/stores/cart-persistence.test.ts: rehydrate de versión 2 conservaba seis cantidades inválidas (-1, 0, 1.5, null, texto y entero inseguro) junto al producto válido. Además datos persistidos podían reemplazar total por un número y restaurar items:null, rompiendo el uso del carrito.
- Cambio en src/stores/cart.ts: merge acepta únicamente items, conserva acciones/estado en memoria y filtra cantidades no positivas o que no sean enteros seguros. migrate tolera colecciones inválidas y entradas null antes del mapeo. Se conserva versión 2 y migración de cantidades omitidas a 1.
- Se consultó Context7 /pmndrs/zustand/v5.0.12 sobre merge y migrate, y declaraciones/implementación instaladas. migrate solo se activa con versión diferente; merge valida también la versión actual. Leída guía local Next de use-client antes de editar.
- Primer intento de preparación del test no tenía window.localStorage: persist no existía. Segundo intento agregó exclusivamente un window sintético en el proceso de prueba y reprodujo el fallo; no hubo más intentos contra ese bloqueo. Se restaura el descriptor global al finalizar.
- Resultado final: 12 pruebas aprobadas según node:test (incluye contenedor): carrito, persistencia, dinero y recuperación de checkout. ESLint de carrito y pruebas terminó con código 0; TypeScript completo terminó con código 0 antes de añadir el último caso de JSON roto. El último caso y ESLint se verificaron después. git diff --check sin errores.
- Comando de pruebas: node --import tsx --test src/stores/cart-persistence.test.ts src/stores/cart.test.ts src/lib/money.test.ts src/lib/checkout-recovery.test.ts.
- Casos de conexión: segunda hidratación tras actualizar cantidad; eliminación de una tienda preservando la otra; datos de almacenamiento ausentes y JSON roto conservan el estado en memoria; las acciones no se reemplazan desde JSON persistido. No se alteran precios ni el cálculo comercial.
- Alcance de seguridad: integridad local de cantidades y protección de métodos durante hidratación. No es validación de permisos de servidor; no se probaron solicitudes autenticadas, doble envío de checkout ni fallos de red. La prueba simula recarga mediante rehydrate con almacenamiento en memoria, no navegador real.
- Sin cambios visuales. No se probó UI. Falta identificar entorno web propio de prueba antes de pruebas activas de compra/pedidos/tiendas. No se inició publicación social ni se modificaron automatizaciones.
- Archivos de esta mejora: src/stores/cart.ts, src/stores/cart-persistence.test.ts y este registro. Se preservó cart.test.ts y el resto del trabajo previo. Sin push, merge, despliegue, commit ni migraciones.

### Pendientes actualizados

1. Identificar entorno web propio de prueba y cuentas de dos tiendas para permisos, recarga real y fallos de red.
2. Revisar mediante reproducción local selecciones de variantes incompletas y sus límites de inventario en checkout; una mejora acotada por ejecución.
3. Evaluar estructura de artículos persistidos más allá de quantity (precio/metadatos/variantes) con datos sintéticos. La corrección de hoy valida cantidades, no todo el esquema del artículo.

Siguiente ejecución: punto 2; leer primero este registro y conservar todos los cambios locales y el commit existente.

## Ejecución 2026-11-06 (America/Mexico_City)

Estado: implementado y probado localmente; sin commit y pendiente de publicar.

### Referencia

- Releídos AGENTS.md, este registro, helper de variantes y consumidores de compra/webhook. Leída guía Next local use-client antes de editar; cambios de esta ejecución son lógica TypeScript sin APIs nuevas de bibliotecas.
- Estado inicial limpio, main igual a origin/main según referencia local. Últimos commits observados: e281a65 (social page) y 4a6f6e3 (carrito). No se ejecutó fetch ni push ni se alteraron esos commits.
- No se detectaron procesos Node con Multi-Ecommerce en su línea de comandos. Revisado estado final: únicamente archivos propios de esta mejora y el registro. Esto no constituye bloqueo global de otros editores.
- Entorno de prueba: Node local, productos/variantes sintéticos en memoria; sin servidor, credenciales, base de datos, producción o terceros. No se inició publicación social ni se modificaron automatizaciones.

### Mejora acotada: selección completa antes del límite de inventario

- Evidencia previa: src/lib/product-variants.test.ts falló en dos casos porque getVariantQuantityLimit(options, []) devolvía null. Los consumidores de compra/webhook sustituyen null por el stock general, omitiendo límites por variante cuando falta la selección.
- Cambio en src/lib/product-variants.ts: devolver 0 ante selección incompleta, duplicada, con opciones adicionales, nombres desconocidos o valores inexistentes. Se conserva null para productos sin opciones y selecciones válidas sin cantidad explícita; se conserva el menor límite de selecciones completas y comparación sin distinguir mayúsculas/espacios.
- Intentos: reproducción directa con el test (dos casos fallidos y uno aprobado); una corrección del helper, sin bloqueos ni reintentos adicionales.
- Verificación: 15 pruebas aprobadas según node:test (incluye contenedor de persistencia), ESLint de helper/test y TypeScript completo con código 0; git diff --check sin errores.
- Comando: node --import tsx --test src/lib/product-variants.test.ts src/stores/cart.test.ts src/stores/cart-persistence.test.ts src/lib/money.test.ts src/lib/checkout-recovery.test.ts.
- Cobertura nueva: selección vacía, parcial, valor/nombre desconocido, duplicado con espacios/mayúsculas, opción adicional, selección válida, cambio de orden, cantidad mínima y variantes sin límite explícito. Pruebas existentes verifican hidratación y operaciones entre dos tiendas sintéticas.
- Conexiones revisadas: AddToCartButton, compra y webhook usan el helper. Compra/webhook omiten comprobación de límites si manageStock=false; la mejora protege el cálculo de límite cuando sí se invoca, no implementa validación universal de variantes. Ambos filtros de stock incluyen storeId; getStoreAccess filtra usuario, tienda y rol. No se demostraron permisos con solicitudes autenticadas.
- Sin cambios visuales ni prueba de navegador. No hubo prueba activa de doble envío, recarga web o fallo de red de checkout: sigue sin identificarse un entorno web propio de prueba. Recuperación e hidratación se verifican solo mediante pruebas locales.
- Archivos propios: src/lib/product-variants.ts, src/lib/product-variants.test.ts y este registro. Sin cambios de precios, pedidos, migraciones, cobros, mensajes, push o despliegue.

### Siguiente paso y pendientes

1. Identificar entorno web propio de prueba con dos cuentas de tiendas antes de probar compras, pedidos, permisos o fallos de red mediante solicitudes.
2. Revisar con reproducción sintética si productos sin gestión de stock pueden aceptar variantes inexistentes; separar validación de selección del cálculo de inventario si se confirma el fallo.
3. Mantener pendiente validación de estructura de artículos persistidos más allá de quantity.

Siguiente ejecución: punto 2, una mejora acotada y preservando estos cambios locales sin publicar.

## Ejecución 2026-11-07 (America/Mexico_City)

Estado: implementado y probado localmente; sin commit y pendiente de publicar.

### Referencia y reproducción

- Releídos AGENTS.md, registro y consumidores de variantes. Conservados los tres archivos locales de la ejecución anterior (registro, product-variants.ts y product-variants.test.ts). Rama main igual a origin/main según referencia local; no se actualizó el remoto.
- No se detectaron procesos Node con Multi-Ecommerce en la línea de comandos. Se revisó el estado de archivos antes y después; no es un bloqueo global contra otros editores.
- Entorno propio utilizado: proceso Node local con artículos sintéticos, compilador TypeScript instalado y transacción simulada. Sin carga de rutas ni acceso a DB, Stripe, correo, WhatsApp o servidores. Ninguna prueba activa sobre producción o terceros.
- Reproducción: src/lib/checkout-variants.test.ts extrae por AST y ejecuta los bucles reales de validación de checkout y webhook en un contexto con dependencias simuladas. Antes del cambio ambos tests fallaron con Missing expected rejection: selección vacía de un producto manageStock=false pasaba sin validación.

### Mejora acotada: validar variantes independientemente del inventario

- Añadido isValidVariantSelection en src/lib/product-variants.ts. Valida colección y campos, selección completa, nombres/valores permitidos y ausencia de duplicados. El cálculo de límite reutiliza esta validación.
- src/app/api/checkout/route.ts valida antes de saltarse inventario; devuelve 400 con mensaje para revisar opciones. src/app/api/webhooks/stripe/route.ts valida también el flujo legado antes de omitir inventario. No se modifica confirmación de pedidos ya reservados.
- Se conserva la compra de variantes válidas sin gestión de stock y productos simples sin selección; se rechazan opciones residuales de productos simples. No se cambian precios, límites comerciales ni inventario para productos sin gestión de stock.
- Leída documentación Next local next-response.md antes de editar. No se añadieron dependencias ni nuevas APIs de framework; se reutilizó el patrón de error y respuesta existente.
- Intentos: una reproducción fallida esperada y una implementación; sin bloqueos de ejecución. Se amplió el test con entradas malformadas tras pasar la reproducción.

### Verificación y límites

- 17 pruebas aprobadas según node:test (incluye contenedor), ESLint de las dos rutas/helper/tests y TypeScript completo terminaron con código 0. git diff --check sin errores.
- Comando: node --import tsx --test src/lib/checkout-variants.test.ts src/lib/product-variants.test.ts src/lib/checkout-recovery.test.ts src/lib/money.test.ts src/stores/cart.test.ts src/stores/cart-persistence.test.ts.
- Casos nuevos en ambos bucles: selección vacía/desconocida, colección o campos malformados, selección válida con/sin gestión de stock, límite excedido, producto simple y opciones residuales. La transacción simulada verifica storeId en el descuento de stock.
- Revisión de seguridad/conexiones: se conservan filtro de productos por storeId y permisos de membresía por usuario/tienda/rol. La comprobación local de storeId no demuestra autorización HTTP ni aislamiento real entre cuentas. Pruebas previas de carrito, hidratación, dinero y recuperación de checkout siguen pasando.
- No se recorrió endpoint completo: el harness ejecuta los bucles reales, no autenticación, respuesta 400, transacción DB ni idempotencia. Doble envío y fallos de red de compra siguen pendientes hasta identificar entorno web aislado propio. Recarga solo cubierta por hidratación sintética existente.
- Sin cambios visuales; sin prueba de navegador. No se iniciaron servidores/puertos, publicaciones sociales ni otras automatizaciones. Sin push, merge, despliegue, cobros, migraciones ni mensajes.
- Archivos de esta mejora: src/lib/product-variants.ts, src/lib/checkout-variants.test.ts, src/app/api/checkout/route.ts, src/app/api/webhooks/stripe/route.ts y este registro; product-variants.test.ts previo conservado.

### Pendientes y siguiente paso

1. Identificar entorno web propio de prueba con dos tiendas para endpoint completo, permisos, doble envío y fallos de red. No usar producción.
2. Reproducir y evaluar estructura de artículos persistidos más allá de quantity (precio/metadatos/variantes) sin cambiar precios arbitrariamente.
3. Verificar comportamiento de carrito antiguo con selección de variantes retirada del catálogo en entorno de prueba.

Siguiente ejecución: punto 2 con datos sintéticos y una mejora acotada; conservar todos los cambios actuales sin publicar.

## Ejecución 2026-11-08 (America/Mexico_City)

Estado: implementado y probado localmente; sin commit y pendiente de publicar.

### Referencia y reproducción

- Releídos AGENTS.md, este registro, carrito y prueba de persistencia. Leída guía Next local use-client antes de editar. Sin nuevas APIs de biblioteca; se cambia exclusivamente validación de datos.
- Estado inicial: main igual a origin/main según referencia local, cuatro archivos modificados y dos tests nuevos de variantes de ejecuciones anteriores. Conservados sin editar. No se detectaron procesos Node con Multi-Ecommerce en su línea de comandos; el estado final solo añade los cambios propios. No equivale a bloqueo global contra otros editores.
- Entorno propio de prueba: Node local y window.localStorage simulado en memoria, con artículos sintéticos de store-a/store-b. Sin servidor, credenciales, DB, producción ni terceros.
- Evidencia previa: nuevo caso en src/stores/cart-persistence.test.ts falló al hidratar versión 2; catorce artículos con precio/metadatos dañados sobrevivían junto al válido. quantity era válido, de modo que el filtro anterior no los descartaba. Incluía precio textual/negativo/null, subtotal infinito, identificadores vacíos, metadatos de tipos incorrectos y selección de variantes no representable.

### Mejora acotada: estructura de artículos restaurados

- src/stores/cart.ts añade guardia local isPersistedCartItem usada al fusionar el carrito persistido. Exige identificadores de artículo/producto/tienda/variante no vacíos, campos de presentación de tipo string, cantidad entera segura positiva, precio numérico finito no negativo, subtotal finito y selección de variantes con nombres/valores string no vacíos.
- Se descartan artículos inválidos y se preservan los válidos con sus precios originales. No se consulta catálogo ni se cambia precio o moneda. El servidor sigue calculando importes desde product.price, no desde el precio almacenado del carrito.
- Intentos: una reproducción fallida esperada y una corrección; sin bloqueos o reintentos adicionales.
- Se conserva versión 2 y la migración anterior; sus valores predeterminados de campos ausentes siguen existiendo. Esta mejora valida la estructura resultante, no verifica precio vigente o identidad real contra DB.

### Pruebas y conexiones

- 18 pruebas aprobadas según node:test (incluye contenedor), ESLint de carrito/test y TypeScript completo con código 0; git diff --check sin errores.
- Comando: node --import tsx --test src/stores/cart-persistence.test.ts src/stores/cart.test.ts src/lib/product-variants.test.ts src/lib/checkout-variants.test.ts src/lib/money.test.ts src/lib/checkout-recovery.test.ts.
- El caso nuevo conserva un artículo válido de otra tienda, mantiene total 200 tras una segunda hidratación y no lo elimina al borrar store-a. Se mantienen pasando pruebas de cantidades, acciones persistidas, JSON roto, migración, variantes y bucles de compra/webhook simulados.
- Revisión de seguridad: guardia evita estructura inválida que rompía cálculos o selección de variantes en consumidores del carrito. Autorización por membresía/tienda/rol permanece intacta; no se probó aislamiento HTTP real. El filtro de storeId del servidor no se modifica.
- Sin cambios visuales ni prueba de navegador. Hidratación en memoria no prueba recarga real, y no se probaron doble envío ni fallos de red de compra: sigue pendiente identificar entorno web propio aislado con dos tiendas. No se prueban endpoints completos ni servicios externos.
- Archivos propios de hoy: src/stores/cart.ts, src/stores/cart-persistence.test.ts y este registro. Sin commit, push, merge, despliegue, migración, cobro o mensajes. No se ejecutó publicación social ni se modificaron automatizaciones o cambios ajenos.

### Pendientes y siguiente paso

1. Identificar entorno web de prueba propio y cuentas de dos tiendas para UI, permisos, recarga real, doble envío y fallos de red.
2. Evaluar mediante reproducción local los valores predeterminados de migraciones antiguas cuando falta precio/identificadores; evitar que datos ausentes aparenten ser válidos.
3. Verificar carrito antiguo con variantes retiradas del catálogo cuando exista entorno aislado.

Siguiente ejecución: punto 2, una mejora acotada y conservando todos los cambios locales sin publicar.

## Ejecución adicional solicitada 2026-11-08

- Estado: implementado y probado localmente; pendiente de publicar, sin commit.
- Releídos AGENTS.md, registro y migración; leída guía Next local use-client. Conservados los ocho archivos locales anteriores. No se detectaron procesos Node con Multi-Ecommerce en su línea de comandos; no garantiza exclusión de otros editores.
- Entorno: Node y almacenamiento sintético en memoria. Sin servidor, DB, Stripe, producción o terceros.
- Reproducción previa: nuevo test de migración falló; precio ausente/null se convertía en cero y ausencia de ambos identificadores generaba UUID ficticio. Tres artículos incompletos sobrevivían junto a los dos válidos.
- Mejora única en src/stores/cart.ts: migrar sin inventar precio ni identificador; aplicar la guardia de estructura existente al resultado de migración. Mantiene compatibilidad cuando solo existe id o productId, cantidad omitida igual a 1 y precio cero explícito.
- src/stores/cart-persistence.test.ts verifica versiones 0 y 1, exclusión de incompletos, precio cero explícito, recuperación de identificador legado y segunda hidratación. Una reproducción fallida esperada y una corrección; sin bloqueos adicionales.
- Verificación: 19 pruebas aprobadas (incluye contenedor), ESLint de carrito/test y TypeScript completo con código 0; git diff --check sin errores. Mismo comando de la ejecución anterior con los seis archivos de pruebas.
- Sin cambios en permisos, consultas por tienda o precios de catálogo. Pruebas existentes de dos tiendas sintéticas, bucles de checkout/webhook y recuperación siguen pasando; no demuestra aislamiento HTTP real.
- Límites: sin cambios visuales ni navegador. No se prueban doble envío o fallos de red reales; falta entorno web propio aislado. No hay publicación social, cambios de automatizaciones, migraciones de DB, push, merge, despliegue, cobros o mensajes.
- Archivos de esta ejecución: src/stores/cart.ts, src/stores/cart-persistence.test.ts y este registro.
- Siguiente paso: identificar entorno web aislado con dos tiendas para revisar carrito con variantes retiradas, recarga real y permisos. Si continúa sin entorno, registrar bloqueo y limitarse a reproducción independiente local válida, sin inventar requisitos.

## Ejecución 2026-11-09 (America/Mexico_City)

- Estado: implementado y probado localmente; sin commit y pendiente de publicar.
- Releídos AGENTS.md, registro, checkout/webhook y pruebas. Conservados los ocho archivos locales previos. No se detectaron procesos Node con Multi-Ecommerce en su línea de comandos; se revisó estado al finalizar, sin bloqueo global de otros editores.
- Búsqueda de entorno: README documenta localhost:1500 y .env.example contiene URLs locales, pero no identifica una base aislada ni dos cuentas de prueba verificadas. No se ejecutaron seed, servidor o solicitudes. Persiste bloqueo para pruebas web completas; se continuó trabajo independiente local válido.
- Reproducción nueva: dos variantes del mismo producto (Talla M y L) eran rechazadas como productos ausentes. La consulta findMany devuelve productos únicos; las dos rutas comparaban cantidad de productos contra cantidad de líneas. Dos tests fallaron con PRODUCTS_UNAVAILABLE / Productos de checkout no encontrados.
- Mejora acotada: en src/app/api/checkout/route.ts y src/app/api/webhooks/stripe/route.ts comparar productos recuperados con productId únicos. Para no habilitar evasión de límite mediante líneas duplicadas se rechaza la misma combinación producto/opciones repetida usando identidad canónica (nombres/valores normalizados y ordenados, codificación JSON) de src/lib/product-variants.ts.
- src/lib/checkout-variants.test.ts extrae por AST tanto guardia real de disponibilidad como bucle real; ejecuta con fixtures y dependencias simuladas. Se acepta M + L del mismo producto, se rechaza combinación repetida con distinta capitalización/espacios y se siguen rechazando productos ausentes. Pruebas previas cubren límites y selecciones malformadas.
- Intentos: una reproducción fallida esperada y una corrección; sin bloqueos adicionales. Sin nuevas dependencias o APIs de biblioteca. Leída guía Next local de Route Handlers antes de editar.
- Verificación: 21 pruebas aprobadas según node:test (incluye contenedor), ESLint de rutas/helper/test y TypeScript completo con código 0; git diff --check sin errores. Comando: node --import tsx --test src/lib/checkout-variants.test.ts src/lib/product-variants.test.ts src/lib/checkout-recovery.test.ts src/lib/money.test.ts src/stores/cart.test.ts src/stores/cart-persistence.test.ts.
- Seguridad: se conservan consultas y descuento de stock filtrados por storeId, estado activo y stock suficiente. Duplicado canónico se rechaza antes de omitir inventario. Los precios siguen proviniendo del servidor. La prueba de producto ausente no equivale a demostrar autorización HTTP entre cuentas.
- Límites: Node local con datos sintéticos; sin DB, Stripe ni producción. No se probó endpoint completo, respuesta HTTP, doble envío entre solicitudes, recarga real o fallos de red. Harness de bucle inicializa el Set local de control; no importa rutas. Sin cambios visuales ni navegador. No se modifica cobro ni confirmación de pedidos ya reservados.
- Archivos de esta ejecución: dos rutas, src/lib/product-variants.ts, src/lib/checkout-variants.test.ts y este registro. Trabajo de carrito/migración conservado. Sin publicación social, cambios de automatizaciones, mensajes, cobros, migraciones, push, merge o despliegue.
- Pendientes: identificar entorno web aislado para dos tiendas; probar variantes retiradas y flujo completo. Auditar con fixtures acumulación de límites compartidos entre distintas combinaciones de variantes antes de otra mejora. Siguiente paso: reproducción local de ese límite solo si no se identifica entorno web propio seguro.
