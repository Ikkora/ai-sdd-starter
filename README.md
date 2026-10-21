# AI SDD Starter

Starter reutilizable para ejecutar cambios con Spec-Driven Development v2. Separa las reglas universales del motor de la configuración y el estado de cada repositorio.

## Jerarquía

1. `AGENTS.md`: entrada y enrutamiento.
2. `.agents/skills/sdd/SKILL.md`: protocolo operativo breve.
3. `.agents/skills/sdd/references/engine.md`: única fuente normativa detallada.
4. `.sdd/project.yaml`: configuración del repositorio.
5. `specs/<spec>/state.yaml`: estado preciso de ejecución.

## Instalación

1. Copia el contenido de este directorio a la raíz de un repositorio.
2. Renombra `AGENTS.template.md` a `AGENTS.md` o integra sólo su router en las reglas existentes.
3. Renombra `.sdd/project.template.yaml` a `.sdd/project.yaml` y completa comandos, servicios y riesgos.
4. Conserva `.sdd/state-template.yaml`; se copia como `state.yaml` al activar una spec.
5. Renombra `specs/README.template.md` a `specs/README.md` si el proyecto aún no tiene reglas para specs.
6. Copia `templates/constitution.template.md` a la ruta declarada en `project.yaml` y adáptala.
7. Prueba la entrada conceptual `sdd_run("objetivo")` o expresa el objetivo en lenguaje natural.

No copies secretos, rutas personales ni configuración de una máquina en los archivos versionados. Los comandos y servicios son opcionales: declara únicamente lo que exista en el repositorio.

## Adaptación mínima

- Define fuentes de verdad y reglas de dominio en `AGENTS.md` y la constitución.
- Configura stack, comandos, servicios, checkpoints, Git y categorías de riesgo en `.sdd/project.yaml`.
- Mantén el motor genérico. Si una diferencia pertenece a un solo proyecto, resuélvela en configuración o reglas del repositorio.
- Ajusta los agentes sólo cuando cambie su contrato, no para repetir detalles del stack.

## Uso

El coordinador siempre intenta reanudar antes de clasificar trabajo nuevo. Si no hay estado incompleto, el motor elige FAST, DEBUG, STANDARD o STRICT; genera los artefactos necesarios, ejecuta una tarea lista por invocación, valida proporcionalmente, revisa según riesgo y commitea por bloque lógico.

Consulta [PLAYBOOK.md](PLAYBOOK.md) para la operación diaria y [engine.md](.agents/skills/sdd/references/engine.md) para el contrato completo.
