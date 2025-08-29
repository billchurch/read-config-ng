/**
 * read-config-ng - Multi-format configuration loader for Node.js
 * 
 * Modern async/await API with TypeScript support
 */

import {
  readConfig,
  readConfigSync,
  readConfigCallback,
  ReadConfigError
} from './read-config';

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
} from './types';

// Error export
export { ReadConfigError } from './read-config-error';

// Create a namespace that mimics the old API for backward compatibility
const readConfigCompat = Object.assign(readConfig, {
  async: readConfig,
  sync: readConfigSync,
  callback: readConfigCallback,
  default: readConfig,
  ReadConfigError
});

// CommonJS compatibility
module.exports = readConfigCompat;
module.exports.default = readConfig;
module.exports.async = readConfig;
module.exports.sync = readConfigSync;
module.exports.callback = readConfigCallback;
module.exports.ReadConfigError = ReadConfigError;