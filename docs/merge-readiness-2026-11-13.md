# Integración del 13 de noviembre de 2026

El usuario autorizó commit, push e integración en main, y confirmó que deben conservarse los pagos existentes.

La revisión previa identificó bloqueos globales de pagos reales en la rama TEST. Se corrigieron antes de integrar:

- LIVE conserva la disponibilidad de tarjeta según stripeOnboarded de la tienda y el flujo reservado existente.
- Las suscripciones normales conservan los identificadores de precio de Stripe ya configurados y su metadata anterior.
- Las etiquetas TEST y la promesa de no realizar cargos reales se muestran únicamente cuando el servidor indica ese modo.
- Un modo TEST seleccionado sin claves de prueba válidas sigue bloqueado y nunca usa credenciales LIVE como alternativa.
- Los borradores, la base aislada y las comprobaciones de sesiones pagadas TEST permanecen separados.

Cuatro pruebas nuevas cubren disponibilidad LIVE/TEST, configuración incompleta, referencias de precio y presentación de pagos. No se ejecutaron cargos reales ni se aplicaron migraciones en producción. La revisión independiente no encontró otros problemas importantes en esta corrección.

Limitación conservada: la validación de cupones de suscripción promocional permanece exclusiva de TEST; no se habilitó el cobro promocional LIVE como parte de esta corrección. Las verificaciones reales del sandbox y las migraciones siguen pendientes según docs/shop-promo-test-report.md.

Se excluyeron del commit registros temporales, outputs y el progreso local no relacionado. Otros cambios locales posteriores al commit inicial permanecen sin modificar.
