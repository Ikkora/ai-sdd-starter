---
name: sdd-deep-review
description: Revisa cambios técnicos de forma read-only, defect-first y limitada al diff. Úsala para auditar un working tree, un commit o una comparación contra base antes del SDD Reviewer final.
---

# SDD Deep Review

Revisa el cambio solicitado y devuelve sólo defectos técnicos concretos que el autor probablemente corregiría. No modifiques archivos, no implementes correcciones, no crees commits, no publiques comentarios y no delegues el review.

## Límites de responsabilidad

Evalúa:

- correctness y regresiones;
- seguridad;
- mantenibilidad y complejidad con impacto demostrable;
- boundaries y ownership técnico;
- developer experience cuando afecta el uso, diagnóstico o mantenimiento del cambio.

No evalúes cumplimiento final de la spec, decisiones de producto, autoridad arquitectónica final ni cierre SDD. Esas decisiones pertenecen al `sdd-reviewer`.

## Seleccionar el cambio

Usa el target indicado por el Coordinator:

- Working tree: inspecciona `git status --short` y el diff completo contra la baseline indicada. Incluye staged, unstaged y cada archivo untracked relevante mediante su contenido completo.
- Commit: inspecciona el commit, su diff y el contexto necesario de cada path afectado.
- Comparación contra base: resuelve el merge base cuando corresponda e inspecciona el diff que realmente se integraría.

Si el target o la baseline no se pueden resolver, informa el bloqueo. No sustituyas el target por otro.

## Revisar

1. Lee las instrucciones `AGENTS.md` aplicables.
2. Recorre el cambio completo y suficiente código circundante para entender cada path.
3. Comprueba tests, call sites, contratos y flujos afectados antes de afirmar un defecto.
4. Continúa después del primer hallazgo.

Registra un finding sólo si cumple todo lo siguiente:

- fue introducido por el cambio revisado;
- afecta de forma significativa una categoría admitida;
- es discreto y accionable;
- el escenario o call path se demuestra con evidencia concreta;
- el autor probablemente lo corregiría al conocerlo.

No registres problemas preexistentes, cambios intencionales, hipótesis sin demostrar ni preferencias de estilo. Cero findings es un resultado válido.

## Salida

Presenta findings primero, ordenados por severidad. Usa `critical`, `high`, `medium` o `low`. `blocking` sólo debe ser `true` para un defecto crítico que impida continuar con seguridad.

Cada finding debe incluir:

```yaml
- provider: deep_review
  category: correctness
  severity: high
  location: path/to/file.js:line
  summary: descripción breve del defecto
  evidence: escenario o call path demostrado y su consecuencia
  recommendation: corrección concreta esperada
  blocking: false
```

La ubicación debe ser mínima y solapar el cambio. Si no hay findings, escribe `No findings.` sin inventar uno. Cierra con una evaluación breve y con gaps de prueba o riesgos residuales materiales, si existen.
