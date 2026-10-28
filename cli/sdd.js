#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { version: VERSION } = require('../package.json');
const { inspectOptionalIntegrations, versionAtLeast } = require('../engine/quality-gates');
const { readProjectConfig } = require('../engine/project-config');
const { loadSecurityPolicy } = require('../engine/security');

const distributionRoot = path.resolve(__dirname, '..');
const STACK_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const CAPABILITY_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const SECURITY_PROFILES = new Set(['off', 'standard', 'strict']);
const installedSecurityDirectory = '.agents/skills/sdd/references/security';

const managedFiles = [
  ['templates/install/AGENTS.md', 'AGENTS.md', customizeAgents],
  ['templates/install/.sdd/project.yaml', '.sdd/project.yaml', customizeProject],
  ['templates/install/.sdd/state-template.yaml', '.sdd/state-template.yaml'],
  ['templates/install/.sdd/version', '.sdd/version'],
  ['templates/install/docs/constitution.md', 'docs/constitution.md', customizeProjectName],
  ['templates/install/specs/README.md', 'specs/README.md'],
  ['templates/install/templates/constitution.template.md', 'templates/constitution.template.md', customizeProjectName],
  ['templates/install/templates/plan.template.md', 'templates/plan.template.md'],
  ['templates/install/templates/spec.template.md', 'templates/spec.template.md'],
  ['templates/install/templates/tasks.template.md', 'templates/tasks.template.md'],
  ['templates/install/templates/validation.template.md', 'templates/validation.template.md'],
  ['engine/skill/SKILL.md', '.agents/skills/sdd/SKILL.md'],
  ['engine/skill/references/engine.md', '.agents/skills/sdd/references/engine.md'],
  ['engine/skill/references/quality-gates.md', '.agents/skills/sdd/references/quality-gates.md'],
  ['engine/quality-gates/providers/anti-slop.json', '.agents/skills/sdd/references/quality-gates/providers/anti-slop.json'],
  ['engine/quality-gates/providers/deep-review.json', '.agents/skills/sdd/references/quality-gates/providers/deep-review.json'],
  ['templates/install/.agents/skills/sdd/references/security/policy.json', '.agents/skills/sdd/references/security/policy.json'],
  ['templates/install/.agents/skills/sdd/references/security/baseline.json', '.agents/skills/sdd/references/security/baseline.json'],
  ['templates/install/.agents/skills/sdd/references/security/stack-rules/javascript-node.json', '.agents/skills/sdd/references/security/stack-rules/javascript-node.json'],
  ['templates/install/.agents/skills/sdd/references/security/stack-rules/php.json', '.agents/skills/sdd/references/security/stack-rules/php.json'],
  ['templates/install/.agents/skills/sdd/references/security/stack-rules/python.json', '.agents/skills/sdd/references/security/stack-rules/python.json'],
  ['engine/skills/sdd-deep-review/SKILL.md', '.agents/skills/sdd-deep-review/SKILL.md'],
  ['engine/agents/sdd-planner.toml', '.codex/agents/sdd-planner.toml'],
  ['engine/agents/sdd-implementer.toml', '.codex/agents/sdd-implementer.toml'],
  ['engine/agents/sdd-reviewer.toml', '.codex/agents/sdd-reviewer.toml'],
];

const baseDoctorChecks = [
  ['AGENTS.md', 'AGENTS.md', 'file'],
  ['project.yaml', '.sdd/project.yaml', 'file'],
  ['state template', '.sdd/state-template.yaml', 'file'],
  ['skill', '.agents/skills/sdd/SKILL.md', 'file'],
  ['engine', '.agents/skills/sdd/references/engine.md', 'file'],
  ['planner', '.codex/agents/sdd-planner.toml', 'file'],
  ['implementer', '.codex/agents/sdd-implementer.toml', 'file'],
  ['reviewer', '.codex/agents/sdd-reviewer.toml', 'file'],
  ['specs', 'specs', 'directory'],
  ['constitution', 'docs/constitution.md', 'file'],
];

