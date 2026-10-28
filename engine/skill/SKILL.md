---
name: sdd
description: Orquesta cambios mediante SDD v2 con RESUME FIRST, modos FAST/DEBUG/STANDARD/STRICT, estado persistente, grafo de tareas, checkpoints, Quality Gates opcionales y revisión proporcional al riesgo.
---

# SDD v2

Entrada conceptual: `sdd_run(goal)`. Una petición equivalente en lenguaje natural activa el mismo flujo.

## Protocolo breve

1. Carga `AGENTS.md`, `.sdd/project.yaml`, la constitución y memoria configuradas, incluido el contexto declarado de stack, capabilities y seguridad.
2. Busca una spec activa y su `state.yaml`.
3. Si está incompleta, verifica Git y ejecuta `resume.next_action` antes de clasificar trabajo nuevo.
4. Sin reanudación, clasifica:
   - **FAST:** cambio trivial, local y reversible.
   - **DEBUG:** defecto o regresión que exige diagnóstico basado en evidencia.
   - **STANDARD:** cambio funcional o refactor normal.
   - **STRICT:** cualquier categoría declarada en `risk.strict_mode`.
5. Para STANDARD, STRICT o una reanudación SDD, lee completamente [references/engine.md](references/engine.md). Si la spec configura Quality Gates, lee también [references/quality-gates.md](references/quality-gates.md).
6. Antes de planificar o implementar, resuelve los controles de seguridad aplicables y la recomendación de modo conforme al contrato del motor. El Coordinator combina esa recomendación con el modo existente y conserva la explicación en estado cuando aplique.

## Invariantes

- No repitas trabajo completado ni limpies un árbol `dirty_expected`.
- No inventes decisiones funcionales, APIs de providers ni comandos externos.
- Autoavanza dentro del alcance aprobado; detente sólo ante una decisión humana real, bloqueo o cambio de alcance.
- Una tarea lista por invocación del implementer; checks focales por tarea; suite amplia en el checkpoint configurado.
- Quality Gates opcionales se consolidan antes de una única ronda normal de corrección y un re-check focal.
- El SDD Reviewer conserva la responsabilidad final sobre spec, arquitectura, reglas y cierre.
- La Security Baseline selecciona controles y evidencia; Deep Review busca defectos técnicos concretos; el SDD Reviewer verifica cumplimiento y cierre. Anti-Slop no reemplaza ninguna de esas funciones.
- Reviewer según riesgo; commits por bloque lógico revisado.
- El coordinador, no los subagentes, actualiza el estado y decide transiciones.
