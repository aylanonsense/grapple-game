define([
	'Constants',
	'entity/GrappleEntity',
	'math/Vector'
], function(
	Constants,
	GrappleEntity,
	Vector
) {
	var JUMP_BUFFER_FRAMES = 5;
	var JUMP_LENIANCE_FRAMES = 6;
	var MIN_DIST_PER_COLLISION = 10;

	function PlayerEntity(x, y) {
		this.entityType = 'Player';
		this.pos = new Vector(x, y);
		this.prevPos = this.pos.clone();
		this._lastFramePos = this.pos.clone();
		this.vel = new Vector(0, 0);
		this.radius = 12;
		this.moveDir = new Vector(0, 0);
		this.isAirborne = true;
		this.isOnTerraFirma = false;
		this._isJumping = false;
		this._isAirborneLastFrame = true;
		this._bufferedJumpTime = 0;
		this._endJumpImmediately = false;
		this._collisionsThisFrame = [];
		this._lastJumpableCollision = null;
		this._timeSinceJumpableCollision = null;
		this._tThisFrame = null;
	}
	PlayerEntity.prototype.startOfFrame = function(t) {
		this._tThisFrame = t;
		this._lastFramePos = this.pos.clone();
		this.isAirborne = this._isAirborneLastFrame;
		this._collisionsThisFrame = [];
	};
	PlayerEntity.prototype.tick = function(t) {
		var newVel = this.vel.clone().add(0, Constants.PLAYER_PHYSICS.GRAVITY * t);
		var MOVEMENT;
		if(this.isAirborne) { MOVEMENT = Constants.PLAYER_PHYSICS.AIR; }
		else if(!this.isOnTerraFirma) { MOVEMENT = Constants.PLAYER_PHYSICS.SLIDING; }
		else { MOVEMENT = Constants.PLAYER_PHYSICS.GROUND; }
		var moveDir = this.moveDir.x;
		//moving REALLY FAST left/right...
		if(Math.abs(newVel.x) > MOVEMENT.SOFT_MAX_SPEED) {
			newVel.x = Math.max(-MOVEMENT.MAX_SPEED, Math.min(newVel.x, MOVEMENT.MAX_SPEED));
			//trying to stop
			if(moveDir === 0) {
				if(newVel.x > 0) {
					newVel.x = Math.max(0, newVel.x - MOVEMENT.SLOW_DOWN_ACC * t);
				}
				else {
					newVel.x = Math.min(0, newVel.x + MOVEMENT.SLOW_DOWN_ACC * t);
				}
			}
			//trying to maintain velocity
			else if(moveDir * newVel.x > 0) {
				if(newVel.x > 0) {
					newVel.x = Math.max(MOVEMENT.SOFT_MAX_SPEED, newVel.x - MOVEMENT.SLOW_DOWN_ACC * t);
				}
				else {
					newVel.x = Math.min(-MOVEMENT.SOFT_MAX_SPEED, newVel.x + MOVEMENT.SLOW_DOWN_ACC * t);
				}
			}
			//trying to turn around
			else {
				if(newVel.x > 0) {
					newVel.x = Math.max(-MOVEMENT.SOFT_MAX_SPEED, newVel.x - MOVEMENT.TURN_AROUND_ACC * t);
				}
				else {
					newVel.x = Math.min(MOVEMENT.SOFT_MAX_SPEED, newVel.x + MOVEMENT.TURN_AROUND_ACC * t);
				}
			}
		}
		//moving left/right...
		else if(newVel.x !== 0) {
			//trying to stop
			if(moveDir === 0) {
				if(newVel.x > 0) {
					newVel.x = Math.max(0, newVel.x - MOVEMENT.SLOW_DOWN_ACC * t);
				}
				else {
					newVel.x = Math.min(0, newVel.x + MOVEMENT.SLOW_DOWN_ACC * t);
				}
			}
			//trying to speed up/slow down
			else {
				newVel.x += moveDir * (moveDir * newVel.x > 0 ?
					MOVEMENT.SPEED_UP_ACC : MOVEMENT.TURN_AROUND_ACC) * t;
				if(moveDir * newVel.x > MOVEMENT.SOFT_MAX_SPEED) {
					newVel.x = moveDir * MOVEMENT.SOFT_MAX_SPEED;
				}
			}
		}
		//stopped and starting to move
		else if(moveDir !== 0) {
			newVel.x += moveDir * MOVEMENT.SPEED_UP_ACC * t;
			if(moveDir * newVel.x > MOVEMENT.MAX_SPEED) {
				newVel.x = moveDir * MOVEMENT.MAX_SPEED;
			}
		}

		//limit velocity to an absolute max
		newVel.y = Math.max(-Constants.PLAYER_PHYSICS.MAX_VERTICAL_SPEED, Math.min(newVel.y, Constants.PLAYER_PHYSICS.MAX_VERTICAL_SPEED));
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
		this._isAirborneLastFrame = true;
	};
	PlayerEntity.prototype.endOfFrame = function(t) {
		//find the "best" jump surface this frame (the one that sends you them most upward)
		var bestJumpableCollision = null;
		for(var i = 0; i < this._collisionsThisFrame.length; i++) {
			var collision = this._collisionsThisFrame[i];
			if(collision.jumpVector && (bestJumpableCollision === null ||
				Math.abs(collision.jumpVector.y) > Math.abs(bestJumpableCollision.jumpVector.y))) {
				bestJumpableCollision = collision;
			}
		}

		//if we have a good jump candidate, we store it until we want to jump off of it
		if(bestJumpableCollision) {
			this._lastJumpableCollision = bestJumpableCollision;
			this._timeSinceJumpableCollision = 0.0;
		}

		//we may even want to jump off of something right now!
		if(this._bufferedJumpTime > 0.0 && this._lastJumpableCollision !== null &&
			this._timeSinceJumpableCollision < (JUMP_LENIANCE_FRAMES + 0.5) / 60) {
			var speed = (this._endJumpImmediately ? Constants.PLAYER_PHYSICS.JUMP_BRAKE_SPEED : Constants.PLAYER_PHYSICS.JUMP_SPEED);
			this.vel.x += speed * this._lastJumpableCollision.jumpVector.x;
			if(this._lastJumpableCollision.jumpVector.y <= 0) {
				this.vel.y = Math.min(speed * this._lastJumpableCollision.jumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(speed * this._lastJumpableCollision.jumpVector.y, this.vel.y);
			}
			this._isJumping = true;
			this._bufferedJumpTime = 0.0;
			this._endJumpImmediately = false;
			this._lastJumpableCollision = null;
			this._timeSinceJumpableCollision = null;
		}

		//increment timers
		if(this._timeSinceJumpableCollision !== null) {
			this._timeSinceJumpableCollision += t;
		}
		this._bufferedJumpTime = Math.max(0, this._bufferedJumpTime - t);

		//adjust state
		if(this.vel.y >= -Constants.PLAYER_PHYSICS.JUMP_BRAKE_SPEED) {
			this._isJumping = false;
		}
	};
	PlayerEntity.prototype.shootGrapple = function(x, y) {
		var squareSpeed = this.vel.squareLength();
		var radiusPerent = Math.max(0.0, Math.min(squareSpeed / (Constants.PLAYER_PHYSICS.AIR.SOFT_MAX_SPEED * 1.2 * Constants.PLAYER_PHYSICS.AIR.SOFT_MAX_SPEED * 1.2), 1.0));
		return new GrappleEntity(this, x - this.pos.x, y - this.pos.y, radiusPerent);
	};
	PlayerEntity.prototype.jump = function() {
		this._bufferedJumpTime = (JUMP_BUFFER_FRAMES + 0.5) / 60;
		this._endJumpImmediately = false;
	};
	PlayerEntity.prototype.endJump = function() {
		if(this._isJumping) {
			this._isJumping = false;
			this.vel.y = Math.max(-Constants.PLAYER_PHYSICS.JUMP_BRAKE_SPEED, this.vel.y);
		}
		else {
			this._endJumpImmediately = true;
		}
	};
	PlayerEntity.prototype.handleCollision = function(collision) {
		var t = this._tThisFrame;
		this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
		this.isAirborne = false;
		this._isAirborneLastFrame = false;
		this.isOnTerraFirma = (collision.stabilityAngle !== null &&
			-Math.PI / 2 + Constants.PLAYER_PHYSICS.STABILITY_ANGLE > collision.stabilityAngle &&
			-Math.PI / 2 - Constants.PLAYER_PHYSICS.STABILITY_ANGLE < collision.stabilityAngle);
		this.vel.add(collision.vectorTowards.clone().multiply(Constants.PLAYER_PHYSICS.STICKY_FORCE));

		if(collision.counterGravityVector && this.isOnTerraFirma) {
			this.vel.add(collision.counterGravityVector.clone().multiply(Constants.PLAYER_PHYSICS.GRAVITY * t));
		}

		if(this.isOnTerraFirma && collision.contactPoint.squareDistance(collision.finalPoint) <
			MIN_DIST_PER_COLLISION * t * MIN_DIST_PER_COLLISION * t) {
			this.pos = collision.contactPoint;
		}

		//highlight line/point
		this._collisionsThisFrame.push(collision);
		collision.cause.onCollision(collision);
	};
	PlayerEntity.prototype.render = function(ctx, camera) {
		ctx.fillStyle = (this.isAirborne ? '#f00' : (this.isOnTerraFirma ? '#00f' : '#0f0'));
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
		if(this._isJumping) {
			ctx.strokeStyle = '#a0a';
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		ctx.strokeStyle = '#0bb';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.pos.x - camera.x, this.pos.y - camera.y);
		var renderedVel = this.vel.clone().normalize().multiply(55);
		ctx.lineTo(this.pos.x - camera.x + renderedVel.x, this.pos.y - camera.y + renderedVel.y);
		ctx.stroke();
		ctx.strokeStyle = '#f09';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this._lastFramePos.x - camera.x, this._lastFramePos.y - camera.y);
		ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
		ctx.stroke();
	};
	return PlayerEntity;
});