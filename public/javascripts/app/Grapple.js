if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	var nextGrappleId = 0;
	var GRAPPLE_MOVE_SPEED = 1200;
	function Grapple(parent, x, y, dirX, dirY) {
		this._id = nextGrappleId++;
		this._parent = parent;
		var dir = Math.sqrt(dirX * dirX + dirY * dirY);
		this.pos = { x: x, y: y, prev: { x: x, y: y } };
		this.vel = { x: GRAPPLE_MOVE_SPEED * dirX / dir, y: GRAPPLE_MOVE_SPEED * dirY / dir };
		this.maxDist = null;
		this.isLatched = false;
		this.isDead = false;
	}
	Grapple.prototype.sameAs = function(other) {
		return this._id === other._id;
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
			if(distToPrev > this.maxDist) {
				//the parent started the frame beyond the max tether distance
				intersection = { x: this._parent.pos.prev.x, y: this._parent.pos.prev.y };
				distToIntersection = 0;
			}
			else if(distToPos > this.maxDist) {
				//the tether moved out of the max tether range during the frame
				var x1 = this._parent.pos.x;
				var x2 = this._parent.pos.prev.x;
				var y1 = this._parent.pos.y;
				var y2 = this._parent.pos.prev.y;
				var m = (y1 - y2) / (x1 - x2); //can be +/- Infinity
				if(m === Infinity || m === -Infinity) { console.log("TODO handle infinity slopes"); }
				var c = y1 - m * x1;
				var a = this.pos.x;
				var b = this.pos.y;
				var r = this.maxDist;

				var aprim = (m * m + 1);
				var bprim = 2 * (m * (c - b) - a);
				var cprim = (c - b) * (c - b) + a * a - r * r;

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
				var xA = (-bprim + Math.sqrt(discriminant)) / (2 * aprim);
				var yA = (m * xA + c);
				var xB = (-bprim - Math.sqrt(discriminant)) / (2 * aprim);
				var yB = (m * xB + c);

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
			var d = 0.0005;
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
	Grapple.prototype.kill = function() {
		this.isDead = true;
	};
	return Grapple;
});