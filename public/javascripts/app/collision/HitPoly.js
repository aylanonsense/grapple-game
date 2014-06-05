if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function HitPoly(points) {
		this._points = points;
	}
	HitPoly.prototype.extend = function(obj) {
		obj._hitType = 'POLY';
		obj.points = this._points.map(function(point) {
			return { x: point.x, y: point.y; };
		});
		obj.checkForCollision = checkForCollision;
	};
	function checkForCollision(other) {
		throw new Error("I don't know how to check for collisions between a " + this._hitType + " and a " + other._hitType);
	}
	return HitPoly;
});