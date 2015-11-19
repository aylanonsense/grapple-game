define([
	'level/geometry/LevelGeom',
	'util/extend',
	'math/Vector',
	'math/calcCircleLineIntersection',
	'display/draw'
], function(
	LevelGeom,
	extend,
	Vector,
	calcCircleLineIntersection,
	draw
) {
	var ERROR_ALLOWED = 0.3;
	function MovingPoint(x, y, params) {
		LevelGeom.call(this, extend(params, {
			levelGeomType: 'Point'
		}));
		this.pos = new Vector(x, y);
		this.vel = new Vector(params.velX || 0, params.velY || 0);
		this._moveThisFrame = new Vector(0, 0);
	}
	MovingPoint.prototype = Object.create(LevelGeom.prototype);
	MovingPoint.prototype.update = function(t) {
		//move point -- assume this occurs BEFORE entities
		this._moveThisFrame.copy(this.vel).multiply(t);
		this.pos.add(this._moveThisFrame);
	};
	MovingPoint.prototype.checkForCollisionWithEntity = function(entity) {
		//we say two points can't collide (they both take up no space after all)
		if(entity.radius === 0) {
			return false;
		}

		//if the circle started out inside of the point, we need to consider what it looks like pushed outside of the point
		var pos = entity.pos.clone().add(this._moveThisFrame);
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
			var finalVel = entity.vel.clone().unrotate(cosAngle, sinAngle);
			if(finalVel.x < 0) {
				finalVel.x *= -entity.bounce;
			}
			finalVel.rotate(cosAngle, sinAngle);

			//counter-gravity vector
			var counterGravityVector = lineFromPointToContactPoint.clone().rotate(Math.PI / 2).setLength(-cosAngle);//this._lineBetween.clone().setLength(-this._sinAngle);

			return {
				cause: this,
				collidableRadius: entity.radius,
				distTraveled: distTraveled,
				distToTravel: distToTravel,
				contactPoint: contactPoint,
				vectorTowards: new Vector(-Math.cos(angle), -Math.sin(angle)),
				stabilityAngle: (this.slippery ? null : angle),
				finalPoint: finalPoint,
				counterGravityVector: counterGravityVector,
				perpendicularAngle: angle,
				jumpable: true,
				finalVel: finalVel
			};
		}

		//otherwise there is no collision
		return false;
	};
	MovingPoint.prototype.render = function() {
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
	return MovingPoint;
});