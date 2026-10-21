---
name: sdd
description: Orquesta cambios mediante SDD v2 con RESUME FIRST, modos FAST/DEBUG/STANDARD/STRICT, estado persistente, grafo de tareas, checkpoints y revisión proporcional al riesgo.
---

# SDD v2

Entrada conceptual: `sdd_run(goal)`. Una petición equivalente en lenguaje natural activa el mismo flujo.

## Protocolo breve

1. Carga `AGENTS.md`, `.sdd/project.yaml`, la constitución y memoria configuradas.
2. Busca una spec activa y su `state.yaml`.
3. Si está incompleta, verifica Git y ejecuta `resume.next_action` antes de clasificar trabajo nuevo.
4. Sin reanudación, clasifica:
   - **FAST:** cambio trivial, local y reversible.
   - **DEBUG:** defecto o regresión que exige diagnóstico basado en evidencia.
   - **STANDARD:** cambio funcional o refactor normal.
   - **STRICT:** cualquier categoría declarada en `risk.strict_mode`.
5. Para STANDARD, STRICT o una reanudación SDD, lee completamente [references/engine.md](references/engine.md).

## Invariantes

- No repitas trabajo completado ni limpies un árbol `dirty_expected`.
- No inventes decisiones funcionales o de riesgo.
- Autoavanza dentro del alcance aprobado; detente sólo ante una decisión humana real, bloqueo o cambio de alcance.
- Una tarea lista por invocación del implementer; checks focales por tarea; suite amplia en el checkpoint configurado.
- Reviewer según riesgo; commits por bloque lógico revisado.
- El coordinador, no los subagentes, actualiza el estado y decide transiciones.
