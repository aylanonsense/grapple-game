define([
	'Constants',
	'GameDemo'
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
			Game.tick(Math.min(0.10, (time - prevTime) / 1000));
			Game.render(ctx);
			prevTime = time;
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);

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