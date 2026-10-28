# SDD v2

Distribución universal de Spec-Driven Development v2. Mantiene el motor metodológico separado de la configuración de cada proyecto y ofrece dos caminos equivalentes de adopción: GitHub Template Repository o el CLI `sdd init`.

La versión estable actual es **SDD Universal v1.2.0**, publicada oficialmente en GitHub con su tag y GitHub Release. Incluye Stack Profiles abiertos, Security Baseline adaptativa, perfiles `off`, `standard` y `strict`, capabilities contextuales, reglas específicas por stack y riesgo adaptativo.

GitHub continúa siendo el canal oficial de distribución. npm todavía no fue publicado.

La revisión **1.1.1** corrige exclusivamente la documentación pública sobre ese estado de publicación. No modifica el motor, el CLI, los Quality Gates ni la versión funcional instalada. GitHub es el canal oficial de distribución; npm todavía no fue publicado.

La versión **1.0.1** continúa identificando exclusivamente el hardening de metadata, seguridad y documentación del repositorio sobre la versión funcional `1.0.0`; sus tags e historia permanecen inalterados.

## 📘 Manual para principiantes

¿Es tu primera vez usando SDD Universal?

Preparé una guía completa paso a paso pensada para personas sin experiencia previa con SDD:

👉 [**Manual SDD Universal v1.2.0 para principiantes**](docs/manuals/SDD-Universal-v1.2.0-Guia-Principiantes.pdf)

La guía explica de manera sencilla:

- qué es SDD Universal y para qué sirve;
- cómo instalarlo desde GitHub;
- cómo configurar el stack de un proyecto;
- cómo funcionan los perfiles de seguridad;
- cómo pedir cambios usando lenguaje natural;
- qué significan FAST, DEBUG, STANDARD y STRICT;
- cómo funciona RESUME FIRST;
- qué son los checkpoints;
- para qué sirven Anti-Slop y Deep Review;
- cómo interpretar los mensajes del Coordinator;
- cómo continuar después de una interrupción;
- problemas frecuentes y cómo resolverlos.

No hace falta ser desarrollador ni conocer previamente la metodología SDD.

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
sdd init --stack backend.language=php --stack database.engine=mysql
sdd init --capability authentication=true --security strict
```

Durante la validación local de esta distribución, el mismo binario puede invocarse sin instalarlo globalmente:

```console
node <ruta-a-la-distribucion>/cli/sdd.js init
```

`init` instala `AGENTS.md`, `.sdd/project.yaml`, el template de estado, la marca de versión, la constitución, los templates de specs, la skill, el motor, los manifests de seguridad y Quality Gates, la skill nativa `sdd-deep-review`, y los agentes planner, implementer y reviewer. **No instala Anti-Slop ni terceros.**

## Stack Profile y Security Profile

- `v1.2.0` es la versión estable actual. Está publicada en GitHub con su tag y el release `SDD Universal v1.2.0`. Incluye Stack Profiles, Security Baseline adaptativa y riesgo contextual. No fue publicada en npm.

`.sdd/project.yaml` declara contexto, no una lista cerrada de tecnologías. `stack` acepta componentes y propiedades personalizadas; `capabilities` acepta identificadores booleanos abiertos.

```yaml
stack:
  backend:
    language: "future-lang"
    framework: "custom-framework"
  storage:
    engine: "custom-db"
capabilities:
  authentication: true
  custom_workflow: false
security:
  profile: standard
