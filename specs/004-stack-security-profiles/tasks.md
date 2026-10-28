# Tareas: Spec 004

- [x] **T01. Definir contrato y manifests de seguridad.** RF-01, RF-02, RF-09, RF-10, RF-14, RF-15, RF-16
  - Depende de: ninguna.
  - Áreas previstas: `engine/security/`, `specs/004-stack-security-profiles/research.md`, `decisions.md`.
  - Riesgo: architecture, security.
  - Checks focales: parse JSON, IDs únicos, campos obligatorios, cobertura de dominios.
  - Hecho cuando: baseline, perfiles y rulesets expresan la política sin lógica específica de lenguajes en el resolver.
  - Bloque candidato: `policy-core`.

- [x] **T02. Implementar lectura, normalización y validación del perfil de proyecto.** RF-02 a RF-05
  - Depende de: T01.
  - Áreas previstas: `engine/project-config/`, tests focales.
  - Riesgo: security, compatibility, config_parsing.
  - Checks focales: legacy, vacío, custom, tipos inválidos, quotes, comentarios, sintaxis rechazada y ausencia de ejecución.
  - Hecho cuando: devuelve un modelo normalizado o diagnósticos con ubicación sin interpretar contenido ejecutable.
  - Bloque candidato: `policy-core`.

- [x] **T03. Implementar resolución de controles y riesgo adaptativo.** RF-10 a RF-16
  - Depende de: T01, T02.
  - Áreas previstas: `engine/security/index.js`, tests focales.
  - Riesgo: architecture, security, over_elevation.
  - Checks focales: off, standard, strict, sin riesgo, auth, permisos, datos personales, uploads, migración destructiva y triggers combinados.
  - Hecho cuando: el resultado es determinista, explicable y no eleva casos no aplicables.
  - Bloque candidato: `policy-core`.

- [x] **T04. Integrar política en motor, roles y estado.** RF-17, RF-18
  - Depende de: T03.
  - Áreas previstas: `engine/skill`, `engine/agents`, `.sdd/state-template.yaml`, copias instalables.
  - Riesgo: architecture, traceability.
  - Checks focales: invariantes, responsabilidades exclusivas, contexto previo a implementación y campos mínimos de estado.
  - Hecho cuando: los actores reciben contexto proporcional sin duplicar Baseline, Deep Review o Reviewer.
  - Bloque candidato: `method-cli`.

- [x] **T05. Extender `sdd init` con flags declarativos.** RF-01, RF-06 a RF-08, RF-26
  - Depende de: T02.
  - Áreas previstas: `cli/sdd.js`, templates de proyecto.
  - Riesgo: idempotency, destructive_operations, compatibility.
  - Checks focales: flags, duplicados, valores custom, dry-run, force, conflicto y no escritura parcial.
  - Hecho cuando: flags y edición manual producen configuración determinista sin ejecución del stack.
  - Bloque candidato: `method-cli`.

- [x] **T06. Extender doctor sin convertirlo en scanner.** RF-19 a RF-21
  - Depende de: T02, T03, T05.
  - Áreas previstas: `cli/sdd.js`, manifests gestionados, tests focales.
  - Riesgo: compatibility, diagnostics.
  - Checks focales: healthy, invalid stack, invalid capability, invalid profile, manifest faltante y legacy healthy.
  - Hecho cuando: doctor separa infraestructura, configuración y providers con diagnósticos accionables.
  - Bloque candidato: `method-cli`.

- [x] **T07. Distribuir fuentes y copias canónicas.** RF-17, RF-21, RF-22
  - Depende de: T04, T06.
  - Áreas previstas: `templates/install`, `.agents`, `.codex`, manifiesto del CLI y package files.
  - Riesgo: architecture, idempotency.
  - Checks focales: hashes byte-identical, manifiesto completo e inventario del paquete.
  - Hecho cuando: init materializa la política necesaria sin dependencias ni archivos faltantes.
  - Bloque candidato: `distribution-tests`.

- [x] **T08. Cubrir instalación, doctor y compatibilidad.** RF-03, RF-04, RF-06 a RF-08, RF-19, RF-24
  - Depende de: T05, T06, T07.
  - Áreas previstas: `test/installer.test.js`, tests de configuración y doctor.
  - Riesgo: regression, compatibility.
  - Checks focales: matriz nueva/legacy, manual/flags, dry-run/force e idempotencia.
  - Hecho cuando: cada cambio de init y doctor tiene una prueba aislada.
  - Bloque candidato: `distribution-tests`.

- [x] **T09. Añadir casos de seguridad inertes.** RF-09 a RF-15, RF-23, RF-24
  - Depende de: T03, T07.
  - Áreas previstas: fixtures declarativos y tests de política.
  - Riesgo: security, false_confidence.
  - Checks focales: SQL injection, XSS, command injection, paths, secrets, authorization, uploads y sesiones/tokens.
  - Hecho cuando: cada caso selecciona control o revisión sin ejecutar payloads ni afirmar cobertura SAST.
  - Bloque candidato: `distribution-tests`.

- [ ] **T10. Actualizar documentación normativa y pública.** RF-25
  - Depende de: T04, T05, T06.
  - Áreas previstas: README, PLAYBOOK, AGENTS, constitución, referencias, templates y artefactos de spec.
  - Riesgo: documentation_drift, responsibility_duplication.
  - Checks focales: conceptos definidos una vez, ejemplos custom, límites de review y Anti-Slop focal.
  - Hecho cuando: terceros pueden configurar y comprender la política sin leer el código.
  - Bloque candidato: `docs-release`.

- [ ] **T11. Preparar metadata v1.2.0 sin publicar.** RF-21, RF-22, RF-27
  - Depende de: T07, T08, T09, T10.
  - Áreas previstas: package metadata, lockfile, CHANGELOG y `.sdd/version`.
  - Riesgo: release_accuracy, traceability.
  - Checks focales: versiones coherentes, package dry-run y tags históricos inalterados.
  - Hecho cuando: el árbol queda listo para revisión de release sin tag ni publicación.
  - Bloque candidato: `docs-release`.

- [ ] **T12. Validar alcance completo y residuos.** RF-01 a RF-27
  - Depende de: T11.
  - Áreas previstas: repositorio completo y artefactos de spec.
  - Riesgo: release_accuracy, security, compatibility.
  - Checks focales: suite completa, syntax, doctor, pack, hashes, diff-check, secrets, paths y tags.
  - Hecho cuando: existe evidencia trazable para Quality Gates y Reviewer final.
  - Bloque candidato: `final-validation`.

## Grafo

```text
T01 -> T02
T01 + T02 -> T03
T02 -> T05
T02 -> T06
T03 -> T04 + T06 + T09
T05 -> T06 + T08 + T10
T04 -> T07 + T10
T06 -> T07 + T08 + T10
T07 -> T08 + T09 + T11
T08 + T09 + T10 -> T11
T11 -> T12
```

## Quality Gates

- Anti-Slop DURING en T01, T04 y T10. Auditoría formal al cierre.
- Reviewer SDD inmediato para T01 a T04 por arquitectura y seguridad.
- Deep Review formal después de T12 sobre el working tree completo.
- Findings consolidados, una ronda normal de corrección y re-check focal.
- SDD Reviewer final después del re-check.

## Checkpoints

- 25%: T01 a T03, contrato, parser y riesgo adaptativo.
- 50%: T04 a T06, motor, actores, estado, init y doctor.
- 75%: T07 a T09, distribución, compatibilidad y casos inertes.
- 100%: T10 a T12, documentación, metadata, suite, gates y review final.
