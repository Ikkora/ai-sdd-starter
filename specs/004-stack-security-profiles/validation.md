# Validación: Spec 004

Estado: pending

## Evidencia por requisito

| Requisitos | Evidencia | Resultado |
|---|---|---|
| RF-01 a RF-27 | Pendiente de implementación | PENDIENTE |

## Checkpoints

| Hito | Incremento validado | Comandos | Resultado | Residuos |
|---|---|---|---|---|
| Planificación | RESUME FIRST, baseline, spec, research, decisions, plan y grafo | Git, fuentes primarias, planner y Reviewer independientes, re-check focal, `git diff --check` | APROBADO | Ninguno |
| 25% | T01 a T03 | Manifests, parser, riesgo adaptativo, 30 tests focales y review independiente | APROBADO | Runner Node requiere ejecución fuera del sandbox por `spawn EPERM` |
| 50% | T04 a T06 | Focales y regresiones CLI | PENDIENTE | N/A |
| 75% | T07 a T09 | Distribución, legacy y fixtures | PENDIENTE | N/A |
| 100% | T10 a T12 | Suite, doctor, pack, hashes, gates y review | PENDIENTE | N/A |

## Evidencia por tarea

- T01: 5 manifests JSON válidos, 28 controles baseline, 22 reglas de stack, 25/25 dominios cubiertos y 50 IDs únicos. Los perfiles tienen diferencias efectivas. Review inmediato APROBADO después de precisar que sólo las superficies coincidentes elevan modo y que las reglas de stack son aditivas.
- T02: syntax PASS y 12/12 tests focales PASS fuera del sandbox tras `spawn EPERM` interno. Cubre legacy, perfiles custom, tipos inválidos, sintaxis YAML peligrosa, prototype pollution, scalars ambiguos y padre enlazado. Review inmediato APROBADO después del re-check focal.
- T03: syntax PASS y 18/18 tests focales propios, 30/30 combinados con T02. Cubre perfiles, stacks conocidos y custom, triggers, riesgo, controles, elevación y manifests inválidos. El checkpoint corrigió capabilities globales y controles `always` que activaban elevación o review sin relevancia del cambio. Re-check APROBADO.

## Quality Gates

- Anti-Slop DURING: activo para arquitectura, naming, límites de responsabilidad y documentación.
- Anti-Slop formal: pendiente al 100%.
- Deep Review: pendiente al 100%.

## Revisiones

- Review independiente de planificación: APROBADO tras corregir cobertura normativa de RF-09 y coherencia del grafo.
- Review inmediato T01: APROBADO tras re-check focal de riesgo y composición baseline/stack.
- Review inmediato T02: APROBADO tras re-check focal de contención de path y plain scalars.
- Checkpoint 25% T01-T03: APROBADO tras una corrección consolidada de proporcionalidad y re-check focal.
- Reviews inmediatos de arquitectura y seguridad: pendientes.
- Reviewer final: pendiente.

## Compatibilidad y rollback

Pendiente de evidencia. La estrategia no requiere migración destructiva y preserva ausencia legacy.

## Incidencias

- Review de planificación: RF-09 no enumeraba su cobertura y el diagrama de tareas discrepaba del estado. Corrección focal aplicada y re-review APROBADO.

## Riesgos residuales

- El lector YAML acotado debe documentar con precisión la sintaxis soportada.
- La selección de controles no equivale a detección exhaustiva de vulnerabilidades.

## Criterios de finalización

Pendientes.

## Conclusión

La planificación está aprobada. T01 es la siguiente tarea lista.
