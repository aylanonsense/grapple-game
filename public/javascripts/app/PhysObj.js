if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Constants'
], function(
	Constants
) {
	var nextId = 0;
	function PhysObj() {
		this._id = nextId++;
		this.pos = { x: 0, y: 0 };
		this.vel = { x: 0, y: 0 };
		this.mass = 100;
		this.ignoreFriction = false;
		this.frozen = false;
		this._force = { x: 0, y: 0 };
		this._fixedForce = { x: 0, y: 0 };
	}
	PhysObj.prototype.sameAs = function(other) {
		return other && other._id === this._id;
	};
	PhysObj.prototype.setHitBox = function(hitbox) {
		hitbox.extend(this);	
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
	PhysObj.prototype.applyFixedForce = function(forceX, forceY) { //or (force, dirX, dirY)
		if(arguments.length === 3) {
			var force = arguments[0];
			var dirX = arguments[1];
			var dirY = arguments[2];
			var totalDir = Math.sqrt(dirX * dirX + dirY * dirY);
			this._fixedForce.x += force * dirX / totalDir;
			this._fixedForce.y += force * dirY / totalDir;
		}
		else {
			this._fixedForce.x += forceX;
			this._fixedForce.y += forceY;
		}
	};
	PhysObj.prototype.tick = function(ms, forces) {
		var t = ms / 1000;
		if(!this.frozen) {
			var accX = this._force.x / this.mass;
			var accY = this._force.y / this.mass;
			var fixedAccX = this._fixedForce.x / this.mass;
			var fixedAccY = this._fixedForce.y / this.mass;
			var oldVelX = this.vel.x;
			var oldVelY = this.vel.y;
			this.vel.x += accX * t + fixedAccX * 0.017;
			this.vel.y += accY * t + fixedAccY * 0.017;
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
		this._fixedForce.x = 0;
		this._fixedForce.y = 0;
	};
	return PhysObj;
});