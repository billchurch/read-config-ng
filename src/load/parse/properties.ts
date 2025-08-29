import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import { Parser, ConfigObject } from '../../types.js';
import { ReadConfigError } from '../../read-config-error.js';

// Properties library doesn't have official types and is CommonJS
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const properties = require('properties');

/**
 * Properties parser implementation
 */
export const parser: Parser = {
  /**
   * Load and parse a properties file asynchronously
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
   * Load and parse a properties file synchronously
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
   * Parse properties content asynchronously
   */
  async parse(content: string): Promise<ConfigObject> {
    if (!content || !content.trim().length) {
      return {};
    }
    
    return new Promise((resolve, reject) => {
      properties.parse(content, (error: Error | null, result: ConfigObject) => {
        if (error) {
          reject(new ReadConfigError(
            `Failed to parse properties content: ${error.message}`,
            'PARSE_ERROR'
          ));
        } else {
          resolve(result || {});
        }
      });
    });
  },

  /**
   * Parse properties content synchronously
   */
  parseSync(content: string): ConfigObject {
    if (!content || !content.trim().length) {
      return {};
    }
    
    try {
      // Properties library doesn't have a sync parse, so we'll use a workaround
      let result: ConfigObject = {};
      let error: Error | null = null;
      
      properties.parse(content, (err: Error | null, res: ConfigObject) => {
        if (err) {
          error = err;
        } else {
          result = res || {};
        }
      });
      
      if (error) {
        throw new ReadConfigError(
          `Failed to parse properties content: ${(error as Error).message}`,
          'PARSE_ERROR'
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof ReadConfigError) {
        throw error;
      }
      throw new ReadConfigError(
        `Failed to parse properties content: ${(error as Error).message}`,
        'PARSE_ERROR'
      );
    }
  }
};

export default parser;