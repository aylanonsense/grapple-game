define([
	'level/geometry/LevelGeom',
	'math/Vector',
	'math/Utils'
], function(
	SUPERCLASS,
	Vector,
	MathUtils
) {
	function Point(x, y) {
		SUPERCLASS.call(this, 'point');
		this.pos = new Vector(x, y);
		this._highlightFrames = 0;
	}
	Point.prototype = Object.create(SUPERCLASS.prototype);
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

		//we have a utility method that finds us the interseciton between a circle and line
		var contactPoint = MathUtils.findCircleLineIntersection(this.pos, radius, prevPos, pos);
		if(contactPoint) {
			//there definitely is a collision here
			var lineToContactPoint = prevPos.createVectorTo(contactPoint);
			var distTraveled = lineToContactPoint.length();
			var lineOfMovement = prevPos.createVectorTo(pos);
			var totalDist = lineOfMovement.length();

			//now we figure out the angle of contact, so we can bounce the circle off of the point
			var lineFromPointToContactPoint = this.pos.createVectorTo(contactPoint);
			var angle = lineFromPointToContactPoint.angle();
			var cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);

			//calculate the final position
			var distToTravel = totalDist - distTraveled;
			var movementPostContact = lineOfMovement.clone()
				.setLength(distToTravel).unrotate(cosAngle, sinAngle);
			if(movementPostContact.x < 0) {
				movementPostContact.x *= -bounceAmt;
			}
			movementPostContact.rotate(cosAngle, sinAngle);
			var finalPoint = contactPoint.clone().add(movementPostContact);

			//calculate the final velocity
			var finalVel = vel.clone().unrotate(cosAngle, sinAngle);
			if(finalVel.x < 0) {
				finalVel.x *= -bounceAmt;
			}
			finalVel.rotate(cosAngle, sinAngle);

			//create jump vector
			var jumpVector = MathUtils.createJumpVector(angle);

			return {
				cause: this,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: null,
				finalPoint: finalPoint,
				jumpVector: jumpVector,
				finalVel: finalVel
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