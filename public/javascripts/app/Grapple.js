if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	var nextGrappleId = 0;
	var GRAPPLE_MOVE_SPEED = 1200;
	function Grapple(parent, x, y, dirX, dirY) {
		this._grappleId = nextGrappleId++;
		this._parent = parent;
		var dir = Math.sqrt(dirX * dirX + dirY * dirY);
		this.pos = { x: x, y: y, prev: { x: x, y: y } };
		this._originalLatch = null;
		this._originalMaxDist = null;
		this.vel = { x: GRAPPLE_MOVE_SPEED * dirX / dir, y: GRAPPLE_MOVE_SPEED * dirY / dir };
		this.maxDist = null;
		this.isLatched = false;
		this.isDead = false;
		this._wraps = [];
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
	};
	Grapple.prototype.latchTo = function(x, y) {
		this.pos.x = x;
		this.pos.y = y;
		this.pos.prev.x = x;
		this.pos.prev.y = y;
		var distX = this.pos.x - this._parent.pos.x;
		var distY = this.pos.y - this._parent.pos.y;
		this.maxDist = Math.sqrt(distX * distX + distY * distY);
		this.isLatched = true;
		this._originalLatch = { x: x, y: y };
		this._originalMaxDist = this.maxDist;
	};
	Grapple.prototype.render = function(ctx, camera) {
		if(!this.isDead) {
			var distX = this._parent.pos.x - this.pos.x;
			var distY = this._parent.pos.y - this.pos.y;
			var dist = Math.sqrt(distX * distX + distY * distY);
			ctx.strokeStyle = '#6c6';
			if(this.maxDist) {
				if(dist < 0.5 * this.maxDist) { ctx.strokeStyle = '#000'; }
				else if(dist < 0.6 * this.maxDist) { ctx.strokeStyle = '#040'; }
				else if(dist < 0.7 * this.maxDist) { ctx.strokeStyle = '#060'; }
				else if(dist < 0.8 * this.maxDist) { ctx.strokeStyle = '#282'; }
				else if(dist < 0.9 * this.maxDist) { ctx.strokeStyle = '#4a4'; }
				else if(dist <= 1.0 * this.maxDist) { ctx.strokeStyle = '#6c6'; }
				else { ctx.strokeStyle = '#f00'; }
			}
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this._parent.pos.x - camera.x, this._parent.pos.y - camera.y);
			ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
			ctx.moveTo(this.pos.x - camera.x + 4, this.pos.y - camera.y + 4);
			ctx.lineTo(this.pos.x - camera.x - 4, this.pos.y - camera.y + 4);
			ctx.lineTo(this.pos.x - camera.x - 4, this.pos.y - camera.y - 4);
			ctx.lineTo(this.pos.x - camera.x + 4, this.pos.y - camera.y - 4);
			ctx.lineTo(this.pos.x - camera.x + 4, this.pos.y - camera.y + 4);
			ctx.stroke();
			if(this.isLatched) {
				ctx.strokeStyle = '#ddd';
				ctx.beginPath();
				ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.maxDist, 0, 2 * Math.PI, false);
				ctx.stroke();
			}
			//draw wrappy bits
			if(this._wraps.length > 0) {
				ctx.strokeStyle = '#dc6';
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(this._originalLatch.x - camera.x, this._originalLatch.y - camera.y);
				ctx.lineTo(this._wraps[0].point.x - camera.x, this._wraps[0].point.y - camera.y);
				ctx.moveTo(this._originalLatch.x - camera.x + 4, this._originalLatch.y - camera.y + 4);
				ctx.lineTo(this._originalLatch.x - camera.x - 4, this._originalLatch.y - camera.y + 4);
				ctx.lineTo(this._originalLatch.x - camera.x - 4, this._originalLatch.y - camera.y - 4);
				ctx.lineTo(this._originalLatch.x - camera.x + 4, this._originalLatch.y - camera.y - 4);
				ctx.lineTo(this._originalLatch.x - camera.x + 4, this._originalLatch.y - camera.y + 4);
				for(var i = 1; i < this._wraps.length; i++) {
					ctx.moveTo(this._wraps[i].point.x - camera.x, this._wraps[i].point.y - camera.y);
					ctx.lineTo(this._wraps[i - 1].point.x - camera.x, this._wraps[i - 1].point.y - camera.y);
					ctx.moveTo(this._wraps[i - 1].point.x - camera.x + 4, this._wraps[i - 1].point.y - camera.y + 4);
					ctx.lineTo(this._wraps[i - 1].point.x - camera.x - 4, this._wraps[i - 1].point.y - camera.y + 4);
					ctx.lineTo(this._wraps[i - 1].point.x - camera.x - 4, this._wraps[i - 1].point.y - camera.y - 4);
					ctx.lineTo(this._wraps[i - 1].point.x - camera.x + 4, this._wraps[i - 1].point.y - camera.y - 4);
					ctx.lineTo(this._wraps[i - 1].point.x - camera.x + 4, this._wraps[i - 1].point.y - camera.y + 4);
				}
				ctx.stroke();
			}
		}
	};
	Grapple.prototype.checkForMaxTether = function() {
		if(!this.isDead && this.isLatched) {
			var distXToPos = this._parent.pos.x - this.pos.x;
			var distYToPos = this._parent.pos.y - this.pos.y;
			var distToPos = Math.sqrt(distXToPos * distXToPos + distYToPos * distYToPos);
			var distXToPrev = this._parent.pos.prev.x - this.pos.x;
			var distYToPrev = this._parent.pos.prev.y - this.pos.y;
			var distToPrev = Math.sqrt(distXToPrev * distXToPrev + distYToPrev * distYToPrev);
			var intersection, distToIntersection;
			var d = 0.0005;
			if(distToPrev > this.maxDist) {
				//the parent started the frame beyond the max tether distance
				var angle2 = Math.atan2(this.pos.y - this._parent.pos.prev.y, this.pos.x - this._parent.pos.prev.x); //from latch point to intersection
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
				var x1 = this._parent.pos.x;
				var x2 = this._parent.pos.prev.x;
				var y1 = this._parent.pos.y;
				var y2 = this._parent.pos.prev.y;
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
					//the parent's path never crossed the max tether range during its movement
					return false;
				}
			}
			else {
				return false;
			}
			//the parent has definitely crossed path the max tether range, here's where we handle that
			var angle = Math.atan2(this.pos.y - intersection.y, this.pos.x - intersection.x); //from latch point to intersection
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			//rotate intersection point to be to the left of the grapple point
			var posRotated = {
				x: cos * (this._parent.pos.x - this.pos.x) + sin * (this._parent.pos.y - this.pos.y) + this.pos.x,
				y: -sin * (this._parent.pos.x - this.pos.x) + cos * (intersection.y - this.pos.y) + this.pos.y
			};
			var velRotated = {
				x: cos * this._parent.vel.x + sin * this._parent.vel.y,
				y: -sin * this._parent.vel.x + cos * this._parent.vel.y
			};
			var totalVel = velRotated.y;
			var distXNotTraveled = intersection.x - this._parent.pos.x;
			var distYNotTraveled = intersection.y - this._parent.pos.y;
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
	Grapple.prototype.checkForWraps = function(points) {
		if(this.isLatched && !this.isDead) {
			//movement of parent
			var slopeOfParentMovement = (this._parent.pos.y - this._parent.pos.prev.y) / (this._parent.pos.x - this._parent.pos.prev.x); //can be Infinity or -Infinity or NaN
			var at0OfParentMovement = this._parent.pos.y - slopeOfParentMovement * this._parent.pos.x;
			if(isNaN(slopeOfParentMovement)) {
				//parent isn't moving--don't bother checking for wraps
				return false;
			}

			//actual wrapping code
			var i;
			var wraps = [];
			var distXToPos = this._parent.pos.x - this.pos.x;
			var distYToPos = this._parent.pos.y - this.pos.y;
			var distToPos = Math.sqrt(distXToPos * distXToPos + distYToPos * distYToPos);
			var angleToPos = Math.atan2(distYToPos, distXToPos);
			var angleToPastPos = Math.atan2(this._parent.pos.prev.y - this.pos.y, this._parent.pos.prev.x - this.pos.x);
			var angleAroundClockwise = angleToPos - angleToPastPos;
			if(angleAroundClockwise > Math.PI) {
				angleAroundClockwise = angleAroundClockwise - 2 * Math.PI;
			}
			else if(angleAroundClockwise < -Math.PI) {
				angleAroundClockwise = 2 * Math.PI + angleAroundClockwise;
			}
			for(i = 0; i < points.length; i++) {
				var distXToPoint = points[i].x - this.pos.x;
				var distYToPoint = points[i].y - this.pos.y;
				var distToPoint = Math.sqrt(distXToPoint * distXToPoint + distYToPoint * distYToPoint);
				if(0 < distToPoint && distToPoint < distToPos) {
					var angleToPoint = Math.atan2(distYToPoint, distXToPoint);
					var angleAroundClockwiseToPoint = angleToPoint - angleToPastPos;
					if(angleAroundClockwiseToPoint > Math.PI) {
						angleAroundClockwiseToPoint = angleAroundClockwiseToPoint - 2 * Math.PI;
					}
					else if(angleAroundClockwiseToPoint < -Math.PI) {
						angleAroundClockwiseToPoint = 2 * Math.PI + angleAroundClockwiseToPoint;
					}
					//if the point is along the swath made by the parent, the grapple should wrap or unwrap around the point
					if((angleAroundClockwise > 0 && angleAroundClockwiseToPoint > 0 && angleAroundClockwise > angleAroundClockwiseToPoint) ||
						(angleAroundClockwise < 0 && angleAroundClockwiseToPoint < 0 && angleAroundClockwise < angleAroundClockwiseToPoint)) {
						//we need to determine where the parent is at the point of wrapping
						var slopeToPoint = distYToPoint / distXToPoint; //can be Infinity or -Infinity or NaN
						var at0ToPoint = this.pos.y - slopeToPoint * this.pos.x;
						var intersectionY;
						var intersectionX;
						var canWrapAroundPoint = true;
						var typeyThing = '-';
						if(slopeOfParentMovement === Infinity || slopeOfParentMovement === -Infinity) {
							if(slopeToPoint === Infinity || slopeToPoint === -Infinity) {
								canWrapAroundPoint = false;
								typeyThing = 'both vertical';
							}
							else {
								intersectionX = this._parent.pos.x;
								intersectionY = (intersectionY - at0ToPoint) / slopeToPoint;
								typeyThing = 'movement vertical';
							}
						}
						else if(slopeOfParentMovement === 0) {
							intersectionX = points[i].x;
							intersectionY = (intersectionY - at0OfParentMovement) / slopeOfParentMovement;
							typeyThing = 'movement horizontal';
						}
						else {
							if(slopeToPoint === Infinity || slopeToPoint === -Infinity) {
								intersectionX = points[i].x;
								intersectionY = slopeOfParentMovement * intersectionX + at0OfParentMovement;
								typeyThing = 'point vertical';
							}
							else if(slopeToPoint === 0) {
								intersectionY = points[i].y;
								intersectionX = (intersectionY - at0OfParentMovement) / slopeOfParentMovement;
								typeyThing = 'point horizontal';
							}
							else {
								intersectionX = (at0ToPoint - at0OfParentMovement) / (slopeOfParentMovement - slopeToPoint);
								intersectionY = slopeToPoint * intersectionX + at0ToPoint;
								typeyThing = 'none vertical';
							}
						}
						if(canWrapAroundPoint) {
							var distXTraveled = intersectionX - this._parent.pos.prev.x;
							var distYTraveled = intersectionY - this._parent.pos.prev.y;
							var distTraveled = Math.sqrt(distXTraveled * distXTraveled + distYTraveled * distYTraveled);
							wraps.push({
								point: points[i],
								priority: (angleAroundClockwiseToPoint < 0 ? -angleAroundClockwiseToPoint : angleAroundClockwiseToPoint),
								priority2: -distToPoint,
								intersection: {
									x: intersectionX,
									y: intersectionY
								},
								angle: angleToPoint,
								distTraveled: distTraveled,
								thing: typeyThing,
								unwrap: false
							});
						}
					}
				}
			}
			if(this._wraps.length > 0) {
				var potentialUnwrap = this._hypotheticallyUnwrapLastWrappedPoint(slopeOfParentMovement, at0OfParentMovement, angleToPastPos, angleAroundClockwise);
				if(potentialUnwrap) {
					wraps.push(potentialUnwrap);
				}
			}
			wraps.sort(function(a, b) {
				return (a.priority === b.priority ? a.priority2 - b.priority2 : a.priority - b.priority);
			});
			if(wraps.length > 0) {
				var self = this;
				return {
					posOnContact: wraps[0].intersection,
					posAfterContact: {
						x: this._parent.pos.x,
						y: this._parent.pos.y
					},
					velAfterContact: {
						x: this._parent.vel.x,
						y: this._parent.vel.y
					},
					distPreContact: wraps[0].distTraveled,
					handle: function() {
						if(wraps[0].unwrap) {
							//unwrap
							self._wraps.splice(-1, 1);
							if(self._wraps.length > 0) {
								self.pos.x = self._wraps[self._wraps.length - 1].point.x;
								self.pos.y = self._wraps[self._wraps.length - 1].point.y;
								self.maxDist = self._wraps[self._wraps.length - 1].dist;
							}
							else {
								self.pos.x = self._originalLatch.x;
								self.pos.y = self._originalLatch.y;
								self.maxDist = self._originalMaxDist;
							}
						}
						else {
							//wrap
							var distXToNewLatch = wraps[0].point.x - self.pos.x;
							var distYToNewLatch = wraps[0].point.y - self.pos.y;
							var distToNewLatch = Math.sqrt(distXToNewLatch * distXToNewLatch + distYToNewLatch * distYToNewLatch);
							self.pos.x = wraps[0].point.x;
							self.pos.y = wraps[0].point.y;
							self.maxDist -= distToNewLatch;
							self._wraps.push({
								point: wraps[0].point,
								dist: self.maxDist,
								angle: wraps[0].angle
							});
						}
					},
					thing: wraps[0].thing	
				};
			}
			/*for(i = 0; i < wraps.length; i++) {
				var distXToNewLatch = wraps[i].point.x - this.pos.x;
				var distYToNewLatch = wraps[i].point.y - this.pos.y;
				var distToNewLatch = Math.sqrt(distXToNewLatch * distXToNewLatch + distYToNewLatch * distYToNewLatch);
				this.pos.x = wraps[i].point.x;
				this.pos.y = wraps[i].point.y;
				this.maxDist -= distToNewLatch;
			}*/
		}
		return false;
	};
	Grapple.prototype._hypotheticallyUnwrapLastWrappedPoint = function(slopeOfParentMovement, at0OfParentMovement, angleToPastPos, angleAroundClockwise) {
		var thingToUnwrap = this._wraps[this._wraps.length - 1];
		var distXToPoint = thingToUnwrap.point.x - this.pos.x;
		var distYToPoint = thingToUnwrap.point.y - this.pos.y;
		var distToPoint = Math.sqrt(distXToPoint * distXToPoint + distYToPoint * distYToPoint);
		var angleToPoint = thingToUnwrap.angle;
		var angleAroundClockwiseToPoint = angleToPoint - angleToPastPos;
		if(angleAroundClockwiseToPoint > Math.PI) {
			angleAroundClockwiseToPoint = angleAroundClockwiseToPoint - 2 * Math.PI;
		}
		else if(angleAroundClockwiseToPoint < -Math.PI) {
			angleAroundClockwiseToPoint = 2 * Math.PI + angleAroundClockwiseToPoint;
		}
		//if the point is along the swath made by the parent, the grapple should unwrap the point
		if((angleAroundClockwise > 0 && angleAroundClockwiseToPoint > 0 && angleAroundClockwise > angleAroundClockwiseToPoint) ||
			(angleAroundClockwise < 0 && angleAroundClockwiseToPoint < 0 && angleAroundClockwise < angleAroundClockwiseToPoint)) {
			//copied from above
			var slopeToPoint = distYToPoint / distXToPoint; //can be Infinity or -Infinity or NaN
			var at0ToPoint = this.pos.y - slopeToPoint * this.pos.x;
			var intersectionY;
			var intersectionX;
			var canUnwrapAroundPoint = true;
			var typeyThing = '-';
			if(slopeOfParentMovement === Infinity || slopeOfParentMovement === -Infinity) {
				if(slopeToPoint === Infinity || slopeToPoint === -Infinity) {
					canUnwrapAroundPoint = false;
					typeyThing = 'both vertical';
				}
				else {
					intersectionX = this._parent.pos.x;
					intersectionY = (intersectionY - at0ToPoint) / slopeToPoint;
					typeyThing = 'movement vertical';
				}
			}
			else if(slopeOfParentMovement === 0) {
				intersectionX = thingToUnwrap.point.x;
				intersectionY = (intersectionY - at0OfParentMovement) / slopeOfParentMovement;
				typeyThing = 'movement horizontal';
			}
			else {
				if(slopeToPoint === Infinity || slopeToPoint === -Infinity) {
					intersectionX = thingToUnwrap.point.x;
					intersectionY = slopeOfParentMovement * intersectionX + at0OfParentMovement;
					typeyThing = 'point vertical';
				}
				else if(slopeToPoint === 0) {
					intersectionY = thingToUnwrap.point.y;
					intersectionX = (intersectionY - at0OfParentMovement) / slopeOfParentMovement;
					typeyThing = 'point horizontal';
				}
				else {
					intersectionX = (at0ToPoint - at0OfParentMovement) / (slopeOfParentMovement - slopeToPoint);
					intersectionY = slopeToPoint * intersectionX + at0ToPoint;
					typeyThing = 'none vertical';
				}
			}
			if(canUnwrapAroundPoint) {
				var distXTraveled = intersectionX - this._parent.pos.prev.x;
				var distYTraveled = intersectionY - this._parent.pos.prev.y;
				var distTraveled = Math.sqrt(distXTraveled * distXTraveled + distYTraveled * distYTraveled);
				return {
					point: thingToUnwrap.point,
					priority: (angleAroundClockwiseToPoint < 0 ? -angleAroundClockwiseToPoint : angleAroundClockwiseToPoint),
					priority2: -distToPoint,
					intersection: {
						x: intersectionX,
						y: intersectionY
					},
					angle: angleToPoint,
					distTraveled: distTraveled,
					thing: typeyThing,
					unwrap: true
				};
			}
		}
		return false;
	};
	Grapple.prototype.kill = function() {
		this.isDead = true;
	};
	return Grapple;
});