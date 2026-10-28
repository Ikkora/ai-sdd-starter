# Playbook operativo

1. Recibe un objetivo mediante `sdd_run(goal)` o lenguaje natural.
2. Carga `AGENTS.md`, `.sdd/project.yaml`, memoria y constitución configuradas.
3. Busca un `state.yaml` incompleto: **RESUME FIRST**.
4. Verifica commit, estado del árbol y `git.expected_paths`.
5. Si hay reanudación válida, ejecuta `resume.next_action` sin reconstruir trabajo.
6. Sin estado activo, clasifica FAST, DEBUG, STANDARD o STRICT.
7. Resuelve Stack Profile, capabilities y Security Profile antes de planificar o implementar. Conserva ausencia legacy sin materializar `standard`.
8. Selecciona controles de baseline y rulesets aditivos. Sólo tags del cambio que coinciden con superficies de riesgo pueden recomendar elevación.
9. Crea spec, plan y grafo de tareas sólo cuando el modo lo requiera.
10. Detén el flujo únicamente por una decisión humana real o un bloqueo comprobado.
11. Forma bloques coherentes y ejecuta una tarea lista por invocación.
12. Corre checks focales por tarea y checkpoints configurados por incremento.
13. Evalúa Quality Gates configurados por modo, aplicabilidad y disponibilidad. `auto` ausente degrada; `required` aplicable ausente usa `await_human_setup`.
14. Ejecuta providers aplicables sin instalar terceros. Deep Review busca defectos técnicos concretos en el diff; normaliza y consolida todos los findings.
15. Ante findings corregibles, realiza una sola ronda normal de corrección y un re-check focal; sólo un hallazgo crítico justifica romper este límite.
16. Solicita SDD Reviewer inmediato sólo para categorías configuradas; usa review de bloque/final para el resto. El Reviewer comprueba cumplimiento, evidencia, excepciones y cierre.
17. Commita únicamente un bloque revisado y verde.
18. Registra evidencia, Quality Gates y estado de forma atómica, dejando una acción de reanudación concreta.
19. Cierra cuando requisitos, providers `required` aplicables, validación, documentación, review final y árbol limpio estén demostrados.

La Security Baseline define controles y aplicabilidad; no inspecciona código. `doctor` valida configuración e infraestructura SDD; no funciona como scanner del producto. El contrato completo vive en `engine/skill/references/engine.md`.

Acciones humanas válidas en `resume.next_action`: `await_human_decision:<id>`, `await_human_setup:<id>` y `await_human_repair:<id>`. No se usan para pedir permiso de ejecutar tests, avanzar a la siguiente tarea, ejecutar un provider `auto` aplicable y disponible, solicitar reviewer o hacer un commit ya definido por la política aprobada.
