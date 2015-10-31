define([
	'Global',
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'math/calcCircleLineIntersection',
	'display/Draw'
], function(
	Global,
	extend,
	Entity,
	Vector,
	calcCircleLineIntersection,
	Draw
) {
	function Grapple(params) {
		//player, dirX, dirY, radiusPercent
		this.parent = params.parent;
		Entity.call(this, extend(params, {
			entityType: 'Grapple',
			pos: this.parent.pos.clone(),
			vel: (new Vector(params.dirX, params.dirY)).setLength(Global.GRAPPLE_PHYSICS.MOVE_SPEED),
			radius: 0
		}));
		this._startPos = this.pos.clone();
		this.isLatched = false;
		this.latchLength = null;
		this.isActive = true;
		this._collisionsThisFrame = [];
	}
	Grapple.prototype = Object.create(Entity.prototype);
	Grapple.prototype.startOfFrame = function(t) {
		Entity.prototype.startOfFrame.apply(this, arguments);
		this._collisionsThisFrame = [];
	};
	Grapple.prototype.update = function(t) {
		//TODO limit the amount the grapple can move
		if(this.isActive) {
			var newVel = this.vel.clone().addMult(this._gravity, t);
			this.prevPos.set(this.pos);
			this.pos.add(this.vel.average(newVel).multiply(t));
			this.vel = newVel;

			//if the grapple surpasses the max length, dial it back to the max length
			var maxLength = Global.GRAPPLE_PHYSICS.MAX_LENGTH - this.radius;
			if(!this.isLatched && this._startPos.squareDistance(this.pos) > maxLength * maxLength) {
				var dirOfMovement = this._startPos.createVectorTo(this.pos);
				this.pos.copy(this._startPos).add(dirOfMovement.setLength(maxLength));
			}
		}
	};
	Grapple.prototype.endOfFrame = function(t) {
		Entity.prototype.endOfFrame.apply(this, arguments);

		//if the grapples is being pulled by the parent it will move its parent in that direction
		if(this.isLatched && this.parent.isPullingGrapples && this.isActive) {
			//shorten the grapple
			var lineToLatchPoint = this.parent.pos.createVectorTo(this.pos);
			if(this.latchLength > Global.GRAPPLE_PHYSICS.MIN_LENGTH) {
				var lengthToPlayer = lineToLatchPoint.length();
				if(lengthToPlayer < this.latchLength) {
					this.latchLength = Math.max(Global.GRAPPLE_PHYSICS.MIN_LENGTH,
						this.latchLength - Global.GRAPPLE_PHYSICS.SHORTENING_ACC * t, lengthToPlayer);
				}
			}

			//pull the parent in that direction
			this.parent.vel.add(lineToLatchPoint.setLength(Global.GRAPPLE_PHYSICS.PULL_ACC * t));
		}

		//if the grapple extends too far it will disappear
		if(!this.isLatched) {
			if(this._startPos.squareDistance(this.pos) > (Global.GRAPPLE_PHYSICS.MAX_LENGTH - this.radius) *
				(Global.GRAPPLE_PHYSICS.MAX_LENGTH - this.radius)) {
				this.kill()
			}
		}
	};
	Grapple.prototype.checkForCollisionWithParent = function() {
		//the parent can only collide with the grapple once per frame, this prevents
		// the grapple from clipping the parent through geometry
		if(this._collisionsThisFrame.length > 0) {
			return false;
		}
		if(this.isActive && this.isLatched && !this._hasCollidedThisFrame) {
			//it's only a collision if the the parent ended up outside the grapple's length
			var lineToLatchPoint = this.parent.pos.createVectorTo(this.pos);
			if(lineToLatchPoint.squareLength() > this.latchLength * this.latchLength) {
				//we're going to ignore cases where the parent didn't move at all (makes it easier)
				var lineOfMovement = this.parent.prevPos.createVectorTo(this.parent.pos);
				if(!lineOfMovement.isZero()) {
					var lineFromLatchPointToPrev = this.pos.createVectorTo(this.parent.prevPos);
					var totalDist, contactPoint, distTraveled;

					//if the this.parent STARTED outside the grapple area, we interpolate the contact point
					if(lineFromLatchPointToPrev.squareLength() > this.latchLength * this.latchLength) {
						contactPoint = this.pos.clone().add(lineFromLatchPointToPrev
							.clone().setLength(this.latchLength));
						totalDist = lineOfMovement.length();
						distTraveled = 0;
					}

					//if the parent exited the grapple area, we just need to find where it exited
					else {
						contactPoint = calcCircleLineIntersection(this.pos,
							this.latchLength, this.parent.prevPos, this.parent.pos);
						if(contactPoint) {
							totalDist = lineOfMovement.length();
							distTraveled = contactPoint.clone().subtract(this.parent.prevPos).length();
						}
					}

					//if there was a contact point (there should be, since it ended up outside the area)
					if(contactPoint) {
						//we want to rotate such that the contact point is "right" of the latch point
						var distToTravel = totalDist - distTraveled;
						var lineFromLatchPointToContactPoint = this.pos.createVectorTo(contactPoint);
						var angle = lineFromLatchPointToContactPoint.angle();
						var cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);

						//then we want to find where the parent should end up within the grapple area
						var arcLength = lineOfMovement.unrotate(cosAngle, sinAngle)
							.setLength(distToTravel).y;
						var finalPoint = (new Vector(this.latchLength - 0.001, 0))
							.rotate(angle + (arcLength / this.latchLength))
							.add(this.pos);

						//velocity AWAY from the lath point is neutralized
						var cosAngle2 = Math.cos(angle + arcLength / (2 * this.latchLength));
						var sinAngle2 = Math.sin(angle + arcLength / (2 * this.latchLength));
						var finalVel = this.parent.vel.clone().unrotate(cosAngle2, sinAngle2);
						if(finalVel.x > 0) {
							finalVel.x = 0;
						}
						finalVel.rotate(cosAngle2, sinAngle2);

						var collision = {
							cause: this,
							collidableRadius: 0,
							distTraveled: distTraveled,
							distToTravel: distToTravel,
							contactPoint: this.parent.prevPos,//contactPoint,
							vectorTowards: lineFromLatchPointToPrev.clone().normalize(),
							stabilityAngle: null,
							finalPoint: finalPoint,
							jumpVector: null,
							finalVel: finalVel
						};
						this._collisionsThisFrame.push(collision);
						return collision;
					}
				}
			}
		}
		return false;
	};
	Grapple.prototype.handleCollision = function(collision) {
		//latch the grapple onto whatever it collided with
		var latchPoint = collision.contactPoint.clone()
			.add(collision.vectorTowards.clone().setLength(collision.collidableRadius));
		this.pos = latchPoint;
		this.prevPos.copy(this.pos);
		this.vel.zero();
		this.collidable = false;
		this.isLatched = true;
		this.latchLength = Math.max(this.parent.pos.createVectorTo(this.pos).length(), Global.GRAPPLE_PHYSICS.MIN_LENGTH);
	};
	Grapple.prototype.render = function() {
		if(this.isActive) {
			Draw.circle(this.pos.x, this.pos.y, Math.max(this.radius, 2), { fill: '#009' });
			Draw.line(this.parent.pos.x, this.parent.pos.y, this.pos.x, this.pos.y, { stroke: '#009' });
			if(this.isLatched) {
				Draw.circle(this.pos.x, this.pos.y, this.latchLength, { stroke: '#ccc' });
			}
		}
		else {
			if(this.isLatched) {
				Draw.line(this.pos.x - 4, this.pos.y - 4, this.pos.x + 4, this.pos.y + 4, { stroke: '#999' });
				Draw.line(this.pos.x - 4, this.pos.y + 4, this.pos.x + 4, this.pos.y - 4, { stroke: '#999' });
			}
			else {
				Draw.circle(this.pos.x, this.pos.y, Math.max(this.radius, 2), { fill: '#999' });
			}
			Draw.line(this._startPos.x, this._startPos.y, this.pos.x, this.pos.y, { stroke: '#999' });
		}
	};
	Grapple.prototype.kill = function() {
		this.isActive = false;
	};
	return Grapple;
});