requirejs.config({
	baseUrl: 'javascripts',
	paths: {
		lib: '/javascripts/lib',
		app: '/javascripts/app',
		jquery: '/javascripts/lib/jquery'
	}
});

requirejs([ 'app/Main3' ], function(Main) {
	Main();
});