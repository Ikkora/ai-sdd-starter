# Validación — Spec 001

Estado: pending

## Evidencia por requisito

| Requisito | Evidencia | Resultado |
|---|---|---|
| RF-01, RF-02, RF-10 | 15 comparaciones SHA-256 entre fuentes heredadas y canónicas | OK |
| RF-02–RF-07, RF-10 | Smokes y suite aislada de init, name, preflight, dry-run, force, repetición e invariancia del motor | OK |
| RF-08, RF-09 | Versión, instalación completa, doctor 10/10 y doctor con reviewer faltante 9/10 | OK |
| RF-11 | README documenta GitHub Template y CLI como caminos equivalentes; CLI explícitamente opcional | OK |
| RF-02–RF-10 | `node --test test/installer.test.js`: escenarios A–I | 9/9 PASS |

## Checkpoints

| Hito | Incremento validado | Comandos | Resultado | Residuos |
|---|---|---|---|---|
| Arquitectura inicial | T01: separación `engine/` y `templates/install/` | Comparación SHA-256 y scan de indicadores sensibles | 15 `BYTE_IDENTICAL`; `NO_MATCHES` | Fuentes heredadas conservadas para instalación raíz y compatibilidad |
| Init focal | T02: init seguro e idempotente | `node --check cli/sdd.js` y smokes temporales de escenarios init | PASS; temporales eliminados | Revisión inmediata de `destructive_operations` pendiente |
| 25% STRICT | T01–T02: fuentes y dry-run del init | `node --check cli/sdd.js`; dry-run vacío; `git diff --check` | PASS; cero escrituras | Ninguno |
| Doctor/version focal | T03: versión instalada y doctor acotado | `node cli/sdd.js --version`; init/doctor completo e incompleto en temporal | PASS; 1.0.0 y códigos esperados | Doctor valida presencia/tipo, no semántica YAML/TOML |
| 50% STRICT | T01–T03: instalación completa, doctor y versión | init + doctor + version en temporal; `node --check`; `git diff --check` | PASS; doctor 10/10; versión 1.0.0 | Ninguno |
| Suite focal | T04: pruebas permanentes A–I | `node --check test/installer.test.js`; `node --test test/installer.test.js` | PASS; 9/9 en 1.63 s | Temporales eliminados |
| 75% STRICT | T01–T04: sintaxis, suite A–I y diff | `node --check` CLI/tests; `node --test test/installer.test.js` fuera del sandbox; `git diff --check` | PASS; 9/9 en 2.22 s | Sandbox interno sigue limitado por `spawn EPERM` |
| Release focal | T05: documentación y paquete 1.0.0 | checks documentales; `pnpm pack --dry-run --json`; sintaxis; diff | PASS; 20 archivos previstos; sin tarball | `npm` no disponible en PATH; equivalente pnpm usado |
| 100% STRICT | Suite completa, doctor local, versión, packaging, scan y cleanup | `node --test`; `doctor`; `--version`; `pnpm pack --dry-run --json`; sintaxis; diff; scan sensible | PASS; 9/9, 10/10, 1.0.0, 20 archivos | Sin tarball ni temporales; warning LF→CRLF no bloqueante |

## Revisiones

- Revisión inmediata de arquitectura T01: `VEREDICTO: APROBADO`, sin bloqueantes; 15 comparaciones reproducidas y scan `NO_MATCHES`.
- Revisión inmediata de init T02: `VEREDICTO: APROBADO`, sin bloqueantes; preflight, rutas inseguras, force acotado e idempotencia reproducidos.
- Revisión final independiente: `VEREDICTO: APROBADO`, sin bloqueantes. Confirmó RF-01–RF-11, RNF-01–RNF-03, suite A–I, packaging y continuidad SDD.

## Compatibilidad y rollback

Compatibilidad demostrada en carpeta vacía, repositorio existente y stacks nominales distintos. Rollback mediante revert del commit lógico final; el CLI no realiza migraciones ni borrados.

## Incidencias

- Semántica fijada para T04: `init --dry-run` con conflictos no escribe y devuelve código 1.
- Una ejecución sandbox falló antes de cargar tests con `spawn EPERM`; el mismo comando autorizado pasó 9/9. Clasificado como infraestructura.

## Riesgos residuales

- `doctor` valida presencia y tipo, no semántica YAML/TOML, conforme al alcance solicitado.
- La suite necesita subprocesses; el sandbox restringido devuelve `spawn EPERM`, por lo que la ejecución completa se validó fuera de esa restricción.

## Criterios de finalización

- [x] Requisitos con evidencia.
- [x] Checkpoint final verde.
- [x] Revisión final independiente aprobada.
- [x] Commit lógico `e66ea95c6c3967b1bc23530d925aa957d59ef489` y árbol limpio tras cierre de estado.

## Conclusión

Release local 1.0.0 preparada y aprobada. No fue publicada ni etiquetada.
