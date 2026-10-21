'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const cli = path.join(repositoryRoot, 'cli', 'sdd.js');

const installedFiles = [
  'AGENTS.md',
  '.sdd/project.yaml',
  '.sdd/state-template.yaml',
  '.sdd/version',
  'docs/constitution.md',
  'specs/README.md',
  'templates/constitution.template.md',
  'templates/plan.template.md',
  'templates/spec.template.md',
  'templates/tasks.template.md',
  'templates/validation.template.md',
  '.agents/skills/sdd/SKILL.md',
  '.agents/skills/sdd/references/engine.md',
  '.codex/agents/sdd-planner.toml',
  '.codex/agents/sdd-implementer.toml',
  '.codex/agents/sdd-reviewer.toml',
];

const engineCopies = [
  ['engine/skill/SKILL.md', '.agents/skills/sdd/SKILL.md'],
  ['engine/skill/references/engine.md', '.agents/skills/sdd/references/engine.md'],
  ['engine/agents/sdd-planner.toml', '.codex/agents/sdd-planner.toml'],
  ['engine/agents/sdd-implementer.toml', '.codex/agents/sdd-implementer.toml'],
  ['engine/agents/sdd-reviewer.toml', '.codex/agents/sdd-reviewer.toml'],
];

function inDirectory(root, relative) {
  return path.join(root, ...relative.split('/'));
}

function writeFile(root, relative, content) {
  const target = inDirectory(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function runCli(root, ...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(result.error, undefined);
  return result;
}

function withTemporaryDirectory(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-installer-'));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex');
}

function snapshotTree(root, current = '') {
  const snapshot = {};
  const directory = current === '' ? root : inDirectory(root, current);
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const relative = current === '' ? entry.name : `${current}/${entry.name}`;
    const target = inDirectory(root, relative);
    if (entry.isDirectory()) {
      snapshot[relative] = 'directory';
      Object.assign(snapshot, snapshotTree(root, relative));
    } else if (entry.isFile()) {
      snapshot[relative] = `file:${hash(fs.readFileSync(target))}`;
    } else {
      snapshot[relative] = 'other';
    }
  }

  return snapshot;
}

test('A. init instala SDD v2 en una carpeta vacía', () => {
  withTemporaryDirectory((root) => {
    const result = runCli(root, 'init', '--name', 'Proyecto Vacío');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SDD init complete: 16 file\(s\) written\./);
    for (const relative of installedFiles) {
      assert.equal(fs.statSync(inDirectory(root, relative)).isFile(), true, relative);
    }
    assert.match(fs.readFileSync(inDirectory(root, '.sdd/project.yaml'), 'utf8'), /name: "Proyecto Vacío"/);
    assert.match(fs.readFileSync(inDirectory(root, 'docs/constitution.md'), 'utf8'), /Constitución de Proyecto Vacío/);
    assert.equal(fs.readFileSync(inDirectory(root, '.sdd/version'), 'utf8').trim(), '1.0.0');
    const versionResult = runCli(root, '--version');
    assert.equal(versionResult.status, 0, versionResult.stderr);
    assert.equal(versionResult.stdout, '1.0.0\n');
  });
});

test('B. init preserva el código de un repositorio existente', () => {
  withTemporaryDirectory((root) => {
    const application = 'export function answer() { return 42; }\n';
    const productConfig = '{"scripts":{"test":"custom-product-test"}}\n';
    writeFile(root, 'src/app.js', application);
    writeFile(root, 'product/package.json', productConfig);

    const result = runCli(root, 'init', '--name', 'Repositorio existente');

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(inDirectory(root, 'src/app.js'), 'utf8'), application);
    assert.equal(fs.readFileSync(inDirectory(root, 'product/package.json'), 'utf8'), productConfig);
    assert.equal(fs.existsSync(inDirectory(root, '.agents/skills/sdd/SKILL.md')), true);
  });
});

test('C. conflicto en AGENTS.md aborta el preflight sin escrituras parciales', () => {
  withTemporaryDirectory((root) => {
    writeFile(root, 'AGENTS.md', 'reglas propias\n');
    writeFile(root, 'docs/constitution.md', 'constitución propia\n');
    writeFile(root, 'src/keep.txt', 'no tocar\n');
    const before = snapshotTree(root);

    const result = runCli(root, 'init');

    assert.equal(result.status, 1);
    assert.match(result.stdout, /CONFLICT AGENTS\.md/);
    assert.match(result.stdout, /CONFLICT docs\/constitution\.md/);
    assert.match(result.stderr, /2 conflict\(s\) found; no files were written/);
    assert.deepEqual(snapshotTree(root), before);
  });
});

test('D. dry-run informa el plan y nunca escribe, también ante conflicto', () => {
  withTemporaryDirectory((root) => {
    const emptyResult = runCli(root, 'init', '--dry-run');
    assert.equal(emptyResult.status, 0, emptyResult.stderr);
    assert.match(emptyResult.stdout, /Dry run complete: no files were written/);
    assert.deepEqual(snapshotTree(root), {});

    writeFile(root, 'AGENTS.md', 'conflicto deliberado\n');
    writeFile(root, 'app/code.txt', 'producto\n');
    const beforeConflict = snapshotTree(root);
    const conflictResult = runCli(root, 'init', '--dry-run');

    assert.equal(conflictResult.status, 1);
    assert.match(conflictResult.stdout, /CONFLICT AGENTS\.md/);
    assert.match(conflictResult.stderr, /no files were written/);
    assert.deepEqual(snapshotTree(root), beforeConflict);
  });
});

