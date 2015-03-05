//configure requirejs
var requirejs = require('requirejs');
requirejs.config({ baseUrl: __dirname + '/../javascripts', nodeRequire: require });

//export requirejs
module.exports = {
	require: requirejs
};