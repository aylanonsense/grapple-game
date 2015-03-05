//configure requirejs
requirejs.config({ baseUrl: 'javascripts' });

//execute the main class
requirejs([ 'Main' ], function(Main) {
	Main();
});