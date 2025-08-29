/**
 * Type definitions for read-config-ng
 */

export type ConfigValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | ConfigObject
  | ConfigArray;

export interface ConfigObject {
  [key: string]: ConfigValue;
}

export interface ConfigArray extends Array<ConfigValue> {}

/**
 * Options for loading and processing configuration
 */
export interface ConfigOptions {
  /**
   * Field name used for parent configuration inheritance
   * @default '__parent'
   */
  parentField?: string | boolean;
  
  /**
   * List of optional configuration paths
   * @default []
   */
  optional?: string | string[];
  
  /**
   * Base directory for resolving relative paths
   * @default '.'
   */
  basedir?: string | string[];
  
  /**
   * Marker for environment variable replacement (e.g., '%' for %{VAR})
   * Set to false to disable
   * @default '%'
   */
  replaceEnv?: string | boolean;
  
  /**
   * Marker for local variable replacement (e.g., '@' for @{path})
   * Set to false to disable
   * @default '@'
   */
  replaceLocal?: string | boolean;
  
  /**
   * Environment variable prefix for overriding config values
   * Set to false to disable
   * @default false
   */
  override?: string | boolean;
  
  /**
   * Skip throwing errors on unresolved variables
   * @default false
   */
  skipUnresolved?: boolean;
  
  /**
   * Freeze the returned configuration object
   * @default false
   */
  freeze?: boolean;
}

/**
 * Parser interface for different file formats
 */
export interface Parser {
  /**
   * Load and parse a file asynchronously
   */
  load(filePath: string): Promise<ConfigObject>;
  
  /**
   * Load and parse a file synchronously
   */
  loadSync(filePath: string): ConfigObject;
  
  /**
   * Parse content asynchronously
   */
  parse(content: string): Promise<ConfigObject>;
  
  /**
   * Parse content synchronously
   */
  parseSync(content: string): ConfigObject;
}

/**
 * Callback function signature for legacy async operations
 */
export type ConfigCallback<T = ConfigObject> = (
  error: Error | null,
  result?: T
) => void;

/**
 * Variable expression with optional default value
 */
export interface VariableExpression {
  path: string;
  defaultValue?: string;
}

/**
 * Result of path resolution
 */
export interface ResolvedPath {
  absolute: string;
  exists: boolean;
  optional: boolean;
}