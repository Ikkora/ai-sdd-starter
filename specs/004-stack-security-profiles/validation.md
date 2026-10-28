# Validación: Spec 004

Estado: closed

## Evidencia por requisito

| Requisitos | Evidencia | Resultado |
|---|---|---|
| RF-01 a RF-27 | T01-T12, suite, smokes, hashes, scans, Quality Gates y Reviewer final | APROBADO |

## Checkpoints

| Hito | Incremento validado | Comandos | Resultado | Residuos |
|---|---|---|---|---|
| Planificación | RESUME FIRST, baseline, spec, research, decisions, plan y grafo | Git, fuentes primarias, planner y Reviewer independientes, re-check focal, `git diff --check` | APROBADO | Ninguno |
| 25% | T01 a T03 | Manifests, parser, riesgo adaptativo, 30 tests focales y review independiente | APROBADO | Runner Node requiere ejecución fuera del sandbox por `spawn EPERM` |
| 50% | T04 a T06 | 8 hashes canónico/instalado, syntax, `git diff --check`, 66 tests acumulados, review independiente y Anti-Slop DURING | APROBADO TRAS RE-CHECK | Runner Node requiere ejecución fuera del sandbox por `spawn EPERM` |
| 75% | T07 a T09 | Suite 92/92, Doctor 14/14, pack seco de 38 entradas, hashes dinámicos 5x3, review y Anti-Slop DURING | APROBADO | `npm pack --dry-run` requiere caché fuera del sandbox; metadata sigue en 1.1.0 hasta T11 |
| 100% | T10 a T12 | Suite 92/92, check, Doctor, pack, hashes, scans, Anti-Slop, Deep Review, re-check y Reviewer final | APROBADO | Tres findings medium corregidos en una ronda; sin excepciones |

## Evidencia por tarea

- T01: 5 manifests JSON válidos, 28 controles baseline, 22 reglas de stack, 25/25 dominios cubiertos y 50 IDs únicos. Los perfiles tienen diferencias efectivas. Review inmediato APROBADO después de precisar que sólo las superficies coincidentes elevan modo y que las reglas de stack son aditivas.
- T02: syntax PASS y 12/12 tests focales PASS fuera del sandbox tras `spawn EPERM` interno. Cubre legacy, perfiles custom, tipos inválidos, sintaxis YAML peligrosa, prototype pollution, scalars ambiguos y padre enlazado. Review inmediato APROBADO después del re-check focal.
- T03: syntax PASS y 18/18 tests focales propios, 30/30 combinados con T02. Cubre perfiles, stacks conocidos y custom, triggers, riesgo, controles, elevación y manifests inválidos. El checkpoint corrigió capabilities globales y controles `always` que activaban elevación o review sin relevancia del cambio. Re-check APROBADO.
- T04: 8 pares canónico/instalado byte-identical, estructura de agentes y estado verificada, responsabilidades separadas y Anti-Slop focal PASS. Review inmediato APROBADO sin bloqueantes.
- T05: syntax PASS y 34/34 tests focales acumulados de init, flags y configuración. Defaults `stack: {}`, `capabilities: {}` y `security.profile: standard`; flags repetibles, contenido inerte, legacy, dry-run, force, conflictos e idempotencia verificados. Review inmediato y Anti-Slop DURING APROBADOS sin findings.
- T06: syntax PASS y cobertura focal de Doctor v1.2 para instalaciones `standard` y `off`, configuración legacy, diagnósticos ubicados, manifests faltantes o inválidos y ausencia de escaneo del producto. Los conteos de Doctor v1.0 y v1.1 permanecen en 10 y 14 checks.
- Checkpoint 50%: 66/66 tests acumulados PASS fuera del sandbox, `git diff --check` PASS y review técnico independiente sin defectos. La única ronda consolidada corrigió persistencia de T06, evidencia del checkpoint y siguiente acción.
- T07: cinco manifests distribuidos como copias byte-identical entre motor, template y repositorio instalado. Init real, Doctor v1.2, inventario npm y 26/26 regresiones directas PASS. El review corrigió una expectativa de test que cerraba el inventario; el re-check dinámico quedó APROBADO.
- T08: 39/39 tests focales y regresiones directas PASS. Cubre instalación nueva `standard`, flags `off` y `strict`, componentes y capabilities custom, preflight, dry-run, force, conflictos, idempotencia, Doctor distribuido y proyectos 1.0.x/1.1.x preservados byte a byte.
- T09: 20/20 casos y regresiones directas PASS. SQL injection, XSS, command injection, paths privados, credenciales, autorización, uploads y sesiones/tokens se representan como datos inertes; stack desconocido conserva baseline sin ruleset específico. Los payloads no se pasan al evaluador ni se ejecutan.
- T10: documentación normativa y pública actualizada con Stack Profile abierto, perfiles de seguridad, baseline, límites de Doctor y responsabilidades diferenciadas. Dos pares canónico/instalado, enlaces, ejemplo parseable, installer 9/9 y Anti-Slop copywriting PASS. Review inmediato APROBADO sin findings.
- T11: metadata, lockfile y versión instalada coherentes en 1.2.0. CLI, init, Doctor, pack seco de 38 entradas, ausencia de dependencias runtime y tags protegidos verificados. Dos expectativas 1.1.x obsoletas del instalador se corrigieron y el re-check quedó 9/9 PASS. No se creó tag, release, tarball ni publicación.
- T12: suite 92/92, `npm run check`, Doctor local 14/14, instalación nueva 1.2.0 con Doctor HEALTHY, pack seco de 38 entradas, hashes canónicos/instalados, scans de secretos/rutas/residuos y tags históricos PASS. No se detectaron defectos ni residuos; Quality Gates finales y cierre completados.

