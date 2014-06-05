if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function HitCircle(radius) {
		this._radius = radius;
	}
	HitCircle.prototype.extend = function(obj) {
		obj._hitType = 'CIRCLE';
		obj.radius = this._radius;
		obj.checkForCollision = checkForCollision;
	};
	function checkForCollision(other) {
		throw new Error("I don't know how to check for collisions between a " + this._hitType + " and a " + other._hitType);
	}
	return HitCircle;
});