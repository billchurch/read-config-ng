import { describe, it, expect } from 'vitest';
import { override } from '../override';

describe('override', () => {
  it('should override simple properties', () => {
    const config = {
      host: 'localhost',
      port: 3000
    };
    
    const env = {
      CONFIG_host: 'production.com',
      CONFIG_port: '8080'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      host: 'production.com',
      port: 8080
    });
  });
  
  it('should override nested properties', () => {
    const config = {
      database: {
        host: 'localhost',
        port: 5432,
        name: 'test'
      }
    };
    
    const env = {
      CONFIG_database_host: 'db.prod.com',
      CONFIG_database_port: '3306',
      CONFIG_database_name: 'production'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      database: {
        host: 'db.prod.com',
        port: 3306,
        name: 'production'
      }
    });
  });
  
  it('should create new properties', () => {
    const config = {
      existing: 'value'
    };
    
    const env = {
      CONFIG_new: 'added',
      CONFIG_nested_property: 'value'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      existing: 'value',
      new: 'added',
      nested: {
        property: 'value'
      }
    });
  });
  
  it('should cast boolean values', () => {
    const config = {};
    
    const env = {
      CONFIG_debug: 'true',
      CONFIG_verbose: 'false',
      CONFIG_enabled: 'TRUE',
      CONFIG_disabled: 'FALSE'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      debug: true,
      verbose: false,
      enabled: true,
      disabled: false
    });
  });
  
  it('should cast numeric values', () => {
    const config = {};
    
    const env = {
      CONFIG_int: '42',
      CONFIG_negative: '-10',
      CONFIG_float: '3.14',
      CONFIG_negFloat: '-2.5'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      int: 42,
      negative: -10,
      float: 3.14,
      negFloat: -2.5
    });
  });
  
  it('should cast null and undefined', () => {
    const config = {
      a: 'value',
      b: 'value'
    };
    
    const env = {
      CONFIG_a: 'null',
      CONFIG_b: 'undefined'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      a: null,
      b: undefined
    });
  });
  
  it('should parse JSON objects and arrays', () => {
    const config = {};
    
    const env = {
      CONFIG_obj: '{"a": 1, "b": 2}',
      CONFIG_arr: '[1, 2, 3]',
      CONFIG_nested: '{"x": {"y": "z"}}'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      obj: { a: 1, b: 2 },
      arr: [1, 2, 3],
      nested: { x: { y: 'z' } }
    });
  });
  
  it('should handle invalid JSON as string', () => {
    const config = {};
    
    const env = {
      CONFIG_invalid: '{invalid json}'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      invalid: '{invalid json}'
    });
  });
  
  it('should ignore non-matching environment variables', () => {
    const config = { a: 1 };
    
    const env = {
      OTHER_VAR: 'value',
      CONFIG_b: '2',
      RANDOM: 'ignored'
    };
    
    const result = override('CONFIG', config, env);
    
    expect(result).toEqual( {
      a: 1,
      b: 2
    });
  });
  
  it('should handle different markers', () => {
    const config = {};
    
    const env = {
      CUSTOM_value: 'test',
      CONFIG_ignored: 'nope'
    };
    
    const result = override('CUSTOM', config, env);
    
    expect(result).toEqual( {
      value: 'test'
    });
  });
  
  it('should return config as-is when override is disabled', () => {
    const config = { a: 1 };
    
    const env = {
      CONFIG_a: '2'
    };
    
    const result1 = override(false, config, env);
    expect(result1).toEqual({ a: 1 });
    
    const result2 = override('', config, env);
    expect(result2).toEqual({ a: 1 });
  });
  
  it('should handle undefined values in environment', () => {
    const config = { a: 1 };
    
    const env = {
      CONFIG_b: undefined
    };
    
    const result = override('CONFIG', config, env as Record<string, string | undefined>);
    
    expect(result).toEqual( { a: 1 });
  });
});