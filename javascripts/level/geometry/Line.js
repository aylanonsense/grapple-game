define([
	'level/geometry/LevelGeom',
	'lib/Vector'
], function(
	SUPERCLASS,
	Vector
) {
	var ERROR_ALLOWED = 0.005;
	function Line(x1, y1, x2, y2) {
		SUPERCLASS.call(this, 'line');
		this.start = new Vector(x1, y1);
		this.end = new Vector(x2, y2);

		//cache some math
		this._lineBetween = this.end.clone().subtract(this.start);
		this._cosLineBetween = Math.cos(this._lineBetween.angle());
		this._sinLineBetween = Math.sin(this._lineBetween.angle());
		this._rotatedStart = this._rotateVector(this.start);
		this._rotatedEnd = this._rotateVector(this.end);
		this._rotatedY = this._rotatedStart.y;
		var pipAngle = Math.atan2(this.start.x - this.end.x, this.end.y - this.start.y);
		this._cosPipAngle = -Math.cos(pipAngle);
		this._sinPipAngle = -Math.sin(pipAngle);
	}
	Line.prototype = Object.create(SUPERCLASS.prototype);
	Line.prototype._rotateVector = function(vector) {
		return new Vector(
			vector.x * this._cosLineBetween + vector.y * this._sinLineBetween,
			-vector.x * this._sinLineBetween + vector.y * this._cosLineBetween
		);
	};
	Line.prototype._unrotateVector = function(vector) {
		return new Vector(
			vector.x * this._cosLineBetween - vector.y * this._sinLineBetween,
			vector.x * this._sinLineBetween + vector.y * this._cosLineBetween
		);
	};
	Line.prototype.checkForCollisionWithMovingCircle = function(circle, bounceAmt) {
		return this._checkForCollisionWithMovingCircle(circle.pos,
			circle.prevPos, circle.vel, circle.radius, bounceAmt);
	};
	Line.prototype.checkForCollisionWithMovingPoint = function(point, bounceAmt) {
		//a moving point is just a moving circle with 0 radius, so... do that!
		return this._checkForCollisionWithMovingCircle(point.pos, point.prevPos, point.vel, 0, bounceAmt);
	};
	Line.prototype._checkForCollisionWithMovingCircle = function(pos, prevPos, vel, radius, bounceAmt) {
		bounceAmt = bounceAmt || 0.0;

		//let's rotate the scene so the line is horizontal and the circle is "above" it
		pos = this._rotateVector(pos);
		prevPos = this._rotateVector(prevPos);

		//if there was a collision, the circle was right on top of the line (ignoring endpoints)
		var collisionY = this._rotatedStart.y - radius;

		//of course this would only happen if the circle was moving downwards onto the line
		if(prevPos.y <= collisionY && collisionY < pos.y) {
			var lineOfMovement = pos.clone().subtract(prevPos);
			var totalDist = lineOfMovement.length();
			var percentOfMovement = (collisionY - prevPos.y) / lineOfMovement.y;
			lineOfMovement.multiply(new Vector(percentOfMovement, percentOfMovement));
			var contactPoint = prevPos.clone().add(lineOfMovement);

			//we have the only possible collision point, we know the circle was there, now all we
			// have to do is see if that is on the line segment
			if(this._rotatedStart.x <= contactPoint.x && contactPoint.x <= this._rotatedEnd.x) {
				//there WAS a collision! return all the relevant info
				var distTraveled = lineOfMovement.length();

				//calculate the final position
				var distToTravel = totalDist - distTraveled;
				lineOfMovement.normalize().multiply(new Vector(distToTravel, distToTravel * -bounceAmt));
				var finalPoint = contactPoint.clone().add(lineOfMovement);

				//calculate the final velocity
				var finalVel = this._rotateVector(vel);
				if(finalVel.y > 0.0) {
					finalVel.multiply(new Vector(1.0, -bounceAmt));
				}

				return {
					distTraveled: distTraveled,
					contactPoint: this._unrotateVector(contactPoint),
					finalPoint: this._unrotateVector(finalPoint),
					finalVel: this._unrotateVector(finalVel)
				};
			}
		}

		//there was no collision
		return false;
	};
	Line.prototype.render = function(ctx, camera) {
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this.start.x - camera.x, this.start.y - camera.y);
		ctx.lineTo(this.end.x - camera.x, this.end.y - camera.y);
		ctx.moveTo((this.start.x + this.end.x) / 2 - camera.x, (this.start.y + this.end.y) / 2 - camera.y);
		ctx.lineTo((this.start.x + this.end.x) / 2 + 10 * this._cosPipAngle - camera.x,
					(this.start.y + this.end.y) / 2 + 10 * this._sinPipAngle - camera.y);
		ctx.stroke();
	};
	return Line;
});