define([
	'Constants',
	'entity/PlayerEntity',
	'level/Level'
], function(
	Constants,
	PlayerEntity,
	Level
) {
	var NUM_CIRCLES = 0;
	var BOUNCE_AMOUNT = 0.0001;
	var camera, mouseStart, mouseEnd, level, circles, player, grapples;

	function checkforCollisions(circle) {
		var prevCauses = [];
		for(var i = 0; i < 6; i++) {
			var collision = level.checkForCollisionWithMovingCircle(circle, BOUNCE_AMOUNT);
			for(var j = 0; j < grapples.length; j++) {
				var grappleCollision = grapples[j].checkForCollisionWithMovingCircle(circle);
				if(grappleCollision && (!collision || grappleCollision.distTraveled < collision.distTraveled)) {
					collision = grappleCollision;
				}
			}
			if(collision) {
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
	}

	return {
		reset: function() {
			//render vars
			camera = { x: 0, y: 0 };

			//create lines/points by dragging the mouse
			mouseStart = null;
			mouseEnd = null;

			//game vars
			level = new Level();
			player = new PlayerEntity(337, 300);
			grapples = [];

			//create level
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
		},
		tick: function(t) {
			player.startOfFrame(t);

			//update circles
			player.tick(t);
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].tick(t);
			}

			//check for collisions
			checkforCollisions(player);
			for(i = 0; i < grapples.length; i++) {
				if(!grapples[i].isLatched) {
					var collision = level.checkForCollisionWithMovingPoint(grapples[i]);
					if(collision) {
						grapples[i].handleCollision(collision);
					}
				}
			}

			player.endOfFrame(t);
		},
		render: function(ctx) {
			//move camera
			camera.x = player.pos.x - Constants.WIDTH / 2;
			camera.y = player.pos.y - Constants.HEIGHT / 2;

			//blank canvas
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, Constants.WIDTH, Constants.HEIGHT);

			//render level
			level.render(ctx, camera);

			//render entities
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].render(ctx, camera);
			}
			player.render(ctx, camera);

			//render the line being drawn
			if(mouseStart && mouseEnd) {
				ctx.strokeStyle = '#f00';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(mouseStart.x - camera.x, mouseStart.y - camera.y);
				ctx.lineTo(mouseEnd.x - camera.x, mouseEnd.y - camera.y);
				ctx.stroke();
			}
		},
		onMouseEvent: function(evt) {
			if(evt.type === 'mousedown') {
				grapples.push(player.shootGrapple(evt.x + camera.x, evt.y + camera.y));
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
			else if(evt.key === 'CUT_GRAPPLES' && evt.isDown) {
				grapples = [];
			}
		}
	};
});