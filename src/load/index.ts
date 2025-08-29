import { ConfigObject, ConfigOptions } from '../types';
import { mergeParents, mergeParentsSync } from './merge-parents';
import { mergeConfigs } from './merge-configs';

/**
 * Load configuration files asynchronously
 * Supports loading multiple files with parent hierarchy resolution
 */
export async function loadAsync(
  paths: string | string[],
  opts: ConfigOptions = {}
): Promise<ConfigObject> {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  
  // Load all configurations in parallel with their parent hierarchies
  const configs = await Promise.all(
    pathArray.map(filepath => mergeParents(filepath, opts))
  );
  
  // Merge all configurations
  return mergeConfigs(configs);
}

/**
 * Load configuration files synchronously
 * Supports loading multiple files with parent hierarchy resolution
 */
export function loadSync(
  paths: string | string[],
  opts: ConfigOptions = {}
): ConfigObject {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  
  // Load all configurations with their parent hierarchies
  const configs = pathArray.map(filepath => mergeParentsSync(filepath, opts));
  
  // Merge all configurations
  return mergeConfigs(configs);
}

// Export individual functions for direct use
export { mergeConfigs } from './merge-configs';
export { mergeParents, mergeParentsSync } from './merge-parents';
export { resolvePath, resolvePathSync } from './resolve-path';
export * from './parse';

// Legacy exports for backward compatibility
export const async = loadAsync;
export const sync = loadSync;