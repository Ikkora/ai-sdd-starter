# Investigación: Spec 003 Quality Gates

Fecha de verificación inicial: 2026-10-22. Actualización Deep Review: 2026-10-26.

## Baseline e integración

- El repositorio oficial está en `main`, baseline commit `b275f69a3591ae5b60c1f8cc01f5f7815431a820`.
- `v1.0.0` es un tag anotado con objeto `c953774147766cfe7b57753f9b2285607f1c445a` y commit `50524aef31ed0f97c2dd3f5e9de789d8cb73e8f6`.
- `v1.0.1` es un tag anotado con objeto `b7b49696ceec904958b9617bfb5ae110e9a8b578` y commit `b275f69a3591ae5b60c1f8cc01f5f7815431a820`.
- El candidato no contiene metadata Git y se usa sólo como referencia de cambios.
- El candidato omite metadata pública y las specs 001/002; esas ausencias no autorizan borrados.

## Arquitectura SDD previa

- `engine/skill/references/engine.md` es la fuente normativa detallada.
- `.sdd/project.yaml` define riesgo, checkpoints y comandos por proyecto.
- `.sdd/state-template.yaml` no tenía Quality Gates.
- `cli/sdd.js` implementaba `init`, `doctor` y `--version`; `doctor` verificaba 10 componentes core.
- El runtime SDD es principalmente agent-driven; los providers se integran como contrato/policy + adapters.

## Anti-Slop

Fuente primaria: https://github.com/miqdadbadjuber/anti-slop

- Plugin/skills `antislop`, versión observada 3.2.21.
- Seis skills para core, UI, copy, accesibilidad/personas, mobile y código.
- Modos documentados `during` y `after`; para un gate sobre salida existente corresponde `after`.
- La instalación oficial actual ofrece plugin de Codex y rutas de skills; SDD no instala ninguna automáticamente.
- No se detectó plugin, skill materializada ni bridge en el entorno actual.

## Deep Review

Fuentes oficiales consultadas el 2026-10-26:

- https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/review-agent/SKILL.md
- https://github.com/openai/plugins
- https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/skill-creator/SKILL.md

Principios adoptados: review read-only, defect-first, alcance limitado al cambio, inspección del diff completo y contexto suficiente, findings accionables con evidencia concreta, continuidad después del primer defecto y ausencia explícita de findings inventados. La skill admite working tree, commit y comparación contra base.

Las convenciones actuales de skills requieren `SKILL.md` con frontmatter conciso, descripción discriminante y recursos adicionales sólo cuando aportan una función concreta. `sdd-deep-review` es autocontenida y no necesita scripts, assets ni APIs.

## Decisión sobre Thermos

Thermos fue evaluado y descartado antes del release porque introduce dependencia y cuota de Cursor. La arquitectura genérica se conserva y el adapter activo se reemplaza por `deep_review`, ejecutado dentro de Codex mediante una skill local versionada.

## Decisiones de diseño derivadas

1. El core modela providers genéricos mediante manifiestos declarativos.
2. La ejecución externa permanece agent-driven.
3. `sdd doctor` no instala ni ejecuta installers externos.
4. La disponibilidad de Deep Review se determina por la skill distribuida; no requiere bridge, API ni servicio externo.
5. Ausencia de configuración equivale a `off` para compatibilidad 1.0.x.
6. `auto` ausente degrada; `required` aplicable ausente bloquea con `await_human_setup`.
7. Findings se normalizan y deduplican antes de una sola ronda normal y re-check focal.
