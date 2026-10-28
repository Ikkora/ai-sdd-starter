'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { evaluateSecurity, loadSecurityPolicy } = require('../engine/security');

const fixturePath = path.join(__dirname, 'fixtures', 'security-scenarios.json');
const scenarios = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const bundle = loadSecurityPolicy();

test('inert security scenarios select declared controls without scanning payloads', () => {
  globalThis.__sddSecurityFixtureSideEffect = false;
  try {
    for (const scenario of scenarios) {
      const result = evaluateSecurity(
        {
          stack: scenario.input.stack,
          capabilities: scenario.input.capabilities,
          security: { configured: true, profile: 'standard' },
        },
        { mode: 'STANDARD', tags: scenario.input.tags },
        bundle,
      );

      for (const controlId of scenario.expected.controls) {
        assert.equal(result.control_ids.includes(controlId), true, `${scenario.id}: ${controlId}`);
      }
      assert.deepEqual(result.matched_stack_rules, scenario.expected.stack_rules, `${scenario.id}: stack rules`);
      assert.deepEqual(result.triggers, scenario.expected.triggers, `${scenario.id}: triggers`);
      assert.equal(result.review.required, scenario.expected.review, `${scenario.id}: review`);
      assert.equal(result.mode.effective, scenario.expected.mode, `${scenario.id}: mode`);
      assert.equal(typeof scenario.payload, 'string', `${scenario.id}: inert payload`);
      assert.equal(globalThis.__sddSecurityFixtureSideEffect, false, `${scenario.id}: payload executed`);
    }
  } finally {
    delete globalThis.__sddSecurityFixtureSideEffect;
  }
});

test('off, standard, and strict retain their profile semantics for authorization', () => {
  const scenario = scenarios.find((item) => item.id === 'authorization');
  const results = Object.fromEntries(['off', 'standard', 'strict'].map((profile) => [
    profile,
    evaluateSecurity(
      {
        stack: scenario.input.stack,
        capabilities: scenario.input.capabilities,
        security: { configured: true, profile },
      },
      { mode: 'STANDARD', tags: scenario.input.tags },
      bundle,
    ),
  ]));

  assert.equal(results.off.status, 'off');
  assert.deepEqual(results.off.control_ids, []);
  assert.equal(results.off.review.required, false);
  assert.equal(results.off.mode.effective, 'STANDARD');

  assert.equal(results.standard.control_ids.includes('authorization-per-operation'), true);
  assert.equal(results.standard.control_ids.includes('strict-negative-authorization-cases'), false);
  assert.equal(results.standard.review.required, true);
  assert.equal(results.standard.mode.effective, 'STRICT');

  assert.equal(results.strict.control_ids.includes('strict-negative-authorization-cases'), true);
  assert.equal(results.strict.review.require_explicit_not_applicable, true);
  assert.equal(results.strict.mode.effective, 'STRICT');
});
