if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Utils'
], function(
	Utils
) {
	var nextGrappleId = 0;
	var GRAPPLE_MOVE_SPEED = 99999;
	function Grapple(player, x, y, dirX, dirY) {
		this._grappleId = nextGrappleId++;
		this._player = player;
		var dir = Math.sqrt(dirX * dirX + dirY * dirY);
		this.pos = { x: x, y: y, prev: { x: x, y: y } };
		this.vel = { x: GRAPPLE_MOVE_SPEED * dirX / dir, y: GRAPPLE_MOVE_SPEED * dirY / dir };
		this.maxDist = null;
		this.isLatched = false;
		this.isDead = false;
		this._latchPoints = [];
		this._unwrapsAllowedThisFrame = true;
		this._unwrapPointsThisFrame = [];
		this._wrapAngleProhibited = null;
	}
	Grapple.prototype.sameAs = function(other) {
		return this._grappleId === other._grappleId;
	};
	Grapple.prototype.tick = function(ms, friction) {
		if(!this.isDead && !this.isLatched) {
			var t = ms / 1000;
			this.pos.prev.x = this.pos.x;
			this.pos.prev.y = this.pos.y;
			this.pos.x += this.vel.x * t;
			this.pos.y += this.vel.y * t;
		}
		this._unwrapsAllowedThisFrame = true;
		this._unwrapPointsThisFrame = [];
		this._wrapAngleProhibited = null;
	};
	Grapple.prototype.latchTo = function(x, y) { //or latchTo(point)
		var point = null;
		if(arguments.length === 1) {
			point = arguments[0];
			x = point.x;
			y = point.y;
		}
		var maxDist;
		var prevLatchPoint = this._latchPoints[this._latchPoints.length - 1];
		if(prevLatchPoint) {
			var distXToPrev = x - prevLatchPoint.x;
			var distYToPrev = y - prevLatchPoint.y;
			var distToPrev = Math.sqrt(distXToPrev * distXToPrev + distYToPrev * distYToPrev);
			maxDist = prevLatchPoint.maxDist - distToPrev;
		}
		else {
			var distXToParent = x - this._player.pos.x;
			var distYToParent = y - this._player.pos.y;
			maxDist = Math.sqrt(distXToParent * distXToParent + distYToParent * distYToParent);
		}
		var newLatchPoint = {
			x: x,
			y: y,
			maxDist: maxDist,
			point: point
		};
		this.pos.x = newLatchPoint.x;
		this.pos.y = newLatchPoint.y;
		this.pos.prev.x = newLatchPoint.x;
		this.pos.prev.y = newLatchPoint.y;
		this.maxDist = newLatchPoint.maxDist;
		this._latchPoints.push(newLatchPoint);
		this.isLatched = true;
	};
	Grapple.prototype.unlatch = function() {
		if(this.isLatched) {
			var prevLatch = this._latchPoints.splice(-1, 1)[0];
			var currentLatch = this._latchPoints[this._latchPoints.length - 1];
			if(!currentLatch) {
				this.isLatched = false;
				this.isDead = true;
			}
			else {
				this.pos.x = currentLatch.x;
				this.pos.y = currentLatch.y;
				this.pos.prev.x = currentLatch.x;
				this.pos.prev.y = currentLatch.y;
				this.maxDist = currentLatch.maxDist;
			}
		}
	};
	Grapple.prototype.render = function(ctx, camera) {
		if(!this.isDead) {
			ctx.strokeStyle = '#6c6';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(this._player.pos.x - camera.x, this._player.pos.y - camera.y);
			if(this.isLatched) {
				for(var i = this._latchPoints.length - 1; i >= 0; i--) {
					ctx.lineTo(this._latchPoints[i].x - camera.x, this._latchPoints[i].y - camera.y);
					ctx.moveTo(this._latchPoints[i].x - camera.x + 4, this._latchPoints[i].y - camera.y + 4);
					ctx.lineTo(this._latchPoints[i].x - camera.x - 4, this._latchPoints[i].y - camera.y + 4);
					ctx.lineTo(this._latchPoints[i].x - camera.x - 4, this._latchPoints[i].y - camera.y - 4);
					ctx.lineTo(this._latchPoints[i].x - camera.x + 4, this._latchPoints[i].y - camera.y - 4);
					ctx.lineTo(this._latchPoints[i].x - camera.x + 4, this._latchPoints[i].y - camera.y + 4);
					ctx.moveTo(this._latchPoints[i].x - camera.x, this._latchPoints[i].y - camera.y);
				}
			}
			else {
				ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
				ctx.moveTo(this.pos.x - camera.x + 4, this.pos.y - camera.y + 4);
				ctx.lineTo(this.pos.x - camera.x - 4, this.pos.y - camera.y + 4);
				ctx.lineTo(this.pos.x - camera.x - 4, this.pos.y - camera.y - 4);
				ctx.lineTo(this.pos.x - camera.x + 4, this.pos.y - camera.y - 4);
				ctx.lineTo(this.pos.x - camera.x + 4, this.pos.y - camera.y + 4);
			}
			ctx.stroke();

			//draw bounding circle made by the grapple
			if(this.isLatched) {
				ctx.strokeStyle = '#ddd';
				ctx.beginPath();
				ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.maxDist, 0, 2 * Math.PI, false);
				ctx.stroke();
			}
		}
	};
	Grapple.prototype.checkForMaxTether = function() {
		if(!this.isDead && this.isLatched) {
			var distXToPos = this._player.pos.x - this.pos.x;
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
				grapple: this,
				posOnContact: intersection,
				posAfterContact: posAfterContact,
				velAfterContact: velAfterContact,
				distPreContact: distToIntersection
			};
		}
		return false;
	};
	Grapple.prototype.checkForWrappingAroundPoints = function(points) {
		//if the grapple hasn't latched onto anything yet there's no way it's wrapping around points
		if(!this.isLatched || this.isDead) {
			return false;
		}

		//if the player isn't moving there's no way it could be wrapping grapples around points
		var lineOfParentMovement = Utils.toLine(
			this._player.pos.prev.x, this._player.pos.prev.y,
			this._player.pos.x, this._player.pos.y);
		if(!lineOfParentMovement) {
			return false;
		}

		//find the angle "swath" the player made as it moved about the grapple
		var lineToParent = Utils.toLine(this.pos.x, this.pos.y, this._player.pos.x, this._player.pos.y);
		var lineToPastParent = Utils.toLine(this.pos.x, this.pos.y, this._player.pos.prev.x, this._player.pos.prev.y);
		var angleToParent = Math.atan2(lineToParent.diff.y, lineToParent.diff.x);
		var angleToPastParent = Math.atan2(lineToPastParent.diff.y, lineToPastParent.diff.x);
		var angleClockwise = simplifyAngle(angleToParent - angleToPastParent);

		//for each point, check to see if the grapple just wrapped around it
		var intersection, lineParentTraveled;
		var wrapsThisFrame = [];
		for(var i = 0; i < points.length; i++) {
			//you can't unwrap something you just wrapped around
			if(!points[i].sameAsAny(this._unwrapPointsThisFrame)) {
				var lineToPoint = Utils.toLine(this.pos.x, this.pos.y, points[i].x, points[i].y);
				if(lineToPoint && lineToPoint.dist < lineToParent.dist) {
					//if the angle to the point is "between" the angle we started and ended at, we do some wrapping!
					var angleToPoint = Math.atan2(lineToPoint.diff.y, lineToPoint.diff.x);
					var angleClockwiseToPoint = simplifyAngle(angleToPoint - angleToPastParent);
					if(angleToPoint !== this._wrapAngleProhibited &&
						((angleClockwise >= 0 && angleClockwiseToPoint >= 0 && angleClockwise > angleClockwiseToPoint) ||
						(angleClockwise <= 0 && angleClockwiseToPoint <= 0 && angleClockwise < angleClockwiseToPoint))) {
						//so the wrapping DOES occur this frame, we just need to figure out where/when exactly
						intersection = Utils.findIntersection(lineOfParentMovement, lineToPoint);
						if(intersection) {
							lineParentTraveled = Utils.toLine(this._player.pos.prev.x, this._player.pos.prev.y, intersection.x, intersection.y);
							wrapsThisFrame.push({
								point: points[i],
								posOnContact: intersection,
								distPreContact: (lineParentTraveled ? lineParentTraveled.dist : 0),
								priority: (angleClockwiseToPoint < 0 ? -angleClockwiseToPoint : angleClockwiseToPoint),
								subpriority: -lineToPoint.dist,
								unwrap: false,
								angle: angleToPoint
							});
						}
					}
				}
			}
		}

		//we might want to unwrap the most recent latch
		if(this._latchPoints.length > 1 && this._unwrapsAllowedThisFrame) {
			var mostRecentLatch = this._latchPoints[this._latchPoints.length - 1];
			var prevLatch = this._latchPoints[this._latchPoints.length - 2];
			var lineBetweenPreviousLatches = Utils.toLine(prevLatch.x, prevLatch.y, mostRecentLatch.x, mostRecentLatch.y);
			if(this._player.vel.y === 0) {
				//debugger;
			}
			if(lineBetweenPreviousLatches) {
				var angleBetweenLatches = Math.atan2(lineBetweenPreviousLatches.diff.y, lineBetweenPreviousLatches.diff.x);
				var angleClockwiseBetweenLatches = simplifyAngle(angleBetweenLatches - angleToPastParent);
				if((angleClockwise >= 0 && angleClockwiseBetweenLatches >= 0 && angleClockwise > angleClockwiseBetweenLatches) ||
					(angleClockwise <= 0 && angleClockwiseBetweenLatches <= 0 && angleClockwise < angleClockwiseBetweenLatches)) {
					intersection = Utils.findIntersection(lineOfParentMovement, lineBetweenPreviousLatches);
					if(intersection) {
						lineParentTraveled = Utils.toLine(this._player.pos.prev.x, this._player.pos.prev.y, intersection.x, intersection.y);
						wrapsThisFrame.push({
							point: mostRecentLatch.point,
							posOnContact: intersection,
							distPreContact: (lineParentTraveled ? lineParentTraveled.dist : 0),
							priority: (angleClockwiseBetweenLatches < 0 ? -angleClockwiseBetweenLatches : angleClockwiseBetweenLatches),
							subpriority: -lineBetweenPreviousLatches.dist,
							unwrap: true,
							angle: angleBetweenLatches
						});
					}
				}
			}
		}

		//now we pick the wrap that happens earliest
		wrapsThisFrame.sort(function(a, b) {
			return (a.priority === b.priority ? a.subpriority - b.subpriority : a.priority - b.priority);
		});
		if(wrapsThisFrame.length > 0) {
			var self = this;
			var wrap = wrapsThisFrame[0];
			return {
				posOnContact: wrap.posOnContact,
				posAfterContact: {
					x: this._player.pos.x,
					y: this._player.pos.y
				},
				velAfterContact: {
					x: this._player.vel.x,
					y: this._player.vel.y
				},
				unwrap: wrap.unwrap,
				distPreContact: wrap.distPreContact,
				handle: (wrap.unwrap ? function() {
					//unwrap the grapple from its previous latch point
					self.unlatch();
					self._unwrapPointsThisFrame.push(wrap.point);
					self._wrapAngleProhibited = wrap.angle;
				} : function() {
					//wrap the grapple around the new latch point
					self.latchTo(wrap.point);
					self._unwrapsAllowedThisFrame = false;
				})
			};
		}
		return false;
	};
	Grapple.prototype.kill = function() {
		this.isDead = true;
	};
	function simplifyAngle(angle) {
		if(angle > Math.PI) {
			return angle - 2 * Math.PI;
		}
		else if(angle < -Math.PI) {
			return 2 * Math.PI + angle;
		}
		else {
			return angle;
		}
	}
	return Grapple;
});