```

Una instalación nueva crea `stack: {}`, `capabilities: {}` y `security.profile: standard`. Un proyecto legacy sin las secciones nuevas conserva el comportamiento v1.1.x; leerlo o ejecutar `doctor` no lo migra.

Perfiles de seguridad:

- `off` desactiva controles y elevación específicos de la Security Baseline.
- `standard` aplica controles `core` y `contextual` según el cambio.
- `strict` agrega controles `extended`, reduce el umbral de review y exige justificar excepciones.

Las capabilities seleccionan contexto y controles, pero no elevan el modo por sí solas. La elevación requiere una superficie de riesgo relevante para los tags del cambio. Los rulesets de stack agregan controles a la baseline y nunca la sustituyen. Un stack desconocido conserva la baseline universal sin producir un error.

La Security Baseline define controles, aplicabilidad y evidencia esperada. No es un SAST y no inspecciona el código del producto. El contrato normativo completo está en [`engine/skill/references/engine.md`](engine/skill/references/engine.md).

`security.profile` gobierna la baseline; `quality_gates` configura providers como Anti-Slop y Deep Review. Son contratos independientes.

## Comandos

### `sdd init`

Construye el manifiesto completo y comprueba todos los destinos antes de escribir.

```console
sdd init [--name <nombre>] [--security <off|standard|strict>] [--stack <componente.campo=valor>]... [--capability <nombre=true|false>]... [--dry-run] [--force]
```

- `--name <nombre>` personaliza únicamente los artefactos configurables. El nombre se trata como contenido, nunca como una ruta.
- `--stack <componente>.<campo>=<valor>` es repetible y trata el valor como contenido escalar.
- `--capability <nombre>=<true|false>` es repetible.
- `--security <off|standard|strict>` admite una sola aparición.
- `--dry-run` muestra el plan sin escribir. Si encuentra conflictos sin `--force`, devuelve código 1.
- `--force` reemplaza sólo archivos SDD declarados en el manifiesto. Nunca habilita el borrado o reemplazo de código ajeno.
- Sin `--force`, cualquier conflicto aborta antes de la primera escritura.
- Una instalación equivalente se clasifica como `UNCHANGED` y no reescribe archivos.

Los flags generan configuración y nunca ejecutan el stack. `init` sigue siendo no interactivo; v1.2.0 no incorpora un wizard.

### `sdd doctor`

```console
sdd doctor
```

En instalaciones v1.2.0 separa cuatro superficies:

1. **SDD Core:** infraestructura obligatoria de la versión instalada.
2. **Project Configuration:** forma de `stack`, `capabilities` y `security`.
3. **Security Policy:** presencia y esquema de baseline y rulesets instalados.
4. **Quality Gates:** Anti-Slop se detecta si está instalado y Deep Review se detecta mediante la skill distribuida.

Los checks core conservan:

- `AGENTS.md`;
- `.sdd/project.yaml`;
- `.sdd/state-template.yaml`;
- skill y motor;
- planner, implementer y reviewer;
- `specs`;
- `docs/constitution.md`.

Las instalaciones 1.1.0 agregan el contrato, los manifests y la skill Deep Review a los checks core; instalaciones 1.0.x conservan los 10 checks previos. Anti-Slop ausente en `off` o `auto` no hace fallar el doctor. La ausencia de la skill Deep Review indica una instalación incompleta. Un provider `required` no detectado deja la instalación unhealthy. Para tooling opcional sin ruta portable, `doctor` informa `NOT DETECTED` en vez de afirmar que no está instalado.

Devuelve código 0 para una instalación saludable y código 1 si falta o es inválido un componente core, la configuración, la política de seguridad o una integración requerida. `doctor` valida configuración e infraestructura SDD. No escanea código, busca vulnerabilidades ni diagnostica Node.js, PHP, Python, MySQL, servicios o infraestructura del producto.

### `sdd --version`

Muestra la versión del CLI:

```console
sdd --version
# 1.2.0
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

Anti-Slop actúa como filtro contextual para UI, UX, copy, documentación, accesibilidad y otros artefactos con riesgo real de patrones genéricos; no se activa mecánicamente sobre todo. Deep Review usa el Stack Profile, capabilities y controles aplicables para buscar defectos técnicos concretos introducidos por el diff. El SDD Reviewer decide cumplimiento de la spec, arquitectura, suficiencia de evidencia, excepciones y cierre. Ninguno reemplaza al otro.

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
- `engine/security/`: loader, baseline y rulesets declarativos de seguridad.
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

La suite usa sólo APIs estándar de Node.js y ejecuta instalaciones, configuración, policy y Quality Gates en escenarios aislados. Los fixtures de seguridad son datos inertes: prueban selección de controles, no detección SAST ni ejecución de payloads.

Consulta [PLAYBOOK.md](PLAYBOOK.md) para la operación diaria, [el motor](engine/skill/references/engine.md) para el contrato metodológico y [CHANGELOG.md](CHANGELOG.md) para los cambios de versión.

## Estado de publicación

- `v1.0.0` está publicada en GitHub con su tag y release, y el repositorio oficial está disponible como GitHub Template Repository. No fue publicada en npm.
- `v1.0.1` corresponde exclusivamente al hardening de metadata, seguridad y documentación del repositorio; no introduce cambios funcionales en el motor SDD v2 ni en el CLI.
- `v1.1.0` es la versión funcional estable. Está publicada en GitHub con su tag y el release `SDD Universal v1.1.0`; incluye Quality Gates y la skill nativa `sdd-deep-review`.
- `v1.1.1` es un parche exclusivamente documental que corrige el estado público de la versión 1.1.0. No contiene cambios funcionales.
- `v1.2.0` está preparada para revisión en este árbol. No tiene tag, GitHub Release ni publicación npm.
- GitHub es el canal oficial de distribución. Un tercero puede adoptar SDD mediante el GitHub Template Repository o el CLI local `sdd init`. npm todavía no fue publicado.
