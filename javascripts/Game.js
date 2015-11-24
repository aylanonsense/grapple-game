define([
	'global',
	'display/camera',
	'display/draw'
], function(
	global,
	camera,
	draw
) {
	function Game(level) {
		var i, self = this;
		this.level = level;
	}
	Game.prototype.update = function(t) {
		var i;

		//start of frame
		for(i = 0; i < this.level.entities.length; i++) {
			if(!this.level.entities[i].isDead) {
				this.level.entities[i].startOfFrame(t);
			}
		}

		//move platforms
		for(i = 0; i < this.level.platforms.length; i++) {
			this.level.platforms[i].update(t);
		}

		//update entities
		for(i = 0; i < this.level.entities.length; i++) {
			if(!this.level.entities[i].isDead) {
				this.level.entities[i].update(t);
			}
		}

		//check for collisions
		for(i = 0; i < this.level.entities.length; i++) {
			if(!this.level.entities[i].isDead) {
				if(this.level.entities[i].collidable) {
					this._checkforCollisions(this.level.entities[i], t);
				}
			}
		}

		//end of frame
		for(i = 0; i < this.level.entities.length; i++) {
			if(!this.level.entities[i].isDead) {
				this.level.entities[i].endOfFrame(t);
			}
		}

		//clean up dead entities
		this.level.entities = this.level.entities.filter(function(entity) { return !entity.isDead; });

		//keep player in bounds
		if(this.level.player) {
			if(this.level.player.pos.x < -2200 || this.level.player.pos.x > 15000 || this.level.player.pos.y < -5000 || this.level.player.pos.y > 3000) {
				this.level.player.pos.x = 0;
				this.level.player.pos.y = 0;
			}
		}
	};
	Game.prototype._checkforCollisions = function(entity, t) {
		var prevCauses = [];

		//the entity may collide with a bunch of things in one frame
		for(var step = 0; step < global.MAX_MOVE_STEPS_PER_FRAME; step++) {
			//check to see if the entity is colliding with anything
			var collisions = entity.findAllCollisions();

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
		if(step >= global.MAX_MOVE_STEPS_PER_FRAME && global.LOG_WHEN_EXCEED_MAX_MOVE_STEPS) {
			console.log("Entity '" + entity.entityType + "' exceeded the max move steps of " + global.MAX_MOVE_STEPS_PER_FRAME);
		}
	};
	Game.prototype.render = function() {
		var i;

		//move camera to follow the player
		if(this.level.player) {
			camera.pos.x = this.level.player.pos.x - global.CANVAS_WIDTH / 2;
			camera.pos.y = this.level.player.pos.y - global.CANVAS_HEIGHT / 2;
		}

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

		//render platforms
		for(i = 0; i < this.level.platforms.length; i++) {
			this.level.platforms[i].render();
		}

		//render entities
		for(i = 0; i < this.level.entities.length; i++) {
			if(!this.level.entities[i].isDead) {
				this.level.entities[i].render();
			}
		}
	};
	return Game;
});