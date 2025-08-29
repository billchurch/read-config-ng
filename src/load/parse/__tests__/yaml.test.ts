import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parser as yamlParser } from '../yaml';
import { ReadConfigError } from '../../read-config-error';

describe('YAML parser', () => {
  describe('load', () => {
    let tempDir: string;
    let tempFile: string;

    // Create temp directory for test files
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yaml-parser-test-'));
      tempFile = path.join(tempDir, 'test.yml');
    });

    // Clean up temp files
    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load valid YAML file', async () => {
      const yamlContent = `
name: test
port: 3000
database:
  host: localhost
  port: 5432
features:
  - auth
  - logging
`;
      await fs.writeFile(tempFile, yamlContent);

      const result = await yamlParser.load(tempFile);
      
      expect(result).toEqual({
        name: 'test',
        port: 3000,
        database: {
          host: 'localhost',
          port: 5432
        },
        features: ['auth', 'logging']
      });
    });

    it('should load empty YAML file as empty object', async () => {
      await fs.writeFile(tempFile, '');

      const result = await yamlParser.load(tempFile);
      
      expect(result).toEqual({});
    });

    it('should load YAML with only whitespace as empty object', async () => {
      await fs.writeFile(tempFile, '   \n   \t   \n   ');

      const result = await yamlParser.load(tempFile);
      
      expect(result).toEqual({});
    });

    it('should handle YAML with null values', async () => {
      const yamlContent = `
name: test
value: null
empty: ~
`;
      await fs.writeFile(tempFile, yamlContent);

      const result = await yamlParser.load(tempFile);
      
      expect(result).toEqual({
        name: 'test',
        value: null,
        empty: null
      });
    });

    it('should handle complex YAML structures', async () => {
      const yamlContent = `
server:
  host: 0.0.0.0
  port: 8080
  ssl:
    enabled: true
    cert: /path/to/cert
    key: /path/to/key
databases:
  - name: primary
    host: db1.example.com
    port: 5432
  - name: replica
    host: db2.example.com
    port: 5432
environment: production
debug: false
`;
      await fs.writeFile(tempFile, yamlContent);

      const result = await yamlParser.load(tempFile);
      
      expect(result.server.host).toBe('0.0.0.0');
      expect(result.server.port).toBe(8080);
      expect(result.server.ssl.enabled).toBe(true);
      expect(result.databases.length).toBe(2);
      expect(result.databases[0].name).toBe('primary');
      expect(result.databases[1].host).toBe('db2.example.com');
      expect(result.environment).toBe('production');
      expect(result.debug).toBe(false);
    });

    it('should throw ReadConfigError for non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.yml');

      await expect(yamlParser.load(nonExistentFile)).rejects.toThrow();
      
      try {
        await yamlParser.load(nonExistentFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('FILE_NOT_FOUND');
        expect((error as ReadConfigError).message.includes(nonExistentFile)).toBeTruthy();
      }
    });

    it('should throw ReadConfigError for invalid YAML', async () => {
      const invalidYaml = `
name: test
invalid: [
  unclosed array
`;
      await fs.writeFile(tempFile, invalidYaml);

      await expect(yamlParser.load(tempFile)).rejects.toThrow();
      
      try {
        await yamlParser.load(tempFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
        expect((error as ReadConfigError).message.includes(tempFile)).toBeTruthy();
      }
    });
  });

  describe('loadSync', () => {
    let tempDir: string;
    let tempFile: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yaml-parser-sync-test-'));
      tempFile = path.join(tempDir, 'test.yml');
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load valid YAML file synchronously', async () => {
      const yamlContent = `
name: sync-test
port: 4000
`;
      await fs.writeFile(tempFile, yamlContent);

      const result = yamlParser.loadSync(tempFile);
      
      expect(result).toEqual({
        name: 'sync-test',
        port: 4000
      });
    });

    it('should throw ReadConfigError for non-existent file synchronously', () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.yml');

      expect(() => yamlParser.loadSync(nonExistentFile)).toThrow();
      
      try {
        yamlParser.loadSync(nonExistentFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('FILE_NOT_FOUND');
        expect((error as ReadConfigError).message.includes(nonExistentFile)).toBeTruthy();
      }
    });

    it('should throw ReadConfigError for invalid YAML synchronously', async () => {
      const invalidYaml = `
name: test
invalid: {
  unclosed object
`;
      await fs.writeFile(tempFile, invalidYaml);

      expect(() => yamlParser.loadSync(tempFile)).toThrow();
      
      try {
        yamlParser.loadSync(tempFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
        expect((error as ReadConfigError).message.includes(tempFile)).toBeTruthy();
      }
    });
  });

  describe('parse', () => {
    it('should parse valid YAML content', async () => {
      const yamlContent = `
name: parse-test
values:
  - one
  - two
  - three
`;

      const result = await yamlParser.parse(yamlContent);
      
      expect(result).toEqual({
        name: 'parse-test',
        values: ['one', 'two', 'three']
      });
    });

    it('should return empty object for empty content', async () => {
      const result = await yamlParser.parse('');
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace-only content', async () => {
      const result = await yamlParser.parse('   \n\t   ');
      expect(result).toEqual({});
    });

    it('should handle YAML with different data types', async () => {
      const yamlContent = `
string: "hello world"
number: 42
float: 3.14
boolean: true
null_value: null
array:
  - item1
  - item2
object:
  nested: value
`;

      const result = await yamlParser.parse(yamlContent);
      
      expect(result.string).toBe('hello world');
      expect(result.number).toBe(42);
      expect(result.float).toBe(3.14);
      expect(result.boolean).toBe(true);
      expect(result.null_value).toBe(null);
      expect(result.array).toEqual(['item1', 'item2']);
      expect(result.object).toEqual({ nested: 'value' });
    });

    it('should throw ReadConfigError for invalid YAML content', async () => {
      const invalidYaml = `
name: test
invalid: [
  - item1
  - item2
  unclosed array
`;

      await expect(yamlParser.parse(invalidYaml)).rejects.toThrow();
      
      try {
        await yamlParser.parse(invalidYaml);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
        expect((error as ReadConfigError).message.includes('Failed to parse YAML content')).toBeTruthy();
      }
    });
  });

  describe('parseSync', () => {
    it('should parse valid YAML content synchronously', () => {
      const yamlContent = `
name: sync-parse-test
config:
  debug: true
  timeout: 5000
`;

      const result = yamlParser.parseSync(yamlContent);
      
      expect(result).toEqual({
        name: 'sync-parse-test',
        config: {
          debug: true,
          timeout: 5000
        }
      });
    });

    it('should return empty object for empty content synchronously', () => {
      const result = yamlParser.parseSync('');
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace-only content synchronously', () => {
      const result = yamlParser.parseSync('   \n\t   ');
      expect(result).toEqual({});
    });

    it('should throw ReadConfigError for invalid YAML content synchronously', () => {
      const invalidYaml = `
name: test
invalid: {
  key: value
  unclosed object
`;

      expect(() => yamlParser.parseSync(invalidYaml)).toThrow();
      
      try {
        yamlParser.parseSync(invalidYaml);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('PARSE_ERROR');
        expect((error as ReadConfigError).message.includes('Failed to parse YAML content')).toBeTruthy();
      }
    });
  });
});