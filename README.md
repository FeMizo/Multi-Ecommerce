# Multi Shop — AionSite

Marketplace para comercios locales de México. Permite que varios vendedores administren sus tiendas, que los compradores hagan pedidos y que cada negocio gestione pagos, inventario y entregas. La moneda de la plataforma es MXN.

Este documento contrasta las pantallas, rutas, modelos y servicios del repositorio. Describe implementación disponible y requisitos de configuración; no certifica que las integraciones estén activadas o verificadas en producción. No incluye nombres ni valores de variables de entorno, credenciales o identificadores de cuentas externas.

Última revisión documental: 5 de noviembre de 2026. Alcance: aplicación, componentes, servicios, esquema y migraciones, configuración, scripts y comprobaciones de CI. La revisión fue estática, sin operar servicios externos.

## Usuarios y acceso

| Perfil | Para qué utiliza el sitio | Implementación y alcance |
| --- | --- | --- |
| Visitante | Explorar y comprar sin crear cuenta | Catálogo público, checkout de invitado y consulta de pedidos por referencia. |
| Comprador | Mantener su perfil, ver pedidos asociados y escribir reseñas | Cuenta autenticada; las reseñas requieren una compra entregada. Los favoritos se guardan en el navegador. |
| Propietario | Administrar su negocio y facturación | Membresía `OWNER` de una tienda; suscripciones, cupones y reembolsos tienen comprobaciones específicas de propietario. |
| Personal de tienda | Operar catálogo, pedidos y entregas | Membresía `STAFF`; el permiso concreto depende de la operación del servidor. |
| Repartidor | Consultar y actualizar su entrega asignada | Registro de repartidor vinculado a la cuenta y a la tienda. Acceso con teléfono y contraseña disponible. |
| Administrador de plataforma | Supervisar el marketplace y gestionar su operación comercial | Rol global `PLATFORM_ADMIN`. Algunos módulos permiten acceso administrativo mediante el helper de tiendas; otros exigen membresía explícita. |

La autenticación usa NextAuth con sesiones JWT y contraseñas almacenadas como hashes bcrypt. El proxy protege las páginas privadas; las rutas de API comprueban sus propios permisos.

La recuperación de contraseña envía por correo un enlace con token de un solo uso y validez de 30 minutos. Registro y recuperación tienen límites de solicitudes por proceso. La verificación de tienda es un flujo distinto de la recuperación de acceso.

## Funciones para compradores

| Función | Para qué sirve y cómo está implementada | Configuración necesaria |
| --- | --- | --- |
| Inicio y directorio de tiendas | Mostrar comercios activos, destacados y verificados. Páginas públicas consultan PostgreSQL mediante Prisma. | Tiendas activas, catálogo y posiciones destacadas gestionadas por administración. |
| Categorías y subcategorías | Organizar el catálogo y navegar por familias de productos. | Categorías activas y asociaciones correctas en los productos. |
| Búsqueda | Filtrar por nombre, categoría, rango de precios y disponibilidad, con paginación. | Productos publicados y tiendas activas. No hay un buscador externo obligatorio. |
| Ofertas | Mostrar productos con precio comparativo. | Precio de venta y precio comparativo en el catálogo. |
| Tienda pública | Presentar marca, descripción, ubicación y productos de cada negocio, con filtro de categoría y paginación. | Nombre, slug, ciudad, imágenes y color principal del negocio. |
| Ficha de producto | Mostrar imágenes, descripción, precio, variantes y reseñas; seleccionar opciones antes de añadir al carrito. | Producto activo, variantes e inventario configurados. |
| Favoritos | Guardar productos para consultarlos después. Implementación con almacenamiento local y eventos del navegador. | Almacenamiento local disponible; sin sincronización entre cuentas o dispositivos. |
| Carrito | Acumular productos de varias tiendas, cambiar cantidades, eliminar y reordenar artículos. Zustand conserva el contenido localmente. | Ninguna integración externa. El checkout toma los artículos de la tienda del primer producto. |
| Checkout | Recoger datos del comprador, aplicar cupón y elegir pago y entrega. El servidor consulta precios, disponibilidad y límites; utiliza un token para reutilizar el intento. | Tienda habilitada, plan efectivo con cupo y un método de pago disponible. |
| Compra como invitado | Crear pedidos sin iniciar sesión y abrir su enlace de consulta. El registro posterior vincula pedidos de invitado con el mismo correo. | Nombre, correo y teléfono del comprador. |
| Perfil e historial | Editar datos personales y consultar pedidos vinculados a la cuenta. | Sesión iniciada y pedidos asociados al usuario. |
| Reseñas | Crear o actualizar la valoración de un producto comprado. El servidor exige un pedido entregado. | Cuenta autenticada y compra elegible. |
| Seguimiento | Consultar estado, artículos, datos de transferencia y entrega mediante referencia. | Referencia del pedido; la consulta pública no exige iniciar sesión. |
| Compartir | Preparar enlaces para compartir productos o contenido en redes y WhatsApp. | Aplicación o navegador compatible; compartir un enlace no registra por sí mismo un pedido ni confirma un envío. |

