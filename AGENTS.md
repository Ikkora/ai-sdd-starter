# Reglas del repositorio SDD v2

## Fuentes de verdad

1. Constitución: `docs/constitution.md`.
2. Spec activa y su `state.yaml`.
3. `.sdd/project.yaml`.
4. Motor canónico en `engine/`.
5. Código y pruebas reales.

Si discrepan de una forma que cambia comportamiento, seguridad, compatibilidad o arquitectura, investigar y solicitar la decisión humana necesaria.

## Entrada SDD

Toda intención entra por `sdd_run(goal)` o lenguaje natural y aplica **RESUME FIRST**. La skill instalada en `.agents/skills/sdd/SKILL.md` contiene el protocolo breve y su referencia del motor contiene el contrato detallado. Las fuentes de distribución viven en `engine/` y `templates/install/`.

## Reglas locales

- Preservar sin cambios semánticos la metodología SDD v2 validada.
- El CLI no puede borrar código, asumir un stack ni ejecutar comandos del producto.
- No se versionan secretos ni rutas personales.
- El paquete no incorpora dependencias npm de runtime.
- Cada cambio del instalador debe quedar cubierto por pruebas aisladas.

## Agentes

- El coordinador controla estado, aprobaciones, bloques y commits.
- El planner propone artefactos y grafo; no implementa.
- El implementer ejecuta una tarea lista; no hace commit ni avanza otra.
- El reviewer trabaja en sólo lectura y devuelve evidencia independiente.
