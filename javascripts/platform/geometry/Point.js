define([
	'platform/geometry/PlatformGeometry',
	'util/extend',
	'math/Vector',
	'math/calcCircleLineIntersection',
	'display/draw'
], function(
	PlatformGeometry,
	extend,
	Vector,
	calcCircleLineIntersection,
	draw
) {
	var ERROR_ALLOWED = 0.3;
	function Point(params) {
		PlatformGeometry.call(this, extend(params, { geometryType: 'Point' }));
		this.pos = new Vector(params.x || 0, params.y || 0);
	}
	Point.prototype = Object.create(PlatformGeometry.prototype);
	Point.prototype.move = function(movement, vel) {
		PlatformGeometry.prototype.move.apply(this, arguments);
		this.pos.add(movement);
	};
	Point.prototype.checkForCollisionWithEntity = function(entity) {
		//TODO account for the point's velocity

		//we say two points can't collide (they both take up no space after all)
		if(entity.radius === 0) {
			return false;
		}

		//if the circle started out inside of the point, we need to consider what it looks like pushed outside of the point
		var pos = entity.pos.clone().add(this._movement); //add movement to account for point velocity
		var prevPos = entity.prevPos.clone();
		if(prevPos.squareDistance(this.pos) < entity.radius * entity.radius) {
			var lineToPrevPos = this.pos.createVectorTo(prevPos);
			lineToPrevPos.setLength(entity.radius + 0.01);
			prevPos = this.pos.clone().add(lineToPrevPos);
		}

		//we have a utility method that finds us the interseciton between a circle and line
		var contactPoint = calcCircleLineIntersection(this.pos, entity.radius, prevPos, pos);
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
			var movementPostContact = lineOfMovement.clone().setLength(distToTravel).unrotate(cosAngle, sinAngle);
			if(movementPostContact.x < 0) {
				movementPostContact.x *= -entity.bounce;
			}
			movementPostContact.rotate(cosAngle, sinAngle);
			var finalPoint = contactPoint.clone().add(movementPostContact);

			//calculate the final velocity
			var vel = entity.vel.clone().subtract(this._vel).unrotate(cosAngle, sinAngle);
			if(vel.x < 0) {
				vel.x *= -entity.bounce;
			}

			//counter-gravity vector
			var counterGravityVector = lineFromPointToContactPoint.clone().rotate(Math.PI / 2).setLength(-cosAngle);//this._lineBetween.clone().setLength(-this._sinAngle);
			//TODO this counter gravity vector is probably wrong...

			return {
				cause: this,
				collidableRadius: entity.radius,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: angle,
				finalPoint: finalPoint,
				counterGravityVector: counterGravityVector,
				perpendicularAngle: angle,
				surfaceVel: this._vel,
				jumpable: true,
				finalVel: vel.rotate(cosAngle, sinAngle).add(this._vel)
			};
		}

		//otherwise there is no collision
		return false;
	};
	Point.prototype.render = function() {
		var color = '#000';
		if(this._grapplesOnly) {
			color = '#bb0';
		}
		else if(this._noGrapples) {
			color = '#a0a';
		}
		else if(this.slippery) {
			color = '#0aa';
		}
		draw.circle(this.pos.x, this.pos.y, 2, { fill: color });
	};
	return Point;
});