define([
	'math/Vector'
], function(
	Vector
) {
	var MOVE_SPEED = 400;
	var AERIAL_MOVE_SPEED = 200;
	var JUMP_SPEED = 350;
	var GRAVITY = 600;
	var STICKY_FORCE = 1;
	var TURN_AROUND_ACC = 1500;
	var SLOW_DOWN_ACC = 1500;
	var SPEED_UP_ACC = 1500;
	var MAX_SPEED = 250;
	function PlayerEntity(x, y) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.radius = 12;
		this.moveDir = new Vector(0, 0);
		this.isAirborne = true;
		this._isAirborneLastFrame = true;
		this._bufferedJumpTime = 0;
		this._collisionsThisFrame = [];
	}
	PlayerEntity.prototype.startOfFrame = function(t) {
		this.isAirborne = this._isAirborneLastFrame;
		this._collisionsThisFrame = [];
	};
	PlayerEntity.prototype.tick = function(t) {
		var newVel = this.vel.clone().add(0, GRAVITY * t);
		if(!this.isAirborne) {
			var move = this.moveDir.x;
			//moving right...
			if(newVel.x > 0) {
				//and trying to move right (speed up)
				if(move > 0) {
					newVel.x += SPEED_UP_ACC * t;
					if(newVel.x > MAX_SPEED) { newVel.x = MAX_SPEED; }
				}
				//and trying to move left (turn around)
				else if(move < 0) {
					newVel.x -= TURN_AROUND_ACC * t;
					if(newVel.x < -MAX_SPEED) {
						newVel.x = -MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x -= SLOW_DOWN_ACC * t;
					if(newVel.x < 0) {
						newVel.x = 0;
					}
				}
			}
			//moving left...
			else if(newVel.x < 0) {
				//and trying to move left (speed up)
				if(move < 0) {
					newVel.x -= SPEED_UP_ACC * t;
					if(newVel.x < -MAX_SPEED) { newVel.x = -MAX_SPEED; }
				}
				//and trying to move right (turn around)
				else if(move > 0) {
					newVel.x += TURN_AROUND_ACC * t;
					if(newVel.x > MAX_SPEED) {
						newVel.x = MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x += SLOW_DOWN_ACC * t;
					if(newVel.x > 0) {
						newVel.x = 0;
					}
				}
			}
			//stopped...
			else {
				//and trying to move left
				if(move < 0) {
					newVel.x -= SPEED_UP_ACC * t;
					if(newVel.x < -MAX_SPEED) {
						newVel.x = -MAX_SPEED;
					}
				}
				//and trying to move right
				else if(move > 0) {
					newVel.x += SPEED_UP_ACC * t;
					if(newVel.x > MAX_SPEED) {
						newVel.x = MAX_SPEED;
					}
				}
			}
		}
		else {

		}
				// .add(this.moveDir.clone().normalize().multiply((this.isAirborne ? AERIAL_MOVE_SPEED : MOVE_SPEED) * t))
				// .multiply(this.isAirborne ? 0.999 : 0.999, 0.999);
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
		this._isAirborneLastFrame = true;
	};
	PlayerEntity.prototype.endOfFrame = function(t) {
		if(this._bufferedJumpTime > 0 && this._collisionsThisFrame.length > 0) {
			//jump off of the "best" jump option (the one that sends you them most upward)
			this._bufferedJumpTime = 0;
			var collision = this._collisionsThisFrame[0];
			for(var i = 1; i < this._collisionsThisFrame.length; i++) {
				if(Math.abs(this._collisionsThisFrame[i].jumpVector.y) > Math.abs(collision.jumpVector.y)) {
					collision = this._collisionsThisFrame[i];
				}
			}
			// this.pos.add(collision.jumpVector.clone().multiply(collision.distToTravel));
			this.vel.x += JUMP_SPEED * collision.jumpVector.x;
			if(collision.jumpVector.y <= 0) {
				this.vel.y = Math.min(JUMP_SPEED * collision.jumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(JUMP_SPEED * collision.jumpVector.y, this.vel.y);
			}
		}
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
		this.vel.add(collision.vectorTowards.clone().multiply(STICKY_FORCE));

		//highlight line/point
		collision.geom.highlight();
		this._collisionsThisFrame.push(collision);
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