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
| 50% | T04 a T06 | 8 hashes canónico/instalado, syntax, `git diff --check`, 66 tests acumulados, review independiente y Anti-Slop DURING | APROBADO TRAS RE-CHECK | Runner Node requiere ejecución fuera del sandbox por `spawn EPERM` |
| 75% | T07 a T09 | Distribución, legacy y fixtures | PENDIENTE | N/A |
| 100% | T10 a T12 | Suite, doctor, pack, hashes, gates y review | PENDIENTE | N/A |

## Evidencia por tarea

- T01: 5 manifests JSON válidos, 28 controles baseline, 22 reglas de stack, 25/25 dominios cubiertos y 50 IDs únicos. Los perfiles tienen diferencias efectivas. Review inmediato APROBADO después de precisar que sólo las superficies coincidentes elevan modo y que las reglas de stack son aditivas.
- T02: syntax PASS y 12/12 tests focales PASS fuera del sandbox tras `spawn EPERM` interno. Cubre legacy, perfiles custom, tipos inválidos, sintaxis YAML peligrosa, prototype pollution, scalars ambiguos y padre enlazado. Review inmediato APROBADO después del re-check focal.
- T03: syntax PASS y 18/18 tests focales propios, 30/30 combinados con T02. Cubre perfiles, stacks conocidos y custom, triggers, riesgo, controles, elevación y manifests inválidos. El checkpoint corrigió capabilities globales y controles `always` que activaban elevación o review sin relevancia del cambio. Re-check APROBADO.
- T04: 8 pares canónico/instalado byte-identical, estructura de agentes y estado verificada, responsabilidades separadas y Anti-Slop focal PASS. Review inmediato APROBADO sin bloqueantes.
- T05: syntax PASS y 34/34 tests focales acumulados de init, flags y configuración. Defaults `stack: {}`, `capabilities: {}` y `security.profile: standard`; flags repetibles, contenido inerte, legacy, dry-run, force, conflictos e idempotencia verificados. Review inmediato y Anti-Slop DURING APROBADOS sin findings.
- T06: syntax PASS y cobertura focal de Doctor v1.2 para instalaciones `standard` y `off`, configuración legacy, diagnósticos ubicados, manifests faltantes o inválidos y ausencia de escaneo del producto. Los conteos de Doctor v1.0 y v1.1 permanecen en 10 y 14 checks.
- Checkpoint 50%: 66/66 tests acumulados PASS fuera del sandbox, `git diff --check` PASS y review técnico independiente sin defectos. La única ronda consolidada corrigió persistencia de T06, evidencia del checkpoint y siguiente acción.

## Quality Gates

- Anti-Slop DURING: activo para arquitectura, naming, límites de responsabilidad y documentación.
- Anti-Slop formal: pendiente al 100%.
- Deep Review: pendiente al 100%.

## Revisiones

- Review independiente de planificación: APROBADO tras corregir cobertura normativa de RF-09 y coherencia del grafo.
- Review inmediato T01: APROBADO tras re-check focal de riesgo y composición baseline/stack.
- Review inmediato T02: APROBADO tras re-check focal de contención de path y plain scalars.
- Checkpoint 25% T01-T03: APROBADO tras una corrección consolidada de proporcionalidad y re-check focal.
- Review inmediato T04: APROBADO; no requiere corrección ni re-check.
- Review inmediato T05: APROBADO sin findings; flags usan la ruta única de preflight y escritura existente.
- Checkpoint 50% T04-T06: APROBADO tras re-check focal de la corrección de continuidad.
- Reviews inmediatos de arquitectura y seguridad: T01-T06 completados.
- Reviewer final: pendiente.

## Compatibilidad y rollback

La ausencia de las nuevas secciones conserva comportamiento v1.1.x. `init` nuevo genera `security.profile: standard`; `off` desactiva selección y elevación, `standard` aplica controles proporcionales y `strict` amplía controles y reduce umbrales. No existe migración destructiva.

## Incidencias

- Review de planificación: RF-09 no enumeraba su cobertura y el diagrama de tareas discrepaba del estado. Corrección focal aplicada y re-review APROBADO.
- Checkpoint 50%: el primer review detectó que T06 y la evidencia acumulada aún no estaban persistidas. Se aplicó una corrección documental consolidada sin cambios de implementación.

## Riesgos residuales

- El lector YAML acotado debe documentar con precisión la sintaxis soportada.
- La selección de controles no equivale a detección exhaustiva de vulnerabilidades.

## Criterios de finalización

Pendientes.

## Conclusión

El checkpoint 50% está aprobado tras el re-check focal. La siguiente tarea ejecutable será T07 después del commit lógico del bloque.
