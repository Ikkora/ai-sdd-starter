'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { parseProjectConfig, readProjectConfig } = require('../engine/project-config');

function withTemp(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-project-config-'));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

test('empty config is valid legacy configuration', () => {
  const result = parseProjectConfig('');
  assert.equal(result.valid, true);
  assert.deepEqual(result.config.stack, {});
  assert.deepEqual(result.config.capabilities, {});
  assert.deepEqual(result.config.security, { configured: false, profile: null });
  assert.equal(result.compatibility.legacy, true);
});

test('legacy stack remains valid and unrelated quality_gates syntax is ignored', () => {
  const result = parseProjectConfig(`version: 2
stack:
  application: "CLI SDD"
  runtime: Node.js
  database: null
  frontend: ~
quality_gates:
  deep_review:
    mode: auto
    run_on: [STANDARD, STRICT]
`);

  assert.equal(result.valid, true);
  assert.deepEqual(result.config.stack, {
    application: 'CLI SDD',
    runtime: 'Node.js',
    database: null,
    frontend: null,
  });
  assert.equal(result.compatibility.legacy, true);
});

test('custom stack components, scalar properties, capabilities, and strict profile normalize', () => {
  const result = parseProjectConfig(`stack:
  api_service:
    language: "custom#lang" # preserved hash inside quotes
    version: '2.1'
    framework: null
    build_number: 7
  worker-custom:
    runtime: "Acme: Core"
    concurrent: true
  database:
    engine: custom-db
capabilities:
  authentication: true
  custom_flow: false
security:
  profile: STRICT # normalized
`);

  assert.equal(result.valid, true);
  assert.deepEqual(result.config.stack, {
    api_service: {
      language: 'custom#lang',
      version: '2.1',
      framework: null,
      build_number: 7,
    },
    'worker-custom': {
      runtime: 'Acme: Core',
      concurrent: true,
    },
    database: { engine: 'custom-db' },
  });
  assert.deepEqual(result.config.capabilities, { authentication: true, custom_flow: false });
  assert.deepEqual(result.config.security, { configured: true, profile: 'strict' });
  assert.equal(result.compatibility.legacy, false);
});

test('empty stack and capabilities maps are valid for a new standard installation', () => {
  const result = parseProjectConfig('stack: {}\ncapabilities: {}\nsecurity:\n  profile: standard\n');
  assert.equal(result.valid, true);
  assert.deepEqual(result.config.stack, {});
  assert.deepEqual(result.config.capabilities, {});
  assert.deepEqual(result.config.security, { configured: true, profile: 'standard' });
  assert.equal(result.compatibility.legacy, false);
});

test('unsupported values and nesting produce located diagnostics', () => {
  const result = parseProjectConfig(`stack:
  custom: scalar
  backend:
    language: [php, python]
    options:
      nested: value
capabilities:
  authentication: "true"
  jobs:
    enabled: true
security:
  profile: maximum
`, { path: 'fixture/project.yaml' });

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.diagnostics.map(({ code, line, path: configPath }) => ({ code, line, path: configPath })),
    [
      { code: 'component_mapping_required', line: 2, path: 'fixture/project.yaml' },
      { code: 'unsupported_structure', line: 4, path: 'fixture/project.yaml' },
      { code: 'nested_mapping_not_supported', line: 5, path: 'fixture/project.yaml' },
      { code: 'unsupported_nesting', line: 6, path: 'fixture/project.yaml' },
      { code: 'capability_boolean_required', line: 8, path: 'fixture/project.yaml' },
      { code: 'capability_boolean_required', line: 9, path: 'fixture/project.yaml' },
      { code: 'unsupported_nesting', line: 10, path: 'fixture/project.yaml' },
      { code: 'invalid_security_profile', line: 12, path: 'fixture/project.yaml' },
    ],
  );
});

test('sequences, tags, anchors, and references are rejected without execution', () => {
  globalThis.__sddConfigExecuted = false;
  const result = parseProjectConfig(`stack:
  backend:
    language: !custom javascript:globalThis.__sddConfigExecuted=true
    version: &release 8.3
    framework: *release
capabilities:
  - authentication
security:
  profile: !!js/function standard
`);

  assert.equal(result.valid, false);
  assert.equal(globalThis.__sddConfigExecuted, false);
  assert.deepEqual(
    result.diagnostics.map((item) => item.code),
    [
      'unsafe_yaml_feature',
      'unsafe_yaml_feature',
      'unsafe_yaml_feature',
      'unsupported_sequence',
      'unsafe_yaml_feature',
    ],
  );
  delete globalThis.__sddConfigExecuted;
});

