define([
	'Constants',
	'entity/CircleEntity',
	'entity/PlayerEntity',
	'level/Level'
], function(
	Constants,
	CircleEntity,
	PlayerEntity,
	Level
) {
	var NUM_CIRCLES = 0;
	var BOUNCE_AMOUNT = 0.0001;
	var camera, mouseStart, mouseEnd, level, circles, player;

	function checkforCollisions(circle) {
		var prevGeoms = [];
		for(var i = 0; i < 6; i++) {
			var collision = level.checkForCollisionWithMovingCircle(circle, BOUNCE_AMOUNT);
			if(collision) {
				circle.handleCollision(collision);
				if(collision.geom.sameAsAny(prevGeoms)) {
					if(!collision.geom.sameAs(prevGeoms[prevGeoms.length - 1])) {
						circle.pos.copy(circle.prevPos);
						circle.vel.zero();
					}
					break;
				}
				else {
					prevGeoms.push(collision.geom);
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
			player = new PlayerEntity(Constants.WIDTH / 2, Constants.HEIGHT / 2);
			circles = [];
			for(var i = 0; i < NUM_CIRCLES; i++) {
				circles.push(new CircleEntity(100 + Math.random() * (Constants.WIDTH - 200),
					Math.random() * Constants.HEIGHT, 3));
			}

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
			for(var i = 0; i < circles.length; i++) {
				circles[i].tick(t);
			}
			player.tick(t);

			//check for collisions
			for(i = 0; i < circles.length; i++) {
				checkforCollisions(circles[i]);
			}
			checkforCollisions(player);

			//wrap circles horizontally and vertically
			for(i = 0; i < circles.length; i++) {
				if(circles[i].pos.x > Constants.WIDTH + 50) {
					circles[i].wrap(-Constants.WIDTH - 100, 0);
				}
				if(circles[i].pos.x < -50) {
					circles[i].wrap(Constants.WIDTH + 100, 0);
				}
				if(circles[i].pos.y < -50) {
					circles[i].wrap(0, Constants.HEIGHT + 100);
				}
				if(circles[i].pos.y > Constants.HEIGHT + 50) {
					circles[i].wrap(0, -Constants.HEIGHT - 100);
				}
			}
			if(player.pos.x > Constants.WIDTH + 50) {
				player.wrap(-Constants.WIDTH - 100, 0);
			}
			if(player.pos.x < -50) {
				player.wrap(Constants.WIDTH + 100, 0);
			}
			if(player.pos.y < -50) {
				player.wrap(0, Constants.HEIGHT + 100);
			}
			if(player.pos.y > Constants.HEIGHT + 50) {
				player.wrap(0, -Constants.HEIGHT - 100);
			}

			player.endOfFrame(t);
		},
		render: function(ctx) {
			//blank canvas
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, Constants.WIDTH, Constants.HEIGHT);

			//render level
			level.render(ctx, camera);

			//render circles
			for(var i = 0; i < circles.length; i++) {
				circles[i].render(ctx, camera);
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
				mouseStart = { x: evt.x, y: evt.y };
				mouseEnd = { x: evt.x, y: evt.y };
			}
			if(evt.type === 'mousemove') {
				mouseEnd = { x: evt.x, y: evt.y };
			}
			if(evt.type === 'mouseup') {
				if(mouseStart) {
					mouseEnd = { x: evt.x, y: evt.y };
					var dx = mouseEnd.x - mouseStart.x, dy = mouseEnd.y - mouseStart.y;
					if(dx * dx + dy * dy < 10 * 10) {
						level.addPoint(mouseEnd.x, mouseEnd.y);
					}
					else {
						level.addLine(mouseStart.x, mouseStart.y, mouseEnd.x, mouseEnd.y);
					}
				}
				mouseStart = null;
				mouseEnd = null;
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
		}
	};
});