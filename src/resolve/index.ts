import { ConfigObject, ConfigOptions } from '../types.js';
import { ReadConfigError } from '../read-config-error.js';
import { replaceVariables } from './replace-variables.js';
import { override } from './override.js';

/**
 * Resolve configuration by applying overrides and variable replacements
 */
export function resolve(
  config: ConfigObject,
  opts: ConfigOptions = {}
): ConfigObject {
  let result = config;
  
  // Step 1: Override with environment variables
  if (opts.override) {
    result = override(opts.override, result, process.env);
  }
  
  // Step 2: Replace environment variables
  if (opts.replaceEnv) {
    result = replaceEnvVariables(result, opts.replaceEnv, opts);
  }
  
  // Step 3: Replace local variables
  if (opts.replaceLocal) {
    result = replaceLocalVariables(result, opts.replaceLocal, opts);
  }
  
  // Step 4: Freeze the result if requested
  if (opts.freeze) {
    result = deepFreeze(result);
  }
  
  return result;
}

/**
 * Replace environment variables in configuration
 */
function replaceEnvVariables(
  config: ConfigObject,
  marker: string | boolean,
  opts: ConfigOptions
): ConfigObject {
  if (!marker) {
    return config;
  }
  
  try {
    const envValues: ConfigObject = {};
    // Convert process.env to ConfigObject
    Object.keys(process.env).forEach(key => {
      envValues[key] = process.env[key];
    });
    
    return replaceVariables(
      String(marker),
      config,
      envValues,
      { skipUnresolved: opts.skipUnresolved }
    ) as ConfigObject;
  } catch (error) {
    throw new ReadConfigError(
      `Could not resolve environment variable. ${(error as Error).message}`,
      'ENV_RESOLUTION_ERROR'
    );
  }
}

/**
 * Replace local variables in configuration
 */
function replaceLocalVariables(
  config: ConfigObject,
  marker: string | boolean,
  opts: ConfigOptions
): ConfigObject {
  if (!marker) {
    return config;
  }
  
  try {
    return replaceVariables(
      String(marker),
      config,
      config,
      { skipUnresolved: opts.skipUnresolved }
    ) as ConfigObject;
  } catch (error) {
    throw new ReadConfigError(
      `Could not resolve local variable. ${(error as Error).message}`,
      'LOCAL_RESOLUTION_ERROR'
    );
  }
}

/**
 * Deep freeze an object to make it immutable
 */
function deepFreeze(obj: ConfigObject): ConfigObject {
  Object.freeze(obj);
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = obj[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value as ConfigObject);
    }
  });
  
  return obj;
}

// Export individual functions for direct use
export { override } from './override.js';
export { replaceVariables } from './replace-variables.js';
export { pick, put } from './deep.js';
export { resolveValue } from './resolve-expression.js';

export default resolve;