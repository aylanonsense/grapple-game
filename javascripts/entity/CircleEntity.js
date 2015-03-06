define([
	'math/Vector'
], function(
	Vector
) {
	function CircleEntity(x, y, radius) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.radius = radius;
		this._color = ['#a00','#0a0','#00a','#aa0','#a0a','#0aa'][Math.floor(6 * Math.random())];
	}
	CircleEntity.prototype.tick = function(t) {
		var newVel = new Vector(this.vel.x, this.vel.y + 80 * t).multiply(0.999);
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.average(newVel).multiply(t));
		this.vel = newVel;
	};
	CircleEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.finalPoint;
		this.prevPos = collision.contactPoint;
		this.vel = collision.finalVel;
	};
	CircleEntity.prototype.wrap = function(x, y) {
		this.pos.add(x, y);
		this.prevPos.add(x, y);
	};
	CircleEntity.prototype.render = function(ctx, camera) {
		ctx.fillStyle = this._color;
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, this.radius, 0, 2 * Math.PI, false);
		ctx.fill();
	};
	return CircleEntity;
});