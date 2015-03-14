define([
	'math/Vector',
	'phys/Utils'
], function(
	Vector,
	PhysUtils
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
			var lineToLatchPoint = this.pos.clone().subtract(circle.pos);
			if(lineToLatchPoint.squareLength() > this._latchLength * this._latchLength) {
				var lineOfMovement = circle.pos.clone().subtract(circle.prevPos);
				if(!lineOfMovement.isZero()) {
					var lineFromLatchPointToPrev = circle.prevPos.clone().subtract(this.pos);
					var totalDist, contactPoint, distTraveled;
					if(lineFromLatchPointToPrev.squareLength() > this._latchLength * this._latchLength) {
						//the circle STARTED outside of the grapple area
						totalDist = lineOfMovement.length();
						contactPoint = this.pos.clone().add(lineFromLatchPointToPrev.clone().normalize().multiply(this._latchLength));
						distTraveled = 0;
					}
					else {
						//the circle moved outside of the grapple area
						contactPoint = PhysUtils.findCircleLineIntersection(this.pos, this._latchLength, circle.prevPos, circle.pos);
						if(contactPoint) {
							totalDist = lineOfMovement.length();
							distTraveled = contactPoint.clone().subtract(circle.prevPos).length();
						}
					}
					if(contactPoint) {
						var distToTravel = totalDist - distTraveled;
						var lineFromLatchPointToContactPoint = contactPoint.clone().subtract(this.pos);
						var angle = lineFromLatchPointToContactPoint.angle();
						var cosAngle = Math.cos(angle);
						var sinAngle = Math.sin(angle);
						//rotate such that contact point is "above" latch point (-y)
						var rotatedLineOfMovementRemaining =
							this._rotateVector(lineOfMovement, cosAngle, sinAngle)
							.normalize().multiply(distToTravel);
						var arcLength = rotatedLineOfMovementRemaining.x;
						var angleOfMovement = arcLength / this._latchLength;
						var finalPoint = this._rotateVector(contactPoint, cosAngle, sinAngle);
						var blahX = arcLength * Math.cos(angleOfMovement / 2);
						var blahY = arcLength * Math.sin(angleOfMovement / 2);
						finalPoint.add(0.99 * blahX, 0.99 * blahY);
						var cosAngle2 = Math.cos(angle + angleOfMovement / 2);
						var sinAngle2 = Math.sin(angle + angleOfMovement / 2);
						var rotatedVel = this._rotateVector(circle.vel, cosAngle2, sinAngle2);
						if(rotatedVel.y < 0) {
							rotatedVel.y = 0;
						}

						return {
							cause: this,
							hasPriority: false,
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