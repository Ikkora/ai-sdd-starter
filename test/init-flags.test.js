'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { parseProjectConfig } = require('../engine/project-config');

const repositoryRoot = path.resolve(__dirname, '..');
const cli = path.join(repositoryRoot, 'cli', 'sdd.js');

function withTemp(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-init-flags-'));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

function runCli(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function projectConfig(root) {
  return fs.readFileSync(path.join(root, '.sdd', 'project.yaml'), 'utf8');
}

test('init without profile flags writes empty open maps and standard security', () => {
  withTemp((root) => {
    const result = runCli(root, 'init', '--name', 'Defaults');
    assert.equal(result.status, 0, result.stderr);
    assert.match(projectConfig(root), /stack: \{\}\n\ncapabilities: \{\}\n\nsecurity:\n  profile: standard/);
  });
});

test('repeated stack and capability flags render deterministic custom components', () => {
  withTemp((root) => {
    const result = runCli(
      root,
      'init',
      '--stack', 'worker.runtime=Acme: Core',
      '--stack', 'worker.invocation=$(node --version)',
      '--capability', 'custom.flow=false',
      '--stack', 'backend.version=8.3',
      '--security', 'strict',
      '--stack', 'backend.language=php',
      '--capability', 'authentication=true',
    );
    assert.equal(result.status, 0, result.stderr);
    const generated = projectConfig(root);
    assert.match(generated, /stack:\n  backend:\n    language: "php"\n    version: "8\.3"\n  worker:\n    invocation: "\$\(node --version\)"\n    runtime: "Acme: Core"\n\ncapabilities:\n  authentication: true\n  custom\.flow: false\n\nsecurity:\n  profile: strict/);
    const parsed = parseProjectConfig(generated);
    assert.equal(parsed.valid, true, JSON.stringify(parsed.diagnostics));
    assert.equal(parsed.config.stack.worker.invocation, '$(node --version)');
    assert.deepEqual(parsed.config.capabilities, { authentication: true, 'custom.flow': false });
  });
});

test('invalid profile, boolean, shape, and duplicates fail before writes', async (context) => {
  const cases = [
    { args: ['--security', 'maximum'], message: /must be off, standard, or strict/ },
    { args: ['--security', 'off', '--security', 'strict'], message: /Duplicate option: --security/ },
    { args: ['--capability', 'auth=yes'], message: /name=true or name=false/ },
    { args: ['--capability', 'auth=true', '--capability', 'auth=false'], message: /Duplicate capability entry: auth/ },
    { args: ['--stack', 'backend=php'], message: /component\.field=value/ },
    { args: ['--stack', 'backend.language=php', '--stack', 'backend.language=python'], message: /Duplicate stack entry: backend\.language/ },
  ];

  for (const item of cases) {
    await context.test(item.args.join(' '), () => {
      withTemp((root) => {
        const result = runCli(root, 'init', ...item.args);
        assert.equal(result.status, 1);
        assert.match(result.stderr, item.message);
        assert.deepEqual(fs.readdirSync(root), []);
      });
    });
  }
});

test('dry-run with custom flags writes nothing', () => {
  withTemp((root) => {
    const result = runCli(root, 'init', '--stack', 'backend.language=custom', '--security', 'off', '--dry-run');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Dry run complete: no files were written/);
    assert.deepEqual(fs.readdirSync(root), []);
  });
});

test('init without force preserves an existing legacy project config byte for byte', () => {
  withTemp((root) => {
    const legacy = 'version: 2\n\nproject:\n  name: "Legacy"\n\nstack:\n  runtime: "Node.js"\n';
    fs.mkdirSync(path.join(root, '.sdd'));
    fs.writeFileSync(path.join(root, '.sdd', 'project.yaml'), legacy);

    const result = runCli(root, 'init', '--capability', 'authentication=true');
    assert.equal(result.status, 1);
    assert.match(result.stdout, /CONFLICT \.sdd\/project\.yaml/);
    assert.equal(projectConfig(root), legacy);
    assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), false);
  });
});

test('conflict preserves all files and force replaces only managed destinations', () => {
  withTemp((root) => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), 'local rules\n');
    fs.writeFileSync(path.join(root, 'product.txt'), 'keep\n');

    const conflict = runCli(root, 'init', '--stack', 'api.language=python');
    assert.equal(conflict.status, 1);
    assert.equal(fs.existsSync(path.join(root, '.sdd')), false);
    assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), 'local rules\n');

    const forced = runCli(root, 'init', '--stack', 'api.language=python', '--capability', 'jobs=true', '--security', 'off', '--force');
    assert.equal(forced.status, 0, forced.stderr);
    assert.match(projectConfig(root), /api:\n    language: "python"/);
    assert.match(projectConfig(root), /security:\n  profile: off/);
    assert.equal(fs.readFileSync(path.join(root, 'product.txt'), 'utf8'), 'keep\n');
  });
});

test('same semantic flags in different order are idempotent', () => {
  withTemp((root) => {
    const first = runCli(
      root,
      'init',
      '--stack', 'worker.runtime=node',
      '--stack', 'api.language=javascript',
      '--capability', 'uploads=false',
      '--capability', 'authentication=true',
    );
    assert.equal(first.status, 0, first.stderr);
    const before = projectConfig(root);

    const second = runCli(
      root,
      'init',
      '--capability', 'authentication=true',
      '--stack', 'api.language=javascript',
      '--capability', 'uploads=false',
      '--stack', 'worker.runtime=node',
    );
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /SDD init complete: 0 file\(s\) written/);
    assert.equal(projectConfig(root), before);
  });
});
