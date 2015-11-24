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
			bounce: 0.9,
			renderColor: '#ff0000'
		}));
	}
	BouncyBall.prototype = Object.create(Entity.prototype);
	return BouncyBall;
});