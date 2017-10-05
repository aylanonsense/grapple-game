//configure requirejs
requirejs.config({ baseUrl: BASE_URL + '/javascripts' });

//execute the main class
requirejs([ 'main' ], function(main) {
	main();
});