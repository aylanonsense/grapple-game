if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function HitRect(width, height) {
		this._width = width;
		this._height = height;
	}
	HitRect.prototype.extend = function(obj) {
		obj._hitType = 'RECT';
		obj.width = this._width;
		obj.height = this._height;
		obj.checkForCollision = checkForCollision;
	};
	function checkForCollision(other) {
		if(other._hitType === 'RECT') {
			var left = this.pos.x - this.width / 2;
			var right = this.pos.x + this.width / 2;
			var top = this.pos.y - this.height / 2;
			var bottom = this.pos.y + this.height / 2;
			var otherLeft = other.pos.x - other.width / 2;
			var otherRight = other.pos.x + other.width / 2;
			var otherTop = other.pos.y - other.height / 2;
			var otherBottom = other.pos.y + other.height / 2;
			if(((left <= otherLeft && otherLeft <= right) ||
				(left <= otherRight && otherRight <= right) ||
				(otherLeft <= left && left <= otherRight) ||
				(otherLeft <= right && right <= otherRight)) &&
				((top <= otherTop && otherTop <= bottom) ||
				(top <= otherBottom && otherBottom <= bottom) ||
				(otherTop <= top && top <= otherBottom) ||
				(otherTop <= bottom && bottom <= otherBottom))) {
				return {
					self: this,
					other: other,
					embed: {
						x: (this.pos.x > other.pos.x ? 1 : -1) *
							(this.width / 2 + other.width / 2) -
							this.pos.x + other.pos.x,
						y: (this.pos.y > other.pos.y ? 1 : -1) *
							(this.height / 2 + other.height / 2) -
							this.pos.y + other.pos.y
					}
				};
			}
		}
		else {
			throw new Error("I don't know how to check for collisions between a " + this._hitType + " and a " + other._hitType);
		}
		return false;
	}
	return HitRect;
});