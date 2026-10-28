# Quality Gates y External Review Providers

Este documento define la capa genérica de Quality Gates de SDD Universal. Los providers son capacidades opcionales y desacopladas del core. Su ausencia no rompe SDD salvo que un proyecto los configure como `required` y el gate resulte aplicable.

## 1. Contrato de provider

Cada provider declara un manifiesto con:

- `id` y nombre visible;
- tipo de capacidad (`quality_filter`, `external_review` u otro futuro);
- fuente oficial o primaria;
- modos SDD donde puede ejecutarse;
- reglas de aplicabilidad por tags del cambio;
- estrategias de detección no destructivas;
- forma conceptual de invocación.

Los manifests canónicos viven en `engine/quality-gates/providers/`; `sdd init` instala copias byte-identical bajo `.agents/skills/sdd/references/quality-gates/providers/`. El Coordinator consume el contrato, no detalles particulares del producto.

## 2. Configuración

Configuración equivalente:

```yaml
quality_gates:
  anti_slop:
    mode: auto
  deep_review:
    mode: auto
    run_on: [STANDARD, STRICT]
```

Modos:

- `off`: no evaluar ni ejecutar el provider.
- `auto`: si aplica y está disponible, ejecutar; si falta, registrar `not_available` y continuar.
- `required`: si aplica y falta, persistir `await_human_setup:<provider>` y no continuar silenciosamente.

Si `quality_gates` o un provider no existen en configuración, se comportan como `off`. Esta regla preserva proyectos SDD 1.0.x.

## 3. Política por modo

- FAST: Deep Review no corre por defecto. Anti-Slop sólo se aplica con tags de artefacto relevantes.
- DEBUG: Deep Review requiere configuración explícita en `run_on` o elevación por riesgo técnico. Anti-Slop sigue siendo contextual.
- STANDARD: Deep Review actúa al cierre de features o cambios relevantes cuando está en `auto` o `required`. Anti-Slop sólo se aplica si el cambio contiene UI, UX, copy, documentación, comentarios, responsive, accesibilidad, contenido generado o riesgo de slop.
- STRICT: Deep Review se ejecuta antes del SDD Reviewer final. Anti-Slop sigue siendo contextual.

Una migración SQL mínima etiquetada `minimal_sql_migration` no activa Anti-Slop.

## 4. Detección y disponibilidad

La detección nunca instala software ni ejecuta instaladores externos.

Un provider puede detectarse mediante:

1. archivos o skills materializados en rutas documentadas del proyecto;
2. marcadores explícitos documentados por el provider;
3. una señal de capacidad provista por el host/agente;
4. un override explícito de SDD para tooling opaco al filesystem.

`SDD_QUALITY_GATE_ANTI_SLOP` es un bridge propio de SDD para declarar disponibilidad a `sdd doctor`; no es una API ni un comando del provider. Deep Review se detecta por la skill local que instala SDD.

Cuando un plugin manager no expone una ubicación estable, `sdd doctor` informa `NOT DETECTED`, no afirma falsamente que el producto no esté instalado. El Coordinator puede marcarlo `AVAILABLE` si el runtime le expone efectivamente la skill.

## 5. Resultado normalizado

Todo hallazgo se transforma antes de llegar al Coordinator:

```yaml
finding:
  id: qg-<fingerprint>
  providers: [deep_review]
  category: maintainability
  severity: medium
  location: src/example.js
  summary: "..."
  evidence: "..."
  recommendation: "..."
  blocking: false
```

Severidades válidas: `low`, `medium`, `high`, `critical`. Un `critical` es bloqueante. Hallazgos equivalentes se deduplican y conservan todos los providers que los reportaron.

## 6. Estado persistente

Cuando la spec usa Quality Gates, `state.yaml` registra como mínimo:

```yaml
quality_gates:
  status: pending
  correction_rounds: 0
  providers:
    deep_review:
      mode: auto
      applicability: true
      availability: available
      status: completed
      findings: []
      severity: null
      correction_required: false
      completed_at: null
      recheck:
        status: not_required
        completed_at: null
  consolidated_findings: []
  recheck:
    status: not_required
    provider_ids: []
    completed_at: null
```

Estados típicos del provider: `off`, `not_applicable`, `not_available`, `pending_run`, `completed`, `await_human_setup`, `recheck_pending`, `recheck_complete`.

## 7. Consolidación y corrección

Orden normal:

```text
providers aplicables
→ findings normalizados
→ deduplicación y priorización
→ UNA ronda de corrección consolidada
→ re-check focal de hallazgos corregidos
→ SDD Reviewer final
```

No se alternan reviews completos entre providers. Sólo un hallazgo crítico de seguridad, corrupción de datos o equivalente justifica romper el límite normal de una ronda y volver a diagnóstico/revisión inmediata.

## 8. Anti-Slop adapter

Fuente primaria: `miqdadbadjuber/anti-slop`.

Capacidades reales usadas por el adapter:

- core `antislop`;
- `antislop-ui`;
- `antislop-copywriting`;
- `antislop-human`;
- `antislop-layoutmobile`;
- `antislop-code`.

Para SDD se prefiere conceptualmente el modo `after`, porque actúa como gate sobre una salida ya construida. El adapter no asume que Anti-Slop sea un linter ejecutable uniforme ni instala `npx antislop-ai` automáticamente.

## 9. Deep Review adapter

Fuente canónica: `engine/skills/sdd-deep-review/SKILL.md`. Referencia arquitectónica: el sample oficial `review-agent` de `openai/codex`.

Deep Review inspecciona un working tree, un commit o una comparación contra base. El modo working tree incluye staged, unstaged y archivos untracked relevantes. La revisión es read-only, defect-first y limitada al cambio.

Cuando existe contexto de seguridad, el Coordinator entrega Stack Profile, capabilities, controles de baseline y reglas de stack aplicables. Deep Review usa ese contexto para priorizar call paths y comprobar defectos técnicos concretos; no vuelve a decidir aplicabilidad, cumplimiento de la spec, suficiencia de evidencia ni cierre.

Sus categorías cubren correctness, regresiones, seguridad, mantenibilidad, complejidad, boundaries, ownership y developer experience técnicamente relevante. No evalúa cumplimiento final de la spec, decisiones de producto, autoridad arquitectónica final ni cierre SDD.

`sdd init` instala la skill local versionada. La detección es determinista y no requiere Cursor, APIs externas, claves ni cuotas.

## 10. `sdd doctor`

`doctor` separa salud del core de integraciones opcionales. Un provider ausente en `off` o `auto` no vuelve unhealthy a SDD. Un provider `required` y no detectado sí produce una condición de setup faltante y salida no saludable.
