# Changelog

Todos los cambios relevantes de esta distribución se documentan aquí. El proyecto sigue [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-10-28 (preparada, no publicada)

### Added

- Stack Profile y capabilities abiertos, sin enums cerrados de lenguajes, frameworks o capacidades.
- Security Baseline declarativa con perfiles `off`, `standard` y `strict`, selección proporcional por contexto y rulesets de stack aditivos.
- Flags repetibles `--stack` y `--capability`, junto con `--security`, para configurar `sdd init` sin interacción.
- Distribución de la baseline y sus rulesets como copias verificables de las fuentes canónicas.

### Changed

- Las instalaciones nuevas usan `security.profile: standard`; proyectos legacy sin las nuevas secciones conservan el comportamiento v1.1.x.
- `sdd doctor` valida la configuración del proyecto y la infraestructura de política de seguridad, además de SDD Core y Quality Gates.
- Stack desconocido conserva la baseline universal sin exigir un adapter ni fallar por ausencia de ruleset específico.

### Security

- La elevación requiere una superficie de riesgo relevante para los tags del cambio; una capability por sí sola no eleva el modo.
- La baseline define controles, aplicabilidad y evidencia. No escanea el producto, no ejecuta payloads y no se presenta como SAST.
- Deep Review busca defectos técnicos concretos; el SDD Reviewer conserva la decisión sobre cumplimiento, evidencia, excepciones y cierre.

### Release status

- Metadata y paquete preparados para revisión de v1.2.0.
- No se creó el tag `v1.2.0`, GitHub Release ni publicación npm.

## [1.1.1] - 2026-10-26

### Changed

- Corrección del README público para reflejar que `v1.1.0` ya está publicada con tag y GitHub Release.
- Aclaración de que GitHub es el canal oficial de distribución y npm todavía no fue publicado.
- Documentación de `v1.1.1` como parche exclusivamente documental, sin cambios en el motor, el CLI, los Quality Gates, Deep Review, Anti-Slop, el instalador ni los tests funcionales.

## [1.1.0] - 2026-10-26

### Added

- Arquitectura genérica de Quality Gates / External Review Providers.
- Contrato `off`, `auto`, `required` con aplicabilidad y disponibilidad persistentes.
- Runtime sin dependencias para detección conservadora, normalización y consolidación de findings.
- Adapter opcional de Anti-Slop, basado en `miqdadbadjuber/anti-slop`, y provider nativo Deep Review mediante la skill versionada `sdd-deep-review`.
- Deep Review read-only, defect-first y limitado al cambio, con soporte para working tree, commit y comparación contra base.
- Persistencia de Quality Gates en `state.yaml` y contrato normativo dedicado.
- `sdd doctor` con separación de core y Quality Gates, detección determinista de Deep Review y soporte de providers `required`.
- Suite simulada de 30 tests: 9 del instalador y 21 de Quality Gates, incluidas las regresiones RF-10 y de detección sin `availability_env`.

### Changed

- El motor SDD integra Quality Gates antes del Reviewer final sin solapar responsabilidades.
- Planner, Implementer y Reviewer incluyen reglas explícitas para Quality Gates.
- `sdd init` distribuye el contrato, los manifests y la skill nativa Deep Review, pero no instala terceros.
- Nuevas instalaciones se identifican como 1.1.0; instalaciones 1.0.x sin configuración mantienen el comportamiento previo.

### Compatibility

- Ausencia de `quality_gates` equivale a providers `off`.
- Providers `auto` ausentes no fallan SDD ni `doctor`.
- Anti-Slop sigue siendo opcional. Deep Review forma parte de la distribución y no requiere Cursor, servicios externos, claves ni dependencias npm de runtime.

### Validation status

- Los 30 tests simulados, ambos smokes reales y sus re-checks focales están verdes.
- Los smokes reales Anti-Slop y Deep Review están preservados. Sus tres findings fueron corregidos en una ronda consolidada y pasaron los re-checks focales.
- La spec 003 cerró con Reviewer final aprobado, tag `v1.1.0` y GitHub Release `SDD Universal v1.1.0` publicados.
- GitHub es el canal oficial de distribución. npm no fue publicado.

## [1.0.1] - 2026-10-21

### Added

- Licencia MIT en `LICENSE`.
- Política de reporte responsable en `SECURITY.md`.
- Reglas preventivas y genéricas en `.gitignore`.

### Changed

- Actualización de metadata pública del repositorio.
- Corrección de la documentación sobre la publicación de `v1.0.0` y la disponibilidad del GitHub Template Repository.
- Documentación de la política de seguridad y del `.gitignore` preventivo.
- Sin cambios funcionales en el motor SDD v2 ni en el CLI.

## [1.0.0] - 2026-10-21

### Added

- Distribución universal de SDD v2 con motor y templates instalables separados.
- CLI Node.js sin dependencias externas con `sdd init`, `--name`, `--dry-run` y `--force`.
- Diagnóstico acotado de infraestructura mediante `sdd doctor`.
- Identificación de versión mediante `sdd --version` y `.sdd/version` en cada instalación.
- Instalación de skill, motor y agentes planner, implementer y reviewer.
- Suite aislada A–I para seguridad, conflictos, idempotencia, doctor e invariancia del motor.
- Documentación de adopción equivalente por GitHub Template Repository o CLI opcional.

### Security

- Preflight completo antes de escribir y sobrescritura forzada limitada al manifiesto SDD.
- Preservación de código ajeno, sin ejecución de comandos del producto ni supuestos de stack.

Esta versión fue publicada en GitHub y está etiquetada como `v1.0.0`; no fue publicada en npm.
