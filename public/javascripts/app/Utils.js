if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	return {
		transformToJumpAngle: function(angle) {
			var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
			if(distFromTop > Math.PI) {
				distFromTop = distFromTop - 2 * Math.PI;
			}
			var squareDistFromTop = distFromTop * distFromTop;
			var const1 = -0.9;
			var const2 = -const1 / Math.PI;
			return angle + const1 * distFromTop + const2 * (distFromTop > 0 ? 1 : -1) * squareDistFromTop;
		}	
	};
});