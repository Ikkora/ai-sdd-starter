'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const cli = path.join(repositoryRoot, 'cli', 'sdd.js');
const {
  consolidateFindings,
  correctionPolicy,
  detectProvider,
  evaluateProvider,
  inspectOptionalIntegrations,
  loadProviderManifests,
  normalizeFinding,
  readQualityGateConfig,
  versionAtLeast,
} = require('../engine/quality-gates');

const providers = Object.fromEntries(loadProviderManifests().map((provider) => [provider.id, provider]));

function withTemp(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-quality-'));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

function write(root, relative, content = '') {
  const target = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function runCli(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8', windowsHide: true });
}

test('A. ningún proveedor instalado', () => {
  withTemp((root) => {
    const result = inspectOptionalIntegrations(root, 'quality_gates: {}\n', { env: {} });
    assert.equal(result.every((provider) => provider.available === false), true);
  });
});

test('B. Anti-Slop disponible', () => {
  withTemp((root) => {
    write(root, '.codex/skills/antislop/SKILL.md', '# antislop\n');
    const result = detectProvider(root, providers.anti_slop, { env: {} });
    assert.equal(result.available, true);
    assert.match(result.source, /project:/);
  });
});

test('C. Deep Review disponible por skill local', () => {
  withTemp((root) => {
    write(root, '.agents/skills/sdd-deep-review/SKILL.md', '# sdd-deep-review\n');
    const result = detectProvider(root, providers.deep_review, { env: {} });
    assert.equal(result.available, true);
    assert.equal(result.source, 'project:.agents/skills/sdd-deep-review/SKILL.md');
  });
});

test('C2. provider sin availability_env ignora una clave de entorno undefined', () => {
  withTemp((root) => {
    write(root, '.agents/skills/sdd-deep-review/SKILL.md', '# sdd-deep-review\n');
    const result = detectProvider(root, providers.deep_review, { env: { undefined: 'unavailable' } });
    assert.equal(result.available, true);
    assert.equal(result.source, 'project:.agents/skills/sdd-deep-review/SKILL.md');
  });
});

test('D. ambos disponibles', () => {
  withTemp((root) => {
    write(root, '.agents/skills/antislop/SKILL.md', '# antislop\n');
    write(root, '.agents/skills/sdd-deep-review/SKILL.md', '# sdd-deep-review\n');
    const result = inspectOptionalIntegrations(root, 'quality_gates:\n  anti_slop:\n    mode: auto\n  deep_review:\n    mode: auto\n', { env: {} });
    assert.equal(result.every((provider) => provider.available === true), true);
  });
});

test('E. provider off nunca corre', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'off' }, { mode: 'STRICT', tags: ['architecture'] }, { available: true });
  assert.equal(evaluation.status, 'off');
  assert.equal(evaluation.should_run, false);
});

test('F. provider auto ausente continúa como not_available', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'auto' }, { mode: 'STANDARD', tags: ['code'] }, { available: false });
  assert.equal(evaluation.status, 'not_available');
  assert.equal(evaluation.blocking, false);
});

test('G. provider required ausente bloquea con await_human_setup', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'required' }, { mode: 'STRICT', tags: ['architecture'] }, { available: false });
  assert.equal(evaluation.status, 'await_human_setup');
  assert.equal(evaluation.blocking, true);
});

test('H. FAST no ejecuta Deep Review por política base', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'auto' }, { mode: 'FAST', tags: ['code'] }, { available: true });
  assert.equal(evaluation.status, 'not_applicable');
});

test('I. STANDARD con Deep Review auto disponible queda pending_run', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'auto' }, { mode: 'STANDARD', tags: ['code'] }, { available: true });
  assert.equal(evaluation.status, 'pending_run');
  assert.equal(evaluation.should_run, true);
});

test('J. STRICT incluye Deep Review cuando está disponible', () => {
  const evaluation = evaluateProvider(providers.deep_review, { mode: 'auto' }, { mode: 'STRICT', tags: ['security'] }, { available: true });
  assert.equal(evaluation.status, 'pending_run');
});

test('J2. DEBUG sólo incluye Deep Review con run_on explícito', () => {
  const defaultEvaluation = evaluateProvider(providers.deep_review, { mode: 'auto' }, { mode: 'DEBUG', tags: ['code'] }, { available: true });
  const explicitEvaluation = evaluateProvider(providers.deep_review, { mode: 'auto', run_on: ['DEBUG'] }, { mode: 'DEBUG', tags: ['code'] }, { available: true });
  assert.equal(defaultEvaluation.status, 'not_applicable');
  assert.equal(explicitEvaluation.status, 'pending_run');
});

test('K. Anti-Slop no aplica a una migración SQL mínima', () => {
  const evaluation = evaluateProvider(providers.anti_slop, { mode: 'auto' }, { mode: 'STANDARD', tags: ['minimal_sql_migration'] }, { available: true });
  assert.equal(evaluation.status, 'not_applicable');
});

