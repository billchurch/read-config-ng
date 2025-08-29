import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parser as propertiesParser } from '../properties';
import { ReadConfigError } from '../../read-config-error';

describe('Properties parser', () => {
  describe('load', () => {
    let tempDir: string;
    let tempFile: string;

    // Create temp directory for test files
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'properties-parser-test-'));
      tempFile = path.join(tempDir, 'test.properties');
    });

    // Clean up temp files
    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load valid properties file', async () => {
      const propertiesContent = `
# Database configuration
database.host=localhost
database.port=5432
database.name=testdb

# Server configuration
server.port=3000
server.ssl.enabled=true

# Feature flags
features.auth=enabled
features.logging=disabled
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = await propertiesParser.load(tempFile);
      
      expect(result['database.host']).toBe('localhost');
      expect(result['database.port']).toBe(5432);
      expect(result['database.name']).toBe('testdb');
      expect(result['server.port']).toBe(3000);
      expect(result['server.ssl.enabled']).toBe(true);
      expect(result['features.auth']).toBe('enabled');
      expect(result['features.logging']).toBe('disabled');
    });

    it('should load empty properties file as empty object', async () => {
      await fs.writeFile(tempFile, '');

      const result = await propertiesParser.load(tempFile);
      
      expect(result).toEqual({});
    });

    it('should load properties with only whitespace as empty object', async () => {
      await fs.writeFile(tempFile, '   \n   \t   \n   ');

      const result = await propertiesParser.load(tempFile);
      
      expect(result).toEqual({});
    });

    it('should handle properties with comments', async () => {
      const propertiesContent = `
# This is a comment
! This is also a comment
app.name=test-app
# Another comment
app.version=1.0.0
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = await propertiesParser.load(tempFile);
      
      expect(result['app.name']).toBe('test-app');
      expect(result['app.version']).toBe('1.0.0');
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle properties with special characters', async () => {
      const propertiesContent = `
message.greeting=Hello World!
path.with.dots=some.value
key_with_underscores=value
key-with-hyphens=another-value
special.chars=value with spaces & symbols @#$%
unicode.value=café
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = await propertiesParser.load(tempFile);
      
      expect(result['message.greeting']).toBe('Hello World!');
      expect(result['path.with.dots']).toBe('some.value');
      expect(result['key_with_underscores']).toBe('value');
      expect(result['key-with-hyphens']).toBe('another-value');
      expect(result['special.chars']).toBe('value with spaces & symbols @#$%');
      expect(result['unicode.value']).toBe('café');
    });

    it('should handle properties with different separators', async () => {
      const propertiesContent = `
