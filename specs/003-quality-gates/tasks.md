# Tareas: Spec 003

- [x] **T01. Inventariar diferencias y proteger la baseline.** RF-19
  - Depende de: ninguna.
  - Áreas: repositorio oficial, candidato, Git.
  - Riesgo: traceability.
  - Checks: inventario SHA-256; rama/status; refs, objetos y commits de tags.
  - Hecho cuando: existe clasificación ADD/MODIFY/KEEP/DO NOT IMPORT y baseline registrada.

- [x] **T02. Integrar runtime y manifests.** RF-01..10
  - Depende de: T01.
  - Áreas: `engine/quality-gates/**`.
  - Riesgo: architecture.
  - Checks: syntax; tests focales de policy, normalización y consolidación.
  - Hecho cuando: ambos providers usan la misma abstracción sin dependencia obligatoria.

- [x] **T03. Integrar contrato, skill y agentes.** RF-01..11
  - Depende de: T02.
  - Áreas: `engine/skill/**`, `engine/agents/**`, copias instaladas.
  - Riesgo: architecture.
  - Checks: revisión normativa; copias byte-identical.
  - Hecho cuando: RESUME FIRST, una ronda y Reviewer final separado quedan preservados.

- [x] **T04. Integrar config, state y templates.** RF-02..05, RF-11, RF-16
  - Depende de: T03.
  - Áreas: `.sdd/**`, `templates/**`.
  - Riesgo: compatibility, idempotency.
  - Checks: init aislado; invariancia de copias; schema/state.
  - Hecho cuando: instalaciones nuevas reciben 1.1.0 y legacy sigue válido.

- [x] **T05. Integrar CLI, doctor y versión.** RF-12..18
  - Depende de: T02, T04.
  - Áreas: `cli/sdd.js`, package metadata.
  - Riesgo: compatibility.
  - Checks: syntax; doctor legacy/nuevo; `--version`.
  - Hecho cuando: doctor separa core/integraciones y respeta `off/auto/required`.

- [x] **T06. Integrar pruebas simuladas.** RF-01..18
  - Depende de: T04, T05.
  - Áreas: `test/**`.
  - Riesgo: regression.
  - Checks: suite focal A–R; installer tests.
  - Hecho cuando: tests simulados e instalación aislada quedan verdes.

- [x] **T07. Reconciliar documentación y spec 003.** RF-18, RF-19, RF-24
  - Depende de: T05, T06.
  - Áreas: README, CHANGELOG, PLAYBOOK, spec 003.
  - Riesgo: release_accuracy.
  - Checks: revisión histórica; diff de alcance; scan sensible.
  - Hecho cuando: 1.0.x se conserva y los smokes reales figuran pendientes.

- [x] **T08. Ejecutar smoke real Anti-Slop.** RF-20
  - Depende de: T07.
  - Áreas: provider real, artefacto aplicable, state.
  - Riesgo: external_setup, traceability.
  - Checks: capability real; resultado original; normalización; persistencia.
  - Hecho cuando: Anti-Slop se ejecutó realmente; un bridge solo no cuenta.

- [x] **T09. Integrar `deep_review` y `sdd-deep-review`.** RF-01..11, RF-21
  - Depende de: T08.
  - Áreas: runtime Quality Gates, manifest, skill canónica e instalada, motor y agentes.
  - Riesgo: architecture, security, compatibility, traceability.
  - Checks: syntax; manifests; frontmatter; copias byte-identical; normalización con evidencia; ausencia de Thermos activo; review arquitectónico inmediato.
  - Hecho cuando: la skill es read-only, defect-first y change-scoped, y no solapa la autoridad final del SDD Reviewer.

- [x] **T10. Distribuir, detectar, documentar y probar Deep Review.** RF-02..18
  - Depende de: T09.
  - Áreas: CLI, configuración, templates, doctor, tests y documentación.
  - Riesgo: architecture, idempotency, compatibility, release_accuracy.
  - Checks: init; idempotencia; doctor nuevo/legacy; off/auto/required; FAST/STANDARD/STRICT; findings; consolidación; cobertura igual o superior a 28 tests; review arquitectónico inmediato.
  - Hecho cuando: instalaciones nuevas incluyen y detectan `sdd-deep-review` sin Cursor, terceros, claves ni dependencias npm de runtime.

- [x] **T11. Ejecutar smoke real Deep Review.** RF-21
  - Depende de: T10.
  - Áreas: skill real, working tree, evidencia original, state y validation.
  - Riesgo: correctness, security, traceability.
  - Checks: capability real; baseline `b275f69`; modo read-only; salida original; evidencia concreta; normalización y persistencia.
  - Hecho cuando: Codex ejecutó realmente `sdd-deep-review` sobre el working tree completo y preservó su resultado.

- [x] **T12. Consolidar findings y aplicar una ronda.** RF-08..10, RF-22
  - Depende de: T08, T11.
  - Áreas: findings y archivos afectados.
  - Riesgo: regression, security.
  - Checks: deduplicación; severidad; evidencia retenida; límite de una ronda; checks focales.
  - Hecho cuando: los findings reales quedan consolidados y se aplica como máximo una ronda normal.

- [x] **T13. Ejecutar re-checks y validación amplia.** RF-22, RF-23
  - Depende de: T12.
  - Áreas: alcance completo.
  - Riesgo: release_accuracy, compatibility.
  - Checks: re-check Anti-Slop y Deep Review; suite; syntax; doctor; pack; diff; scans; tags históricos.
  - Hecho cuando: los findings corregidos están cerrados y toda evidencia de release está verde.

- [x] **T14. Reviewer final, commits y cierre técnico.** RF-19..24
  - Depende de: T13.
  - Áreas: spec completa, arquitectura, evidencia y Git.
  - Riesgo: architecture, traceability, release_accuracy.
  - Checks: reviewer independiente; staged diff; commits lógicos; status; ausencia de tag/release/publicación.
  - Hecho cuando: el Reviewer aprueba, los commits quedan registrados, el árbol está limpio y la aprobación de release sigue pendiente.

## Grafo

```text
T01 → T02 → T03 → T04 ─┐
             └────────→ T05 → T06 → T07 → T08 → T09 → T10 → T11
                                                    T08 ─────────┴→ T12 → T13 → T14
```

## Checkpoints STRICT

- 25%: T01–T03, arquitectura e integración normativa.
- 50%: T04–T06, distribución, compatibilidad y tests simulados.
- 75%: T07–T11, distribución de Deep Review y ambos smokes reales.
- 100%: T12–T14, correcciones, re-checks, validación, reviewer y commits.
