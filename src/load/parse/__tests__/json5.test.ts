import { expect } from 'chai';
import * as path from 'path';
import { promises as fs } from 'fs';
import parser from '../json5';

describe('json5 parser', () => {
  const fixturesDir = path.join(__dirname, '../../../__tests__/fixtures');
  const validFile = path.join(fixturesDir, 'simple.json');
  const tempDir = path.join(fixturesDir, 'temp');
  
  before(async () => {
    // Create temp directory for test files
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  after(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('load', () => {
    it('should load and parse a valid JSON file', async () => {
      const result = await parser.load(validFile);
      
      expect(result).to.deep.equal({
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
      
      expect(result).to.deep.equal({
        unquoted: 'value',
        trailing: 'comma'
      });
    });
    
    it('should throw error for non-existent file', async () => {
      try {
        await parser.load('/non/existent/file.json');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).to.equal('FILE_NOT_FOUND');
      }
    });
    
    it('should throw error for invalid JSON', async () => {
      const invalidFile = path.join(tempDir, 'invalid.json');
      await fs.writeFile(invalidFile, '{ invalid json }');
      
      try {
        await parser.load(invalidFile);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).to.equal('PARSE_ERROR');
      }
    });
  });
  
  describe('loadSync', () => {
    it('should load file synchronously', () => {
      const result = parser.loadSync(validFile);
      
      expect(result).to.have.property('name', 'test-config');
      expect(result).to.have.property('version', '1.0.0');
    });
    
    it('should throw error synchronously for invalid file', () => {
      expect(() => {
        parser.loadSync('/non/existent/file.json');
      }).to.throw();
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
      
      expect(result).to.deep.equal({
        key: 'value',
        number: 42,
        array: [1, 2, 3]
      });
    });
    
    it('should return empty object for empty content', async () => {
      const result = await parser.parse('');
      expect(result).to.deep.equal({});
    });
    
    it('should return empty object for whitespace-only content', async () => {
      const result = await parser.parse('   \n  \t  ');
      expect(result).to.deep.equal({});
    });
    
    it('should throw error for invalid JSON', async () => {
      try {
        await parser.parse('{ invalid }');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).to.equal('PARSE_ERROR');
      }
    });
  });
  
  describe('parseSync', () => {
    it('should parse content synchronously', () => {
      const result = parser.parseSync('{ "key": "value" }');
      expect(result).to.deep.equal({ key: 'value' });
    });
    
    it('should handle empty content synchronously', () => {
      const result = parser.parseSync('');
      expect(result).to.deep.equal({});
    });
    
    it('should throw error synchronously for invalid content', () => {
      expect(() => {
        parser.parseSync('{ invalid }');
      }).to.throw();
    });
  });
});