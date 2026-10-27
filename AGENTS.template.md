# Reglas del repositorio

## Fuentes de verdad

1. Constitución: `<ruta configurada>`.
2. Documentación de producto o sistema: `<rutas del proyecto>`.
3. Spec activa y su `state.yaml`.
4. `.sdd/project.yaml`.
5. Memoria operativa configurada.
6. Código y datos reales.

Si discrepan de una forma que cambia comportamiento, datos, seguridad o arquitectura, investigar y solicitar la decisión humana necesaria.

## Entrada SDD

Toda intención entra por `sdd_run(goal)` o lenguaje natural y aplica **RESUME FIRST**:

1. cargar configuración y reglas;
2. buscar un estado incompleto;
3. verificar el árbol y preservar `dirty_expected`;
4. continuar desde `resume.next_action`;
5. sólo sin trabajo reanudable, clasificar FAST, DEBUG, STANDARD o STRICT.

La skill `.agents/skills/sdd/SKILL.md` contiene el protocolo breve y su `references/engine.md` es la única fuente normativa detallada. `references/quality-gates.md` define providers externos opcionales. No dupliques el motor aquí. Las particularidades viven en `.sdd/project.yaml` o en reglas de dominio de este repositorio.

## Reglas locales

- Arquitectura: `<reglas>`.
- Seguridad y privacidad: `<reglas>`.
- Invariantes de dominio: `<reglas>`.
- Definition of Done adicional: `<reglas>`.

## Agentes

- El coordinador controla estado, aprobaciones, bloques, Quality Gates y commits.
- El planner propone artefactos y grafo; no implementa.
- El implementer ejecuta una tarea lista; no hace commit ni avanza otra.
- El reviewer trabaja en sólo lectura y devuelve evidencia independiente.
