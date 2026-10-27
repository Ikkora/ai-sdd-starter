# Decisiones: Spec 004

Estado: accepted

## D-01: Mapa abierto para stack y capabilities

Decisión: `stack` y `capabilities` aceptan claves personalizadas. Sólo se validan tipos y campos conocidos cuando existen.

Razón: una taxonomía cerrada acoplaría SDD a los stacks actuales y rompería el principio universal.

## D-02: Compatibilidad por ausencia explícita

Decisión: un proyecto legacy sin `security` conserva la semántica v1.1.x. Una instalación nueva recibe `security.profile: standard`.

Razón: activar controles nuevos silenciosamente en instalaciones existentes cambiaría comportamiento. Mantener `off` implícito como valor materializado también confundiría ausencia legacy con una elección del usuario.

## D-03: Flags no interactivos, wizard diferido

Decisión: v1.2.0 agrega `--security`, `--stack componente.campo=valor` y `--capability nombre=booleano`. No agrega wizard.

Razón: cubre automatización y una UX directa sin introducir prompts, TTY handling o rutas divergentes. La configuración manual sigue siendo completa.

## D-04: Evaluador, no segunda máquina de modos

Decisión: seguridad devuelve riesgo, triggers y modo recomendado. El Coordinator combina el resultado con la clasificación SDD existente.

Razón: evita dos autoridades sobre estado y reanudación.

## D-05: Manifests JSON sin DSL adicional

Decisión: baseline, perfiles y reglas usan JSON validado con selectores declarativos simples.

Razón: JSON se parsea con Node.js estándar, no ejecuta contenido y permite agregar rulesets sin clases, registries ni dependencias.

## D-06: Doctor valida configuración SDD

Decisión: doctor comprueba forma, perfiles y manifests. No lee código del producto para buscar vulnerabilidades.

Razón: mantiene el límite actual entre diagnóstico de infraestructura y Deep Review.

## D-07: Responsabilidades de seguridad separadas

Decisión: Baseline selecciona controles; Deep Review busca defectos técnicos; SDD Reviewer verifica cumplimiento y cierre.

Razón: evita findings duplicados y conserva una autoridad final clara.

## D-08: Fixtures inertes

Decisión: los escenarios inseguros se representan como datos o fragmentos que nunca se ejecutan.

Razón: permiten probar aplicabilidad sin introducir comportamiento peligroso ni aparentar un SAST.

## Decisiones humanas pendientes

Ninguna.
