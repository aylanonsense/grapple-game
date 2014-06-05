requirejs.config({
	baseUrl: 'javascripts',
	paths: {
		lib: '/javascripts/lib',
		app: '/javascripts/app',
		jquery: '/javascripts/lib/jquery'
	}
});

requirejs([ 'app/Main4' ], function(Main) {
	Main();
});