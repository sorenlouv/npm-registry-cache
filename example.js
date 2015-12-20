var NpmModules = require('./index');
var npmModules = new NpmModules();

var results = npmModules.get();
console.log(results.length);
