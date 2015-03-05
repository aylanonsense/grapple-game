define([
	'Constants',
	'Game'
], function(
	Constants,
	Game
) {
	return function() {
		//set up canvas
		var canvas = document.getElementById("game-canvas");
		canvas.setAttribute("width", Constants.WIDTH);
		canvas.setAttribute("height", Constants.HEIGHT);
		var ctx = canvas.getContext("2d");

		//kick off game loop
		Game.reset();
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
			evt.gameX = evt.clientX - canvas.offsetLeft + document.body.scrollLeft;
			evt.gameY = evt.clientY - canvas.offsetTop + document.body.scrollTop;
			Game.onMouseEvent(evt);
		}

		//add keyboard handler
		var keyboard = {};
		for(var key in Constants.KEY_BINDINGS) { keyboard[Constants.KEY_BINDINGS[key]] = false; }
		document.onkeyup = onKeyboardEvent;
		document.onkeydown = onKeyboardEvent;
		function onKeyboardEvent(evt) {
			evt.isDown = (evt.type === 'keydown');
			if(Constants.KEY_BINDINGS[evt.which] &&
				keyboard[Constants.KEY_BINDINGS[evt.which]] !== evt.isDown) {
				keyboard[Constants.KEY_BINDINGS[evt.which]] = evt.isDown;
				evt.gameKey = Constants.KEY_BINDINGS[evt.which];
				Game.onKeyboardEvent(evt, keyboard);
			}
		}
	};
});