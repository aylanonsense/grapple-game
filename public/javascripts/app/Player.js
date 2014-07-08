if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	function Player(x, y) {
		this.pos = { x: x, y: y, prev: { x: x, y: y } };
		this.vel = { x: 0, y: 0 };
		this.radius = 20;
		this.mass = 1;
		this._force = { x: 0, y: 0 };
		this._instantForce = { x: 0, y: 0 };
	}
	Player.prototype.applyForce = function(forceX, forceY) { //or (force, dirX, dirY)
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
	Player.prototype.applyInstantaneousForce = function(forceX, forceY) { //or (force, dirX, dirY)
		if(arguments.length === 3) {
			var force = arguments[0];
			var dirX = arguments[1];
			var dirY = arguments[2];
			var totalDir = Math.sqrt(dirX * dirX + dirY * dirY);
			this._instantForce.x += force * dirX / totalDir;
			this._instantForce.y += force * dirY / totalDir;
		}
		else {
			this._instantForce.x += forceX;
			this._instantForce.y += forceY;
		}
	};
	Player.prototype.tick = function(ms, friction) {
		var t = ms / 1000;
		var accX = this._force.x / this.mass;
		var accY = this._force.y / this.mass;
		var instantAccX = this._instantForce.x / this.mass;
		var instantAccY = this._instantForce.y / this.mass;
		var oldVelX = this.vel.x;
		var oldVelY = this.vel.y;
		this.vel.x = (this.vel.x + accX * t + instantAccX / 60) * friction;
		this.vel.y = (this.vel.y + accY * t + instantAccY / 60) * friction;
		this.pos.prev.x = this.pos.x;
		this.pos.prev.y = this.pos.y;
		this.pos.x += (this.vel.x + oldVelX) / 2 * t;
		this.pos.y += (this.vel.y + oldVelY) / 2 * t;
		this._force.x = 0;
		this._force.y = 0;
		this._instantForce.x = 0;
		this._instantForce.y = 0;
	};
	Player.prototype.render = function(ctx, camera) {
		ctx.fillStyle = '#6c6';
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return Player;
});