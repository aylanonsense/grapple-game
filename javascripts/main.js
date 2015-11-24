define([
	'global',
	'display/canvas',
	'Game',
	'util/now',
	'debug/addDebugControls'
], function(
	global,
	canvas,
	Game,
	now,
	addDebugControls
) {
	return function() {
		require([ global.LEVEL ], function(Level) {
			//set up the canvas
			if(global.RENDER) {
				canvas.setAttribute("width", global.CANVAS_WIDTH);
				canvas.setAttribute("height", global.CANVAS_HEIGHT);
			}

			//create the game
			var game = new Game(new Level());

			//kick off the game loop
			var prevTime = performance.now();
			function loop() {
				var time = now();
				var framesPerSecond = global.FRAMES_PER_SECOND === null ? 60 : global.FRAMES_PER_SECOND;
				var t = global.TIME_SCALE * Math.min(3 / framesPerSecond, (time - prevTime) / 1000);
				if(global.CONSTANT_TIME_PER_FRAME) {
					t = global.TIME_SCALE / framesPerSecond;
				}
				game.update(t);
				game.render();
				prevTime = time;
				scheduleLoop();
			}
			function scheduleLoop() {
				if(global.FRAMES_PER_SECOND === null) {
					requestAnimationFrame(loop);
				}
				else {
					setTimeout(loop, 1000 / global.FRAMES_PER_SECOND);
				}
			}
			scheduleLoop();

			//add debug controls along the left side
			if(global.RENDER && global.DEBUG_CONTROLS) {
				addDebugControls();
			}
		});
	};
});