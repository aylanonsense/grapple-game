if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function HitPoint() {}
	HitPoint.prototype.extend = function(obj) {
		obj._hitType = 'POINT';
		obj.checkForCollision = checkForCollision;
	};
	function checkForCollision(other) {
		throw new Error("I don't know how to check for collisions between a " + this._hitType + " and a " + other._hitType);
		/*if(other._hitType === 'POINT') {
			if(this.pos.x === other.pos.x && this.pos.y === other.pos.y) {
				return {
					embedded: null,
					other: other
				};
			}
		}
		else if(other._hitType === 'LINE') {
			if(other.startPoint.x === other.endPoint.x) {
				if(this.pos.x === other.startPoint.x &&
					((other.startPoint.y <= this.pos.y && this.posy.y <= other.endPoint.y) ||
					(other.endPoint.y <= this.pos.y && this.posy.y <= other.startPoint.y))) {
					return {
						embedded: null,
						other: other
					};
				}
			}
			else {
				var m = (other.endPoint.y - other.startPoint.y) / (other.endPoint.x - other.startPoint.x);
				var b = startPoint.y - m * startPoint.x;
				if(this.pos.y === m * this.pos.x + b) {
					return {
						embedded: null,
						other: other
					};
				}
			}
		}
		else if(other._hitType === 'RECT') {
			if(other.pos.x - other.width / 2 <= this.pos.x && this.pos.x <= other.pos.x + other.width / 2 &&
				other.pos.y - other.height / 2 <= this.pos.y && this.pos.y <= other.pos.y + other.height / 2) {
				return {
					embedded: {
						x: other.pos.x - this.pos.x + other.width / (this.pos.x > other.pos.x ? 2 : -2),
						y: other.pos.y - this.pos.y + other.height / (this.pos.y > other.pos.y ? 2 : -2)
					}, //add these to this.pos to undo collision
					other: other
				};
			}
		}
		else if(other._hitType === 'CIRCLE') {
			var distX = this.pos.x - other.pos.x;
			var distY = this.pos.y - other.pos.y;
			var squareDist = distX * distX + distY * distY;
			if(squareDist <= other.radius * other.radius) {
				var embedX = distX / dist * other.radius;
				return {
					var dist = Math.sqrt(squareDist);
					embedded: {
						x: distX / dist * other.radius - distX,
						y: distY / dist * other.radius - distY
					},
					other: other
				};
			}
		}
		else if(other._hitType === 'POLY') {

		}
		return false;*/
	}
	return HitPoint;
});