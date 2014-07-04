if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	function Grapple() {
		this.pos = { x: 0, y: 0, prev: { x: 0, y: 0 } };
		this.vel = { x: 0, y: 0 };
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
	return Grapple;
});