# read-config-ng
[![NPM](https://img.shields.io/npm/v/read-config-ng)](https://www.npmjs.com/package/read-config-ng)
<!-- [![Coverage Status](https://coveralls.io/repos/github/billchurch/read-config-ng/badge.svg)](https://coveralls.io/github/billchurch/read-config-ng) -->

## About original package
The original author, Paweł Mendelski <pawel.mendelski@coditorium.com>, has appeared to have abandoned this package. I took the last published version (1.6.0) and updated it to resolve some vulnerabilities in a few dependencies.

**Current Status**: Fully migrated to TypeScript with modern async/await support, Vitest test runner, and Node.js 22+ requirements.

## Summary
Multi format configuration loader for Node.js with TypeScript support.
Features:

- Environmental variables replacement
- Configuration variables replacement
- Overriding configuration properties via environmental variables
- Variable default values
- Hierarchical configurations
- Supported formats:
  - [JSON5](http://json5.org/)
  - [YAML](http://en.wikipedia.org/wiki/YAML)
  - [Properties](http://en.wikipedia.org/wiki/.properties)
- Modern Promise-based API with async/await support
- Full TypeScript support with type definitions
- Node.js 22+ compatibility

## Requirements

- Node.js 22.0.0 or higher

## Installation

```bash
npm install read-config-ng
```

## How to use

### Modern ESM/TypeScript Usage (Recommended)

```typescript
import readConfig from 'read-config-ng';
// or
import { readConfig } from 'read-config-ng';

// Modern async/await API (default)
const config = await readConfig('/path/to/config.json');
console.log(config);
```

### CommonJS Usage

```javascript
const readConfig = require('read-config-ng');

// Async with await
const config = await readConfig('/path/to/config.json');

// Or with .then()
readConfig('/path/to/config.json')
  .then(config => console.log(config));
```

### Environment variable replacement

/tmp/config.json:
```json
{ "env1": "%{ENV_VAR1}", "env2": "%{ENV_VAR2|def}" }
```

```typescript
import readConfig from 'read-config-ng';

const config = await readConfig('/tmp/config.json');
console.log(config);

// $ ENV_VAR1=abc node index.js  
// { env1: 'abc', env2: 'def' }
```

- It is possible to change `%` to any other character. Just use `replaceEnv` configuration option.
- It is possible to use default values when environmental variable is not set.

### Configuration overriding with system variables

/tmp/config.json:
```json
{
    "rootProp": "rootProp",
    "objProp": {
        "x": "X"
    }
}
```
```typescript
import readConfig from 'read-config-ng';

const config = await readConfig('/tmp/config.json', { override: true });
console.log(config);

// $ node index.js
// { rootProp: 'rootProp', objProp: { x: 'X'} }

// $ CONFIG_objProp_x=abc node index.js  
// { rootProp: 'rootProp', objProp: { x: 'abc'} }
```

- It is possible to change `CONFIG` to any other character. Just use `override` configuration option.
- It is possible to override existing value or create new one.

### Configuration variable replacement

/tmp/config.json:
```json
{
    "text1": "def",
    "text2": "abc-@{text1}-ghi",
    "number1": 1,
    "number2": "@{number1}",
    "boolean1": true,
    "boolean2": "@{boolean1}",
    "null1": null,
    "null2": "@{null1}",
    "obj1": {
        "x": "X",
        "y": "@{./x}",
        "z": "@{../text1}"
    },
    "obj2": "@{obj1}"
}
```
```typescript
import readConfig from 'read-config-ng';

const config = await readConfig('/tmp/config.json');
console.log(config);

//  $ node index.js
//  {
//    text1: "def",
//    text2: "abc-def-ghi"
//    number1: 1,
//    number2: 1,
//    boolean1: true,
//    boolean2: true,
//    null1: null,
//    null2: null,
//    obj1: {
//      x: 'X',
//      y: 'X',
//      z: 'def'
//    },
//    obj2: {
//      x: 'X',
//      y: 'X',
//      z: 'def'
//    }
//  }
```

- It is possible to use nested paths like `@{x.y.z}`
- It is possible to use relative paths like `@{./x}` and `@{../y}`
- It is possible to concatenate variables like `@{x}abc@{y}def@{ghi}`

### Configuration hierarchy

/tmp/config-1.json:
```json
{
    "a": "a",
    "b": "b",
    "arr": [1, 2, 3]
}
```
/tmp/config-2.json:
```json
{
    "__parent": "/tmp/config-1.json",
    "b": "bb",
    "c": "aa",
    "arr": []
}
```

```typescript
import readConfig from 'read-config-ng';

const config = await readConfig('/tmp/config-2.json');
console.log(config);

//  $ node index.js
//  {
//    a: "a"
//    b: "bb",
//    c: "aa",
//    arr: []
//  }

```

### Hierarchy and basedir

/tmp/config-1.json:
```json
{
    "a": "a",
    "b": "b",
    "arr": [1, 2, 3]
}
```
/home/xxx/config-2.json:
```json
{
    "__parent": "config-1",
    "b": "bb",
    "c": "aa",
    "arr": []
}
```

```typescript
import readConfig from 'read-config-ng';

const config = await readConfig('/home/xxx/config-2.json');
console.log(config);

//  $ node index.js
//  {
//    a: "a"
//    b: "bb",
//    c: "aa",
//    arr: []
//  }
```

### YAML config format

Using YAML representation lookout for special characters like: '%' and '@'.

/tmp/config.yml:
```yaml
a: "@{LOCAL_VAR}"
b: "%{ENV_VAR}"
c: No quotes needed!
```

## API

### Functions

- **readConfig(paths, [opts])** - Modern Promise-based async API (default export).
- **readConfig.sync(paths, [opts])** - Loads configuration file synchronously.
- **readConfig.callback(paths, [opts], callback)** - Legacy callback-based asynchronous API.

All JSON files are loaded using [JSON5](https://www.npmjs.com/package/json5) library with full TypeScript support. You can add comments and skip quotes in your config files.

### Parameters

- **paths** (String/Array) - path (or array of paths) to configuration file. If passed an array of paths than every configuration is resolved separately than merged hierarchically (like: [grand-parent-config, parent-config, child-config]).
- **opts** (Object, optional) - configuration loading options
    - **parentField** - (Boolean/String, default: true) if specified enables configuration hierarchy. It's value is used to resolve parent configuration file. This field will be removed from the result. A string value overrides `__parentField` property name.
    - **optional** - (String/Array, default: []) list of configuration paths that are optional. If any configuration path is not resolved and is not optional it's treated as empty file and no exception is raised.
    - **basedir** - (String/Array, default: []) base directory (or directories) used for searching configuration files. Mind that `basedir` has lower priority than a configuration directory, process basedir, and absolute paths.
    - **replaceEnv** - (Boolean/String, default: false, constraint: A string value must be different than `replaceLocal`) if specified enables environment variable replacement. Expected string value e.g. `%` that will be used to replace all occurrences of `%{...}` with environment variables. You can use default values like: %{a.b.c|some-default-value}.
    - **replaceLocal** - (Boolean/String, default: '@', constraint: A string value must be different than `replaceEnv`) if specified enables configuration variable replacement. Expected string value e.g. `@` that will be used to replace all occurrences of `@{...}` with configuration variables. You can use default values like: @{a.b.c|some-default-value}.
    - **override** - (Boolean/String, default: false) If specified enables configuration overriding with environmental variables like `CONFIG_<propertyName>`.
    - **skipUnresolved** - (Boolean, default: false) `true` blocks error throwing on unresolved variables.

Default **opts** values:
```typescript
{
    parentField: "__parent",
    optional: [],
    basedir: ".",
    replaceEnv: "%",
    replaceLocal: "@",
    skipUnresolved: false,
    freeze: false
}
```

## Flow

Flow of the configuration loader:

1. Merge all configs passed in **path** parameter with all of their parents (merging all hierarchy)
2. Merge all results to one json object
3. Override configuration with environment variables
4. Resolve environment variables
5. Resolve local variables

## Development Commands

### Testing
- `npm test` - Run tests using Vitest
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with Vitest coverage reporting
- `npm run test:ci` - Run tests with minimal output for CI

### Build & Type Checking
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run build:watch` - Compile TypeScript in watch mode
- `npm run typecheck` - Type check without emitting files
- `npm run clean` - Clean dist and coverage directories

### Linting
- `npm run lint` - Lint source code with ESLint
- `npm run lint:fix` - Auto-fix linting issues
