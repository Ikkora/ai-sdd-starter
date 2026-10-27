'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SECURITY_DIRECTORY = __dirname;
const SUPPORTED_APPLICABILITY_KEYS = new Set(['always', 'any_capabilities', 'any_change_tags']);
const SUPPORTED_PROFILES = ['off', 'standard', 'strict'];
const SUPPORTED_RISK_ORDER = ['low', 'medium', 'high', 'critical'];
const SUPPORTED_SEMANTICS = {
  non_empty_applicability_selectors: 'any',
  capabilities_match_only_when_true: true,
  always_true_short_circuits: true,
  stack_rules_match: 'any_component_any_selector',
  control_risk_purpose: 'prioritization_review_and_evidence_only',
  control_risk_aggregation: 'highest_applicable_for_review',
  mode_elevation_source: 'matched_risk_surfaces_only',
  elevation_risk_aggregation: 'highest_matched_risk_surface',
  duplicate_triggers: 'deduplicate',
};

function readJsonFile(target) {
  const stat = fs.lstatSync(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Security manifest is not a regular file: ${target}`);
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON security manifest ${target}: ${error.message}`);
  }
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
}

function requireStringArray(value, label, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`${label} must be ${allowEmpty ? 'a' : 'a non-empty'} string array.`);
  }
}

