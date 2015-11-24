define([
	'level/Level',
	'entity/test/BouncyBall',
	'platform/Platform'
], function(
	Level,
	BouncyBall,
	Platform
) {
	function Scenario1() {
		Level.call(this);

		var NUM_BALLS = 2500;
		var SPEED = 35;
		var GRAVITY = 0;
		var RADIUS = 5;

		//create entities
		for(var i = 0; i < NUM_BALLS; i++) {
			this.entities.push(new BouncyBall({
				x: -190, y: 0,
				velX: 1000 * Math.random() - 500,
				velY: 1000 * Math.random() - 500,
				gravity: GRAVITY,
				radius: RADIUS,
				level: this
			}));
		}

		//create platforms
		this.addPlatform(new Platform({ points: [-390,-290, -390,290, 390,290, 390,-290] }));
		var points = [];
		for(i = 0; i < 17; i++) {
			points.push(200 * Math.cos(-2 * Math.PI * i / 17));
			points.push(200 * Math.sin(-2 * Math.PI * i / 17));
		}
		this.addPlatform(new Platform({ x: -150, y: 0, points: points })).moveTo(150, 0, { speed: SPEED });
		this.addPlatform(new Platform({ x: -150, y: 0, points: [-200,-200, 200,-200, 200,200, -200,200] })).moveTo(150, 0, { speed: SPEED });
	}
	Scenario1.prototype = Object.create(Level.prototype);
	return Scenario1;
});