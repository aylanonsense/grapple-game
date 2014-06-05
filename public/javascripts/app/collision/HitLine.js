if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function HitLine(width, height) {
		this._width = width;
		this._height = height;
	}
	HitLine.prototype.extend = function(obj) {
		obj._hitType = 'LINE';
		obj.width = this._width;
		obj.height = this._height;
		obj.checkForCollision = checkForCollision;
	};
	function checkForCollision(other) {
		throw new Error("I don't know how to check for collisions between a " + this._hitType + " and a " + other._hitType);
	}
	return HitLine;
});