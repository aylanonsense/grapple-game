define([
	'level/geometry/Line',
	'level/geometry/Point'
], function(
	Line,
	Point
) {
	function Level() {
		this._geometry = [];
	}
	Level.prototype.checkForCollisionWithMovingCircle = function(circle, bounceAmt) {
		return this._checkForCollision('checkForCollisionWithMovingCircle', circle, bounceAmt);
	};
	Level.prototype.checkForCollisionWithMovingPoint = function(point, bounceAmt) {
		return this._checkForCollision('checkForCollisionWithMovingPoint', point, bounceAmt);
	};
	Level.prototype._checkForCollision = function(methodName, entity, bounceAmt) {
		var earliestCollision = null;
		for(var i = 0; i < this._geometry.length; i++) {
			if((entity.entityType === 'Player' && this._geometry[i].collidesWithPlayer) ||
				(entity.entityType === 'Grapple' && this._geometry[i].collidesWithGrapple)) {
				var collision = this._geometry[i][methodName](entity, bounceAmt);
				if(collision && (earliestCollision === null ||
					collision.distTraveled < earliestCollision.distTraveled)) {
					earliestCollision = collision;
				}
			}
		}
		return earliestCollision;
	};
	Level.prototype.addLine = function(x1, y1, x2, y2, opts) {
		var point1 = this.addPoint(x1, y1, opts);
		var point2 = this.addPoint(x2, y2, opts);
		var line = new Line(point1.pos.x, point1.pos.y, point2.pos.x, point2.pos.y, opts);
		this._geometry.push(line);
		return line;
	};
	Level.prototype.addPoint = function(x, y, opts) {
		//find the point closest to where we're trying to add one
		var closestPoint = null;
		var distToClosestPoint = null;
		for(var i = 0; i < this._geometry.length; i++) {
			if(this._geometry[i].geomType === 'point') {
				var dist = this._geometry[i].pos.distance(x, y);
				if(distToClosestPoint === null || dist < distToClosestPoint) {
					closestPoint = this._geometry[i];
					distToClosestPoint = dist;
				}
			}
		}

		//don't create a new point if there's one really close to where we're trying to make one
		if(distToClosestPoint !== null && distToClosestPoint < 10) {
			return closestPoint;
		}

		//otherwise create a new point
		else {
			var point = new Point(x, y, opts);
			this._geometry.push(point);
			return point;
		}
	};
	Level.prototype.render = function(ctx, camera) {
		for(var i = 0; i < this._geometry.length; i++) {
			this._geometry[i].render(ctx, camera);
		}
	};
	return Level;
});