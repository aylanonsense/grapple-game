define([
	'Constants',
	'Game'
], function(
	Constants,
	Game
) {
	return function() {
		//set up the canvas
		var canvas = document.getElementById("game-canvas");
		canvas.setAttribute("width", Constants.WIDTH);
		canvas.setAttribute("height", Constants.HEIGHT);
		var ctx = canvas.getContext("2d");

		//reset the game
		Game.reset();

		//kick off the game loop
		var prevTime = performance.now();
		function loop(time) {
			var framesPerSecond = (Constants.FRAMES_PER_SECOND === null ? 60 : Constants.FRAMES_PER_SECOND);
			var t = Constants.TIME_SCALE * Math.min(3 / framesPerSecond, (time - prevTime) / 1000);
			if(Constants.CONSTANT_TIME_PER_FRAME) {
				t = Constants.TIME_SCALE / framesPerSecond;
			}
			Game.tick(t);
			Game.render(ctx);
			prevTime = time;
			scheduleLoop();
		}
		function scheduleLoop() {
			if(Constants.FRAMES_PER_SECOND === null) {
				requestAnimationFrame(loop);
			}
			else {
				setTimeout(function() {
					loop(performance.now());
				}, 1000 / Constants.FRAMES_PER_SECOND);
			}
		}
		scheduleLoop();

		//add mouse handler
		canvas.onmousedown = onMouseEvent;
		document.onmouseup = onMouseEvent;
		document.onmousemove = onMouseEvent;
		function onMouseEvent(evt) {
			Game.onMouseEvent({
				type: evt.type,
				x: evt.clientX - canvas.offsetLeft + document.body.scrollLeft,
				y: evt.clientY - canvas.offsetTop + document.body.scrollTop
			});
		}

		//add keyboard handler
		var keyboard = {};
		for(var key in Constants.KEY_BINDINGS) { keyboard[Constants.KEY_BINDINGS[key]] = false; }
		document.onkeyup = onKeyboardEvent;
		document.onkeydown = onKeyboardEvent;
		function onKeyboardEvent(evt) {
			var isDown = (evt.type === 'keydown');
			if(Constants.KEY_BINDINGS[evt.which] &&
				keyboard[Constants.KEY_BINDINGS[evt.which]] !== isDown) {
				keyboard[Constants.KEY_BINDINGS[evt.which]] = isDown;
				Game.onKeyboardEvent({
					isDown: isDown,
					key: Constants.KEY_BINDINGS[evt.which]
				}, keyboard);
			}
		}
	};
});