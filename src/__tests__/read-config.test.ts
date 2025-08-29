import { expect } from 'chai';
import * as path from 'path';
import readConfig, { readConfigSync, readConfigCallback } from '../read-config';
import { ReadConfigError } from '../read-config-error';

describe('read-config', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const simplePath = path.join(fixturesDir, 'simple.json');
  const withEnvPath = path.join(fixturesDir, 'with-env.json');
  const withLocalPath = path.join(fixturesDir, 'with-local.json');
  const childPath = path.join(fixturesDir, 'child.json');
  
  describe('async API (default)', () => {
    it('should load a simple JSON configuration', async () => {
      const config = await readConfig(simplePath);
      
      expect(config).to.deep.equal({
        name: 'test-config',
        version: '1.0.0',
        settings: {
          debug: true,
          port: 3000
        }
      });
    });
    
    it('should handle multiple configuration files', async () => {
      const config = await readConfig([simplePath, withLocalPath]);
      
      expect(config).to.have.property('name', 'test-config');
      expect(config).to.have.property('base');
      expect(config).to.have.property('endpoints');
    });
    
    it('should resolve environment variables', async () => {
      process.env.DB_HOST = 'production.db';
      process.env.DB_PORT = '3306';
      
      const config = await readConfig(withEnvPath);
      
      expect(config.database).to.deep.equal({
        host: 'production.db',
        port: '3306',
        name: 'testdb' // default value
      });
      
      // Cleanup
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
    });
    
    it('should resolve local variables', async () => {
      const config = await readConfig(withLocalPath);
      
      expect(config.endpoints).to.deep.equal({
        api: 'https://example.com/api',
        auth: 'https://example.com/auth',
        timeout: 5000
      });
      expect(config.nested.value).to.equal('https://example.com/api/v1');
    });
    
    it('should handle parent inheritance', async () => {
      const config = await readConfig(childPath);
      
      expect(config.parent).to.be.true;
      expect(config.child).to.be.true;
      expect(config.overridden).to.equal('child-value');
      expect(config.settings).to.deep.equal({
        debug: false,
        port: 4000,
        host: 'localhost'
      });
      expect(config).to.not.have.property('__parent');
    });
    
    it('should throw error for non-existent file', async () => {
      try {
        await readConfig('/non/existent/file.json');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ReadConfigError);
        expect(error.message).to.include('not found');
      }
    });
    
    it('should handle optional files', async () => {
      const config = await readConfig('/non/existent/file.json', {
        optional: '/non/existent/file.json'
      });
      
      expect(config).to.deep.equal({});
    });
    
    it('should override with environment variables', async () => {
      process.env.CONFIG_settings_port = '8080';
      process.env.CONFIG_name = 'overridden';
      
      const config = await readConfig(simplePath, {
        override: 'CONFIG'
      });
      
      expect(config.name).to.equal('overridden');
      expect(config.settings.port).to.equal(8080);
      
      // Cleanup
      delete process.env.CONFIG_settings_port;
      delete process.env.CONFIG_name;
    });
  });
  
  describe('sync API', () => {
    it('should load configuration synchronously', () => {
      const config = readConfigSync(simplePath);
      
      expect(config).to.deep.equal({
        name: 'test-config',
        version: '1.0.0',
        settings: {
          debug: true,
          port: 3000
        }
      });
    });
    
    it('should resolve variables synchronously', () => {
      const config = readConfigSync(withLocalPath);
      
      expect(config.endpoints.api).to.equal('https://example.com/api');
      expect(config.nested.value).to.equal('https://example.com/api/v1');
    });
    
    it('should throw error synchronously for non-existent file', () => {
      expect(() => {
        readConfigSync('/non/existent/file.json');
      }).to.throw(ReadConfigError);
    });
  });
  
  describe('callback API', () => {
    it('should load configuration with callback', (done) => {
      readConfigCallback(simplePath, (err, config) => {
        expect(err).to.be.null;
        expect(config).to.deep.equal({
          name: 'test-config',
          version: '1.0.0',
          settings: {
            debug: true,
            port: 3000
          }
        });
        done();
      });
    });
    
    it('should handle errors in callback', (done) => {
      readConfigCallback('/non/existent/file.json', (err, config) => {
        expect(err).to.be.instanceOf(ReadConfigError);
        expect(config).to.be.undefined;
        done();
      });
    });
    
    it('should handle options with callback', (done) => {
      readConfigCallback(withLocalPath, {}, (err, config) => {
        expect(err).to.be.null;
        expect(config?.endpoints.api).to.equal('https://example.com/api');
        done();
      });
    });
  });
  
  describe('options validation', () => {
    it('should reject when replaceEnv equals replaceLocal', async () => {
      try {
        await readConfig(simplePath, {
          replaceEnv: '@',
          replaceLocal: '@'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ReadConfigError);
        expect(error.message).to.include('must be different');
      }
    });
    
    it('should reject invalid basedir', async () => {
      try {
        await readConfig(simplePath, {
          basedir: '/non/existent/directory'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ReadConfigError);
        expect(error.message).to.include('Base directory not found');
      }
    });
  });
});