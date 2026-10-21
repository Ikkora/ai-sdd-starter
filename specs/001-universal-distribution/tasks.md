# Tareas — Spec 001

- [x] **T01. Separar las fuentes canónicas del motor y los templates instalables.** RF-01, RF-02, RF-10
  - Depende de: ninguna.
  - Áreas previstas: `engine/`, `templates/install/`, archivos heredados.
  - Riesgo: architecture.
  - Checks focales: comparación de contenidos metodológicos y búsqueda de rutas personales/secretos obvios.
  - Hecho cuando: el motor y los artefactos configurables tienen ubicaciones canónicas distintas sin pérdida metodológica.
  - Bloque candidato: release-1.0.0.

- [x] **T02. Implementar `sdd init` seguro e idempotente.** RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-10
  - Depende de: T01.
  - Áreas previstas: `cli/sdd.js`, `package.json`.
  - Riesgo: destructive_operations, idempotency.
  - Checks focales: `node --check cli/sdd.js` y smokes manuales en temporal.
  - Hecho cuando: el preflight, dry-run, force y repetición cumplen el contrato sin tocar código ajeno.
  - Bloque candidato: release-1.0.0.

- [x] **T03. Implementar versión y doctor acotado a SDD.** RF-08, RF-09
  - Depende de: T01, T02.
  - Áreas previstas: `cli/sdd.js`, `package.json`, template de versión.
  - Riesgo: traceability.
  - Checks focales: `sdd --version`, doctor de instalación completa e incompleta.
  - Hecho cuando: versión 1.0.0 e infraestructura requerida se diagnostican con códigos correctos.
  - Bloque candidato: release-1.0.0.

- [x] **T04. Crear la suite aislada A–I del instalador.** RF-02–RF-10
  - Depende de: T02, T03.
  - Áreas previstas: `test/installer.test.js`.
  - Riesgo: regression, traceability.
  - Checks focales: `node --test test/installer.test.js`.
  - Hecho cuando: los nueve escenarios pedidos tienen assertions de contenido, salidas, códigos y no modificación.
  - Bloque candidato: release-1.0.0.

- [x] **T05. Documentar caminos de distribución y preparar release local.** RF-11, RNF-03
  - Depende de: T04.
  - Áreas previstas: `README.md`, `CHANGELOG.md`, metadata, artefactos SDD.
  - Riesgo: compatibility.
  - Checks focales: revisión documental, `npm pack --dry-run`, `git diff --check`.
  - Hecho cuando: GitHub Template y CLI están documentados, release 1.0.0 preparada y validación trazable completa.
  - Bloque candidato: release-1.0.0.

## Grafo

```text
T01 → T02 → T03 → T04 → T05
```

## Checkpoints

- 25%: separación canónica y revisión inmediata de arquitectura.
- 50%: init funcional con checks focales.
- 75%: doctor/version y suite A–I.
- 100%: suite completa, packaging, documentación y revisión final independiente.
