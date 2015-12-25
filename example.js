var RegistryCache = require('./index');
var registry = new RegistryCache();

var results = registry.get();
console.log(results.length);
