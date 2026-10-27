# Spec 004: Stack Profiles y seguridad adaptativa

Estado: approved

Modo: STRICT

Motivo de elevación: el cambio modifica arquitectura, configuración, seguridad, compatibilidad, idempotencia, CLI, estado persistente y responsabilidades de revisión.

## Contexto y objetivo

SDD Universal v1.2.0 debe comprender el contexto tecnológico declarado por cada proyecto y seleccionar controles de seguridad proporcionales sin acoplar el motor a un lenguaje, framework o tipo de aplicación.

El resultado combina un motor universal con configuración específica del proyecto. Las instalaciones nuevas reciben una política segura por defecto. Las instalaciones SDD 1.0.x y 1.1.x que no declaran las nuevas secciones conservan su comportamiento.

## Actores

- La persona usuaria declara stack, capacidades y perfil de seguridad.
- El Coordinator clasifica el trabajo, combina la recomendación de riesgo con el modo SDD y persiste el estado.
- El Planner incorpora controles aplicables antes de implementar.
- El Implementer recibe reglas aplicables y produce evidencia focal.
- Deep Review busca defectos técnicos concretos introducidos por el diff.
- El SDD Reviewer verifica spec, arquitectura, trazabilidad, evidencia, excepciones y cierre.

## Definiciones

- Stack Profile: mapa abierto de componentes y propiedades tecnológicas declaradas por el proyecto.
- Capability: comportamiento o superficie del sistema expresada como un identificador abierto con valor booleano.
- Security Profile: nivel `off`, `standard` o `strict` que modifica política, aplicabilidad y validación.
- Security Baseline: catálogo universal de controles con condiciones de aplicabilidad, riesgo, evidencia y recomendación.
- Stack rule: regla declarativa adicional que aplica cuando el stack coincide, sin sustituir la baseline.
- Riesgo adaptativo: evaluación que puede recomendar un modo más exigente y explica sus triggers.

## Requisitos funcionales

- RF-01: CUANDO se cree una instalación nueva, EL SISTEMA materializa `stack`, `capabilities` y `security.profile: standard` sin inventar tecnologías ni capacidades.
- RF-02: CUANDO se declaren componentes, tecnologías, propiedades o capacidades personalizadas, EL SISTEMA las acepta sin enums cerrados de stack.
- RF-03: CUANDO un proyecto 1.0.x o 1.1.x no contenga las nuevas secciones, EL SISTEMA conserva el comportamiento anterior sin activar seguridad v1.2.0 implícitamente.
- RF-04: CUANDO un proyecto use los escalares legacy `stack.application`, `stack.runtime`, `stack.database` o `stack.frontend`, EL SISTEMA los acepta sin exigir migración.
- RF-05: CUANDO se lea configuración, EL SISTEMA no ejecuta contenido, tags, referencias, comandos ni accesos fuera del archivo declarado.
- RF-06: CUANDO se ejecute `sdd init` sin flags nuevos, EL SISTEMA mantiene su contrato no interactivo.
- RF-07: CUANDO se usen `--security`, `--stack` o `--capability`, EL SISTEMA valida forma, duplicados, booleanos y perfiles antes de escribir.
- RF-08: CUANDO se combinen flags nuevos con `--dry-run` o `--force`, EL SISTEMA conserva preflight completo, idempotencia y sobrescritura limitada a destinos gestionados.
- RF-09: CUANDO se cargue la Security Baseline, EL SISTEMA cubre todos los dominios de la sección `Cobertura normativa de la baseline` y cada control declara aplicabilidad, riesgo, evidencia y recomendación.
- RF-10: CUANDO se evalúen `off`, `standard` y `strict`, EL SISTEMA produce políticas distintas y comprobables.
- RF-11: CUANDO se evalúe seguridad, EL SISTEMA combina perfil, capacidades, stack y tags del cambio.
- RF-12: CUANDO una superficie aplicable alcance riesgo alto o crítico según la política, EL SISTEMA recomienda una elevación explicable y persistible.
- RF-13: CUANDO no exista riesgo aplicable, EL SISTEMA no eleva el modo.
- RF-14: CUANDO el stack incluya PHP, JavaScript o Node.js, o Python, EL SISTEMA carga reglas declarativas específicas.
- RF-15: CUANDO el lenguaje sea desconocido o personalizado, EL SISTEMA conserva la baseline universal y no falla por ausencia de reglas específicas.
- RF-16: CUANDO se agregue un ruleset válido, EL SISTEMA puede descubrirlo sin modificar el resolver central.
- RF-17: CUANDO actúen Planner, Implementer, Deep Review y SDD Reviewer, CADA ACTOR recibe responsabilidades diferenciadas; Deep Review consume Stack Profile, capabilities, baseline y reglas específicas aplicables sin asumir autoridad de cierre.
- RF-18: CUANDO una spec evalúe seguridad, EL ESTADO conserva perfil, aplicabilidad, riesgo, triggers, modo efectivo y estado de evidencia sin ruido innecesario.
- RF-19: CUANDO se ejecute `sdd doctor`, EL SISTEMA valida forma del Stack Profile, capabilities, Security Profile, manifests requeridos e inconsistencias obvias.
- RF-20: CUANDO `doctor` valide v1.2.0, EL SISTEMA no inspecciona código del producto ni afirma realizar SAST.
- RF-21: CUANDO `init` distribuya fuentes canónicas, LAS COPIAS instaladas correspondientes son byte-identical.
- RF-22: CUANDO se prepare v1.2.0, EL PAQUETE no incorpora dependencias npm de runtime.
- RF-23: CUANDO se representen patrones inseguros en pruebas, LOS FIXTURES son inertes, aislados y nunca se ejecutan.
- RF-24: CUANDO se valide v1.2.0, LA SUITE cubre stack, perfiles, riesgo adaptativo, reglas, doctor, flags, idempotencia y compatibilidad legacy.
- RF-25: CUANDO terceros lean la documentación, PUEDEN distinguir Stack Profile, capabilities, Security Profile, Quality Gates, Deep Review y SDD Reviewer.
- RF-26: CUANDO la implementación procese paths, strings o configuración controlados por usuarios, EL SISTEMA conserva las garantías de traversal, preflight y overwrite seguro.
- RF-27: DURANTE esta spec, EL PROCESO no crea tag v1.2.0, GitHub Release ni publicación npm.