function validatePolicy(policy) {
  requireObject(policy, 'policy');
  if (policy.schema_version !== 1) throw new Error('Unsupported security policy schema_version.');
  requireObject(policy.manifest_contract, 'policy.manifest_contract');
  requireStringArray(policy.manifest_contract.control_required_fields, 'policy.manifest_contract.control_required_fields');
  requireStringArray(policy.manifest_contract.applicability_keys, 'policy.manifest_contract.applicability_keys');
  if (JSON.stringify(policy.manifest_contract.applicability_keys) !== JSON.stringify([...SUPPORTED_APPLICABILITY_KEYS])) {
    throw new Error('Unsupported applicability key contract.');
  }
  if (policy.manifest_contract.stack_rules_composition !== 'additive_to_baseline_never_replace') {
    throw new Error('Unsupported stack rules composition policy.');
  }
  if (policy.manifest_contract.unknown_stack_behavior !== 'baseline_only') {
    throw new Error('Unsupported unknown stack behavior.');
  }

  requireObject(policy.evaluation_semantics, 'policy.evaluation_semantics');
  if (JSON.stringify(Object.keys(policy.evaluation_semantics).sort()) !== JSON.stringify(Object.keys(SUPPORTED_SEMANTICS).sort())) {
    throw new Error('Security evaluation semantics contain unsupported or missing fields.');
  }
  for (const [key, expected] of Object.entries(SUPPORTED_SEMANTICS)) {
    if (policy.evaluation_semantics[key] !== expected) throw new Error(`Unsupported security evaluation semantic: ${key}.`);
  }

  requireStringArray(policy.risk_order, 'policy.risk_order');
  if (JSON.stringify(policy.risk_order) !== JSON.stringify(SUPPORTED_RISK_ORDER)) throw new Error('Unsupported security risk order.');
  requireObject(policy.profiles, 'policy.profiles');
  const profileNames = Object.keys(policy.profiles);
  if (profileNames.length !== SUPPORTED_PROFILES.length || SUPPORTED_PROFILES.some((name) => !profileNames.includes(name))) {
    throw new Error('Security policy must define exactly off, standard, and strict profiles.');
  }

  for (const profileName of SUPPORTED_PROFILES) {
    const profile = policy.profiles[profileName];
    requireObject(profile, `policy.profiles.${profileName}`);
    if (typeof profile.enabled !== 'boolean') throw new Error(`policy.profiles.${profileName}.enabled must be boolean.`);
    requireStringArray(profile.control_tiers, `policy.profiles.${profileName}.control_tiers`, profileName === 'off');
    for (const field of ['minimum_review_risk', 'minimum_elevation_risk']) {
      if (profile[field] !== null && !policy.risk_order.includes(profile[field])) {
        throw new Error(`policy.profiles.${profileName}.${field} has an invalid risk.`);
      }
    }
    if (typeof profile.require_explicit_not_applicable !== 'boolean') {
      throw new Error(`policy.profiles.${profileName}.require_explicit_not_applicable must be boolean.`);
    }
    if (typeof profile.evidence_mode !== 'string' || profile.evidence_mode === '') {
      throw new Error(`policy.profiles.${profileName}.evidence_mode must be a string.`);
    }
  }
  const off = policy.profiles.off;
  const standard = policy.profiles.standard;
  const strict = policy.profiles.strict;
  if (off.enabled || off.control_tiers.length > 0 || off.minimum_review_risk !== null || off.minimum_elevation_risk !== null) {
    throw new Error('The off security profile must disable controls, review, and elevation.');
  }
  if (!standard.enabled || !strict.enabled) throw new Error('Standard and strict security profiles must be enabled.');
  if (!standard.control_tiers.every((tier) => strict.control_tiers.includes(tier)) || strict.control_tiers.length <= standard.control_tiers.length) {
    throw new Error('The strict security profile must add control tiers to standard.');
  }
  if (policy.risk_order.indexOf(strict.minimum_review_risk) >= policy.risk_order.indexOf(standard.minimum_review_risk)) {
    throw new Error('The strict security profile must lower the review threshold.');
  }
  if (!strict.require_explicit_not_applicable || standard.require_explicit_not_applicable) {
    throw new Error('Only the strict security profile must require explicit not-applicable evidence.');
  }

  requireObject(policy.elevation, 'policy.elevation');
  requireStringArray(policy.elevation.allowed_base_modes, 'policy.elevation.allowed_base_modes');
  if (policy.elevation.target_mode !== 'STRICT' || policy.elevation.requires_applicable_surface !== true || policy.elevation.preserve_stricter_mode !== true) {
    throw new Error('Unsupported elevation policy.');
  }

  if (!Array.isArray(policy.risk_surfaces)) throw new Error('policy.risk_surfaces must be an array.');
  const surfaceIds = new Set();
  for (const surface of policy.risk_surfaces) {
    requireObject(surface, 'risk surface');
    if (typeof surface.id !== 'string' || surface.id === '' || surfaceIds.has(surface.id)) throw new Error(`Invalid or duplicate risk surface id: ${surface.id}.`);
    surfaceIds.add(surface.id);
    if (!policy.risk_order.includes(surface.risk)) throw new Error(`Invalid risk for surface ${surface.id}.`);
    requireStringArray(surface.capabilities, `risk surface ${surface.id} capabilities`, true);
    requireStringArray(surface.change_tags, `risk surface ${surface.id} change_tags`, true);
    if (surface.capabilities.length === 0 && surface.change_tags.length === 0) throw new Error(`Risk surface ${surface.id} has no selectors.`);
  }
}

function validateApplicability(applicability, label, allowedKeys) {
  requireObject(applicability, `${label}.applies_when`);
  const keys = Object.keys(applicability);
  if (keys.length === 0) throw new Error(`${label}.applies_when cannot be empty.`);
  for (const key of keys) {
    if (!allowedKeys.has(key)) throw new Error(`${label}.applies_when uses unsupported key ${key}.`);
    if (key === 'always') {
      if (typeof applicability.always !== 'boolean') throw new Error(`${label}.applies_when.always must be boolean.`);
    } else {
      requireStringArray(applicability[key], `${label}.applies_when.${key}`);
    }
  }
}

