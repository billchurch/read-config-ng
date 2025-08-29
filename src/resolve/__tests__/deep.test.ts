import { describe, it, expect } from 'vitest';
import { pick, put } from '../deep';

describe('deep', () => {
  describe('pick', () => {
    const testObj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: [4, 5, 6]
        }
      },
      g: null,
      h: undefined
    };
    
    it('should pick top-level property', () => {
      const result = pick(testObj, 'a');
      
      expect(result).toEqual({
        obj: testObj,
        prop: 'a',
        value: 1
      });
    });
    
    it('should pick nested property with dot notation', () => {
      const result = pick(testObj, 'b.c');
      
      expect(result).toEqual({
        obj: testObj.b,
        prop: 'c',
        value: 2
      });
    });
    
    it('should pick deeply nested property', () => {
      const result = pick(testObj, 'b.d.e');
      
      expect(result).toEqual({
        obj: testObj.b.d,
        prop: 'e',
        value: 3
      });
    });
    
    it('should pick array property', () => {
      const result = pick(testObj, 'b.d.f');
      
      expect(result).toEqual({
        obj: testObj.b.d,
        prop: 'f',
        value: [4, 5, 6]
      });
    });
    
    it('should handle array of path segments', () => {
      const result = pick(testObj, ['b', 'd', 'e']);
      
      expect(result).toEqual({
        obj: testObj.b.d,
        prop: 'e',
        value: 3
      });
    });
    
    it('should return null for non-existent property', () => {
      const result = pick(testObj, 'x.y.z');
      expect(result).toBe(null);
    });
    
    it('should return null for undefined intermediate property', () => {
      const result = pick(testObj, 'h.x');
      expect(result).toBe(null);
    });
    
    it('should handle null values', () => {
      const result = pick(testObj, 'g');
      
      expect(result).toEqual({
        obj: testObj,
        prop: 'g',
        value: null
      });
    });
    
    it('should return null when traversing through null', () => {
      const result = pick(testObj, 'g.x');
      expect(result).toBe(null);
    });
    
    it('should return null for undefined value', () => {
      const result = pick(testObj, 'h');
      expect(result).toBe(null);
    });
  });
  
  describe('put', () => {
    it('should put value at top-level', () => {
      const obj = { a: 1 };
      const result = put(obj, 'b', 2);
      
      expect(result).toBe(obj); // Returns same object
      expect(obj).toEqual({
        a: 1,
        b: 2
      });
    });
    
    it('should put value at nested path', () => {
      const obj = { a: { b: 1 } };
      put(obj, 'a.c', 2);
      
      expect(obj).toEqual({
        a: {
          b: 1,
          c: 2
        }
      });
    });
    
    it('should create intermediate objects', () => {
      const obj = {};
      put(obj, 'a.b.c', 42);
      
      expect(obj).toEqual({
        a: {
          b: {
            c: 42
          }
        }
      });
    });
    
    it('should handle array of path segments', () => {
      const obj = {};
      put(obj, ['x', 'y', 'z'], 'value');
      
      expect(obj).toEqual({
        x: {
          y: {
            z: 'value'
          }
        }
      });
    });
    
    it('should overwrite existing values', () => {
      const obj = { a: { b: 'old' } };
      put(obj, 'a.b', 'new');
      
      expect(obj).toEqual({
        a: {
          b: 'new'
        }
      });
    });
    
    it('should replace non-object values with objects when needed', () => {
      const obj = { a: 'string' };
      put(obj, 'a.b', 42);
      
      expect(obj).toEqual({
        a: {
          b: 42
        }
      });
    });
    
    it('should handle null and undefined values', () => {
      const obj = {};
      put(obj, 'a', null);
      put(obj, 'b', undefined);
      
      expect(obj).toEqual({
        a: null,
        b: undefined
      });
    });
    
    it('should handle empty path', () => {
      const obj = { a: 1 };
      const result = put(obj, '', 42);
      
      expect(result).toBe(obj);
      expect(obj).toEqual({ a: 1 }); // No change
    });
    
    it('should handle arrays in path', () => {
      const obj = { a: [1, 2, 3] };
      put(obj, 'a.1', 42);
      
      expect(obj).toEqual({
        a: {
          '1': 42 // Array becomes object
        }
      });
    });
  });
});