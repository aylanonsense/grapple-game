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

		var circle = {
			mass: 10,
			r: 20,
			x: width / 2,
			y: height / 4,
			prev: { x: width / 2, y: height / 4 },
			vel: { x: 0, y: 0 },
			_force: { x: 0, y: 0 },
			_instantForce: { x: 0, y: 0 }
		};

		//WASD to move the circle
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, R: 82, SHIFT: 16, SPACE: 32 };
		$(document).on('keydown', function(evt) {
			keys[evt.which] = true;
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
				createLine(newLineEnd.x, newLineEnd.y, evt.clientX, evt.clientY);
				newLineEnd = null;
			}
		});
		$(document).on('mousemove', function(evt) {
			mouse.x = evt.clientX;
			mouse.y = evt.clientY;
		});
		function createLine(x1, y1, x2, y2) {
			var line = {
				start: { x: x2, y: y2 },
				end: { x: x1, y: y1 }
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
		/*var x = 250, y = 400;
		for(var i = 0; i < 30; i++) {
			createLine(x, y, x + 10, y + (14.5 - i) / 2);
			x += 10;
			y += (14.5 - i) / 2;
		}
		createLine(100, 400, 250, 400);
		createLine(550, 400, 700, 400);
		createLine(700, 400, 700, 500);
		createLine(700, 500, 100, 500);
		createLine(100, 500, 100, 400);
		createLine(350, 200, 650, 200);
		createLine(650, 200, 750, 100);
		createLine(750, 100, 750, 215);
		createLine(750, 215, 350, 215);
		createLine(350, 215, 350, 200);*/
		createLine(  350, 220,   390, 220);
		createPoly([ 10,  400,    70, 390,    50, 450 ]);
		createPoly([ 100, 100,   200, 100,   200, 200,   100, 200 ]);
		createPoly([ 170, 250,   320, 280,   300, 300,   150, 280 ]);
		createPoly([ 250, 500,   430, 430,   480, 450 ]);
		createPoly([ 420, 300,   440, 350,   390, 350 ]);
		createPoly([ 470, 180,   490, 180,   530, 240,   520, 270,   460, 260 ]);
		createPoly([ 500, 350,   700, 290,   680, 500 ]);
		createPoly([ 680, 160,   750, 150,   770, 160,   720, 190]);
		createPoly([ 760, 500,   790, 550,   760, 595,   750, 550]);

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

		function checkForCollision(circle, line) {
			//line angle (pre-calculated)
			var lineDeltaX = line.end.x - line.start.x;
			var lineDeltaY = line.end.y - line.start.y;
			var angle = Math.atan2(lineDeltaY, lineDeltaX);

			//helper functions to rotate and unrotate
			function rotateX(x, y, angle) {
				return x * -Math.cos(angle) - y * Math.sin(angle);
			}
			function rotateY(x, y, angle) {
				return x * Math.sin(angle) - y * Math.cos(angle);
			}
			function unrotateX(x, y, angle) {
				return x * -Math.cos(angle) + y * Math.sin(angle);
			}
			function unrotateY(x, y, angle) {
				return x * -Math.sin(angle) + y * -Math.cos(angle);
			}

			//transform line to rotated coordinates (pre-calculated)
			var lineStartX = rotateX(line.start.x, line.start.y, angle);
			var lineStartY = rotateY(line.start.x, line.start.y, angle);
			var lineEndX = rotateX(line.end.x, line.end.y, angle);
			var lineEndY = rotateY(line.end.x, line.end.y, angle);

			//transform circle to rotated coordinates
			var circleVelX = rotateX(circle.vel.x, circle.vel.y, angle);
			var circleVelY = rotateY(circle.vel.x, circle.vel.y, angle);
			var prevCircleX = rotateX(circle.prev.x, circle.prev.y, angle);
			var prevCircleY = rotateY(circle.prev.x, circle.prev.y, angle);
			var circleX = rotateX(circle.x, circle.y, angle);
			var circleY = rotateY(circle.x, circle.y, angle);

			//circle can only collide if it's moving toward the line
			if(circleVelY > 0 && circleY > prevCircleY) {
				//calculate line equation y = mx + b of circle's path
				var circlePathSlope = (circleY - prevCircleY) / (circleX - prevCircleX); //can be Infinity
				var circlePathAt0 = circleY - circleX * circlePathSlope; //can be Infinity or -Infinity

				//find collision point if circle were to intersect bulk of the line
				var collisionPointY = lineStartY - circle.r;
				var collisionPointX = (circlePathSlope === Infinity ? circleX : (collisionPointY - circlePathAt0) / circlePathSlope);
				var pointOfContactX = collisionPointX;
				var pointOfContactY = collisionPointY + circle.r;

				//if that collision point is not actually on the line segment, check the edges
				if(lineStartX < collisionPointX || collisionPointX < lineEndX) {
					//the point of contact is just the edge of the line
					pointOfContactX = (lineStartX < collisionPointX ? lineStartX : lineEndX);
					pointOfContactY = (lineStartY < collisionPointY ? lineStartY : lineEndY);

					//calculate the slope perpendicular to the circle's path
					var perpendicularSlope = -1 / circlePathSlope;
					var perpendicularLineAt0 = pointOfContactY - (perpendicularSlope * pointOfContactX);

					//find intersection of the circle's path and the extension perpendicular to it from the line endpoint
					var intersectionX = (circlePathSlope === Infinity ? circleX : (circlePathAt0 - perpendicularLineAt0) / (perpendicularSlope - circlePathSlope));
					var intersectionY = perpendicularSlope * intersectionX + perpendicularLineAt0;

					//move up the circle's path to the collision point
					var distFromIntersectionToEndpoint = Math.sqrt((intersectionX - pointOfContactX) * (intersectionX - pointOfContactX) + (intersectionY - pointOfContactY) * (intersectionY - pointOfContactY));
					var distUpCirclePath = Math.sqrt(circle.r * circle.r - distFromIntersectionToEndpoint * distFromIntersectionToEndpoint);
					var distUpCirclePathX = (circlePathSlope === Infinity ? 0 : distUpCirclePath / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1));
					var distUpCirclePathY = (circlePathSlope === Infinity ? distUpCirclePath : circlePathSlope * distUpCirclePathX);
					collisionPointX = intersectionX + distUpCirclePathX;
					collisionPointY = intersectionY + distUpCirclePathY;
				}

				circleVelY *= -1;

				//determine if collision point is on the current path
				//have to account for a bit of error here, hence the 0.005
				//TODO the following two lines are causing errors when a ball is falling directly on top of an endpoint from above
				//TODO endpoint coolio collision bouncing isn't working anymore, I removed it. add it back in
				if((prevCircleX - 0.005 <= collisionPointX && collisionPointX <= circleX + 0.005) ||
					(circleX - 0.005 <= collisionPointX && collisionPointX <= prevCircleX + 0.005)) {
					if(circleY > collisionPointY) {
						//there was a collision!
						var collision = {
							position: {
								x: unrotateX(collisionPointX, collisionPointY, angle),
								y: unrotateY(collisionPointX, collisionPointY, angle)
							},
							contact: {
								x: unrotateX(pointOfContactX, pointOfContactY, angle),
								y: unrotateY(pointOfContactX, pointOfContactY, angle)
							},
							bounceVel: {
								x: unrotateX(circleVelX, circleVelY, angle),
								y: unrotateY(circleVelX, circleVelY, angle)
							}
						};
						return collision;
					}
				}
			}
			return false;
		}

		//do this all the time
		var FRICTION = 0.5;
		var GRAVITY = 900;
		var MOVE_FORCE = 200;
		function everyFrame(ms) {
			var t = ms / 1000, i;

			//draw background
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			//gravity
			applyForce(circle, 0, GRAVITY);

			//move circle
			if(keys[KEY_MAP.A]) {
				applyForce(circle, -MOVE_FORCE, 0);
			}
			if(keys[KEY_MAP.D]) {
				applyForce(circle, MOVE_FORCE, 0);
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
			var friction = Math.pow(Math.E, Math.log(1 - FRICTION) * t);
			circle.vel.x *= friction;
			circle.vel.y *= friction;
			oldVelX *= friction;
			oldVelY *= friction;

			//update circle position
			circle.prev.x = circle.x;
			circle.prev.y = circle.y;
			circle.x += (circle.vel.x + oldVelX) / 2 * t;
			circle.y += (circle.vel.y + oldVelY) / 2 * t;

			//check for collisions
			var collision = null;
			for(i = 0; i < lines.length; i++) {
				var collisionWithLine = checkForCollision(circle, lines[i]);
				if(collisionWithLine) {
					collision = collisionWithLine;
					circle.x = collision.position.x;
					circle.y = collision.position.y;
				}
			}
			if(collision) {
				circle.vel.x = collision.bounceVel.x;
				circle.vel.y = collision.bounceVel.y;
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

			//draw lines
			for(i = 0; i < lines.length; i++) {
				drawLine(lines[i].start.x, lines[i].start.y, lines[i].end.x, lines[i].end.y, '#000', 1);
			}

			//draw line being created
			if(newLineEnd) {
				drawLine(mouse.x, mouse.y, newLineEnd.x, newLineEnd.y, '#999', 1);
			}

			//draw circle
			ctx.fillStyle = '#090';
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 0.5;
			ctx.beginPath();
			ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
			ctx.fill();
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
				/*var angleToPointOfContact = Math.atan2(collisionPointX - pointOfContactX, pointOfContactY - collisionPointY);
				var velocityBouncedOffContactPointX = rotateX(circleVelX, circleVelY, angleToPointOfContact);
				var velocityBouncedOffContactPointY = rotateY(circleVelX, circleVelY, angleToPointOfContact);
				var newVelX = unrotateX(velocityBouncedOffContactPointX, -velocityBouncedOffContactPointY, angleToPointOfContact);
				var newVelY = unrotateY(velocityBouncedOffContactPointX, -velocityBouncedOffContactPointY, angleToPointOfContact);
				var rotatedCollisionPointX = unrotateX(collisionPointX, collisionPointY, angle);
				var rotatedCollisionPointY = unrotateY(collisionPointX, collisionPointY, angle);
				var rotatedVelX = unrotateX(newVelX, -newVelY, angle);
				var rotatedVelY = unrotateY(newVelX, -newVelY, angle);
				var rotatedPointOfContactX = unrotateX(pointOfContactX, pointOfContactY, angle);
				var rotatedPointOfContactY = unrotateY(pointOfContactX, pointOfContactY, angle);*/
	};
});