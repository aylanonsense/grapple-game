define([
	'Global',
	'entity/Player',
	'entity/Ball',
	'level/TestLevel',
	'input/Mouse',
	'input/Keyboard',
	'display/Camera',
	'display/Draw'
], function(
	Global,
	Player,
	Ball,
	TestLevel,
	Mouse,
	Keyboard,
	Camera,
	Draw
) {
	function Game() {
		var i, self = this;

		//vars
		this.level = TestLevel;
		this.player = new Player();
		this.entities = [ this.player, new Ball({ x: 130, y: -100 }) ];

		//bind input handlers
		Mouse.on('mouse-event', function(type, x, y) {
			if(type === 'mousedown') {
				//remove all other grapples
				for(var i = 0; i < self.entities.length; i++) {
					if(self.entities[i].entityType === 'Grapple') {
						self.entities[i].kill();
					}
				}
				//add a new grapple
				var grapple = self.player.shootGrapple(x + Camera.pos.x, y + Camera.pos.y);
				self.entities.push(grapple);
			}
			else if(type === 'mouseup') {
				//remove all grapples
				for(var i = 0; i < self.entities.length; i++) {
					if(self.entities[i].entityType === 'Grapple') {
						self.entities[i].kill();
					}
				}
			}
		});
		Keyboard.on('key-event', function(key, isDown, state) {
			var i;
			if(key === 'MOVE_LEFT') {
				self.player.moveDir.x = (isDown ? -1 : (state.MOVE_RIGHT ? 1 : 0));
			}
			else if(key === 'MOVE_RIGHT') {
				self.player.moveDir.x = (isDown ? 1 : (state.MOVE_LEFT ? -1 : 0));
			}
			else if(key === 'JUMP' && isDown) {
				self.player.startJumping();
			}
			else if(key === 'JUMP' && !isDown) {
				self.player.stopJumping();
			}
			else if(key === 'PULL_GRAPPLES' && isDown) {
				self.player.startPullingGrapples();
			}
			else if(key === 'PULL_GRAPPLES' && !isDown) {
				self.player.stopPullingGrapples();
			}
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
		/*for(i = 0; i < this.grapples.length; i++) {
			if(!this.grapples[i].isLatched) {
				var collision = this.level.checkForCollisionWithMovingPoint(this.grapples[i]);
				if(!collision) {
					collision = this.level.checkForCollisionWithMovingCircle(this.grapples[i]);
				}
				if(collision) {
					this.grapples[i].handleCollision(collision, t);
				}
			}
		}*/

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
	Game.prototype.render = function() {
		var i;

		//move camera to follow the player
		Camera.pos.x = this.player.pos.x - Global.CANVAS_WIDTH / 2;
		Camera.pos.y = this.player.pos.y - Global.CANVAS_HEIGHT / 2;

		//blank canvas
		Draw.rect(0, 0, Global.CANVAS_WIDTH, Global.CANVAS_HEIGHT, { fill: '#fff7ef', fixed: true });

		//draw gridlines for reference
		var GRID_SIZE = 32;
		var offsetX = Camera.pos.x % GRID_SIZE;
		var offsetY = Camera.pos.y % GRID_SIZE;
		for(i = 0; i < Global.CANVAS_WIDTH; i += GRID_SIZE) {
			Draw.line(i - offsetX, -1, i - offsetX, Global.CANVAS_HEIGHT + 1, { stroke: '#f3e7d1', fixed: true });
		}
		for(i = 0; i < Global.CANVAS_HEIGHT; i += GRID_SIZE) {
			Draw.line(-1, i - offsetY, Global.CANVAS_WIDTH + 1, i - offsetY, { stroke: '#f3e7d1', fixed: true });
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
	Game.prototype._checkforCollisions = function(entity, t) {
		var prevCauses = [];

		//the entity may collide with a bunch of things in one frame
		for(var step = 0; step < Global.MAX_MOVE_STEPS_PER_FRAME; step++) {
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
	return Game;
});