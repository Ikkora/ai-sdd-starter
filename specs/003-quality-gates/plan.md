# Plan: Spec 003

Estado: approved

## Enfoque

Integrar selectivamente el candidato v1.1.0 sobre la baseline oficial v1.0.1. Cada diferencia se clasifica como ADD, MODIFY, KEEP FROM OFFICIAL o DO NOT IMPORT. No se reemplazan directorios completos y los documentos públicos se fusionan semánticamente para conservar el hardening 1.0.1.

La capa nueva vive en `engine/quality-gates`; el CLI distribuye contratos y detecta capabilities de forma conservadora. La ejecución real de providers permanece agent-driven.

## Arquitectura y áreas afectadas

- `engine/quality-gates/index.js`: policy, detección, evaluación, normalización, consolidación y compatibilidad de versión.
- `engine/quality-gates/providers/*.json`: adapters declarativos.
- `engine/skills/sdd-deep-review/SKILL.md`: review técnico nativo, read-only y change-scoped.
- `engine/skill/references/quality-gates.md`: contrato normativo.
- `engine/skill/references/engine.md` y agentes: transiciones y responsabilidades.
- `cli/sdd.js`: instalación de referencias/adapters y doctor optional-aware.
- `.sdd/*` y `templates/install/.sdd/*`: configuración y estado.
- Tests, README, CHANGELOG y spec 003.

## Persistencia y compatibilidad

- `quality_gates` ausente = todos los providers `off`.
- Doctor usa `.sdd/version`; instalaciones <1.1.0 conservan los 10 checks core previos.
- Instalaciones 1.1.0 agregan cuatro checks core de contrato, adapters y skill Deep Review.
- No se migran states existentes; el bloque nuevo es aditivo.
- Los states cerrados de specs 001/002 permanecen inalterados.

## Seguridad y privacidad

- Sin ejecución de installers externos.
- Sin descarga automática de providers ni llamadas a APIs externas.
- Sin inspección de secretos fuera de los scans de contenido versionable.
- Detección limitada a archivos/markers conocidos y host bridges explícitos.
- Un bridge sólo declara disponibilidad; el smoke exige salida real del provider.

## Integración controlada

- ADD: runtime, manifests, contrato, tests y spec 003.
- MODIFY: motor, agentes, configuración, templates, CLI, tests, metadata y documentación.
- KEEP FROM OFFICIAL: metadata pública, specs 001/002 y todo archivo oficial ausente del candidato.
- DO NOT IMPORT como evidencia final: state/validation cerrados, aprobación previa y afirmaciones de smokes no ejecutados.

## Quality Gates y providers externos

- Anti-Slop: adapter basado en skills reales; aplicabilidad por tags; modo conceptual `after`.
- Deep Review: skill local versionada; STANDARD/STRICT por defecto; input working tree, commit o diff contra base, con archivos y call sites necesarios.
- Findings se normalizan, deduplican y corrigen en una sola ronda normal.
- La skill nativa se instala con SDD y se detecta de forma determinista. Anti-Slop conserva la semántica opcional existente.

## Migración y rollback

Rollback lógico: revertir el commit de v1.1.0. No hay migraciones de datos ni instalaciones externas que deshacer. Los tags v1.0.0/v1.0.1 no se modifican.

## Estrategia de validación

STRICT con checkpoints 25/50/75/100. Checks focales por tarea; suite completa en 100%. Cobertura de policy, instalación/doctor legacy, smokes reales, scans y revisión independiente final.

## Riesgos y mitigaciones

- Parser YAML estrecho: sólo interpreta `quality_gates`; conservarlo documentado y testeado.
- Solapamiento entre `deep_review` y SDD Reviewer: separar revisión técnica del cumplimiento final de spec, arquitectura y cierre.
- Cobertura incompleta de archivos untracked: el review del working tree debe incluirlos además del diff Git.
- Solapamiento Reviewer/provider: responsabilidades explícitas y Reviewer final separado.
- Regresión documental 1.0.1: fusionar, no sustituir, README/CHANGELOG y preservar metadata.
- Evidencia candidata cerrada: tratarla como antecedente, no como validación de esta integración.

## Decisiones humanas pendientes

Ninguna para T09 a T14. La aprobación de tag, release o publicación queda fuera del cierre técnico.
