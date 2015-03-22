define({
	WIDTH: 800,
	HEIGHT: 600,
	KEY_BINDINGS: {
		32: 'JUMP', //space bar
		16: 'PULL_GRAPPLES', //shift key
		38: 'MOVE_UP', 87: 'MOVE_UP', //up arrow key / w key
		37: 'MOVE_LEFT', 65: 'MOVE_LEFT', //left arrow key / a key
		40: 'MOVE_DOWN', 83: 'MOVE_DOWN', //down arrow key / s key
		39: 'MOVE_RIGHT', 68: 'MOVE_RIGHT' //right arrow key / d key
	},
	CONSTANT_TIME_PER_FRAME: false,
	FRAMES_PER_SECOND: null, //null will use requestAnimationFrame
	TIME_SCALE: 1.0, //2.0 will run twice as fast, 0.5 will run at half speed

	//debug vars
	DEBUG_HIDE_SPRITES: false,
	DEBUG_TRACE_SPRITES: false,
	DEBUG_SHOW_PHYS_OBJECTS: false,

	//physics vars
	BOUNCE_AMOUNT: 0.0001,
	PLAYER_PHYSICS: {
		JUMP_SPEED: 350,
		JUMP_BRAKE_SPEED: 100,
		GRAVITY: 600,
		STICKY_FORCE: 1,
		MAX_VERTICAL_SPEED: 1500,
		STABILITY_ANGLE: Math.PI / 4,
		GROUND: {
			TURN_AROUND_ACC: 5000,
			SLOW_DOWN_ACC: 1200,
			SPEED_UP_ACC: 1200,
			SOFT_MAX_SPEED: 220,
			MAX_SPEED: 1000
		},
		AIR: {
			TURN_AROUND_ACC: 450,
			SLOW_DOWN_ACC: 150,
			SPEED_UP_ACC: 450,
			SOFT_MAX_SPEED: 300,
			MAX_SPEED: 1000
		},
		SLIDING: {
			TURN_AROUND_ACC: 175,
			SLOW_DOWN_ACC: 0,
			SPEED_UP_ACC: 175,
			SOFT_MAX_SPEED: 400,
			MAX_SPEED: 1000
		}
	},
	GRAPPLE_PHYSICS: {
		MOVE_SPEED: 2000,
		MIN_RADIUS: 1,
		MAX_RADIUS: 24,
		MIN_LENGTH: 50,
		MAX_LENGTH: 300,
		PULL_ACC: 1800,
		SHORTENING_ACC: 150,
	}
});