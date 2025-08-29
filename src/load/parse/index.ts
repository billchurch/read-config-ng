import * as path from 'path';
import { Parser, ConfigObject } from '../../types';
import json5Parser from './json5';
import yamlParser from './yaml';
import propertiesParser from './properties';

/**
 * Map of file extensions to their parsers
 */
const parsers: Record<string, Parser> = {
  'json': json5Parser,
  'json5': json5Parser,
  'yml': yamlParser,
  'yaml': yamlParser,
  'properties': propertiesParser
};

/**
 * Default parser (JSON5)
 */
const defaultParser = json5Parser;

/**
 * Get the list of supported extensions
 */
export const extnames = Object.keys(parsers);

/**
 * Resolve the appropriate parser for a file
 */
function resolveParser(filename: string): Parser {
  // Check if filename is actually a format name
  if (parsers[filename]) {
    return parsers[filename];
  }
  
  // Extract extension from filename
  let extname = path.extname(filename);
  if (extname[0] === '.') {
    extname = extname.substring(1);
  }
  
  return parsers[extname] || defaultParser;
}

/**
 * Load a configuration file asynchronously
 */
export async function load(filePath: string): Promise<ConfigObject> {
  const parser = resolveParser(filePath);
  return await parser.load(filePath);
}

/**
 * Load a configuration file synchronously
 */
export function loadSync(filePath: string): ConfigObject {
  const parser = resolveParser(filePath);
  return parser.loadSync(filePath);
}

/**
 * Parse configuration content asynchronously
 */
export async function parse(format: string, content: string): Promise<ConfigObject> {
  const parser = resolveParser(format);
  return await parser.parse(content);
}

/**
 * Parse configuration content synchronously
 */
export function parseSync(format: string, content: string): ConfigObject {
  const parser = resolveParser(format);
  return parser.parseSync(content);
}