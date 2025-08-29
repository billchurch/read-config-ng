import { ConfigObject, ConfigValue } from '../types.js';
import { resolveValue } from './resolve-expression.js';

interface ResolveOptions {
  skipUnresolved?: boolean;
}

/**
 * Replace variables in configuration with resolved values
 */
export function replaceVariables(
  marker: string,
  config: ConfigValue,
  values: ConfigObject,
  opts: ResolveOptions = {}
): ConfigValue {
  return resolve('', config, marker, values, opts);
}

/**
 * Recursively resolve variables in configuration
 */
function resolve(
  prop: string,
  config: ConfigValue,
  marker: string,
  values: ConfigObject,
  opts: ResolveOptions
): ConfigValue {
  if (typeof config === 'string') {
    // Resolve string expressions
    return resolveValue(prop, config, marker, values, opts);
  } else if (Array.isArray(config)) {
    // Resolve array elements
    const result: ConfigValue[] = [];
    const propPrefix = prop.length ? prop + '.' : '';
    
    config.forEach((item, idx) => {
      result.push(resolve(propPrefix + idx, item, marker, values, opts));
    });
    
    return result;
  } else if (typeof config === 'object' && config !== null) {
    // Resolve object properties
    const result: ConfigObject = {};
    const propPrefix = prop.length ? prop + '.' : '';
    
    Object.keys(config).forEach(key => {
      result[key] = resolve(propPrefix + key, (config as ConfigObject)[key], marker, values, opts);
    });
    
    return result;
  } else {
    // Return primitive values as-is
    return config;
  }
}

export default replaceVariables;