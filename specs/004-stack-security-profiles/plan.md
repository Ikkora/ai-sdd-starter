# Plan: Spec 004

Estado: approved

## Enfoque

Agregar dos piezas pequeñas al motor: un lector acotado de configuración SDD y un evaluador de seguridad basado en manifests JSON. El evaluador devuelve controles, riesgo y una recomendación de modo. El Coordinator combina esa recomendación con la clasificación SDD existente usando el modo más exigente.

La implementación no crea un framework de adapters, una segunda máquina de estados ni un scanner de código.

## Arquitectura y áreas afectadas

```text
engine/
  project-config/
    index.js
  security/
    index.js
    policy.json
    baseline.json
    stack-rules/
      php.json
      javascript-node.json
      python.json
```

- `engine/project-config/index.js`: lee y valida sólo el subconjunto declarativo necesario de `.sdd/project.yaml`. Normaliza la forma legacy y la nueva sin ejecutar YAML.
- `engine/security/index.js`: carga manifests, selecciona reglas, calcula riesgo y explica la recomendación. No lee código ni ejecuta comandos.
- `policy.json`: define diferencias entre `off`, `standard` y `strict`, superficies críticas y umbrales.
- `baseline.json`: contiene controles universales.
- `stack-rules/*.json`: contiene selectores y reglas por tecnología. El loader descubre archivos válidos.

Un control declara `id`, `title`, `category`, `applies_when`, `risk`, `evidence` y `recommendation`. `applies_when` usa datos declarativos sobre capabilities, stack y tags del cambio.

## Contrato de configuración

`stack` es un mapa abierto de componentes. Cada componente nuevo es un mapa abierto cuyos valores son escalares o `null`, con campos conocidos como `language`, `version`, `framework`, `engine` o `runtime`. Doctor valida tipos conocidos y permite propiedades futuras en ese nivel. Los mapas anidados y las secuencias quedan fuera del subconjunto v1.2.0 y producen un diagnóstico explícito. La forma legacy escalar continúa válida.

`capabilities` es un mapa abierto de identificadores a booleanos. La ausencia no equivale a `false`.

`security.profile` admite `off`, `standard` y `strict`:

- `off`: no selecciona controles v1.2.0 ni eleva el modo.
- `standard`: aplica baseline proporcional y eleva sólo ante riesgo alto o crítico aplicable.
- `strict`: amplía controles o reduce umbrales para superficies de seguridad, sin elevar cambios no aplicables.

La ausencia de `security` en legacy conserva la semántica v1.1.x.

## UX de configuración

La edición manual de `.sdd/project.yaml` es la vía completa y fuente de verdad. `init` agrega flags no interactivos:

```console
sdd init --security standard
sdd init --stack backend.language=php --stack backend.version=8.3
sdd init --stack database.engine=mysql --capability authentication=true
```

- `--stack <componente>.<campo>=<valor>` es repetible y acepta nombres personalizados.
- `--capability <nombre>=<true|false>` es repetible.
- `--security <off|standard|strict>` admite una sola aparición.
- Los flags sólo generan configuración; no ejecutan comandos ni inspeccionan el stack.
- `sdd init` permanece no interactivo. El wizard queda fuera de alcance.

## Persistencia y compatibilidad

Estados nuevos agregan `security` sólo cuando el proyecto configura un perfil o la spec evalúa seguridad. Conservan perfil, aplicabilidad, riesgo, triggers, reglas, modo base y efectivo, razón y estado de evidencia.

Estados legacy permanecen válidos sin la sección. Proyectos legacy sin `security` no reciben `standard` implícito. Las nuevas instalaciones reciben `standard`.

Los escalares legacy bajo `stack` siguen aceptados. La normalización no reescribe automáticamente el archivo del usuario.

## Seguridad y privacidad

- Rechazar sintaxis ejecutable, tags, referencias y estructuras fuera del subconjunto admitido.
- Tratar nombres y valores de flags como contenido, nunca como paths o comandos.
- Mantener preflight completo y escrituras sólo en el manifiesto gestionado.
- Cargar manifests sólo desde rutas canónicas internas y validar esquema e IDs duplicados.
- No persistir secretos ni valores sensibles detectados en el stack.
- Mantener fixtures de patrones inseguros como datos inertes.

## Límites de responsabilidad

- Security Baseline selecciona controles, riesgo y evidencia esperada.
- Planner convierte controles aplicables en requisitos y tareas.
- Implementer conoce las reglas antes de editar y devuelve evidencia focal.
- Deep Review comprueba defectos técnicos concretos introducidos por el diff.
- SDD Reviewer comprueba cumplimiento, arquitectura, trazabilidad, excepciones y cierre.
- Doctor valida configuración e infraestructura SDD, no vulnerabilidades del producto.
- Anti-Slop controla complejidad accidental, naming y documentación, no seguridad técnica.

## Quality Gates y providers externos

Anti-Slop actúa DURING en decisiones de T01, T04 y T10. La ejecución formal de Anti-Slop y Deep Review ocurre al 100%, antes de una ronda consolidada y un re-check focal. El SDD Reviewer final conserva autoridad de cierre.

## Migración y rollback

No hay migración destructiva. Rollback lógico: revertir los commits de los bloques v1.2.0. Los proyectos legacy continúan usando su configuración sin nuevas secciones. No se modifican tags históricos.

## Estrategia de validación

- Checks focales por tarea.
- Reviews inmediatos en arquitectura y seguridad.
- Checkpoints STRICT al 25, 50, 75 y 100 por incremento.
- Suite completa sólo al 100%, salvo evidencia concreta que obligue a repetirla.
- Validar package sin publicar, hashes canónicos, doctor local y legacy, scans de paths/secretos, tags y diff.

## Riesgos y mitigaciones

- Parser demasiado general: limitarlo al contrato SDD y rechazar sintaxis no soportada.
- Doble clasificación: el evaluador recomienda; el Coordinator decide con la máquina existente.
- Sobrearquitectura: usar dos módulos y manifests JSON, sin clases, registries ni DSL adicional.
- Reglas hardcodeadas: descubrir rulesets declarativos.
- Elevación excesiva: exigir aplicabilidad y umbral verificable.
- Falsa confianza: documentar que los tests prueban selección de controles, no detección exhaustiva.
- Duplicación de review: mantener límites explícitos y una única fuente normativa por concepto.

## Trazabilidad RF a partes del plan

- Configuración y compatibilidad: RF-01 a RF-08.
- Baseline, perfiles y riesgo: RF-09 a RF-16.
- Actores y estado: RF-17 y RF-18.
- Doctor y distribución: RF-19 a RF-22.
- Pruebas y documentación: RF-23 a RF-26.
- Límites de release: RF-27.

## Decisiones humanas pendientes

Ninguna.
