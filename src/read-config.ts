import * as _ from 'lodash';
import { accessSync } from 'fs';
import { ConfigObject, ConfigOptions, ConfigCallback } from './types.js';
import { ReadConfigError } from './read-config-error.js';
import { loadAsync, loadSync } from './load/index.js';
import { resolve } from './resolve/index.js';

/**
 * Default configuration options
 */
const DEFAULT_OPTIONS: Partial<ConfigOptions> = {
  parentField: '__parent',
  basedir: '.',
  replaceEnv: '%',
  replaceLocal: '@',
  skipUnresolved: false,
  freeze: false
};

/**
 * Load configuration asynchronously (default export - modern API)
 * @param paths Path or array of paths to configuration files
 * @param opts Configuration options
 * @returns Promise that resolves to the loaded configuration
 */
export async function readConfig(
  paths: string | string[],
  opts: ConfigOptions = {}
): Promise<ConfigObject> {
  const mergedOpts = mergeOptions(opts);
  
  // Validate parameters
  const validationError = validateParams(paths, mergedOpts);
  if (validationError) {
    throw validationError;
  }
  
  // Load configuration
  const config = await loadAsync(paths, mergedOpts);
  
  // Resolve variables and apply overrides
  return resolve(config, mergedOpts);
}

/**
 * Load configuration synchronously
 * @param paths Path or array of paths to configuration files
 * @param opts Configuration options
 * @returns The loaded configuration
 */
export function readConfigSync(
  paths: string | string[],
  opts: ConfigOptions = {}
): ConfigObject {
  const mergedOpts = mergeOptions(opts);
  
  // Validate parameters
  const validationError = validateParams(paths, mergedOpts);
  if (validationError) {
    throw validationError;
  }
  
  // Load configuration
  const config = loadSync(paths, mergedOpts);
  
  // Resolve variables and apply overrides
  return resolve(config, mergedOpts);
}

/**
 * Load configuration with callback (legacy API)
 * @param paths Path or array of paths to configuration files
 * @param opts Configuration options or callback
 * @param callback Callback function
 */
export function readConfigCallback(
  paths: string | string[],
  opts?: ConfigOptions | ConfigCallback,
  callback?: ConfigCallback
): void {
  // Handle overloaded parameters
  if (typeof opts === 'function' && !callback) {
    callback = opts;
    opts = {};
  }
  
  if (!callback) {
    throw new ReadConfigError('Callback is required for callback API');
  }
  
  const finalOpts = mergeOptions((opts as ConfigOptions) || {});
  
  // Validate parameters
  const validationError = validateParams(paths, finalOpts);
  if (validationError) {
    return callback(validationError);
  }
  
  // Load configuration asynchronously
  readConfig(paths, finalOpts)
    .then(config => callback(null, config))
    .catch(error => callback(error));
}

/**
 * Validate input parameters
 */
function validateParams(
  paths: string | string[],
  opts: ConfigOptions
): ReadConfigError | null {
  if (typeof paths !== 'string' && !Array.isArray(paths)) {
    return ReadConfigError.validationError(
      'Expected a string (or array) with configuration file path'
    );
  }
  
  if (opts.replaceLocal && opts.replaceEnv && 
      String(opts.replaceLocal) === String(opts.replaceEnv)) {
    return ReadConfigError.validationError(
      'Values opts.replaceLocal and opts.replaceEnv must be different'
    );
  }
  
  if (opts.basedir) {
    const basedirs = Array.isArray(opts.basedir) ? opts.basedir : [opts.basedir];
    for (const basedir of basedirs) {
      try {
        accessSync(basedir);
      } catch {
        return ReadConfigError.validationError(
          `Base directory not found: ${basedir}`
        );
      }
    }
  }
  
  return null;
}

/**
 * Merge user options with defaults
 */
function mergeOptions(opts: ConfigOptions): ConfigOptions {
  return _.merge({}, DEFAULT_OPTIONS, opts) as ConfigOptions;
}

// Named exports for modern usage
export {
  readConfig as default,
  readConfig as async,
  readConfigSync as sync,
  readConfigCallback as callback
};

// Additional exports
export { ConfigObject, ConfigOptions, ConfigCallback } from './types.js';
export { ReadConfigError } from './read-config-error.js';

// Create a namespace for backward compatibility
const readConfigNamespace = Object.assign(readConfig, {
  async: readConfig,
  sync: readConfigSync,
  callback: readConfigCallback,
  ReadConfigError
});

// Export the namespace as both default and named
export { readConfigNamespace };