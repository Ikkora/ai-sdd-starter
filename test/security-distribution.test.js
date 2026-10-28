'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const cli = path.join(repositoryRoot, 'cli', 'sdd.js');
const canonicalRoot = path.join(repositoryRoot, 'engine', 'security');
const templateRoot = path.join(repositoryRoot, 'templates', 'install', '.agents', 'skills', 'sdd', 'references', 'security');
const repositoryInstalledRoot = path.join(repositoryRoot, '.agents', 'skills', 'sdd', 'references', 'security');

function manifestInventory(root, current = '') {
  const directory = current === '' ? root : path.join(root, ...current.split('/'));
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = current === '' ? entry.name : `${current}/${entry.name}`;
    if (entry.isDirectory()) {
      result.push(...manifestInventory(root, relative));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      result.push(relative);
    }
  }
  return result.sort();
}

function runCli(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function withTemp(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-security-distribution-'));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

test('canonical, template, and repository-installed security manifests are byte-identical', () => {
  const inventory = manifestInventory(canonicalRoot);
  for (const required of [
    'baseline.json',
    'policy.json',
    'stack-rules/javascript-node.json',
    'stack-rules/php.json',
    'stack-rules/python.json',
  ]) {
    assert.equal(inventory.includes(required), true, `missing required v1.2 manifest: ${required}`);
  }
  assert.deepEqual(manifestInventory(templateRoot), inventory);
  assert.deepEqual(manifestInventory(repositoryInstalledRoot), inventory);

  for (const relative of inventory) {
    const canonical = fs.readFileSync(path.join(canonicalRoot, ...relative.split('/')));
    assert.deepEqual(fs.readFileSync(path.join(templateRoot, ...relative.split('/'))), canonical, `template ${relative}`);
    assert.deepEqual(fs.readFileSync(path.join(repositoryInstalledRoot, ...relative.split('/'))), canonical, `installed ${relative}`);
  }
});

test('init installs the complete byte-identical inventory and doctor validates it as v1.2', () => {
  withTemp((root) => {
    const initialized = runCli(root, 'init', '--name', 'Security Distribution');
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.match(initialized.stdout, /SDD init complete: 25 file\(s\) written/);

    const installedRoot = path.join(root, '.agents', 'skills', 'sdd', 'references', 'security');
    const inventory = manifestInventory(canonicalRoot);
    assert.deepEqual(manifestInventory(installedRoot), inventory);
    for (const relative of inventory) {
      assert.deepEqual(
        fs.readFileSync(path.join(installedRoot, ...relative.split('/'))),
        fs.readFileSync(path.join(canonicalRoot, ...relative.split('/'))),
        relative,
      );
    }

    fs.writeFileSync(path.join(root, '.sdd', 'version'), '1.2.0\n');
    const doctor = runCli(root, 'doctor');
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.match(doctor.stdout, /Security Policy[\s\S]*OK schema: \d+ baseline controls, \d+ stack rulesets, unique IDs/);
    assert.match(doctor.stdout, /SDD installation: HEALTHY/);
  });
});

test('distribution adds no runtime dependency and package inventory already includes both roots', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.dependencies === undefined || Object.keys(packageJson.dependencies).length === 0, true);
  assert.equal(packageJson.files.includes('engine/'), true);
  assert.equal(packageJson.files.includes('templates/install/'), true);
});
