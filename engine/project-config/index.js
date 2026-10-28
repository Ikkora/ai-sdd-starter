'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TARGET_SECTIONS = new Set(['stack', 'capabilities', 'security']);
const LEGACY_STACK_KEYS = new Set(['application', 'runtime', 'database', 'frontend']);
const SECURITY_PROFILES = new Set(['off', 'standard', 'strict']);
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

function defineEntry(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function hasEntry(target, key) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

function diagnostic(code, message, line, configPath) {
  return { code, message, line, path: configPath };
}

function stripInlineComment(value) {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (inDouble) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inSingle) {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        inSingle = false;
      }
      continue;
    }

    if (character === '"') {
      inDouble = true;
    } else if (character === "'") {
      inSingle = true;
    } else if (character === '#' && (index === 0 || /\s/.test(value[index - 1]))) {
      return { text: value.slice(0, index).trimEnd(), unterminatedQuote: false };
    }
  }

  return { text: value.trimEnd(), unterminatedQuote: inSingle || inDouble };
}

function splitEntry(content) {
  const separator = content.indexOf(':');
  if (separator === -1) return null;
  const key = content.slice(0, separator).trim();
  if (!KEY_PATTERN.test(key)) return null;
  return { key, rawValue: content.slice(separator + 1).trim() };
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value === '') return { kind: 'missing' };

  if (value.startsWith('[') || value.startsWith('{') || value === '|' || value === '>' || value.startsWith('- ')) {
    return { kind: 'unsupported_structure' };
  }

  if (value.startsWith('"')) {
    if (!value.endsWith('"') || value.length === 1) return { kind: 'invalid_quote' };
    try {
      return { kind: 'scalar', value: JSON.parse(value) };
    } catch {
      return { kind: 'invalid_quote' };
    }
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length === 1) return { kind: 'invalid_quote' };
    const inner = value.slice(1, -1);
    if (inner.replaceAll("''", '').includes("'")) return { kind: 'invalid_quote' };
    return { kind: 'scalar', value: inner.replaceAll("''", "'") };
  }

  if (/:\s/.test(value)) return { kind: 'plain_scalar_requires_quotes' };

  if (/(^|\s)(?:[&*][A-Za-z0-9_.-]+|!{1,2}[^\s]+)(?=\s|$)/.test(value)) {
    return { kind: 'unsafe_yaml_feature' };
  }

  const normalized = value.toLowerCase();
  if (normalized === 'null' || value === '~') return { kind: 'scalar', value: null };
  if (normalized === 'true') return { kind: 'scalar', value: true };
  if (normalized === 'false') return { kind: 'scalar', value: false };
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return { kind: 'scalar', value: Number(value) };

  return { kind: 'scalar', value };
}

