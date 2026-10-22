# SDD v2

Distribución universal de Spec-Driven Development v2. Mantiene el motor metodológico separado de la configuración de cada proyecto y ofrece dos caminos equivalentes de adopción: GitHub Template Repository o el CLI `sdd init`.

La versión funcional actual del CLI sigue siendo **1.0.0**. La versión
**1.0.1** identifica únicamente el hardening de metadata y documentación del
repositorio, sin cambios funcionales en el motor SDD v2 ni en el CLI.

## Elegir un camino de instalación

### A. GitHub Template Repository

Este camino no requiere Node.js ni el CLI:

1. En GitHub, usa **Use this template** sobre el repositorio oficial.
2. Crea y clona el nuevo repositorio.
3. Ajusta el nombre, las fuentes de verdad y los comandos reales en `.sdd/project.yaml`.
4. Adapta `AGENTS.md` y `docs/constitution.md` a las reglas del proyecto.
5. Conserva el motor genérico y los templates SDD sin introducir secretos ni rutas personales.

El repositorio resultante puede utilizar SDD v2 directamente mediante lenguaje natural o la entrada conceptual `sdd_run(goal)`. El CLI es opcional.

### B. CLI `sdd init`

El CLI requiere Node.js 18 o posterior y no tiene dependencias npm de runtime. Ejecútalo desde la raíz de una carpeta vacía o de un repositorio existente:

```console
sdd init
sdd init --name "Mi proyecto"
```

Durante la validación local de esta distribución, el mismo binario puede invocarse sin instalarlo globalmente:

```console
node <ruta-a-la-distribucion>/cli/sdd.js init
```

`init` instala `AGENTS.md`, `.sdd/project.yaml`, el template de estado, la marca de versión, la constitución, los templates de specs, la skill, el motor y los agentes planner, implementer y reviewer.

## Comandos

### `sdd init`

Construye el manifiesto completo y comprueba todos los destinos antes de escribir.

```console
sdd init [--name <nombre>] [--dry-run] [--force]
```

- `--name <nombre>` personaliza únicamente los artefactos configurables. El nombre se trata como contenido, nunca como una ruta.
- `--dry-run` muestra el plan sin escribir. Si encuentra conflictos sin `--force`, devuelve código 1.
- `--force` reemplaza sólo archivos SDD declarados en el manifiesto. Nunca habilita el borrado o reemplazo de código ajeno.
- Sin `--force`, cualquier conflicto aborta antes de la primera escritura.
- Una instalación equivalente se clasifica como `UNCHANGED` y no reescribe archivos.

### `sdd doctor`

```console
sdd doctor
```

Comprueba exclusivamente la infraestructura SDD instalada:

- `AGENTS.md`;
- `.sdd/project.yaml`;
- `.sdd/state-template.yaml`;
- skill y motor;
- planner, implementer y reviewer;
- `specs`;
- `docs/constitution.md`.

Devuelve código 0 para una instalación completa y código 1 si falta o es inválido algún componente. No diagnostica Node.js, PHP, Python, MySQL, servicios ni infraestructura del producto.

### `sdd --version`

Muestra la versión del CLI:

```console
sdd --version
# 1.0.0
```

Cada instalación conserva la misma identificación en `.sdd/version`.

## Garantías del instalador

- No borra archivos ni código del proyecto.
- No sobrescribe destinos existentes por defecto.
- Detecta todos los conflictos antes de escribir.
- `--force` está limitado a destinos SDD gestionados.
- No ejecuta comandos, tests ni setup del stack del repositorio destino.
- No asume lenguaje, framework, base de datos o frontend.
- No incorpora secretos ni rutas personales.
- Copia el motor byte a byte; nombres y stacks distintos no lo modifican.
- Es idempotente cuando la instalación ya es equivalente.

## Estructura de la distribución

- `engine/`: skill, motor normativo y definiciones canónicas de agentes.
- `templates/install/`: artefactos configurables que materializa `init`.
- `cli/sdd.js`: CLI Node.js sin dependencias externas.
- `test/installer.test.js`: suite aislada A–I del instalador.
- `specs/`: artefactos y estado de los cambios desarrollados mediante SDD.

La jerarquía instalada es:

1. `AGENTS.md`: entrada y reglas del repositorio.
2. `.agents/skills/sdd/SKILL.md`: protocolo operativo breve.
3. `.agents/skills/sdd/references/engine.md`: fuente normativa detallada.
4. `.sdd/project.yaml`: configuración específica del proyecto.
5. `specs/<spec>/state.yaml`: estado preciso de cada ejecución.

## Desarrollo y validación local

```console
npm test
npm run check
npm pack --dry-run
```

La suite usa sólo APIs estándar de Node.js y ejecuta cada escenario en un directorio temporal aislado.

Consulta [PLAYBOOK.md](PLAYBOOK.md) para la operación diaria, [el motor](engine/skill/references/engine.md) para el contrato metodológico y [CHANGELOG.md](CHANGELOG.md) para los cambios de versión.

## Estado de publicación

La versión `1.0.0` está publicada en GitHub con su tag y release, y el
repositorio oficial está disponible como GitHub Template Repository. No fue
publicada en npm.

La versión `1.0.1` corresponde exclusivamente al hardening de metadata y
documentación del repositorio; no introduce cambios funcionales en el motor
SDD v2 ni en el CLI.
