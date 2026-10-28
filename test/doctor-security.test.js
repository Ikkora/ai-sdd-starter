'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const cli = path.join(repositoryRoot, 'cli', 'sdd.js');
const installedSecurity = path.join('.agents', 'skills', 'sdd', 'references', 'security');

function withTemp(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-doctor-security-'));
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

function write(root, relative, content) {
  const target = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function install(root, version, projectYaml = null) {
  const initialized = runCli(root, 'init');
  assert.equal(initialized.status, 0, initialized.stderr);
  write(root, '.sdd/version', `${version}\n`);
  if (projectYaml !== null) write(root, '.sdd/project.yaml', projectYaml);
}

function installV12(root, projectYaml = null) {
  install(root, '1.2.0', projectYaml);
}

test('doctor validates healthy v1.2 standard and off installations without scanning product code', async (context) => {
  for (const profile of ['standard', 'off']) {
    await context.test(profile, () => {
      withTemp((root) => {
        installV12(root, `stack:\n  future_service:\n    language: future-lang\ncapabilities:\n  custom_flow: true\nsecurity:\n  profile: ${profile}\n`);
        write(root, 'src/policy.json', '{ deliberately invalid product data');
        write(root, 'src/unsafe-example.js', 'eval(userControlledInput);\n');

        const result = runCli(root, 'doctor');
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Project Configuration\nOK \.sdd\/project\.yaml: profile=(?:standard|off)/);
        assert.match(result.stdout, /Security Policy[\s\S]*OK schema: 28 baseline controls, \d+ stack rulesets, unique IDs/);
        assert.match(result.stdout, /Quality Gates/);
        assert.match(result.stdout, /SDD installation: HEALTHY/);
        assert.doesNotMatch(result.stdout + result.stderr, /unsafe-example|src\/policy|eval\(/);
      });
    });
  }
});

test('doctor accepts a v1.2 legacy config with absent new sections', () => {
  withTemp((root) => {
    const legacy = 'version: 2\nproject:\n  name: "Legacy"\nstack:\n  runtime: "Node.js"\n';
    installV12(root, legacy);

    const result = runCli(root, 'doctor');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /legacy configuration; v1\.1\.x behavior preserved/);
    assert.match(result.stdout, /SDD installation: HEALTHY/);
    const afterDoctor = fs.readFileSync(path.join(root, '.sdd', 'project.yaml'), 'utf8');
    assert.equal(afterDoctor, legacy);
    assert.doesNotMatch(afterDoctor, /security:|capabilities:/);
  });
});

test('doctor reports located stack, capability, and security diagnostics', async (context) => {
  const cases = [
    {
      name: 'invalid stack',
      yaml: 'stack:\n  custom: scalar\ncapabilities: {}\nsecurity:\n  profile: standard\n',
      diagnostic: /INVALID component_mapping_required at \.sdd\/project\.yaml:2/,
    },
    {
      name: 'invalid capability',
      yaml: 'stack: {}\ncapabilities:\n  authentication: yes\nsecurity:\n  profile: standard\n',
      diagnostic: /INVALID capability_boolean_required at \.sdd\/project\.yaml:3/,
    },
    {
      name: 'invalid profile',
      yaml: 'stack: {}\ncapabilities: {}\nsecurity:\n  profile: maximum\n',
      diagnostic: /INVALID invalid_security_profile at \.sdd\/project\.yaml:4/,
    },
  ];

  for (const item of cases) {
    await context.test(item.name, () => {
      withTemp((root) => {
        installV12(root, item.yaml);
        const result = runCli(root, 'doctor');
        assert.equal(result.status, 1);
        assert.match(result.stdout, item.diagnostic);
        assert.match(result.stderr, /project configuration invalid/);
        assert.match(result.stderr, /SDD installation: UNHEALTHY/);
      });
    });
  }
});

test('doctor rejects missing and invalid v1.2 security manifests', async (context) => {
  await context.test('missing baseline', () => {
    withTemp((root) => {
      installV12(root);
      fs.rmSync(path.join(root, installedSecurity, 'baseline.json'));

      const result = runCli(root, 'doctor');
      assert.equal(result.status, 1);
      assert.match(result.stdout, /MISSING security baseline/);
      assert.match(result.stderr, /security policy invalid/);
    });
  });

  await context.test('invalid schema', () => {
    withTemp((root) => {
      installV12(root);
      const baselinePath = path.join(root, installedSecurity, 'baseline.json');
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      baseline.controls[1].id = baseline.controls[0].id;
      fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);

      const result = runCli(root, 'doctor');
      assert.equal(result.status, 1);
      assert.match(result.stdout, /INVALID schema: Invalid or duplicate security control id/);
      assert.match(result.stderr, /security policy invalid/);
    });
  });
});

test('doctor preserves v1.0 and v1.1 check counts and legacy behavior', async (context) => {
  const legacy = 'version: 2\nproject:\n  name: "Legacy"\nstack:\n  runtime: "Node.js"\n';
  for (const item of [
    { version: '1.0.1', checks: 10 },
    { version: '1.1.1', checks: 14 },
  ]) {
    await context.test(item.version, () => {
      withTemp((root) => {
        install(root, item.version, legacy);
        const result = runCli(root, 'doctor');
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, new RegExp(`SDD doctor: OK \\(${item.checks}\\/${item.checks} core checks passed\\)\\.`));
        assert.doesNotMatch(result.stdout, /Project Configuration|Security Policy/);
        assert.equal(fs.readFileSync(path.join(root, '.sdd', 'project.yaml'), 'utf8'), legacy);
      });
    });
  }
});
