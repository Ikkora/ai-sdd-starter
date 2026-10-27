# SDD v2

Distribución universal de Spec-Driven Development v2. Mantiene el motor metodológico separado de la configuración de cada proyecto y ofrece dos caminos equivalentes de adopción: GitHub Template Repository o el CLI `sdd init`.

La próxima versión funcional preparada es **1.1.0**. Agrega Quality Gates sin hacer depender el core de servicios externos. Anti-Slop conserva su integración opcional y Deep Review aporta una revisión técnica nativa de Codex. Ambos smokes reales, la única ronda de corrección, los re-checks y la validación amplia están completos; resta el review final y los commits. Aún no existe tag, release ni publicación npm de `v1.1.0`.

La versión **1.0.1** continúa identificando exclusivamente el hardening de metadata, seguridad y documentación del repositorio sobre la versión funcional `1.0.0`; sus tags e historia permanecen inalterados.

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

`init` instala `AGENTS.md`, `.sdd/project.yaml`, el template de estado, la marca de versión, la constitución, los templates de specs, la skill, el motor, el contrato y manifests de Quality Gates, la skill nativa `sdd-deep-review`, y los agentes planner, implementer y reviewer. **No instala Anti-Slop ni terceros.**

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

Separa dos superficies:

1. **SDD Core:** infraestructura obligatoria de la versión instalada.
2. **Quality Gates:** Anti-Slop se detecta si está instalado y Deep Review se detecta mediante la skill distribuida.

Los checks core conservan:

- `AGENTS.md`;
- `.sdd/project.yaml`;
- `.sdd/state-template.yaml`;
- skill y motor;
- planner, implementer y reviewer;
- `specs`;
- `docs/constitution.md`.

Las instalaciones 1.1.0 agregan el contrato, los manifests y la skill Deep Review a los checks core; instalaciones 1.0.x conservan los 10 checks previos. Anti-Slop ausente en `off` o `auto` no hace fallar el doctor. La ausencia de la skill Deep Review indica una instalación incompleta. Un provider `required` no detectado deja la instalación unhealthy. Para tooling opcional sin ruta portable, `doctor` informa `NOT DETECTED` en vez de afirmar que no está instalado.

Devuelve código 0 para una instalación saludable y código 1 si falta o es inválido un componente core o una integración requerida. No diagnostica Node.js, PHP, Python, MySQL, servicios ni infraestructura del producto.

### `sdd --version`

Muestra la versión del CLI:

```console
sdd --version
# 1.1.0
```

Cada instalación conserva la misma identificación en `.sdd/version`.

## Quality Gates

Las instalaciones nuevas configuran Anti-Slop y Deep Review en `auto`. Si la sección no existe, todos los providers se comportan como `off`, preservando proyectos SDD 1.0.x.

```yaml
quality_gates:
  anti_slop:
    mode: auto
  deep_review:
    mode: auto
    run_on: [STANDARD, STRICT]
```

Modos:

- `off`: nunca usar el provider.
- `auto`: usar sólo si aplica y está disponible; si falta, registrar `not_available` y continuar.
- `required`: si aplica y falta, persistir `await_human_setup:<provider>`.

Anti-Slop actúa como filtro contextual para UI, UX, copy, documentación, accesibilidad y otros artefactos con riesgo real de patrones genéricos; no se activa mecánicamente sobre todo. Deep Review usa la skill local `sdd-deep-review` para revisar corrección, seguridad, regresiones y mantenibilidad técnica. No reemplaza al SDD Reviewer.

SDD normaliza y deduplica findings, realiza una sola ronda normal de corrección, ejecuta un re-check focal y luego conserva el SDD Reviewer final. Sólo un hallazgo crítico elegible de seguridad, corrupción de datos o equivalente puede romper ese límite.

El contrato completo está en [`engine/skill/references/quality-gates.md`](engine/skill/references/quality-gates.md).

## Garantías del instalador

- No borra archivos ni código del proyecto.
- No sobrescribe destinos existentes por defecto.
- Detecta todos los conflictos antes de escribir.
- `--force` está limitado a destinos SDD gestionados.
- No ejecuta comandos, tests ni setup del stack del repositorio destino.
- No instala herramientas externas.
- No asume lenguaje, framework, base de datos o frontend.
- No incorpora secretos ni rutas personales.
- Copia el motor y los adapters byte a byte; nombres y stacks distintos no los modifican.
- Es idempotente cuando la instalación ya es equivalente.

## Estructura de la distribución

- `engine/quality-gates/`: runtime de policy y manifests declarativos de providers.
- `engine/skills/`: skills nativas que distribuye SDD.
- `engine/skill/`: skill y contratos normativos.
- `engine/agents/`: definiciones canónicas de planner, implementer y reviewer.
- `templates/install/`: artefactos configurables que materializa `init`.
- `cli/sdd.js`: CLI Node.js sin dependencias externas.
- `test/`: suite aislada del instalador y Quality Gates.
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
node cli/sdd.js doctor
npm pack --dry-run
```

La suite usa sólo APIs estándar de Node.js y ejecuta cada escenario en un directorio temporal aislado. La validación simulada actual contiene **30 tests verdes**: 9 del instalador y 21 de Quality Gates, incluidas las regresiones RF-10 y de detección sin `availability_env`. Ambos smokes reales están preservados; la ronda consolidada y los re-checks focales de sus tres findings están completos.

Consulta [PLAYBOOK.md](PLAYBOOK.md) para la operación diaria, [el motor](engine/skill/references/engine.md) para el contrato metodológico y [CHANGELOG.md](CHANGELOG.md) para los cambios de versión.

## Estado de publicación

- `v1.0.0` está publicada en GitHub con su tag y release, y el repositorio oficial está disponible como GitHub Template Repository. No fue publicada en npm.
- `v1.0.1` corresponde exclusivamente al hardening de metadata, seguridad y documentación del repositorio; no introduce cambios funcionales en el motor SDD v2 ni en el CLI.
- `v1.1.0` está preparada en código y documentación, pero permanece en integración hasta completar el review independiente y los commits. **No existe tag, release ni publicación npm de 1.1.0 y no deben crearse sin aprobación humana explícita.**
