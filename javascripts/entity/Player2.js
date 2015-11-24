define([
	'util/extend',
	'entity/Entity',
	'math/Vector',
	'input/mouse',
	'input/keyboard'
], function(
	extend,
	Entity,
	Vector,
	mouse,
	keyboard
) {
	function Player(params) {
		Entity.call(this, extend(params, {
			entityType: 'Player',
			radius: 5,
			bounce: 0,
			friction: 0.5,
			renderColor: '#0000ff',
			gravity: 300,
			stabilityAngle: Math.PI / 4
		}));
		this.moveDir = new Vector(0, 0);

		mouse.on('mouse-event', function(type, x, y) {
			/*var i;
			if(type === 'mousedown') {
				//remove all other grapples
				for(i = 0; i < this.entities.length; i++) {
					if(this.entities[i].entityType === 'Grapple') {
						this.entities[i].kill();
					}
				}
				//add a new grapple
				var grapple = this.shootGrapple(x + camera.pos.x, y + camera.pos.y);
				if(grapple) {
					this.entities.push(grapple);
				}
			}
			else if(type === 'mouseup') {
				//remove all grapples
				for(i = 0; i < this.entities.length; i++) {
					if(this.entities[i].entityType === 'Grapple') {
						this.entities[i].kill();
					}
				}
			}*/
		}, this);
		keyboard.on('key-event', function(key, isDown, state) {
			if(key === 'MOVE_LEFT') {
				this.moveDir.x = (isDown ? -1 : (state.MOVE_RIGHT ? 1 : 0));
			}
			else if(key === 'MOVE_RIGHT') {
				this.moveDir.x = (isDown ? 1 : (state.MOVE_LEFT ? -1 : 0));
			}
			else if(key === 'JUMP' && isDown) {
				if(this.surface) {
					this.vel.y -= 300;
				}
			}
			/*else if(key === 'JUMP' && isDown) {
				this.startJumping();
			}
			else if(key === 'JUMP' && !isDown) {
				this.stopJumping();
			}
			else if(key === 'PULL_GRAPPLES' && isDown) {
				this.startPullingGrapples();
			}
			else if(key === 'PULL_GRAPPLES' && !isDown) {
				this.stopPullingGrapples();
			}*/
		}, this);
	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.update = function(t) {
		Entity.prototype.update.apply(this, arguments);
		if(this.surface) {
			this.vel.x += t * 700 * this.moveDir.x;
		}
	};
	/*Player.prototype.shootGrapple = function(x, y) {};
	Player.prototype.startJumping = function() {};
	Player.prototype.stopJumping = function() {};
	Player.prototype.startPullingGrapples = function() {};
	Player.prototype.stopPullingGrapples = function() {};*/
	return Player;
});