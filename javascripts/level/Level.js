define(function() {
	function Level() {
		this._geometry = [];
	}
	Level.prototype.addLine = function(line) {
		this._geometry.push(line);
	};
	Level.prototype.addPoint = function(point) {
		this._geometry.push(point);
	};
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
	Level.prototype.render = function(ctx, camera) {
		for(var i = 0; i < this._geometry.length; i++) {
			this._geometry[i].render(ctx, camera);
		}
	};
	return Level;
});