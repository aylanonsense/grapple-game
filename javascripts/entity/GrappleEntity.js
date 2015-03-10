define([
	'math/Vector'
], function(
	Vector
) {
	var MOVE_SPEED = 2000;
	function GrappleEntity(player, dirX, dirY) {
		this._player = player;
		this.pos = player.pos.clone();
		this.prevPos = this.pos.clone();
		this.vel = (new Vector(dirX, dirY)).normalize().multiply(MOVE_SPEED);
		this.hasCollided = false;
	}
	GrappleEntity.prototype.tick = function(t) {
		this.prevPos = this.pos.clone();
		this.pos.add(this.vel.clone().multiply(t));
	};
	GrappleEntity.prototype.handleCollision = function(collision) {
		this.pos = collision.contactPoint;
		this.prevPos = collision.contactPoint;
		this.vel.zero();
		this.hasCollided = true;
	};
	GrappleEntity.prototype.render = function(ctx, camera) {
		ctx.fillStyle = '#009';
		ctx.beginPath();
		ctx.arc(this.pos.x - camera.x, this.pos.y - camera.y, 2, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.strokeStyle = '#009';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this._player.pos.x - camera.x, this._player.pos.y - camera.y);
		ctx.lineTo(this.pos.x - camera.x, this.pos.y - camera.y);
		ctx.stroke();
	};
	return GrappleEntity;
});