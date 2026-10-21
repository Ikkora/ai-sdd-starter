# Playbook operativo

1. Recibe un objetivo mediante `sdd_run(goal)` o lenguaje natural.
2. Carga `AGENTS.md`, `.sdd/project.yaml`, memoria y constitución configuradas.
3. Busca un `state.yaml` incompleto: **RESUME FIRST**.
4. Verifica commit, estado del árbol y `git.expected_paths`.
5. Si hay reanudación válida, ejecuta `resume.next_action` sin reconstruir trabajo.
6. Sin estado activo, clasifica FAST, DEBUG, STANDARD o STRICT.
7. Crea spec, plan y grafo de tareas sólo cuando el modo lo requiera.
8. Detén el flujo únicamente por una decisión humana real o un bloqueo comprobado.
9. Forma bloques coherentes y ejecuta una tarea lista por invocación.
10. Corre checks focales por tarea y checkpoints configurados por incremento.
11. Solicita reviewer inmediato sólo para categorías configuradas; usa review de bloque/final para el resto.
12. Ante bloqueantes, consolida una ronda de corrección y solicita review focal.
13. Commita únicamente un bloque revisado y verde.
14. Registra evidencia, actualiza estado de forma atómica y deja una acción de reanudación concreta.
15. Cierra cuando requisitos, validación, documentación y árbol limpio estén demostrados.

Acciones humanas válidas en `resume.next_action`: `await_human_decision:<id>`, `await_human_setup:<id>` y `await_human_repair:<id>`. No se usan para pedir permiso de ejecutar tests, avanzar a la siguiente tarea, solicitar reviewer o hacer un commit ya definido por la política aprobada.
