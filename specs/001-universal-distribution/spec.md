# Spec 001 — Distribución universal oficial de SDD v2

Estado: approved

## Contexto y objetivo

Convertir este starter en la distribución universal oficial de SDD v2 sin cambiar la metodología validada, con fuentes claramente separadas y dos caminos de adopción equivalentes: GitHub Template Repository y CLI `sdd init`.

## Actores

- Mantenedor de la distribución.
- Equipo que adopta SDD en una carpeta vacía o un repositorio existente.
- Agente que ejecuta `sdd doctor` para comprobar la instalación.

## Definiciones

- **Archivo gestionado:** destino SDD declarado por el instalador; `--force` sólo puede reemplazar estos destinos.
- **Conflicto:** archivo gestionado existente cuyo contenido difiere del contenido que instalaría el CLI.
- **Instalación equivalente:** todos los archivos gestionados existen con el contenido esperado.

## Requisitos funcionales

- RF-01: CUANDO se inspeccione el repositorio, EL SISTEMA separa claramente motor, templates instalables, CLI y pruebas del instalador, conservando intacto el contrato metodológico SDD v2.
- RF-02: CUANDO se ejecute `sdd init` en una carpeta vacía o repositorio existente sin conflictos, EL SISTEMA instala AGENTS, configuración y versión SDD, constitución, templates de estado/spec, skill, motor y agentes sin borrar código ni ejecutar comandos del producto.
- RF-03: CUANDO se use `sdd init --name <nombre>`, EL SISTEMA personaliza únicamente los artefactos configurables del proyecto sin modificar el motor.
- RF-04: CUANDO cualquier destino gestionado tenga contenido diferente y no se use `--force`, EL SISTEMA detecta todos los conflictos antes de escribir y termina sin modificar el destino.
- RF-05: CUANDO se use `sdd init --dry-run`, EL SISTEMA informa el plan y no escribe archivos.
- RF-06: CUANDO se use `sdd init --force`, EL SISTEMA reemplaza explícitamente sólo archivos SDD gestionados en conflicto y conserva el resto del proyecto.
- RF-07: CUANDO se repita `sdd init` sobre una instalación equivalente, EL SISTEMA es idempotente y no reescribe archivos.
- RF-08: CUANDO se ejecute `sdd doctor`, EL SISTEMA valida exclusivamente AGENTS.md, project.yaml, state template, skill, engine, planner, implementer, reviewer, specs y constitution, con salida y código de proceso útiles.
- RF-09: CUANDO se ejecute `sdd --version`, EL SISTEMA muestra `1.0.0`, y esa misma versión queda identificable dentro de cada instalación.
- RF-10: CUANDO se pruebe la distribución con nombres o stacks de repositorio distintos, EL SISTEMA conserva bytes idénticos del motor.
- RF-11: CUANDO un usuario lea la documentación, EL SISTEMA explica tanto GitHub Template Repository como `sdd init`, sin hacer obligatorio el CLI.

## Requisitos no funcionales

- RNF-01: CLI implementado con APIs estándar de Node.js y cero dependencias externas.
- RNF-02: Ningún template contiene secretos, rutas personales o supuestos de stack.
- RNF-03: La release local 1.0.0 queda preparada, sin publicación en GitHub/npm y sin tag.

## Casos límite

- Argumento desconocido, `--name` ausente o comando desconocido devuelve error de uso sin escribir.
- Un destino puede contener código arbitrario ajeno a SDD y debe quedar intacto incluso con `--force`.
- Un archivo ya idéntico se clasifica como sin cambios, no como conflicto.

## Fuera de alcance

- Publicar en GitHub o npm.
- Crear tags.
- Diagnosticar runtimes, bases de datos, servicios o infraestructura del producto.
- Ejecutar setup, tests o comandos del stack del repositorio destino.

## Criterios de finalización

- Los escenarios A–I solicitados pasan en directorios temporales aislados.
- La revisión final independiente devuelve `VEREDICTO: APROBADO`.
- README, CHANGELOG y metadata de release reflejan 1.0.0.
- Existe un commit lógico final y `git status` queda limpio.

## Decisiones humanas pendientes

Ninguna.