## Requisitos no funcionales

- El runtime continúa sin dependencias npm.
- La política es determinista, explicable y extensible mediante datos declarativos.
- El parser se limita al subconjunto de configuración SDD necesario y falla con diagnósticos útiles ante sintaxis no soportada.
- `strict` cambia controles o umbrales; no significa más texto.
- La baseline no se presenta como scanner ni como detección exhaustiva de vulnerabilidades.
- Anti-Slop se aplica durante decisiones de arquitectura, naming, límites de responsabilidad y documentación, no tras cada microtarea.

## Cobertura normativa de la baseline

T01 debe representar de forma verificable estos dominios, separándolos cuando su aplicabilidad o evidencia difieran:

1. secrets y credenciales;
2. autenticación;
3. autorización y mínimo privilegio;
4. validación de inputs;
5. output encoding;
6. injection, incluida SQL injection y command injection;
7. XSS;
8. CSRF cuando aplique;
9. SSRF cuando aplique;
10. path traversal;
11. file uploads;
12. acceso a filesystem;
13. sesiones, cookies y tokens;
14. APIs y CORS;
15. datos personales y sensibles;
16. logging seguro;
17. manejo de errores y condiciones excepcionales;
18. dependencias y supply chain;
19. deserialización;
20. operaciones destructivas;
21. migraciones y pérdida de datos;
22. concurrencia y transacciones cuando aplique;
23. criptografía;
24. configuración insegura;
25. exposición accidental de información.

El test de cobertura de manifests debe demostrar que cada dominio tiene al menos un control trazable. Esta lista define cobertura, no aplicabilidad universal.

## Quality Gates aplicables

- Anti-Slop: arquitectura, documentación, naming y límites de responsabilidad durante T01, T04 y T10; auditoría formal al cierre.
- Deep Review: revisión formal del working tree completo después de T12, guiada por stack, capacidades y reglas aplicables.
- Findings consolidados en una ronda normal de corrección y un re-check focal.
- SDD Reviewer inmediato en arquitectura y seguridad, más Reviewer final independiente.

## Casos límite

- Stack ausente, vacío, legacy, multinivel o con nombres personalizados.
- Componente personalizado y lenguaje desconocido.
- Capability personalizada, falsa, verdadera o con valor inválido.
- Security Profile ausente en legacy, inválido, `off`, `standard` o `strict`.
- Cambio sin riesgo, un trigger crítico o múltiples triggers.
- Flags repetidos, mal formados o combinados con conflictos de archivos.
- Manifests faltantes, duplicados o con referencias inválidas.

## Fuera de alcance

- Wizard interactivo en v1.2.0.
- SAST completo, scanners comerciales o ejecución de payloads.
- Instalación de tooling externo.
- Imposición de un lenguaje o framework.
- Publicación npm, tag v1.2.0 o GitHub Release.
- Cambios o reescritura de tags históricos.

## Criterios de finalización

- RF-01 a RF-27 tienen evidencia trazable.
- Checkpoints STRICT 25, 50, 75 y 100 están aprobados.
- Tests focales y suite completa pasan.
- `doctor`, packaging, hashes canónicos, scans de seguridad y diff-check pasan.
- Quality Gates aplicables completan su ronda y re-check.
- SDD Reviewer final aprueba y el árbol queda limpio tras commits lógicos.

## Decisiones humanas pendientes

Ninguna.
