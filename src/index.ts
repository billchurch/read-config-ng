/**
 * read-config-ng - Multi-format configuration loader for Node.js
 * 
 * Modern async/await API with TypeScript support
 */

import {
  readConfig,
  readConfigSync,
  readConfigCallback
} from './read-config.js';

// Default export is the async function (modern API)
export default readConfig;

// Named exports for different usage patterns
export {
  readConfig,
  readConfig as async,
  readConfigSync,
  readConfigSync as sync,
  readConfigCallback,
  readConfigCallback as callback
};

// Type exports
export {
  ConfigObject,
  ConfigOptions,
  ConfigCallback,
  ConfigValue,
  ConfigArray,
  Parser
} from './types.js';

// Error export
export { ReadConfigError } from './read-config-error.js';


