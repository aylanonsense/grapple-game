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
			x: 744,
			y: 79,
			r: 20,
			vel: { x: 30, y: 0 },
			_prev: { x: width / 2, y: height / 4 },
			_force: { x: 0, y: 0 },
			_instantForce: { x: 0, y: 0 },
			_activeCollision: null,
			_wantsToJump: false
		};

		//WASD to move the circle
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, R: 82, SHIFT: 16, SPACE: 32 };
		$(document).on('keydown', function(evt) {
			keys[evt.which] = true;
			if(evt.which === KEY_MAP.SPACE && circle._activeCollision) {
				circle._wantsToJump = true;
			}
		});
		$(document).on('keyup', function(evt) {
			keys[evt.which] = false;
		});

		//click the canvas to create new lines
		var lines = [];
		var newLineEnd = null;
		var mouse = { x: 0, y: 0 };
		$(document).on('mousedown', function(evt) {
			newLineEnd = { x: evt.clientX, y: evt.clientY };
		});
		$(document).on('mouseup', function(evt) {
			if(newLineEnd) {
				createLine(evt.clientX, evt.clientY, newLineEnd.x, newLineEnd.y);
				newLineEnd = null;
			}
		});
		$(document).on('mousemove', function(evt) {
			mouse.x = evt.clientX;
			mouse.y = evt.clientY;
		});
		var nextLineId = 0;
		function createLine(x1, y1, x2, y2) {
			var angle = Math.atan2(y2 - y1, x2 - x1);
			var cosAngle = Math.cos(angle);
			var sinAngle = Math.sin(angle);
			var line = {
				id: nextLineId++,
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
			lines.push(line);
		}
		function createPoly(points) {
			for(var i = 0; i + 2 < points.length; i += 2) {
				createLine(points[i], points[i + 1], points[i + 2], points[i + 3]);
			}
			createLine(points[points.length - 2], points[points.length - 1], points[0], points[1]);
		}

		//create starting lines
		var x = 250, y = 400;
		for(var i = 0; i < 30; i++) {
			createLine(x + 10, y + (14.5 - i) / 2, x, y);
			x += 10;
			y += (14.5 - i) / 2;
		}
		createLine(250, 400, 100, 400);
		createLine(700, 400, 550, 400);
		createLine(700, 500, 700, 400);
		createLine(100, 500, 700, 500);
		createLine(100, 400, 100, 500);
		createLine(650, 200, 350, 200);
		createLine(750, 100, 650, 200);
		createLine(750, 215, 750, 100);
		createLine(350, 215, 750, 215);
		createLine(350, 200, 350, 215);
		createLine(350, 350, 320, 220);
		createLine(320, 220, 220, 240);
		createLine(220, 240, 240, 160);
		createLine(120, 350, 120, 200);
		createLine(240, 350, 120, 350);

		function drawLine(x1, y1, x2, y2, color, width) {
			ctx.strokeStyle = color;
			ctx.lineWidth = width;
			ctx.beginPath();
			//draw line
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			//draw pip
			var pipAngle = Math.atan2((x1 - x2), (y2 - y1));
			ctx.moveTo((x1 + x2) / 2, (y1 + y2) / 2);
			ctx.lineTo((x1 + x2) / 2 + 10 * Math.cos(pipAngle),
				(y1 + y2) / 2 + 10 * Math.sin(pipAngle));
			ctx.stroke();
		}

		function applyForce(obj, forceX, forceY) {
			if(arguments.length === 4) {
				var force = arguments[1];
				var dirX = arguments[2];
				var dirY = arguments[3];
				var dir = Math.sqrt(dirX * dirX + dirY * dirY);
				forceX += force * dirX / dir;
				forceY += force * dirY / dir;
			}
			obj._force.x += forceX;
			obj._force.y += forceY;
		}

		function applyInstantaneousForce(obj, forceX, forceY) {
			if(arguments.length === 4) {
				var force = arguments[1];
				var dirX = arguments[2];
				var dirY = arguments[3];
				var dir = Math.sqrt(dirX * dirX + dirY * dirY);
				forceX += force * dirX / dir;
				forceY += force * dirY / dir;
			}
			obj._instantForce.x += forceX;
			obj._instantForce.y += forceY;
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
				var intersectingEndPoint = false;
				var posOnHit = {
					x: pos.x + (line.start.rotated.y - circle.r - pos.y) / slope,
					y: line.start.rotated.y - circle.r
				};
				var contactPoint = {
					x: posOnHit.x,
					y: posOnHit.y + circle.r
				};

				//if that collision point is not actually on the line segment, check the edges
				if(line.start.rotated.x < posOnHit.x || posOnHit.x < line.end.rotated.x) {
					//the point of contact is just the edge of the line
					intersectingEndPoint = true;
					contactPoint.x = (line.start.rotated.x < posOnHit.x ? line.start.rotated.x : line.end.rotated.x);
					contactPoint.y = (line.start.rotated.y < posOnHit.y ? line.start.rotated.y : line.end.rotated.y);

					if(slope === Infinity) {
						//if the circle is moving straight down, the collision point is easier to calculate
						posOnHit.y = contactPoint.y - Math.sqrt(circle.r * circle.r - (posOnHit.x - contactPoint.x) * (posOnHit.x - contactPoint.x));
					}
					else {
						//calculate the slope perpendicular to the circle's path
						var perpendicularSlope = -1 / slope;
						var perpendicularLineAt0 = contactPoint.y - (perpendicularSlope * contactPoint.x);

						//find intersection of the circle's path and the extension perpendicular to it from the line endpoint
						var intersectionX = (pos.y - pos.x * slope - perpendicularLineAt0) / (perpendicularSlope - slope);
						var intersectionY = perpendicularSlope * intersectionX + perpendicularLineAt0;

						//move up the circle's path to the collision point
						var distFromIntersectionToEndpoint = Math.sqrt((intersectionX - contactPoint.x) * (intersectionX - contactPoint.x) + (intersectionY - contactPoint.y) * (intersectionY - contactPoint.y));
						var distAlongCirclePath = Math.sqrt(circle.r * circle.r - distFromIntersectionToEndpoint * distFromIntersectionToEndpoint);
						var horizontalDistAlongCirclePath = distAlongCirclePath / Math.sqrt(1 + slope * slope) * (slope < 0 ? 1 : -1);
						var verticalDistAlongCirclePath = slope * horizontalDistAlongCirclePath;
						posOnHit.x = intersectionX + horizontalDistAlongCirclePath;
						posOnHit.y = intersectionY + verticalDistAlongCirclePath;
					}

					//calculate the angle from the line endpoint to the collision point
					//rotate the circle's velocity, negate its velocity towards the point, then unrotate it
					var angleToPointOfContact = -Math.PI - Math.atan2(contactPoint.x - posOnHit.x, contactPoint.y - posOnHit.y);
					var cosAngle = Math.cos(angleToPointOfContact);
					var sinAngle = Math.sin(angleToPointOfContact);
					var horizontalVelRelativeToPointOfContact = vel.x * -cosAngle + vel.y * -sinAngle;
					vel.x = horizontalVelRelativeToPointOfContact * -cosAngle;
					vel.y = horizontalVelRelativeToPointOfContact * -sinAngle;
				}
				else {
					//collisions directly on the line sement are easy-peasy to handle
					vel.y = 0;
				}

				//determine if collision point is on the current path (have to account for a bit of error here, hence the 0.005)
				if(((prev.x - 0.005 <= posOnHit.x && posOnHit.x <= pos.x + 0.005) ||
					(pos.x - 0.005 <= posOnHit.x && posOnHit.x <= prev.x + 0.005)) &&
					(prev.y - 0.005 <= posOnHit.y && posOnHit.y <= pos.y + 0.005) &&
					pos.y > posOnHit.y) {
					//need to determine which collision happened first--we can do that by looking at how far it went before colliding
					var squareDistTraveledPreContact = (posOnHit.x - prev.x) * (posOnHit.x - prev.x) + (posOnHit.y - prev.y) * (posOnHit.y - prev.y);

					//there was a collision!
					return {
						line: line,
						pointOfContact: line.unrotate(contactPoint), //unused
						posDuringContact: line.unrotate(posOnHit),
						posAfterContact: line.unrotate({ x: pos.x, y: posOnHit.y }),
						velAfterContact: line.unrotate(vel),
						squareDistTraveledPreContact: (posOnHit.x - prev.x) * (posOnHit.x - prev.x) + (posOnHit.y - prev.y) * (posOnHit.y - prev.y),
						isIntersectingEndPoint: intersectingEndPoint
					};
				}
			}
			return false;
		}

		function checkForCollisions() {
			var collision = null;
			for(var i = 0; i < lines.length; i++) {
				var collisionWithLine = checkForCollisionWithLine(circle, lines[i]);
				if(collisionWithLine && (!collision || collisionWithLine.squareDistTraveledPreContact < collision.squareDistTraveledPreContact)) {
					collision = collisionWithLine;
				}
			}
			return collision;
		}

		var snapshots = [];
		function recordSnapshot(name) {
			var circleSnapshot = {
				x: circle.x,
				y: circle.y,
				r: circle.r,
				vel: { x: circle.vel.x, y: circle.vel.y },
				_prev: { x: circle._prev.x, y: circle._prev.y },
				_force: { x: circle._force.x, y: circle._force.y },
				_instantForce: { x: circle._instantForce.x, y: circle._instantForce.y },
				_activeCollision: (circle._activeCollision ? {
					line: circle._activeCollision.line,
					pointOfContact: { x: circle._activeCollision.pointOfContact.x, y: circle._activeCollision.pointOfContact.y },
					posDuringContact: { x: circle._activeCollision.posDuringContact.x, y: circle._activeCollision.posDuringContact.y },
					posAfterContact: { x: circle._activeCollision.posAfterContact.x, y: circle._activeCollision.posAfterContact.y },
					velAfterContact: { x: circle._activeCollision.velAfterContact.x, y: circle._activeCollision.velAfterContact.y },
					squareDistTraveledPreContact: { x: circle._activeCollision.squareDistTraveledPreContact.x, y: circle._activeCollision.squareDistTraveledPreContact.y },
					isIntersectingEndPoint: circle._activeCollision.isIntersectingEndPoint
				} : null),
				_wantsToJump: circle._wantsToJump
			};
			snapshots.push({
				name: name,
				circle: circleSnapshot
			});
		}

		//do this all the time
		var prevCollisions = [];
		var f = 0, framesPerFrame = 1;
		function everyFrame(ms) {
			if(f++ % framesPerFrame === 0) {
				if(snapshots.length === 0) {
					moveStuff(ms);
				}
				snapshots = [];
				if(snapshots.length === 0) {
					draw(circle, lines, null);
				}
				else {
					var snapshot = snapshots.shift();
					draw(snapshot.circle, lines, snapshot.name);
				}
			}
		}

		function moveStuff(ms) {
			recordSnapshot('start');
			var t = ms / 1000, i;

			//gravity
			applyForce(circle, 0, 600);

			//move circle
			if(keys[KEY_MAP.A]) {
				applyForce(circle, -400, 0);
			}
			if(keys[KEY_MAP.D]) {
				applyForce(circle, 400, 0);
			}

			//apply sticky forces
			for(i = 0; i < prevCollisions.length; i++) {
				applyForce(circle,
					1 * prevCollisions[i].line.perpendicular.x,
					1 * prevCollisions[i].line.perpendicular.y);
			}

			//jump!
			if(circle._wantsToJump) {
				if(circle._activeCollision) {
					applyInstantaneousForce(circle,
						-15000 * circle._activeCollision.line.perpendicular.x,
						-15000 * circle._activeCollision.line.perpendicular.y);
				}
				circle._wantsToJump = false;
			}

			//apply forces
			var oldVelX = circle.vel.x;
			var oldVelY = circle.vel.y;
			circle.vel.x += circle._force.x * t + circle._instantForce.x / 60;
			circle.vel.y += circle._force.y * t + circle._instantForce.y / 60;
			circle._force.x = 0;
			circle._force.y = 0;
			circle._instantForce.x = 0;
			circle._instantForce.y = 0;

			//apply friction
			var friction = Math.pow(Math.E, Math.log(1 - 0.3) * t);
			circle.vel.x *= friction;
			circle.vel.y *= friction;
			oldVelX *= friction;
			oldVelY *= friction;

			//update circle position
			circle._prev.x = circle.x;
			circle._prev.y = circle.y;
			circle.x += (circle.vel.x + oldVelX) / 2 * t;
			circle.y += (circle.vel.y + oldVelY) / 2 * t;

			recordSnapshot('forces applied');

			//check for collisions
			prevCollisions = [];
			var numCollisions = 0;
			var collision = checkForCollisions();
			var prevCollision;
			var collisionLookup = {};
			while(collision) {
				numCollisions++;
				circle._activeCollision = collision;
				if(!collisionLookup[collision.line.id]) {
					collisionLookup[collision.line.id] = 0;
					prevCollisions.push(collision);
				}
				collisionLookup[collision.line.id]++;
				if(collisionLookup[collision.line.id] >= 3) {
					circle.x = prevCollision.posDuringContact.x;
					circle.y = prevCollision.posDuringContact.y;
					break;
				}
				if(prevCollision && prevCollision.isIntersectingEndPoint && collision.isIntersectingEndPoint) {
					break;
				}
				circle.x = collision.posAfterContact.x;
				circle.y = collision.posAfterContact.y;
				circle._prev.x = collision.posDuringContact.x;
				circle._prev.y = collision.posDuringContact.y;
				circle.vel.x = collision.velAfterContact.x;
				circle.vel.y = collision.velAfterContact.y;
				recordSnapshot("collision");
				collision = checkForCollisions();
				prevCollision = collision;
			}
			if(numCollisions === 0) {
				circle._activeCollision = null;
			}

			//keep player in bounds
			if(circle.x > width + circle.r / 2) {
				circle.x = -circle.r / 2;
			}
			else if(circle.x < -circle.r / 2) {
				circle.x = width + circle.r / 2;
			}
			if(circle.y > height + circle.r / 2) {
				circle.y = -circle.r / 2;
			}
			else if(circle.y < -circle.r / 2) {
				circle.y = height + circle.r / 2;
			}
			recordSnapshot("end");
		}

		function draw(circle, lines, snapshot) {
			//draw background
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			//draw lines
			for(i = 0; i < lines.length; i++) {
				drawLine(lines[i].start.x, lines[i].start.y, lines[i].end.x, lines[i].end.y,
					(circle._activeCollision && circle._activeCollision.line.id === lines[i].id ? '#f00' : '#000'), 1);
			}

			//draw line being created
			if(newLineEnd) {
				drawLine(mouse.x, mouse.y, newLineEnd.x, newLineEnd.y, '#999', 1);
			}

			//draw circle
			if(snapshot === 'end') {
				ctx.fillStyle = '#090';
			}
			else if(snapshot === 'collision') {
				if(circle._activeCollision.isIntersectingEndPoint) {
					ctx.fillStyle = '#99c';
				}
				else {
					ctx.fillStyle = '#cc3';
				}
			}
			else {
				ctx.fillStyle = '#6c6';
			}
			ctx.beginPath();
			ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
			ctx.fill();

			//draw velocity vector
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(circle.x, circle.y);
			ctx.lineTo(circle.x + circle.vel.x / 5, circle.y + circle.vel.y / 5);
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