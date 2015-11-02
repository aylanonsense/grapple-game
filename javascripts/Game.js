define([
	'global',
	'entity/Player',
	'entity/Ball',
	'level/TestLevel',
	'input/mouse',
	'input/keyboard',
	'display/camera',
	'display/draw'
], function(
	global,
	Player,
	Ball,
	TestLevel,
	mouse,
	keyboard,
	camera,
	draw
) {
	function Game() {
		var i, self = this;

		//vars
		this.level = new TestLevel();
		this.player = new Player();
		this.entities = [ this.player, new Ball({ x: 130, y: -100 }), new Ball({ x: -45, y: -100 }) ];

		//bind input handlers
		mouse.on('mouse-event', function(type, x, y) {
			self._onmouseEvent(type, x, y);
		});
		keyboard.on('key-event', function(key, isDown, state) {
			self._onKeyEvent(key, isDown, state);
		});
	}
	Game.prototype.update = function(t) {
		var i;

		//start of frame
		for(i = 0; i < this.entities.length; i++) {
			if(!this.entities[i].isDead) {
				this.entities[i].startOfFrame(t);
			}
		}

		//update entities
		for(i = 0; i < this.entities.length; i++) {
			if(!this.entities[i].isDead) {
				this.entities[i].update(t);
			}
		}

		//check for collisions
		for(i = 0; i < this.entities.length; i++) {
			if(!this.entities[i].isDead) {
				if(this.entities[i].collidable) {
					this._checkforCollisions(this.entities[i], t);
				}
			}
		}

		//end of frame
		for(i = 0; i < this.entities.length; i++) {
			if(!this.entities[i].isDead) {
				this.entities[i].endOfFrame(t);
			}
		}

		//clean up dead entities
		this.entities = this.entities.filter(function(entity) { return !entity.isDead; });

		//keep player in bounds
		if(this.player.pos.x < -2200 || this.player.pos.x > 15000 || this.player.pos.y < -5000 || this.player.pos.y > 3000) {
			this.player.pos.x = 0;
			this.player.pos.y = 0;
		}
	};
	Game.prototype._checkforCollisions = function(entity, t) {
		var prevCauses = [];

		//the entity may collide with a bunch of things in one frame
		for(var step = 0; step < global.MAX_MOVE_STEPS_PER_FRAME; step++) {
			//check to see if the entity is colliding with anything
			var collisions = entity.findAllCollisions(this.level, this.entities);

			//if there were no collisions, we are done!
			if(collisions.length === 0) {
				break;
			}
			else {
				//find the earliest collision
				var collision = collisions[0];
				for(var i = 1; i < collisions.length; i++) {
					if(collisions[i].distTraveled < collision.distTraveled) {
						collision = collisions[i];
					}
				}

				//if the entity collides with something it's already collided with this frame, that's a good indicator
				// that it's in a corner and that we don't need to check for any further collisions
				if(collision.cause.sameAsAny(prevCauses)) {
					entity.handleCollision(collision, t, !collision.cause.sameAs(prevCauses[prevCauses.length - 1]));
					break;
				}
				//otherwise we keep a look out to see if that collision will come up again this frame
				else {
					entity.handleCollision(collision, t, false);
					prevCauses.push(collision.cause);
				}
			}
		}
	};
	Game.prototype._onmouseEvent = function(type, x, y) {
		if(type === 'mousedown') {
			//remove all other grapples
			for(var i = 0; i < this.entities.length; i++) {
				if(this.entities[i].entityType === 'Grapple') {
					this.entities[i].kill();
				}
			}
			//add a new grapple
			var grapple = this.player.shootGrapple(x + camera.pos.x, y + camera.pos.y);
			this.entities.push(grapple);
		}
		else if(type === 'mouseup') {
			//remove all grapples
			for(var i = 0; i < this.entities.length; i++) {
				if(this.entities[i].entityType === 'Grapple') {
					this.entities[i].kill();
				}
			}
		}
	};
	Game.prototype._onKeyEvent = function(key, isDown, state) {
		if(key === 'MOVE_LEFT') {
			this.player.moveDir.x = (isDown ? -1 : (state.MOVE_RIGHT ? 1 : 0));
		}
		else if(key === 'MOVE_RIGHT') {
			this.player.moveDir.x = (isDown ? 1 : (state.MOVE_LEFT ? -1 : 0));
		}
		else if(key === 'JUMP' && isDown) {
			this.player.startJumping();
		}
		else if(key === 'JUMP' && !isDown) {
			this.player.stopJumping();
		}
		else if(key === 'PULL_GRAPPLES' && isDown) {
			this.player.startPullingGrapples();
		}
		else if(key === 'PULL_GRAPPLES' && !isDown) {
			this.player.stopPullingGrapples();
		}
	};
	Game.prototype.render = function() {
		var i;

		//move camera to follow the player
		camera.pos.x = this.player.pos.x - global.CANVAS_WIDTH / 2;
		camera.pos.y = this.player.pos.y - global.CANVAS_HEIGHT / 2;

		//blank canvas
		draw.rect(0, 0, global.CANVAS_WIDTH, global.CANVAS_HEIGHT, { fill: '#fff7ef', fixed: true });

		//draw gridlines for reference
		var GRID_SIZE = 32;
		var offsetX = camera.pos.x % GRID_SIZE;
		var offsetY = camera.pos.y % GRID_SIZE;
		for(i = 0; i < global.CANVAS_WIDTH; i += GRID_SIZE) {
			draw.line(i - offsetX, -1, i - offsetX, global.CANVAS_HEIGHT + 1, { stroke: '#f3e7d1', fixed: true });
		}
		for(i = 0; i < global.CANVAS_HEIGHT; i += GRID_SIZE) {
			draw.line(-1, i - offsetY, global.CANVAS_WIDTH + 1, i - offsetY, { stroke: '#f3e7d1', fixed: true });
		}

		//render level geometry
		this.level.render();

		//render entities
		for(i = 0; i < this.entities.length; i++) {
			if(!this.entities[i].isDead) {
				this.entities[i].render();
			}
		}
	};
	return Game;
});