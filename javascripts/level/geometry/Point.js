define([
	'level/geometry/LevelGeom',
	'lib/Vector'
], function(
	SUPERCLASS,
	Vector
) {
	function Point(x, y) {
		SUPERCLASS.call(this, 'point');
		this.pos = new Vector(x, y);
		this._parentLines = [];
	}
	Point.prototype = Object.create(SUPERCLASS.prototype);
	Point.prototype.addParent = function(line) {
		this._parentLines.push(line);
	};
	Point.prototype.isChildOf = function(line) {
		for(var i = 0; i < this._parentLines.length; i++) {
			if(this._parentLines[i].sameAs(line)) {
				return true;
			}
		}
		return false;
	};
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
		//calculate the discriminant
		var lineOfMovement = pos.clone().subtract(prevPos);
		var lineToPoint = this.pos.clone().subtract(prevPos);
		var a = lineOfMovement.dot(lineOfMovement);
		var b = 2 * lineToPoint.dot(lineOfMovement);
		var c = lineToPoint.dot(lineToPoint) - radius * radius;
		var discriminant = b * b - 4 * a * c;

		//we'll only have real roots if the discriminant is >= 0
		if(discriminant >= 0) {
			//we have two roots, the contact point is the one closest to the circle's starting point
			discriminant = Math.sqrt(discriminant);
			var root1 = (-b - discriminant) / (2 * a);
			var root2 = (-b + discriminant) / (2 * a);
			var totalDist = lineOfMovement.length();
			var lineToRoot1 = lineOfMovement.clone().normalize().multiply(
					new Vector(totalDist * -root1, totalDist * -root1));
			var lineToRoot2 = lineOfMovement.clone().normalize().multiply(
					new Vector(totalDist * -root2, totalDist * -root2));
			var lineToContactPoint = (lineToRoot1.lengthSq() < lineToRoot2.lengthSq() ? lineToRoot1 : lineToRoot2);

			//the contact point is only valid if it's actually on the circle's path (not past it)
			var contactPointLength = lineOfMovement.dot(lineToContactPoint) / totalDist;
			if(0 <= contactPointLength && contactPointLength <= totalDist) {
				//yay, there definitely was a collision!
				var contactPoint = prevPos.clone().add(lineToContactPoint);
				var distTraveled = lineToContactPoint.length();

				//now we figure out the angle of contact, so we can bounce the circle off of the point
				var lineFromPointToContactPoint = contactPoint.clone().subtract(this.pos);
				var angle = lineFromPointToContactPoint.angle();
				var cosAngle = Math.cos(angle);
				var sinAngle = Math.sin(angle);

				//calculate the final position
				var distToTravel = totalDist - distTraveled;
				var lineOfMovementPostContact = this._rotateVector(lineOfMovement, cosAngle, sinAngle);
				lineOfMovementPostContact.normalize().multiply(new Vector(distToTravel, distToTravel * -bounceAmt));
				lineOfMovementPostContact = this._unrotateVector(lineOfMovementPostContact, cosAngle, sinAngle);
				var finalPoint = contactPoint.clone().add(lineOfMovementPostContact);

				//calculate the final velocity
				var finalVel = this._rotateVector(vel, cosAngle, sinAngle);
				if(finalVel.y > 0) {
					finalVel.multiply(new Vector(1.0, -bounceAmt));
				}

				return {
					distTraveled: distTraveled,
					contactPoint: contactPoint,
					finalPoint: finalPoint,
					finalVel: this._unrotateVector(finalVel, cosAngle, sinAngle)
				};
			}
		}

		//otherwise there is no collision
		return false;
	};
	Point.prototype.render = function(ctx, camera) {
		ctx.fillStyle = '#000';
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, 1.5, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return Point;
});