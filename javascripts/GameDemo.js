define([
	'Constants',
	'entity/CircleEntity',
	'level/Level'
], function(
	Constants,
	CircleEntity,
	Level
) {
	var NUM_CIRCLES = 100;
	var BOUNCE_AMOUNT = 0.0001;
	var camera, mouseStart, mouseEnd, level, circles;

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
			circles = [];
			for(var i = 0; i < NUM_CIRCLES; i++) {
				circles.push(new CircleEntity(100 + Math.random() * (Constants.WIDTH - 200),
					Math.random() * Constants.HEIGHT, 10));
			}
		},
		tick: function(t) {
			//update circles
			for(var i = 0; i < circles.length; i++) {
				circles[i].tick(t);
			}

			//check for collisions
			for(i = 0; i < circles.length; i++) {
				checkforCollisions(circles[i]);
			}

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
			
		}
	};
});