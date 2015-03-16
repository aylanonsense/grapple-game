define([
	'Constants',
	'entity/PlayerEntity',
	'level/Level'
], function(
	Constants,
	PlayerEntity,
	Level
) {
	var BOUNCE_AMOUNT = 0.0001;
	var camera, level, player, grapples, shouldPullGrapples;

	function checkforCollisions(circle) {
		var prevCauses = [];
		var collisionsThisFrame = 0;
		for(var i = 0; i < 6; i++) {
			var collision = level.checkForCollisionWithMovingCircle(circle, BOUNCE_AMOUNT);
			for(var j = 0; j < grapples.length; j++) {
				var grappleCollision = grapples[j].checkForCollisionWithMovingCircle(circle);
				if(grappleCollision && (!collision || grappleCollision.distTraveled < collision.distTraveled)) {
					collision = grappleCollision;
				}
			}
			if(collision) {
				collisionsThisFrame++;
				circle.handleCollision(collision);
				if(collision.cause.sameAsAny(prevCauses)) {
					if(!collision.cause.sameAs(prevCauses[prevCauses.length - 1])) {
						circle.pos.copy(circle.prevPos);
						circle.vel.zero();
					}
					break;
				}
				else {
					prevCauses.push(collision.cause);
				}
			}
			else {
				break;
			}
		}
		if(collisionsThisFrame > 1) {
			// console.log(collisionsThisFrame + " collisions this frame");
		}
	}

	return {
		reset: function() {
			//render vars
			camera = { x: 0, y: 0 };

			//input vars
			shouldPullGrapples = false;

			//game vars
			level = new Level();
			player = new PlayerEntity(337, 300);
			grapples = [];

			//create level geometry
			var pts = [[20,450, 200,450, 200,420, 215,420, 215,450, 300,450, 300,390, 375,390,
				450,360, 500,360, 600,500, 700,500, 700,150, 780,150, 780,580, 20,580, 20,450],
				[125,200, 250,200, 250,220, 125,220, 125,200],
				[450,50, 500,50, 500,100, 450,100, 450,50],
				[750,-10, 1000,-30]];
			for(i = 0; i < pts.length; i++) {
				for(var j = 0; j < pts[i].length - 2; j += 2) {
					level.addLine(pts[i][j + 0], pts[i][j + 1], pts[i][j + 2], pts[i][j + 3]);
				}
			}
			level.addLine(500, 200, 400, 200, { collidesWithPlayer: false });
			level.addLine(300, 200, 400, 200, { collidesWithGrapple: false });
			level.addLine(325, 150, 425, 150, { collidesWithGrapple: false, jumpable: false });
			level.addLine(425, 150, 525, 150, { jumpable: false });
			level.addLine(525, 150, 625, 150, { collidesWithGrapple: false, collidesWithPlayer: false });
		},
		tick: function(t) {
			//start of frame
			player.startOfFrame(t);
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].startOfFrame(t);
			}

			//update entities
			player.tick(t);
			for(i = 0; i < grapples.length; i++) {
				grapples[i].tick(t);
			}

			//check for collisions
			checkforCollisions(player);
			for(i = 0; i < grapples.length; i++) {
				if(!grapples[i].isLatched) {
					var collision = level.checkForCollisionWithMovingCircle(grapples[i]);
					if(collision) {
						grapples[i].handleCollision(collision);
					}
				}
			}

			//end of frame
			player.endOfFrame(t);
			for(i = 0; i < grapples.length; i++) {
				grapples[i].endOfFrame(t);
			}
		},
		render: function(ctx) {
			//move camera
			camera.x = player.pos.x - Constants.WIDTH / 2;
			camera.y = player.pos.y - Constants.HEIGHT / 2;

			//blank canvas
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, Constants.WIDTH, Constants.HEIGHT);

			//render level geometry
			level.render(ctx, camera);

			//render entities
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].render(ctx, camera);
			}
			player.render(ctx, camera);
		},
		onMouseEvent: function(evt) {
			if(evt.type === 'mousedown') {
				var grapple = player.shootGrapple(evt.x + camera.x, evt.y + camera.y)
				grapples = [ grapple ];
				if(shouldPullGrapples) {
					grapple.startPulling();
				}
			}
			else if(evt.type === 'mouseup') {
				grapples = [];
			}
		},
		onKeyboardEvent: function(evt, keyboard) {
			if(evt.key === 'MOVE_LEFT') {
				player.moveDir.x = (evt.isDown ? -1 : (keyboard.MOVE_RIGHT ? 1 : 0));
			}
			else if(evt.key === 'MOVE_RIGHT') {
				player.moveDir.x = (evt.isDown ? 1 : (keyboard.MOVE_LEFT ? -1 : 0));
			}
			else if(evt.key === 'JUMP' && evt.isDown) {
				player.jump();
			}
			else if(evt.key === 'JUMP' && !evt.isDown) {
				player.endJump();
			}
			else if(evt.key === 'PULL_GRAPPLES' && evt.isDown) {
				shouldPullGrapples = true;
				for(var i = 0; i < grapples.length; i++) {
					grapples[i].startPulling();
				}
			}
			else if(evt.key === 'PULL_GRAPPLES' && !evt.isDown) {
				shouldPullGrapples = false;
				for(var i = 0; i < grapples.length; i++) {
					grapples[i].stopPulling();
				}
			}
		}
	};
});