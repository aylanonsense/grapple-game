if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Obstacle',
	'app/Utils'
], function(
	Obstacle,
	Utils
) {
	function Point(x, y) {
		Obstacle.apply(this, arguments);
		this.type = 'point';
		this.x = x;
		this.y = y;
		this._parentLines = [];
	}
	Point.prototype = Object.create(Obstacle.prototype);
	Point.prototype.addParent = function(line) {
		this._parentLines.push(line);
	};
	Point.prototype.isChildOf = function(line) {
		for(var i = 0; i < this._parentLines.length; i++) {
			if(this._parentLines[i].sameAs(line)) {
				return true;
			}
		}
		return false;
	};
	Point.prototype.checkForCollision = function(player) {
		var pos = { x: player.pos.x, y: player.pos.y };
		var vel = { x: player.vel.x, y: player.vel.y };
		var prev = { x: player.pos.prev.x, y: player.pos.prev.y };

		//find the player's position during collision
		var slope = (pos.y - prev.y) / (pos.x - prev.x); //can be Infinity
		var intersection = { x: null, y: null };
		if(slope === 0) {
			intersection.x = this.x;
			intersection.y = pos.y;
		}
		else if(slope === Infinity || slope === -Infinity) {
			intersection.x = pos.x;
			intersection.y = this.y;
		}
		else {
			var perpendicularSlope = -1 / slope;
			var perpendicularLineAt0 = this.y - (perpendicularSlope * this.x);
			intersection.x = (pos.y - pos.x * slope - perpendicularLineAt0) / (perpendicularSlope - slope);
			intersection.y = perpendicularSlope * intersection.x + perpendicularLineAt0;
		}

		//if the intersection point is too far from the player no matter where it is along the path... no way it'll collide
		var distFromIntersectionToPoint = Math.sqrt((intersection.x - this.x) * (intersection.x - this.x) + (intersection.y - this.y) * (intersection.y - this.y));
		if(distFromIntersectionToPoint > player.radius) {
			return false;
		}

		//move up the player's path to the collision point
		var distAlongCirclePath = (prev.y > pos.y ? -1 : 1) * Math.sqrt(player.radius * player.radius - distFromIntersectionToPoint * distFromIntersectionToPoint);
		var horizontalDistAlongCirclePath = (slope === Infinity || slope === -Infinity ? 0 : distAlongCirclePath / Math.sqrt(1 + slope * slope) * (slope <= 0 ? 1 : -1));
		var verticalDistAlongCirclePath = (slope === Infinity || slope === -Infinity ? -distAlongCirclePath : slope * horizontalDistAlongCirclePath);
		posOnHit = { x: intersection.x + horizontalDistAlongCirclePath, y: intersection.y + verticalDistAlongCirclePath };

		//calculate the angle from the point to the position on contact
		//rotate the player's velocity, zero out its velocity towards the point, then unrotate it
		var angleToPointOfContact = Math.atan2(posOnHit.y - this.y, posOnHit.x - this.x) + Math.PI / 2;
		var cosAngle = Math.cos(angleToPointOfContact);
		var sinAngle = Math.sin(angleToPointOfContact);
		var horizontalVelRelativeToPointOfContact = vel.x * cosAngle + vel.y * sinAngle;
		vel.x = horizontalVelRelativeToPointOfContact * cosAngle;
		vel.y = horizontalVelRelativeToPointOfContact * sinAngle;

		//determine if collision point is on the current path (have to account for a bit of error here, hence the 0.005)
		var c = 0.005;
		if(((prev.x <= pos.x && prev.x - c <= posOnHit.x && posOnHit.x <= pos.x + c) ||
			(prev.x > pos.x && pos.x - c <= posOnHit.x && posOnHit.x <= prev.x + c)) &&
			((prev.y <= pos.y && prev.y - c <= posOnHit.y && posOnHit.y <= pos.y + c) ||
			(prev.y > pos.y && pos.y - c <= posOnHit.y && posOnHit.y <= prev.y + c))) {
			//need to determine which collision happened first--we can do that by looking at how far it went before colliding
			var squareDistTraveledPreContact = (posOnHit.x - prev.x) * (posOnHit.x - prev.x) + (posOnHit.y - prev.y) * (posOnHit.y - prev.y);
			var squareDistTraveledInTotal = (pos.x - prev.x) * (pos.x - prev.x) + (pos.y - prev.y) * (pos.y - prev.y);
			var distTraveledPostContact = Math.sqrt(squareDistTraveledInTotal) - Math.sqrt(squareDistTraveledPreContact);

			//there was a collision!
			var jumpAngle = Utils.transformToJumpAngle(angleToPointOfContact - Math.PI / 2);
			return {
				obstacle: this,
				posOnContact: posOnHit,
				posAfterContact: {
					x: posOnHit.x + (vel.x > 0 ? 1 : -1) * Math.abs(distTraveledPostContact * -cosAngle),
					y: posOnHit.y + (vel.y > 0 ? 1 : -1) * Math.abs(distTraveledPostContact * -sinAngle) },
				velAfterContact: vel,
				jumpDir: { x: Math.cos(jumpAngle), y: Math.sin(jumpAngle) },
				distPreContact: Math.sqrt(squareDistTraveledPreContact),
				angleToPointOfContact: angleToPointOfContact
			};
		}
		return false;
	};
	return Point;
});