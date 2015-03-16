define([
	'math/Vector',
	'math/Utils'
], function(
	Vector,
	MathUtils
) {
	var nextId = 0;
	var MOVE_SPEED = 2000;
	var MIN_RADIUS = 1;
	var MAX_RADIUS = 24;
	function GrappleEntity(player, dirX, dirY, radiusPercent) {
		this._grappleEntityId = nextId++;
		this._player = player;
		this.pos = player.pos.clone();
		this.prevPos = this.pos.clone();
		this.radius = MIN_RADIUS + radiusPercent * (MAX_RADIUS - MIN_RADIUS);
		this.vel = (new Vector(dirX, dirY)).normalize().multiply(MOVE_SPEED);
		this.isLatched = false;
		this._latchLength = null;
		this._highlightFrames = 0;
	}
	GrappleEntity.prototype.sameAs = function(other) {
		return other && this._grappleEntityId === other._grappleEntityId;
	};
	GrappleEntity.prototype.sameAsAny = function(others) {
		if(others) {
			for(var i = 0; i < others.length; i++) {
				if(this.sameAs(others[i])) {
					return true;
				}
			}
		}
		return false;
	};
	GrappleEntity.prototype.tick = function(t) {
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.clone().multiply(t));
		this._highlightFrames--;
	};
	GrappleEntity.prototype.checkForCollisionWithMovingCircle = function(circle) {
		if(this.isLatched) {
			//it's only a collision if the circle ended up outside the grapple's length
			var lineToLatchPoint = circle.pos.createVectorTo(this.pos);
			if(lineToLatchPoint.squareLength() > this._latchLength * this._latchLength) {
				//we're going to ignore cases where the circle didn't move at all (makes it easier)
				var lineOfMovement = circle.prevPos.createVectorTo(circle.pos);
				if(!lineOfMovement.isZero()) {
					var lineFromLatchPointToPrev = this.pos.createVectorTo(circle.prevPos);
					var totalDist, contactPoint, distTraveled;

					//if the circle STARTED outside the grapple area, we interpolate the contact point
					if(lineFromLatchPointToPrev.squareLength() > this._latchLength * this._latchLength) {
						contactPoint = this.pos.clone().add(lineFromLatchPointToPrev
							.clone().setLength(this._latchLength));
						totalDist = lineOfMovement.length();
						distTraveled = 0;
					}

					//if the circle exited the grapple area, we just need to find wher it exited
					else {
						contactPoint = MathUtils.findCircleLineIntersection(this.pos,
							this._latchLength, circle.prevPos, circle.pos);
						if(contactPoint) {
							totalDist = lineOfMovement.length();
							distTraveled = contactPoint.clone().subtract(circle.prevPos).length();
						}
					}

					//if there was a contact point (there should be, since it ended up outside the area)
					if(contactPoint) {
						//we want to rotate such that the contact point is "right" of the latch point
						var distToTravel = totalDist - distTraveled;
						var lineFromLatchPointToContactPoint = this.pos.createVectorTo(contactPoint);
						var angle = lineFromLatchPointToContactPoint.angle();
						var cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);

						//then we want to find where the circle should end up within the grapple area
						var arcLength = lineOfMovement.unrotate(cosAngle, sinAngle)
							.setLength(distToTravel).y;
						var finalPoint = (new Vector(this._latchLength - 0.001, 0))
							.rotate(angle + (arcLength / this._latchLength))
							.add(this.pos);

						//velocity AWAY from the lath point is neutralized
						var cosAngle2 = Math.cos(angle + arcLength / (2 * this._latchLength));
						var sinAngle2 = Math.sin(angle + arcLength / (2 * this._latchLength));
						var finalVel = circle.vel.clone().unrotate(cosAngle2, sinAngle2);
						if(finalVel.x > 0) {
							finalVel.x = 0;
						}
						finalVel.rotate(cosAngle2, sinAngle2);

						return {
							cause: this,
							distTraveled: distTraveled,
							distToTravel: distToTravel,
							contactPoint: contactPoint,
							vectorTowards: lineFromLatchPointToPrev.clone().normalize(),
							stabilityAngle: null,
							finalPoint: finalPoint,
							jumpVector: null,
							finalVel: finalVel
						};
					}
				}
			}
		}
		return false;
	};
	GrappleEntity.prototype.handleCollision = function(collision) {
		var latchPoint = collision.contactPoint.clone().add(
			collision.vectorTowards.clone().setLength(this.radius));
		this.pos = latchPoint;
		this.prevPos = this.pos.clone();
		this.vel.zero();
		this.isLatched = true;
		this._latchLength = this._player.pos.createVectorTo(this.pos).length();
	};
	GrappleEntity.prototype.highlight = function() {
		this._highlightFrames = 3;
	};
	GrappleEntity.prototype.render = function(ctx, camera) {
		var color = (this._highlightFrames > 0 ? '#f00' : '#009');
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y,
			(this.isLatched ? 2 : this.radius), 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this._player.pos.x - camera.x, this._player.pos.y - camera.y);
		ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
		ctx.stroke();
		if(this.isLatched) {
			ctx.strokeStyle = '#ccc';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y,
				this._latchLength, 0, 2 * Math.PI, false);
			ctx.stroke();
		}
	};
	return GrappleEntity;
});