# Reglas del repositorio SDD v2

## Fuentes de verdad

1. Constitución: `docs/constitution.md`.
2. Spec activa y su `state.yaml`.
3. `.sdd/project.yaml`.
4. Motor canónico en `engine/`.
5. Código y pruebas reales.

Si discrepan de una forma que cambia comportamiento, seguridad, compatibilidad o arquitectura, investigar y solicitar la decisión humana necesaria.

## Entrada SDD

Toda intención entra por `sdd_run(goal)` o lenguaje natural y aplica **RESUME FIRST**. La skill instalada en `.agents/skills/sdd/SKILL.md` contiene el protocolo breve, `references/engine.md` contiene el contrato detallado y `references/quality-gates.md` define providers externos opcionales. Las fuentes de distribución viven en `engine/` y `templates/install/`.

## Reglas locales

- Preservar sin cambios semánticos la metodología SDD v2 validada.
- El CLI no puede borrar código, asumir un stack ni ejecutar comandos del producto.
- No se versionan secretos ni rutas personales.
- El paquete no incorpora dependencias npm de runtime.
- `stack` y `capabilities` permanecen abiertos; no introducir enums de tecnologías ni capacidades en el core.
- La Security Baseline y sus rulesets son declarativos. Los rulesets agregan controles y un stack desconocido conserva la baseline universal.
- `doctor` valida configuración e infraestructura SDD; no escanea el producto ni reemplaza Deep Review.
- Integraciones externas son opcionales salvo configuración explícita `required`.
- Cada cambio del instalador o del doctor debe quedar cubierto por pruebas aisladas.

## Agentes

- El coordinador controla estado, aprobaciones, bloques, Quality Gates y commits.
- El planner propone artefactos y grafo; no implementa.
- El implementer ejecuta una tarea lista; no hace commit ni avanza otra.
- El reviewer trabaja en sólo lectura y devuelve evidencia independiente.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.codex/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.codex/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.codex/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.codex/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.codex/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.codex/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