test('E. force reemplaza sólo destinos gestionados y preserva el resto', () => {
  withTemporaryDirectory((root) => {
    writeFile(root, 'AGENTS.md', 'conflicto\n');
    writeFile(root, '.agents/skills/sdd/SKILL.md', 'skill conflictiva\n');
    writeFile(root, '.agents/local-policy.md', 'política local\n');
    writeFile(root, 'src/application.js', 'código del producto\n');

    const result = runCli(root, 'init', '--name', 'Forzado', '--force');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /REPLACE AGENTS\.md/);
    assert.match(result.stdout, /REPLACE \.agents\/skills\/sdd\/SKILL\.md/);
    assert.notEqual(fs.readFileSync(inDirectory(root, 'AGENTS.md'), 'utf8'), 'conflicto\n');
    assert.notEqual(fs.readFileSync(inDirectory(root, '.agents/skills/sdd/SKILL.md'), 'utf8'), 'skill conflictiva\n');
    assert.equal(fs.readFileSync(inDirectory(root, '.agents/local-policy.md'), 'utf8'), 'política local\n');
    assert.equal(fs.readFileSync(inDirectory(root, 'src/application.js'), 'utf8'), 'código del producto\n');
  });
});

test('F. una ejecución repetida es idempotente y no reescribe archivos', () => {
  withTemporaryDirectory((root) => {
    const first = runCli(root, 'init', '--name', 'Idempotente');
    assert.equal(first.status, 0, first.stderr);

    const oldTime = new Date('2001-02-03T04:05:06.000Z');
    for (const relative of installedFiles) {
      fs.utimesSync(inDirectory(root, relative), oldTime, oldTime);
    }
    const before = Object.fromEntries(installedFiles.map((relative) => {
      const target = inDirectory(root, relative);
      return [relative, {
        hash: hash(fs.readFileSync(target)),
        mtimeMs: fs.statSync(target).mtimeMs,
      }];
    }));

    const second = runCli(root, 'init', '--name', 'Idempotente');

    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /SDD init complete: 0 file\(s\) written/);
    for (const relative of installedFiles) {
      const target = inDirectory(root, relative);
      assert.equal(hash(fs.readFileSync(target)), before[relative].hash, relative);
      assert.equal(fs.statSync(target).mtimeMs, before[relative].mtimeMs, relative);
    }
  });
});

test('G. doctor aprueba una instalación completa', () => {
  withTemporaryDirectory((root) => {
    assert.equal(runCli(root, 'init').status, 0);

    const result = runCli(root, 'doctor');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SDD doctor: OK \(10\/10 checks passed\)\./);
    assert.equal((result.stdout.match(/^OK /gm) || []).length, 10);
    assert.doesNotMatch(result.stdout, /Node|PHP|Python|MySQL|database|runtime/i);
  });
});

test('H. doctor falla con salida útil cuando falta infraestructura SDD', () => {
  withTemporaryDirectory((root) => {
    assert.equal(runCli(root, 'init').status, 0);
    fs.rmSync(inDirectory(root, '.codex/agents/sdd-reviewer.toml'));

    const result = runCli(root, 'doctor');

    assert.equal(result.status, 1);
    assert.match(result.stdout, /MISSING reviewer: \.codex\/agents\/sdd-reviewer\.toml/);
    assert.match(result.stderr, /SDD doctor: FAILED \(9\/10 checks passed\)\./);
  });
});

test('I. nombres y stacks distintos conservan idénticos los bytes del motor', () => {
  withTemporaryDirectory((root) => {
    const nodeProject = inDirectory(root, 'node-project');
    const phpProject = inDirectory(root, 'php-project');
    fs.mkdirSync(nodeProject);
    fs.mkdirSync(phpProject);

    const canonicalBefore = Object.fromEntries(engineCopies.map(([source]) => [
      source,
      fs.readFileSync(inDirectory(repositoryRoot, source)),
    ]));
    assert.equal(runCli(nodeProject, 'init', '--name', 'API Node').status, 0);
    assert.equal(runCli(phpProject, 'init', '--name', 'Sistema PHP').status, 0);

    const nodeConfigPath = inDirectory(nodeProject, '.sdd/project.yaml');
    const phpConfigPath = inDirectory(phpProject, '.sdd/project.yaml');
    fs.writeFileSync(nodeConfigPath, fs.readFileSync(nodeConfigPath, 'utf8').replace('runtime: null', 'runtime: "Node.js"'));
    fs.writeFileSync(phpConfigPath, fs.readFileSync(phpConfigPath, 'utf8').replace('runtime: null', 'runtime: "PHP"'));
    assert.match(fs.readFileSync(nodeConfigPath, 'utf8'), /name: "API Node"[\s\S]*runtime: "Node\.js"/);
    assert.match(fs.readFileSync(phpConfigPath, 'utf8'), /name: "Sistema PHP"[\s\S]*runtime: "PHP"/);

    for (const [source, destination] of engineCopies) {
      const canonicalAfter = fs.readFileSync(inDirectory(repositoryRoot, source));
      const nodeCopy = fs.readFileSync(inDirectory(nodeProject, destination));
      const phpCopy = fs.readFileSync(inDirectory(phpProject, destination));
      assert.deepEqual(canonicalAfter, canonicalBefore[source], `${source} changed at source`);
      assert.deepEqual(nodeCopy, canonicalBefore[source], `${source} changed for Node stack`);
      assert.deepEqual(phpCopy, canonicalBefore[source], `${source} changed for PHP stack`);
    }
  });
});