function validateControl(control, label, bundle, controlIds) {
  requireObject(control, label);
  for (const field of bundle.policy.manifest_contract.control_required_fields) {
    if (!(field in control)) throw new Error(`${label} is missing ${field}.`);
  }
  if (typeof control.id !== 'string' || control.id === '' || controlIds.has(control.id)) throw new Error(`Invalid or duplicate security control id: ${control.id}.`);
  controlIds.add(control.id);
  for (const field of ['title', 'category', 'recommendation']) {
    if (typeof control[field] !== 'string' || control[field].trim() === '') throw new Error(`${label}.${field} must be a non-empty string.`);
  }
  requireStringArray(control.domains, `${label}.domains`);
  for (const domain of control.domains) {
    if (!bundle.baseline.normative_domains.includes(domain)) throw new Error(`${label} references unknown domain ${domain}.`);
  }
  const tiers = new Set(Object.values(bundle.policy.profiles).flatMap((profile) => profile.control_tiers));
  if (!tiers.has(control.tier)) throw new Error(`${label} has invalid tier ${control.tier}.`);
  if (!bundle.policy.risk_order.includes(control.risk)) throw new Error(`${label} has invalid risk ${control.risk}.`);
  requireStringArray(control.evidence, `${label}.evidence`);
  validateApplicability(control.applies_when, label, new Set(bundle.policy.manifest_contract.applicability_keys));
}

function validateBundle(bundle) {
  validatePolicy(bundle.policy);
  requireObject(bundle.baseline, 'baseline');
  if (bundle.baseline.schema_version !== 1 || bundle.baseline.kind !== 'security_baseline') throw new Error('Invalid security baseline header.');
  requireStringArray(bundle.baseline.normative_domains, 'baseline.normative_domains');
  if (new Set(bundle.baseline.normative_domains).size !== bundle.baseline.normative_domains.length) throw new Error('baseline.normative_domains contains duplicates.');
  if (!Array.isArray(bundle.baseline.controls)) throw new Error('baseline.controls must be an array.');

  const controlIds = new Set();
  bundle.baseline.controls.forEach((control, index) => validateControl(control, `baseline.controls[${index}]`, bundle, controlIds));
  const coveredDomains = new Set(bundle.baseline.controls.flatMap((control) => control.domains));
  const uncoveredDomains = bundle.baseline.normative_domains.filter((domain) => !coveredDomains.has(domain));
  if (uncoveredDomains.length > 0) throw new Error(`Baseline does not cover domains: ${uncoveredDomains.join(', ')}.`);

  const rulesetIds = new Set();
  for (const ruleset of bundle.stack_rules) {
    requireObject(ruleset, 'stack ruleset');
    if (ruleset.schema_version !== 1 || ruleset.kind !== 'stack_rules') throw new Error(`Invalid stack ruleset header: ${ruleset.id}.`);
    if (typeof ruleset.id !== 'string' || ruleset.id === '' || rulesetIds.has(ruleset.id)) throw new Error(`Invalid or duplicate stack ruleset id: ${ruleset.id}.`);
    rulesetIds.add(ruleset.id);
    if (!Array.isArray(ruleset.selectors) || ruleset.selectors.length === 0) throw new Error(`Stack ruleset ${ruleset.id} requires selectors.`);
    for (const selector of ruleset.selectors) {
      requireObject(selector, `stack ruleset ${ruleset.id} selector`);
      if (typeof selector.field !== 'string' || selector.field === '') throw new Error(`Stack ruleset ${ruleset.id} selector field is invalid.`);
      requireStringArray(selector.values, `stack ruleset ${ruleset.id} selector values`);
    }
    if (!Array.isArray(ruleset.rules) || ruleset.rules.length === 0) throw new Error(`Stack ruleset ${ruleset.id} requires rules.`);
    ruleset.rules.forEach((control, index) => validateControl(control, `${ruleset.id}.rules[${index}]`, bundle, controlIds));
  }
  return bundle;
}

