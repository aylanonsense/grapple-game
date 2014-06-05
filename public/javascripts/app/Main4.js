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

		//circle
		var circle = {
			x: width / 2,
			y: height / 2,
			prev: {
				x: width / 2,
				y: height / 2
			},
			vel: {
				x: 0,
				y: 0
			},
			suggestedVel: {
				x: null,
				y: null
			},
			r: 50
		};

		//WASD to move the circle
		var echosEnabled = false;
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, R: 82, SHIFT: 16, SPACE: 32 };
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
			}
		});
		$(document).on('keyup', function(evt) {
			if(keys[evt.which]) {
				keys[evt.which] = false;
				if(evt.which === KEY_MAP.SPACE) {
					echosEnabled = !echosEnabled;
				}
				else if(evt.which === KEY_MAP.R) {
					paused = !paused;
				}
			}
		});

		//click the canvas to create new lines
		var lines = [];
		var newLineStart = null;
		var mouse = { x: 0, y: 0 };
		$(document).on('click', function(evt) {
			if(newLineStart) {
				lines.push({ start: newLineStart, end: { x: evt.clientX, y: evt.clientY } });
				newLineStart = null;
			}
			else {
				newLineStart = { x: evt.clientX, y: evt.clientY };
			}
		});
		$(document).on('mousemove', function(evt) {
			mouse.x = evt.clientX;
			mouse.y = evt.clientY;
		});

		//collision code
		function handleCollision(circle, line) {
			var ret = false;
			//line angle (pre-calculated)
			var lineDeltaX = line.end.x - line.start.x;
			var lineDeltaY = line.end.y - line.start.y;
			var angle = Math.atan2(lineDeltaY, lineDeltaX);
			var pos = null;

			//helper functions to rotate and unrotate
			function rotateX(x, y) {
				return x * -Math.cos(angle) - y * Math.sin(angle);
			}
			function rotateY(x, y) {
				return x * Math.sin(angle) - y * Math.cos(angle);
			}
			function unrotateX(x, y) {
				return x * -Math.cos(angle) + y * Math.sin(angle);
			}
			function unrotateY(x, y) {
				return x * -Math.sin(angle) + y * -Math.cos(angle);
			}

			//transform line to rotated coordinates (pre-calculated)
			var lineStartX = rotateX(line.start.x, line.start.y);
			var lineStartY = rotateY(line.start.x, line.start.y);
			var lineEndX = rotateX(line.end.x, line.end.y);
			var lineEndY = rotateY(line.end.x, line.end.y);

			//transform velocity to rotated coordinated
			var circleVelX = rotateX(circle.vel.x, circle.vel.y);
			var circleVelY = rotateY(circle.vel.x, circle.vel.y);

			//the only way it will collide is if it's moving towards the line from the front side
			//if(circleVelY < 0) {
				//transform circle to rotated coordinates
				var prevCircleX = rotateX(circle.prev.x, circle.prev.y);
				var prevCircleY = rotateY(circle.prev.x, circle.prev.y);
				var circleX = rotateX(circle.x, circle.y);
				var circleY = rotateY(circle.x, circle.y);

				//calculate the collision point if the circle intersects the bulk of the line
				var circlePathChangeInY = circleY - prevCircleY; //TODO don't assume change in y is non-0
				var circlePathChangeInX = circleX - prevCircleX;
				var circlePathSlope = circlePathChangeInY / circlePathChangeInX;
				var circlePathAt0 = circleY - circleX * circlePathSlope;
				var collisionPointY = lineStartY - circle.r;
				var collisionPointX = (collisionPointY - circlePathAt0) / circlePathSlope;

				var pointOfContactX = null;
				var pointOfContactY = null;

				//determine if collision point is above the line segment
				if(lineStartX >= collisionPointX && collisionPointX >= lineEndX) {
					pointOfContactX = collisionPointX;
					pointOfContactY = collisionPointY + circle.r;
					pos = 'center';
				}
				else if(lineStartX < collisionPointX) {
					//it's to the right of the line, could be colliding with lineStartX
					var perpendicularSlope = -1 / circlePathSlope;
					var perpendicularLineAt0 = lineStartY - (perpendicularSlope * lineStartX);
					
					//find intersection, e.g.  x = (c - b) / (m - n)
					var intersectionX = (circlePathAt0 - perpendicularLineAt0) / (perpendicularSlope - circlePathSlope);
					var intersectionY = perpendicularSlope * intersectionX + perpendicularLineAt0;

					//move up the circle's path to the collision point
					var distX = intersectionX - lineStartX;
					var distY = intersectionY - lineStartY;
					var distOver = Math.sqrt(distX * distX + distY * distY);
					var distUp = Math.sqrt(circle.r * circle.r - distOver * distOver);
					var distUpX = distUp / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1);
					var distUpY = circlePathSlope * distUpX;
					collisionPointX = intersectionX + distUpX;
					collisionPointY = intersectionY + distUpY;

					pointOfContactX = lineStartX;
					pointOfContactY = lineStartY;
					pos = 'right';
				}
				else if(collisionPointX < lineEndX) {
					//it's to the left of the line, could be colliding with lineEndX
					var perpendicularSlope = -1 / circlePathSlope;
					var perpendicularLineAt0 = lineEndY - (perpendicularSlope * lineEndX);
					
					//find intersection, e.g.  x = (c - b) / (m - n)
					var intersectionX = (circlePathAt0 - perpendicularLineAt0) / (perpendicularSlope - circlePathSlope);
					var intersectionY = perpendicularSlope * intersectionX + perpendicularLineAt0;

					//move up the circle's path to the collision point
					var distX = intersectionX - lineEndX;
					var distY = (intersectionY - lineEndY);
					var distOver = Math.sqrt(distX * distX + distY * distY);
					var distUp = Math.sqrt(circle.r * circle.r - distOver * distOver);
					var distUpX = distUp / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1);
					var distUpY = circlePathSlope * distUpX;
					collisionPointX = intersectionX + distUpX;
					collisionPointY = intersectionY + distUpY;

					pointOfContactX = lineEndX;
					pointOfContactY = lineEndY;
					pos = 'left';
				}
				else {
					collisionPointX = null;
					collisionPointY = null;
					pointOfContactX = null;
					pointOfContactY = null;
				}

				if(circleVelY < 0) {
					collisionPointX = null;
					collisionPointY = null;
					pointOfContactX = null;
					pointOfContactY = null;
				}

				if(collisionPointX !== null && collisionPointY !== null) {
					var rotatedCollisionPointX = unrotateX(collisionPointX, collisionPointY);
					var rotatedCollisionPointY = unrotateY(collisionPointX, collisionPointY);
					var rotatedVelX = unrotateX(circleVelX, -circleVelY);
					var rotatedVelY = unrotateY(circleVelX, -circleVelY);

					//determine if collision point is on the current path
					//have to account for a bit of error here, hence the 0.005
					if((prevCircleX - 0.005 <= collisionPointX && collisionPointX <= circleX + 0.005) ||
						(circleX - 0.005 <= collisionPointX && collisionPointX <= prevCircleX + 0.005)) {
						//there was a collision!
						circle.x = rotatedCollisionPointX;
						circle.y = rotatedCollisionPointY;
						circle.suggestedVel.x = rotatedVelX;
						circle.suggestedVel.y = rotatedVelY;
						ret = pos;
					}
				}
				if(pointOfContactX !== null && pointOfContactY !== null) {
					var rotatedPointOfContactX = unrotateX(pointOfContactX, pointOfContactY);
					var rotatedPointOfContactY = unrotateY(pointOfContactX, pointOfContactY);
				}
				return ret;
			//}
		}

		//do this all the time
		var paused = false, collisions = 0;
		function everyFrame(ms) {
			var edge = false;
			if(!paused) {
				var slope, xDiff;
				var t = ms / 1000;
				collisions = 0;

				//move circle
				if(keys[KEY_MAP.W]) {
					circle.vel.y -= 100 * t;
				}
				if(keys[KEY_MAP.A]) {
					circle.vel.x -= 100 * t;
				}
				if(keys[KEY_MAP.S]) {
					circle.vel.y += 100 * t;
				}
				if(keys[KEY_MAP.D]) {
					circle.vel.x += 100 * t;
				}
				if(keys[KEY_MAP.SHIFT]) {
					circle.vel.x *= 1.10;
					circle.vel.y *= 1.10;
				}

				//apply velocity
				circle.prev.x = circle.x;
				circle.prev.y = circle.y;
				circle.x += circle.vel.x * t;
				circle.y += circle.vel.y * t;

				//check for collisions
				for(var i = 0; i < lines.length; i++) {
					var collision = handleCollision(circle, lines[i]);
					edge = edge || (collision === 'left') || (collision === 'right');
					collisions += collision ? 1 : 0;
				}

				if(circle.suggestedVel.x !== null && circle.suggestedVel.y !== null) {
					circle.vel.x = circle.suggestedVel.x;
					circle.vel.y = circle.suggestedVel.y;
				}
			}
			//draw background
			if(!echosEnabled) {
				ctx.fillStyle = '#fff';
				ctx.fillRect(0, 0, width, height);
			}

			//draw lines
			for(i = 0; i < lines.length; i++) {
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(lines[i].start.x, lines[i].start.y);
				ctx.lineTo(lines[i].end.x, lines[i].end.y);
				slope = (lines[i].start.y - lines[i].end.y) / ((lines[i].start.x - lines[i].end.x) || 0.001);
				xDiff = 20;
				if(lines[i].start.x <= lines[i].end.x && lines[i].start.y <= lines[i].end.y) {
					xDiff *= -1;
				}
				else if(lines[i].start.x > lines[i].end.x && lines[i].start.y < lines[i].end.y) {
					xDiff *= -1;
				}
				ctx.moveTo((lines[i].start.x + lines[i].end.x) / 2, (lines[i].start.y + lines[i].end.y) / 2);
				ctx.lineTo((lines[i].start.x + lines[i].end.x) / 2 - xDiff,
					(lines[i].start.y + lines[i].end.y) / 2 + xDiff / (slope || 0.001));
				ctx.stroke();
			}

			//draw line being created
			if(newLineStart) {
				ctx.strokeStyle = '#999';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(newLineStart.x, newLineStart.y);
				ctx.lineTo(mouse.x, mouse.y);
				slope = (newLineStart.y - mouse.y) / ((newLineStart.x - mouse.x) || 0.001);
				xDiff = 20;
				if(newLineStart.x <= mouse.x && newLineStart.y <= mouse.y) {
					xDiff *= -1;
				}
				else if(newLineStart.x > mouse.x && newLineStart.y < mouse.y) {
					xDiff *= -1;
				}
				ctx.moveTo((newLineStart.x + mouse.x) / 2, (newLineStart.y + mouse.y) / 2);
				ctx.lineTo((newLineStart.x + mouse.x) / 2 - xDiff,
					(newLineStart.y + mouse.y) / 2 + xDiff / (slope || 0.001));
				ctx.stroke();
			}

			//draw circle
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 0.5;
			ctx.fillStyle = (edge ? '#990' : (collisions > 1 ? '#900' : '#090'));
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
	};
});