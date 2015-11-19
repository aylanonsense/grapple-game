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

		//all entities are circles that can collide with the level
		this.pos = params.pos || new Vector(params.x || 0, params.y || 0);
		this.prevPos = this.pos.clone();
		this.vel = params.vel || new Vector(params.velX || 0, params.velY || 0);
		this.radius = params.radius || 0;

		this.isActive = true;
		this.isDead = false;
		this.collidable = params.collidable !== false;
		this.bounce = (params.bounce || params.bounce === 0 ? params.bounce : 0.0001);
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
	};
	Entity.prototype.update = function(t) {
		var newVel = this.vel.clone().addMult(this._gravity, t);
		this.prevPos.copy(this.pos);
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
	};
	Entity.prototype.endOfFrame = function(t) {
	};
	Entity.prototype.findAllCollisions = function(level, entities) {
		return level.findAllCollisionsWithEntity(this);
	};
	Entity.prototype.handleCollision = function(collision, t, isInCorner) {
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