Fuentes: `src/app/(public)/`, `src/components/products/`, `src/components/checkout/`, `src/stores/cart.ts`, `src/lib/favorites.ts`, `src/app/api/checkout/route.ts`, `src/app/api/products/[productId]/reviews/route.ts`.

## Funciones para vendedores

| Función | Para qué sirve y cómo está implementada | Configuración necesaria |
| --- | --- | --- |
| Alta de tienda | Crear un comercio y su membresía de propietario en una transacción; evita slugs reservados o duplicados. | Cuenta autenticada, nombre, slug y datos del negocio. El alta no asigna automáticamente una suscripción. |
| Panel | Resumir actividad y uso de límites; navegar a los módulos operativos. | Membresía de tienda y plan cuando la sección lo exige. |
| Marca y datos del negocio | Editar nombre, descripción, ciudad, imágenes, color, tipografía y datos bancarios. El esquema y la API también admiten guardar un dominio personalizado. | Datos del negocio; almacenamiento de imágenes si se cargan archivos. El formulario no muestra un campo de dominio y guardarlo por API no configura DNS ni hosting. |
| Visibilidad | Activar o desactivar la tienda para el catálogo público. | Permiso de propietario o personal. |
| Verificación | Enviar al propietario un enlace de correo con token almacenado como hash y caducidad de 24 horas; administración también puede modificar la verificación. | Correo operativo y datos del propietario. La insignia no equivale a una validación documental de identidad. |
| Productos | Crear, editar, publicar, pausar o eliminar lógicamente artículos; administrar precio, SKU, etiquetas, imágenes y variantes. | Membresía, categorías y cupo de productos del plan para altas. |
| Inventario | Activar control de stock por producto y configurar cantidades de opciones de variantes. El checkout valida límites y descuenta stock del producto. | Cantidades y opciones coherentes; no se implementa un almacén independiente por cada combinación de variantes. |
| Importación CSV | Validar filas y categorías, actualizar productos por coincidencia de SKU o crear artículos e importar imágenes remotas al almacenamiento. | Archivo compatible, membresía, cupo para altas y almacenamiento para imágenes remotas. Los errores de validación bloquean la importación; se devuelven conteos de creados y actualizados al completarla. |
| Edición masiva | Cambiar estado, precio, porcentaje de precio, stock y destacado, o eliminar productos; hasta 200 identificadores por solicitud. | Productos pertenecientes a la tienda y permisos operativos. |
| Pedidos | Ver detalle y cambiar estado; registrar la entrega puede activar avisos al comprador. | Pedidos de la tienda y membresía autorizada. |
| Cupones | Crear descuentos porcentuales o fijos, importe mínimo, fechas y máximo de usos; eliminar cupones. | Propietario y código único por tienda. |
| Métricas | Mostrar serie de pedidos e importes, estados y productos principales. | Plan efectivo. Las cifras se calculan con los estados seleccionados en las consultas, no mediante conciliación bancaria. |
| Planes y facturación | Contratar una suscripción y abrir el portal de facturación para gestionarla. | Propietario, plan activo y precio recurrente mensual de Stripe en MXN coincidente con el importe. |
| Recordatorios | Mostrar avisos de renovación y de datos de teléfono pendientes. | Datos de perfil y suscripción. |

