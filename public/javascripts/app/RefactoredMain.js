if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/Player',
	'app/Point',
	'app/Line'
], function(
	$,
	Player,
	Point,
	Line
) {
	return function() {
		//canvas
		var width = 800, height = 600;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		//create stuff
		var player = new Player(1000, 1000);
		var camera = { x: player.pos.x, y: player.pos.y };
		var obstacles = [];
		function createPoly(points, reverse) {
			var i, line, point, lines = [];
			if(reverse) {
				var reversedPoints = [];
				for(i = 0; i < points.length; i += 2) {
					reversedPoints[i] = points[points.length - i - 2];
					reversedPoints[i+1] = points[points.length - i - 1];
				}
				points = reversedPoints;
			}
			//create the lines
			for(i = 0; i < points.length - 2; i += 2) {
				line = new Line(points[i], points[i + 1], points[i + 2], points[i + 3]);
				lines.push(line);
				obstacles.push(line);
			}
			line = new Line(points[points.length - 2], points[points.length - 1], points[0], points[1]);
			lines.push(line);
			obstacles.push(line);
			//create the points
			for(i = 0; i < lines.length - 1; i++) {
				point = new Point(lines[i].end.x, lines[i].end.y);
				point.addParent(lines[i]);
				point.addParent(lines[i + 1]);
				obstacles.push(point);
			}
			point = new Point(lines[0].start.x, lines[0].start.y);
			point.addParent(lines[0]);
			point.addParent(lines[lines.length - 1]);
			obstacles.push(point);
		}
		createPoly([900,1100,  1100,1100, 1100,1110,  900,1110],  true);
		createPoly([600,1210,  600,1220,  710,1220,   710,1210]);
		createPoly([1300,900,  1400,1000, 1300,1000], true);
		createPoly([1500,900,  1510,900,  1510,600,   1500,600]);
		createPoly([1600,860,  1590,860,  1590,600,   1600,600], true);
		createPoly([980,1220,  900,1180,  900,1170,   1100,1170, 1100,1180, 1020,1220], true);
		createPoly([200,1510,  200,1500,  2000,1500,  2000,1510],  true);

		//add key bindings
		var keys = {};
		var KEY = { W: 87, A: 65, S: 83, D: 68, R: 82, G: 71, SHIFT: 16, SPACE: 32 };
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
			}
		});
		$(document).on('keyup', function(evt) {
			if(keys[evt.which]) {
				keys[evt.which] = false;
			}
		});

		function everyFrame(ms) {
			//do stuff
			tick(ms);

			//move camera
			camera.x = player.pos.x - width / 2;
			camera.y = player.pos.y - height / 2;

			//render
			render();
		}

		function tick(ms) {
			var friction = 1;
			player.applyForce(0, 600); //gravity
			if(keys[KEY.A]) { player.applyForce(-400, 0); }
			if(keys[KEY.D]) { player.applyForce(400, 0); }
			if(keys[KEY.W]) { player.applyForce(0, -400); }
			if(keys[KEY.S]) { player.applyForce(0, 400); }
			player.tick(ms, friction);
			for(var i = 0; i < 5; i++) {
				var interruption = findInterruption();
				if(interruption) {
					player.pos.x = interruption.posAfterContact.x;
					player.pos.y = interruption.posAfterContact.y;
					player.pos.prev.x = interruption.posOnContact.x;
					player.pos.prev.y = interruption.posOnContact.y;
					player.vel.x = interruption.velAfterContact.x;
					player.vel.y = interruption.velAfterContact.y;
				}
				else {
					break;
				}
			}
		}

		function findInterruption() {
			//find any interruptions
			var earliestInterruption = null;
			obstacles.forEach(function(o) {
				var collision = o.checkForCollision(player);
				if(collision) {
					if(!earliestInterruption || earliestInterruption.distPreContact > collision.distPreContact) {
						collision.interruptionType = 'collision';
						earliestInterruption = collision;
					}
				}
			});
			return earliestInterruption;
		}

		function render() {
			//draw background
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			//draw player
			ctx.fillStyle = '#6c6';
			ctx.beginPath();
			ctx.arc(player.pos.x - camera.x, player.pos.y - camera.y, player.radius, 0, 2 * Math.PI, false);
			ctx.fill();

			//draw obstacles
			ctx.fillStyle = '#000';
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1;
			obstacles.forEach(function(o) {
				if(o.type === 'line') {
					ctx.beginPath();
					ctx.moveTo(o.start.x - camera.x, o.start.y - camera.y);
					ctx.lineTo(o.end.x - camera.x, o.end.y - camera.y);
					var pipAngle = Math.atan2((o.start.x - o.end.x), (o.end.y - o.start.y));
					ctx.moveTo((o.start.x + o.end.x) / 2 - camera.x, (o.start.y + o.end.y) / 2 - camera.y);
					ctx.lineTo((o.start.x + o.end.x) / 2 + 10 * Math.cos(pipAngle) - camera.x, (o.start.y + o.end.y) / 2 + 10 * Math.sin(pipAngle) - camera.y);
					ctx.stroke();
				}
				else if(o.type === 'point') {
					ctx.beginPath();
					ctx.arc(o.x - camera.x, o.y - camera.y, 1.5, 0, 2 * Math.PI, false);
					ctx.fill();
				}
			});
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