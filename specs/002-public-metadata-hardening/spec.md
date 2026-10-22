# Spec 002 — Hardening público de metadata v1.0.1

Estado: approved

## Contexto y objetivo

Preparar localmente SDD Universal v1.0.1 como release menor exclusivamente documental y de metadata pública, corrigiendo el estado de publicación de v1.0.0 y agregando archivos comunitarios preventivos sin modificar motor, CLI, tests, templates ni comportamiento.

## Requisitos funcionales

- RF-01: El repositorio incluye una licencia MIT estándar completa, coherente con `package.json`, con `Ikkora` como titular derivado del propietario remoto del repositorio.
- RF-02: `SECURITY.md` ofrece una política práctica para la rama 1.x, prioriza GitHub Private Vulnerability Reporting, no deriva reportes sensibles a Issues públicos y no inventa canales privados.
- RF-03: `.gitignore` cubre dependencias, logs, env, cobertura, builds y temporales comunes sin ignorar infraestructura SDD versionada.
- RF-04: README refleja que v1.0.0, su tag/release y el Template Repository ya están publicados, y presenta v1.0.1 sólo como hardening de metadata/documentación.
- RF-05: CHANGELOG conserva la historia de 1.0.0 salvo corregir su estado objetivo de publicación y agrega 1.0.1 con fecha 2026-10-21 sin alegar cambios funcionales.
- RF-06: El diff de producto se limita a `LICENSE`, `SECURITY.md`, `.gitignore`, `README.md` y `CHANGELOG.md`; motor, CLI, tests, templates, agentes y skill permanecen idénticos.

## Requisitos no funcionales

- RNF-01: No introducir secretos, emails inventados ni rutas personales.
- RNF-02: Mantener verdes 9/9 tests, check de sintaxis, doctor y diff-check.
- RNF-03: No publicar npm, no hacer push y no mover/recrear `v1.0.0`.

## Casos límite

- Private Vulnerability Reporting puede no estar habilitado; la política no debe inventar una alternativa privada.
- `.env.example` debe permanecer versionable aunque `.env.*` sea ignorado.
- La versión funcional del CLI sigue siendo 1.0.0 porque `package.json` y el CLI están fuera de alcance; v1.0.1 identifica este hardening del repositorio.

## Fuera de alcance

- Cambios en `engine/`, `cli/`, `test/`, `templates/install/`, agentes, skill o package metadata.
- Cambios de comportamiento de `init`, `doctor` o `--version`.
- Publicación de release/npm, push de commits o tags y configuración de rulesets.

## Criterios de finalización

- Requisitos y validaciones con evidencia.
- Reviewer independiente final aprobado.
- Commit único `chore: harden public repository metadata`.
- Árbol limpio y tag local nuevo `v1.0.1` apuntando al commit aprobado, sin alterar `v1.0.0` ni hacer push.

## Decisiones humanas pendientes

Ninguna.