## Quality Gates

- Anti-Slop DURING y final: PASS sin findings; no se detectaron claims fabricados, prosa genérica material, helpers innecesarios ni duplicación de reglas productivas.
- Deep Review formal desde `v1.1.1`: tres findings medium de correctness.
- Corrección consolidada: hash válido en plain scalars, tokens de reemplazo literales y rechazo de children tras mapas `{}` inline.
- Re-check focal: 42/42 tests PASS y los tres findings resueltos sin regresiones.

## Revisiones

- Review independiente de planificación: APROBADO tras corregir cobertura normativa de RF-09 y coherencia del grafo.
- Review inmediato T01: APROBADO tras re-check focal de riesgo y composición baseline/stack.
- Review inmediato T02: APROBADO tras re-check focal de contención de path y plain scalars.
- Checkpoint 25% T01-T03: APROBADO tras una corrección consolidada de proporcionalidad y re-check focal.
- Review inmediato T04: APROBADO; no requiere corrección ni re-check.
- Review inmediato T05: APROBADO sin findings; flags usan la ruta única de preflight y escritura existente.
- Checkpoint 50% T04-T06: APROBADO tras re-check focal de la corrección de continuidad.
- Review inmediato T07: APROBADO tras reemplazar inventario cerrado por mínimos v1.2 y comparación dinámica.
- Checkpoint 75% T07-T09: APROBADO tras quitar el último conteo cerrado de rulesets y corregir la continuidad documental.
- Bloque T10-T11: APROBADO tras corregir una conclusión de continuidad obsoleta y completar el re-check focal.
- Reviews inmediatos de arquitectura y seguridad: T01-T09 completados.
- Quality Gates finales: Anti-Slop PASS; Deep Review completado tras una ronda consolidada y re-check focal.
- Reviewer final independiente: APROBADO sin bloqueantes ni observaciones opcionales.

## Compatibilidad y rollback

La ausencia de las nuevas secciones conserva comportamiento v1.1.x. `init` nuevo genera `security.profile: standard`; `off` desactiva selección y elevación, `standard` aplica controles proporcionales y `strict` amplía controles y reduce umbrales. No existe migración destructiva.

## Incidencias

- Review de planificación: RF-09 no enumeraba su cobertura y el diagrama de tareas discrepaba del estado. Corrección focal aplicada y re-review APROBADO.
- Checkpoint 50%: el primer review detectó que T06 y la evidencia acumulada aún no estaban persistidas. Se aplicó una corrección documental consolidada sin cambios de implementación.
- T07: el review detectó un inventario de test cerrado; se conservan mínimos v1.2 y comparación dinámica de todos los manifests.
- Checkpoint 75%: una expectativa de Doctor aún fijaba tres rulesets y la conclusión documental apuntaba a T07. Ambos residuos se corrigieron en una ronda y el re-check quedó APROBADO.
- Deep Review final: detectó truncamiento de `#` válido, tokens de reemplazo interpretados y children ignorados tras mapas vacíos inline. Los tres findings medium se corrigieron en una sola ronda y pasaron re-check focal.

## Riesgos residuales

- El lector YAML acotado debe documentar con precisión la sintaxis soportada.
- La selección de controles no equivale a detección exhaustiva de vulnerabilidades.

## Criterios de finalización

Implementación, versión 1.2.0, suite, checks, Doctor, pack, hashes, scans, Quality Gates, Reviewer final y cierre protocolario completos.

## Conclusión

T01-T12, Quality Gates y Reviewer final están aprobados. La spec 004 queda cerrada sin acción SDD pendiente; tag, GitHub Release y publicación npm requieren una decisión humana posterior.
