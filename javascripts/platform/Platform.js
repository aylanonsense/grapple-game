define([
	'math/Vector',
	'platform/geometry/Line',
	'platform/geometry/Point'
], function(
	Vector,
	Line,
	Point
) {
	function Platform(params) {
		var x = params.x || 0, y = params.y || 0;

		//create point and line children
		this._geometry = [];
		var minX = params.points[0], maxX = params.points[0];
		var minY = params.points[1], maxY = params.points[1];
		for(var i = 0; i < params.points.length; i += 2) {
			//get points
			var x1 = x + params.points[i],
				y1 = y + params.points[i + 1],
				x2 = x + params.points[(i + 2) % params.points.length],
				y2 = y + params.points[(i + 3) % params.points.length],
				x3 = x + params.points[(i + 4) % params.points.length],
				y3 = y + params.points[(i + 5) % params.points.length];

			//create a line
			this._geometry.push(new Line({ x1: x1, y1: y1, x2: x2, y2: y2 }));
			var vector1 = new Vector(x2 - x1, y2 - y1),
				vector2 = new Vector(x3 - x2, y3 - y2);

			//only create a point if it's not superfluous
			if(vector1.unrotate(vector2.angle()).angle() < 0) {
				this._geometry.push(new Point({ x: x2, y: y2 }));
			}

			//record min/max x/y values
			if(x2 < minX) { minX = x2; }
			else if(maxX < x2) { maxX = x2; }
			if(y2 < minY) { minY = y2; }
			else if(maxY < y2) { maxY = y2; }
		}

		//create read-only position and some helper vectors
		this.pos = new Vector(typeof params.x === 'number' ? params.x : (minX + maxX) / 2,
			typeof params.y === 'number' ? params.y : (minY + maxY) / 2); //READ-ONLY!!
		this._vel = new Vector(0, 0);
		this._movement = new Vector(0, 0);
		this._waypoint = null;
	}
	Platform.prototype.moveTo = function(x, y, params) {
		if(arguments.length === 1) {
			y = x.y; x = x.x;
		}
		else if(arguments.length === 2 && typeof arguments[1] === 'object') {
			params = y; y = x.y; x = x.x;
		}
		params = params || {};

		this._waypoint = {
			pos: new Vector(x, y),
			immediate: !!params.immediate
		};
		if(!this._waypoint.immediate) {
			if(typeof params.time === 'number') {
				this._waypoint.speed = this.pos.distance(this._waypoint.pos) / params.time;
			}
			else if(typeof params.speed === 'number') {
				this._waypoint.speed = params.speed;
			}
			else {
				this._waypoint.speed = this._vel.length() || 100;
			}
		}
	};
	Platform.prototype.update = function(t) {
		if(this._waypoint) {
			//if it's an immediate waypoint, we move straight there without it counting as moving around
			if(this._waypoint.immediate) {
				this._vel.zero();
				this._movement.zero();
				this.pos.set(this._waypoint.pos);
				this._waypoint = null;
			}
			else {
				var lineOfMovement = this.pos.createVectorTo(this._waypoint.pos);
				this._vel.set(lineOfMovement).setLength(this._waypoint.speed);
				//the platform is close enough to the waypoint that it can just go straight there
				if(lineOfMovement.squareLength() <= this._waypoint.speed * t * this._waypoint.speed * t) {
					this._movement.set(lineOfMovement);
					this.pos.set(this._waypoint.pos);
					this._waypoint = null;
				}
				//otherwise we move it just a little bit towards the waypoint
				else {
					this._movement.set(this._vel).multiply(t);
					this.pos.add(this._movement);
				}
			}
		}
		//if there is no waypoint the platform doesn't move
		else {
			this._vel.zero();
			this._movement.zero();
		}

		//update children (not a traditional update(t) call)
		for(var i = 0; i < this._geometry.length; i++) {
			this._geometry[i].move(this._movement, this._vel);
		}
	};
	Platform.prototype.checkForCollisionsWithEntity = function(entity) {
		var collisions = [];
		for(var i = 0; i < this._geometry.length; i++) {
			var collision = this._geometry[i].checkForCollisionWithEntity(entity);
			if(collision) {
				collisions.push(collision);
			}
		}
		return collisions;
	};
	Platform.prototype.render = function() {
		for(var i = 0; i < this._geometry.length; i++) {
			this._geometry[i].render();
		}
	};
	return Platform;
});