test('duplicate entries and malformed quotes are diagnosed', () => {
  const result = parseProjectConfig(`stack:
  backend:
    language: php
    language: python
capabilities:
  auth: true
  auth: false
security:
  profile: "standard
`);

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.diagnostics.map((item) => item.code),
    ['duplicate_key', 'duplicate_key', 'invalid_quote', 'security_profile_required'],
  );
});

test('single quoted scalars require YAML-style doubled quotes', () => {
  const valid = parseProjectConfig("stack:\n  backend:\n    framework: 'Owner''s Framework'\n");
  const invalid = parseProjectConfig("stack:\n  backend:\n    framework: 'Owner's Framework'\n");

  assert.equal(valid.valid, true);
  assert.equal(valid.config.stack.backend.framework, "Owner's Framework");
  assert.equal(invalid.valid, false);
  assert.equal(invalid.diagnostics[0].code, 'invalid_quote');
  assert.equal(invalid.diagnostics[0].line, 3);
});

test('plain scalars with colon followed by whitespace require quotes', () => {
  const result = parseProjectConfig('stack:\n  backend:\n    framework: Acme: Core\n');

  assert.equal(result.valid, false);
  assert.deepEqual(result.diagnostics[0], {
    code: 'plain_scalar_requires_quotes',
    message: 'stack.backend.framework contains a colon followed by whitespace and must be quoted.',
    line: 3,
    path: '.sdd/project.yaml',
  });
});

test('plain scalar hashes remain content unless preceded by whitespace', () => {
  const result = parseProjectConfig(`stack:
  compiler:
    language: C#
    revision: sha#fragment
    note: value # comment
`);

  assert.equal(result.valid, true, JSON.stringify(result.diagnostics));
  assert.deepEqual(result.config.stack.compiler, {
    language: 'C#',
    revision: 'sha#fragment',
    note: 'value',
  });
});

test('empty stack and capabilities maps reject child entries', () => {
  const result = parseProjectConfig(`stack: {}
  backend:
capabilities: {}
  authentication: true
`);

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.diagnostics.map(({ code, line }) => ({ code, line })),
    [
      { code: 'empty_map_has_children', line: 2 },
      { code: 'empty_map_has_children', line: 4 },
    ],
  );
});

test('dynamic keys do not mutate object prototypes', () => {
  const result = parseProjectConfig(`stack:
  __proto__:
    language: custom
capabilities:
  __proto__: true
security:
  profile: off
`);

  assert.equal(result.valid, true);
  assert.equal(Object.prototype.language, undefined);
  assert.equal(result.config.stack.__proto__.language, 'custom');
  assert.equal(result.config.capabilities.__proto__, true);
});

test('readProjectConfig reads only the fixed regular project config path', () => {
  withTemp((root) => {
    const configDirectory = path.join(root, '.sdd');
    fs.mkdirSync(configDirectory);
    fs.writeFileSync(path.join(configDirectory, 'project.yaml'), 'security:\n  profile: off\n');

    const result = readProjectConfig(root);
    assert.equal(result.valid, true);
    assert.equal(result.config.security.profile, 'off');
    assert.equal(result.diagnostics.length, 0);
  });
});

test('readProjectConfig rejects a linked managed parent without reading its target', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-project-root-'));
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-project-external-'));
  try {
    fs.writeFileSync(path.join(external, 'project.yaml'), 'security:\n  profile: off\n');
    try {
      fs.symlinkSync(external, path.join(root, '.sdd'), process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      if (['EACCES', 'EPERM', 'UNKNOWN'].includes(error.code)) {
        context.skip(`Host cannot create a directory link: ${error.code}`);
        return;
      }
      throw error;
    }

    assert.throws(
      () => readProjectConfig(root),
      /Unsafe managed project config path/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
    fs.rmSync(external, { recursive: true, force: true, maxRetries: 3 });
  }
});
