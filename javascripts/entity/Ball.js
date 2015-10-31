define([
	'Global',
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'display/Draw'
], function(
	Global,
	extend,
	Entity,
	Vector,
	Draw
) {
	function Ball(params) {
		Entity.call(this, extend(params, {
			entityType: 'Ball',
			radius: 30,
			renderColor: '#ff0000',
			gravityY: 300
		}));
	}
	Ball.prototype = Object.create(Entity.prototype);
	return Ball;
});