const qualityGateDoctorChecks = [
  ['quality gates', '.agents/skills/sdd/references/quality-gates.md', 'file'],
  ['Anti-Slop adapter', '.agents/skills/sdd/references/quality-gates/providers/anti-slop.json', 'file'],
  ['Deep Review adapter', '.agents/skills/sdd/references/quality-gates/providers/deep-review.json', 'file'],
  ['Deep Review skill', '.agents/skills/sdd-deep-review/SKILL.md', 'file'],
];

const securityPolicyDoctorChecks = [
  ['security policy directory', installedSecurityDirectory, 'directory'],
  ['security policy', `${installedSecurityDirectory}/policy.json`, 'file'],
  ['security baseline', `${installedSecurityDirectory}/baseline.json`, 'file'],
  ['security stack rules', `${installedSecurityDirectory}/stack-rules`, 'directory'],
  ['JavaScript/Node rules', `${installedSecurityDirectory}/stack-rules/javascript-node.json`, 'file'],
  ['PHP rules', `${installedSecurityDirectory}/stack-rules/php.json`, 'file'],
  ['Python rules', `${installedSecurityDirectory}/stack-rules/python.json`, 'file'],
];

function usageError(message) {
  const error = new Error(message);
  error.showUsage = true;
  return error;
}

function optionValue(argv, index, option) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--') || value.length === 0) {
    throw usageError(`Option ${option} requires a value.`);
  }
  return value;
}

function parseStackOption(value, entries) {
  const separator = value.indexOf('=');
  const target = separator === -1 ? value : value.slice(0, separator);
  const stackValue = separator === -1 ? '' : value.slice(separator + 1);
  const segments = target.split('.');

  if (segments.length !== 2
      || !segments.every((segment) => STACK_KEY_PATTERN.test(segment))
      || stackValue.length === 0) {
    throw usageError('Option --stack must use component.field=value with safe component and field names.');
  }

  const [component, field] = segments;
  const key = `${component}.${field}`;
  if (entries.has(key)) throw usageError(`Duplicate stack entry: ${key}`);
  entries.set(key, { component, field, value: stackValue });
}

function parseCapabilityOption(value, entries) {
  const separator = value.indexOf('=');
  const name = separator === -1 ? value : value.slice(0, separator);
  const capabilityValue = separator === -1 ? '' : value.slice(separator + 1);

  if (!CAPABILITY_KEY_PATTERN.test(name) || (capabilityValue !== 'true' && capabilityValue !== 'false')) {
    throw usageError('Option --capability must use name=true or name=false with a safe name.');
  }
  if (entries.has(name)) throw usageError(`Duplicate capability entry: ${name}`);
  entries.set(name, capabilityValue === 'true');
}

function parseArguments(argv) {
  if (argv.length === 1 && argv[0] === '--version') {
    return { command: 'version' };
  }
  if (argv[0] === 'doctor') {
    if (argv.length !== 1) throw usageError('Command doctor does not accept options.');
    return { command: 'doctor' };
  }
  if (argv[0] !== 'init') {
    throw usageError(argv.length === 0 ? 'Missing command.' : `Unknown command: ${argv[0]}`);
  }

  const options = {
    capabilities: new Map(),
    dryRun: false,
    force: false,
    name: null,
    security: null,
    stack: new Map(),
  };
  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') {
      if (options.dryRun) throw usageError('Duplicate option: --dry-run');
      options.dryRun = true;
    } else if (argument === '--force') {
      if (options.force) throw usageError('Duplicate option: --force');
      options.force = true;
    } else if (argument === '--name') {
      if (options.name !== null) throw usageError('Duplicate option: --name');
      options.name = optionValue(argv, index, '--name');
      index += 1;
    } else if (argument === '--security') {
      if (options.security !== null) throw usageError('Duplicate option: --security');
      const value = optionValue(argv, index, '--security');
      if (!SECURITY_PROFILES.has(value)) {
        throw usageError('Option --security must be off, standard, or strict.');
      }
      options.security = value;
      index += 1;
    } else if (argument === '--stack') {
      parseStackOption(optionValue(argv, index, '--stack'), options.stack);
      index += 1;
    } else if (argument === '--capability') {
      parseCapabilityOption(optionValue(argv, index, '--capability'), options.capabilities);
      index += 1;
    } else {
      throw usageError(`Unknown option: ${argument}`);
    }
  }

  return { command: 'init', ...options };
}

