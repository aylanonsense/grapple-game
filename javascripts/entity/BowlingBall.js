define([
	'util/extend',
	'entity/Entity'
], function(
	extend,
	Entity
) {
	function BowlingBall(params) {
		Entity.call(this, extend(params, {
			entityType: 'BowlingBall',
			radius: 5,
			bounce: 0,
			friction: 0.5,
			renderColor: '#222222',
			gravity: 300,
			stabilityAngle: Math.PI / 4
		}));
	}
	BowlingBall.prototype = Object.create(Entity.prototype);
	return BowlingBall;
});