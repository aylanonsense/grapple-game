//configure requirejs
var requirejs = require('requirejs');
requirejs.config({ baseUrl: __dirname + '/../javascripts', nodeRequire: require });

//export requirejs
module.exports = {
	require: requirejs
};

//mock the canvas module
requirejs.define('display/Canvas', null);