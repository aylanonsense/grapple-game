define([
	'math/Vector',
	'math/Utils'
], function(
	Vector,
	MathUtils
) {
	var nextId = 0;
	var MOVE_SPEED = 2000;
	function GrappleEntity(player, dirX, dirY) {
		this._grappleEntityId = nextId++;
		this._player = player;
		this.pos = player.pos.clone();
		this.prevPos = this.pos.clone();
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
	GrappleEntity.prototype._rotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle + vector.y * cosAngle,
			-vector.x * cosAngle - vector.y * sinAngle
		);
	};
	GrappleEntity.prototype._unrotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle - vector.y * cosAngle,
			vector.x * cosAngle - vector.y * sinAngle
		);
	};
	GrappleEntity.prototype.checkForCollisionWithMovingCircle = function(circle) {
		if(this.isLatched) {
			//it's only a collision if the circle ended up outside the grapple's length
			var lineToLatchPoint = circle.pos.createLineTo(this.pos);
			if(lineToLatchPoint.squareLength() > this._latchLength * this._latchLength) {
				//we're going to ignore cases where the circle didn't move at all (makes it easier)
				var lineOfMovement = circle.prevPos.createLineTo(circle.pos);
				if(!lineOfMovement.isZero()) {
					var lineFromLatchPointToPrev = this.pos.createLineTo(circle.prevPos);
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
						//we want to rotate such that the contact point is "above" the latch point (-y)
						var distToTravel = totalDist - distTraveled;
						var lineFromLatchPointToContactPoint = this.pos.createLineTo(contactPoint);
						var angle = lineFromLatchPointToContactPoint.angle();
						var cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);
						var rotatedLine = this._rotateVector(lineOfMovement, cosAngle, sinAngle);

						//then we want to find where the circle should end up within the grapple area
						var arcLength = rotatedLine.normalize().multiply(distToTravel).x;
						var angleOfMovement = (arcLength / this._latchLength) / 2;
						var finalPoint = this._rotateVector(contactPoint, cosAngle, sinAngle)
							.add(0.99 * arcLength * Math.cos(angleOfMovement),
								0.99 * arcLength * Math.sin(angleOfMovement));
						var cosAngle2 = Math.cos(angle + angleOfMovement);
						var sinAngle2 = Math.sin(angle + angleOfMovement);

						//velocity AWAY from the lath point is neutralized
						var rotatedVel = this._rotateVector(circle.vel, cosAngle2, sinAngle2);
						if(rotatedVel.y < 0) {
							rotatedVel.y = 0;
						}

						return {
							cause: this,
							distTraveled: distTraveled,
							distToTravel: distToTravel,
							contactPoint: contactPoint,
							vectorTowards: lineFromLatchPointToPrev.clone().normalize(),
							stabilityAngle: null,
							finalPoint: this._unrotateVector(finalPoint, cosAngle, sinAngle),
							jumpVector: new Vector(0, -1),
							finalVel: this._unrotateVector(rotatedVel, cosAngle2, sinAngle2)
						};
					}
				}
			}
		}
		return false;
	};
	GrappleEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.contactPoint;
		this.prevPos = collision.contactPoint;
		this.vel.zero();
		this.isLatched = true;
		this._latchLength = this.pos.clone().subtract(this._player.pos).length();
	};
	GrappleEntity.prototype.highlight = function() {
		this._highlightFrames = 3;
	};
	GrappleEntity.prototype.render = function(ctx, camera) {
		var color = (this._highlightFrames > 0 ? '#f00' : '#009');
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, 2, 0, 2 * Math.PI, false);
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
			ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this._latchLength, 0, 2 * Math.PI, false);
			ctx.stroke();
		}
	};
	return GrappleEntity;
});