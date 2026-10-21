# Changelog

Todos los cambios relevantes de esta distribución se documentan aquí. El proyecto sigue [Semantic Versioning](https://semver.org/).

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

Esta versión está preparada y validada localmente; todavía no fue publicada ni etiquetada.
