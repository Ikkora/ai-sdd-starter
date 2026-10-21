# Especificaciones

Cada cambio STANDARD o STRICT que requiera spec vive en `specs/NNN-nombre/` con:

```text
spec.md
plan.md
tasks.md
validation.md
state.yaml
```

Antes de crear una spec, aplica RESUME FIRST. Si existe un estado incompleto, continúa desde `resume.next_action` y preserva `dirty_expected`.

## Estados

```text
draft → clarifying → approved → implementing → validated → closed
```

- Spec: qué, por qué, requisitos y límites.
- Plan: cómo, compatibilidad, rollback y pruebas.
- Tasks: grafo de unidades verificables con dependencias, riesgo, checks y done_when.
- Validation: evidencia trazable por requisito.
- State: checkpoint operativo preciso.

Una modificación de requisito se propaga `spec → plan → tasks → código → tests → validation`. Las aprobaciones humanas y checkpoints dependen del modo y del riesgo configurado. La operación completa está definida en `.agents/skills/sdd/references/engine.md`; no la dupliques aquí.
