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
		var earliestCollision = null;
		for(var i = 0; i < this._geometry.length; i++) {
			var collision = this._geometry[i].checkForCollisionWithMovingCircle(circle, bounceAmt);
			if(collision && (earliestCollision === null ||
				collision.distTraveled < earliestCollision.distTraveled)) {
				earliestCollision = collision;
			}
		}
		return earliestCollision;
	};
	Level.prototype.checkForCollisionWithMovingPoint = function(point, bounceAmt) {
		var earliestCollision = null;
		for(var i = 0; i < this._geometry.length; i++) {
			var collision = this._geometry[i].checkForCollisionWithMovingPoint(point, bounceAmt);
			if(collision && (earliestCollision === null ||
				collision.distTraveled < earliestCollision.distTraveled)) {
				earliestCollision = collision;
			}
		}
		return earliestCollision;
	};
	Level.prototype.addLine = function(x1, y1, x2, y2) {
		var point1 = this.addPoint(x1, y1);
		var point2 = this.addPoint(x2, y2);
		var line = new Line(point1.pos.x, point1.pos.y, point2.pos.x, point2.pos.y);
		this._geometry.push(line);
		return line;
	};
	Level.prototype.addPoint = function(x, y) {
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

		//if there's an existing point really close to where we're trying to add a point, just use that instead
		if(distToClosestPoint !== null && distToClosestPoint < 10) {
			return closestPoint;
		}

		//otherwise create a new point
		else {
			var point = new Point(x, y);
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