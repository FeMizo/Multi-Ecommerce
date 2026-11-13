# Crítica integral — AionSite Shop

Method: dual-agent (A: /root/design_review · B: /root/evidence_review)

12 de noviembre de 2026. Objetivo estable: `src`; sitio observado: http://localhost:1500. Revisión de diseño y experiencia; sin cambios al producto.

## Dictamen

25/40: aceptable, con mejoras importantes pendientes. La identidad crema, terracota y tipografía editorial es consistente. El principal problema es la distancia entre una presentación de marketplace premium y las señales concretas que necesita quien intenta comprar: reconocer productos, encontrar inventario, registrarse con el rol correcto y resolver excepciones.

Conservar la identidad y reorganizar la experiencia alrededor del catálogo real. No hace falta reemplazar el diseño completo. Las promesas de protección deben explicarse con políticas confirmadas por el negocio.

## Alcance real

Se inventariaron 62 páginas: 21 públicas, 5 de autenticación, 13 de vendedor, 19 de administración, 3 de reparto y 1 de verificación. Se escanearon 167 archivos de interfaz. Esto no significa que las 62 páginas se hayan probado individualmente en navegador.

| Familia | Evidencia y límites |
|---|---|
| Inicio | Capturas de escritorio 1440×1000 y móvil 390×844; observación adicional a 1265×714. |
| Catálogo | Búsqueda inspeccionada en móvil; directorio, tienda y carrito vacío visitados y capturados. |
| Producto | Código revisado; primera captura todavía en carga, sin afirmar validación visual final. |
| Planes | Estado local sin planes inspeccionado visualmente y confirmado en código. |
| Acceso | Registro móvil inspeccionado; login capturado y escaneado. Recuperación y onboarding revisados por código representativo. |
| Compra y cuenta | Carrito vacío observado; checkout y componentes de cuenta revisados por código, sin pedido ni pago. |
| Paneles privados | Familias de vendedor, administración y reparto revisadas por implementación y componentes compartidos; sin sesión autenticada. |
| Ayuda y legales | Lectura de implementación representativa; sin auditoría jurídica ni validación integral de cada texto. |

Los datos locales mostraban 2 tiendas, 3 productos y 1 categoría. No se infiere que producción tenga ese inventario ni que estos datos sean representativos. No se crearon cuentas, pedidos, entregas ni mensajes.

## Salud heurística

Puntuación orientativa del alcance observado y del código revisado. Los paneles sin sesión y los flujos sin ejecución reducen la certeza; no es una certificación de usabilidad o accesibilidad.

| Heurística | /4 | Hallazgo principal |
|---|---:|---|
| Estado del sistema | 3 | Carga y feedback presentes; recuperación de red débil en reparto. |
| Lenguaje del usuario | 2 | Etiquetas internas como “Fase 3” y promesas abstractas en escaparate. |
| Control y libertad | 3 | Filtros y navegación de retorno; cancelación de entrega sin prevención. |
| Consistencia | 3 | Identidad coherente; intención de registro y roles desalineados. |
| Prevención de errores | 2 | Buenas validaciones de compra; registro genérico empieza en vendedor. |
| Reconocimiento | 3 | Navegación móvil etiquetada; imágenes de respaldo no identifican productos. |
| Eficiencia | 3 | Filtros progresivos y acciones rápidas; catálogo demasiado tardío en inicio. |
| Diseño minimalista | 2 | Varias capas de promoción y confianza antes del inventario. |
| Recuperación de errores | 2 | Recálculo en checkout; sin salida útil cuando no existen planes. |
| Ayuda | 2 | Contactos visibles, pero faltan respuestas específicas de pago y entrega. |
| Total | 25/40 | 62.5%, aceptable. |

## Fortalezas

- Identidad cálida reconocible y componentes compartidos; vale la pena preservar paleta, tipografía y lenguaje visual.
- Navegación inferior móvil etiquetada y filtros progresivos que permiten explorar sin exponer todo a la vez.
- Carrito por tienda y salvaguardas de checkout en código: total, errores por campo, autocompletado, bloqueo de envío y recálculo. Falta comprobarlos con cuentas y datos controlados.

