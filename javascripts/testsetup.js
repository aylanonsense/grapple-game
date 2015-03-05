//configure requirejs
var requirejs = require('requirejs');
requirejs.config({
	baseUrl: __dirname,
	nodeRequire: require
});

module.exports = {
	require: requirejs
};