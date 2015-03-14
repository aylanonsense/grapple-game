define([
	'level/geometry/LevelGeom',
	'math/Vector',
	'phys/Utils'
], function(
	SUPERCLASS,
	Vector,
	PhysUtils
) {
	function Point(x, y) {
		SUPERCLASS.call(this, 'point');
		this.pos = new Vector(x, y);
		this._highlightFrames = 0;
	}
	Point.prototype = Object.create(SUPERCLASS.prototype);
	Point.prototype._rotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle + vector.y * cosAngle,
			-vector.x * cosAngle - vector.y * sinAngle
		);
	};
	Point.prototype._unrotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle - vector.y * cosAngle,
			vector.x * cosAngle - vector.y * sinAngle
		);
	};
	Point.prototype.checkForCollisionWithMovingCircle = function(circle, bounceAmt) {
		return this._checkForCollisionWithMovingCircle(circle.pos,
			circle.prevPos, circle.vel, circle.radius, bounceAmt);
	};
	Point.prototype.checkForCollisionWithMovingPoint = function(point, bounceAmt) {
		//we say two points can't collide (they both take up no space after all)
		return false;
	};
	Point.prototype._checkForCollisionWithMovingCircle = function(pos, prevPos, vel, radius, bounceAmt) {
		//if the circle started out inside of the point, they can't be colliding
		if(prevPos.squareDistance(this.pos) < radius * radius) {
			return false;
		}

		var contactPoint = PhysUtils.findCircleLineIntersection(this.pos, radius, prevPos, pos);
		if(contactPoint) {
			var lineToContactPoint = contactPoint.clone().subtract(prevPos);
			var distTraveled = lineToContactPoint.length();
			var lineOfMovement = pos.clone().subtract(prevPos);
			var totalDist = lineOfMovement.length();

			//now we figure out the angle of contact, so we can bounce the circle off of the point
			var lineFromPointToContactPoint = contactPoint.clone().subtract(this.pos);
			var angle = lineFromPointToContactPoint.angle();
			var cosAngle = Math.cos(angle);
			var sinAngle = Math.sin(angle);

			//calculate the final position
			var distToTravel = totalDist - distTraveled;
			var lineOfMovementPostContact = this._rotateVector(lineOfMovement, cosAngle, sinAngle);
			lineOfMovementPostContact.normalize().multiply(distToTravel, distToTravel * -bounceAmt);
			lineOfMovementPostContact = this._unrotateVector(lineOfMovementPostContact, cosAngle, sinAngle);
			var finalPoint = contactPoint.clone().add(lineOfMovementPostContact);

			//calculate the final velocity
			var finalVel = this._rotateVector(vel, cosAngle, sinAngle);
			if(finalVel.y > 0) {
				finalVel.multiply(1.0, -bounceAmt);
			}

			//create jump vector
			var jumpVector = PhysUtils.createJumpVector(angle);

			return {
				cause: this,
				hasPriority: true,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: null,
				finalPoint: finalPoint,
				jumpVector: jumpVector,
				finalVel: this._unrotateVector(finalVel, cosAngle, sinAngle)
			};
		}

		//otherwise there is no collision
		return false;
	};
	Point.prototype.highlight = function() {
		this._highlightFrames = 3;
	};
	Point.prototype.render = function(ctx, camera) {
		var radius;
		if(this._highlightFrames > 0) {
			ctx.fillStyle = '#f00';
			this._highlightFrames--;
			radius = 3;
		}
		else {
			ctx.fillStyle = '#000';
			radius = 1.5;
		}
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return Point;
});