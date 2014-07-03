if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery'
], function(
	$
) {
	return function() {
		//set up canvas
		var width = 800, height = 600;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		//create circle (the player)
		var circle = {
			x: 1000,
			y: 1000,
			r: 20,
			vel: { x: 0, y: 0 },
			_prev: { x: width / 2, y: height / 4 },
			_force: { x: 0, y: 0 },
			_instantForce: { x: 0, y: 0 },
			_activeCollision: null,
			_wantsToJump: false,
			applyForce: function(forceX, forceY) {
				if(arguments.length === 3) {
					var force = arguments[0];
					var dirX = arguments[1];
					var dirY = arguments[2];
					var dir = Math.sqrt(dirX * dirX + dirY * dirY);
					forceX = force * dirX / dir;
					forceY = force * dirY / dir;
				}
				this._force.x += forceX;
				this._force.y += forceY;
			},
			applyInstantaneousForce: function(forceX, forceY) {
				if(arguments.length === 3) {
					var force = arguments[0];
					var dirX = arguments[1];
					var dirY = arguments[2];
					var dir = Math.sqrt(dirX * dirX + dirY * dirY);
					forceX = force * dirX / dir;
					forceY = force * dirY / dir;
				}
				this._instantForce.x += forceX;
				this._instantForce.y += forceY;
			},
			tick: function(ms, friction) {
				var t = ms / 1000;
				var oldVel = { x: this.vel.x, y: this.vel.y };
				this.vel.x += this._force.x * t + this._instantForce.x / 60;
				this.vel.y += this._force.y * t + this._instantForce.y / 60;
				this._force.x = 0;
				this._force.y = 0;
				this._instantForce.x = 0;
				this._instantForce.y = 0;
				this.vel.x *= friction;
				this.vel.y *= friction;
				this._prev.x = this.x;
				this._prev.y = this.y;
				this.x += (this.vel.x + oldVel.x * friction) / 2 * t;
				this.y += (this.vel.y + oldVel.y * friction) / 2 * t;
				return oldVel;
			}
		};

		//create camera
		var camera = {
			x: circle.x,
			y: circle.y
		};


		//WASD to move the circle
		var allowedToJump = true;
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, R: 82, SHIFT: 16, SPACE: 32, G: 71 };
		var BREAK_GRAPPLE_KEY = KEY_MAP.SPACE;
		var JUMP_KEY = KEY_MAP.SPACE;
		var PULL_GRAPPLE_KEY = KEY_MAP.G;
		var GRAPPLE_PULL_SPEED = 700;
		var GRAPPLE_PULL_FORCE = 3000;
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
				if(evt.which === JUMP_KEY) {
					if(allowedToJump) {
						circle._wantsToJump = true;
						allowedToJump = false;
					}
				}
				if(evt.which === BREAK_GRAPPLE_KEY) {
					for(var i = 0; i < grapples.length; i++) {
						grapples[i].dead = true;
					}
				}
			}
		});
		$(document).on('keyup', function(evt) {
			keys[evt.which] = false;
			if(evt.which === JUMP_KEY) {
				circle._wantsToJump = false;
				allowedToJump = true;
			}
		});

		//click the canvas to create new grapples
		var grapples = [];
		var obstacles = [];
		var mouse = { x: 0, y: 0 };
		$(document).on('mousedown', function(evt) {
			shootGrapple(circle.x, circle.y, evt.clientX + camera.x, evt.clientY + camera.y);
		});
		$(document).on('mouseup', function(evt) {});
		$(document).on('mousemove', function(evt) {
			mouse.x = evt.clientX + camera.x;
			mouse.y = evt.clientY + camera.y;
		});
		var nextObstacleId = 0;
		var nextGrappleId = 0;
		function shootGrapple(fromX, fromY, toX, toY) {
			var distX = toX - fromX;
			var distY = toY - fromY;
			var dist = Math.sqrt(distX * distX + distY * distY);
			var vect = { x: 0, y: -1 };
			if(dist > 0) {
				vect.x = distX / dist;
				vect.y = distY / dist;
			}
			grapples.push({
				id: nextGrappleId,
				x: fromX,
				y: fromY,
				_prev: { x: fromX, y: fromY },
				dist: null,
				vel: { x: 1500 * vect.x, y: 1500 * vect.y },
				_collided: false,
				dead: false,
				tick: function(ms, friction) {
					var t = ms / 1000;
					if(!this._collided && !this.dead) {
						this._prev.x = this.x;
						this._prev.y = this.y;
						this.x += this.vel.x * t;
						this.y += this.vel.y * t;
					}
				}
			});
		}

		function transformAngle(angle) {
			var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
			if(distFromTop > Math.PI) {
				distFromTop = distFromTop - 2 * Math.PI;
			}
			var squareDistFromTop = distFromTop * distFromTop;
			var const1 = -0.9;
			var const2 = -const1 / Math.PI;
			return angle + const1 * distFromTop + const2 * (distFromTop > 0 ? 1 : -1) * squareDistFromTop;
		}

		function createLine(x1, y1, x2, y2, createPoints) {
			var angle = Math.atan2(y2 - y1, x2 - x1);
			var cosAngle = Math.cos(angle);
			var sinAngle = Math.sin(angle);
			var jumpAngle = transformAngle(angle + Math.PI * 1 / 2);
			var cosJumpAngle = Math.cos(jumpAngle);
			var sinJumpAngle = Math.sin(jumpAngle);
			var line = {
				id: nextObstacleId++,
				type: 'line',
				start: {
					x: x1,
					y: y1,
					rotated: {
						x: x1 * -cosAngle + y1 * -sinAngle,
						y: x1 * sinAngle + y1 * -cosAngle
					}
				},
				end: {
					x: x2,
					y: y2,
					rotated: {
						x: x2 * -cosAngle + y2 * -sinAngle,
						y: x2 * sinAngle + y2 * -cosAngle
					}
				},
				perpendicular: {
					x: sinAngle,
					y: -cosAngle
				},
				jump: {
					x: -cosJumpAngle,
					y: -sinJumpAngle
				},
				angle: angle,
				rotate: function(pos) {
					return {
						x: pos.x * -cosAngle + pos.y * -sinAngle,
						y: pos.x * sinAngle + pos.y * -cosAngle
					};
				},
				unrotate: function(pos) {
					return {
						x: pos.x * -cosAngle + pos.y * sinAngle,
						y: pos.x * -sinAngle + pos.y * -cosAngle
					};
				}
			};
			obstacles.push(line);
			if(createPoints !== false) {
				createPoint(x1, y1 [ line ]);
				createPoint(x2, y2 [ line ]);
			}
			return line;
		}
		function createPoint(x, y, parents) {
			var point = {
				id: nextObstacleId++,
				type: 'point',
				x: x,
				y: y,
				parentIds: (parents || []).map(function(p) { return p.id; })
			};
			obstacles.push(point);
			return point;
		}
		function createPoly(points, reverse) {
			var i, lines = [];
			if(reverse) {
				var reversedPoints = [];
				for(i = 0; i < points.length; i += 2) {
					reversedPoints[i] = points[points.length - i - 2];
					reversedPoints[i+1] = points[points.length - i - 1];
				}
				points = reversedPoints;
			}
			for(i = 0; i < points.length - 2; i += 2) {
				lines.push(createLine(points[i], points[i + 1], points[i + 2], points[i + 3], false));
			}
			lines.push(createLine(points[points.length - 2], points[points.length - 1], points[0], points[1], false));
			for(i = 0; i < lines.length - 1; i++) {
				createPoint(lines[i].end.x, lines[i].end.y, [ lines[i], lines[i + 1] ]);
			}
			createPoint(lines[0].start.x, lines[0].start.y, [ lines[0], lines[lines.length - 1] ]);
		}

		//create starting lines
		createPoly([900,1100,  1100,1100, 1100,1110,  900,1110],  true); //first platform
		createPoly([600,1210,  600,1220,  710,1220,   710,1210]); //left platform
		createPoly([1300,900,  1400,1000, 1300,1000], true); //right triangle
		createPoly([1500,900,  1510,900,  1510,600,   1500,600]); //right wall lefter
		createPoly([1600,860,  1590,860,  1590,600,   1600,600], true); //right wall righter
		createPoly([980,1220,  900,1180,  900,1170,   1100,1170, 1100,1180, 1020,1220], true); //pedestal
		createPoly([200,1510,  200,1500,  2000,1500,  2000,1510],  true); //ground

		function drawGrapple(x1, y1, x2, y2, color, thickness) {
			ctx.strokeStyle = color || '#6c6';
			ctx.lineWidth = thickness || 1;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.moveTo(x2 + 3, y2 + 3);
			ctx.lineTo(x2 - 3, y2 + 3);
			ctx.lineTo(x2 - 3, y2 - 3);
			ctx.lineTo(x2 + 3, y2 - 3);
			ctx.lineTo(x2 + 3, y2 + 3);
			ctx.stroke();
		}
		function drawLine(x1, y1, x2, y2, color, thickness) {
			ctx.strokeStyle = color || '#000';
			ctx.lineWidth = thickness || 1;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			var pipAngle = Math.atan2((x1 - x2), (y2 - y1));
			ctx.moveTo((x1 + x2) / 2, (y1 + y2) / 2);
			ctx.lineTo((x1 + x2) / 2 + 10 * Math.cos(pipAngle),
				(y1 + y2) / 2 + 10 * Math.sin(pipAngle));
			ctx.stroke();
		}
		function drawPoint(x, y, color, thickness) {
			ctx.fillStyle = color || '#000';
			ctx.beginPath();
			ctx.arc(x, y, (thickness || 3) / 2, 0, 2 * Math.PI, false);
			ctx.fill();
		}

		function checkForCollisionWithPoint(circle, point) {
			var vel = { x: circle.vel.x, y: circle.vel.y };
			var prev = { x: circle._prev.x, y: circle._prev.y };
			var mult = (prev.y > circle.y ? -1 : 1);

			//the point of contact is just the point itself
			var contactPoint = { x: point.x, y: point.y };

			//slope of circle's path
			var slope = (circle.y - prev.y) / (circle.x - prev.x); //can be Infinity
			var intersection = { x: null, y: null };
			if(slope === 0) {
				//if the circle is moving horizontally, this calculation is easier
				intersection.x = point.x;
				intersection.y = circle.y;
			}
			else if(slope === Infinity || slope === -Infinity) {
				//if the circle is moving vertically, this calculation is also easier
				intersection.x = circle.x;
				intersection.y = point.y;
			}
			else {
				var perpendicularSlope = -1 / slope;
				var perpendicularLineAt0 = contactPoint.y - (perpendicularSlope * contactPoint.x);

				//find intersection of the circle's path and the extension perpendicular to it from the point
				intersection.x = (circle.y - circle.x * slope - perpendicularLineAt0) / (perpendicularSlope - slope);
				intersection.y = perpendicularSlope * intersection.x + perpendicularLineAt0;
			}

			//if the intersection point is too far from the circle no matter where it is along the path... no way it'll collide
			var distFromIntersectionToPoint = Math.sqrt((intersection.x - contactPoint.x) * (intersection.x - contactPoint.x) + (intersection.y - contactPoint.y) * (intersection.y - contactPoint.y));
			if(distFromIntersectionToPoint > circle.r) {
				return false;
			}

			//move up the circle's path to the collision point
			var distAlongCirclePath = mult * Math.sqrt(circle.r * circle.r - distFromIntersectionToPoint * distFromIntersectionToPoint);
			var horizontalDistAlongCirclePath = (slope === Infinity || slope === -Infinity ? 0 : distAlongCirclePath / Math.sqrt(1 + slope * slope) * (slope <= 0 ? 1 : -1));
			var verticalDistAlongCirclePath = (slope === Infinity || slope === -Infinity ? -distAlongCirclePath : slope * horizontalDistAlongCirclePath);
			posOnHit = { x: intersection.x + horizontalDistAlongCirclePath, y: intersection.y + verticalDistAlongCirclePath };

			//calculate the angle from the point to the position on contact
			//rotate the circle's velocity, zero out its velocity towards the point, then unrotate it
			var angleToPointOfContact = mult * -Math.PI - Math.atan2(contactPoint.x - posOnHit.x, contactPoint.y - posOnHit.y);
			var cosAngle = Math.cos(angleToPointOfContact);
			var sinAngle = Math.sin(angleToPointOfContact);
			var horizontalVelRelativeToPointOfContact = vel.x * -cosAngle + vel.y * -sinAngle;
			vel.x = horizontalVelRelativeToPointOfContact * -cosAngle;
			vel.y = horizontalVelRelativeToPointOfContact * -sinAngle;

			//determine if collision point is on the current path (have to account for a bit of error here, hence the 0.005)
			if(((prev.x <= circle.x && prev.x - 0.005 <= posOnHit.x && posOnHit.x <= circle.x + 0.005) ||
				(prev.x > circle.x && circle.x - 0.005 <= posOnHit.x && posOnHit.x <= prev.x + 0.005)) &&
				((prev.y <= circle.y && prev.y - 0.005 <= posOnHit.y && posOnHit.y <= circle.y + 0.005) ||
				(prev.y > circle.y && circle.y - 0.005 <= posOnHit.y && posOnHit.y <= prev.y + 0.005))) {
				//need to determine which collision happened first--we can do that by looking at how far it went before colliding
				var squareDistTraveledPreContact = (posOnHit.x - prev.x) * (posOnHit.x - prev.x) + (posOnHit.y - prev.y) * (posOnHit.y - prev.y);
				var squareDistTraveledInTotal = (circle.x - prev.x) * (circle.x - prev.x) + (circle.y - prev.y) * (circle.y - prev.y);
				var distTraveledPostContact = Math.sqrt(squareDistTraveledInTotal) - Math.sqrt(squareDistTraveledPreContact);

				//there was a collision!
				return {
					obstacle: point,
					pointOfContact: contactPoint, //unused
					posDuringContact: posOnHit,
					posAfterContact: {
						x: posOnHit.x + (vel.x > 0 ? 1 : -1) * Math.abs(distTraveledPostContact * -cosAngle),
						y: posOnHit.y + (vel.y > 0 ? 1 : -1) * Math.abs(distTraveledPostContact * -sinAngle) },
					velAfterContact: vel,
					squareDistTraveledPreContact: squareDistTraveledPreContact,
					angleToPointOfContact: angleToPointOfContact
				};
			}
			return false;
		}

		function checkForCollisionWithLine(circle, line) {
			//transform circle to rotated coordinates
			var pos = line.rotate(circle);
			var vel = line.rotate(circle.vel);
			var prev = line.rotate(circle._prev);

			//circle can only collide if it's headed toward the line
			if(pos.y > prev.y) {
				//slope of circle's path
				var slope = (pos.y - prev.y) / (pos.x - prev.x); //can be Infinity

				//find collision point if circle were to intersect bulk of the line
				var posOnHit = {
					x: pos.x + (line.start.rotated.y - circle.r - pos.y) / slope,
					y: line.start.rotated.y - circle.r
				};
				var contactPoint = {
					x: posOnHit.x,
					y: posOnHit.y + circle.r
				};

				//if that collision point is not actually on the line segment, then it's not colliding!
				if(line.start.rotated.x < posOnHit.x || posOnHit.x < line.end.rotated.x) {
					return false;
				}
				else {
					//collisions directly on the line sement are easy-peasy to handle
					vel.y = 0;
				}

				//determine if collision point is on the current path (have to account for a bit of error here, hence the 0.005)
				if(((prev.x <= pos.x && prev.x - 0.005 <= posOnHit.x && posOnHit.x <= pos.x + 0.005) ||
					(prev.x > pos.x && pos.x - 0.005 <= posOnHit.x && posOnHit.x <= prev.x + 0.005)) &&
					(prev.y <= pos.y && prev.y - 0.005 <= posOnHit.y && posOnHit.y <= pos.y + 0.005) &&
					pos.y > posOnHit.y) {
					//need to determine which collision happened first--we can do that by looking at how far it went before colliding
					var squareDistTraveledPreContact = (posOnHit.x - prev.x) * (posOnHit.x - prev.x) + (posOnHit.y - prev.y) * (posOnHit.y - prev.y);

					//there was a collision!
					return {
						obstacle: line,
						pointOfContact: line.unrotate(contactPoint), //unused
						posDuringContact: line.unrotate(posOnHit),
						posAfterContact: line.unrotate({ x: pos.x, y: posOnHit.y }),
						velAfterContact: line.unrotate(vel),
						squareDistTraveledPreContact: squareDistTraveledPreContact
					};
				}
			}
			return false;
		}

		function checkForGrappleCollisionWithLine(grapple, line) {
			var grappleSlope = (grapple.y - grapple._prev.y) / (grapple.x - grapple._prev.x); //can be Infinity
			var lineSlope = (line.start.y - line.end.y) / (line.start.x - line.end.x); //can be Infinity
			if(lineSlope === grappleSlope) {
				return false; //parallel lines can't cross
			}
			var grappleAt0 = grapple.y - grappleSlope * grapple.x;
			var lineAt0 = line.start.y - lineSlope * line.start.x;
			var intersection = { x: null, y: null };

			//determine horizontal intersection
			if(line.start.x === line.end.x) {
				intersection.x = line.start.x;
			}
			else if(grapple.x === grapple._prev.x) {
				intersection.x = grapple.x;
			}
			else {
				intersection.x = (grappleAt0 - lineAt0) / (lineSlope - grappleSlope);
			}

			//determine vertical intersection
			if(line.start.y === line.end.y) {
				intersection.y = line.start.y;
			}
			else if(grapple.y === grapple._prev.y) {
				intersection.y = grapple.y;
			}
			else {
				intersection.y = grappleSlope * intersection.x + grappleAt0;
			}

			//determine if collision point is on the current path (have to account for a bit of error here, hence the 0.005)
			var mid = intersection;
			var pos = grapple;
			var prev = grapple._prev;
			var start = line.start;
			var end = line.end;
			if(((prev.x <= pos.x && prev.x - 0.005 <= mid.x && mid.x <= pos.x + 0.005) ||
				(prev.x > pos.x && pos.x - 0.005 <= mid.x && mid.x <= prev.x + 0.005)) &&
				((prev.y <= pos.y && prev.y - 0.005 <= mid.y && mid.y <= pos.y + 0.005) ||
				(prev.y > pos.y && pos.y - 0.005 <= mid.y && mid.y <= prev.y + 0.005)) &&
				((start.x <= end.x && start.x - 0.005 <= mid.x && mid.x <= end.x + 0.005) ||
				(start.x > end.x && end.x - 0.005 <= mid.x && mid.x <= start.x + 0.005)) &&
				((start.y <= end.y && start.y - 0.005 <= mid.y && mid.y <= end.y + 0.005) ||
				(start.y > end.y && end.y - 0.005 <= mid.y && mid.y <= start.y + 0.005))) {
				//collision is valid!
				var squareDistTraveledPreContact = (mid.x - prev.x) * (mid.x - prev.x) + (mid.y - prev.y) * (mid.y - prev.y);
				return {
					obstacle: line,
					pointOfContact: intersection,
					squareDistTraveledPreContact: squareDistTraveledPreContact
				};
			}

			return false;
		}

		function checkForCollisions(immunity) {
			var collision = null;
			for(var i = 0; i < obstacles.length; i++) {
				if(obstacles[i].id !== immunity) {
					if(obstacles[i].type === 'line') {
						var collisionWithLine = checkForCollisionWithLine(circle, obstacles[i]);
						if(collisionWithLine && (!collision || collisionWithLine.squareDistTraveledPreContact < collision.squareDistTraveledPreContact)) {
							collision = collisionWithLine;
						}
					}
					else if(obstacles[i].type === 'point' && obstacles[i].parentIds.indexOf(immunity) < 0) {
						var collisionWithPoint = checkForCollisionWithPoint(circle, obstacles[i]);
						if(collisionWithPoint && (!collision || collisionWithPoint.squareDistTraveledPreContact < collision.squareDistTraveledPreContact)) {
							collision = collisionWithPoint;
						}
					}
				}
			}
			return collision;
		}

		function checkForGrappleCollision(grapple) {
			var collision = null;
			for(var i = 0; i < obstacles.length; i++) {
				if(obstacles[i].type === 'line') {
					var collisionWithLine = checkForGrappleCollisionWithLine(grapple, obstacles[i]);
					if(collisionWithLine && (!collision || collisionWithLine.squareDistTraveledPreContact < collision.squareDistTraveledPreContact)) {
						collision = collisionWithLine;
					}
				}
			}
			return collision;
		}

		//do this all the time
		function everyFrame(ms) {
			moveStuff(ms);
			render();
		}

		var obstaclesCollidedWithLastFrame = [];
		function moveStuff(ms) {
			var t = ms / 1000, i;
			var grapple, point, distX, distY, dist;
			var distToPointX, distToPointY, slopeToPoint, at0ToPoint, circleWasAbovePoint, circleIsAbovePoint;
			var circleActualPrev = { x: circle.x, y: circle.y };

			//apply gravity and user input
			circle.applyForce(0, 600);
			if(keys[KEY_MAP.A]) {
				circle.applyForce(-400, 0);
			}
			if(keys[KEY_MAP.D]) {
				circle.applyForce(400, 0);
			}
			if(keys[KEY_MAP.W]) {
				circle.applyForce(0, -400);
			}
			if(keys[KEY_MAP.S]) {
				circle.applyForce(0, 400);
			}
			if(circle._wantsToJump) {
				if(circle._activeCollision) {
					if(circle._activeCollision.obstacle.type === 'line') {
						circle.vel.y = 0;
						circle.applyInstantaneousForce(
							-20000 * circle._activeCollision.obstacle.jump.x,
							-20000 * circle._activeCollision.obstacle.jump.y);
					}
					else { //point
						var angle = transformAngle(Math.atan2(circle._activeCollision.obstacle.y - circle.y, circle._activeCollision.obstacle.x - circle.x) + Math.PI) - Math.PI;
						circle.vel.y = 0;
						circle.applyInstantaneousForce(
							-20000 * Math.cos(angle),
							-20000 * Math.sin(angle));
					}
					circle._wantsToJump = false;
				}
			}

			//apply sticky forces
			for(i = 0; i < obstaclesCollidedWithLastFrame.length; i++) {
				if(obstaclesCollidedWithLastFrame[i].type === 'line') {
					circle.applyForce(
						1 * obstaclesCollidedWithLastFrame[i].perpendicular.x,
						1 * obstaclesCollidedWithLastFrame[i].perpendicular.y);
				}
				else { //point
					var angleToPoint = Math.atan2(obstaclesCollidedWithLastFrame[i].y - circle.y, obstaclesCollidedWithLastFrame[i].x - circle.x);
					circle.applyForce(
						1 * Math.cos(angleToPoint),
						1 * Math.sin(angleToPoint));
				}
			}

			if(keys[PULL_GRAPPLE_KEY]) {
				for(i = 0; i < grapples.length; i++) {
					if(grapples[i]._collided && !grapples[i].dead) {
						grapple = grapples[i];
						distX = grapple.x - circle.x;
						distY = grapple.y - circle.y;
						dist = Math.sqrt(distX * distX + distY * distY);
						//if even after we reel in we have a lot of slack, do not tug
						if(grapple.dist - GRAPPLE_PULL_SPEED * t > dist) {
							grapple.dist -= GRAPPLE_PULL_SPEED * t;
						}
						//otherwise reel in all the slack and apply a force
						else {
							if(grapple.dist > dist) {
								grapple.dist = dist;
							}
							circle.applyForce(GRAPPLE_PULL_FORCE, distX, distY);
						}
					}
				}
			}

			//evaluate forces into movement
			var friction = 1;//Math.pow(Math.E, Math.log(1 - 0.3) * t);
			var oldVel = circle.tick(ms, friction);
			for(i = 0; i < grapples.length; i++) {
				grapples[i].tick(ms, friction);
			}

			//apply grapple forces
			for(i = 0; i < grapples.length; i++) {
				if(grapples[i]._collided && !grapples[i].dead) {
					grapple = grapples[i];
					distX = grapple.x - circle.x;
					distY = grapple.y - circle.y;
					dist = Math.sqrt(distX * distX + distY * distY);
					if(dist >= grapple.dist) {
						var angleToGrapple = Math.atan2(distY, distX);
						var cosAngleToGrapple = Math.cos(angleToGrapple);
						var sinAngleToGrapple = Math.sin(angleToGrapple);
						var rotatedVel = {
							x: circle.vel.x * -cosAngleToGrapple + circle.vel.y * -sinAngleToGrapple,
							y: circle.vel.x * sinAngleToGrapple + circle.vel.y * -cosAngleToGrapple
						};
						if(rotatedVel.x > 0) {
							rotatedVel.x = 0;
						}
						circle.vel = {
							x: rotatedVel.x * -cosAngleToGrapple + rotatedVel.y * sinAngleToGrapple,
							y: rotatedVel.x * -sinAngleToGrapple + rotatedVel.y * -cosAngleToGrapple
						};
						circle.x = grapple.x - cosAngleToGrapple * grapple.dist;
						circle.y = grapple.y - sinAngleToGrapple * grapple.dist;
					}
				}
			}

			//check for collisions
			var numCollisions = 0;
			var numCollisionsPerObstacle = {};
			var obstaclesCollidedWithThisFrame = [];
			var prevCollision;
			var immunity = null;
			var collision = checkForCollisions(immunity);
			while(collision) {
				numCollisions++;
				immunity = collision.obstacle.id;
				circle._activeCollision = collision;
				if(!numCollisionsPerObstacle[collision.obstacle.id]) {
					obstaclesCollidedWithThisFrame.push(collision.obstacle);
					numCollisionsPerObstacle[collision.obstacle.id] = 0;
				}
				numCollisionsPerObstacle[collision.obstacle.id]++;
				if(numCollisionsPerObstacle[collision.obstacle.id] >= 3) {
					circle.x = prevCollision.posDuringContact.x;
					circle.y = prevCollision.posDuringContact.y;
					break;
				}
				circle.x = collision.posAfterContact.x;
				circle.y = collision.posAfterContact.y;
				circle._prev.x = collision.posDuringContact.x;
				circle._prev.y = collision.posDuringContact.y;
				circle.vel.x = collision.velAfterContact.x;
				circle.vel.y = collision.velAfterContact.y;
				prevCollision = collision;
				collision = checkForCollisions(immunity);
			}
			if(numCollisions === 0) {
				circle._activeCollision = null;
			}
			obstaclesCollidedWithLastFrame = obstaclesCollidedWithThisFrame;

			if(keys[PULL_GRAPPLE_KEY]) {
				for(i = 0; i < grapples.length; i++) {
					if(grapples[i]._collided && !grapples[i].dead) {
						if(grapple.dist - GRAPPLE_PULL_SPEED * t <= dist && grapple.dist > dist) {
							grapple.dist = dist;
						}
					}
				}
			}

			//check for grapple collisions
			for(i = 0; i < grapples.length; i++) {
				if(!grapples[i]._collided && !grapples[i].dead) {
					var grappleCollision = checkForGrappleCollision(grapples[i]);
					if(grappleCollision) {
						grapples[i]._collided = true;
						grapples[i].x = grappleCollision.pointOfContact.x;
						grapples[i].y = grappleCollision.pointOfContact.y;
						grapples[i]._prev.x = grappleCollision.pointOfContact.x;
						grapples[i]._prev.y = grappleCollision.pointOfContact.y;
						var dx = circle.x - grapples[i].x;
						var dy = circle.y - grapples[i].y;
						grapples[i].dist = Math.sqrt(dx * dx + dy * dy);
					}
				}
			}

			//wrap around
			var wrapPointPerGrapple = {};
			for(i = 0; i < grapples.length; i++) {
				if(grapples[i]._collided && !grapples[i].dead) {
					//for each grapple
					grapple = grapples[i];
					wrapPointPerGrapple[grapple.id] = null;
					for(var j = 0; j < obstacles.length; j++) {
						if(obstacles[j].type === 'point') {
							//for each point (other than the point the grapple is connected to)
							point = obstacles[j];
							if(grapple.x !== point.x || grapple.y !== point.y) {
								distToPointX = grapple.x - point.x;
								distToPointY = grapple.y - point.y;
								distToPoint = Math.sqrt(distToPointX * distToPointX + distToPointY * distToPointY);
								distToCircleX = grapple.x - circle.x;
								distToCircleY = grapple.y - circle.y;
								distToCircle = Math.sqrt(distToCircleX * distToCircleX + distToCircleY * distToCircleY);
								//if the circle's farther than the point is from the grapple
								if(distToCircle > distToPoint) {
									//if the point and grapple are on the same side of the grapple
									if(((point.x > grapple.x) === (circle.x > grapple.x) || point.x === grapple.x) && 
										((point.y > grapple.y) === (circle.y > grapple.y) || point.y === grapple.y)) {
										slopeToPoint = distToPointY / distToPointX;
										at0ToPoint = point.y - slopeToPoint * point.x;
										circleWasAbovePoint = false; //TODO
										circleIsAbovePoint = false;
										if(distToPointX === 0) {
											circleIsAbovePoint = (circle.x < point.x);
											circleWasAbovePoint = (circle._prev.x < point.x);
										}
										else {
											circleIsAbovePoint = (circle.y > slopeToPoint * circle.x + at0ToPoint);
											circleWasAbovePoint = (circle._prev.y > slopeToPoint * circle._prev.x + at0ToPoint);
										}
										if(circleWasAbovePoint !== circleIsAbovePoint) {
											wrapPointPerGrapple[grapple.id] = {
												point: point
											};
										}
									}
								}
							}
						}
					}
				}
			}
			for(i = 0; i < grapples.length; i++) {
				if(grapples[i]._collided && !grapples[i].dead) {
					//for each grapple
					grapple = grapples[i];
					if(wrapPointPerGrapple[grapple.id]) {
						point = wrapPointPerGrapple[grapple.id].point;
						distToPointX = grapple.x - point.x;
						distToPointY = grapple.y - point.y;
						distToPoint = Math.sqrt(distToPointX * distToPointX + distToPointY * distToPointY);
						grapple.x = point.x;
						grapple.y = point.y;
						grapple.dist -= distToPoint;
					}
				}
			}
		}

		function render() {
			//move camera
			camera.x = circle.x - width / 2;
			camera.y = circle.y - height / 2;

			//draw background
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			//draw circle
			ctx.fillStyle = '#6c6';
			ctx.beginPath();
			ctx.arc(circle.x - camera.x, circle.y - camera.y, circle.r - 1, 0, 2 * Math.PI, false);
			ctx.fill();

			//draw lines
			var obstacleIds = obstaclesCollidedWithLastFrame.map(function(obstacle) { return obstacle.id; });
			for(i = 0; i < obstacles.length; i++) {
				if(obstacles[i].type === 'line') {
					drawLine(
						obstacles[i].start.x - camera.x, obstacles[i].start.y - camera.y,
						obstacles[i].end.x - camera.x, obstacles[i].end.y - camera.y,
						(obstacleIds.indexOf(obstacles[i].id) >= 0 ? '#f00' : '#000'));
				}
				else {
					drawPoint(obstacles[i].x - camera.x, obstacles[i].y - camera.y,
						(obstacleIds.indexOf(obstacles[i].id) >= 0 ? '#f00' : '#000'));
				}
			}

			for(i = 0; i < grapples.length; i++) {
				if(!grapples[i].dead) {
					drawGrapple(circle.x - camera.x, circle.y - camera.y,
						grapples[i].x - camera.x, grapples[i].y - camera.y);
				}
			}

			//draw velocity vector
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(circle.x - camera.x, circle.y - camera.y);
			ctx.lineTo(circle.x + circle.vel.x / 5 - camera.x, circle.y + circle.vel.y / 5 - camera.y);
			ctx.stroke();
		}

		//set up animation frame functionality
		var prevTime;
		requestAnimationFrame(function(time) {
			prevTime = time;
			loop(time);
		});
		function loop(time) {
			var ms = time - prevTime;
			prevTime = time;
			everyFrame(ms, time);
			requestAnimationFrame(loop);
		}
	};
});