function loadSecurityPolicy(options = {}) {
  const directory = path.resolve(options.directory || SECURITY_DIRECTORY);
  const rulesDirectory = path.join(directory, 'stack-rules');
  const rulesStat = fs.lstatSync(rulesDirectory);
  if (!rulesStat.isDirectory() || rulesStat.isSymbolicLink()) throw new Error(`Security stack rules path is unsafe: ${rulesDirectory}`);

  const bundle = {
    policy: readJsonFile(path.join(directory, 'policy.json')),
    baseline: readJsonFile(path.join(directory, 'baseline.json')),
    stack_rules: fs.readdirSync(rulesDirectory)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => readJsonFile(path.join(rulesDirectory, name))),
  };
  return validateBundle(bundle);
}

function normalizedSet(values) {
  return new Set((values || []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function applicabilityMatch(applicability, capabilities, tags) {
  if (applicability.always === true) return { matched: true, matched_by: ['always'] };
  const matchedBy = [];
  if (Array.isArray(applicability.any_capabilities) && applicability.any_capabilities.length > 0) {
    if (applicability.any_capabilities.some((name) => capabilities[name] === true)) matchedBy.push('capability');
  }
  if (Array.isArray(applicability.any_change_tags) && applicability.any_change_tags.length > 0) {
    if (applicability.any_change_tags.some((tag) => tags.has(String(tag).toLowerCase()))) matchedBy.push('change_tag');
  }
  return { matched: matchedBy.length > 0, matched_by: matchedBy };
}

function selectorMatchesStack(selector, stack) {
  const expected = normalizedSet(selector.values);
  for (const [componentName, component] of Object.entries(stack || {})) {
    if (component && typeof component === 'object' && !Array.isArray(component)) {
      if (Object.prototype.hasOwnProperty.call(component, selector.field) && expected.has(String(component[selector.field]).trim().toLowerCase())) return true;
    } else if (componentName === selector.field && component !== null && expected.has(String(component).trim().toLowerCase())) {
      return true;
    }
  }
  return false;
}

function highestRisk(values, riskOrder) {
  let highest = null;
  let highestIndex = -1;
  for (const value of values) {
    const index = riskOrder.indexOf(value);
    if (index > highestIndex) {
      highest = value;
      highestIndex = index;
    }
  }
  return highest;
}

function riskAtLeast(value, threshold, riskOrder) {
  if (value === null || threshold === null) return false;
  return riskOrder.indexOf(value) >= riskOrder.indexOf(threshold);
}

function inactiveResult(profile, status, baseMode, reason) {
  return {
    profile,
    status,
    applicable: false,
    risk_level: null,
    control_risk_level: null,
    triggers: [],
    matched_stack_rules: [],
    controls: [],
    control_ids: [],
    review: {
      required: false,
      risk_level: null,
      threshold: null,
      evidence_mode: 'none',
      require_explicit_not_applicable: false,
    },
    mode: { base: baseMode, effective: baseMode, elevated: false, reason },
  };
}

function evaluateSecurity(projectConfig, context = {}, bundle = loadSecurityPolicy()) {
  const config = projectConfig && projectConfig.config ? projectConfig.config : projectConfig;
  requireObject(config, 'project config');
  const security = config.security || { configured: false, profile: null };
  const baseMode = String(context.mode || 'STANDARD').toUpperCase();
  const knownModes = new Set([...bundle.policy.elevation.allowed_base_modes, bundle.policy.elevation.target_mode]);
  if (!knownModes.has(baseMode)) throw new Error(`Unsupported SDD mode: ${baseMode}.`);

  if (!security.configured || security.profile === null || security.profile === undefined) {
    return inactiveResult(null, 'legacy', baseMode, 'Security profile absent; v1.1.x behavior is preserved.');
  }

  const profileName = String(security.profile).toLowerCase();
  const profile = bundle.policy.profiles[profileName];
  if (!profile) throw new Error(`Unsupported security profile: ${security.profile}.`);
  if (!profile.enabled) return inactiveResult(profileName, 'off', baseMode, 'Security profile off; SDD-specific security controls and elevation are disabled.');

  const tags = normalizedSet(context.tags);
  const capabilities = config.capabilities || {};
  const tiers = new Set(profile.control_tiers);
  const controls = [];

  for (const control of bundle.baseline.controls) {
    const match = applicabilityMatch(control.applies_when, capabilities, tags);
    if (tiers.has(control.tier) && match.matched) {
      controls.push({ ...control, source: 'baseline', ruleset: null, matched_by: match.matched_by });
    }
  }

  const matchedStackRules = [];
  for (const ruleset of bundle.stack_rules) {
    if (!ruleset.selectors.some((selector) => selectorMatchesStack(selector, config.stack || {}))) continue;
    matchedStackRules.push(ruleset.id);
    for (const control of ruleset.rules) {
      const match = applicabilityMatch(control.applies_when, capabilities, tags);
      if (tiers.has(control.tier) && match.matched) {
        controls.push({ ...control, source: 'stack_rule', ruleset: ruleset.id, matched_by: match.matched_by });
      }
    }
  }

  const matchedSurfaces = [];
  for (const surface of bundle.policy.risk_surfaces) {
    const tagMatch = surface.change_tags.some((tag) => tags.has(String(tag).toLowerCase()));
    if (tagMatch) matchedSurfaces.push(surface);
  }

  const triggers = [...new Set(matchedSurfaces.map((surface) => surface.id))];
  const riskLevel = highestRisk(matchedSurfaces.map((surface) => surface.risk), bundle.policy.risk_order);
  const controlRisk = highestRisk(controls.map((control) => control.risk), bundle.policy.risk_order);
  const tagRelevantControlRisk = highestRisk(
    controls.filter((control) => control.matched_by.includes('change_tag')).map((control) => control.risk),
    bundle.policy.risk_order,
  );
  const reviewRisk = highestRisk([tagRelevantControlRisk, riskLevel].filter(Boolean), bundle.policy.risk_order);
  const reviewRequired = riskAtLeast(reviewRisk, profile.minimum_review_risk, bundle.policy.risk_order);
  const shouldElevate = triggers.length > 0
    && riskAtLeast(riskLevel, profile.minimum_elevation_risk, bundle.policy.risk_order)
    && bundle.policy.elevation.allowed_base_modes.includes(baseMode);

  let effectiveMode = baseMode;
  let elevated = false;
  let reason;
  if (baseMode === bundle.policy.elevation.target_mode) {
    reason = triggers.length > 0
      ? `Base mode STRICT is preserved; matched security surfaces: ${triggers.join(', ')}.`
      : 'Base mode STRICT is preserved; no security risk surface matched.';
  } else if (shouldElevate) {
    effectiveMode = bundle.policy.elevation.target_mode;
    elevated = true;
    reason = `Elevated ${baseMode} to STRICT because ${riskLevel}-risk security surfaces matched: ${triggers.join(', ')}.`;
  } else if (triggers.length === 0) {
    reason = `No security risk surface matched; mode remains ${baseMode}.`;
  } else {
    reason = `Matched ${riskLevel}-risk security surfaces below the ${profile.minimum_elevation_risk} elevation threshold: ${triggers.join(', ')}.`;
  }

  return {
    profile: profileName,
    status: 'evaluated',
    applicable: controls.length > 0,
    risk_level: riskLevel,
    control_risk_level: controlRisk,
    triggers,
    matched_stack_rules: matchedStackRules,
    controls,
    control_ids: controls.map((control) => control.id),
    review: {
      required: reviewRequired,
      risk_level: reviewRisk,
      threshold: profile.minimum_review_risk,
      evidence_mode: profile.evidence_mode,
      require_explicit_not_applicable: profile.require_explicit_not_applicable,
    },
    mode: { base: baseMode, effective: effectiveMode, elevated, reason },
  };
}

module.exports = {
  evaluateSecurity,
  loadSecurityPolicy,
  validateBundle,
};
