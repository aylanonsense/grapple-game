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

		//debug changing vars
		var inputs = document.getElementsByTagName("input");
		for(var i = 0; i < inputs.length; i++) {
			inputs[i].onkeyup = updateConstants;
		}
		function updateConstants(evt) {
			if(Constants.KEY_BINDINGS[evt.which]) {
				evt.target.blur();
				evt.target.value = evt.target.value.toLowerCase().replace("w", "").replace("a", "")
					.replace("s", "").replace("d", "").replace(" ", "");
			}
			Constants.FRAMES_PER_SECOND = getVal("frames_per_second");
			if(Constants.FRAMES_PER_SECOND === 60) {
				Constants.FRAMES_PER_SECOND = null;
			}
			Constants.TIME_SCALE = getVal("time_scale");
			Constants.BOUNCE_AMOUNT = getVal("bounce_amount");
			Constants.PLAYER_PHYSICS.GRAVITY = getVal("gravity");
			Constants.PLAYER_PHYSICS.JUMP_SPEED = getVal("jump_speed");
			Constants.PLAYER_PHYSICS.JUMP_BRAKE_SPEED = getVal("jump_brake_speed");
			Constants.PLAYER_PHYSICS.STICKY_FORCE = getVal("sticky_force");
			Constants.PLAYER_PHYSICS.MAX_VERTICAL_SPEED = getVal("max_vertical_speed");
			Constants.PLAYER_PHYSICS.STABILITY_ANGLE = getVal("stability_angle");
			Constants.PLAYER_PHYSICS.GROUND.TURN_AROUND_ACC = getVal("ground_turn_around_acc");
			Constants.PLAYER_PHYSICS.GROUND.SLOW_DOWN_ACC = getVal("ground_slow_down_acc");
			Constants.PLAYER_PHYSICS.GROUND.SPEED_UP_ACC = getVal("ground_speed_up_acc");
			Constants.PLAYER_PHYSICS.GROUND.SOFT_MAX_SPEED = getVal("ground_soft_max_speed");
			Constants.PLAYER_PHYSICS.GROUND.MAX_SPEED = getVal("ground_max_speed");
			Constants.PLAYER_PHYSICS.AIR.TURN_AROUND_ACC = getVal("air_turn_around_acc");
			Constants.PLAYER_PHYSICS.AIR.SLOW_DOWN_ACC = getVal("air_slow_down_acc");
			Constants.PLAYER_PHYSICS.AIR.SPEED_UP_ACC = getVal("air_speed_up_acc");
			Constants.PLAYER_PHYSICS.AIR.SOFT_MAX_SPEED = getVal("air_soft_max_speed");
			Constants.PLAYER_PHYSICS.AIR.MAX_SPEED = getVal("air_max_speed");
			Constants.PLAYER_PHYSICS.SLIDING.TURN_AROUND_ACC = getVal("slide_turn_around_acc");
			Constants.PLAYER_PHYSICS.SLIDING.SLOW_DOWN_ACC = getVal("slide_slow_down_acc");
			Constants.PLAYER_PHYSICS.SLIDING.SPEED_UP_ACC = getVal("slide_speed_up_acc");
			Constants.PLAYER_PHYSICS.SLIDING.SOFT_MAX_SPEED = getVal("slide_soft_max_speed");
			Constants.PLAYER_PHYSICS.SLIDING.MAX_SPEED = getVal("slide_max_speed");
			Constants.GRAPPLE_PHYSICS.MOVE_SPEED = getVal("grapple_move_speed");
			Constants.GRAPPLE_PHYSICS.MIN_RADIUS = getVal("grapple_min_radius");
			Constants.GRAPPLE_PHYSICS.MAX_RADIUS = getVal("grapple_max_radius");
			Constants.GRAPPLE_PHYSICS.MIN_LENGTH = getVal("grapple_min_length");
			Constants.GRAPPLE_PHYSICS.MAX_LENGTH = getVal("grapple_max_length");
			Constants.GRAPPLE_PHYSICS.PULL_ACC = getVal("grapple_pull_acc");
			Constants.GRAPPLE_PHYSICS.SHORTENING_ACC = getVal("grapple_shortening_acc");
		}
		function getVal(name) {
			return +document.getElementsByName(name)[0].value || 0;
		}
	};
});