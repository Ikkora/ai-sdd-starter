# Spec 003: Quality Gates & External Review Integrations

Estado: approved
Modo: STRICT
Motivo de elevación: el cambio modifica la arquitectura, la idempotencia, la trazabilidad, el contrato del motor y `sdd doctor`.

## Contexto y objetivo

Integrar sobre la baseline oficial v1.0.1 el candidato de SDD Universal v1.1.0 con una capa desacoplada de Quality Gates, usando Anti-Slop y el provider nativo `deep_review` como primeros adapters. La integración debe preservar toda la historia oficial, no depender de Cursor ni de servicios externos y demostrar ambos providers mediante smokes reales antes del cierre.

## Actores

- Coordinator SDD.
- Planner.
- Implementer.
- SDD Reviewer independiente.
- Quality Gate Provider opcional.
- Humano para setup cuando una capability real no está disponible.

## Definiciones

- **Provider:** capability externa descrita por un manifiesto genérico.
- **Adapter:** traducción entre la capability real del provider y el contrato SDD.
- **Finding normalizado:** hallazgo con identidad, providers, categoría, severidad, ubicación, resumen, evidencia, recomendación y bloqueo.
- **Host bridge:** señal explícita de disponibilidad para tooling que no expone una ruta portable; no prueba por sí sola una ejecución real.

## Requisitos funcionales

- RF-01: SDD DEBE soportar providers sin acoplar el core a un producto específico.
- RF-02: Cada provider DEBE soportar `off`, `auto` y `required`.
- RF-03: `auto` ausente DEBE registrar `not_available` y continuar.
- RF-04: `required` aplicable y ausente DEBE producir `await_human_setup:<provider>`.
- RF-05: La aplicabilidad DEBE considerar modo SDD y tipo/tags del cambio.
- RF-06: Anti-Slop DEBE ser contextual y no activarse mecánicamente sobre cambios irrelevantes.
- RF-07: `deep_review` DEBE actuar como revisión técnica nativa, read-only y defect-first, sin reemplazar al SDD Reviewer.
- RF-08: Findings heterogéneos DEBEN normalizarse y deduplicarse antes de llegar al Coordinator.
- RF-09: La política normal DEBE consolidar findings, hacer una sola ronda de corrección y luego re-check focal.
- RF-10: Un hallazgo crítico de seguridad/corrupción de datos PUEDE romper la regla de una ronda.
- RF-11: `state.yaml` DEBE persistir provider, mode, applicability, availability, status, findings, severity, correction_required, completed_at y recheck.
- RF-12: `sdd doctor` DEBE separar core de integraciones opcionales.
- RF-13: Providers opcionales ausentes NO DEBEN hacer fallar `doctor`.
- RF-14: Un provider configurado `required` y no detectado DEBE marcar doctor unhealthy.
- RF-15: `sdd init`, `sdd doctor` y `sdd --version` DEBEN conservar compatibilidad de uso.
- RF-16: Un proyecto SDD 1.0.x sin configuración nueva DEBE seguir funcionando sin Quality Gates.
- RF-17: `sdd init` DEBE instalar la skill local versionada `sdd-deep-review`; NO DEBE instalar Anti-Slop, terceros ni ejecutar installers externos.
- RF-18: La preparación DEBE identificar la versión funcional como 1.1.0 sin crear tag, release ni publicación npm.
- RF-19: La integración DEBE preservar `.gitignore`, `LICENSE`, `SECURITY.md`, specs 001/002, archivos oficiales no sustituidos y los tags v1.0.0/v1.0.1 sin reescribirlos.
- RF-20: Anti-Slop DEBE ejecutarse realmente sobre un artefacto aplicable, y su salida debe normalizarse y persistirse.
- RF-21: `sdd-deep-review` DEBE ejecutarse realmente mediante Codex sobre el working tree contra la baseline `b275f69`, en modo read-only, y su salida debe normalizarse y persistirse.
- RF-22: Los findings reales DEBEN consolidarse antes de una sola ronda normal de corrección y re-check focal.
- RF-23: La suite amplia y el SDD Reviewer independiente DEBEN ejecutarse después de los smokes reales.
- RF-24: No se DEBE crear tag, release ni publicación npm sin aprobación humana explícita posterior.

## Requisitos no funcionales

- Sin dependencias npm de runtime salvo justificación excepcional.
- Sin stack assumptions del proyecto destino.
- Sin secretos ni rutas personales versionadas.
- Detección no destructiva y sin comandos de terceros inventados.
- Manifiestos extensibles para providers futuros.

## Casos límite

- Provider disponible pero `off`.
- Provider `auto` ausente.
- Provider `required` ausente.
- FAST con `deep_review`.
- Anti-Slop sobre artefacto no aplicable.
- Hallazgo duplicado entre providers.
- Instalación 1.0.x sin sección `quality_gates`.
- Plugin manager opaco sin ruta portable.
- Bridge declarado sin evidencia de ejecución real.

## Fuera de alcance

- Instalar terceros automáticamente.
- Publicar npm.
- Crear `v1.1.0` o una GitHub Release.
- Implementar un runner específico de Cursor dentro del core.
- Hacer de Anti-Slop o un servicio externo dependencias obligatorias del producto.
- Requerir Cursor, APIs externas, claves o cuotas para completar Quality Gates.
- Reescribir o mover tags históricos.

## Criterios de finalización

- Arquitectura genérica y dos adapters integrados sobre v1.0.1.
- Baseline histórica preservada.
- Doctor compatible y optional-aware.
- State/template y motor actualizados.
- Cobertura simulada de instalación y Quality Gates igual o superior a los 28 tests previos.
- `sdd-deep-review` distribuida, detectable y separada del SDD Reviewer.
- Anti-Slop y `deep_review` ejecutados realmente, con evidencia normalizada y persistida.
- Findings consolidados, correcciones y re-check focal completados cuando corresponda.
- Suite completa, syntax, doctor, pack dry-run y scans verdes.
- Reviewer final sin bloqueantes.
- Uno o como máximo dos commits lógicos, árbol limpio y sin tag/release/publicación.

## Decisión histórica

Thermos fue evaluado y descartado antes del release porque introduce dependencia y cuota de Cursor; fue reemplazado por el review nativo de Codex `deep_review`.

## Decisiones humanas pendientes

Ninguna para el cierre técnico. El tag, la release y la publicación npm requieren una aprobación humana posterior.
