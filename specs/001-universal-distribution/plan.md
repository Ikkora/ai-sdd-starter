# Plan — Spec 001

Estado: approved

## Enfoque

Crear fuentes canónicas de distribución separadas en `engine/` y `templates/install/`. Implementar un CLI CommonJS sin dependencias que construya un manifiesto completo en memoria, compare todos los destinos antes de escribir y aplique cambios sólo si no hay conflictos o si se indicó `--force`.

## Arquitectura y áreas afectadas

- `engine/`: skill, referencia normativa y definiciones de agentes, copiados sin cambios semánticos.
- `templates/install/`: archivos configurables y templates que el CLI materializa o copia.
- `cli/sdd.js`: parsing, planificación, aplicación, versión y doctor.
- `test/installer.test.js`: procesos CLI contra directorios temporales.
- raíz: metadata npm, documentación, changelog y configuración SDD para dogfooding.

## Persistencia y compatibilidad

El init sólo crea directorios y escribe destinos del manifiesto. Compara contenido exacto; los idénticos se omiten. La detección completa precede cualquier escritura. `--force` habilita reemplazo únicamente dentro del manifiesto.

## Seguridad y privacidad

Los templates serán genéricos. No hay red, ejecución de subprocesses del repositorio destino, descubrimiento de secretos ni borrado. El nombre se trata como texto de plantilla y no como ruta.

## Migración y rollback

La reorganización conserva los contenidos metodológicos en las nuevas fuentes y mantiene una instalación operativa en la raíz. Antes del commit, el rollback es descartar únicamente los cambios de este bloque; después, revertir el commit lógico.

## Estrategia de validación

Usar `node:test`, `assert`, `fs`, `os`, `path` y `child_process` estándar. Cada escenario A–I tiene un test aislado. Añadir checks de sintaxis, versión, doctor local, ausencia de dependencias y `git diff --check`.

## Riesgos y mitigaciones

- Arquitectura (STRICT): revisión inmediata de la separación y final independiente.
- Sobrescritura accidental: preflight total y prueba de conflicto sin escrituras parciales.
- Divergencia del motor: copia byte a byte y prueba con nombres/stacks distintos.
- Portabilidad: APIs Node multiplataforma y paths construidos con `path`.

## Trazabilidad RF → parte del plan

- RF-01, RF-10 → `engine/`, manifiesto y pruebas de invariancia.
- RF-02–RF-07 → `init` y pruebas A–F/I.
- RF-08 → `doctor` y pruebas G/H.
- RF-09 → metadata, `--version` y archivo de versión instalado.
- RF-11 → README.

## Decisiones humanas pendientes

Ninguna.
