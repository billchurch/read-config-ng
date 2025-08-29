import * as path from 'path';
import { ConfigObject, ConfigOptions } from '../types.js';
import { ReadConfigError } from '../read-config-error.js';
import { mergeConfigs } from './merge-configs.js';
import { load, loadSync } from './parse/index.js';
import { resolvePath, resolvePathSync } from './resolve-path.js';

/**
 * Merge a configuration file with its parent hierarchy asynchronously
 */
export async function mergeParents(
  configPath: string,
  opts: ConfigOptions = {}
): Promise<ConfigObject> {
  const basedirs = Array.isArray(opts.basedir) ? opts.basedir : [opts.basedir || '.'];
  const configResolvedPath = await resolvePath(configPath, basedirs);
  
  if (!configResolvedPath) {
    if (isOptional(configPath, opts)) {
      return {};
    }
    throw configNotFound(configPath);
  }
  
  return mergeParentsRecursive(configResolvedPath, opts);
}

/**
 * Merge a configuration file with its parent hierarchy synchronously
 */
export function mergeParentsSync(
  configPath: string,
  opts: ConfigOptions = {}
): ConfigObject {
  const basedirs = Array.isArray(opts.basedir) ? opts.basedir : [opts.basedir || '.'];
  const configResolvedPath = resolvePathSync(configPath, basedirs);
  
  if (!configResolvedPath) {
    if (isOptional(configPath, opts)) {
      return {};
    }
    throw configNotFound(configPath);
  }
  
  return mergeParentsSyncRecursive(configResolvedPath, opts);
}

/**
 * Recursively merge parent configurations asynchronously
 */
async function mergeParentsRecursive(
  configPath: string,
  opts: ConfigOptions
): Promise<ConfigObject> {
  const config = await loadConfig(configPath, opts);
  const parentField = typeof opts.parentField === 'string' ? opts.parentField : '__parent';
  
  if (!opts.parentField || !config[parentField]) {
    return config;
  }
  
  const parentPathValue = config[parentField] as string;
  const basedirs = generateBasedirs(configPath, opts);
  const parentPath = await resolvePath(parentPathValue, basedirs);
  
  let parentConfig: ConfigObject = {};
  
  if (!parentPath) {
    if (!isOptional(parentPathValue, opts)) {
      throw parentConfigNotFound(parentPathValue, configPath);
    }
  } else {
    parentConfig = await mergeParentsRecursive(parentPath, opts);
  }
  
  const result = mergeConfigs([parentConfig, config]);
  delete result[parentField];
  
  return result;
}

/**
 * Recursively merge parent configurations synchronously
 */
function mergeParentsSyncRecursive(
  configPath: string,
  opts: ConfigOptions
): ConfigObject {
  const config = loadConfigSync(configPath, opts);
  const parentField = typeof opts.parentField === 'string' ? opts.parentField : '__parent';
  
  if (!opts.parentField || !config[parentField]) {
    return config;
  }
  
  const parentPathValue = config[parentField] as string;
  const basedirs = generateBasedirs(configPath, opts);
  const parentPath = resolvePathSync(parentPathValue, basedirs);
  
  let parentConfig: ConfigObject = {};
  
  if (!parentPath) {
    if (!isOptional(parentPathValue, opts)) {
      throw parentConfigNotFound(parentPathValue, configPath);
    }
  } else {
    parentConfig = mergeParentsSyncRecursive(parentPath, opts);
  }
  
  const result = mergeConfigs([parentConfig, config]);
  delete result[parentField];
  
  return result;
}

/**
 * Load a configuration file asynchronously
 */
async function loadConfig(
  configPath: string,
  opts: ConfigOptions
): Promise<ConfigObject> {
  const basedirs = Array.isArray(opts.basedir) ? opts.basedir : [opts.basedir || '.'];
  const configResolvedPath = await resolvePath(configPath, basedirs);
  
  if (!configResolvedPath) {
    if (isOptional(configPath, opts)) {
      return {};
    }
    throw configNotFound(configPath);
  }
  
  return await load(configResolvedPath);
}

/**
 * Load a configuration file synchronously
 */
function loadConfigSync(
  configPath: string,
  opts: ConfigOptions
): ConfigObject {
  const basedirs = Array.isArray(opts.basedir) ? opts.basedir : [opts.basedir || '.'];
  const configResolvedPath = resolvePathSync(configPath, basedirs);
  
  if (!configResolvedPath) {
    if (isOptional(configPath, opts)) {
      return {};
    }
    throw configNotFound(configPath);
  }
  
  return loadSync(configResolvedPath);
}

/**
 * Check if a configuration path is optional
 */
function isOptional(configPath: string, opts: ConfigOptions): boolean {
  let optional = opts.optional;
  
  if (!optional) {
    return false;
  }
  
  const optionalPaths = Array.isArray(optional) ? optional : [optional];
  
  if (optionalPaths.indexOf(configPath) >= 0) {
    return true;
  }
  
  return optionalPaths.some(optPath => {
    if (optPath.indexOf('*') >= 0) {
      // Convert glob pattern to regex
      let pattern = escapeRegExp(optPath);
      pattern = pattern.replace(/\\\*\\\*/g, '.*').replace(/\\\*/g, '[^/]*');
      return new RegExp(pattern).test(configPath);
    }
    return false;
  });
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

/**
 * Generate base directories for path resolution
 */
function generateBasedirs(configPath: string, opts: ConfigOptions): string[] {
  const dirs: string[] = [
    path.dirname(configPath),
    process.cwd()
  ];
  
  if (opts.basedir) {
    if (Array.isArray(opts.basedir)) {
      dirs.push(...opts.basedir);
    } else {
      dirs.push(opts.basedir);
    }
  }
  
  return dirs.filter(Boolean);
}

/**
 * Create config not found error
 */
function configNotFound(configPath: string): ReadConfigError {
  return ReadConfigError.fileNotFound(configPath);
}

/**
 * Create parent config not found error
 */
function parentConfigNotFound(parentPath: string, configPath: string): ReadConfigError {
  return new ReadConfigError(
    `Parent config file not found '${parentPath}' for ${configPath}`,
    'PARENT_NOT_FOUND',
    configPath
  );
}

// Legacy exports for backward compatibility
export const async = mergeParents;
export const sync = mergeParentsSync;