test('L. findings con evidencia de ambos providers se consolidan y deduplican', () => {
  const first = normalizeFinding('anti_slop', { category: 'maintainability', severity: 'medium', location: 'src/a.js', summary: 'Duplicated abstraction', evidence: 'Copy audit evidence' });
  const second = normalizeFinding('deep_review', { category: 'maintainability', severity: 'high', location: 'src/a.js', summary: 'Duplicated abstraction', evidence: 'Technical call path evidence', blocking: false });
  const consolidated = consolidateFindings([first, second]);
  assert.equal(consolidated.length, 1);
  assert.deepEqual(consolidated[0].providers.sort(), ['anti_slop', 'deep_review']);
  assert.equal(consolidated[0].severity, 'high');
  assert.match(consolidated[0].evidence, /Copy audit evidence/);
  assert.match(consolidated[0].evidence, /Technical call path evidence/);
});

test('M. la política normal permite una sola ronda de corrección', () => {
  const finding = normalizeFinding('deep_review', { summary: 'Fix me', severity: 'medium' });
  const policy = correctionPolicy([finding]);
  assert.equal(policy.normal_round_limit, 1);
  assert.equal(policy.planned_rounds, 1);
});

test('N. después de correcciones el re-review es focal', () => {
  const finding = normalizeFinding('deep_review', { summary: 'Fix me', severity: 'medium' });
  assert.equal(correctionPolicy([finding]).recheck, 'focal');
});

test('RF-10. critical_override sólo admite hallazgos críticos elegibles', () => {
  const policies = [
    {
      policy: correctionPolicy([normalizeFinding('deep_review', { category: 'security', severity: 'low', summary: 'Low blocking', blocking: true })]),
      expected: false,
    },
    {
      policy: correctionPolicy([normalizeFinding('deep_review', { category: 'data_corruption', severity: 'medium', summary: 'Medium blocking', blocking: true })]),
      expected: false,
    },
    {
      policy: correctionPolicy([normalizeFinding('deep_review', { category: 'security', severity: 'critical', summary: 'Critical security' })]),
      expected: true,
    },
    {
      policy: correctionPolicy([normalizeFinding('deep_review', { category: 'data corruption', severity: 'critical', summary: 'Critical data corruption' })]),
      expected: true,
    },
    {
      policy: correctionPolicy([normalizeFinding('deep_review', { category: 'maintainability', severity: 'critical', summary: 'Critical maintainability' })]),
      expected: false,
    },
  ];

  for (const { policy, expected } of policies) {
    assert.equal(policy.critical_override, expected);
    assert.equal(policy.normal_round_limit, 1);
    assert.equal(policy.planned_rounds, 1);
    assert.equal(policy.recheck, 'focal');
  }
});

test('O. un proyecto 1.0.x sin configuración nueva conserva compatibilidad', () => {
  withTemp((root) => {
    assert.equal(runCli(root, 'init', '--name', 'Legacy').status, 0);
    write(root, '.sdd/version', '1.0.1\n');
    fs.rmSync(path.join(root, '.agents', 'skills', 'sdd', 'references', 'quality-gates.md'));
    fs.rmSync(path.join(root, '.agents', 'skills', 'sdd', 'references', 'quality-gates'), { recursive: true, force: true });
    const configPath = path.join(root, '.sdd', 'project.yaml');
    const defaultQualityGates = '\nquality_gates:\n  anti_slop:\n    mode: auto\n  deep_review:\n    mode: auto\n    run_on: [STANDARD, STRICT]\n';
    const legacyConfig = fs.readFileSync(configPath, 'utf8').replace(defaultQualityGates, '\n');
    assert.doesNotMatch(legacyConfig, /^quality_gates:/m);
    fs.writeFileSync(configPath, legacyConfig);
    const doctor = runCli(root, 'doctor');
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.match(doctor.stdout, /SDD doctor: OK \(10\/10 core checks passed\)\./);
    assert.match(doctor.stdout, /SDD installation: HEALTHY/);
  });
});

test('P. doctor queda saludable con Anti-Slop ausente y Deep Review disponible', () => {
  withTemp((root) => {
    const init = runCli(root, 'init', '--name', 'Doctor opcional');
    assert.equal(init.status, 0, init.stderr);
    const doctor = runCli(root, 'doctor');
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.match(doctor.stdout, /NOT DETECTED Anti-Slop: mode=auto/);
    assert.match(doctor.stdout, /AVAILABLE Deep Review: mode=auto/);
    assert.match(doctor.stdout, /SDD installation: HEALTHY/);
  });
});

test('Q. doctor falla sólo cuando un provider required no está disponible', () => {
  withTemp((root) => {
    assert.equal(runCli(root, 'init').status, 0);
    const configPath = path.join(root, '.sdd', 'project.yaml');
    fs.rmSync(path.join(root, '.agents', 'skills', 'sdd-deep-review', 'SKILL.md'));
    const config = fs.readFileSync(configPath, 'utf8').replace('deep_review:\n    mode: auto', 'deep_review:\n    mode: required');
    fs.writeFileSync(configPath, config);
    const doctor = runCli(root, 'doctor');
    assert.equal(doctor.status, 1);
    assert.match(doctor.stdout, /REQUIRED MISSING Deep Review: mode=required/);
    assert.match(doctor.stderr, /required integration\(s\) missing/);
  });
});

test('R. Deep Review se detecta por la skill distribuida sin bridge externo', () => {
  withTemp((root) => {
    write(root, '.agents/skills/sdd-deep-review/SKILL.md', '# sdd-deep-review\n');
    const result = detectProvider(root, providers.deep_review, { env: {} });
    assert.equal(result.available, true);
    assert.equal(result.source, 'project:.agents/skills/sdd-deep-review/SKILL.md');
  });
});
