import { mergeWith } from 'lodash';
import { ConfigObject, ConfigValue } from '../types';

/**
 * Merge multiple configuration objects
 * Arrays are replaced, not merged
 */
export function mergeConfigs(configs: ConfigObject[]): ConfigObject {
  if (!configs || !configs.length) {
    return {};
  }
  
  // Custom merge function: arrays are replaced, not merged
  const customizer = (objValue: ConfigValue, srcValue: ConfigValue): ConfigValue | undefined => {
    if (Array.isArray(objValue)) {
      return srcValue;
    }
    return undefined; // Use default merging for other types
  };
  
  return mergeWith({}, ...configs, customizer) as ConfigObject;
}

export default mergeConfigs;