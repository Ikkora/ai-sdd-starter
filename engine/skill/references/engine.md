# Motor SDD v2

Este archivo es la única fuente normativa detallada del starter. La configuración de cada repositorio vive en `.sdd/project.yaml`; el estado de cada ejecución vive en la spec activa.

## 1. Máquina de estados

```text
START → LOAD CONFIG → LOAD STATE → RESUME | CLASSIFY
→ SPEC → PLAN → TASK GRAPH → RISK PROFILE → BUILD BLOCKS
→ EXECUTE → CHECKPOINT → VALIDATE → REVIEW → COMMIT → CLOSE
```

FAST y DEBUG usan un subconjunto proporcional. STANDARD y STRICT recorren los artefactos y gates necesarios.

## 2. Entrada única y RESUME FIRST

`sdd_run(goal)` y una petición equivalente en lenguaje natural son la misma entrada.

1. Carga reglas, constitución, memoria y `.sdd/project.yaml`.
2. Localiza la spec activa declarada o el único `state.yaml` incompleto bajo `project.specs_root`.
3. Si hay más de uno sin un puntero inequívoco, registra `await_human_decision:select_active_spec` y detente.
4. Verifica `git.base_commit`, `git.working_tree` y `git.expected_paths`.
5. Si el árbol es `dirty_expected`, preserva esos cambios. Un path inesperado bloquea el avance; nunca autoriza reset, clean o checkout.
6. Ejecuta exactamente `resume.next_action`. No recrees artefactos, tareas, checks ni revisiones ya registrados.

El coordinador actualiza `state.yaml` de forma atómica después de cada transición demostrada. Cada estado debe dejar una siguiente acción concreta.

## 3. Clasificación

- **FAST:** copy, rename, texto, estilo aislado o ajuste trivial, local y reversible sin cambiar contratos, reglas ni datos.
- **DEBUG:** defecto, regresión, intermitencia o causa incierta. Reproduce, aísla, comprueba hipótesis, corrige y añade barrera de regresión.
- **STANDARD:** feature, refactor o cambio funcional normal no incluido en las categorías estrictas.
- **STRICT:** cualquier categoría configurada en `risk.strict_mode`, aunque el diff previsto sea pequeño.

En una mezcla usa el modo más exigente. Nueva evidencia puede elevar el riesgo, nunca ocultarlo. Registra el motivo en `execution.risk_profile`.

## 4. Artefactos y gates

- `spec.md` define qué y por qué, casos límite, fuera de alcance y criterios verificables.
- `plan.md` define cómo, impacto, compatibilidad, rollback, seguridad y pruebas; parte de una spec aprobada.
- `tasks.md` convierte el plan en un grafo de unidades verificables.
- `validation.md` conserva evidencia, no afirmaciones.

Requiere intervención humana sólo para una decisión funcional, ambigüedad material, aprobación exigida por el modo, expansión de alcance, operación destructiva, setup/repair externo o riesgo no aceptado. No preguntes si debes correr tests, avanzar una tarea lista, pedir reviewer o hacer un commit que ya exige la política.

Acciones de espera:

- `await_human_decision:<id>`: falta una decisión de producto, alcance o riesgo.
- `await_human_setup:<id>`: falta una configuración externa que el agente no debe crear.
- `await_human_repair:<id>`: un entorno externo requiere reparación humana segura.

Registra contexto mínimo en `resume.context` y la pregunta o condición exacta en `human_decisions.pending`. Tras la respuesta, conserva la resolución y cambia `resume.next_action` al paso técnico siguiente.

## 5. Grafo de tareas y bloques

Cada nodo de `task_graph.nodes` debe declarar:

- id, requisitos y objetivo;
- dependencias;
- áreas o archivos previstos cuando se conozcan;
- riesgo;
- checks focales;
- `done_when` observable;
- decisión humana pendiente, si existe.

Las aristas representan dependencias y el grafo debe ser acíclico. Sólo una tarea con dependencias completas entra en `task_graph.ready`.

Agrupa tareas en bloques por resultado coherente, dependencia y superficie compartida. Un bloque debe ser revisable y commiteable. No agrupes dominios sin relación ni produzcas un commit por microtarea salvo necesidad documentada.

