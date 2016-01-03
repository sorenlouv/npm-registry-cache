# npm-registry-cache
Simple cache of the entire npm registry. Choose which fields per package to cache (eg. name and author), and how often the cache should be rebuilt.

## Installation
```
npm install npm-registry-cache --save
```

## Usage

```js
var registry = new RegistryCache([options]);
```

 - `options` (_Object_)
 	- `ttl` (_Integer_) Number of milliseconds until the cache should be rebuild. Default: 24 hours
 	- `fields` (_Array_ or _Function_) List of the package fields to cache, eg title, description, author. Defaults: "name"

**Simple Example**
```js
var RegistryCache = require('npm-registry-cache');
var registry = new RegistryCache();

var results = registry.get();
console.log(results.length);
```

**Example with fields and ttl**
```js
var RegistryCache = require('npm-registry-cache');
var registry = new RegistryCache({
	ttl: 1000*3600*24*7,
	fields: ['name', 'version', 'homepage']
});

var results = registry.get();
console.log(results.length);
```
