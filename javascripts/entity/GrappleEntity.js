define([
	'math/Vector',
	'phys/Utils'
], function(
	Vector,
	PhysUtils
) {
	var nextId = 0;
	var MOVE_SPEED = 2000;
	function GrappleEntity(player, dirX, dirY) {
		this._grappleEntityId = nextId++;
		this._player = player;
		this.pos = player.pos.clone();
		this.prevPos = this.pos.clone();
		this.vel = (new Vector(dirX, dirY)).normalize().multiply(MOVE_SPEED);
		this.isLatched = false;
		this._latchLength = null;
		this._highlightFrames = 0;
	}
	GrappleEntity.prototype.sameAs = function(other) {
		return other && this._grappleEntityId === other._grappleEntityId;
	};
	GrappleEntity.prototype.sameAsAny = function(others) {
		if(others) {
			for(var i = 0; i < others.length; i++) {
				if(this.sameAs(others[i])) {
					return true;
				}
			}
		}
		return false;
	};
	GrappleEntity.prototype.tick = function(t) {
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.clone().multiply(t));
		this._highlightFrames--;
	};
	GrappleEntity.prototype._rotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle + vector.y * cosAngle,
			-vector.x * cosAngle - vector.y * sinAngle
		);
	};
	GrappleEntity.prototype._unrotateVector = function(vector, cosAngle, sinAngle) {
		return new Vector(
			-vector.x * sinAngle - vector.y * cosAngle,
			vector.x * cosAngle - vector.y * sinAngle
		);
	};
	GrappleEntity.prototype.checkForCollisionWithMovingCircle = function(circle) {
		if(this.isLatched) {
			var lineToLatchPoint = this.pos.clone().subtract(circle.pos);
			if(lineToLatchPoint.squareLength() > this._latchLength * this._latchLength) {
				var lineOfMovement = circle.pos.clone().subtract(circle.prevPos);
				if(!lineOfMovement.isZero()) {
					var lineFromLatchPointToPrev = circle.prevPos.clone().subtract(this.pos);
					var totalDist, contactPoint, distTraveled;
					if(lineFromLatchPointToPrev.squareLength() > this._latchLength * this._latchLength) {
						//the circle STARTED outside of the grapple area
						totalDist = lineOfMovement.length();
						contactPoint = this.pos.clone().add(lineFromLatchPointToPrev.clone().normalize().multiply(this._latchLength));
						distTraveled = 0;
					}
					else {
						//the circle moved outside of the grapple area
						contactPoint = PhysUtils.findCircleLineIntersection(this.pos, this._latchLength, circle.prevPos, circle.pos);
						if(contactPoint) {
							totalDist = lineOfMovement.length();
							distTraveled = contactPoint.clone().subtract(circle.prevPos).length();
						}
					}
					if(contactPoint) {
						var distToTravel = totalDist - distTraveled;
						var lineFromLatchPointToContactPoint = contactPoint.clone().subtract(this.pos);
						var angle = lineFromLatchPointToContactPoint.angle();
						var cosAngle = Math.cos(angle);
						var sinAngle = Math.sin(angle);
						var rotatedVel = this._rotateVector(circle.vel, cosAngle, sinAngle);
						if(rotatedVel.y < 0) {
							rotatedVel.y = 0;
						}
						//rotate such that contact point is "above" latch point (-y)
						var rotatedLineOfMovement = this._rotateVector(lineOfMovement, cosAngle, sinAngle).normalize().multiply(distToTravel);
						var finalPoint = this._rotateVector(contactPoint, cosAngle, sinAngle);
						finalPoint.add(rotatedLineOfMovement.x, 0);
						return {
							cause: this,
							distTraveled: distTraveled,
							distToTravel: distToTravel,
							contactPoint: contactPoint,
							vectorTowards: lineFromLatchPointToPrev.clone().normalize(),
							stabilityAngle: null,
							finalPoint: this._unrotateVector(finalPoint, cosAngle, sinAngle),
							jumpVector: new Vector(0, -1),
							finalVel: this._unrotateVector(rotatedVel, cosAngle, sinAngle)
						};
					}
				}
			}
			/*var distXToPos = this._player.pos.x - this.pos.x;
			var distYToPos = this._player.pos.y - this.pos.y;
			var distToPos = Math.sqrt(distXToPos * distXToPos + distYToPos * distYToPos);
			var distXToPrev = this._player.pos.prev.x - this.pos.x;
			var distYToPrev = this._player.pos.prev.y - this.pos.y;
			var distToPrev = Math.sqrt(distXToPrev * distXToPrev + distYToPrev * distYToPrev);
			var intersection, distToIntersection;
			var d = 0.0005;
			if(distToPrev > this.maxDist) {
				//the player started the frame beyond the max tether distance
				var angle2 = Math.atan2(this.pos.y - this._player.pos.prev.y, this.pos.x - this._player.pos.prev.x); //from latch point to intersection
				var cos2 = Math.cos(angle2);
				var sin2 = Math.sin(angle2);
				distToIntersection = 0;
				intersection = {
					x: this.pos.x - cos2 * (this.maxDist - d),
					y: this.pos.y - sin2 * (this.maxDist - d)
				};
			}
			else if(distToPos > this.maxDist) {
				//the tether moved out of the max tether range during the frame
				var x1 = this._player.pos.x;
				var x2 = this._player.pos.prev.x;
				var y1 = this._player.pos.y;
				var y2 = this._player.pos.prev.y;
				if(x1 === x2 && y1 === y2) {
					//no movement, we won't handle collision like this
					console.log("TODO handle collisions with no movement");
					return false;
				}
				var m = (y1 - y2) / (x1 - x2); //can be +/- Infinity
				var isVertical = (m === Infinity || m === -Infinity);
				var c = (isVertical ? x1 : y1 - m * x1);
				var a = this.pos.x;
				var b = this.pos.y;
				var r = this.maxDist;
				var aprim, bprim, cprim;
				if(isVertical) {
					aprim = 1;
					bprim = -2 * b;
					cprim = (c - a) * (c - a) + b * b - r * r;
				}
				else {
					aprim = (m * m + 1);
					bprim = 2 * (m * (c - b) - a);
					cprim = (c - b) * (c - b) + a * a - r * r;
				}

				var discriminant = bprim * bprim - 4 * aprim * cprim;
				if(discriminant < 0 && discriminant > -0.0005) {
					//a very slightly negative discriminant, probably just a rounding error--make it 0
					discriminant = 0;
				}
				if(discriminant < 0) {
					//no possible intersection, I don't see how this is possible with it starting inside the circle and moving outside the circle
					console.log("A negative discriminant! I don't know how this is possible!!", discriminant);
					return false;
				}
				var xA, yA, xB, yB;
				if(isVertical) {
					xA = x1;
					yA = (-bprim + Math.sqrt(discriminant)) / (2 * aprim);
					xB = x1;
					yB = (-bprim - Math.sqrt(discriminant)) / (2 * aprim);
				}
				else {
					xA = (-bprim + Math.sqrt(discriminant)) / (2 * aprim);
					yA = (m * xA + c);
					xB = (-bprim - Math.sqrt(discriminant)) / (2 * aprim);
					yB = (m * xB + c);
				}

				var err = 0.0005;
				var intersectionAWorks = (((x1 <= x2 && x1 - err < xA && xA < x2 + err) ||
					(x1 > x2 && x2 - err < xA && xA < x1 + err)) &&
					((y1 <= y2 && y1 - err < yA && yA < y2 + err) ||
					(y1 > y2 && y2 - err < yA && yA < y1 + err)));
				var intersectionBWorks = (((x1 <= x2 && x1 - err < xB && xB < x2 + err) ||
					(x1 > x2 && x2 - err < xB && xB < x1 + err)) &&
					((y1 <= y2 && y1 - err < yB && yB < y2 + err) ||
					(y1 > y2 && y2 - err < yB && yB < y1 + err)));
				var squareDistToIntersectionA = (xA - x2) * (xA - x2) + (yA - y2) * (yA - y2);
				var squareDistToIntersectionB = (xB - x2) * (xB - x2) + (yB - y2) * (yB - y2);
				if(intersectionAWorks && intersectionBWorks) {
					if(squareDistToIntersectionA < squareDistToIntersectionB) {
						intersection = { x: xA, y: yA };
						distToIntersection = Math.sqrt(squareDistToIntersectionA);
					}
					else {
						intersection = { x: xB, y: yB };
						distToIntersection = Math.sqrt(squareDistToIntersectionB);
					}
				}
				else if(intersectionAWorks) {
					intersection = { x: xA, y: yA };
						distToIntersection = Math.sqrt(squareDistToIntersectionA);
				}
				else if(intersectionBWorks) {
					intersection = { x: xB, y: yB };
						distToIntersection = Math.sqrt(squareDistToIntersectionB);
				}
				else {
					//the player's path never crossed the max tether range during its movement
					return false;
				}
			}
			else {
				return false;
			}
			//the player has definitely crossed path the max tether range, here's where we handle that
			var angle = Math.atan2(this.pos.y - intersection.y, this.pos.x - intersection.x); //from latch point to intersection
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			//rotate intersection point to be to the left of the grapple point
			var posRotated = {
				x: cos * (this._player.pos.x - this.pos.x) + sin * (this._player.pos.y - this.pos.y) + this.pos.x,
				y: -sin * (this._player.pos.x - this.pos.x) + cos * (intersection.y - this.pos.y) + this.pos.y
			};
			var velRotated = {
				x: cos * this._player.vel.x + sin * this._player.vel.y,
				y: -sin * this._player.vel.x + cos * this._player.vel.y
			};
			var totalVel = velRotated.y;
			var distXNotTraveled = intersection.x - this._player.pos.x;
			var distYNotTraveled = intersection.y - this._player.pos.y;
			var distNotTraveled = Math.sqrt(distXNotTraveled * distXNotTraveled + distYNotTraveled * distYNotTraveled);
			angle += (totalVel < 0 ? 1 : -1) * distNotTraveled / this.maxDist; //from latch point to pos after sliding
			cos = Math.cos(angle);
			sin = Math.sin(angle);
			var posAfterContact = {
				x: this.pos.x - cos * (this.maxDist - d),
				y: this.pos.y - sin * (this.maxDist - d)
			};
			angle = Math.atan2(this.pos.y - posAfterContact.y, this.pos.x - posAfterContact.x); //from latch point to pos after contact
			cos = Math.cos(angle);
			sin = Math.sin(angle);
			var velAfterContact = {
				x: -sin * totalVel,
				y: cos * totalVel
			};
			return {
				actor: this,
				posOnContact: intersection,
				posAfterContact: posAfterContact,
				velAfterContact: velAfterContact,
				distPreContact: distToIntersection
			};*/
		}
		return false;
	};
	GrappleEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.contactPoint;
		this.prevPos = collision.contactPoint;
		this.vel.zero();
		this.isLatched = true;
		this._latchLength = this.pos.clone().subtract(this._player.pos).length();
	};
	GrappleEntity.prototype.highlight = function() {
		this._highlightFrames = 3;
	};
	GrappleEntity.prototype.render = function(ctx, camera) {
		var color = (this._highlightFrames > 0 ? '#f00' : '#009');
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, 2, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this._player.pos.x - camera.x, this._player.pos.y - camera.y);
		ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
		ctx.stroke();
		if(this.isLatched) {
			ctx.strokeStyle = '#ccc';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this._latchLength, 0, 2 * Math.PI, false);
			ctx.stroke();
		}
	};
	return GrappleEntity;
});