## 6. Ejecución

El implementer recibe exactamente una tarea lista y:

1. valida configuración, estado, dependencia y árbol;
2. preserva el trabajo existente;
3. implementa el mínimo conforme a spec y plan;
4. se detiene ante contradicción, decisión faltante o cambio inesperado;
5. ejecuta los checks focales declarados;
6. devuelve evidencia, sin commit, sin actualizar estado y sin iniciar otra tarea.

El coordinador inspecciona la evidencia, actualiza `completed`, `pending`, grafo, progreso, bloque y siguiente acción. Dentro de un alcance aprobado autoavanza a la siguiente tarea lista hasta un checkpoint, review, bloqueo o decisión humana real.

## 7. Checkpoints y validación proporcional

Los porcentajes y la ubicación de la suite completa proceden de `project.validation`. Calcula progreso por tareas completadas; si sus tamaños son muy desiguales puede ajustarse con justificación registrada.

- Por tarea: sólo sintaxis, tests y smokes focales.
- Checkpoint intermedio: incremento desde el hito anterior y regresiones justificadas.
- Checkpoint final: suite amplia configurada, criterios completos, cleanup, residuos y diff.

No repitas baterías completas sin una causa. Un fallo relevante bloquea; distingue defecto, fixture obsoleto e infraestructura antes de editar. Registra comando, resultado, residuos, limitaciones y siguiente paso en `validation.evidence` y `validation.md`.

## 8. Revisión proporcional

Solicita reviewer inmediato cuando la tarea toca una categoría de `risk.immediate_review`; el resto se revisa por bloque o al final.

Tipos:

- **focal:** comprueba bloqueantes corregidos y regresiones directamente relacionadas;
- **checkpoint/bloque:** revisa el incremento lógico;
- **final:** cubre requisitos y evidencia completa.

El reviewer es independiente y de sólo lectura. Devuelve `VEREDICTO: APROBADO` o `VEREDICTO: CAMBIOS NECESARIOS`, con bloqueantes separados de observaciones opcionales. Consolida bloqueantes en una sola ronda de corrección y solicita review focal. Después de dos rondas fallidas sobre la misma hipótesis, vuelve a diagnóstico o pide decisión; no debilites tests.

## 9. Commit y cierre

Si `git.block_commits` está activo, sólo commitea el bloque cuando sus checks y reviews requeridos estén verdes. Antes:

1. revisa status, diff, alcance y checks de formato;
2. actualiza tareas, validación, memoria y estado cuando corresponda;
3. prepara únicamente paths del bloque;
4. verifica staged diff;
5. crea un commit descriptivo y registra su hash.

Cierra cuando todos los requisitos tienen evidencia, la revisión final está aprobada, la documentación refleja el estado real y el árbol está limpio. Conserva `state.yaml` como historial con fase `closed`, progreso 100, bloques completos y sin acción pendiente.

## 10. Contrato de estado

El estado debe conservar, como mínimo: spec, objetivo, modo, riesgo, fase, progreso, grafo, bloque, completadas, pendientes, validación, review, Git, decisiones humanas y reanudación.

`resume.next_action` siempre es ejecutable, por ejemplo:

- `clarify_spec`
- `plan_spec`
- `execute:T04`
- `validate_checkpoint:50`
- `review_block:api`
- `commit_block:api`
- `await_human_decision:data_retention`
- `await_human_setup:test_identity`
- `await_human_repair:external_service`

Antes de comunicar una transición, persiste primero el nuevo estado. Si una sesión se corta, la siguiente continúa desde esa acción sin reconstruir el proceso.

## 11. Fallos e infraestructura

- Conserva el árbol y la evidencia ante interrupciones.
- No confundas una caída de tooling con un defecto funcional.
- No improvises acciones destructivas para recuperar un servicio.
- Si un comando no puede ejecutarse, registra causa, evidencia ya válida y acción concreta de reanudación.
- Si aparece un requisito o riesgo nuevo, vuelve al artefacto responsable antes de cambiar código.
