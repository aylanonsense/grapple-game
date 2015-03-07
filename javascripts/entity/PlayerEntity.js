define([
	'math/Vector'
], function(
	Vector
) {
	var MOVE_SPEED = 400;
	var AERIAL_MOVE_SPEED = 200;
	var JUMP_SPEED = 400;
	var GRAVITY = 600;
	function PlayerEntity(x, y) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.radius = 20;
		this.moveDir = new Vector(0, 0);
		this.isAirborne = true;
		this._isAirborneLastFrame = true;
		this._bufferedJumpTime = 0;
	}
	PlayerEntity.prototype.startOfFrame = function(t) {
		this.isAirborne = this._isAirborneLastFrame;
	};
	PlayerEntity.prototype.tick = function(t) {
		var newVel = this.vel.clone().add(0, GRAVITY * t)
				.add(this.moveDir.clone().normalize().multiply((this.isAirborne ? AERIAL_MOVE_SPEED : MOVE_SPEED) * t))
				.multiply(this.isAirborne ? 0.999 : 0.999, 0.999);
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
		this._isAirborneLastFrame = true;
	};
	PlayerEntity.prototype.endOfFrame = function(t) {
		this._bufferedJumpTime = Math.max(0, this._bufferedJumpTime - t);
	};
	PlayerEntity.prototype.jump = function() {
		this._bufferedJumpTime = 1.09;
	};
	PlayerEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
		this.isAirborne = false;
		this._isAirborneLastFrame = false;
		if(this._bufferedJumpTime > 0) {
			this._bufferedJumpTime = 0;
			this.pos.add(collision.jumpVector.clone().multiply(collision.distToTravel));
			//if you're trying to jump "up" that cancels falling (and vice versa)
			this.vel.x += JUMP_SPEED * collision.jumpVector.x;
			if(collision.jumpVector.y <= 0) {
				this.vel.y = Math.min(JUMP_SPEED * collision.jumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(JUMP_SPEED * collision.jumpVector.y, this.vel.y);
			}
		}
	};
	PlayerEntity.prototype.wrap = function(x, y) {
		this.pos.add(x, y);
		this.prevPos.add(x, y);
	};
	PlayerEntity.prototype.render = function(ctx, camera) {
		ctx.fillStyle = (this.isAirborne ? '#f00' : '#00f');
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return PlayerEntity;
});