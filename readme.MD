List all packages from npm registry. A cached copy of the npm registry will be stored. It is possible to configure the expiry time.

```
listNpmModules([options], callback);
```
 - `options` (_Object_)
 	- `forceUpdate` (_Boolean_) Bypass cache and download from registry
	- `validity` (_Integer_) Milliseconds before cache is stale

**Example**
```
var listNpmModules = require('list-npm-modules');

listNpmModules(function (result) {
	console.log(result.length); // 229680 and counting
});
```
**Example: Expire cache after 1 hour**
```
var listNpmModules = require('list-npm-modules');

listNpmModules({validity: 3600 * 1000}, function (result) {
	console.log(result.length);
});
```
