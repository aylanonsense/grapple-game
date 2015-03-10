define([
	'math/Vector'
], function(
	Vector
) {
	var JUMP_SPEED = 350;
	var GRAVITY = 600;
	var STICKY_FORCE = 1;

	var PLAYER_MOVEMENT = {
		GROUND: {
			TURN_AROUND_ACC: 5000,
			SLOW_DOWN_ACC: 1200,
			SPEED_UP_ACC: 1200,
			SOFT_MAX_SPEED: 220,
			MAX_SPEED: 1000
		},
		AIR: {
			TURN_AROUND_ACC: 450,
			SLOW_DOWN_ACC: 150,
			SPEED_UP_ACC: 450,
			SOFT_MAX_SPEED: 220,
			MAX_SPEED: 1000
		}
	}

	function PlayerEntity(x, y) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.radius = 12;
		this.moveDir = new Vector(0, 0);
		this.isAirborne = true;
		this.isOnTerraFirma = false;
		this._isAirborneLastFrame = true;
		this._bufferedJumpTime = 0;
		this._collisionsThisFrame = [];
		this._lastJumpableCollision = null;
		this._timeSinceJumpableCollision = null;
	}
	PlayerEntity.prototype.startOfFrame = function(t) {
		this.isAirborne = this._isAirborneLastFrame;
		this._collisionsThisFrame = [];
	};
	PlayerEntity.prototype.tick = function(t) {
		var newVel = this.vel.clone().add(0, GRAVITY * t);
		var MOVEMENT = (!this.isAirborne && this.isOnTerraFirma ?
			PLAYER_MOVEMENT.GROUND : PLAYER_MOVEMENT.AIR);
		var moveDir = this.moveDir.x;
		//moving REALLY FAST to the right...
		if(true) {
			if(newVel.x > MOVEMENT.SOFT_MAX_SPEED) {
				newVel.x = Math.min(newVel.x, MOVEMENT.MAX_SPEED);
				//and trying to move right (deperately maintain velocity)
				if(moveDir > 0) {
					newVel.x -= MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x < MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to move left (turn around)
				if(moveDir < 0) {
					newVel.x -= MOVEMENT.TURN_AROUND_ACC * t;
					if(newVel.x < -MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = -MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x -= MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x < 0) {
						newVel.x = 0;
					}
				}
			}
			//moving REALLY FAST to the left...
			else if(newVel.x < -MOVEMENT.SOFT_MAX_SPEED) {
				newVel.x = Math.max(newVel.x, -MOVEMENT.MAX_SPEED);
				//and trying to move left (deperately maintain velocity)
				if(moveDir < 0) {
					newVel.x += MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x > -MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = -MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to move right (turn around)
				if(moveDir > 0) {
					newVel.x += MOVEMENT.TURN_AROUND_ACC * t;
					if(newVel.x > MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x += MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x > 0) {
						newVel.x = 0;
					}
				}
			}
			//moving right...
			else if(newVel.x > 0) {
				//and trying to move right (speed up)
				if(moveDir > 0) {
					newVel.x += MOVEMENT.SPEED_UP_ACC * t;
					if(newVel.x > MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to move left (turn around)
				else if(moveDir < 0) {
					newVel.x -= MOVEMENT.TURN_AROUND_ACC * t;
					if(newVel.x < -MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = -MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x -= MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x < 0) {
						newVel.x = 0;
					}
				}
			}
			//moving left...
			else if(newVel.x < 0) {
				//and trying to move left (speed up)
				if(moveDir < 0) {
					newVel.x -= MOVEMENT.SPEED_UP_ACC * t;
					if(newVel.x < -MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = -MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to move right (turn around)
				else if(moveDir > 0) {
					newVel.x += MOVEMENT.TURN_AROUND_ACC * t;
					if(newVel.x > MOVEMENT.SOFT_MAX_SPEED) {
						newVel.x = MOVEMENT.SOFT_MAX_SPEED;
					}
				}
				//and trying to stop
				else {
					newVel.x += MOVEMENT.SLOW_DOWN_ACC * t;
					if(newVel.x > 0) {
						newVel.x = 0;
					}
				}
			}
			//stopped...
			else {
				//and trying to move left
				if(moveDir < 0) {
					newVel.x -= MOVEMENT.SPEED_UP_ACC * t;
					if(newVel.x < -MOVEMENT.MAX_SPEED) {
						newVel.x = -MOVEMENT.MAX_SPEED;
					}
				}
				//and trying to move right
				else if(moveDir > 0) {
					newVel.x += MOVEMENT.SPEED_UP_ACC * t;
					if(newVel.x > MOVEMENT.MAX_SPEED) {
						newVel.x = MOVEMENT.MAX_SPEED;
					}
				}
			}
		}
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
		this._isAirborneLastFrame = true;
	};
	PlayerEntity.prototype.endOfFrame = function(t) {
		if(this._collisionsThisFrame.length > 0) {
			//jump off of the "best" jump option (the one that sends you them most upward)
			var bestJumpableCollision = this._collisionsThisFrame[0];
			for(var i = 1; i < this._collisionsThisFrame.length; i++) {
				if(Math.abs(this._collisionsThisFrame[i].jumpVector.y) > Math.abs(bestJumpableCollision.jumpVector.y)) {
					bestJumpableCollision = this._collisionsThisFrame[i];
				}
			}
			if(this._bufferedJumpTime > 0) {
				// this.pos.add(bestJumpableCollision.jumpVector.clone().multiply(bestJumpableCollision.distToTravel));
				this.vel.x += JUMP_SPEED * bestJumpableCollision.jumpVector.x;
				if(bestJumpableCollision.jumpVector.y <= 0) {
					this.vel.y = Math.min(JUMP_SPEED * bestJumpableCollision.jumpVector.y, this.vel.y);
				}
				else {
					this.vel.y = Math.max(JUMP_SPEED * bestJumpableCollision.jumpVector.y, this.vel.y);
				}
			this._bufferedJumpTime = 0;
			this._timeSinceJumpableCollision = null;
			this._lastJumpableCollision = null;
			}
			else {
				this._lastJumpableCollision = bestJumpableCollision;
				this._timeSinceJumpableCollision = 0.0;
			}
		}
		else if(this._bufferedJumpTime > 0 && this._timeSinceJumpableCollision !== null &&
			this._timeSinceJumpableCollision < 0.11) {
			// this.pos.add(bestJumpableCollision.jumpVector.clone().multiply(bestJumpableCollision.distToTravel));
			this.vel.x += JUMP_SPEED * this._lastJumpableCollision.jumpVector.x;
			if(this._lastJumpableCollision.jumpVector.y <= 0) {
				this.vel.y = Math.min(JUMP_SPEED * this._lastJumpableCollision.jumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(JUMP_SPEED * this._lastJumpableCollision.jumpVector.y, this.vel.y);
			}
			this._bufferedJumpTime = 0;
			this._timeSinceJumpableCollision = null;
			this._lastJumpableCollision = null;
		}
		this._bufferedJumpTime = Math.max(0, this._bufferedJumpTime - t);
		if(this._timeSinceJumpableCollision !== null) {
			this._timeSinceJumpableCollision += t;
		}
	};
	PlayerEntity.prototype.jump = function() {
		this._bufferedJumpTime = 0.09;
	};
	PlayerEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
		this.isAirborne = false;
		this._isAirborneLastFrame = false;
		this.isOnTerraFirma = (collision.stabilityAngle !== null &&
			-Math.PI / 4 > collision.stabilityAngle &&
			-3 * Math.PI / 4 < collision.stabilityAngle);
		this.vel.add(collision.vectorTowards.clone().multiply(STICKY_FORCE));

		//highlight line/point
		collision.geom.highlight();
		this._collisionsThisFrame.push(collision);
	};
	PlayerEntity.prototype.render = function(ctx, camera) {
		ctx.fillStyle = (this.isAirborne ? '#f00' : (this.isOnTerraFirma ? '#00f' : '#0f0'));
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return PlayerEntity;
});