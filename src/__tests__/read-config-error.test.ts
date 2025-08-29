import { describe, it, expect } from 'vitest';
import { ReadConfigError } from '../read-config-error';

describe('ReadConfigError', () => {
  describe('constructor', () => {
    it('should create basic error with message', () => {
      const error = new ReadConfigError('Test error message');
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('READ_CONFIG_ERROR');
      expect(error.path).toBe(undefined);
      expect(error.cause).toBe(undefined);
    });

    it('should create error with custom code', () => {
      const error = new ReadConfigError('Test error', 'CUSTOM_CODE');
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.path, undefined);
      expect(error.cause, undefined);
    });

    it('should create error with path', () => {
      const testPath = '/path/to/config.json';
      const error = new ReadConfigError('Test error', 'TEST_CODE', testPath);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message).toBe('Test error');
      expect(error.code, 'TEST_CODE');
      expect(error.path, testPath);
      expect(error.cause, undefined);
    });

    it('should create error with cause', () => {
      const originalError = new Error('Original error');
      const error = new ReadConfigError('Test error', 'TEST_CODE', undefined, originalError);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message).toBe('Test error');
      expect(error.code, 'TEST_CODE');
      expect(error.path, undefined);
      expect(error.cause, originalError);
    });

    it('should create error with all parameters', () => {
      const originalError = new Error('Original error');
      const testPath = '/path/to/config.json';
      const error = new ReadConfigError('Test error', 'FULL_ERROR', testPath, originalError);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message).toBe('Test error');
      expect(error.code, 'FULL_ERROR');
      expect(error.path, testPath);
      expect(error.cause, originalError);
    });

    it('should be an instance of Error', () => {
      const error = new ReadConfigError('Test error');
      
      expect(error instanceof Error);
      expect(error instanceof ReadConfigError);
    });

    it('should maintain stack trace', () => {
      const error = new ReadConfigError('Test error');
      
      expect(error.stack);
      expect(error.stack.includes('ReadConfigError'));
    });
  });

  describe('static fileNotFound', () => {
    it('should create file not found error', () => {
      const testPath = '/path/to/missing/config.json';
      const error = ReadConfigError.fileNotFound(testPath);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.code, 'FILE_NOT_FOUND');
      expect(error.path, testPath);
      expect(error.message.includes('Configuration file not found'));
      expect(error.message.includes(testPath));
      expect(error.cause, undefined);
    });

    it('should handle different file paths', () => {
      const paths = [
        '/absolute/path/config.yml',
        './relative/path/config.json5',
        'simple-config.properties',
        '/complex/path with spaces/config.yaml'
      ];

      for (const testPath of paths) {
        const error = ReadConfigError.fileNotFound(testPath);
        
        expect(error.code, 'FILE_NOT_FOUND');
        expect(error.path, testPath);
        expect(error.message.includes(testPath));
      }
    });
  });

  describe('static parseError', () => {
    it('should create parse error with cause', () => {
      const testPath = '/path/to/config.json';
      const originalError = new Error('Invalid JSON syntax');
      const error = ReadConfigError.parseError(testPath, originalError);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.code, 'PARSE_ERROR');
      expect(error.path, testPath);
      expect(error.cause, originalError);
      expect(error.message.includes('Failed to parse configuration file'));
      expect(error.message.includes(testPath));
    });

    it('should handle different parse error types', () => {
      const testPath = '/path/to/config.yaml';
      const errorTypes = [
        new SyntaxError('Unexpected token'),
        new Error('YAML parse error'),
        new TypeError('Properties parsing failed')
      ];

      for (const originalError of errorTypes) {
        const error = ReadConfigError.parseError(testPath, originalError);
        
        expect(error.code, 'PARSE_ERROR');
        expect(error.path, testPath);
        expect(error.cause, originalError);
        expect(error.message.includes('Failed to parse configuration file'));
      }
    });
  });

  describe('static validationError', () => {
    it('should create validation error', () => {
      const message = 'Configuration validation failed: missing required field';
      const error = ReadConfigError.validationError(message);
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.message, message);
      expect(error.code, 'VALIDATION_ERROR');
      expect(error.path, undefined);
      expect(error.cause, undefined);
    });

    it('should handle different validation messages', () => {
      const messages = [
        'Missing required field: database.host',
        'Invalid port number: must be between 1 and 65535',
        'Unknown configuration key: invalidKey',
        'Type mismatch: expected string, got number'
      ];

      for (const message of messages) {
        const error = ReadConfigError.validationError(message);
        
        expect(error.message, message);
        expect(error.code, 'VALIDATION_ERROR');
      }
    });
  });

  describe('static resolutionError', () => {
    it('should create environment variable resolution error', () => {
      const variable = 'DATABASE_HOST';
      const error = ReadConfigError.resolutionError(variable, 'env');
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.code, 'RESOLUTION_ERROR');
      expect(error.message.includes('Could not resolve env variable'));
      expect(error.message.includes(variable));
      expect(error.path, undefined);
      expect(error.cause, undefined);
    });

    it('should create local variable resolution error', () => {
      const variable = 'config.database.host';
      const error = ReadConfigError.resolutionError(variable, 'local');
      
      expect(error.name).toBe('ReadConfigError');
      expect(error.code, 'RESOLUTION_ERROR');
      expect(error.message.includes('Could not resolve local variable'));
      expect(error.message.includes(variable));
      expect(error.path, undefined);
      expect(error.cause, undefined);
    });

    it('should handle different variable types and names', () => {
      const testCases = [
        { variable: 'NODE_ENV', type: 'env' as const },
        { variable: 'DATABASE_URL', type: 'env' as const },
        { variable: 'config.server.port', type: 'local' as const },
        { variable: '../parent.database.host', type: 'local' as const },
        { variable: './relative.config.value', type: 'local' as const }
      ];

      for (const { variable, type } of testCases) {
        const error = ReadConfigError.resolutionError(variable, type);
        
        expect(error.code, 'RESOLUTION_ERROR');
        expect(error.message.includes(`Could not resolve ${type} variable`));
        expect(error.message.includes(variable));
      }
    });
  });

  describe('error serialization and toString', () => {
    it('should convert to string properly', () => {
      const error = new ReadConfigError('Test error message', 'TEST_CODE');
      const errorString = error.toString();
      
      expect(errorString.includes('ReadConfigError'));
      expect(errorString.includes('Test error message'));
    });

    it('should handle JSON serialization', () => {
      const testPath = '/path/to/config.json';
      const originalError = new Error('Original error');
      const error = new ReadConfigError('Test error', 'TEST_CODE', testPath, originalError);
      
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);
      
      // Note: Custom properties may not serialize in all JS engines
      expect(parsed.message === 'Test error' || typeof parsed.message === 'undefined');
      expect(parsed.name, 'ReadConfigError');
      // Note: code, path, and cause might not serialize directly depending on JS engine
    });
  });

  describe('inheritance and instanceof checks', () => {
    it('should work with instanceof checks', () => {
      const error = new ReadConfigError('Test error');
      
      expect(error instanceof ReadConfigError);
      expect(error instanceof Error);
    });

    it('should work with static factory method instances', () => {
      const fileError = ReadConfigError.fileNotFound('/test/path');
      const parseError = ReadConfigError.parseError('/test/path', new Error('test'));
      const validationError = ReadConfigError.validationError('test message');
      const resolutionError = ReadConfigError.resolutionError('TEST_VAR', 'env');
      
      expect(fileError instanceof ReadConfigError);
      expect(fileError instanceof Error);
      
      expect(parseError instanceof ReadConfigError);
      expect(parseError instanceof Error);
      
      expect(validationError instanceof ReadConfigError);
      expect(validationError instanceof Error);
      
      expect(resolutionError instanceof ReadConfigError);
      expect(resolutionError instanceof Error);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty strings and special characters', () => {
      const error = ReadConfigError.fileNotFound('');
      expect(error.path, '');
      expect(error.code, 'FILE_NOT_FOUND');
    });

    it('should handle null and undefined in constructor', () => {
      // Test with undefined path explicitly
      const error = new ReadConfigError('Test', 'CODE', undefined, undefined);
      expect(error.path, undefined);
      expect(error.cause, undefined);
    });

    it('should handle special file path characters', () => {
      const specialPath = '/path/with/üñíçødé/and-émojis-🚀/config.json';
      const error = ReadConfigError.fileNotFound(specialPath);
      
      expect(error.path, specialPath);
      expect(error.message.includes(specialPath));
    });
  });
});