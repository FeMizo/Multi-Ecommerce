# Tres mejoras prioritarias

Alcance elegido: compradores y vendedores; tres problemas principales de la crítica del 12 de noviembre de 2026. Cambios locales, sin publicación.

## Cambios

1. Tarjetas: las imágenes ausentes o que fallan muestran “Sin fotografía” con un icono neutro, sin ampliar el logo. Se conservan las fotos reales y se especifican tamaños adaptables.
2. Inicio: presentación breve y catálogo inmediatamente después. Se conservan accesos claros a compra y apertura de tienda; se eliminan promoción repetida, estadísticas introductorias, ilustración genérica y etiquetas internas. El bloque de vendedores incluye acceso al registro y a planes.
3. Registro: entrada genérica para comprador; apertura de tienda con rol vendedor explícito en inicio, pie y directorio; plan seleccionado conserva intención de vendedor. Cambiar el selector sincroniza el rol del formulario con la selección visible. Repartidor mantiene su entrada explícita.

## Validación

- ESLint en los seis archivos afectados: sin errores ni advertencias.
- TypeScript: `tsc --noEmit`, salida 0.
- Detector Impeccable sobre los seis archivos afectados: salida 0, ninguna señal.
- Portada inspeccionada a 390×844 y 1440×1000. En móvil: ancho de página 390, sin desbordamiento horizontal; productos y precios en el primer viewport observado.
- Registro inspeccionado en móvil: entrada genérica BUYER; entrada role=seller SELLER; entrada planId sin role SELLER. Cambio desde Vendedor a Comprador actualiza selección y campo accountType a BUYER; comprobación inversa también realizada.
- No se enviaron formularios, crearon cuentas ni ejecutaron pagos.

Capturas: `outputs/critique/fixes-home-mobile.png`, `fixes-home-desktop.png` y `fixes-register-mobile.png`.

Se conservaron otros cambios existentes. Los problemas de planes vacíos, recuperación de reparto y ayuda permanecen fuera de estas tres mejoras. No se recalculó la puntuación de la crítica ni se afirma verificación de producción.
