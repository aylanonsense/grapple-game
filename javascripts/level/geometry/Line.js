define([
	'level/geometry/LevelGeom',
	'math/Vector',
	'math/createJumpVector',
	'display/Draw'
], function(
	SUPERCLASS,
	Vector,
	createJumpVector,
	Draw
) {
	var ERROR_ALLOWED = 0.3;
	function Line(x1, y1, x2, y2, opts) {
		SUPERCLASS.call(this, 'Line', opts);
		this.start = new Vector(x1, y1);
		this.end = new Vector(x2, y2);
		this._highlightFrames = 0;

		//cache some math
		this._lineBetween = this.start.createVectorTo(this.end);
		var angle = this._lineBetween.angle();
		this._cosAngle = Math.cos(angle);
		this._sinAngle = Math.sin(angle);
		this._rotatedStart = this.start.clone().unrotate(this._cosAngle, this._sinAngle);
		this._rotatedEnd = this.end.clone().unrotate(this._cosAngle, this._sinAngle);
		this._perpendicularAngle = Math.atan2(x1 - x2, y2 - y1);
		var pipAngle = Math.atan2(this.start.x - this.end.x, this.end.y - this.start.y);
		this._cosPipAngle = -Math.cos(pipAngle);
		this._sinPipAngle = -Math.sin(pipAngle);
	}
	Line.prototype = Object.create(SUPERCLASS.prototype);
	Line.prototype.onCollision = function(collision) {
		this._highlightFrames = 3;
	};
	Line.prototype.checkForCollisionWithEntity = function(entity) {
		return this._checkForCollisionWithMovingCircle(entity.pos, entity.prevPos, entity.vel, entity.radius, entity.bounce);
	};
	/*Line.prototype.checkForCollisionWithMovingCircle = function(circle, bounceAmt) {
		return this._checkForCollisionWithMovingCircle(circle.pos,
			circle.prevPos, circle.vel, circle.radius, bounceAmt);
	};
	Line.prototype.checkForCollisionWithMovingPoint = function(point, bounceAmt) {
		//a moving point is just a moving circle with 0 radius, so... do that!
		return this._checkForCollisionWithMovingCircle(point.pos, point.prevPos, point.vel, 0, bounceAmt);
	};*/
	Line.prototype._checkForCollisionWithMovingCircle = function(pos, prevPos, vel, radius, bounceAmt) {
		bounceAmt = bounceAmt || 0.0;

		//let's rotate the scene so the line is horizontal and the circle is "above" it
		pos = pos.clone().unrotate(this._cosAngle, this._sinAngle);
		prevPos = prevPos.clone().unrotate(this._cosAngle, this._sinAngle);

		//if there was a collision, the circle was right on top of the line (ignoring endpoints)
		var collisionY = this._rotatedStart.y - radius;

		//we fudge the numbers a little bit, makes things more consistent
		if(prevPos.y > collisionY && prevPos.y <= collisionY + ERROR_ALLOWED) {
			prevPos.y = collisionY;
		}
		if(pos.y <= collisionY && pos.y > collisionY - ERROR_ALLOWED) {
			pos.y = collisionY;
		}

		//of course this would only happen if the circle was moving downwards onto the line
		if(prevPos.y <= collisionY && collisionY < pos.y) {
			var lineOfMovement = prevPos.createVectorTo(pos);
			var totalDist = lineOfMovement.length();
			var percentOfMovement;
			if(lineOfMovement.y === 0) { percentOfMovement = 1.0; }
			else { percentOfMovement = (collisionY - prevPos.y) / lineOfMovement.y; }
			percentOfMovement = Math.max(0.0, Math.min(percentOfMovement, 1.0));
			lineOfMovement.multiply(percentOfMovement);
			var contactPoint = prevPos.clone().add(lineOfMovement);

			//we have the only possible collision point, we know the circle was there, now all we
			// have to do is see if that is on the line segment
			if(this._rotatedStart.x <= contactPoint.x && contactPoint.x <= this._rotatedEnd.x) {
				//there WAS a collision! return all the relevant info
				var distTraveled = lineOfMovement.length();

				//calculate the final position
				var distToTravel = totalDist - distTraveled;
				var lineOfMovementPostCollision = prevPos.createVectorTo(pos)
					.normalize().multiply(distToTravel, distToTravel);
				if(lineOfMovementPostCollision.y > 0) {
					lineOfMovementPostCollision.y *= -bounceAmt;
				}
				var finalPoint = contactPoint.clone().add(lineOfMovementPostCollision)
					.rotate(this._cosAngle, this._sinAngle);

				//calculate the final velocity
				var finalVel = vel.clone().unrotate(this._cosAngle, this._sinAngle);
				if(finalVel.y > 0) {
					finalVel.multiply(1.0, -bounceAmt);
				}
				finalVel.rotate(this._cosAngle, this._sinAngle);

				//counter-gravity vector
				var counterGravityVector = this._lineBetween.clone()
					.setLength(-this._sinAngle);

				return {
					cause: this,
					collidableRadius: radius,
					distTraveled: distTraveled,
					distToTravel: distToTravel,
					contactPoint: contactPoint.rotate(this._cosAngle, this._sinAngle),
					finalPoint: finalPoint,
					counterGravityVector: counterGravityVector,
					stabilityAngle: (this.slideOnly ? null : this._perpendicularAngle),
					jumpVector: (this.jumpable ? createJumpVector(this._perpendicularAngle) : null),
					vectorTowards: new Vector(-Math.cos(this._perpendicularAngle), -Math.sin(this._perpendicularAngle)),
					finalVel: finalVel
				};
			}
		}

		//there was no collision
		return false;
	};
	Line.prototype.render = function() {
		Draw.line(this.start.x, this.start.y, this.end.x, this.end.y, { stroke: '#000' });
		Draw.line((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2,
			(this.start.x + this.end.x) / 2 + 10 * this._cosPipAngle,
			(this.start.y + this.end.y) / 2 + 10 * this._sinPipAngle, { stroke: '#000' });
	};
	return Line;
});