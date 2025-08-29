import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as path from 'path';
import { promises as fs } from 'fs';
import parser from '../json5';
import { ReadConfigError } from '../../read-config-error';

describe('json5 parser', () => {
  const fixturesDir = path.join(__dirname, '../../../__tests__/fixtures');
  const validFile = path.join(fixturesDir, 'simple.json');
  const tempDir = path.join(fixturesDir, 'temp');
  
  beforeAll(async () => {
    // Create temp directory for test files
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterAll(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('load', () => {
    it('should load and parse a valid JSON file', async () => {
      const result = await parser.load(validFile);
      
      expect(result).toEqual({
        name: 'test-config',
        version: '1.0.0',
        settings: {
          debug: true,
          port: 3000
        }
      });
    });
    
    it('should handle JSON5 features', async () => {
      const json5File = path.join(tempDir, 'test.json5');
      await fs.writeFile(json5File, `{
        // This is a comment
        unquoted: 'value',
        trailing: 'comma',
      }`);
      
      const result = await parser.load(json5File);
      
      expect(result).toEqual({
        unquoted: 'value',
        trailing: 'comma'
      });
    });
    
    it('should throw error for non-existent file', async () => {
      try {
        await parser.load('/non/existent/file.json');
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('FILE_NOT_FOUND');
      }
    });
    
    it('should throw error for invalid JSON', async () => {
      const invalidFile = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidFile, '{ invalid json }');
      
      try {
        await parser.load(invalidFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
      }
    });
  });
  
  describe('loadSync', () => {
    it('should load file synchronously', () => {
      const result = parser.loadSync(validFile);
      
      expect(result.name).toBe('test-config');
      expect(result.version).toBe('1.0.0');
    });
    
    it('should throw error synchronously for invalid file', () => {
      expect(() => {
        parser.loadSync('/non/existent/file.json');
      }).toThrow();
    });
  });
  
  describe('parse', () => {
    it('should parse valid JSON5 content', async () => {
      const content = `{
        // Comment
        key: "value",
        number: 42,
        array: [1, 2, 3],
      }`;
      
      const result = await parser.parse(content);
      
      expect(result).toEqual({
        key: 'value',
        number: 42,
        array: [1, 2, 3]
      });
    });
    
    it('should return empty object for empty content', async () => {
      const result = await parser.parse('');
      expect(result).toEqual({});
    });
    
    it('should return empty object for whitespace-only content', async () => {
      const result = await parser.parse('   \n  \t  ');
      expect(result).toEqual({});
    });
    
    it('should throw error for invalid JSON', async () => {
      try {
        await parser.parse('{ invalid }');
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
      }
    });
  });
  
  describe('parseSync', () => {
    it('should parse content synchronously', () => {
      const result = parser.parseSync('{ "key": "value" }');
      expect(result).toEqual({ key: 'value' });
    });
    
    it('should handle empty content synchronously', () => {
      const result = parser.parseSync('');
      expect(result).toEqual({});
    });
    
    it('should throw error synchronously for invalid content', () => {
      expect(() => {
        parser.parseSync('{ invalid }');
      }).toThrow();
    });
  });
});