La ficha de producto admite hasta ocho imágenes, cinco grupos de variantes, veinte valores por grupo y diez etiquetas. La subida general acepta JPG, PNG, WebP o GIF de hasta 5 MB, comprueba su firma y permite copiar imágenes desde una URL pública. La descarga remota aplica controles de protocolo, resolución de red, redirecciones y tamaño.

Fuentes: `src/app/(dashboard)/`, `src/components/dashboard/`, `src/app/api/stores/`, `src/lib/plan-limits.ts`, `src/lib/store-access.ts`.

### Importación de catálogo

El CSV requiere título, precio y categoría; también admite SKU, stock, descripción, estado, imágenes y etiquetas, con alias de encabezados en español e inglés. La categoría debe corresponder a una categoría activa. Sin estado se usa borrador; el importador no admite columnas de variantes ni precio comparativo.

Cuando encuentra el SKU en la tienda, actualiza el producto existente; sin coincidencia crea uno nuevo. Las actualizaciones sustituyen los campos importados, incluidas imágenes y etiquetas. Antes de importar, revisa los datos y utiliza el mismo formato de SKU del catálogo: la consulta inicial a la base de datos depende de la coincidencia del texto almacenado. El importador detecta SKU repetidos dentro del archivo y determinadas duplicidades del catálogo.

## Pagos, inventario y pedidos

| Modalidad o proceso | Implementación | Configuración y límites |
| --- | --- | --- |
| Tarjeta | Stripe Checkout con cuenta Connect de destino y comisión de plataforma según plan. | Cuenta Stripe de plataforma y alta Connect completada por la tienda. En producción el servidor exige claves live. |
| Contra entrega | Pedido registrado para confirmación y cobro fuera de Stripe. | Método habilitado por tienda; el negocio se encarga del cobro. |
| Transferencia | Pedido pendiente con instrucciones y referencia bancaria. | Habilitar el método y completar beneficiario, banco, cuenta y referencia. No existe conciliación bancaria automática. |
| Reservas | Sesión Stripe de 30 minutos y reserva de inventario de 35 minutos. La limpieza comprueba el estado de Stripe antes de liberar. | Webhooks y tarea de recuperación periódica; el endpoint interno solicita hasta 100 reservas vencidas por ejecución; el helper usa 10 cuando no se indica un límite. |
| Eventos de Stripe | Firma del webhook y registro persistente para controlar procesamiento y repetición de eventos. Sincroniza pagos, Connect y suscripciones. | Endpoint público y secreto de firma configurado en privado. |
| Reembolso | El propietario solicita un reembolso completo de un pago Stripe exitoso; revierte transferencia y comisión y repone inventario al confirmar el resultado. | Pago elegible de la tienda. El flujo de reposición implementado corresponde a reembolsos completos. |
| Estados | Pedido, pago y entrega se guardan en entidades distintas. Cambiar un estado de pedido no equivale por sí solo a cobrar o reembolsar. | Operar los flujos de pago correspondientes y verificar el resultado externo. |

Un checkout procesa una sola tienda. Los productos de otros negocios permanecen en el carrito para compras separadas. Los importes se recalculan en el servidor y se manejan con utilidades monetarias para MXN.

El webhook implementa finalización, éxito asíncrono, fallo asíncrono y expiración del checkout; creación, actualización y cancelación de suscripciones; actualización de cuenta Connect y eventos de reembolso.

Fuentes: `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/lib/payment-lifecycle.ts`, `src/lib/checkout-recovery.ts`, `src/lib/money.ts`, `src/lib/stripe-billing.ts`.

## Entregas y repartidores

