import { ConfigObject, ConfigValue } from '../types';
import { put } from './deep';

const PROPERTY_SEPARATOR = '_';

/**
 * Override configuration values with environment variables
 * Environment variables should be prefixed with the marker (e.g., CONFIG_)
 * and use underscores to separate nested properties
 * 
 * Example: CONFIG_database_host=localhost overrides config.database.host
 */
export function override(
  marker: string | boolean,
  config: ConfigObject,
  values: NodeJS.ProcessEnv | Record<string, string | undefined>
): ConfigObject {
  // If override is disabled, return config as-is
  if (!marker) {
    return config;
  }
  
  const envConfigPrefix = String(marker) + PROPERTY_SEPARATOR;
  
  // Find all environment variables that match the prefix
  Object.keys(values)
    .filter(name => {
      return name.startsWith(envConfigPrefix) && name.length > envConfigPrefix.length;
    })
    .forEach(name => {
      const value = values[name];
      if (value !== undefined) {
        // Extract property path from environment variable name
        const prop = name.substring(envConfigPrefix.length);
        const propPath = prop.split(PROPERTY_SEPARATOR);
        
        // Cast the value to appropriate type
        const castValue = castEnvironmentValue(value);
        
        // Set the value in the config object
        put(config, propPath, castValue);
      }
    });
  
  return config;
}

/**
 * Cast environment variable string to appropriate type
 */
function castEnvironmentValue(value: string): ConfigValue {
  const trimmed = value.trim();
  
  // Boolean values
  if (trimmed.toLowerCase() === 'true') {
    return true;
  }
  if (trimmed.toLowerCase() === 'false') {
    return false;
  }
  
  // Null/undefined values
  if (trimmed === 'null') {
    return null;
  }
  if (trimmed === 'undefined') {
    return undefined;
  }
  
  // Numeric values
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^-?\d*\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  
  // JSON objects/arrays
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // If JSON parsing fails, return as string
      return value;
    }
  }
  
  // Default to string
  return value;
}

export default override;