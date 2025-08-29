import { describe, it, expect } from 'vitest';
import * as path from 'path';
import readConfig, { readConfigSync } from '../read-config';
import { ReadConfigError } from '../read-config-error';

describe('read-config', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const simplePath = path.join(fixturesDir, 'simple.json');
  
  describe('async API (default)', () => {
    it('should load a simple JSON configuration', async () => {
      const config = await readConfig(simplePath);
      
      expect(config).toEqual({
        name: 'test-config',
        version: '1.0.0',
        settings: {
          debug: true,
          port: 3000
        }
      });
    });
    
    it('should throw error for non-existent file', async () => {
      await expect(readConfig('/non/existent/file.json'))
        .rejects.toThrow(ReadConfigError);
      
      await expect(readConfig('/non/existent/file.json'))
        .rejects.toThrow(/not found/);
    });
  });
  
  describe('sync API', () => {
    it('should load configuration synchronously', () => {
      const config = readConfigSync(simplePath);
      
      expect(config).toEqual({
        name: 'test-config',
        version: '1.0.0',
        settings: {
          debug: true,
          port: 3000
        }
      });
    });
  });
});