| Función | Implementación | Configuración necesaria |
| --- | --- | --- |
| Recogida en tienda | Método de entrega elegido durante la compra. | Información del negocio y coordinación con el comprador. |
| Entrega local | Guarda dirección, coordenadas y notas del destino. | Dirección y coordenadas válidas. |
| Mapa de destino | Google Maps con Places para autocompletar dirección y mover el marcador. | Acceso de navegador a Maps y Places, proyecto habilitado y restricciones de origen compatibles con el dominio. |
| Registro de repartidor | Alta con teléfono y contraseña, matrícula y licencia; crea un repartidor inicialmente sin tienda. El modelo utiliza un correo técnico derivado del teléfono. | Cuenta asociada al registro de repartidor; vinculación posterior desde la gestión de la tienda. El flujo vigente no usa códigos de invitación. |
| Administración de repartidores | Gestionar teléfono, matrícula, licencia, notas y disponibilidad; asociar registros a una tienda. La eliminación borra el registro del repartidor si no tiene entregas activas. | Propietario o administración según el endpoint. Crear un registro de repartidor desde la tienda no crea automáticamente una cuenta de acceso. |
| Asignación | Vincular un repartidor disponible sin otra entrega activa; asignarlo lo marca como no disponible. | Pedido de entrega local y repartidor elegible. |
| Panel de repartidor | Mostrar la entrega activa, contacto y enlaces de mapa; actualizar estado y notas. | Sesión de la cuenta vinculada y acceso a la tienda. |
| Cierre de entrega | Actualizar la entrega y liberar disponibilidad si no quedan entregas activas. El endpoint de repartidor no actualiza el estado del pedido. | Entrega asignada al repartidor autenticado. |
| Instalación móvil | Manifest, aviso de instalación y service worker con caché y pantalla sin conexión bajo `/rider`. | Navegador compatible y contexto seguro. Las actualizaciones requieren conexión; no existe cola de cambios offline. |

Fuentes: `src/lib/delivery.ts`, `src/lib/delivery-schemas.ts`, `src/components/delivery/`, `src/components/checkout/delivery-location-picker.tsx`, `src/app/(rider)/`, `src/app/api/rider/`, `public/sw.js`.

## Administración y CRM

| Módulo | Para qué sirve y cómo funciona | Configuración necesaria |
| --- | --- | --- |
| Usuarios | Consultar usuarios, modificar rol global y eliminar cuentas; bloquea la autoeliminación administrativa. | Cuenta de administración. |
| Vendedores y tiendas | Consultar negocios y gestionar actividad, verificación, ciudad, posición destacada y suscripción. | Tiendas, ciudades y planes existentes. |
| Productos y pedidos | Supervisar catálogo y compras; eliminar productos y desasignar repartidores desde la operación administrativa. | Permiso global y registros de la plataforma. |
| Planes | Gestionar catálogo, límites, comisión y referencias de precios; sincronizar catálogo inicial. | Precios Stripe válidos para planes pagados activos. No se permite borrar planes con suscripciones asociadas. |
| Ciudades | Mantener las ciudades del modelo comercial. | Datos administrativos; el indicador de ciudad de la cabecera es estático. |
| Categorías | Administrar jerarquía y activación; impedir borrado de categorías con productos o subcategorías. | Catálogo coherente. |
| Métricas de plataforma | Resumir usuarios, productos, pedidos, métodos de pago, tiendas, comisiones y suscripciones. | Datos operativos; revisar qué estados contabiliza cada indicador. |
| Prospectos | Registrar negocios, contactos, canales, origen, prioridad, responsable y estado comercial; editar fichas. | Acceso administrativo y datos del prospecto. |
| Importación de prospectos | Captura manual, archivo CSV o texto CSV, vista previa y comprobación de coincidencias. | Columnas compatibles y revisión de posibles duplicados. |
| Actividades y seguimiento | Registrar contacto, comentario, resultado y próxima fecha de seguimiento. | Prospecto existente. Registrar una actividad no envía mensajes. |
| Métricas comerciales | Contar prospectos por estado, origen, categoría y actividad, y calcular conversión del pipeline. | Estados y actividades mantenidos por el equipo. |

Fuentes: `src/app/(admin)/admin/`, `src/app/api/admin/`, `src/components/admin/prospects/`, `src/lib/prospects.ts`.

## Marketing y comunicaciones

