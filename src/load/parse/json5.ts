import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import * as json5 from 'json5';
import { Parser, ConfigObject } from '../../types.js';
import { ReadConfigError } from '../../read-config-error.js';

/**
 * JSON5 parser implementation
 */
export const parser: Parser = {
  /**
   * Load and parse a JSON5 file asynchronously
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
   * Load and parse a JSON5 file synchronously
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
   * Parse JSON5 content asynchronously
   */
  async parse(content: string): Promise<ConfigObject> {
    if (!content || !content.trim().length) {
      return {};
    }
    
    try {
      const result = json5.parse(content);
      return result as ConfigObject;
    } catch (error) {
      throw new ReadConfigError(
        `Failed to parse JSON5 content: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  },

  /**
   * Parse JSON5 content synchronously
   */
  parseSync(content: string): ConfigObject {
    if (!content || !content.trim().length) {
      return {};
    }
    
    try {
      const result = json5.parse(content);
      return result as ConfigObject;
    } catch (error) {
      throw new ReadConfigError(
        `Failed to parse JSON5 content: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  }
};

export default parser;