function customizeAgents(content) {
  return content.replaceAll('<ruta configurada>', 'docs/constitution.md');
}

function compareKeys(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function renderStack(entries) {
  if (entries.size === 0) return 'stack: {}';
  const components = new Map();
  for (const entry of entries.values()) {
    if (!components.has(entry.component)) components.set(entry.component, []);
    components.get(entry.component).push(entry);
  }

  const lines = ['stack:'];
  for (const component of [...components.keys()].sort()) {
    lines.push(`  ${component}:`);
    for (const entry of components.get(component).sort((left, right) => compareKeys(left.field, right.field))) {
      lines.push(`    ${entry.field}: ${JSON.stringify(entry.value)}`);
    }
  }
  return lines.join('\n');
}

function renderCapabilities(entries) {
  if (entries.size === 0) return 'capabilities: {}';
  const lines = ['capabilities:'];
  for (const [name, value] of [...entries].sort(([left], [right]) => compareKeys(left, right))) {
    lines.push(`  ${name}: ${value}`);
  }
  return lines.join('\n');
}

function customizeProject(content, context) {
  return content
    .replace('"<project-name>"', () => JSON.stringify(context.projectName))
    .replace('"<path-to-constitution>"', '"docs/constitution.md"')
    .replace('"<path-to-operational-memory>"', 'null')
    .replace('stack: {}', () => renderStack(context.stack))
    .replace('capabilities: {}', renderCapabilities(context.capabilities))
    .replace('profile: standard', `profile: ${context.security || 'standard'}`);
}

function customizeProjectName(content, context) {
  return content.replaceAll('<proyecto>', () => context.projectName);
}

function loadManifest(context) {
  return managedFiles.map(([sourceRelative, destinationRelative, customize]) => {
    const source = path.join(distributionRoot, ...sourceRelative.split('/'));
    let content = fs.readFileSync(source, 'utf8');
    if (customize) content = customize(content, context);
    return {
      content,
      destinationRelative,
    };
  });
}

function inspectDestination(root, item) {
  const destination = path.join(root, ...item.destinationRelative.split('/'));
  let current = root;
  const segments = item.destinationRelative.split('/');

  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { ...item, destination, status: 'create' };
      }
      throw error;
    }

    if (stat.isSymbolicLink()) {
      return { ...item, destination, status: 'unsafe', reason: 'symbolic link' };
    }
    if (index < segments.length - 1 && !stat.isDirectory()) {
      return { ...item, destination, status: 'unsafe', reason: 'parent is not a directory' };
    }
    if (index === segments.length - 1 && !stat.isFile()) {
      return { ...item, destination, status: 'unsafe', reason: 'destination is not a regular file' };
    }
  }

  const existing = fs.readFileSync(destination, 'utf8');
  return { ...item, destination, status: existing === item.content ? 'unchanged' : 'conflict' };
}

function buildPlan(root, context) {
  return loadManifest(context).map((item) => inspectDestination(root, item));
}

function printPlan(root, plan, options) {
  process.stdout.write(`SDD init plan for ${root}\n`);
  for (const item of plan) {
    let action = item.status.toUpperCase();
    if (item.status === 'conflict' && options.force) action = 'REPLACE';
    const reason = item.reason ? ` (${item.reason})` : '';
    process.stdout.write(`${action} ${item.destinationRelative}${reason}\n`);
  }
}

