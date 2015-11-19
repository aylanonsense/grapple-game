define([
	'global',
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'entity/Grapple',
	'display/draw',
	'display/loadSprite!grapple-girl'
], function(
	global,
	extend,
	Entity,
	Vector,
	Grapple,
	draw,
	sprite
) {
	var JUMP_BUFFER_FRAMES = 5;
	var JUMP_LENIANCE_FRAMES = 6;
	var MIN_DIST_PER_COLLISION = 10;

	function Player(params) {
		Entity.call(this, extend(params, {
			entityType: 'Player',
			radius: 14,
			renderColor: '#1100bb',
			gravity: global.PLAYER_PHYSICS.GRAVITY
		}));
		this.isPullingGrapples = false;

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
		this._lastJumpVector = null;
		this._timeSinceLastJumpVector = null;
		this._isFlipped = false;
		this._walkTime = 0.0;
	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.startOfFrame = function(t) {
		Entity.prototype.startOfFrame.call(this, t);
		this.isAirborne = this._isAirborneLastFrame;
		this.isGrappling = this._isGrapplingLastFrame;
		this._collisionsThisFrame = [];
	};
	Player.prototype.update = function(t) {
		this._gravity.y = global.PLAYER_PHYSICS.GRAVITY;
		var newVel = this.vel.clone().addMult(this._gravity, t);
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
		Entity.prototype.endOfFrame.call(this, t);

		//find the "best" jump surface this frame (the one that sends you them most upward)
		var bestJumpVector = null;
		for(var i = 0; i < this._collisionsThisFrame.length; i++) {
			var collision = this._collisionsThisFrame[i];
			if(collision.jumpable) {
				var jumpVector = createJumpVector(collision.perpendicularAngle);
				if(bestJumpVector === null || Math.abs(jumpVector.y) > Math.abs(bestJumpVector.y)) {
					bestJumpVector = jumpVector;
				}
			}
		}

		//if we have a good jump candidate, we store it until we want to jump off of it
		if(bestJumpVector) {
			this._lastJumpVector = bestJumpVector;
			this._timeSinceLastJumpVector = 0.0;
		}

		//we may even want to jump off of something right now!
		if(this._bufferedJumpTime > 0.0 && this._lastJumpVector !== null &&
			this._timeSinceLastJumpVector < (JUMP_LENIANCE_FRAMES + 0.5) / 60) {
			var speed = (this._endJumpImmediately ? global.PLAYER_PHYSICS.JUMP_BRAKE_SPEED : global.PLAYER_PHYSICS.JUMP_SPEED);
			this.vel.x += speed * this._lastJumpVector.x;
			if(this._lastJumpVector.y <= 0) {
				this.vel.y = Math.min(speed * this._lastJumpVector.y, this.vel.y);
			}
			else {
				this.vel.y = Math.max(speed * this._lastJumpVector.y, this.vel.y);
			}
			this._isJumping = true;
			this._bufferedJumpTime = 0.0;
			this._endJumpImmediately = false;
			this._lastJumpVector = null;
			this._timeSinceLastJumpVector = null;
		}

		//increment timers
		if(this._timeSinceLastJumpVector !== null) {
			this._timeSinceLastJumpVector += t;
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
	Player.prototype.render = function() {
		//render the player sprite
		var frame;
		var flipped = this._isFlipped;
		if(this.isGrappling) {
			var line = this.pos.createVectorTo(this._lastGrappleTouched.pos);
			var tangentLine = new Vector(line.y, -line.x);
			var angleToGrapple = line.angle();
			if(angleToGrapple < 0) { angleToGrapple += 2 * Math.PI; }
			var movingClockwise = (tangentLine.dot(this.vel) > 0);
			var squareSpeed = this.vel.squareLength();
			flipped = movingClockwise;
			if(flipped) {
				frame = 20 + Math.round(16 * angleToGrapple / (2 * Math.PI));
			}
			else {
				frame = 28 - Math.round(16 * angleToGrapple / (2 * Math.PI));
			}
			if(frame >= 28) { frame -= 16; }
			if(squareSpeed > 330 * 330) {
				frame += 16;
			}
		}
		else if(this.isAirborne) {
			frame = 8;
		}
		else if(!this.isOnTerraFirma) {
			frame = 0;
		}
		else if(this.vel.x > 0.001 || this.vel.x < -0.001) {
			var walkCycle = (this._walkTime) % ((9 + 7 + 9 + 7) / 60);
			if(walkCycle < (9) / 60) {
				frame = 4;
			}
			else if(walkCycle < (9 + 7) / 60) {
				frame = 5;
			}
			else if(walkCycle < (9 + 7 + 9) / 60) {
				frame = 6;
			}
			else {
				frame = 7;
			}
		}
		else {
			frame = 0;
		}
		sprite.render(this.pos.x, this.pos.y, frame, { flip: flipped });
	};

	//helper methods
	function createJumpVector(angle) {
		var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
		if(distFromTop > Math.PI) {
			distFromTop = distFromTop - 2 * Math.PI;
		}
		var squareDistFromTop = distFromTop * distFromTop;
		var const1 = 1.1; //0 = always jump perpendicular, -1 = jump "more down", 1 = jump "more up"
		angle = angle - const1 * distFromTop + (const1 / Math.PI) *
			(distFromTop > 0 ? 1 : -1) * squareDistFromTop;
		return new Vector(Math.cos(angle), Math.sin(angle));
	}

	return Player;
});