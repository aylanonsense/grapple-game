if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/Player',
	'app/Level'
], function(
	$,
	Player,
	Level
) {
	return function() {
		//canvas
		var width = 800, height = 600, isPaused = false;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		//create stuff
		var player = new Player(1000, 1000);
		var camera = { x: player.pos.x, y: player.pos.y };
		var grapples = [];
		var level = new Level();

		//add input bindings
		var keys = { pressed: {} };
		var KEY = { W: 87, A: 65, S: 83, D: 68, R: 82, G: 71, SHIFT: 16, SPACE: 32 };
		var JUMP_KEY = KEY.SPACE;
		var BREAK_GRAPPLES_KEY = KEY.R;
		var PAUSE_KEY = KEY.SHIFT;
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
				keys.pressed[evt.which] = true;
				if(evt.which === BREAK_GRAPPLES_KEY) {
					for(var i = 0; i < grapples.length; i++) {
						grapples[i].kill();
					}
				}
				if(evt.which === PAUSE_KEY) {
					isPaused = !isPaused;
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
			if(!isPaused) {
				tick(ms);
				camera.x = player.pos.x - width / 2;
				camera.y = player.pos.y - height / 2;
			}
			render();
		}

		var interruptionsLastFrame = [];
		function tick(ms) {
			var i, j, interruption, friction = 1;
			for(i = 0; i < grapples.length; i++) {
				grapples[i].tick(ms, friction);
				if(!grapples[i].isDead && !grapples[i].isLatched) {
					var earliestGrappleCollision = null;
					for(j = 0; j < level.obstacles.length; j++) {
						var collision = level.obstacles[j].checkForCollisionWithMovingPoint(grapples[i]);
						if(collision && (!earliestGrappleCollision || earliestGrappleCollision.distPreContact > collision.distPreContact)) {
							earliestGrappleCollision = collision;
						}
					}
					if(earliestGrappleCollision) {
						grapples[i].latchTo(earliestGrappleCollision.posOnContact.x, earliestGrappleCollision.posOnContact.y);
					}
				}
			}
			player.applyForce(0, 600); //gravity
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
			for(i = 0; i <= 100; i++) {
				if(i === 100) {
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
					player.adjustMovement(interruption.posOnContact, interruption.posAfterContact, interruption.velAfterContact);
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
			for(i = 0; i < level.obstacles.length; i++) {
				var collision = level.obstacles[i].checkForCollisionWithMovingCircle(player);
				if(collision && (!earliestInterruption || earliestInterruption.distPreContact > collision.distPreContact) &&
					(!prevInterruption || prevInterruption.interruptionType !== 'collision' || !prevInterruption.obstacle.sameAs(collision.obstacle))) {
					collision.interruptionType = 'collision';
					earliestInterruption = collision;
				}
				if(level.obstacles[i].type === 'point') {
					points.push(level.obstacles[i]);
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
			ctx.fillStyle = (interruptionsLastFrame.length >= 99 ? '#ff0' : '#fff');
			ctx.fillRect(0, 0, width, height);
			level.render(ctx, camera);
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].render(ctx, camera);
			}
			player.render(ctx, camera);
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