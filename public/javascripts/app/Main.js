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
		var grapples = [];
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
		createPoly([1300,1315, 1260,1250, 1300,1340,  1340,1250]);
		createPoly([1400,1300, 1360,1250, 1400,1320,  1440,1250]);
		createPoly([1500,1285, 1460,1250, 1500,1320,  1540,1250]);
		createPoly([1600,1270, 1560,1250, 1600,1320,  1640,1250]);
		createPoly([1600,1100, 1560,1150, 1600,1080,  1640,1150], true);

		//add input bindings
		var keys = { pressed: {} };
		var KEY = { W: 87, A: 65, S: 83, D: 68, R: 82, G: 71, SHIFT: 16, SPACE: 32 };
		var JUMP_KEY = KEY.SPACE;
		var BREAK_GRAPPLES_KEY = KEY.R;
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
				keys.pressed[evt.which] = true;
				if(evt.which === BREAK_GRAPPLES_KEY) {
					for(var i = 0; i < grapples.length; i++) {
						grapples[i].kill();
					}
				}
			}
		});
		$(document).on('keyup', function(evt) {
			if(keys[evt.which]) {
				keys[evt.which] = false;
				keys.pressed[evt.which] = false;
			}
		});
		$(document).on('mousedown', function(evt) {
			grapples.push(player.shootGrapple(evt.clientX + camera.x, evt.clientY + camera.y));
		});

		function everyFrame(ms) {
			tick(ms);
			camera.x = player.pos.x - width / 2;
			camera.y = player.pos.y - height / 2;
			render();
		}

		var interruptionsLastFrame = [];
		function tick(ms) {
			var i, j, interruption, friction = 1;
			for(i = 0; i < grapples.length; i++) {
				grapples[i].tick(ms, friction);
				if(!grapples[i].isDead && !grapples[i].isLatched) {
					var earliestGrappleCollision = null;
					for(j = 0; j < obstacles.length; j++) {
						var collision = obstacles[j].checkForCollisionWithMovingPoint(grapples[i]);
						if(collision && (!earliestGrappleCollision || earliestGrappleCollision.distPreContact > collision.distPreContact)) {
							earliestGrappleCollision = collision;
						}
					}
					if(earliestGrappleCollision) {
						grapples[i].latchTo(earliestGrappleCollision.posOnContact.x, earliestGrappleCollision.posOnContact.y);
					}
				}
			}
			player.applyForce(0, 0);//600); //gravity
			if(keys[KEY.A]) { player.applyForce(-400, 0); }
			if(keys[KEY.D]) { player.applyForce(400, 0); }
			if(keys[KEY.W]) { player.applyForce(0, -400); }
			if(keys[KEY.S]) { player.applyForce(0, 400); }
			if(keys.pressed[JUMP_KEY]) {
				for(i = 0; i < interruptionsLastFrame.length; i++) {
					interruption = interruptionsLastFrame[i];
					if(interruption.interruptionType === 'collision') {
						keys.pressed[JUMP_KEY] = false;
						player.jump(interruption.jumpDir.x, interruption.jumpDir.y);
						break;
					}
				}
			}
			player.tick(ms, friction);
			var interruptionsThisFrame = [];
			interruption = null;
			for(i = 0; i <= 6; i++) {
				if(i === 6) {
					interruption = {
						interruptionType: 'limit',
						posOnContact: { x: player.pos.prev.x, y: player.pos.prev.y },
						posAfterContact: { x: player.pos.prev.x, y: player.pos.prev.y },
						velAfterContact: { x: 0, y: 0 }
					};
				}
				else {
					interruption = findInterruption(interruptionsThisFrame);
				}
				if(interruption) {
					interruptionsThisFrame.push(interruption);
					player.pos.x = interruption.posAfterContact.x;
					player.pos.y = interruption.posAfterContact.y;
					player.pos.prev.x = interruption.posOnContact.x;
					player.pos.prev.y = interruption.posOnContact.y;
					player.vel.x = interruption.velAfterContact.x;
					player.vel.y = interruption.velAfterContact.y;
					if(interruption.handle) {
						interruption.handle();
					}
				}
				else {
					break;
				}
			}
			interruptionsLastFrame = interruptionsThisFrame;
		}

		function findInterruption(prevInterruptions) {
			var i, j, earliestInterruption = null;
			var points = [];
			var prevInterruption = (prevInterruptions.length > 0 ? prevInterruptions[prevInterruptions.length - 1] : null);
			for(i = 0; i < obstacles.length; i++) {
				var collision = obstacles[i].checkForCollisionWithMovingCircle(player);
				if(collision && (!earliestInterruption || earliestInterruption.distPreContact > collision.distPreContact) &&
					(!prevInterruption || prevInterruption.interruptionType !== 'collision' || !prevInterruption.obstacle.sameAs(collision.obstacle))) {
					collision.interruptionType = 'collision';
					earliestInterruption = collision;
				}
				if(obstacles[i].type === 'point') {
					points.push(obstacles[i]);
				}
			}
			for(i = 0; i < grapples.length; i++) {
				var violation = grapples[i].checkForMaxTether();
				if(violation && (!earliestInterruption || earliestInterruption.distPreContact > violation.distPreContact) &&
					(!prevInterruption || prevInterruption.interruptionType !== 'grapple' || !prevInterruption.grapple.sameAs(violation.grapple))) {
					violation.interruptionType = 'grapple';
					earliestInterruption = violation;
				}
				violation = grapples[i].checkForWrappingAroundPoints(points);
				if(violation && (!earliestInterruption || earliestInterruption.distPreContact > violation.distPreContact)) {
					violation.interruptionType = 'wrap';
					earliestInterruption = violation;
				}
			}
			return earliestInterruption;
		}

		function render() {
			var i;
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);
			for(i = 0; i < grapples.length; i++) {
				grapples[i].render(ctx, camera);
			}
			player.render(ctx, camera);
			for(i = 0; i < obstacles.length; i++) {
				obstacles[i].render(ctx, camera);
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