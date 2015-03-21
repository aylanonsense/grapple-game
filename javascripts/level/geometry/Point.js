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
	function Point(x, y, opts) {
		SUPERCLASS.call(this, 'Point', opts);
		this.pos = new Vector(x, y);
		this._highlightFrames = 0;
	}
	Point.prototype = Object.create(SUPERCLASS.prototype);
	Point.prototype.onCollision = function(collision) {
		this._highlightFrames = 3;
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
		//if the circle started out inside of the point, we need to push it out
		if(prevPos.squareDistance(this.pos) < radius * radius) {
			var lineToPrevPos = this.pos.createVectorTo(prevPos);
			lineToPrevPos.setLength(radius + 0.01);
			prevPos = this.pos.clone().add(lineToPrevPos);
		}
		// if(prevPos.squareDistance(this.pos) < radius * radius) {
			// return false;
		// }

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

			return {
				cause: this,
				collidableRadius: radius,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: null,
				finalPoint: finalPoint,
				jumpVector: (this.jumpable ? MathUtils.createJumpVector(angle) : null),
				finalVel: finalVel
			};
		}

		//otherwise there is no collision
		return false;
	};
	Point.prototype.render = function(ctx, camera) {
		var radius;
		if(this._highlightFrames > 0) {
			ctx.fillStyle = '#f00';
			this._highlightFrames--;
			radius = 3;
		}
		else {
			radius = 2;
			//non-collidable, so why does it exist?
			if(!this.collidesWithPlayer && !this.collidesWithGrapple) {
				ctx.fillStyle = '#bbb'; //grey
			}
			//only grapples can collide with it
			else if(!this.collidesWithPlayer) {
				ctx.fillStyle = '#fb0'; //orange
			}
			//only player can collide with it, but not jump off of it
			else if(!this.collidesWithGrapple && !this.jumpable) {
				ctx.fillStyle = '#f0f'; //magenta
			}
			//only player can collide with it, and it IS jumpable
			else if(!this.collidesWithGrapple) {
				ctx.fillStyle = '#05f'; //blue
			}
			//fully collideable, but NOT jumpable
			else if(!this.jumpable) {
				ctx.fillStyle = '#090'; //green
			}
			//fully collidable, but slippery
			else if(this.slideOnly) {
				ctx.fillStyle = '#0aa'; //teal
			}
			//fully collidable
			else {
				ctx.fillStyle = '#000'; //black
			}
		}
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return Point;
});