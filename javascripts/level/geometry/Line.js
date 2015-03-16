define([
	'level/geometry/LevelGeom',
	'math/Vector',
	'math/Utils'
], function(
	SUPERCLASS,
	Vector,
	MathUtils
) {
	var ERROR_ALLOWED = 0.3;
	function Line(x1, y1, x2, y2, opts) {
		SUPERCLASS.call(this, 'line', opts);
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
			var lineOfMovement = pos.clone().subtract(prevPos);
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
				var lineOfMovementPostCollision = pos.clone().subtract(prevPos)
					.normalize().multiply(distToTravel, distToTravel * -bounceAmt);
				var finalPoint = contactPoint.clone().add(lineOfMovementPostCollision)
					.rotate(this._cosAngle, this._sinAngle);

				//calculate the final velocity
				var finalVel = vel.clone().unrotate(this._cosAngle, this._sinAngle);
				if(finalVel.y > 0) {
					finalVel.multiply(1.0, -bounceAmt);
				}
				finalVel.rotate(this._cosAngle, this._sinAngle);

				return {
					cause: this,
					distTraveled: distTraveled,
					distToTravel: distToTravel,
					contactPoint: contactPoint.rotate(this._cosAngle, this._sinAngle),
					finalPoint: finalPoint,
					stabilityAngle: this._perpendicularAngle,
					jumpVector: (this.jumpable ? MathUtils.createJumpVector(this._perpendicularAngle) : null),
					vectorTowards: new Vector(-Math.cos(this._perpendicularAngle), -Math.sin(this._perpendicularAngle)),
					finalVel: finalVel
				};
			}
		}

		//there was no collision
		return false;
	};
	Line.prototype.highlight = function() {
		this._highlightFrames = 3;
	};
	Line.prototype.render = function(ctx, camera) {
		if(this._highlightFrames > 0) {
			ctx.strokeStyle = '#f00';
			ctx.lineWidth = 2;
			this._highlightFrames--;
		}
		else {
			ctx.lineWidth = 1;
			//non-collidable, so why does it exist?
			if(!this.collidesWithPlayer && !this.collidesWithGrapple) {
				ctx.strokeStyle = '#bbb'; //grey
			}
			//only grapples can collide with it
			else if(!this.collidesWithPlayer) {
				ctx.strokeStyle = '#fb0'; //orange
			}
			//only player can collide with it, but not jump off of it
			else if(!this.collidesWithGrapple && !this.jumpable) {
				ctx.strokeStyle = '#f0f'; //magenta
			}
			//only player can collide with it, and it IS jumpable
			else if(!this.collidesWithGrapple) {
				ctx.strokeStyle = '#05f'; //blue
			}
			//fully collideable, but NOT jumpable
			else if(!this.jumpable) {
				ctx.strokeStyle = '#090'; //green
			}
			//fully collidable
			else {
				ctx.strokeStyle = '#000'; //black
			}
		}
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