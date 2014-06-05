if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/PhysObj',
	'app/collision/HitRect'
], function(
	$,
	PhysObj,
	HitRect
) {
	return function() {
		//set up canvas
		var width = 800, height = 600;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		var circle = {
			x: 70,
			y: 250,
			oldX: null,
			oldY: null,
			radius: 50,
			vel: { x: 100, y: 20 }
		};

		var line = {
			start: { x: 380, y: 350 },
			end: { x: 300, y: 500 }
		};

		var ballColor = '#f00';
		function doIt(t) {
			var m = 7;
			var n = 150;
			var p = 70;


			//move circle
			circle.oldX = circle.x;
			circle.oldY = circle.y;
			circle.x += circle.vel.x * t;
			circle.y += circle.vel.y * t;

			//get angle of plane
			var lineDeltaX = line.end.x - line.start.x;
			var lineDeltaY = line.end.y - line.start.y;
			var angle = Math.atan2(lineDeltaY, lineDeltaX);

			function rotate(x, y) {
				return x * -Math.cos(angle) - y * Math.sin(angle);
			}
			function rotate2(x, y) {
				return x * Math.sin(angle) - y * Math.cos(angle);
			}
			function unrotate(x, y) {
				return x * -Math.cos(angle) + y * Math.sin(angle);
			}
			function unrotate2(x, y) {
				return x * -Math.sin(angle) + y * -Math.cos(angle);
			}

			//transform line to use rotated coordinates
			var lineStartX = rotate(line.start.x, line.start.y);
			var lineStartY = rotate2(line.start.x, line.start.y);
			var lineEndX = rotate(line.end.x, line.end.y);
			var lineEndY = rotate2(line.end.x, line.end.y);

			//transform circle to use rotated coordinates
			var circleRadius = circle.radius;
			var oldCircleX = rotate(circle.oldX, circle.oldY);
			var oldCircleY = rotate2(circle.oldX, circle.oldY);
			var circleX = rotate(circle.x, circle.y);
			var circleY = rotate2(circle.x, circle.y);

			var circleVelY = rotate2(circle.vel.x, circle.vel.y);

			//calculate the collision point
			var circlePathChangeInY = circleY - oldCircleY; //TODO don't assume change in y is non-0
			var circlePathChangeInX = circleX - oldCircleX;
			var circlePathSlope = circlePathChangeInY / circlePathChangeInX;
			var circlePathAt0 = circleY - circleX * circlePathSlope;
			var collisionPointY = lineStartY - circleRadius;
			var collisionPointX = (collisionPointY - circlePathAt0) / circlePathSlope;

			var pointOfContactX = null;
			var pointOfContactY = null;

			//determine if collision point is above the line segment
			if(lineStartX >= collisionPointX && collisionPointX >= lineEndX) {
				pointOfContactX = collisionPointX;
				pointOfContactY = collisionPointY + circleRadius;
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
				var distUp = Math.sqrt(circleRadius * circleRadius - distOver * distOver);
				var distUpX = distUp / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1);
				var distUpY = circlePathSlope * distUpX;
				collisionPointX = intersectionX + distUpX;
				collisionPointY = intersectionY + distUpY;

				//drawing line extension
				ctx.strokeStyle = '#00f';
				ctx.lineWidth = 0.5;
				ctx.beginPath();
				ctx.moveTo(lineStartX / m + n, lineStartY / m + p);
				ctx.lineTo((lineStartX + 200) / m + n, (lineStartY + 200 * perpendicularSlope) / m + p);
				ctx.stroke();

				pointOfContactX = lineStartX;
				pointOfContactY = lineStartY;
			}
			else if(collisionPointX < lineEndX) {
				console.log("LEFT");
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
				var distUp = Math.sqrt(circleRadius * circleRadius - distOver * distOver);
				var distUpX = distUp / Math.sqrt(1 + circlePathSlope * circlePathSlope) * (circlePathSlope < 0 ? 1 : -1);
				var distUpY = circlePathSlope * distUpX;
				collisionPointX = intersectionX + distUpX;
				collisionPointY = intersectionY + distUpY;

				//drawing line extension
				ctx.strokeStyle = '#00f';
				ctx.lineWidth = 0.5;
				ctx.beginPath();
				ctx.moveTo(lineEndX / m + n, lineEndY / m + p);
				ctx.lineTo((lineEndX - 200) / m + n, (lineEndY - 200 * perpendicularSlope) / m + p);
				ctx.stroke();

				pointOfContactX = lineEndX;
				pointOfContactY = lineEndY;
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
				var rotatedCollisionPointX = unrotate(collisionPointX, collisionPointY);
				var rotatedCollisionPointY = unrotate2(collisionPointX, collisionPointY);

				//determine if collision point is on the current path
				//have to account for a bit of error here, hence the 0.005
				if((oldCircleX - 0.005 <= collisionPointX && collisionPointX <= circleX + 0.005) ||
					(circleX - 0.005 <= collisionPointX && collisionPointX <= oldCircleX + 0.005)) {
					//there was a collision!
					ballColor = '#0f0';
					circle.x = rotatedCollisionPointX;
					circle.y = rotatedCollisionPointY;
					circleX = collisionPointX;
					circleY = collisionPointY;
				}
			}
			if(pointOfContactX !== null && pointOfContactY !== null) {
				var rotatedPointOfContactX = unrotate(pointOfContactX, pointOfContactY);
				var rotatedPointOfContactY = unrotate2(pointOfContactX, pointOfContactY);
			}


			if(collisionPointX !== null && collisionPointY !== null) {
				//draw collision point
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo((collisionPointX - 10) / m + n, (collisionPointY - 10) / m + p);
				ctx.lineTo((collisionPointX + 10) / m + n, (collisionPointY + 10) / m + p);
				ctx.moveTo((collisionPointX + 10) / m + n, (collisionPointY - 10) / m + p);
				ctx.lineTo((collisionPointX - 10) / m + n, (collisionPointY + 10) / m + p);
				ctx.stroke();

				//draw actual collision point
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo((rotatedCollisionPointX - 10), (rotatedCollisionPointY - 10));
				ctx.lineTo((rotatedCollisionPointX + 10), (rotatedCollisionPointY + 10));
				ctx.moveTo((rotatedCollisionPointX + 10), (rotatedCollisionPointY - 10));
				ctx.lineTo((rotatedCollisionPointX - 10), (rotatedCollisionPointY + 10));
				ctx.stroke();
			}

			if(pointOfContactX !== null && pointOfContactY !== null) {
				//draw point of contact
				ctx.strokeStyle = '#0ff';
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo((pointOfContactX - 10) / m + n, (pointOfContactY - 10) / m + p);
				ctx.lineTo((pointOfContactX + 10) / m + n, (pointOfContactY + 10) / m + p);
				ctx.moveTo((pointOfContactX + 10) / m + n, (pointOfContactY - 10) / m + p);
				ctx.lineTo((pointOfContactX - 10) / m + n, (pointOfContactY + 10) / m + p);
				ctx.stroke();

				//draw actual point of contact
				ctx.strokeStyle = '#0ff';
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo((rotatedPointOfContactX - 10), (rotatedPointOfContactY - 10));
				ctx.lineTo((rotatedPointOfContactX + 10), (rotatedPointOfContactY + 10));
				ctx.moveTo((rotatedPointOfContactX + 10), (rotatedPointOfContactY - 10));
				ctx.lineTo((rotatedPointOfContactX - 10), (rotatedPointOfContactY + 10));
				ctx.stroke();
			}

			//draw new mini circle
			ctx.fillStyle = ballColor;
			ctx.beginPath();
			ctx.arc(circleX / m + n, circleY / m + p, circleRadius / m, 0, 2 * Math.PI, false);
			ctx.fill();

			//draw old circle
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 0.5;
			ctx.beginPath();
			ctx.arc(oldCircleX / m + n, oldCircleY / m + p, circleRadius / m, 0, 2 * Math.PI, false);
			ctx.stroke();

			//draw circle movement
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 0.5;
			ctx.beginPath();
			ctx.moveTo(oldCircleX / m + n, oldCircleY / m + p);
			ctx.lineTo(circleX / m + n, circleY / m + p);
			ctx.stroke();

			//draw line
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(lineStartX / m + n, lineStartY / m + p);
			ctx.lineTo(lineEndX / m + n, lineEndY / m + p);
			ctx.stroke();
		}

		//do this all the time
		var z = 0;
		var cumulativeMS = 0;
		var framesPerFrame = 70;
		function everyFrame(ms) {
			var i, collision;
			if(z++ % framesPerFrame === 0) {
				ms += cumulativeMS;
				cumulativeMS = 0;
				var t = ms / 1000;

				//draw background
				ctx.fillStyle = '#fff';
				ctx.fillRect(0, 0, width, height);

				//do the fancy physics
				doIt(t);

				//draw new circle
				ctx.fillStyle = ballColor;
				ctx.beginPath();
				ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
				ctx.fill();

				//draw old circle
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.arc(circle.oldX, circle.oldY, circle.radius, 0, 2 * Math.PI, false);
				ctx.stroke();

				//draw circle movement
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(circle.oldX, circle.oldY);
				ctx.lineTo(circle.x, circle.y);
				ctx.stroke();

				//draw line
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.moveTo(line.start.x, line.start.y);
				ctx.lineTo(line.end.x, line.end.y);
				ctx.stroke();
			}
			else {
				cumulativeMS += ms;
			}
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