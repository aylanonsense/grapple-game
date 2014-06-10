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
			_instantForce: { x: 0, y: 0 },
			floorLine: null
		};

		//WASD to move the circle
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, R: 82, SHIFT: 16, SPACE: 32 };
		$(document).on('keydown', function(evt) {
			keys[evt.which] = true;
			if(evt.which === KEY_MAP.SPACE) {
				paused = !paused;
			}
			else if(evt.which === KEY_MAP.SHIFT) {
				framesPerFrame = 15;
			}
		});
		$(document).on('keyup', function(evt) {
			keys[evt.which] = false;
			if(evt.which === KEY_MAP.SHIFT) {
				framesPerFrame = 1;
			}
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
		var nextLineId = 0;
		function createLine(x1, y1, x2, y2) {
			var line = {
				id: nextLineId++,
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
		var x = 250, y = 400;
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
		createLine(350, 215, 350, 200);

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
			var origCircleX = circleX;
			var origCircleY = circleY;
			var origPrevX = prevCircleX;
			var origPrevY = prevCircleY;
			var s = "";

			//circle can only collide if it's moving toward the line
			if(circleVelY > 0 && circleY > prevCircleY) {
				s += "A";
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
					s += "B";
					//the point of contact is just the edge of the line
					pointOfContactX = (lineStartX < collisionPointX ? lineStartX : lineEndX);
					pointOfContactY = (lineStartY < collisionPointY ? lineStartY : lineEndY);

					if(circlePathSlope === Infinity) {
						s += "C";
						//if the circle is moving straight down, the collision point is easier to calculate
						var distanceFromPointOfContactX = collisionPointX - pointOfContactX;
						var distanceFromPointOfContactY = Math.sqrt(circle.r * circle.r - distanceFromPointOfContactX * distanceFromPointOfContactX);
						collisionPointX = pointOfContactX + distanceFromPointOfContactX;
						collisionPointY = pointOfContactY - distanceFromPointOfContactY;
					}
					else {
						s += "D";
						//calculate the slope perpendicular to the circle's path
						var perpendicularSlope = -1 / circlePathSlope;
						var perpendicularLineAt0 = pointOfContactY - (perpendicularSlope * pointOfContactX);

						//find intersection of the circle's path and the extension perpendicular to it from the line endpoint
						var intersectionX = (circlePathAt0 - perpendicularLineAt0) / (perpendicularSlope - circlePathSlope);
						var intersectionY = perpendicularSlope * intersectionX + perpendicularLineAt0;

						//move up the circle's path to the collision point
						var distFromIntersectionToEndpoint = Math.sqrt((intersectionX - pointOfContactX) * (intersectionX - pointOfContactX) + (intersectionY - pointOfContactY) * (intersectionY - pointOfContactY));
						var distUpCirclePath = Math.sqrt(circle.r * circle.r - distFromIntersectionToEndpoint * distFromIntersectionToEndpoint);
						var distUpCirclePathX = distUpCirclePath / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1);
						var distUpCirclePathY = circlePathSlope * distUpCirclePathX;
						collisionPointX = intersectionX + distUpCirclePathX;
						collisionPointY = intersectionY + distUpCirclePathY;
					}

					//calculate the angle from the line endpoint to the collision point
					var angleToPointOfContact = -Math.PI - Math.atan2(pointOfContactX - collisionPointX, pointOfContactY - collisionPointY);

					//rotate the circle's velocity, negate its velocity towards the point, then unrotate it
					var circleVelXRelativeToPointOfContact = rotateX(circleVelX, circleVelY, angleToPointOfContact);
					var circleVelYRelativeToPointOfContact = rotateY(circleVelX, circleVelY, angleToPointOfContact);
					circleVelYRelativeToPointOfContact *= 0;//-1;
					circleVelX = unrotateX(circleVelXRelativeToPointOfContact, circleVelYRelativeToPointOfContact, angleToPointOfContact);
					circleVelY = unrotateY(circleVelXRelativeToPointOfContact, circleVelYRelativeToPointOfContact, angleToPointOfContact);
				}
				else {
					s += "E";
					//collisions directly on the line sement are easy-peasy to handle
					circleVelY *= 0;//-1;
				}

				//once we find the collision point and adjust the velocity, we might need to move the circle forward
				//if the circle hit the ground and is now sliding, slide!
				var posAfterMovingX = circleX;
				var posAfterMovingY = collisionPointY;

				var distanceCovered = Math.sqrt((collisionPointX - prevCircleX) * (collisionPointX - prevCircleX) +
					(collisionPointY - prevCircleY) * (collisionPointY - prevCircleY));
				var distanceTotal = Math.sqrt((circleX - prevCircleX) * (circleX - prevCircleX) +
					(circleY - prevCircleY) * (circleY - prevCircleY));
				var percentOfDistanceCovered = distanceCovered / distanceTotal;

				//determine if collision point is on the current path
				//have to account for a bit of error here, hence the 0.005
				if(((prevCircleX - 0.005 <= collisionPointX && collisionPointX <= circleX + 0.005) ||
					(circleX - 0.005 <= collisionPointX && collisionPointX <= prevCircleX + 0.005)) &&
					(prevCircleY - 0.005 <= collisionPointY && collisionPointY <= circleY + 0.005)) {
					s += "F";
					if(circleY > collisionPointY) {
						//there was a collision!
						var collision = {
							position: {
								x: unrotateX(collisionPointX, collisionPointY, angle),
								y: unrotateY(collisionPointX, collisionPointY, angle)
							},
							origPos: {
								x: unrotateX(origCircleX, origCircleY, angle),
								y: unrotateY(origCircleX, origCircleY, angle)
							},
							origPrev: {
								x: unrotateX(origPrevX, origPrevY, angle),
								y: unrotateY(origPrevX, origPrevY, angle)
							},
							contact: {
								x: unrotateX(pointOfContactX, pointOfContactY, angle),
								y: unrotateY(pointOfContactX, pointOfContactY, angle)
							},
							slide: {
								x: unrotateX(posAfterMovingX, posAfterMovingY, angle),
								y: unrotateY(posAfterMovingX, posAfterMovingY, angle)
							},
							revisedVel: {
								x: unrotateX(circleVelX, circleVelY, angle),
								y: unrotateY(circleVelX, circleVelY, angle)
							},
							percentThere: percentOfDistanceCovered,
							line: line
						};
						//console.log(s);
						return collision;
					}
				}
			}
			return false;
		}

		function handleOneRoundOfCollisions(collisionImmunity) {
			var collision = null;
			var immunities = [ collisionImmunity ];
			/*for(var i = lines.length - 1; i >= 0; i--) {
				if(immunities.indexOf(lines[i].id) === -1) {
					var collisionWithLine = checkForCollision(circle, lines[i]);
					if(collisionWithLine) {
						collision = collisionWithLine;
						circle.x = collision.position.x;
						circle.y = collision.position.y;
						immunities.push(lines[i].id);
						i = lines.length;
						//TODO undo this, unnecessary
					}
				}
			}*/
			for(var i = 0; i < lines.length - 1; i++) {
				var collisionWithLine = checkForCollision(circle, lines[i]);
				if(collisionWithLine && (!collision || collisionWithLine.percentThere < collision.percentThere)) {
					collision = collisionWithLine;
				}
			}
			if(collision) {
				// console.log(
				// 	Math.floor(10 * collision.line.id) / 10, "  Contact:",
				// 	Math.floor(10 * collision.contact.x) / 10,
				// 	Math.floor(10 * collision.contact.y) / 10, "  OrigPrev:",
				// 	Math.floor(10 * collision.origPrev.x) / 10,
				// 	Math.floor(10 * collision.origPrev.y) / 10,"  OrigPos:",
				// 	Math.floor(10 * collision.origPos.x) / 10,
				// 	Math.floor(10 * collision.origPos.y) / 10, "  Pos:",
				// 	Math.floor(10 * collision.position.x) / 10,
				// 	Math.floor(10 * collision.position.y) / 10,  "  Slide:",
				// 	Math.floor(10 * collision.slide.x) / 10,
				// 	Math.floor(10 * collision.slide.y) / 10, "  Vel:",
				// 	Math.floor(10 * collision.revisedVel.x) / 10,
				// 	Math.floor(10 * collision.revisedVel.y) / 10, "  ");
			}
			return collision;
		}

		//do this all the time
		var FRICTION = 0.3;
		var GRAVITY = 600;
		var MOVE_FORCE = 400;
		var paused = false;
		var framesPerFrame = 1, f = 0;
		function everyFrame(ms) {
			var t = ms / 1000, i;

			if(f++ % framesPerFrame === 0) {
				if(!paused) {
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

					// console.log(
					// 	"Circle pos:",
					// 	Math.floor(10 * circle.x) / 10,
					// 	Math.floor(10 * circle.y) / 10,
					// 	"  Prev pos:",
					// 	Math.floor(10 * circle.prev.x) / 10,
					// 	Math.floor(10 * circle.prev.y) / 10,
					// 	"  Vel:",
					// 	Math.floor(10 * circle.vel.x) / 10,
					// 	Math.floor(10 * circle.vel.y) / 10,
					// 	"  Inx:",
					// 	(circle.vel.x + oldVelX) / 2 * t,
					// 	(circle.vel.y + oldVelY) / 2 * t
					// );
					var toDrawOldVelX = circle.vel.x;
					var toDrawOldVelY = circle.vel.y;
					var toDrawOldPrevX = circle.prev.x;
					var toDrawOldPrevY = circle.prev.y;
					var toDrawOldX = circle.x;
					var toDrawOldY = circle.y;

					//check for collisions
					var lineId = null;
					//console.log("");
					var collision = handleOneRoundOfCollisions(lineId);
					if(!collision) {
						//it is aireborne--not a single collision
						circle.floorLine = null;
					}
					while(collision) {
						console.log(collision.percentThere);
						//each subsequent collision, slide more!
						//TODO to get when it has slid off the current line, we need to have immunity just note it still collides
						circle.floorLine = collision.floorLine;
						circle.vel.x = collision.revisedVel.x;
						circle.vel.y = collision.revisedVel.y;
						lineId = collision.line.id;
						circle.prev.x = collision.position.x;
						circle.prev.y = collision.position.y;
						circle.x = collision.slide.x;
						circle.y = collision.slide.y;
						collision = handleOneRoundOfCollisions(lineId);
					}

					var toDrawNewVelX = circle.vel.x;
					var toDrawNewVelY = circle.vel.y;
					var toDrawNewPrevX = circle.prev.x;
					var toDrawNewPrevY = circle.prev.y;
					var toDrawNewX = circle.x;
					var toDrawNewY = circle.y;

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
				}
			}

			//draw background
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			//draw lines
			for(i = 0; i < lines.length; i++) {
				drawLine(lines[i].start.x, lines[i].start.y, lines[i].end.x, lines[i].end.y,
					(lines[i].id === circle.floorLine ? '#f00' : '#000'), 1);
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

			//draw extras
			/*
					var toDrawOldVelX = circle.vel.x;
					var toDrawOldVelY = circle.vel;y
					var toDrawOldPrevX = circle.prev.x;
					var toDrawOldPrevY = circle.prev.y;
					var toDrawOldX = circle.x;
					var toDrawOldY = circle.y;
					var toDrawNewVelX = circle.vel.x;
					var toDrawNewVelY = circle.vel;y
					var toDrawNewPrevX = circle.prev.x;
					var toDrawNewPrevY = circle.prev.y;
					var toDrawNewX = circle.x;
					var toDrawNewY = circle.y;*/
			// ctx.strokeStyle = '#f00';
			// ctx.lineWidth = 0.5;
			// ctx.beginPath();
			// ctx.arc(toDrawOldX, toDrawOldY, circle.r, 0, 2 * Math.PI, false);
			// ctx.moveTo(toDrawOldX, toDrawOldY);
			// ctx.lineTo(toDrawOldX + toDrawNewVelX / 10, toDrawOldY + toDrawNewVelY / 10);
			// ctx.stroke();

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