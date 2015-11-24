define([
	'platform/geometry/PlatformGeometry',
	'util/extend',
	'math/Vector',
	'display/draw'
], function(
	PlatformGeometry,
	extend,
	Vector,
	draw
) {
	var ERROR_ALLOWED = 0.3;
	function Line(params) {
		PlatformGeometry.call(this, extend(params, { geometryType: 'Line' }));
		this.start = new Vector(params.x1 || 0, params.y1 || 0);
		this.end = new Vector(params.x2 || 0, params.y2 || 0);

		//cache some math
		this._lineBetween = this.start.createVectorTo(this.end);
		var angle = this._lineBetween.angle();
		this._cosAngle = Math.cos(angle);
		this._sinAngle = Math.sin(angle);
		this._rotatedStart = this.start.clone().unrotate(this._cosAngle, this._sinAngle);
		this._rotatedEnd = this.end.clone().unrotate(this._cosAngle, this._sinAngle);
		this._perpendicularAngle = Math.atan2(this.start.x - this.end.x, this.end.y - this.start.y);
		var pipAngle = Math.atan2(this.start.x - this.end.x, this.end.y - this.start.y);
		this._cosPipAngle = -Math.cos(pipAngle);
		this._sinPipAngle = -Math.sin(pipAngle);
		this._counterGravityVector = this._lineBetween.clone().setLength(-this._sinAngle);
		this._vectorTowards = new Vector(-Math.cos(this._perpendicularAngle), -Math.sin(this._perpendicularAngle));
	}
	Line.prototype = Object.create(PlatformGeometry.prototype);
	Line.prototype.move = function(movement, vel) {
		PlatformGeometry.prototype.move.apply(this, arguments);

		//move line
		this.start.add(movement);
		this.end.add(movement);

		//recalc math
		this._rotatedStart = this.start.clone().unrotate(this._cosAngle, this._sinAngle);
		this._rotatedEnd = this.end.clone().unrotate(this._cosAngle, this._sinAngle);
	};
	Line.prototype.checkForCollisionWithEntity = function(entity) {
		//TODO account for velocity

		//let's rotate the scene so the line is horizontal and the circle is "above" it
		var pos1 = entity.pos.clone();
		var prevPos1 = entity.prevPos.clone().add(this._movement);
		var pos = entity.pos.clone().unrotate(this._cosAngle, this._sinAngle);
		var prevPos = entity.prevPos.clone().add(this._movement).unrotate(this._cosAngle, this._sinAngle);
		var vel = entity.vel.clone().subtract(this._vel).unrotate(this._cosAngle, this._sinAngle);

		//if there was a collision, the circle was right on top of the line (ignoring endpoints)
		var collisionY = this._rotatedStart.y - entity.radius;

		//we fudge the numbers a little bit, makes things more consistent
		if(prevPos.y > collisionY && prevPos.y <= collisionY + ERROR_ALLOWED) {
			prevPos.y = collisionY;
		}
		if(pos.y <= collisionY && pos.y > collisionY - ERROR_ALLOWED) {
			pos.y = collisionY;
		}

		//of course this would only happen if the entity was moving downwards towards the line
		if(prevPos.y <= collisionY && collisionY < pos.y) {
			//find the contact point
			var lineOfMovement = prevPos.createVectorTo(pos);
			var distTotal = lineOfMovement.length();
			var percentOfMovement;
			if(lineOfMovement.y === 0) { percentOfMovement = 1.0; }
			else { percentOfMovement = (collisionY - prevPos.y) / lineOfMovement.y; }
			percentOfMovement = Math.max(0.0, Math.min(percentOfMovement, 1.0));
			var contactPoint = prevPos.clone().addMult(lineOfMovement, percentOfMovement);

			//we have the only possible collision point, we know the entity was there, now all we
			// have to do is see if that is on the line segment
			if(this._rotatedStart.x <= contactPoint.x && contactPoint.x <= this._rotatedEnd.x) {
				//there WAS a collision! now we want to return all the relevant info
				var distPreCollision = distTotal * percentOfMovement;

				//calculate the final position
				var distPostCollision = distTotal - distPreCollision;
				var lineOfMovementPostCollision = lineOfMovement.clone().setLength(distPostCollision);
				if(lineOfMovementPostCollision.y > 0) {
					lineOfMovementPostCollision.y *= -entity.bounce;
				}
				var finalPoint = contactPoint.clone().add(lineOfMovementPostCollision);

				//calculate the final velocity
				if(vel.y > 0) {
					vel.y *= -entity.bounce;
				}

				//voila!!
				return {
					cause: this,
					collidableRadius: entity.radius,
					distTraveled: distPreCollision,
					distToTravel: distPostCollision,
					contactPoint: contactPoint.rotate(this._cosAngle, this._sinAngle),
					finalPoint: finalPoint.rotate(this._cosAngle, this._sinAngle),
					counterGravityVector: this._counterGravityVector,
					stabilityAngle: this._perpendicularAngle, //TODO just use perpendicularAngle?
					perpendicularAngle: this._perpendicularAngle,
					jumpable: true,
					vectorTowards: this._vectorTowards,
					surfaceVel: this._vel,
					finalVel: vel.rotate(this._cosAngle, this._sinAngle).add(this._vel)
				};
			}
		}

		//there was no collision
		return false;
	};
	Line.prototype.render = function() {
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
		draw.line(this.start.x, this.start.y, this.end.x, this.end.y, { stroke: color });
		draw.line((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2,
			(this.start.x + this.end.x) / 2 + 10 * this._cosPipAngle,
			(this.start.y + this.end.y) / 2 + 10 * this._sinPipAngle, { stroke: color });
	};
	return Line;
});