define([
	'global'
], function(
	global
) {
	var DEBUG_VARS = {
		"Basic": [ "TIME_SCALE", "FRAMES_PER_SECOND" ],
		"Player Physics": [ "PLAYER_PHYSICS.GRAVITY", "PLAYER_PHYSICS.JUMP_SPEED",
			"PLAYER_PHYSICS.JUMP_BRAKE_SPEED", "PLAYER_PHYSICS.STICKY_FORCE", "PLAYER_PHYSICS.MAX_VERTICAL_SPEED",
			"PLAYER_PHYSICS.STABILITY_ANGLE", "PLAYER_PHYSICS.GROUND.TURN_AROUND_ACC", "PLAYER_PHYSICS.GROUND.SLOW_DOWN_ACC",
			"PLAYER_PHYSICS.GROUND.SPEED_UP_ACC", "PLAYER_PHYSICS.GROUND.SOFT_MAX_SPEED", "PLAYER_PHYSICS.GROUND.MAX_SPEED",
			"PLAYER_PHYSICS.AIR.TURN_AROUND_ACC", "PLAYER_PHYSICS.AIR.SLOW_DOWN_ACC", "PLAYER_PHYSICS.AIR.SPEED_UP_ACC",
			"PLAYER_PHYSICS.AIR.SOFT_MAX_SPEED", "PLAYER_PHYSICS.AIR.MAX_SPEED", "PLAYER_PHYSICS.SLIDING.TURN_AROUND_ACC",
			"PLAYER_PHYSICS.SLIDING.SLOW_DOWN_ACC", "PLAYER_PHYSICS.SLIDING.SPEED_UP_ACC", "PLAYER_PHYSICS.SLIDING.SOFT_MAX_SPEED",
			"PLAYER_PHYSICS.SLIDING.MAX_SPEED" ],
		"Grapple Physics": [ "GRAPPLE_PHYSICS.MOVE_SPEED", "GRAPPLE_PHYSICS.MIN_RADIUS", "GRAPPLE_PHYSICS.MAX_RADIUS",
			"GRAPPLE_PHYSICS.MIN_LENGTH", "GRAPPLE_PHYSICS.MAX_LENGTH", "GRAPPLE_PHYSICS.PULL_ACC", "GRAPPLE_PHYSICS.SHORTENING_ACC" ]
	};

	return function addDebugControls() {
		//add a debug control panel with inputs that change global vars
		var controlsDiv = document.createElement("div");
		controlsDiv.setAttribute("id", "debug-controls");
		document.body.appendChild(controlsDiv);
		for(var group in DEBUG_VARS) {
			addGroupLabel(group);
			for(var i = 0; i < DEBUG_VARS[group].length; i++) {
				addInput(DEBUG_VARS[group][i]);
			}
		}

		//helper methods
		function addGroupLabel(group) {
			var p = document.createElement("p");
			p.textContent = group;
			controlsDiv.appendChild(p);
		}
		function addInput(key) {
			var keys = key.split(".");
			var val = global;
			for(var i = 0; i < keys.length; i++) {
				val = val[keys[i]];
			}
			var label = document.createElement("label");
			controlsDiv.appendChild(label);
			var span = document.createElement("span");
			span.textContent = keys[keys.length - 1].toLowerCase();
			label.appendChild(span);
			var input = document.createElement("input");
			input.setAttribute("type", "text");
			input.setAttribute("value", "" + val);
			label.appendChild(input);
			input.onkeyup = createKeyUpHandler(keys);
		}
		function createKeyUpHandler(keys) {
			return function onKeyUp() {
				var val = global;
				for(var i = 0; i < keys.length - 1; i++) {
					val = val[keys[i]];
				}
				val[keys[keys.length - 1]] = +this.value || 0;
			};
		}
	};
});