function parseProjectConfig(projectYaml, options = {}) {
  const configPath = options.path || '.sdd/project.yaml';
  const lines = String(projectYaml || '').split(/\r?\n/);
  const stack = {};
  const capabilities = {};
  const security = { configured: false, profile: null };
  const sections = { stack: false, capabilities: false, security: false };
  const diagnostics = [];
  let currentSection = null;
  let currentComponent = null;
  let emptySection = null;
  let securityProfileDeclared = false;

  function addDiagnostic(code, message, line) {
    diagnostics.push(diagnostic(code, message, line, configPath));
  }

  function parseLineScalar(rawValue, line, fieldPath) {
    const parsed = parseScalar(rawValue);
    if (parsed.kind === 'unsupported_structure') {
      addDiagnostic('unsupported_structure', `${fieldPath} only accepts a scalar or null.`, line);
      return null;
    }
    if (parsed.kind === 'unsafe_yaml_feature') {
      addDiagnostic('unsafe_yaml_feature', `${fieldPath} cannot use YAML tags, anchors, or references.`, line);
      return null;
    }
    if (parsed.kind === 'invalid_quote') {
      addDiagnostic('invalid_quote', `${fieldPath} contains an invalid quoted scalar.`, line);
      return null;
    }
    if (parsed.kind === 'plain_scalar_requires_quotes') {
      addDiagnostic('plain_scalar_requires_quotes', `${fieldPath} contains a colon followed by whitespace and must be quoted.`, line);
      return null;
    }
    return parsed;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const lineNumber = index + 1;
    if (/^\s*(?:#.*)?$/.test(rawLine)) continue;

    const indentText = rawLine.match(/^[ \t]*/)[0];
    const indent = indentText.replaceAll('\t', '  ').length;
    const rawContent = rawLine.slice(indentText.length);

    if (indent === 0) {
      currentComponent = null;
      emptySection = null;
      const stripped = stripInlineComment(rawContent);
      const topLevel = splitEntry(stripped.text);
      if (!topLevel || !TARGET_SECTIONS.has(topLevel.key)) {
        currentSection = null;
        continue;
      }

      currentSection = topLevel.key;
      if (sections[currentSection]) {
        addDiagnostic('duplicate_section', `Duplicate ${currentSection} section.`, lineNumber);
      }
      sections[currentSection] = true;
      if (currentSection === 'security') security.configured = true;

      if (stripped.unterminatedQuote) {
        addDiagnostic('invalid_quote', `${currentSection} contains an unterminated quote.`, lineNumber);
      }

      if (topLevel.rawValue === '') continue;
      if ((currentSection === 'stack' || currentSection === 'capabilities') && topLevel.rawValue === '{}') {
        emptySection = currentSection;
        currentSection = null;
        continue;
      }
      addDiagnostic('unsupported_section_value', `${currentSection} must be a block mapping${currentSection === 'security' ? '' : ' or an empty map'}.`, lineNumber);
      currentSection = null;
      continue;
    }

    if (!currentSection) {
      if (emptySection) {
        addDiagnostic('empty_map_has_children', `${emptySection} is declared as an empty map and cannot contain child entries.`, lineNumber);
      }
      continue;
    }

    if (indentText.includes('\t')) {
      addDiagnostic('unsupported_indentation', `${currentSection} cannot use tab indentation.`, lineNumber);
      continue;
    }

    const stripped = stripInlineComment(rawContent);
    if (stripped.unterminatedQuote) {
      addDiagnostic('invalid_quote', `${currentSection} contains an unterminated quote.`, lineNumber);
      continue;
    }
    const content = stripped.text.trimEnd();
    if (content.startsWith('- ')) {
      addDiagnostic('unsupported_sequence', `${currentSection} does not accept sequences.`, lineNumber);
      continue;
    }
    const entry = splitEntry(content);
    if (!entry) {
      addDiagnostic('invalid_mapping_entry', `Invalid ${currentSection} mapping entry.`, lineNumber);
      continue;
    }

    if (currentSection === 'stack') {
      if (indent === 2) {
        currentComponent = null;
        if (hasEntry(stack, entry.key)) {
          addDiagnostic('duplicate_key', `Duplicate stack.${entry.key}.`, lineNumber);
          continue;
        }
        if (entry.rawValue === '') {
          const component = {};
          defineEntry(stack, entry.key, component);
          currentComponent = entry.key;
          continue;
        }
        if (!LEGACY_STACK_KEYS.has(entry.key)) {
          addDiagnostic('component_mapping_required', `stack.${entry.key} must be a component mapping.`, lineNumber);
          continue;
        }
        const parsed = parseLineScalar(entry.rawValue, lineNumber, `stack.${entry.key}`);
        if (parsed && parsed.kind === 'scalar') defineEntry(stack, entry.key, parsed.value);
        continue;
      }

      if (indent === 4) {
        if (!currentComponent || !hasEntry(stack, currentComponent) || typeof stack[currentComponent] !== 'object' || stack[currentComponent] === null) {
          addDiagnostic('property_without_component', `stack.${entry.key} is not inside a component mapping.`, lineNumber);
          continue;
        }
        if (hasEntry(stack[currentComponent], entry.key)) {
          addDiagnostic('duplicate_key', `Duplicate stack.${currentComponent}.${entry.key}.`, lineNumber);
          continue;
        }
        if (entry.rawValue === '') {
          addDiagnostic('nested_mapping_not_supported', `stack.${currentComponent}.${entry.key} cannot contain a nested mapping.`, lineNumber);
          continue;
        }
        const parsed = parseLineScalar(entry.rawValue, lineNumber, `stack.${currentComponent}.${entry.key}`);
        if (parsed && parsed.kind === 'scalar') defineEntry(stack[currentComponent], entry.key, parsed.value);
        continue;
      }

      addDiagnostic('unsupported_nesting', 'stack only accepts components at indent 2 and scalar properties at indent 4.', lineNumber);
      continue;
    }

    if (currentSection === 'capabilities') {
      if (indent !== 2) {
        addDiagnostic('unsupported_nesting', 'capabilities only accepts boolean entries at indent 2.', lineNumber);
        continue;
      }
      if (hasEntry(capabilities, entry.key)) {
        addDiagnostic('duplicate_key', `Duplicate capabilities.${entry.key}.`, lineNumber);
        continue;
      }
      const parsed = parseLineScalar(entry.rawValue, lineNumber, `capabilities.${entry.key}`);
      if (!parsed) continue;
      if (parsed.kind !== 'scalar' || typeof parsed.value !== 'boolean') {
        addDiagnostic('capability_boolean_required', `capabilities.${entry.key} must be true or false.`, lineNumber);
        continue;
      }
      defineEntry(capabilities, entry.key, parsed.value);
      continue;
    }

    if (currentSection === 'security') {
      if (indent !== 2) {
        addDiagnostic('unsupported_nesting', 'security only accepts profile at indent 2.', lineNumber);
        continue;
      }
      if (entry.key !== 'profile') {
        addDiagnostic('unsupported_security_property', `Unsupported security property: ${entry.key}.`, lineNumber);
        continue;
      }
      if (securityProfileDeclared) {
        addDiagnostic('duplicate_key', 'Duplicate security.profile.', lineNumber);
        continue;
      }
      securityProfileDeclared = true;
      const parsed = parseLineScalar(entry.rawValue, lineNumber, 'security.profile');
      if (!parsed) continue;
      if (parsed.kind !== 'scalar' || typeof parsed.value !== 'string' || !SECURITY_PROFILES.has(parsed.value.toLowerCase())) {
        addDiagnostic('invalid_security_profile', 'security.profile must be off, standard, or strict.', lineNumber);
        continue;
      }
      security.profile = parsed.value.toLowerCase();
    }
  }

  if (sections.security && !securityProfileDeclared) {
    diagnostics.push(diagnostic('security_profile_required', 'security.profile is required when the security section exists.', lines.length || 1, configPath));
  }

  const stackKeys = Object.keys(stack);
  const legacyStack = stackKeys.every((key) => LEGACY_STACK_KEYS.has(key) && (stack[key] === null || typeof stack[key] !== 'object'));
  const legacy = !sections.capabilities && !sections.security && (!sections.stack || legacyStack);

  return {
    valid: diagnostics.length === 0,
    config: { stack, capabilities, security },
    compatibility: { legacy },
    sections,
    diagnostics,
  };
}

function readProjectConfig(root) {
  const resolvedRoot = path.resolve(root);
  const managedSegments = [
    { name: '.sdd', type: 'directory' },
    { name: 'project.yaml', type: 'file' },
  ];
  let current = resolvedRoot;
  const rootStat = fs.lstatSync(current);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error(`Unsafe project root: ${current}`);
  }

  for (const segment of managedSegments) {
    current = path.join(current, segment.name);
    const stat = fs.lstatSync(current);
    const validType = segment.type === 'directory' ? stat.isDirectory() : stat.isFile();
    if (!validType || stat.isSymbolicLink()) {
      throw new Error(`Unsafe managed project config path: ${current}`);
    }
  }

  const descriptor = fs.openSync(current, 'r');
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile()) throw new Error(`Project config is not a regular file: ${current}`);
    return parseProjectConfig(fs.readFileSync(descriptor, 'utf8'), { path: current });
  } finally {
    fs.closeSync(descriptor);
  }
}

module.exports = {
  parseProjectConfig,
  readProjectConfig,
};
