define([
	'util/extend',
	'entity/Entity'
], function(
	extend,
	Entity
) {
	function BouncyBall(params) {
		Entity.call(this, extend(params, {
			entityType: 'BouncyBall',
			radius: 5,
			bounce: 0.9,
			renderColor: '#ff0000',
			gravity: 0,
			stabilityAngle: Math.PI / 4
		}));
	}
	BouncyBall.prototype = Object.create(Entity.prototype);
	return BouncyBall;
});