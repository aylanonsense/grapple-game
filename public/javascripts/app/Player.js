if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Grapple',
	'app/GeometryUtils'
], function(
	Grapple,
	GeometryUtils
) {
	function Player(x, y) {
		this.radius = 20;
		this.mass = 1;
		this.adjustMovement({ x: x, y: y }, { x: x, y: y }, { x: 0, y: 0 });
		this._force = { x: 0, y: 0 };
		this._instantForce = { x: 0, y: 0 };
	}
	Player.prototype.adjustMovement = function(prevPos, pos, vel) {
		this.pos = { x: pos.x, y: pos.y, prev: { x: prevPos.x, y: prevPos.y } };
		this.lineOfMovement = GeometryUtils.toLine(this.pos.prev, this.pos);
		if(vel) {
			this.vel = { x: vel.x, y: vel.y };
		}
	};
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
		var acc = { x: this._force.x / this.mass, y: this._force.y / this.mass };
		var instantAcc = { x: this._instantForce.x / this.mass, y: this._instantForce.y / this.mass };
		var oldVel = { x: this.vel.x, y: this.vel.y };
		this.vel.x = (this.vel.x + acc.x * t + instantAcc.x / 60) * friction;
		this.vel.y = (this.vel.y + acc.y * t + instantAcc.y / 60) * friction;
		this.pos.prev.x = this.pos.x;
		this.pos.prev.y = this.pos.y;
		this.pos.x += (this.vel.x + oldVel.x) / 2 * t;
		this.pos.y += (this.vel.y + oldVel.y) / 2 * t;
		this._force = { x: 0, y: 0 };
		this._instantForce = { x: 0, y: 0 };
		this.lineOfMovement = GeometryUtils.toLine(this.pos.prev, this.pos);
	};
	Player.prototype.render = function(ctx, camera) {
		/*if(this.pos.x !== this.pos.prev.x || this.pos.y !== this.pos.prev.y) {
			ctx.strokeStyle = '#ddd';
			ctx.lineWidth = 1;
			ctx.beginPath();
			if(this.pos.x === this.pos.prev.x) {
				ctx.moveTo(this.pos.x - camera.x, -9999);
				ctx.lineTo(this.pos.x - camera.x, 9999);
			}
			else {
				var slope = (this.pos.y - this.pos.prev.y) / (this.pos.x - this.pos.prev.x);
				var at0 = this.pos.y - slope * this.pos.x;
				ctx.moveTo(-9999 - camera.x, slope * -9999 + at0 - camera.y);
				ctx.lineTo(9999 - camera.x, slope * 9999 + at0 - camera.y);
			}
			ctx.stroke();
		}
		if(this.vel.x !== 0 || this.vel.y !== 0) {
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this.pos.x - camera.x, this.pos.y - camera.y);
			ctx.lineTo(this.pos.x - camera.x + this.vel.x, this.pos.y - camera.y + this.vel.y);
			ctx.stroke();
		}*/
		ctx.fillStyle = '#6c6';
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	Player.prototype.jump = function(dirX, dirY) {
		this.applyInstantaneousForce(15000, dirX, dirY);
	};
	Player.prototype.shootGrapple = function(x, y) {
		var dirX = x - this.pos.x;
		var dirY = y - this.pos.y;
		var dir = Math.sqrt(dirX * dirX + dirY * dirY);
		return new Grapple(this, this.pos.x + this.radius * dirX / dir,
			this.pos.y + this.radius * dirY / dir, dirX / dir, dirY / dir);
	};
	return Player;
});