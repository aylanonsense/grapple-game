define([
	'display/draw',
	'math/Vector'
], function(
	draw,
	Vector
) {
	var nextEntityId = 0;
	function Entity(params) {
		params = params || {};
		this._entityId = nextEntityId++;
		this.entityType = params.entityType;
		this.level = params.level;
		if(!this.level) {
			throw new Error("Parameter 'level' is required for entity '" + this.entityType + "'");
		}

		//all entities are circles that can collide with the level
		this.pos = params.pos || new Vector(params.x || 0, params.y || 0);
		this.prevPos = this.pos.clone();
		this.vel = params.vel || new Vector(params.velX || 0, params.velY || 0);
		this.radius = params.radius || 0;
		this.friction = params.friction || 0; //0 = no friction, 1 = complete friction
		this.surface = null;
		this._newSurfaceThisFrame = false;
		this._stabilityAngle = params.stabilityAngle || params.stabilityAngle === 0 ? params.stabilityAngle : null;
		if(this.friction > 0 && this._stabilityAngle === null) {
			throw new Error("Parameter 'stabilityAngle' is required for entity '" + this.entityType + "' if 'friction' is given");
		}

		this.isActive = true;
		this.isDead = false;
		this.collidable = params.collidable !== false;
		this.bounce = params.bounce || 0.0001;
		this._gravity = new Vector(params.gravityX || 0, params.gravityY || params.gravity || 0);
		this._renderColor = params.renderColor || '#000';
	}
	Entity.prototype.sameAs = function(other) {
		return other && this._entityId === other._entityId;
	};
	Entity.prototype.sameAsAny = function(others) {
		if(!others) {
			return false;
		}
		for(var i = 0; i < others.length; i++) {
			if(this.sameAs(others[i])) {
				return true;
			}
		}
		return false;
	};
	Entity.prototype.startOfFrame = function(t) {
		this._newSurfaceThisFrame = false;
	};
	Entity.prototype.update = function(t) {
		var newVel = this.vel.clone().addMult(this._gravity, t);
		this.prevPos.copy(this.pos);
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
	};
	Entity.prototype.endOfFrame = function(t) {
		this._applyFrictionFromSurfaceCollision(t);
		if(!this._newSurfaceThisFrame) {
			this.surface = null;
		}
	};
	Entity.prototype._checkForSufraceCollision = function(collision) {
		if(collision.stabilityAngle !== null && this._stabilityAngle !== null &&
			-Math.PI / 2 + this._stabilityAngle > collision.stabilityAngle &&
			-Math.PI / 2 - this._stabilityAngle < collision.stabilityAngle) {
			this.surface = collision;
			this._newSurfaceThisFrame = true;
		}
	};
	Entity.prototype._applyFrictionFromSurfaceCollision = function(t) {
		if(this.surface) {
			//advanced friction calculation to ignore frame rate
			var c = Math.pow(2, this.friction * 4) - 1; 
			var percentUnchanged = 1 / Math.pow(Math.E, c * t);
			if(this.friction === 1) {
				percentUnchanged = 0;
			}

			//take the weighted average (based on friction) of this thing's velocity with the surface it collided with
			this.vel.multiply(percentUnchanged);
			this.vel.addMult(this.surface.surfaceVel, 1 - percentUnchanged);
		}
	};
	Entity.prototype.findAllCollisions = function() {
		var collisions = [];
		for(var i = 0; i < this.level.platforms.length; i++) {
			collisions = collisions.concat(this.level.platforms[i].checkForCollisionsWithEntity(this));
		}
		return collisions;
	};
	Entity.prototype.handleCollision = function(collision, t, isInCorner) {
		this._checkForSufraceCollision(collision);
		if(isInCorner) {
			this.pos.copy(this.prevPos);
			this.vel.zero();
		}
		else {
			this.pos = collision.finalPoint;
			this.prevPos = collision.contactPoint;
			this.vel = collision.finalVel;
		}
	};
	Entity.prototype.render = function() {
		draw.circle(this.pos.x, this.pos.y, this.radius, { fill: this._renderColor });
	};
	Entity.prototype.kill = function() {
		this.isActive = false;
		this.isDead = true;
	};
	return Entity;
});