var listNpmModules = require('./index');

listNpmModules(function (result) {
	console.log(result.length);
});