| Función | Implementación | Configuración necesaria |
| --- | --- | --- |
| Tablero social | Crear contenido, guardar fecha y canales, publicar inmediatamente o publicar una ficha manualmente; muestra estados y errores. | Administrador y cuentas Meta configuradas para publicar. |
| Facebook e Instagram | Publicación mediante Graph API, almacenamiento de identificadores externos y errores por canal. Feed e historias están disponibles en el publicador y en el endpoint de estilo. | Página de Facebook, cuenta de Instagram habilitada para publicación, permisos y token vigente. El publicador actual exige ambos identificadores incluso al elegir un canal. |
| Imágenes de campaña | Convertir composiciones SVG a PNG mediante Sharp o recibir una imagen cargada. Los textos y plantillas de campaña parten de la configuración social del repositorio. | Sharp disponible en el servidor; FTP y alojamiento público para los archivos. El renderizador actual no carga archivos de fuentes explícitamente ni requiere un generador de IA externo. |
| Campañas automáticas | Endpoints generan y publican campañas de promoción o estilo en días concretos. | Programador externo, autenticación interna, FTP y Meta. El código filtra días en UTC. |
| Correos | Bienvenida, recuperación de contraseña, verificación de tienda, pedido recibido, confirmación, aviso al vendedor y pedido entregado. | Resend, remitente autorizado y URL pública correcta. La ausencia o fallo del proveedor afecta los avisos. |
| WhatsApp transaccional | Solicitudes de texto mediante Cloud API en los flujos que llaman al servicio, por ejemplo al marcar un pedido entregado desde el panel. | Cuenta emisora, autorización vigente y teléfono válido. No es un sistema general de campañas ni de entrega garantizada. |

La fecha guardada en el tablero no activa por sí sola la publicación de esa ficha: el helper llamado «publicar pendientes» genera una campaña nueva y no recorre la cola de fichas programadas. Es una limitación de implementación.

Una publicación puede quedar marcada como publicada si tuvo éxito en un solo canal. Comprueba los identificadores de cada canal y el último error para conocer el resultado completo.

El contacto directo de WhatsApp desde el carrito está deshabilitado: su endpoint devuelve 410. Esto es independiente de los enlaces para compartir y de las notificaciones transaccionales.

Fuentes: `src/app/(admin)/admin/marketing/actions.ts`, `src/lib/social-cron.ts`, `src/lib/social-publisher.ts`, `src/lib/social-marketing-image.ts`, `src/lib/email.ts`, `src/lib/whatsapp.ts`, `src/app/api/whatsapp/cart-target/route.ts`.

## Configuración por servicio

Las credenciales se suministran mediante la configuración privada del entorno. Consulta la plantilla local y el código del módulo correspondiente para asignarlas; este README omite sus nombres y valores.

| Servicio o dato | Qué hay que preparar | Cuándo es necesario |
| --- | --- | --- |
| PostgreSQL | Base accesible, conexión de aplicación, conexión directa para migraciones y seed, y certificados TLS cuando correspondan. | Núcleo del sitio. |
| Autenticación | Secreto de sesión y origen público coherente. | Registro, inicio de sesión y zonas privadas. |
| Google OAuth y People | Aplicación OAuth, retorno autorizado y permiso de lectura de teléfonos; People se usa para intentar completar un teléfono faltante. | Acceso con Google. Si no obtiene teléfono, el perfil puede completarse manualmente. |
| URL pública | Dominio del marketplace, enlaces de correo, retornos de pagos y autenticación. | Todos los entornos; revisar también URLs literales existentes al cambiar de dominio. |
| Stripe | Credenciales del entorno correcto, Connect, precios de suscripción mensuales en MXN, portal de facturación y webhook. | Tarjetas, altas Connect y facturación de planes. |
| Vercel Blob | Almacén público autorizado y configuración del host de imágenes de ese almacén. | Subida de logos, banners, imágenes y copia de imágenes remotas. |
| Google Maps y Places | Proyecto habilitado, acceso de navegador restringido al dominio y servicios requeridos disponibles. | Selector de destino para entrega local. |
| Resend | Cuenta y remitente autorizado, con dominio de envío preparado. | Correos transaccionales y recuperación de acceso por correo. |
| WhatsApp Cloud API | Emisor y autorización de la cuenta de negocio. | Avisos de texto implementados. |
| Meta | Activos sociales compatibles, permisos y autorización de publicación. | Facebook e Instagram. |
| FTP y alojamiento público | Acceso al directorio de destino y URL pública que sirva los archivos subidos. | Campañas con imágenes generadas o recibidas por endpoints internos. |
| Programador | Ejecuciones autenticadas de tareas internas, horario explícito y revisión de resultados. | Recuperación de reservas y campañas automáticas. |

La plantilla local no constituye una lista completa de capacidades: el selector de mapas utiliza configuración adicional. Revisa el módulo antes de habilitar una integración.

