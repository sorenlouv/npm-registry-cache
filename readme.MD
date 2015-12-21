# npm-keys
List all packages from npm registry. A cached copy of the npm registry will be stored. It is possible to configure how long it should be valid, until a fresh version should be retrived.

## Installation
```
npm install npm-keys --save
```

## Usage

```js
var npmKeys = new NpmKeys([ttl]);
```

 - `ttl` (_Integer_) Number of milliseconds until the cache should be rebuild

**Example**
```js
var NpmKeys = require('npm-keys');
var npmKeys = new NpmKeys();

var results = npmKeys.get();
console.log(results.length);
```
