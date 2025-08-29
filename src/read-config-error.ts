/**
 * Custom error class for read-config-ng
 */
export class ReadConfigError extends Error {
  public readonly code: string;
  public readonly path?: string;
  public readonly cause?: Error;

  constructor(message: string, code: string = 'READ_CONFIG_ERROR', path?: string, cause?: Error) {
    super(message);
    this.name = 'ReadConfigError';
    this.code = code;
    this.path = path;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ReadConfigError);
    }
  }

  /**
   * Create a file not found error
   */
  static fileNotFound(path: string): ReadConfigError {
    return new ReadConfigError(
      `Configuration file not found: ${path}`,
      'FILE_NOT_FOUND',
      path
    );
  }

  /**
   * Create a parse error
   */
  static parseError(path: string, cause: Error): ReadConfigError {
    return new ReadConfigError(
      `Failed to parse configuration file: ${path}`,
      'PARSE_ERROR',
      path,
      cause
    );
  }

  /**
   * Create a validation error
   */
  static validationError(message: string): ReadConfigError {
    return new ReadConfigError(message, 'VALIDATION_ERROR');
  }

  /**
   * Create a variable resolution error
   */
  static resolutionError(variable: string, type: 'env' | 'local'): ReadConfigError {
    return new ReadConfigError(
      `Could not resolve ${type} variable: ${variable}`,
      'RESOLUTION_ERROR'
    );
  }
}