function applyPlan(plan, options) {
  let writes = 0;
  for (const item of plan) {
    if (item.status === 'unchanged') continue;
    if (item.status === 'conflict' && !options.force) continue;

    fs.mkdirSync(path.dirname(item.destination), { recursive: true });
    if (item.status === 'create') {
      fs.writeFileSync(item.destination, item.content, { encoding: 'utf8', flag: 'wx' });
    } else {
      fs.writeFileSync(item.destination, item.content, { encoding: 'utf8', flag: 'w' });
    }
    writes += 1;
  }
  return writes;
}

function runInit(options) {
  const root = process.cwd();
  const projectName = options.name === null ? path.basename(root) : options.name;
  const plan = buildPlan(root, { ...options, projectName });
  printPlan(root, plan, options);

  const unsafe = plan.filter((item) => item.status === 'unsafe');
  if (unsafe.length > 0) {
    process.stderr.write('Init aborted: unsafe managed destinations cannot be replaced.\n');
    process.exitCode = 1;
    return;
  }

  const conflicts = plan.filter((item) => item.status === 'conflict');
  if (conflicts.length > 0 && !options.force) {
    process.stderr.write(`Init aborted: ${conflicts.length} conflict(s) found; no files were written. Use --force to replace managed files.\n`);
    process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    process.stdout.write('Dry run complete: no files were written.\n');
    return;
  }

  const writes = applyPlan(plan, options);
  process.stdout.write(`SDD init complete: ${writes} file(s) written.\n`);
}

function inspectDoctorCheck(root, check) {
  const [label, relative, expectedType] = check;
  const target = path.join(root, ...relative.split('/'));
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') return { label, relative, status: 'MISSING' };
    throw error;
  }

  const valid = !stat.isSymbolicLink()
    && (expectedType === 'file' ? stat.isFile() : stat.isDirectory());
  return { label, relative, status: valid ? 'OK' : 'INVALID' };
}

function inspectManagedDoctorCheck(root, check) {
  const [label, relative, expectedType] = check;
  const segments = relative.split('/');
  let target = root;

  for (let index = 0; index < segments.length; index += 1) {
    target = path.join(target, segments[index]);
    let stat;
    try {
      stat = fs.lstatSync(target);
    } catch (error) {
      if (error.code === 'ENOENT') return { label, relative, status: 'MISSING' };
      throw error;
    }

    if (stat.isSymbolicLink()) return { label, relative, status: 'INVALID' };
    const finalSegment = index === segments.length - 1;
    if (!finalSegment && !stat.isDirectory()) return { label, relative, status: 'INVALID' };
    if (finalSegment) {
      const valid = expectedType === 'file' ? stat.isFile() : stat.isDirectory();
      return { label, relative, status: valid ? 'OK' : 'INVALID' };
    }
  }

  return { label, relative, status: 'INVALID' };
}

function inspectProjectConfiguration(root) {
  let parsed;
  try {
    parsed = readProjectConfig(root);
  } catch (error) {
    return {
      lines: [`INVALID .sdd/project.yaml: ${error.message}`],
      valid: false,
    };
  }

  if (!parsed.valid) {
    return {
      lines: parsed.diagnostics.map((item) => `INVALID ${item.code} at .sdd/project.yaml:${item.line}: ${item.message}`),
      valid: false,
    };
  }

  const description = parsed.compatibility.legacy
    ? 'legacy configuration; v1.1.x behavior preserved'
    : `profile=${parsed.config.security.profile}`;
  return {
    lines: [`OK .sdd/project.yaml: ${description}`],
    valid: true,
  };
}

function inspectSecurityPolicy(root) {
  const results = securityPolicyDoctorChecks.map((check) => inspectManagedDoctorCheck(root, check));
  if (results.some((result) => result.status !== 'OK')) {
    return { results, schema: null, valid: false };
  }

  try {
    const directory = path.join(root, ...installedSecurityDirectory.split('/'));
    const bundle = loadSecurityPolicy({ directory });
    return {
      results,
      schema: `OK schema: ${bundle.baseline.controls.length} baseline controls, ${bundle.stack_rules.length} stack rulesets, unique IDs`,
      valid: true,
    };
  } catch (error) {
    return { results, schema: `INVALID schema: ${error.message}`, valid: false };
  }
}

