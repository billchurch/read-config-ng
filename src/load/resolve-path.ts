import * as path from 'path';
import { promises as fs } from 'fs';
import { extnames } from './parse';

/**
 * Check if a file exists
 */
async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file exists synchronously
 */
function fileExistsSync(filepath: string): boolean {
  try {
    require('fs').accessSync(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a configuration file path asynchronously
 */
export async function resolvePath(
  filepath: string,
  basedirs: string | string[] = []
): Promise<string | null> {
  const normalizedBasedirs = Array.isArray(basedirs) ? basedirs : [basedirs];
  const paths = lookupPaths(filepath, normalizedBasedirs);
  
  for (const p of paths) {
    if (await fileExists(p)) {
      return p;
    }
  }
  
  return null;
}

/**
 * Resolve a configuration file path synchronously
 */
export function resolvePathSync(
  filepath: string,
  basedirs: string | string[] = []
): string | null {
  const normalizedBasedirs = Array.isArray(basedirs) ? basedirs : [basedirs];
  const paths = lookupPaths(filepath, normalizedBasedirs);
  
  for (const p of paths) {
    if (fileExistsSync(p)) {
      return p;
    }
  }
  
  return null;
}

/**
 * Generate lookup paths for a file
 */
function lookupPaths(filepath: string, basedirs: string[]): string[] {
  const paths: string[] = [];
  
  if (!filepath) {
    return paths;
  }
  
  // If absolute path, return as-is or with extensions
  if (isAbsolute(filepath)) {
    return endsWith(filepath, extnames) 
      ? [filepath] 
      : addSupportedExtNames(filepath);
  }
  
  // Get filepath variations (with extensions if needed)
  const filepathVariations = endsWith(filepath, extnames) 
    ? [filepath] 
    : addSupportedExtNames(filepath);
  
  // Combine with base directories
  for (const basedir of basedirs) {
    if (!basedir) continue;
    
    for (const fp of filepathVariations) {
      paths.push(path.resolve(basedir, fp));
    }
  }
  
  return paths;
}

/**
 * Add supported extensions to a filepath
 */
function addSupportedExtNames(filepath: string): string[] {
  return extnames.map(extname => `${filepath}.${extname}`);
}

/**
 * Check if a path is absolute
 */
function isAbsolute(filepath: string): boolean {
  return path.resolve(filepath) === path.normalize(filepath);
}

/**
 * Check if text ends with any of the suffixes
 */
function endsWith(text: string, suffixes: string[]): boolean {
  return suffixes.some(suffix => {
    return text.length >= suffix.length && 
           text.substr(text.length - suffix.length) === suffix;
  });
}

// Legacy exports for backward compatibility
export const async = resolvePath;
export const sync = resolvePathSync;