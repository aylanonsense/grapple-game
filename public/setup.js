//configure requirejs
requirejs.config({ baseUrl: 'javascripts' });

//execute the main class
requirejs([ 'main' ], function(main) {
	main();
});