## Planes y reglas comerciales

El catálogo inicial contiene Starter, Pro, Business y Agency; no hay un plan Free en el catálogo actual. Precios, límites y comisiones iniciales están en `src/lib/plan-catalog.ts`; la administración mantiene los registros efectivos en la base de datos.

Solo las suscripciones activas o en prueba conceden derechos de plan. Sin plan efectivo, los helpers establecen un cupo de cero productos nuevos y pedidos. Los límites cuentan productos activos, borradores y pausados sin eliminar; para pedidos usan el inicio de mes en la zona de Ciudad de México y excluyen cancelados y reembolsados.

Aunque el modelo almacena importes anuales, el checkout de suscripción implementado valida precios mensuales. Las características declaradas en el catálogo, como dominio personalizado o invitaciones de personal, no prueban que exista un flujo completo para activarlas.

## Arquitectura y desarrollo

| Área | Implementación |
| --- | --- |
| Aplicación | Next.js 16.2.4 con App Router, React 19.2.4 y TypeScript. |
| Datos | PostgreSQL, Prisma 7, adaptador `pg`, modelo en `prisma/schema.prisma` y migraciones versionadas. |
| Interfaz | Tailwind CSS 4, componentes Radix/shadcn, formularios y validación con Zod. |
| Estado local | Zustand para carrito; favoritos con almacenamiento local del navegador. |
| Código servidor | Route handlers y acciones de servidor; acceso a servicios en `src/lib/`. |
| Separación por tienda | Membresías, filtros por tienda y helpers de acceso. Los módulos no usan todos el mismo helper. |
| Validaciones | Esquemas de entrada, comprobaciones de propiedad, control de concurrencia en checkout y tratamiento persistente de eventos Stripe. |
| Límites de solicitudes | Contador en memoria de cada proceso para determinadas rutas sensibles; no es un límite distribuido entre instancias. |
| Observabilidad | Logger estructurado y endpoint de salud. Sentry figura como dependencia, pero no hay inicialización ni instrumentación en el código revisado. |
| SEO | Metadatos, Open Graph, datos estructurados, robots y sitemaps de tiendas y productos. No garantiza indexación o posicionamiento. |

### Preparación local

Requisitos: Node.js 22 o superior, pnpm 9.15.5, PostgreSQL accesible y configuración privada del entorno completada. La instalación genera Prisma y requiere que su configuración pueda resolver una conexión.

```powershell
Copy-Item .env.example .env
# Completar la configuración privada local antes de instalar.
pnpm install
pnpm db:migrate
# Solo para una base de desarrollo destinada a datos iniciales:
pnpm db:seed
pnpm dev
```

El servidor de desarrollo abre en http://localhost:1500. El seed incorpora ciudades, categorías, planes y registros de ejemplo, incluida una cuenta administrativa; sus credenciales no se reproducen aquí. No debe ejecutarse como paso automático en producción.

Prisma carga primero el archivo local de entorno y después el general; el seed carga el general. Comprueba que ambos comandos utilizan la base de desarrollo prevista. El pool del runtime valida certificados por defecto; el seed tiene configuración TLS propia que debe revisarse antes de reutilizarlo fuera de desarrollo.

### Comandos del repositorio

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Desarrollo en el puerto 1500. |
| `pnpm build` | Generar cliente Prisma y compilar con webpack; no aplica migraciones. |
| `pnpm start` | Iniciar la aplicación compilada. |
| `pnpm lint` | Ejecutar ESLint. |
| `pnpm exec tsc --noEmit` | Comprobar tipos. |
| `pnpm test` | Ejecutar pruebas mediante el runner de Node y tsx. |
| `pnpm db:migrate` | Aplicar migraciones versionadas con Prisma. |
| `pnpm db:push` | Sincronizar esquema solo en prototipos o bases desechables de desarrollo. |
| `pnpm db:seed` | Cargar datos iniciales de desarrollo. |
| `pnpm db:studio` | Abrir la interfaz de inspección de Prisma. |
| `pnpm blob:migrate-paths` | Mostrar el plan de migración de rutas de imágenes sin aplicarlo. La opción de aplicación del script copia archivos, actualiza referencias y elimina originales. |

