//set up a server
var express = require('express');
var app = express();

//serve web stuff
app.use(express.static(__dirname + '/public'));
app.get('/require.js', function(req, res) {
	res.sendFile(__dirname + '/node_modules/requirejs/require.js');
});
app.use('/javascripts', express.static(__dirname + '/javascripts'));

//run server
app.listen(process.env.PORT || 3000);