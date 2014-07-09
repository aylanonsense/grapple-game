if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	var GRAPPLE_MOVE_SPEED = 1200;
	function Grapple(parent, x, y, dirX, dirY) {
		this._parent = parent;
		var dir = Math.sqrt(dirX * dirX + dirY * dirY);
		this.pos = { x: x, y: y, prev: { x: x, y: y } };
		this.vel = { x: GRAPPLE_MOVE_SPEED * dirX / dir, y: GRAPPLE_MOVE_SPEED * dirY / dir };
		this.maxDist = null;
		this.isLatched = false;
		this.isDead = false;
	}
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
		var distX = this.pos.x - this._parent.x;
		var distY = this.pos.y - this._parent.y;
		this.maxDist = Math.sqrt(distX * distX + distY * distY);
		this.isLatched = true;
	};
	Grapple.prototype.render = function(ctx, camera) {
		ctx.strokeStyle = '#6c6';
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
	};
	Grapple.prototype.kill = function() {
		this.isDead = true;
	};
	return Grapple;
});