if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'Constants',
	'Player',
	'Level'
], function(
	Constants,
	Player,
	Level
) {
	//create stuff
	var player = new Player(1000, 1000);
	var camera = { x: player.pos.x, y: player.pos.y };
	var grapples = [];
	var level = new Level();
	var jumpPressed = false;
	var moveDir = { x: 0, y: 0 };

	var interruptionsLastFrame = [];

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

	return {
		reset: function() {

		},
		tick: function(t) {
			var i, j, interruption, friction = 1;

			//move/latch grapples
			for(i = 0; i < grapples.length; i++) {
				grapples[i].tick(t * 1000, friction);
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
			player.applyForce(moveDir.x * 400, moveDir.y * 400);
			/*if(jumpPressed) {
				var jumpableObstacles = findJumpableInterruptions();
				if(jumpableObstacles.length === 1) {
					jumpPressed = true;
					player.jump(jumpableObstacles[0].jumpDir.x, jumpableObstacles[0].jumpDir.y);
				}
			}*/
			player.tick(t * 1000, friction);

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
					if(interruption.interruptionType === 'collision' && jumpPressed) {
						jumpPressed = false;
						player.jump(interruption.jumpDir.x, interruption.jumpDir.y);
					}
				}
				else {
					break;
				}
			}
			if(jumpPressed) {
				var jumpables = findJumpableInterruptions();
				if(jumpables.length > 0) {
					jumpPressed = false;
					player.jump(jumpables[0].jumpDir);
				}
			}
			interruptionsLastFrame = interruptionsThisFrame;
		},
		render: function(ctx) {
			camera.x = player.pos.x - Constants.WIDTH / 2;
			camera.y = player.pos.y - Constants.HEIGHT / 2;
			ctx.fillStyle = (interruptionsLastFrame.length >= 99 ? '#ff0' : '#f5f5f5');
			ctx.fillRect(0, 0, Constants.WIDTH, Constants.HEIGHT);
			level.render(ctx, camera);
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].render(ctx, camera);
			}
			player.render(ctx, camera);
		},
		onMouseEvent: function(evt) {
			if(evt.type === 'mousedown') {
				grapples.push(player.shootGrapple(evt.x + camera.x, evt.y + camera.y));
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(evt.key === 'CUT_GRAPPLES' && evt.isDown) {
				for(var i = 0; i < grapples.length; i++) {
					grapples[i].kill();
				}
			}
			else if(evt.key === 'JUMP' && evt.isDown) {
				jumpPressed = true;
			}
			else if(evt.key === 'MOVE_LEFT') {
				moveDir.x = (evt.isDown ? -1 : (keyboard.MOVE_RIGHT ? 1 : 0));
			}
			else if(evt.key === 'MOVE_RIGHT') {
				moveDir.x = (evt.isDown ? 1 : (keyboard.MOVE_LEFT ? -1 : 0));
			}
			else if(evt.key === 'MOVE_UP') {
				moveDir.y = (evt.isDown ? -1 : (keyboard.MOVE_DOWN ? 1 : 0));
			}
			else if(evt.key === 'MOVE_DOWN') {
				moveDir.y = (evt.isDown ? 1 : (keyboard.MOVE_UP ? -1 : 0));
			}
		}
	};
});