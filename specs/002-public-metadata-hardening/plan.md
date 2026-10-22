# Plan — Spec 002

Estado: approved

## Enfoque

Aplicar dos tareas secuenciales: primero los tres archivos públicos nuevos; después las correcciones históricas y de publicación en README/CHANGELOG. Validar el diff por paths y hashes de superficies prohibidas antes de la suite completa.

## Arquitectura y áreas afectadas

- Producto/documentación: exclusivamente `LICENSE`, `SECURITY.md`, `.gitignore`, `README.md`, `CHANGELOG.md`.
- Proceso SDD: artefactos de `specs/002-public-metadata-hardening/`.
- Ningún archivo de runtime, motor, agente o template cambia.

## Persistencia y compatibilidad

No hay datos, migraciones ni contratos de CLI. `.gitignore` se revisa con `git check-ignore` para asegurar que la infraestructura SDD siga visible.

## Seguridad y privacidad

La política evita Issues públicos para reportes sensibles y no publica emails ni canales no documentados. Se escanean secretos y rutas personales al final.

## Migración y rollback

Rollback mediante revert del commit único. `v1.0.0` se captura antes y se compara después; `v1.0.1` se crea sólo tras aprobación y commit.

## Estrategia de validación

- Focales por tarea: contenido MIT/SECURITY/gitignore y afirmaciones README/CHANGELOG.
- Checkpoint 50%: alcance y reglas de ignore.
- Checkpoint 100%: `npm test`, `npm run check`, `node cli/sdd.js doctor`, `git diff --check`, status, hashes de paths prohibidos y scan sensible.

## Riesgos y mitigaciones

- Afirmación pública falsa: contrastar tags y remote localmente.
- Canal de seguridad inventado: no incluir contacto alternativo si no está documentado.
- Ignore excesivo: assertions negativas para `specs/`, `.sdd/`, `.agents/`, `.codex/`, `templates/`, `docs/`.
- Deriva funcional: diff y hashes restringidos por path.

## Trazabilidad

- T01 → RF-01, RF-02, RF-03.
- T02 → RF-04, RF-05, RF-06.
- Validación final → RNF-01, RNF-02, RNF-03.

## Decisiones humanas pendientes

Ninguna.