## Cinco prioridades

### 1. P1 — Las imágenes de respaldo impiden reconocer los productos

En búsqueda móvil, las tarjetas sin fotografía muestran la marca ampliada y recortada. Foamy y sacapuntas terminan pareciéndose; el título debe suplir una imagen que ocupa gran parte de la tarjeta.

Acción: distinguir una foto real de un respaldo; usar marca contenida o un estado neutro “Sin fotografía”, conservar proporciones y pedir al vendedor imágenes auténticas. No inventar fotografías del producto.

Evidencia: `src/components/products/product-card.tsx:179` y `outputs/critique/search-detector-mobile.png`. Confirmación visual independiente de A y B. Comandos sugeridos: impeccable harden y layout.

### 2. P1 — El inicio posterga demasiado el catálogo

En móvil, el primer CTA queda cerca del final del primer viewport. Antes de los productos se acumulan etiqueta premium, titular, descripción, cuatro promesas, estadísticas, ilustración y otra sección de confianza. En escritorio tampoco aparecen productos en la primera pantalla observada. La ilustración de comercio genérico no representa los artículos locales observados.

Acción: acortar el mensaje, adelantar búsqueda y productos, usar inventario auténtico y reducir la confianza repetida a información concreta. Retirar lenguaje interno del escaparate. Mantener las rutas de compra y apertura de tienda, dando prioridad explícita a una.

Evidencia: `src/app/(public)/page.tsx:218`, `:296` y `:442`; capturas `home-mobile.png` y `home-detector-desktop.png`. Ambas evaluaciones coinciden. El detector además midió 3.0:1 para texto terracota sobre el bloque oscuro de “Fase 3”; corregir ese texto o retirarlo. Comandos: impeccable distill y clarify.

### 3. P1 — El registro genérico empieza con la intención equivocada para comprar

“Registrarse” abre `/register`, cuyo rol inicial es SELLER. Se confirmó Vendedor preseleccionado en móvil. Un comprador debe identificar y corregir esa elección antes de continuar.

Acción: preservar el contexto de entrada: comprador desde compra/cuenta, vendedor desde “Abrir mi tienda”, repartidor desde su acceso específico. Si la intención es desconocida, ofrecer una elección explícita o una entrada orientada al comprador.

Evidencia: `src/components/layout/navbar.tsx:380`, `src/app/(auth)/register/register-form.tsx:82`, `outputs/critique/register-mobile.png`. Comando: impeccable onboard.

### 4. P1 — Planes puede terminar en una página vacía sin salida

Con cero planes activos, `/plans` presenta encabezado y descripción, pero ninguna oferta ni alternativa. Se observó en el entorno local; el componente solo recorre el arreglo y no tiene estado vacío. No se afirma que producción carezca de planes.

Acción: mostrar un estado específico, acceso a soporte y retorno claro. Evitar dirigir al vendedor a una selección imposible y explicar qué puede hacer mientras se habilitan los planes.

Evidencia: `src/app/(public)/plans/page.tsx`, `outputs/critique/plans-detector-mobile.png`. Comando: impeccable harden.

### 5. P1 — Reparto necesita recuperación de red y prevención de cancelaciones

La actualización de estado activa loading y espera fetch sin captura ni restauración garantizada. Un rechazo puede dejar los controles bloqueados. “Cancelar entrega” cambia el estado directamente sin confirmación ni deshacer. Son riesgos identificados en código; no se reprodujeron con entregas reales.

Acción: restaurar controles siempre, mostrar reintento conservando contexto y confirmar cancelación con pedido y consecuencia visibles. Hacer accionable el teléfono para el uso móvil.

Evidencia: `src/components/delivery/rider-active-delivery-card.tsx:37`, `:100` y `:112`. Comando: impeccable harden.

## Carga cognitiva y recorrido emocional

El inicio combina adquisición de vendedores y compra sin una prioridad nítida. El costo no está en tener cinco destinos familiares de navegación; está en exigir varias decisiones y leer promesas antes de descubrir el inventario. Búsqueda ofrece mejor revelado progresivo. La agrupación de las muchas secciones administrativas debe validarse con un administrador, sin concluir que su cantidad por sí sola sea un error.