CI usa Node.js 22, instalación con lockfile, lint, tipos y pruebas. Las pruebas existentes cubren carrito, dinero, CSV, prospectos, límites, reglas de facturación, recuperación de checkout, rutas y migración Blob, placeholders y TLS de PostgreSQL. No sustituyen la verificación integral de las integraciones.

Antes de modificar Next.js, lee las guías de la versión instalada en `node_modules/next/dist/docs/`. La configuración personalizada se mantiene en `next.user-config.ts`; no se edita directamente `next.config.mjs`.

### Base de datos y migraciones

El acceso de la aplicación ocurre desde el servidor mediante Prisma. El modelo incluye una tabla de artículos de carrito, pero el carrito de la interfaz utiliza almacenamiento del navegador: la presencia de esa tabla no implica sincronización implementada.

Las migraciones incluyen restricciones de acceso para los roles de la API de Supabase y políticas RLS, además de cambios comerciales y de pagos. Algunas hacen referencia explícita a esos roles; al preparar un PostgreSQL genérico, revisa la compatibilidad antes de ejecutar la cadena completa. La cuenta de migración debe disponer de los permisos necesarios. No se ha ejecutado esta cadena contra una base nueva durante la revisión documental.

## Rutas operativas

| Área | Rutas |
| --- | --- |
| Catálogo | `/`, `/stores`, `/categories`, `/search`, `/offers`, `/[storeSlug]`, `/[storeSlug]/[productSlug]` |
| Compra | `/cart`, `/checkout`, `/checkout/success` |
| Consulta pública de pedido | `/orders`, `/orders/[orderRef]` |
| Cuenta | `/account/profile`, `/account/orders`, `/account/favorites` |
| Acceso | `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`, `/onboarding` |
| Vendedor | `/dashboard`, `/dashboard/[storeSlug]` |
| Módulos del vendedor | Bajo `/dashboard/[storeSlug]`: `products`, `products/new`, `products/[productId]/edit`, `orders`, `orders/[orderId]`, `coupons`, `metrics`, `settings`, `planes`, `delivery`, `delivery/drivers` |
| Repartidor | `/rider`, `/rider/[storeSlug]`, `/rider/offline` |
| Administración | Bajo `/admin`: `users`, `sellers`, `sellers/[storeId]`, `products`, `orders`, `orders/[orderId]`, `drivers`, `plans`, `cities`, `categories`, `metrics`, `marketing` |
| CRM | `/admin/prospects`, `/admin/prospects/new`, `/admin/prospects/[prospectId]`, `/admin/prospects/import`, `/admin/prospects/follow-ups`, `/admin/prospects/metrics` |
| Información | `/plans`, `/help`, `/terms`, `/privacy`, `/cookies`, `/sitemap` |

Existe también `/products/[slug]`: sirve una ficha alternativa con canonical hacia la ruta de tienda y marcada para no indexar. La ruta principal recomendada de producto incluye tienda y producto. `/verification/success` muestra el resultado del enlace de verificación de tienda.

Los sitemaps XML se sirven en `/sitemap_index.xml`, `/sitemap_tiendas.xml` y `/sitemap_productos.xml`; `robots.txt` los anuncia. La página `/sitemap` es el índice visible para personas.

Las rutas antiguas de vendedor están deprecadas. El panel vigente utiliza `/dashboard/[storeSlug]`.

## Despliegue y tareas internas

1. Preparar PostgreSQL, certificados y configuración privada del destino.
2. Instalar con el lockfile y aplicar migraciones como paso explícito del despliegue. No utilizar sincronización directa del esquema en producción.
3. Compilar con `pnpm build` y configurar el servicio de aplicación o el proyecto Vercel.
4. Habilitar el retorno de Google en `/api/auth/callback/google` y el webhook Stripe en `/api/webhooks/stripe` bajo el dominio público.
5. Verificar Sharp en el servidor y configurar los almacenes de imágenes y sus orígenes permitidos.
6. Configurar el programador externo y verificar sus resultados; `vercel.json` no contiene tareas programadas.
7. Comprobar `/api/health` y los flujos de negocio con cuentas y servicios del entorno apropiado.

