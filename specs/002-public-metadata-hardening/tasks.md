# Tareas — Spec 002

- [x] **T01. Agregar metadata pública preventiva.** RF-01, RF-02, RF-03
  - Depende de: ninguna.
  - Áreas previstas: `LICENSE`, `SECURITY.md`, `.gitignore`.
  - Riesgo: public_metadata.
  - Checks focales: licencia MIT completa; política sin canales inventados; `git check-ignore` positivo/negativo.
  - Hecho cuando: los tres archivos cumplen el contenido solicitado y no ocultan infraestructura SDD.
  - Bloque candidato: public-hardening-1.0.1.

- [x] **T02. Corregir publicación y changelog de v1.0.1.** RF-04, RF-05, RF-06
  - Depende de: T01.
  - Áreas previstas: `README.md`, `CHANGELOG.md`.
  - Riesgo: public_metadata, release_accuracy.
  - Checks focales: búsquedas de afirmaciones obsoletas, fecha/encabezado 1.0.1 y diff limitado.
  - Hecho cuando: v1.0.0 figura publicada y v1.0.1 se describe sin cambios funcionales.
  - Bloque candidato: public-hardening-1.0.1.

## Grafo

```text
T01 → T02
```

## Checkpoints

- 50%: metadata nueva, reglas de ignore y alcance.
- 100%: suite completa, invariancia funcional, review final y cleanup.