function readTargetVersion(root) {
  const installedVersion = path.join(root, '.sdd', 'version');
  try {
    return fs.readFileSync(installedVersion, 'utf8').trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (path.resolve(root) === distributionRoot) return VERSION;
  return null;
}

function readProjectYaml(root) {
  try {
    return fs.readFileSync(path.join(root, '.sdd', 'project.yaml'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

function runDoctor() {
  const root = process.cwd();
  const targetVersion = readTargetVersion(root);
  const doctorChecks = versionAtLeast(targetVersion, '1.1.0')
    ? [...baseDoctorChecks, ...qualityGateDoctorChecks]
    : baseDoctorChecks;
  const results = doctorChecks.map((check) => inspectDoctorCheck(root, check));
  const usesV12Doctor = versionAtLeast(targetVersion, '1.2.0');
  const projectConfiguration = usesV12Doctor ? inspectProjectConfiguration(root) : null;
  const securityPolicy = usesV12Doctor ? inspectSecurityPolicy(root) : null;

  process.stdout.write(`SDD doctor for ${root}\n`);
  process.stdout.write('SDD Core\n');
  for (const result of results) {
    process.stdout.write(`${result.status} ${result.label}: ${result.relative}\n`);
  }

  if (usesV12Doctor) {
    process.stdout.write('\nProject Configuration\n');
    for (const line of projectConfiguration.lines) process.stdout.write(`${line}\n`);

    process.stdout.write('\nSecurity Policy\n');
    for (const result of securityPolicy.results) {
      process.stdout.write(`${result.status} ${result.label}: ${result.relative}\n`);
    }
    if (securityPolicy.schema) process.stdout.write(`${securityPolicy.schema}\n`);
  }

  const passed = results.filter((result) => result.status === 'OK').length;
  const integrations = inspectOptionalIntegrations(root, readProjectYaml(root));
  process.stdout.write('\nQuality Gates\n');
  for (const integration of integrations) {
    const mode = `mode=${integration.mode}`;
    if (integration.required_missing) {
      process.stdout.write(`REQUIRED MISSING ${integration.display_name}: ${mode}\n`);
    } else {
      const source = integration.source ? ` (${integration.source})` : '';
      process.stdout.write(`${integration.status} ${integration.display_name}: ${mode}${source}\n`);
    }
  }

  const requiredMissing = integrations.filter((integration) => integration.required_missing);
  const projectConfigurationValid = !usesV12Doctor || projectConfiguration.valid;
  const securityPolicyValid = !usesV12Doctor || securityPolicy.valid;
  if (passed === results.length && projectConfigurationValid && securityPolicyValid && requiredMissing.length === 0) {
    process.stdout.write(`\nSDD doctor: OK (${passed}/${results.length} core checks passed).\n`);
    process.stdout.write('SDD installation: HEALTHY\n');
    return;
  }

  const reasons = [];
  if (passed !== results.length) reasons.push(`${passed}/${results.length} core checks passed`);
  if (!projectConfigurationValid) reasons.push('project configuration invalid');
  if (!securityPolicyValid) reasons.push('security policy invalid');
  if (requiredMissing.length > 0) reasons.push(`${requiredMissing.length} required integration(s) missing`);
  process.stderr.write(`\nSDD doctor: FAILED (${reasons.join('; ')}).\n`);
  process.stderr.write('SDD installation: UNHEALTHY\n');
  process.exitCode = 1;
}

function main() {
  try {
    const request = parseArguments(process.argv.slice(2));
    if (request.command === 'version') {
      process.stdout.write(`${VERSION}\n`);
    } else if (request.command === 'doctor') {
      runDoctor();
    } else {
      runInit(request);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    if (error.showUsage) {
      process.stderr.write('Usage: sdd init [--name <name>] [--security <off|standard|strict>] [--stack <component.field=value>]... [--capability <name=true|false>]... [--dry-run] [--force] | sdd doctor | sdd --version\n');
    }
    process.exitCode = 1;
  }
}

main();
