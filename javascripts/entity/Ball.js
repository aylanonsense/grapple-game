define([
	'global',
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'display/draw'
], function(
	global,
	extend,
	Entity,
	Vector,
	draw
) {
	function Ball(params) {
		Entity.call(this, extend(params, {
			entityType: 'Ball',
			radius: 30,
			bounce: 1,
			renderColor: '#ff0000',
			gravityY: 300
		}));
	}
	Ball.prototype = Object.create(Entity.prototype);
	return Ball;
});