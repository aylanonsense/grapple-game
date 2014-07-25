if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Obstacle',
	'app/GeometryUtils'
], function(
	Obstacle,
	GeometryUtils
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
		var jumpAngle = GeometryUtils.transformToJumpAngle(angle + Math.PI / 2);
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
	Line.prototype.checkForCollisionWithMovingCircle = function(circle) {
		var pos = this.rotatePoint(circle.pos);
		var vel = this.rotatePoint(circle.vel);
		var prev = this.rotatePoint(circle.pos.prev);
		var circlePosOnContact = {
			x: pos.x + (this.start.rotated.y - circle.radius - pos.y) / ((pos.y - prev.y) / (pos.x - prev.x)),
			y: this.start.rotated.y - circle.radius
		};
		var c = 0.005; //error +/-
		if(this.start.rotated.x >= circlePosOnContact.x && circlePosOnContact.x >= this.end.rotated.x &&
			((prev.x <= pos.x && prev.x - c <= circlePosOnContact.x && circlePosOnContact.x <= pos.x + c) ||
			(prev.x > pos.x && pos.x - c <= circlePosOnContact.x && circlePosOnContact.x <= prev.x + c)) &&
			(prev.y <= pos.y && prev.y - c <= circlePosOnContact.y && circlePosOnContact.y <= pos.y + c) &&
			pos.y > circlePosOnContact.y && pos.y > prev.y) {
			return {
				actor: this,
				posOnContact: this.unrotatePoint(circlePosOnContact),
				posAfterContact: this.unrotatePoint({ x: pos.x, y: circlePosOnContact.y }),
				velAfterContact: this.unrotatePoint({ x: vel.x, y: 0 }),
				distPreContact: Math.sqrt((circlePosOnContact.x - prev.x) * (circlePosOnContact.x - prev.x) +
								(circlePosOnContact.y - prev.y) * (circlePosOnContact.y - prev.y)),
				jumpDir: this.dirJump
			};
		}
		return false;
	};
	Line.prototype.checkForCollisionWithMovingPoint = function(point) {
		var pos = this.rotatePoint(point.pos);
		var vel = this.rotatePoint(point.vel);
		var prev = this.rotatePoint(point.pos.prev);
		var pointPosOnContact = {
			x: pos.x + (this.start.rotated.y - pos.y) / ((pos.y - prev.y) / (pos.x - prev.x)),
			y: this.start.rotated.y
		};
		var c = 0.005; //error +/-
		if(this.start.rotated.x >= pointPosOnContact.x && pointPosOnContact.x >= this.end.rotated.x &&
			((prev.x <= pos.x && prev.x - c <= pointPosOnContact.x && pointPosOnContact.x <= pos.x + c) ||
			(prev.x > pos.x && pos.x - c <= pointPosOnContact.x && pointPosOnContact.x <= prev.x + c)) &&
			(prev.y <= pos.y && prev.y - c <= pointPosOnContact.y && pointPosOnContact.y <= pos.y + c) &&
			pos.y > pointPosOnContact.y && pos.y > prev.y) {
			return {
				actor: this,
				posOnContact: this.unrotatePoint(pointPosOnContact),
				posAfterContact: this.unrotatePoint({ x: pos.x, y: pointPosOnContact.y }),
				velAfterContact: this.unrotatePoint({ x: vel.x, y: 0 }),
				distPreContact: Math.sqrt((pointPosOnContact.x - prev.x) * (pointPosOnContact.x - prev.x) +
								(pointPosOnContact.y - prev.y) * (pointPosOnContact.y - prev.y)),
				jumpDir: this.dirJump
			};
		}
		return false;
	};
	Line.prototype.render = function(ctx, camera) {
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this.start.x - camera.x, this.start.y - camera.y);
		ctx.lineTo(this.end.x - camera.x, this.end.y - camera.y);
		var pipAngle = Math.atan2((this.start.x - this.end.x), (this.end.y - this.start.y));
		ctx.moveTo((this.start.x + this.end.x) / 2 - camera.x, (this.start.y + this.end.y) / 2 - camera.y);
		ctx.lineTo((this.start.x + this.end.x) / 2 + 10 * Math.cos(pipAngle) - camera.x, (this.start.y + this.end.y) / 2 + 10 * Math.sin(pipAngle) - camera.y);
		ctx.stroke();
	};
	return Line;
});