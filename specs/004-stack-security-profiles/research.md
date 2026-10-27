# Investigación: Spec 004

Estado: complete-for-planning

## Baseline verificada

- Branch: `main`.
- Commit: `4e8e41f02b7cc18fc4b5e5c5df2413004f11681c`.
- Tag base: `v1.1.1` sobre el mismo commit.
- Working tree inicial: limpio.
- Specs 001, 002 y 003: cerradas.
- El CLI usa Node.js estándar, no tiene dependencias de runtime y sólo interpreta una porción estrecha de YAML para Quality Gates.
- `doctor` valida infraestructura SDD e integraciones, no código del producto.

## Fuentes primarias

### OWASP ASVS 5.0.0

Fuente: https://asvs.owasp.org/

ASVS 5.0.0, publicada el 30 de mayo de 2025, organiza requisitos verificables sobre arquitectura, autenticación, sesiones, acceso, validación y encoding, criptografía, errores, datos, comunicaciones, archivos, APIs y configuración. La spec usa esas categorías como cobertura de baseline, no copia el estándar completo ni equipara los perfiles SDD con niveles ASVS.

### OWASP Top 10:2025

Fuente: https://top10.owasp.org/2025/

La edición 2025 prioriza control de acceso, configuración, supply chain, criptografía, injection, diseño inseguro, autenticación, integridad de software y datos, logging y condiciones excepcionales. Se usa para comprobar que la baseline no omite clases de riesgo actuales. No reemplaza el análisis contextual.

### OWASP Threat Modeling Cheat Sheet

Fuente: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html

El proceso parte del modelo del sistema, identifica y prioriza amenazas, define respuestas y revisa mitigaciones. Esta secuencia respalda evaluar aplicabilidad desde stack, capabilities y cambio antes de seleccionar controles.

### CWE Top 25:2025

Fuente: https://cwe.mitre.org/top25/index.html

La lista 2025 se usa como referencia de clases frecuentes e impactantes, no como ranking fijo para todos los proyectos. Ayuda a verificar cobertura de inyección, path traversal, autorización, XSS, manejo de memoria y otras debilidades relevantes según contexto.

### NIST SSDF 1.1

Fuente: https://csrc.nist.gov/pubs/sp/800/218/final

SSDF define prácticas de desarrollo seguro integrables en distintos ciclos de vida y stacks. Respalda mantener una baseline de proceso común con perfiles tecnológicos como extensión, sin acoplar el motor a una tecnología.

### Fuentes específicas por stack

- PHP PDO prepared statements: https://www.php.net/manual/en/pdo.prepare.php
- Node.js child processes: https://nodejs.org/api/child_process.html
- Python pickle: https://docs.python.org/3/library/pickle.html
- Python subprocess: https://docs.python.org/3/library/subprocess.html#security-considerations

Estas fuentes justifican reglas específicas declarativas sobre queries parametrizadas, procesos, deserialización y shells. No justifican lógica PHP, JavaScript o Python dentro del resolver central.

## Hallazgos de diseño

1. ASVS es más amplio y verificable que un Top 10, pero está orientado a aplicaciones y servicios web. La baseline debe permitir no aplicabilidad para CLIs, librerías, desktop, datos u otros sistemas.
2. Top 10 y CWE sirven para cobertura y priorización, no para decidir riesgo de un cambio sin contexto.
3. Threat modeling exige conocer el sistema antes de elegir mitigaciones. Stack y capabilities deben ser entradas de la evaluación.
4. SSDF respalda separar prácticas universales de perfiles de implementación.
5. Las guías oficiales de lenguajes son apropiadas para rulesets de tecnología, no para el core universal.

## Implicaciones

- Cada control declara `applies_when`, riesgo, evidencia y recomendación.
- El lenguaje desconocido mantiene baseline universal.
- `strict` modifica selección o umbrales.
- Los fixtures demuestran razonamiento y selección de controles, no escaneo exhaustivo.
- Las referencias deben conservar versión o fecha cuando el estándar lo requiera.
