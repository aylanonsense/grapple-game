define([
	'Global',
	'display/Canvas',
	'Game',
	'util/now',
	'debug/addDebugControls'
], function(
	Global,
	Canvas,
	Game,
	now,
	addDebugControls
) {
	return function() {
		//set up the canvas
		Canvas.setAttribute("width", Global.CANVAS_WIDTH);
		Canvas.setAttribute("height", Global.CANVAS_HEIGHT);

		//create the game
		var game = new Game();

		//kick off the game loop
		var prevTime = performance.now();
		function loop() {
			var time = now();
			var framesPerSecond = Global.FRAMES_PER_SECOND === null ? 60 : Global.FRAMES_PER_SECOND;
			var t = Global.TIME_SCALE * Math.min(3 / framesPerSecond, (time - prevTime) / 1000);
			if(Global.CONSTANT_TIME_PER_FRAME) {
				t = Global.TIME_SCALE / framesPerSecond;
			}
			game.update(t);
			game.render();
			prevTime = time;
			scheduleLoop();
		}
		function scheduleLoop() {
			if(Global.FRAMES_PER_SECOND === null) {
				requestAnimationFrame(loop);
			}
			else {
				setTimeout(loop, 1000 / Global.FRAMES_PER_SECOND);
			}
		}
		scheduleLoop();

		//add debug controls along the left side
		if(Global.DEBUG_CONTROLS) {
			addDebugControls();
		}
	};
});