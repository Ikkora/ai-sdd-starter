# Constitución de la distribución SDD v2

## 1. Integridad de la metodología

El motor SDD v2 validado es la fuente normativa. Una reorganización o mecanismo de instalación no puede debilitar RESUME FIRST, la máquina de estados, los gates, la validación proporcional, la revisión independiente ni los commits por bloque lógico.

## 2. Seguridad y privacidad

La distribución no incluye secretos ni rutas personales. El instalador sólo gestiona rutas SDD declaradas, nunca borra código del proyecto, no ejecuta comandos del stack del repositorio destino y no instala tooling externo silenciosamente.

## 3. Arquitectura

El motor, Quality Gates, adapters, templates instalables, CLI y pruebas tienen responsabilidades separadas. Las particularidades de un proyecto y providers externos se expresan mediante configuración y no vuelven al core dependiente de un producto específico.

## 4. Compatibilidad e idempotencia

La instalación funciona en carpetas vacías y repositorios existentes. Detecta todos los conflictos antes de escribir, no sobrescribe por defecto y una repetición sobre una instalación equivalente no altera archivos. Un proyecto SDD 1.0.x sin configuración de Quality Gates mantiene su comportamiento.

## 5. Evidencia y calidad

Cada requisito de instalación, diagnóstico y Quality Gates debe tener una prueba aislada o evidencia trazable. Una release requiere suite completa verde, revisión independiente aprobada, documentación actualizada y árbol Git limpio.
