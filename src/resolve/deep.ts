import { ConfigObject, ConfigValue } from '../types';

/**
 * Result of picking a value from a nested object
 */
export interface PickResult {
  obj: ConfigObject;
  prop: string;
  value: ConfigValue;
}

/**
 * Pick a value from a nested object using dot notation
 * @param obj The object to pick from
 * @param prop The property path (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @returns The pick result or null if not found
 */
export function pick(obj: ConfigObject, prop: string | string[]): PickResult | null {
  const splitted = Array.isArray(prop) ? prop : prop.split('.');
  let lastProp = splitted.shift();
  let lastObj: ConfigValue = obj;

  if (!lastProp) {
    return null;
  }

  for (const item of splitted) {
    if (!lastObj || typeof lastObj !== 'object' || Array.isArray(lastObj)) {
      return null;
    }
    lastObj = (lastObj as ConfigObject)[lastProp];
    lastProp = item;
  }

  if (!lastObj || typeof lastObj !== 'object' || Array.isArray(lastObj)) {
    return null;
  }

  const finalObj = lastObj as ConfigObject;
  const value = finalObj[lastProp];

  if (value === undefined) {
    return null;
  }

  return {
    obj: finalObj,
    prop: lastProp,
    value
  };
}

/**
 * Put a value into a nested object using dot notation
 * @param obj The object to modify
 * @param prop The property path (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param value The value to set
 * @returns The modified object
 */
export function put(obj: ConfigObject, prop: string | string[], value: ConfigValue): ConfigObject {
  const splitted = Array.isArray(prop) ? prop : prop.split('.');
  let lastProp = splitted.shift();
  let lastObj: ConfigObject = obj;

  if (!lastProp) {
    return obj;
  }

  for (const item of splitted) {
    if (lastObj[lastProp] === undefined || typeof lastObj[lastProp] !== 'object' || Array.isArray(lastObj[lastProp])) {
      lastObj[lastProp] = {};
    }
    lastObj = lastObj[lastProp] as ConfigObject;
    lastProp = item;
  }

  lastObj[lastProp] = value;
  return obj;
}