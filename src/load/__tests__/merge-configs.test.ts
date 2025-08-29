import { describe, it, expect } from 'vitest';
import { mergeConfigs } from '../merge-configs';

describe('merge-configs', () => {
  it('should return empty object for empty array', () => {
    const result = mergeConfigs([]);
    expect(result).toEqual({});
  });
  
  it('should return empty object for null/undefined', () => {
    const result = mergeConfigs(null as never);
    expect(result).toEqual({});
  });
  
  it('should merge multiple configs', () => {
    const configs = [
      { a: 1, b: 2 },
      { b: 3, c: 4 },
      { c: 5, d: 6 }
    ];
    
    const result = mergeConfigs(configs);
    
    expect(result).toEqual( {
      a: 1,
      b: 3,
      c: 5,
      d: 6
    });
  });
  
  it('should replace arrays instead of merging', () => {
    const configs = [
      { arr: [1, 2, 3], obj: { a: 1 } },
      { arr: [4, 5], obj: { b: 2 } },
      { arr: [6], obj: { a: 3, c: 4 } }
    ];
    
    const result = mergeConfigs(configs);
    
    expect(result).toEqual( {
      arr: [6], // Last array wins
      obj: {
        a: 3, // Overridden
        b: 2,
        c: 4
      }
    });
  });
  
  it('should handle nested objects', () => {
    const configs = [
      {
        level1: {
          level2: {
            a: 1,
            b: 2
          },
          x: 10
        }
      },
      {
        level1: {
          level2: {
            b: 3,
            c: 4
          },
          y: 20
        }
      }
    ];
    
    const result = mergeConfigs(configs);
    
    expect(result).toEqual( {
      level1: {
        level2: {
          a: 1,
          b: 3,
          c: 4
        },
        x: 10,
        y: 20
      }
    });
  });
  
  it('should handle null and undefined values', () => {
    const configs = [
      { a: null, b: undefined, c: 1 },
      { a: 2, b: 3, c: null }
    ];
    
    const result = mergeConfigs(configs);
    
    expect(result).toEqual( {
      a: 2,
      b: 3,
      c: null
    });
  });
});