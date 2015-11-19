define([
	'level/geometry/LevelGeom',
	'util/extend',
	'math/Vector',
	'display/draw'
], function(
	LevelGeom,
	extend,
	Vector,
	draw
) {
	var ERROR_ALLOWED = 0.3;
	function MovingLine(x1, y1, x2, y2, params) {
		LevelGeom.call(this, extend(params, {
			levelGeomType: 'Line'
		}));
		this.start = new Vector(x1, y1);
		this.end = new Vector(x2, y2);
		this.vel = new Vector(params.velX || 0, params.velY || 0);
		this._moveThisFrame = new Vector(0, 0);

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
		this._counterGravityVector = this._lineBetween.clone().setLength(-this._sinAngle);
	}
	MovingLine.prototype = Object.create(LevelGeom.prototype);
	MovingLine.prototype.update = function(t) {
		//move line -- assume this occurs BEFORE entities
		this._moveThisFrame.copy(this.vel).multiply(t);
		this.start.add(this._moveThisFrame);
		this.end.add(this._moveThisFrame);

		//recalc math
		this._rotatedStart = this.start.clone().unrotate(this._cosAngle, this._sinAngle);
		this._rotatedEnd = this.end.clone().unrotate(this._cosAngle, this._sinAngle);
	};
	MovingLine.prototype.checkForCollisionWithEntity = function(entity) {
		//let's rotate the scene so the line is horizontal and the circle is "above" it
		var pos = entity.pos.clone().unrotate(this._cosAngle, this._sinAngle);
		var prevPos = entity.prevPos.clone().add(this._moveThisFrame).unrotate(this._cosAngle, this._sinAngle);

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
			var lineOfMovement = prevPos.createVectorTo(pos);
			var totalDist = lineOfMovement.length();
			var percentOfMovement;
			if(lineOfMovement.y === 0) { percentOfMovement = 1.0; }
			else { percentOfMovement = (collisionY - prevPos.y) / lineOfMovement.y; }
			percentOfMovement = Math.max(0.0, Math.min(percentOfMovement, 1.0));
			lineOfMovement.multiply(percentOfMovement);
			var contactPoint = prevPos.clone().add(lineOfMovement);

			//we have the only possible collision point, we know the entity was there, now all we
			// have to do is see if that is on the line segment
			if(this._rotatedStart.x <= contactPoint.x && contactPoint.x <= this._rotatedEnd.x) {
				//there WAS a collision! now we want to return all the relevant info
				var distTraveled = lineOfMovement.length();

				//calculate the final position
				var distToTravel = totalDist - distTraveled;
				var lineOfMovementPostCollision = prevPos.createVectorTo(pos)
					.normalize().multiply(distToTravel, distToTravel);
				if(lineOfMovementPostCollision.y > 0) {
					lineOfMovementPostCollision.y *= -entity.bounce;
				}
				var finalPoint = contactPoint.clone().add(lineOfMovementPostCollision)
					.rotate(this._cosAngle, this._sinAngle);

				//calculate the final velocity
				var finalVel = entity.vel.clone().unrotate(this._cosAngle, this._sinAngle);
				if(finalVel.y > 0) {
					finalVel.multiply(1.0, -entity.bounce);
				}
				finalVel.rotate(this._cosAngle, this._sinAngle);

				//voila!!
				return {
					cause: this,
					collidableRadius: entity.radius,
					distTraveled: distTraveled,
					distToTravel: distToTravel,
					contactPoint: contactPoint.rotate(this._cosAngle, this._sinAngle),
					finalPoint: finalPoint,
					counterGravityVector: this._counterGravityVector,
					stabilityAngle: (this.slippery ? null : this._perpendicularAngle),
					perpendicularAngle: this._perpendicularAngle,
					jumpable: true,
					vectorTowards: new Vector(-Math.cos(this._perpendicularAngle), -Math.sin(this._perpendicularAngle)),
					finalVel: finalVel
				};
			}
		}

		//there was no collision
		return false;
	};
	MovingLine.prototype.render = function() {
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
	return MovingLine;
});