# Changelog

Todos los cambios relevantes de esta distribución se documentan aquí. El proyecto sigue [Semantic Versioning](https://semver.org/).

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
