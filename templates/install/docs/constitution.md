# Constitución de <proyecto>

Principios innegociables para specs, planes, implementación y validación.

## 1. Integridad del dominio

<Invariantes que nunca deben romperse.>

## 2. Seguridad y privacidad

<Límites de autorización, datos sensibles y almacenamiento.>

La Security Baseline SDD define controles y evidencia aplicables. No sustituye el análisis técnico del código ni autoriza acceso adicional.

## 3. Arquitectura

<Responsabilidades y dependencias permitidas.>

Deep Review busca defectos técnicos concretos; el SDD Reviewer decide cumplimiento, evidencia, excepciones y cierre.

## 4. Persistencia y compatibilidad

<Transacciones, idempotencia, migraciones y rollback.>

Una instalación nueva usa `security.profile: standard`. La ausencia de las secciones nuevas en un proyecto legacy conserva su comportamiento anterior.

## 5. Evidencia y calidad

<Criterios mínimos de verificación y trazabilidad.>