| Endpoint interno | Operación y programación |
| --- | --- |
| `/api/internal/checkout-reservations` | Recuperación de reservas vencidas. Frecuencia recomendada: cada 10 minutos; ajustar capacidad al volumen. |
| `/api/internal/social-publish-due` | Generación y publicación promocional; solo martes y jueves según UTC. |
| `/api/internal/style-publish-due` | Generación y publicación de estilo; solo lunes y viernes según UTC en la ejecución normal. También acepta generación explícita e imagen cargada. |

Los tres endpoints admiten GET y POST y exigen autenticación interna. El filtro por día no establece hora ni evita por sí mismo varias publicaciones el mismo día. Coordina el horario y las repeticiones en el programador.

El modo de simulación del endpoint de estilo omite publicar en Meta, pero crea registros y sube imágenes. Las solicitudes explícitas de generación o imagen siguen una rama diferente: no deben tratarse como simulaciones.

`/api/health` consulta PostgreSQL: devuelve 200 cuando responde y 503 si falla. Sus indicadores de configuración no prueban que Stripe, Google u otros proveedores funcionen.

## Mapa de API

| Grupo | Operaciones implementadas |
| --- | --- |
| Acceso y perfil | Registro, recuperación y cambio de contraseña, handlers de autenticación y lectura/edición del perfil. |
| Catálogo y tiendas | Alta y consulta de tienda, ajustes, visibilidad, opciones de pago, verificación, carga de imágenes y reseñas. |
| Productos de tienda | Alta, edición, cambio de estado, eliminación, edición masiva e importación CSV. |
| Venta y facturación | Checkout, cambio de estado de pedido, reembolso, cupones, onboarding Connect, suscripción y portal. |
| Logística | Listado, alta, edición y eliminación de repartidores; consulta/asignación de entrega y actualización desde el panel del repartidor. |
| Administración | Usuarios, tiendas, verificación, suscripciones locales, planes, sincronización del catálogo inicial, ciudades, categorías, eliminación de productos y desasignación de repartidor. |
| CRM | Alta y edición de prospectos, detalle, comprobación de duplicados y registro de actividades. |
| Infraestructura | Webhook Stripe, tareas internas, comprobación de salud y generación de sitemaps XML. |

Las consultas de muchos listados se realizan en las páginas de servidor; no hay una API pública de lectura independiente para cada pantalla. Las modificaciones de marketing usan acciones de servidor además de los endpoints internos. Asignar o eliminar una suscripción desde administración modifica el registro local; esas rutas no crean ni cancelan por sí mismas una suscripción en Stripe.

## Verificación y límites pendientes

| Área | Comprobación necesaria o límite real |
| --- | --- |
| Compra integral | Probar invitado y usuario, cada método de pago, variantes, cupones, inventario insuficiente y carrito de varias tiendas. |
| Pagos | Verificar webhooks de éxito, fallo, expiración y reembolso completo, además de la sincronización de suscripciones y Connect en entorno de prueba. |
| Transferencia y efectivo | Confirmación y cobro dependen de la operación del comercio; cambiar un estado no concilia fondos. |
| Logística | Probar registro, vinculación, asignación, bloqueo de repartidor ocupado, entrega y recuperación de disponibilidad; verificar por separado el estado del pedido. |
| Datos locales | Carrito y favoritos no se sincronizan entre dispositivos. |
| Ciudad | La cabecera muestra una ciudad fija; no hay un selector funcional conectado al filtrado del catálogo. |
| Dominio y personal | Guardar dominio y declarar características de plan no implementa aprovisionamiento DNS ni un flujo de invitación de personal. |
| Marketing programado | Falta procesamiento automático de las fichas programadas del tablero; las tareas actuales generan campañas nuevas. |
| Resultado por canal | Revisar errores e identificadores externos aun cuando una ficha social aparezca publicada. |
| PWA | Caché y pantalla offline disponibles; no hay sincronización de modificaciones realizadas sin conexión. |
| Observabilidad | Falta conectar la dependencia Sentry si se desea captura externa de errores; el logger y health sí tienen código. |
| Permisos | Comprobar cada operación con propietario, personal, administrador y usuario ajeno; no asumir permisos uniformes entre endpoints. |
| Producción | El inventario de código no demuestra despliegue ni entrega de correos, mensajes, publicaciones o pagos reales. |

## Licencia

Privado, uso interno.
