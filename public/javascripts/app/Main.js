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

			//move/latch grapples
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

			//move player
			player.applyForce(0, 600); //gravity
			if(keys[KEY.A]) { player.applyForce(-400, 0); }
			if(keys[KEY.D]) { player.applyForce(400, 0); }
			if(keys[KEY.W]) { player.applyForce(0, -400); }
			if(keys[KEY.S]) { player.applyForce(0, 400); }
			/*if(keys.pressed[JUMP_KEY]) {
				var jumpableObstacles = findJumpableInterruptions();
				if(jumpableObstacles.length === 1) {
					keys.pressed[JUMP_KEY] = true;
					player.jump(jumpableObstacles[0].jumpDir.x, jumpableObstacles[0].jumpDir.y);
				}
			}*/
			player.tick(ms, friction);

			//revise player movement to account for interruptions
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
					//jump off of obstacles!
					if(interruption.interruptionType === 'collision' && keys.pressed[JUMP_KEY]) {
						keys.pressed[JUMP_KEY] = false;
						player.jump(interruption.jumpDir.x, interruption.jumpDir.y);
					}
				}
				else {
					break;
				}
			}
			if(keys.pressed[JUMP_KEY]) {
				var jumpables = findJumpableInterruptions();
				if(jumpables.length > 0) {
					keys.pressed[JUMP_KEY] = false;
					player.jump(jumpables[0].jumpDir);
				}
			}
			interruptionsLastFrame = interruptionsThisFrame;
		}

		function findInterruption(prevInterruptions) {
			var i, j, interruption, interruptionsThisFrame = [];
			var points = [];
			var prevInterruption = (prevInterruptions.length > 0 ? prevInterruptions[prevInterruptions.length - 1] : null);
			for(i = 0; i < level.obstacles.length; i++) {
				interruption = level.obstacles[i].checkForCollisionWithMovingCircle(player);
				if(interruption) {
					interruption.interruptionType = 'collision';
					interruption.interruptPriority = 9;
					interruptionsThisFrame.push(interruption);
				}
				if(level.obstacles[i].type === 'point') {
					points.push(level.obstacles[i]);
				}
			}
			for(i = 0; i < grapples.length; i++) {
				interruption = grapples[i].checkForMaxTether();
				if(interruption) {
					interruption.interruptionType = 'tether';
					interruption.interruptPriority = 3;
					interruptionsThisFrame.push(interruption);
				}
				/*interruption = grapples[i].checkForWrappingAroundPoints(points);
				if(interruption) {
					interruption.interruptionType = 'wrap';
					interruption.interruptPriority = 5;
					interruptionsThisFrame.push(interruption);
				}
				interruption = grapples[i].checkForUnwrapping();
				if(interruption) {
					interruption.interruptionType = 'unwrap';
					interruption.interruptPriority = 7;
					interruptionsThisFrame.push(interruption);
				}*/
			}
			interruptionsThisFrame.sort(function(a, b) {
				return (a.distPreContact === b.distPreContact ?
					b.interruptPriority - a.interruptPriority :
					a.distPreContact - b.distPreContact);
			});
			for(i = 0; i < interruptionsThisFrame.length; i++) {
				interruption = interruptionsThisFrame[i];
				if(!prevInterruption || interruption.interruptionType !== prevInterruption.interruptionType ||
					!interruption.actor || interruption.actor !== prevInterruption.actor) {
					return interruption;
				}
			}
			return null;
		}

		function findJumpableInterruptions() {
			var jumpableInterruptions = [];
			for(var i = 0; i < level.obstacles.length; i++) {
				var interruption = level.obstacles[i].checkForNearCircle(player);
				if(interruption) {
					jumpableInterruptions.push(interruption);
				}
			}
			return jumpableInterruptions;
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