La llegada transmite cuidado. El descubrimiento pierde credibilidad cuando aparecen logos en lugar de fotografías. La separación de carrito por tienda y la claridad del total pueden recuperar confianza. No se ejecutó compra ni entrega: la experiencia del cierre permanece sin validar.

## Personas y señales de fricción

- Casey, comprador móvil: catálogo tardío, imágenes indistinguibles y acciones de cabecera de 40×40 px. Aumentar comodidad táctil; esta medida por sí sola no demuestra incumplimiento WCAG.
- Jordan, primera visita: registro en Vendedor, “Fase 3” sin significado para el cliente y protección sin explicación cercana.
- Riley, usuario interrumpido: planes vacíos sin recuperación; reparto vulnerable al rechazo de red y a cancelación accidental según código.

## Observaciones secundarias

- P2: explicar qué cubre “Compra protegida”, cómo funciona la transferencia y quién resuelve una entrega fallida. La ayuda actual es general. Vincular respuestas a pago, envío y pedido; confirmar primero las políticas reales.
- Revisar los botones anidados en el enlace de la tarjeta de producto con teclado y lector de pantalla. Cancelar propagación de ratón no certifica semántica accesible.
- Revisar asociaciones de etiquetas en onboarding y configuraciones `reducedMotion="never"`; no se realizó una prueba completa de movimiento reducido.
- Dos lecturas de contraste de 4.49:1 son fronterizas y requieren validación antes de declararlas incumplimientos.
- PRODUCT.md y DESIGN.md no existen según el contexto cargado. Documentar producto y sistema visual como trabajo posterior, sin inventar garantías o políticas.

## Interpretación del detector

Una ejecución de fuente devolvió 4 señales en 2 archivos: 3 advertencias y 1 observación. No equivalen a cuatro defectos de experiencia.

| Regla | Ubicación | Interpretación |
|---|---|---|
| gradient-text | `src/app/globals.css:261` | Clase sin uso encontrado; no atribuir impacto visible actual. |
| codex-grid-background | `src/app/globals.css:145` | Decoración usada en inicio/producto; juicio estético, no fallo funcional. |
| ai-color-palette, dos señales | `src/components/products/category-grid.tsx:43` y `:44` | Hover de categorías belleza/juguetes, no visible en el catálogo local observado; no describe la paleta completa. |

En inicio, la cabecera del detector en navegador informó 11 patrones, pero imprimió 12 señales individuales: se conserva la discrepancia y no se presentan como 12 problemas únicos. Señales: chip introductorio, líneas huérfanas, repetición de iconos, contraste, brillo radial y subtítulo superior. Búsqueda, planes y login no devolvieron patrones en sus registros individuales; eso no demuestra ausencia de problemas de UX o accesibilidad.

El ancho móvil de inicio y búsqueda fue 390 px sin desbordamiento de página demostrado. Un ancho de 411 px apareció solo con la superposición del detector y desapareció al navegar: no se atribuye ese efecto a la aplicación.

## Decisiones para la siguiente fase

1. ¿Prioridad inmediata: mejorar compra y descubrimiento, activar vendedores o asegurar operación de reparto?
2. ¿Alcance: tres prioridades principales o las cinco prioridades y observaciones secundarias?

Antes de reescribir “Compra protegida”, confirmar su cobertura efectiva con el negocio. Esta crítica no autoriza inventar condiciones ni ejecutar transacciones.

## Evidencias

- `outputs/critique/design-review.md`: evaluación A independiente.
- `outputs/critique/evidence-review.md`: evaluación B, alcance técnico y limpieza.
- `outputs/critique/detector-raw.json`: escaneo determinista conservado.
- `outputs/critique/*-current-detector.txt`: resultados individuales por ruta. Los archivos `*-browser-console.txt` anteriores acumulan navegación y no deben usarse para contar por página.
- `outputs/critique/*.png`: capturas de las evaluaciones.

No se validaron sesiones privadas, lector de pantalla, zoom al 200%, tema oscuro, tabletas, rendimiento bajo red lenta ni flujos reales de pago, correo o entrega. Las conclusiones se limitan a lo observado y al código indicado.
