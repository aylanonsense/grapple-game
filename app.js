//configure requirejs
var requirejs = require('requirejs');
requirejs.config({ baseUrl: __dirname, nodeRequire: require });
require = requirejs;

//dependencies
var express = require('express');

//set up server
var app = express();
app.use(express.static(__dirname + '/webnonsense'));
app.use('/javascripts', express.static(__dirname + '/javascripts'));
app.listen(process.env.PORT || 3000);