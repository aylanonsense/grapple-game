//configure requirejs
var requirejs = require('requirejs');
requirejs.config({ baseUrl: __dirname + '/../javascripts', nodeRequire: require });

//turn off rendering for commandline unit tests
var global = requirejs('global');
global.RENDER = false;

//export requirejs
module.exports = {
	require: requirejs
};