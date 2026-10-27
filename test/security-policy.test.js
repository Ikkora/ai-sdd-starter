'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { evaluateSecurity, loadSecurityPolicy } = require('../engine/security');
const { parseProjectConfig } = require('../engine/project-config');

const securityDirectory = path.resolve(__dirname, '..', 'engine', 'security');
const bundle = loadSecurityPolicy();

function config(profile, options = {}) {
  return {
    stack: options.stack || {},
    capabilities: options.capabilities || {},
    security: profile === null
      ? { configured: false, profile: null }
      : { configured: true, profile },
  };
}

function evaluate(profile, options = {}) {
  return evaluateSecurity(
    config(profile, options),
    { mode: options.mode || 'STANDARD', tags: options.tags || [] },
    bundle,
  );
}

function withSecurityCopy(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-security-policy-'));
  const target = path.join(root, 'security');
  fs.cpSync(securityDirectory, target, { recursive: true });
  try {
    return run(target);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

test('loader validates the canonical additive security bundle', () => {
  assert.equal(bundle.policy.manifest_contract.stack_rules_composition, 'additive_to_baseline_never_replace');
  assert.equal(bundle.baseline.normative_domains.length, 25);
  assert.equal(bundle.stack_rules.length, 3);
});

test('evaluation consumes the normalized T02 project model', () => {
  const parsed = parseProjectConfig(`stack:
  backend:
    language: php
capabilities:
  authentication: true
security:
  profile: standard
`);
  const result = evaluateSecurity(parsed, { mode: 'STANDARD', tags: ['sql', 'authentication'] }, bundle);

  assert.equal(parsed.valid, true);
  assert.deepEqual(result.matched_stack_rules, ['php']);
  assert.deepEqual(result.triggers, ['authentication']);
  assert.equal(result.mode.effective, 'STRICT');
});

test('legacy absence and off profile select no controls or elevation', () => {
  const legacy = evaluate(null, { tags: ['authentication'] });
  const off = evaluate('off', { tags: ['authentication'] });

  assert.equal(legacy.status, 'legacy');
  assert.equal(off.status, 'off');
  for (const result of [legacy, off]) {
    assert.equal(result.applicable, false);
    assert.deepEqual(result.controls, []);
    assert.deepEqual(result.triggers, []);
    assert.equal(result.risk_level, null);
    assert.equal(result.mode.effective, 'STANDARD');
    assert.equal(result.mode.elevated, false);
  }
});

test('critical control risk alone cannot elevate without a matched risk surface', () => {
  const result = evaluate('standard', { tags: ['sql'] });

  assert.equal(result.control_risk_level, 'critical');
  assert.equal(result.risk_level, null);
  assert.deepEqual(result.triggers, []);
  assert.equal(result.mode.effective, 'STANDARD');
  assert.equal(result.mode.elevated, false);
  assert.equal(result.review.required, true);
  assert.match(result.mode.reason, /No security risk surface matched/);
});

test('authentication and permissions produce explainable high-risk elevation', () => {
  const authentication = evaluate('standard', { capabilities: { authentication: true }, tags: ['authentication'] });
  const permissions = evaluate('standard', { tags: ['permissions'] });

  assert.deepEqual(authentication.triggers, ['authentication']);
  assert.equal(authentication.risk_level, 'high');
  assert.equal(authentication.mode.effective, 'STRICT');
  assert.equal(authentication.mode.elevated, true);
  assert.match(authentication.mode.reason, /authentication/);

  assert.deepEqual(permissions.triggers, ['authorization']);
  assert.equal(permissions.mode.effective, 'STRICT');
  assert.equal(permissions.control_ids.includes('authorization-per-operation'), true);
});

test('personal data, uploads, and destructive migration map to declared surfaces', () => {
  const personalData = evaluate('standard', { capabilities: { personal_data: true }, tags: ['personal_data'] });
  const uploads = evaluate('standard', { capabilities: { file_uploads: true }, tags: ['file_uploads'] });
  const migration = evaluate('standard', { tags: ['destructive_migration'] });

  assert.deepEqual(personalData.triggers, ['personal_sensitive_data']);
  assert.equal(personalData.control_ids.includes('sensitive-data-lifecycle'), true);
  assert.deepEqual(uploads.triggers, ['file_uploads']);
  assert.equal(uploads.control_ids.includes('untrusted-upload-isolation'), true);
  assert.deepEqual(migration.triggers, ['destructive_migrations']);
  assert.equal(migration.risk_level, 'critical');
  assert.equal(migration.control_ids.includes('migration-data-loss-plan'), true);
});

test('combined triggers are deterministic and deduplicated', () => {
  const result = evaluate('standard', {
    capabilities: { authentication: true, personal_data: true },
    tags: ['authentication', 'permissions', 'personal_data', 'authentication'],
  });

  assert.deepEqual(result.triggers, ['authentication', 'authorization', 'personal_sensitive_data']);
  assert.equal(new Set(result.triggers).size, result.triggers.length);
  assert.equal(result.risk_level, 'high');
});

test('medium external API surface does not cross standard review or elevation thresholds', () => {
  const result = evaluate('standard', { capabilities: { external_apis: true }, tags: ['external_apis'] });

  assert.deepEqual(result.triggers, ['external_apis']);
  assert.equal(result.risk_level, 'medium');
  assert.equal(result.mode.effective, 'STANDARD');
  assert.equal(result.mode.elevated, false);
  assert.equal(result.review.required, false);
  assert.equal(result.review.risk_level, 'medium');
  assert.match(result.mode.reason, /below the high elevation threshold/);
});

test('global authentication capability does not elevate or require review for documentation changes', () => {
  const result = evaluate('standard', {
    capabilities: { authentication: true },
    tags: ['documentation'],
  });

  assert.equal(result.control_ids.includes('authentication-boundary'), true);
  assert.deepEqual(result.triggers, []);
  assert.equal(result.risk_level, null);
  assert.equal(result.mode.effective, 'STANDARD');
  assert.equal(result.mode.elevated, false);
  assert.equal(result.review.required, false);
  assert.equal(result.review.risk_level, null);
});

test('standard documentation change without security surfaces does not require review', () => {
  const result = evaluate('standard', { tags: ['documentation'] });

  assert.deepEqual(result.triggers, []);
  assert.equal(result.risk_level, null);
  assert.equal(result.review.required, false);
  assert.equal(result.mode.effective, 'STANDARD');
});

test('false capabilities do not match risk surfaces or controls', () => {
  const result = evaluate('standard', { capabilities: { authentication: false, file_uploads: false } });

  assert.deepEqual(result.triggers, []);
  assert.equal(result.control_ids.includes('authentication-boundary'), false);
  assert.equal(result.control_ids.includes('untrusted-upload-isolation'), false);
  assert.equal(result.mode.elevated, false);
});

test('stack rules add to baseline and match any component or legacy runtime', () => {
  const php = evaluate('standard', {
    stack: { backend: { language: 'PHP' } },
    tags: ['sql'],
  });
  const nodeLegacy = evaluate('standard', {
    stack: { runtime: 'Node.js' },
    tags: ['child_process'],
  });

  assert.deepEqual(php.matched_stack_rules, ['php']);
  assert.equal(php.control_ids.includes('parameterized-interpreters'), true);
  assert.equal(php.control_ids.includes('php-pdo-bound-parameters'), true);
  assert.deepEqual(nodeLegacy.matched_stack_rules, ['javascript-node']);
  assert.equal(nodeLegacy.control_ids.includes('node-child-process-argument-separation'), true);
});

test('unknown custom language keeps baseline without stack rules', () => {
  const result = evaluate('standard', {
    stack: { compute: { language: 'future-lang' } },
    tags: ['sql'],
  });

  assert.deepEqual(result.matched_stack_rules, []);
  assert.equal(result.control_ids.includes('parameterized-interpreters'), true);
  assert.equal(result.controls.every((control) => control.source === 'baseline'), true);
});

test('strict adds extended controls, lowers review threshold, and requires exceptions', () => {
  const standard = evaluate('standard', { tags: ['security_boundary'] });
  const strict = evaluate('strict', { tags: ['security_boundary'] });

  assert.equal(standard.control_ids.includes('strict-threat-model-evidence'), false);
  assert.equal(strict.control_ids.includes('strict-threat-model-evidence'), true);
  assert.equal(standard.review.threshold, 'high');
  assert.equal(strict.review.threshold, 'medium');
  assert.equal(strict.review.require_explicit_not_applicable, true);
  assert.equal(strict.review.evidence_mode, 'applicable_controls_and_exceptions');
});

test('base STRICT is preserved with a persistible explanation', () => {
  const result = evaluate('standard', { mode: 'STRICT', capabilities: { authentication: true }, tags: ['authentication'] });

  assert.equal(result.mode.base, 'STRICT');
  assert.equal(result.mode.effective, 'STRICT');
  assert.equal(result.mode.elevated, false);
  assert.match(result.mode.reason, /Base mode STRICT is preserved/);
});

test('loader rejects missing control fields and duplicate IDs', () => {
  withSecurityCopy((directory) => {
    const baselinePath = path.join(directory, 'baseline.json');
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    delete baseline.controls[0].recommendation;
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    assert.throws(() => loadSecurityPolicy({ directory }), /missing recommendation/);
  });

  withSecurityCopy((directory) => {
    const phpPath = path.join(directory, 'stack-rules', 'php.json');
    const php = JSON.parse(fs.readFileSync(phpPath, 'utf8'));
    php.rules[0].id = 'credentials-outside-source';
    fs.writeFileSync(phpPath, `${JSON.stringify(php, null, 2)}\n`);
    assert.throws(() => loadSecurityPolicy({ directory }), /duplicate security control id/);
  });
});

test('loader rejects policy drift that weakens strict behavior', () => {
  withSecurityCopy((directory) => {
    const policyPath = path.join(directory, 'policy.json');
    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    policy.profiles.strict.control_tiers = [...policy.profiles.standard.control_tiers];
    fs.writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
    assert.throws(() => loadSecurityPolicy({ directory }), /must add control tiers/);
  });
});

test('loader accepts policy profiles in any JSON key order but no extras', () => {
  withSecurityCopy((directory) => {
    const policyPath = path.join(directory, 'policy.json');
    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    policy.profiles = {
      standard: policy.profiles.standard,
      strict: policy.profiles.strict,
      off: policy.profiles.off,
    };
    fs.writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
    assert.doesNotThrow(() => loadSecurityPolicy({ directory }));

    policy.profiles.custom = policy.profiles.standard;
    fs.writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`);
    assert.throws(() => loadSecurityPolicy({ directory }), /define exactly off, standard, and strict/);
  });
});
