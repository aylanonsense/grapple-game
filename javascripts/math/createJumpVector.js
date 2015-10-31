define([
	'math/Vector'
], function(
	Vector
) {
	return function createJumpVector(angle) {
		var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
		if(distFromTop > Math.PI) {
			distFromTop = distFromTop - 2 * Math.PI;
		}
		var squareDistFromTop = distFromTop * distFromTop;
		var const1 = -0.9;
		var const2 = -const1 / Math.PI;
		angle = angle + const1 * distFromTop + const2 *
			(distFromTop > 0 ? 1 : -1) * squareDistFromTop;
		return new Vector(Math.cos(angle), Math.sin(angle));
	};
});