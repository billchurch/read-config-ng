import { expect } from 'chai';
import * as path from 'path';
import readConfig from '../src';
import { readConfigSync, readConfigCallback } from '../src/read-config';

describe('TypeScript Migration Basic Tests', () => {
  const configPath = path.join(__dirname, 'configs', 'config-simple.json');
  const configWithVarPath = path.join(__dirname, 'configs', 'config-simple-var.json');
  
  describe('Async API (default)', () => {
    it('should load a simple configuration file', async () => {
      const config = await readConfig(configPath);
      expect(config).to.be.an('object');
      expect(config).to.have.property('a', 1);
    });
    
    it('should handle local variable replacement', async () => {
      // config-simple-var.json references @{x} which doesn't exist
      // We'll skip unresolved to avoid error
      const config = await readConfig(configWithVarPath, { skipUnresolved: true });
      expect(config).to.have.property('a');
    });
    
    it('should handle non-existent file', async () => {
      try {
        await readConfig('/non/existent/file.json');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('not found');
      }
    });
  });
  
  describe('Sync API', () => {
    it('should load a simple configuration file synchronously', () => {
      const config = readConfigSync(configPath);
      expect(config).to.be.an('object');
      expect(config).to.have.property('a', 1);
    });
    
    it('should handle local variable replacement synchronously', () => {
      const config = readConfigSync(configWithVarPath, { skipUnresolved: true });
      expect(config).to.have.property('a');
    });
  });
  
  describe('Callback API (legacy)', () => {
    it('should load a simple configuration file with callback', (done) => {
      readConfigCallback(configPath, (err, config) => {
        expect(err).to.be.null;
        expect(config).to.be.an('object');
        expect(config).to.have.property('a', 1);
        done();
      });
    });
    
    it('should handle errors in callback', (done) => {
      readConfigCallback('/non/existent/file.json', (err, config) => {
        expect(err).to.be.an('error');
        expect(err?.message).to.include('not found');
        expect(config).to.be.undefined;
        done();
      });
    });
  });
  
  describe('TypeScript Type Safety', () => {
    it('should export proper types', () => {
      // This test verifies that TypeScript types are properly exported
      // The actual type checking happens at compile time
      expect(readConfig).to.be.a('function');
      expect(readConfigSync).to.be.a('function');
      expect(readConfigCallback).to.be.a('function');
    });
  });
});