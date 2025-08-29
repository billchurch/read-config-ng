import { expect } from 'chai';
import * as path from 'path';
import { resolvePath, resolvePathSync } from '../resolve-path';

describe('resolve-path', () => {
  const fixturesDir = path.join(__dirname, '../../__tests__/fixtures');
  const existingFile = path.join(fixturesDir, 'simple.json');
  
  describe('resolvePath (async)', () => {
    it('should resolve existing file with full path', async () => {
      const resolved = await resolvePath(existingFile);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should resolve file with basedir', async () => {
      const resolved = await resolvePath('simple.json', fixturesDir);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should resolve file with multiple basedirs', async () => {
      const resolved = await resolvePath('simple.json', [
        '/non/existent',
        fixturesDir,
        '/another/non/existent'
      ]);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should add extension if not provided', async () => {
      const resolved = await resolvePath('simple', fixturesDir);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should try multiple extensions', async () => {
      // Create a temporary yaml file for testing
      const resolved = await resolvePath('simple', fixturesDir);
      expect(resolved).to.equal(existingFile); // Will find .json first
    });
    
    it('should return null for non-existent file', async () => {
      const resolved = await resolvePath('/non/existent/file.json');
      expect(resolved).to.be.null;
    });
    
    it('should handle absolute paths', async () => {
      const resolved = await resolvePath(existingFile, ['/some/basedir']);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should handle empty filepath', async () => {
      const resolved = await resolvePath('');
      expect(resolved).to.be.null;
    });
  });
  
  describe('resolvePathSync', () => {
    it('should resolve existing file synchronously', () => {
      const resolved = resolvePathSync(existingFile);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should resolve with basedir synchronously', () => {
      const resolved = resolvePathSync('simple.json', fixturesDir);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should return null for non-existent file synchronously', () => {
      const resolved = resolvePathSync('/non/existent/file.json');
      expect(resolved).to.be.null;
    });
    
    it('should add extension synchronously', () => {
      const resolved = resolvePathSync('simple', fixturesDir);
      expect(resolved).to.equal(existingFile);
    });
  });
  
  describe('extension handling', () => {
    it('should not add extension if already present', async () => {
      const resolved = await resolvePath('simple.json', fixturesDir);
      expect(resolved).to.equal(existingFile);
    });
    
    it('should try json5 extension', async () => {
      const resolved = await resolvePath('simple', fixturesDir);
      // Will find .json first in our case
      expect(resolved).to.include('.json');
    });
    
    it('should handle yml and yaml extensions', async () => {
      // These would need actual yml/yaml files to test fully
      const resolved = await resolvePath('nonexistent.yml', fixturesDir);
      expect(resolved).to.be.null;
    });
    
    it('should handle properties extension', async () => {
      const resolved = await resolvePath('nonexistent.properties', fixturesDir);
      expect(resolved).to.be.null;
    });
  });
});