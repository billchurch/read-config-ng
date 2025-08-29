import * as path from 'path';
import { pick } from './deep';
import { ReadConfigError } from '../read-config-error';
import { ConfigObject, ConfigValue } from '../types';

interface ResolveOptions {
  skipUnresolved?: boolean;
}

/**
 * Resolve a value that may contain variable expressions
 */
export function resolveValue(
  prop: string,
  value: string,
  marker: string,
  values: ConfigObject,
  opts: ResolveOptions = {}
): ConfigValue {
  const escapedMarker = escapeRegExp(marker);
  const fullFieldRegexp = new RegExp(`^\\ *${escapedMarker}{\\ *([^${escapedMarker}}]+)\\ *}\\ *$`);
  const partialFieldRegexp = new RegExp(`${escapedMarker}{\\ *([^${escapedMarker}}]+)\\ *}`, 'g');
  const expressionCheckRegexp = new RegExp(`${escapedMarker}{\\ *([^${escapedMarker}}]+)\\ *}`, 'g');
  
  const partialFieldReplacer = (_match: string, expression: string): string => {
    const resolved = resolveExpression(prop, expression, values, opts);
    if (typeof resolved === 'object') {
      return JSON.stringify(resolved);
    }
    return String(resolved ?? '');
  };

  let result: ConfigValue = value;
  
  while (expressionCheckRegexp.test(String(result))) {
    // Reset lastIndex after test
    expressionCheckRegexp.lastIndex = 0;
    
    const fullFieldMatch = fullFieldRegexp.exec(value);
    if (fullFieldMatch !== null && fullFieldMatch.length > 1) {
      result = resolveExpression(prop, fullFieldMatch[1]!, values, opts);
    } else {
      result = value.replace(partialFieldRegexp, partialFieldReplacer);
    }
  }
  
  return result;
}

/**
 * Resolve a single expression (e.g., "path.to.value|defaultValue")
 */
function resolveExpression(
  prop: string,
  expression: string,
  values: ConfigObject,
  opts: ResolveOptions
): ConfigValue {
  const exprChunks = expression.split('|');
  const exprValue = exprChunks[0]?.trim() || '';
  const exprDefValue = exprChunks.length > 1 && exprChunks[1] ? exprChunks[1] : null;
  const resolvedProp = resolveRelativeProperty(prop, exprValue);
  const pickResult = pick(values, resolvedProp);
  
  if (pickResult) {
    return pickResult.value;
  } else if (exprDefValue !== null) {
    return castDefaultValue(exprDefValue);
  } else if (!opts.skipUnresolved) {
    throw new ReadConfigError(`Unresolved configuration variable: ${expression}`, 'RESOLUTION_ERROR');
  } else {
    return `NOTFOUND: ${resolvedProp}`;
  }
}

/**
 * Cast a default value string to its appropriate type
 */
function castDefaultValue(value: string): ConfigValue {
  const trimmed = value.trim();
  
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  } else if (/^\d*\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  } else if (trimmed.toLowerCase() === 'true') {
    return true;
  } else if (trimmed.toLowerCase() === 'false') {
    return false;
  } else if (trimmed === 'undefined') {
    return undefined;
  } else if (trimmed === 'null') {
    return null;
  }
  
  return value;
}

/**
 * Resolve relative property paths (e.g., "./sibling", "../parent")
 */
function resolveRelativeProperty(propPath: string, relPath: string): string {
  // If not a relative path, return as-is
  if (!relPath.startsWith('./') && !relPath.startsWith('../')) {
    return relPath;
  }
  
  // Normalize the relative path
  let normalizedPath = relPath;
  if (relPath.startsWith('./')) {
    normalizedPath = `../${relPath}`;
  } else if (relPath.startsWith('../')) {
    normalizedPath = `../${relPath}`;
  }
  
  // Convert dots to slashes for path resolution
  const propAsPath = propPath.replace(/\./g, '/');
  const resolved = path.join(propAsPath, normalizedPath);
  
  // Convert back to dot notation
  return resolved
    .replace(/\\/g, '.')
    .replace(/\//g, '.');
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}