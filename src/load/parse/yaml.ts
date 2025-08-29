import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Parser, ConfigObject } from '../../types.js';
import { ReadConfigError } from '../../read-config-error.js';

/**
 * YAML parser implementation
 */
export const parser: Parser = {
  /**
   * Load and parse a YAML file asynchronously
   */
  async load(filePath: string): Promise<ConfigObject> {
    const absolutePath = path.resolve(filePath);
    try {
      const content = await fs.readFile(absolutePath, 'utf8');
      return await this.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw ReadConfigError.fileNotFound(absolutePath);
      }
      throw ReadConfigError.parseError(absolutePath, error as Error);
    }
  },

  /**
   * Load and parse a YAML file synchronously
   */
  loadSync(filePath: string): ConfigObject {
    const absolutePath = path.resolve(filePath);
    try {
      const content = readFileSync(absolutePath, 'utf8');
      return this.parseSync(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw ReadConfigError.fileNotFound(absolutePath);
      }
      throw ReadConfigError.parseError(absolutePath, error as Error);
    }
  },

  /**
   * Parse YAML content asynchronously
   */
  async parse(content: string): Promise<ConfigObject> {
    if (!content || !content.trim().length) {
      return {};
    }
    
    try {
      const result = yaml.load(content);
      return (result || {}) as ConfigObject;
    } catch (error) {
      throw new ReadConfigError(
        `Failed to parse YAML content: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  },

  /**
   * Parse YAML content synchronously
   */
  parseSync(content: string): ConfigObject {
    if (!content || !content.trim().length) {
      return {};
    }
    
    try {
      const result = yaml.load(content);
      return (result || {}) as ConfigObject;
    } catch (error) {
      throw new ReadConfigError(
        `Failed to parse YAML content: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  }
};

export default parser;