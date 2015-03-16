define({
	WIDTH: 600,
	HEIGHT: 450,
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
	TIME_SCALE: 1.0 //2.0 will run twice as fast, 0.5 will run at half speed
});