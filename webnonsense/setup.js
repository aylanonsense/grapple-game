//configure requirejs
requirejs.config({
	baseUrl: 'javascripts',
	paths: {
		jquery: '/javascripts/lib/jquery'
	}
});

//execute the main class
requirejs([ 'Main' ], function(Main) {
	Main();
});