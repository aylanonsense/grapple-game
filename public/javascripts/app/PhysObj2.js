if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	function PhysObj() {
		this.pos = { x: 0, y: 0 };
		this.vel = { x: 0, y: 0 };
		this.width = 0;
		this.height = 0;
		this.mass = 100;
		this.ignoreFriction = false;
		this.frozen = false;
		this._force = { x: 0, y: 0 };
	}
	PhysObj.prototype.checkForCollision = function(other) {
		var x1 = this.pos.x - this.width / 2;
		var x2 = this.pos.x + this.width / 2;
		var y1 = this.pos.y - this.height / 2;
		var y2 = this.pos.y + this.height / 2;
		var x1other = other.pos.x - other.width / 2;
		var x2other = other.pos.x + other.width / 2;
		var y1other = other.pos.y - other.height / 2;
		var y2other = other.pos.y + other.height / 2;
		if(((x1 <= x1other && x1other <= x2) || (x1 <= x2other && x2other <= x2) ||
			(x1other <= x1 && x1 <= x2other) || (x1other <= x2 && x2 <= x2other)) &&
			((y1 <= y1other && y1other <= y2) || (y1 <= y2other && y2other <= y2) ||
			(y1other <= y1 && y1 <= y2other) || (y1other <= y2 && y2 <= y2other))) {
			var diffX = this.pos.x - other.pos.x;
			var diffY = this.pos.y - other.pos.y;
			var embedX = (this.pos.x > other.pos.x ? 1 : -1) * (this.width / 2 + other.width / 2) - diffX;
			var embedY = (this.pos.y > other.pos.y ? 1 : -1) * (this.height / 2 + other.height / 2) - diffY;
			var isHorizontalCollision = Math.abs(embedX) < Math.abs(embedY);
			if(isHorizontalCollision) {
				embedY = 0;
			}
			else {
				embedX = 0;
			}
			return {
				embed: {
					x: embedX,
					y: embedY
				},
				horizontal: isHorizontalCollision,
				other: other
			};
		}
		else {
			return false;
		}
	};
	PhysObj.prototype.undoCollision = function(collision) {
		if(this.frozen && !collision.other.frozen) {
			collision.other.pos.x -= collision.embed.x;
			collision.other.pos.y -= collision.embed.y;
		}
		else if(collision.other.frozen && !this.frozen) {
			this.pos.x += collision.embed.x;
			this.pos.y += collision.embed.y;
		}
		else {
			var percent = 0.5;
			if(this.mass !== collision.other.mass) {
				percent = this.mass / (this.mass + collision.other.mass);
			}
			this.pos.x += collision.embed.x * percent;
			this.pos.y += collision.embed.y * percent;
			collision.other.pos.x -= collision.embed.x * (1 - percent);
			collision.other.pos.y -= collision.embed.y * (1 - percent);
		}
	};
	PhysObj.prototype.applyForce = function(forceX, forceY) { //or (force, dirX, dirY)
		if(arguments.length === 3) {
			var force = arguments[0];
			var dirX = arguments[1];
			var dirY = arguments[2];
			var totalDir = Math.sqrt(dirX * dirX + dirY * dirY);
			this._force.x += force * dirX / totalDir;
			this._force.y += force * dirY / totalDir;
		}
		else {
			this._force.x += forceX;
			this._force.y += forceY;
		}
	};
	PhysObj.prototype.tick = function(ms, forces) {
		var t = ms / 1000;
		if(!this.frozen) {
			var accX = this._force.x / this.mass;
			var accY = this._force.y / this.mass;
			var oldVelX = this.vel.x;
			var oldVelY = this.vel.y;
			this.vel.x += accX * t;
			this.vel.y += accY * t;
			this.pos.x += (this.vel.x + oldVelX) / 2 * t;
			this.pos.y += (this.vel.y + oldVelY) / 2 * t;
			if(!this.ignoreFriction) {
				var friction = Math.pow(Math.E, Constants.FRICTION * t);
				this.vel.x *= friction;
				this.vel.y *= friction;
			}
		}
		this._force.x = 0;
		this._force.y = 0;
	};
	return PhysObj;
});