key1=value1
key2: value2
key3 = value3
key4 : value4
key5   =   value5
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = await propertiesParser.load(tempFile);
      
      expect(result['key1']).toBe('value1');
      expect(result['key2']).toBe('value2');
      expect(result['key3']).toBe('value3');
      expect(result['key4']).toBe('value4');
      expect(result['key5']).toBe('value5');
    });

    it('should handle multiline values', async () => {
      const propertiesContent = `
multiline.value=This is a \\
long value that spans \\
multiple lines
single.line=normal value
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = await propertiesParser.load(tempFile);
      
      expect(result['multiline.value'].includes('This is a')).toBeTruthy();
      expect(result['multiline.value'].includes('long value')).toBeTruthy();
      expect(result['single.line']).toBe('normal value');
    });

    it('should throw ReadConfigError for non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.properties');

      await expect(propertiesParser.load(nonExistentFile)).rejects.toThrow();
      
      try {
        await propertiesParser.load(nonExistentFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('FILE_NOT_FOUND');
        expect((error as ReadConfigError).message.includes(nonExistentFile)).toBeTruthy();
      }
    });

    it('should handle malformed properties gracefully', async () => {
      const malformedProperties = `
valid.key=valid.value
invalid line without separator
another.valid=value
`;
      await fs.writeFile(tempFile, malformedProperties);

      // Properties parser usually handles malformed lines by ignoring them
      const result = await propertiesParser.load(tempFile);
      
      expect(result['valid.key']).toBe('valid.value');
      expect(result['another.valid']).toBe('value');
    });
  });

  describe('loadSync', () => {
    let tempDir: string;
    let tempFile: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'properties-parser-sync-test-'));
      tempFile = path.join(tempDir, 'test.properties');
    });

    afterEach(async () => {
      try {
        await fs.rm(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load valid properties file synchronously', async () => {
      const propertiesContent = `
app.name=sync-test
app.version=2.0.0
`;
      await fs.writeFile(tempFile, propertiesContent);

      const result = propertiesParser.loadSync(tempFile);
      
      expect(result['app.name']).toBe('sync-test');
      expect(result['app.version']).toBe('2.0.0');
    });

    it('should throw ReadConfigError for non-existent file synchronously', () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.properties');

      expect(() => propertiesParser.loadSync(nonExistentFile)).toThrow();
      
      try {
        propertiesParser.loadSync(nonExistentFile);
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        expect((error as ReadConfigError).code).toBe('FILE_NOT_FOUND');
        expect((error as ReadConfigError).message.includes(nonExistentFile)).toBeTruthy();
      }
    });

    it('should handle empty file synchronously', async () => {
      await fs.writeFile(tempFile, '');

      const result = propertiesParser.loadSync(tempFile);
      
      expect(result).toEqual({});
    });
  });

  describe('parse', () => {
    it('should parse valid properties content', async () => {
      const propertiesContent = `
app.name=parse-test
app.debug=true
app.timeout=5000
`;

      const result = await propertiesParser.parse(propertiesContent);
      
      expect(result['app.name']).toBe('parse-test');
      expect(result['app.debug']).toBe(true);
      expect(result['app.timeout']).toBe(5000);
    });

    it('should return empty object for empty content', async () => {
      const result = await propertiesParser.parse('');
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace-only content', async () => {
      const result = await propertiesParser.parse('   \n\t   ');
      expect(result).toEqual({});
    });

    it('should handle properties with escaped characters', async () => {
      const propertiesContent = `
escaped.newline=line1\\nline2
escaped.tab=value1\\tvalue2
escaped.backslash=path\\\\to\\\\file
escaped.equals=key\\=value
escaped.colon=key\\:value
`;

      const result = await propertiesParser.parse(propertiesContent);
      
      expect(result['escaped.newline']).toBeTruthy();
      expect(result['escaped.tab']).toBeTruthy();
      expect(result['escaped.backslash']).toBeTruthy();
      expect(result['escaped.equals']).toBeTruthy();
      expect(result['escaped.colon']).toBeTruthy();
    });

    it('should handle properties with empty values', async () => {
      const propertiesContent = `
empty.value=
null.value=
blank.value=   
`;

      const result = await propertiesParser.parse(propertiesContent);
      
      expect(result['empty.value']).toBe(null);
      expect(result['null.value']).toBe(null);
      expect(result.hasOwnProperty('blank.value')).toBeTruthy();
    });

    it('should handle complex properties structure', async () => {
      const propertiesContent = `
# Database configuration
db.primary.host=db1.example.com
db.primary.port=5432
db.primary.username=admin
db.primary.password=secret123

db.replica.host=db2.example.com
db.replica.port=5432

# Cache configuration
cache.redis.enabled=true
cache.redis.host=redis.example.com
cache.redis.port=6379

# Feature toggles
features.new.ui=true
features.beta.api=false
`;

      const result = await propertiesParser.parse(propertiesContent);
      
      expect(result['db.primary.host']).toBe('db1.example.com');
      expect(result['db.primary.port']).toBe(5432);
      expect(result['db.replica.host']).toBe('db2.example.com');
      expect(result['cache.redis.enabled']).toBe(true);
      expect(result['cache.redis.host']).toBe('redis.example.com');
      expect(result['features.new.ui']).toBe(true);
      expect(result['features.beta.api']).toBe(false);
    });
  });

  describe('parseSync', () => {
    it('should parse valid properties content synchronously', () => {
      const propertiesContent = `
sync.test=true
sync.value=123
`;

      const result = propertiesParser.parseSync(propertiesContent);
      
      expect(result['sync.test']).toBe(true);
      expect(result['sync.value']).toBe(123);
    });

    it('should return empty object for empty content synchronously', () => {
      const result = propertiesParser.parseSync('');
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace-only content synchronously', () => {
      const result = propertiesParser.parseSync('   \n\t   ');
      expect(result).toEqual({});
    });

    it('should handle sync parsing with comments', () => {
      const propertiesContent = `
# Configuration
config.name=sync-app
! Another comment style
config.version=1.0.0
`;

      const result = propertiesParser.parseSync(propertiesContent);
      
      expect(result['config.name']).toBe('sync-app');
      expect(result['config.version']).toBe('1.0.0');
      expect(Object.keys(result).length).toBe(2);
    });

    it('should handle edge cases in sync parsing', () => {
      const propertiesContent = `
key.with.many.dots=value
key=simple
key.empty=
key.spaces=  value with spaces  
`;

      const result = propertiesParser.parseSync(propertiesContent);
      
      expect(result['key.with.many.dots']).toBe('value');
      expect(result['key']).toBe('simple');
      expect(result['key.empty']).toBe(null);
      expect(result['key.spaces']).toBeTruthy();
    });
  });
});