'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MODES = new Set(['off', 'auto', 'required']);
const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

function providerDirectory() {
  return path.join(__dirname, 'providers');
}

function loadProviderManifests() {
  return fs.readdirSync(providerDirectory())
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(providerDirectory(), name), 'utf8')));
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineList(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (inner === '') return [];
  return inner.split(',').map((item) => parseScalar(item)).filter(Boolean);
}

function readQualityGateConfig(projectYaml) {
  const lines = projectYaml.split(/\r?\n/);
  const providers = {};
  let inQualityGates = false;
  let currentProvider = null;
  let collectingRunOn = false;

  for (const rawLine of lines) {
    if (/^\s*(#.*)?$/.test(rawLine)) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();

    if (indent === 0) {
      if (line === 'quality_gates:') {
        inQualityGates = true;
        currentProvider = null;
        collectingRunOn = false;
        continue;
      }
      if (inQualityGates) break;
      continue;
    }

    if (!inQualityGates) continue;

    if (indent === 2 && /^[A-Za-z0-9_-]+:\s*$/.test(line)) {
      currentProvider = line.slice(0, -1);
      providers[currentProvider] = providers[currentProvider] || {};
      collectingRunOn = false;
      continue;
    }

    if (!currentProvider) continue;

    if (indent === 4 && line.startsWith('mode:')) {
      const mode = parseScalar(line.slice('mode:'.length)).toLowerCase();
      providers[currentProvider].mode = MODES.has(mode) ? mode : mode;
      collectingRunOn = false;
      continue;
    }

    if (indent === 4 && line.startsWith('run_on:')) {
      const rawValue = line.slice('run_on:'.length);
      const inline = parseInlineList(rawValue);
      if (inline !== null) {
        providers[currentProvider].run_on = inline.map((item) => item.toUpperCase());
        collectingRunOn = false;
      } else {
        providers[currentProvider].run_on = [];
        collectingRunOn = true;
      }
      continue;
    }

    if (collectingRunOn && indent >= 6 && line.startsWith('- ')) {
      providers[currentProvider].run_on.push(parseScalar(line.slice(2)).toUpperCase());
      continue;
    }

    if (indent <= 4) collectingRunOn = false;
  }

  return providers;
}

function normalizeAvailabilityOverride(value) {
  if (value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'available'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'unavailable', 'not_available'].includes(normalized)) return false;
  return null;
}

function existsRegularFile(target) {
  try {
    const stat = fs.lstatSync(target);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function inspectMarker(root, marker) {
  const target = path.join(root, ...marker.path.split('/'));
  if (!existsRegularFile(target)) return false;
  return fs.readFileSync(target, 'utf8').includes(marker.contains);
}

function detectProvider(root, manifest, options = {}) {
  const env = options.env || process.env;
  const availabilityEnv = typeof manifest.detection.availability_env === 'string'
    ? manifest.detection.availability_env.trim()
    : '';
  const override = availabilityEnv === '' ? null : normalizeAvailabilityOverride(env[availabilityEnv]);
  if (override !== null) {
    return {
      available: override,
      status: override ? 'AVAILABLE' : 'NOT DETECTED',
      source: `env:${availabilityEnv}`,
    };
  }

  for (const relative of manifest.detection.project_paths || []) {
    if (existsRegularFile(path.join(root, ...relative.split('/')))) {
      return { available: true, status: 'AVAILABLE', source: `project:${relative}` };
    }
  }

  for (const marker of manifest.detection.project_markers || []) {
    if (inspectMarker(root, marker)) {
      return { available: true, status: 'AVAILABLE', source: `marker:${marker.path}` };
    }
  }

  const home = options.homeDir || os.homedir();
  for (const relative of manifest.detection.home_paths || []) {
    if (existsRegularFile(path.join(home, ...relative.split('/')))) {
      return { available: true, status: 'AVAILABLE', source: `home:${relative}` };
    }
  }

  return { available: false, status: 'NOT DETECTED', source: null };
}

function normalizeMode(value) {
  const normalized = String(value || 'off').toLowerCase();
  if (!MODES.has(normalized)) throw new Error(`Invalid quality gate mode: ${value}`);
  return normalized;
}

function isApplicable(manifest, config, context) {
  const mode = String(context.mode || 'STANDARD').toUpperCase();
  const runOn = Array.isArray(config.run_on) && config.run_on.length > 0
    ? config.run_on.map((item) => String(item).toUpperCase())
    : manifest.default_run_on;
  if (!runOn.includes(mode)) return false;

  const tags = new Set((context.tags || []).map((tag) => String(tag).toLowerCase()));
  const excluded = (manifest.applicability.exclude_tags || []).some((tag) => tags.has(tag.toLowerCase()));
  if (excluded) return false;

  const anyTags = manifest.applicability.any_tags || [];
  if (anyTags.length === 0) return Boolean(manifest.applicability.default);
  if (anyTags.some((tag) => tags.has(tag.toLowerCase()))) return true;
  return Boolean(manifest.applicability.default);
}

function evaluateProvider(manifest, config = {}, context = {}, detection = { available: false }) {
  const mode = normalizeMode(config.mode || 'off');
  if (mode === 'off') {
    return { provider: manifest.id, mode, applicability: false, availability: detection.available, status: 'off', should_run: false, blocking: false };
  }

  const applicability = isApplicable(manifest, config, context);
  if (!applicability) {
    return { provider: manifest.id, mode, applicability: false, availability: detection.available, status: 'not_applicable', should_run: false, blocking: false };
  }

  if (!detection.available) {
    if (mode === 'required') {
      return { provider: manifest.id, mode, applicability: true, availability: false, status: 'await_human_setup', should_run: false, blocking: true };
    }
    return { provider: manifest.id, mode, applicability: true, availability: false, status: 'not_available', should_run: false, blocking: false };
  }

  return { provider: manifest.id, mode, applicability: true, availability: true, status: 'pending_run', should_run: true, blocking: false };
}

function normalizeFinding(provider, raw = {}) {
  const severity = String(raw.severity || 'medium').toLowerCase();
  const normalizedSeverity = SEVERITIES.has(severity) ? severity : 'medium';
  const category = String(raw.category || 'general').trim() || 'general';
  const location = raw.location === undefined || raw.location === null ? null : String(raw.location);
  const summary = String(raw.summary || '').trim();
  const evidence = raw.evidence === undefined || raw.evidence === null ? null : String(raw.evidence).trim();
  const recommendation = raw.recommendation === undefined || raw.recommendation === null ? null : String(raw.recommendation).trim();
  const fingerprint = createHash('sha256')
    .update([category.toLowerCase(), location || '', summary.toLowerCase()].join('\n'))
    .digest('hex')
    .slice(0, 12);
  return {
    id: `qg-${fingerprint}`,
    providers: [provider],
    category,
    severity: normalizedSeverity,
    location,
    summary,
    evidence,
    recommendation,
    blocking: raw.blocking === true || normalizedSeverity === 'critical',
  };
}

function severityRank(value) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[value] || 2;
}

function consolidateFindings(findings) {
  const consolidated = new Map();
  for (const finding of findings) {
    const key = [finding.category.toLowerCase(), finding.location || '', finding.summary.toLowerCase()].join('\n');
    const existing = consolidated.get(key);
    if (!existing) {
      consolidated.set(key, { ...finding, providers: [...finding.providers] });
      continue;
    }
    existing.providers = [...new Set([...existing.providers, ...finding.providers])];
    if (severityRank(finding.severity) > severityRank(existing.severity)) existing.severity = finding.severity;
    existing.blocking = existing.blocking || finding.blocking;
    if (!existing.evidence && finding.evidence) existing.evidence = finding.evidence;
    if (existing.evidence && finding.evidence && !existing.evidence.includes(finding.evidence)) {
      existing.evidence = `${existing.evidence}\n\n${finding.evidence}`;
    }
    if (!existing.recommendation && finding.recommendation) existing.recommendation = finding.recommendation;
  }
  return [...consolidated.values()];
}

function correctionPolicy(findings) {
  const critical = findings.some((finding) => {
    if (finding.severity !== 'critical') return false;
    const category = String(finding.category || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return ['security', 'data_corruption', 'data_integrity', 'data_loss', 'corruption'].includes(category);
  });
  return {
    normal_round_limit: 1,
    planned_rounds: findings.length === 0 ? 0 : 1,
    recheck: findings.length === 0 ? 'not_required' : 'focal',
    critical_override: critical,
  };
}

function versionAtLeast(version, minimum) {
  const parse = (value) => String(value || '0.0.0').trim().split('.').map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(version);
  const right = parse(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) return true;
    if (left[index] < right[index]) return false;
  }
  return true;
}

function inspectOptionalIntegrations(root, projectYaml, options = {}) {
  const configs = readQualityGateConfig(projectYaml || '');
  return loadProviderManifests().map((manifest) => {
    const detection = detectProvider(root, manifest, options);
    const config = configs[manifest.id] || {};
    const mode = normalizeMode(config.mode || 'off');
    return {
      id: manifest.id,
      display_name: manifest.display_name,
      mode,
      available: detection.available,
      status: detection.status,
      source: detection.source,
      required_missing: mode === 'required' && !detection.available,
    };
  });
}

module.exports = {
  consolidateFindings,
  correctionPolicy,
  detectProvider,
  evaluateProvider,
  inspectOptionalIntegrations,
  isApplicable,
  loadProviderManifests,
  normalizeFinding,
  normalizeMode,
  readQualityGateConfig,
  versionAtLeast,
};
