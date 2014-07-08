if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Obstacle',
	'app/Utils'
], function(
	Obstacle,
	Utils
) {
	function Line(x1, y1, x2, y2) {
		Obstacle.apply(this, arguments);
		this.type = 'line';
		var angle = Math.atan2(y2 - y1, x2 - x1);
		this._cos = Math.cos(angle);
		this._sin = Math.sin(angle);
		this.start = { x: x1, y: y1 };
		this.end = { x: x2, y: y2 };
		this.start.rotated = this.rotatePoint(this.start);
		this.end.rotated = this.rotatePoint(this.end);
		this.dirParallel = { x: this._cos, y: this._sin };
		this.dirPerpendicular = { x: this._sin, y: -this._cos };
		var jumpAngle = Utils.transformToJumpAngle(angle + Math.PI / 2);
		this.dirJump = { x: Math.cos(jumpAngle), y: Math.sin(jumpAngle) };
	}
	Line.prototype = Object.create(Obstacle.prototype);
	Line.prototype.rotatePoint = function(point) {
		return {
			x: point.x * -this._cos + point.y * -this._sin,
			y: point.x * this._sin + point.y * -this._cos
		};
	};
	Line.prototype.unrotatePoint = function(point) {
		return {
			x: point.x * -this._cos + point.y * this._sin,
			y: point.x * -this._sin + point.y * -this._cos
		};
	};
	Line.prototype.checkForCollision = function(player) {
		var pos = this.rotatePoint(player.pos);
		var vel = this.rotatePoint(player.vel);
		var prev = this.rotatePoint(player.pos.prev);
		var playerPosOnContact = {
			x: pos.x + (this.start.rotated.y - player.radius - pos.y) / ((pos.y - prev.y) / (pos.x - prev.x)),
			y: this.start.rotated.y - player.radius
		};
		var c = 0.005; //error +/-
		if(this.start.rotated.x >= playerPosOnContact.x && playerPosOnContact.x >= this.end.rotated.x &&
			((prev.x <= pos.x && prev.x - c <= playerPosOnContact.x && playerPosOnContact.x <= pos.x + c) ||
			(prev.x > pos.x && pos.x - c <= playerPosOnContact.x && playerPosOnContact.x <= prev.x + c)) &&
			(prev.y <= pos.y && prev.y - c <= playerPosOnContact.y && playerPosOnContact.y <= pos.y + c) &&
			pos.y > playerPosOnContact.y && pos.y > prev.y) {
			return {
				obstacle: this,
				posOnContact: this.unrotatePoint(playerPosOnContact),
				posAfterContact: this.unrotatePoint({ x: pos.x, y: playerPosOnContact.y }),
				velAfterContact: this.unrotatePoint({ x: vel.x, y: 0 }),
				distPreContact: Math.sqrt((playerPosOnContact.x - prev.x) * (playerPosOnContact.x - prev.x) +
								(playerPosOnContact.y - prev.y) * (playerPosOnContact.y - prev.y)),
				jumpDir: this.dirJump
			};
		}
		return false;
	};
	return Line;
});