define([
	'Constants',
	'entity/PlayerEntity',
	'level/Level'
], function(
	Constants,
	PlayerEntity,
	Level
) {
	var camera, level, player, grapples, shouldPullGrapples;

	function checkforCollisions(circle) {
		var prevCauses = [];
		var collisionsThisFrame = 0;
		var collisionString = "";
		for(var i = 0; i < 6; i++) {
			var collision = level.checkForCollisionWithMovingCircle(circle, Constants.BOUNCE_AMOUNT);
			for(var j = 0; j < grapples.length; j++) {
				var grappleCollision = grapples[j].checkForCollisionWithMovingCircle(circle);
				if(grappleCollision && (!collision || grappleCollision.distTraveled < collision.distTraveled)) {
					collision = grappleCollision;
				}
			}
			if(collision) {
				collisionString += (collision.cause.entityType ? collision.cause.entityType : collision.cause.geomType) + " ";
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
			console.log(collisionsThisFrame + " collisions this frame: " + collisionString);
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
			var points = [20,430,  0,430,  -20,430];
			var lines = [[20,450, 200,450, 200,420, 215,420, 215,450, 300,450, 300,390, 375,390,
				450,360, 500,360, 600,500, 700,500, 700,150, 780,150, 780,580, 20,580, 20,450],
				[125,200, 250,200, 250,220, 125,220, 125,200],
				[450,50, 500,50, 500,100, 450,100, 450,50],
				[750,-10, 1000,-30],
				[-140,500, -130,500, -110,600, -90,500, -80,500, -110,630, -140,500],
				[-350,400, -350,130,
				-320,130, -315,177, -302,222, -280,263, -250,300, -213,330, -172,352, -127,365, -80,370,
				-80,400, -350,400]];
			for(i = 0; i < lines.length; i++) {
				for(var j = 0; j < lines[i].length - 2; j += 2) {
					level.addLine(lines[i][j + 0], lines[i][j + 1], lines[i][j + 2], lines[i][j + 3]);
				}
			}
			for(i = 0; i < points.length; i += 2) {
				level.addPoint(points[i], points[i + 1]);
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
					var collision = level.checkForCollisionWithMovingPoint(grapples[i]);
					if(!collision) {
						collision = level.checkForCollisionWithMovingCircle(grapples[i]);
					}
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