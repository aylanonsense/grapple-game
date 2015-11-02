define([
	'global',
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'entity/Grapple',
	'display/draw'
], function(
	global,
	extend,
	Entity,
	Vector,
	Grapple,
	draw
) {
	var JUMP_BUFFER_FRAMES = 5;
	var JUMP_LENIANCE_FRAMES = 6;
	var MIN_DIST_PER_COLLISION = 10;

	function Player(params) {
		Entity.call(this, extend(params, {
			entityType: 'Player',
			radius: 12,
			renderColor: '#1100bb'
		}));

		this.isPullingGrapples = false;
		this._lastFramePos = this.pos.clone();
		this.moveDir = new Vector(0, 0);
		this.isAirborne = true;
		this.isOnTerraFirma = false;
		this.isGrappling = false;
		this._isJumping = false;
		this._isAirborneLastFrame = true;
		this._isGrapplingLastFrame = false;
		this._lastGrappleTouched = null;
		this._bufferedJumpTime = 0;
		this._endJumpImmediately = false;
		this._collisionsThisFrame = [];
		this._lastJumpableCollision = null;
		this._timeSinceJumpableCollision = null;
		this._tThisFrame = null;
		this._isFlipped = false;
		this._walkTime = 0.0;
	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.startOfFrame = function(t) {
		this._tThisFrame = t;
		this._lastFramePos = this.pos.clone();
		this.isAirborne = this._isAirborneLastFrame;
		this.isGrappling = this._isGrapplingLastFrame;
		this._collisionsThisFrame = [];
	};
	Player.prototype.update = function(t) {
		var newVel = this.vel.clone().add(0, global.PLAYER_PHYSICS.GRAVITY * t);
		var MOVEMENT;
		if(this.isAirborne) { MOVEMENT = global.PLAYER_PHYSICS.AIR; }
		else if(!this.isOnTerraFirma) { MOVEMENT = global.PLAYER_PHYSICS.SLIDING; }
		else { MOVEMENT = global.PLAYER_PHYSICS.GROUND; }
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
		newVel.y = Math.max(-global.PLAYER_PHYSICS.MAX_VERTICAL_SPEED, Math.min(newVel.y, global.PLAYER_PHYSICS.MAX_VERTICAL_SPEED));
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
		this._isAirborneLastFrame = true;
		this._isGrapplingLastFrame = false;
	};
	Player.prototype.endOfFrame = function(t) {
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
			var speed = (this._endJumpImmediately ? global.PLAYER_PHYSICS.JUMP_BRAKE_SPEED : global.PLAYER_PHYSICS.JUMP_SPEED);
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
		if(this.vel.y >= -global.PLAYER_PHYSICS.JUMP_BRAKE_SPEED) {
			this._isJumping = false;
		}

		//adjust facing and walk time
		if(!this.isAirborne && this.isOnTerraFirma && (this.vel.x > 0.001 || this.vel.x < -0.001)) {
			this._walkTime += t;
		}
		else {
			this._walkTime = 0.0;
		}
		if(this.vel.x > 0.001) {
			this._isFlipped = false;
		}
		else if(this.vel.x < -0.001) {
			this._isFlipped = true;
		}
	};
	Player.prototype.findAllCollisions = function(level, entities) {
		var collisions = Entity.prototype.findAllCollisions.apply(this, arguments);
		for(var i = 0; i < entities.length; i++) {
			if(entities[i].entityType === 'Grapple' && entities[i].parent.sameAs(this) && entities[i].isActive) {
				var collision = entities[i].checkForCollisionWithParent();
				if(collision) {
					collisions.push(collision);
				}
			}
		}
		return collisions;
	};
	Player.prototype.checkForCollisions = function(level) {
		throw new Error("TODO");
	};
	Player.prototype.handleCollision = function(collision, t, isInCorner) {
		this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
		this.isAirborne = false;
		this._isAirborneLastFrame = false;
		if(collision.cause.entityType === 'Grapple') {
			this._isGrapplingLastFrame = true;
			this._lastGrappleTouched = collision.cause;
		}
		this.isOnTerraFirma = (collision.stabilityAngle !== null &&
			-Math.PI / 2 + global.PLAYER_PHYSICS.STABILITY_ANGLE > collision.stabilityAngle &&
			-Math.PI / 2 - global.PLAYER_PHYSICS.STABILITY_ANGLE < collision.stabilityAngle);
		this.vel.add(collision.vectorTowards.clone().multiply(global.PLAYER_PHYSICS.STICKY_FORCE));

		if(collision.counterGravityVector && this.isOnTerraFirma) {
			this.vel.add(collision.counterGravityVector.clone().multiply(global.PLAYER_PHYSICS.GRAVITY * t));
		}

		if(this.isOnTerraFirma && collision.contactPoint.squareDistance(collision.finalPoint) <
			MIN_DIST_PER_COLLISION * t * MIN_DIST_PER_COLLISION * t) {
			this.pos = collision.contactPoint;
		}

		//highlight line/point
		this._collisionsThisFrame.push(collision);
		// collision.cause.onCollision(collision);

		if(isInCorner) {
			this.pos.copy(this.prevPos);
			this.vel.zero();
		}
	};
	Player.prototype.shootGrapple = function(x, y) {
		var squareSpeed = this.vel.squareLength();
		return new Grapple({
			parent: this,
			aimX: x - this.pos.x,
			aimY: y - this.pos.y
		});
	};
	Player.prototype.startJumping = function() {
		this._bufferedJumpTime = (JUMP_BUFFER_FRAMES + 0.5) / 60;
		this._endJumpImmediately = false;
	};
	Player.prototype.stopJumping = function() {
		if(this._isJumping) {
			this._isJumping = false;
			this.vel.y = Math.max(-global.PLAYER_PHYSICS.JUMP_BRAKE_SPEED, this.vel.y);
		}
		else {
			this._endJumpImmediately = true;
		}
	};
	Player.prototype.startPullingGrapples = function() {
		this.isPullingGrapples = true;
	};
	Player.prototype.stopPullingGrapples = function() {
		this.isPullingGrapples = false;
	};
	return Player;
});