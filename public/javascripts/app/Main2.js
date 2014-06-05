if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/PhysObj',
	'app/collision/HitRect'
], function(
	$,
	PhysObj,
	HitRect
) {
	return function() {
		//set up canvas
		var width = 800, height = 600;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		//create player
		var player = new PhysObj();
		player.pos.x = 250;
		player.pos.y = 400;
		player.mass = 100;
		player.isAirborne = true;
		player.isHuggingWall = false;
		player.wantsToJump = false;
		player.wantsToWallJump = false;
		player.huggedWallDir = 0;
		player.horizontalMoveDir = 0;
		player.floor = null;
		player.wall = null;
		player.setHitBox(new HitRect(20, 20));

		//create boxes
		var boxes = [];
		boxes[0] = new PhysObj();
		boxes[0].pos.x = 250;
		boxes[0].pos.y = 530;
		boxes[0].setHitBox(new HitRect(400, 20));
		boxes[1] = new PhysObj();
		boxes[1].pos.x = 440;
		boxes[1].pos.y = 485;
		boxes[1].setHitBox(new HitRect(20, 60));
		boxes[2] = new PhysObj();
		boxes[2].pos.x = 605;
		boxes[2].pos.y = 465;
		boxes[2].setHitBox(new HitRect(300, 20));
		boxes[3] = new PhysObj();
		boxes[3].pos.x = 745;
		boxes[3].pos.y = 375;
		boxes[3].setHitBox(new HitRect(20, 150));
		boxes[4] = new PhysObj();
		boxes[4].pos.x = 600;
		boxes[4].pos.y = 370;
		boxes[4].setHitBox(new HitRect(130, 20));
		boxes[5] = new PhysObj();
		boxes[5].pos.x = 440;
		boxes[5].pos.y = 290;
		boxes[5].setHitBox(new HitRect(20, 120));
		boxes[6] = new PhysObj();
		boxes[6].pos.x = 520;
		boxes[6].pos.y = 200;
		boxes[6].setHitBox(new HitRect(20, 100));
		boxes[7] = new PhysObj();
		boxes[7].pos.x = 340;
		boxes[7].pos.y = 240;
		boxes[7].setHitBox(new HitRect(170, 20));
		boxes[8] = new PhysObj();
		boxes[8].pos.x = 290;
		boxes[8].pos.y = 140;
		boxes[8].setHitBox(new HitRect(270, 20));
		boxes[9] = new PhysObj();
		boxes[9].pos.x = 35;
		boxes[9].pos.y = 340;
		boxes[9].setHitBox(new HitRect(20, 400));
		boxes[10] = new PhysObj();
		boxes[10].pos.x = 140;
		boxes[10].pos.y = 370;
		boxes[10].setHitBox(new HitRect(20, 240));

		//add interaction
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, Z: 90, X: 88,
			C: 67, Q: 81, E: 69, R: 82, SPACE: 32, SHIFT: 16 };
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
				if(evt.which === KEY_MAP.A) {
					player.horizontalMoveDir = -1;
				}
				else if(evt.which === KEY_MAP.D) {
					player.horizontalMoveDir = 1;
				}
				else if(evt.which === KEY_MAP.SPACE) {
					if(!player.isAirborne) {
						player.wantsToJump = true;
					}
					else if(player.isHuggingWall) {
						player.wantsToWallJump = true;
					}
				}
			}
		});
		$(document).on('keyup', function(evt) {
			if(keys[evt.which]) {
				keys[evt.which] = false;
				if(evt.which === KEY_MAP.A) {
					player.horizontalMoveDir = (keys[KEY_MAP.D] ? 1 : 0);
				}
				else if(evt.which === KEY_MAP.D) {
					player.horizontalMoveDir = (keys[KEY_MAP.A] ? -1 : 0);
				}
				else if(evt.which === KEY_MAP.SPACE) {
					player.wantsToJump = false;
					player.wantsToWallJump = false;
				}
			}
		});

		//do this all the time
		function everyFrame(ms, time) {
			var i, collision;
			var t = ms / 1000;

			//move the player left/right
			if(player.horizontalMoveDir) {
				player.applyForce((player.isAirborne ? 5 : 15) * 10000 * player.horizontalMoveDir, 0);
			}

			//gravity
			player.applyForce(0, 15 * 10000);

			//if the player wants to jump, jump!
			if(!player.isAirborne && player.wantsToJump) {
				player.isAirborne = true;
				player.floor = null;
				player.wantsToJump = false;
				player.applyFixedForce(0, -300 * 10000);
			}

			//the player might also want to jump off of a wall, so do that
			else if(player.isHuggingWall && player.wantsToWallJump) {
				player.isHuggingWall = false;
				player.wall = null;
				player.wantsToWallJump = false;
				player.vel.y = 0;
				player.applyForce(200 * 10000 * player.huggedWallDir, -240 * 10000);
				player.huggedWallDir = 0;
			}

			//update the player
			player.tick(ms);

			//collisions
			for(i = 0; i < boxes.length; i++) {
				collision = player.checkForCollision(boxes[i]);
				if(collision) {
					if(player.isAirborne && player.vel.y > 0 && Math.abs(collision.embed.y) < Math.abs(collision.embed.x)) {
						player.pos.y += collision.embed.y;
						player.vel.y = 0;
						player.isAirborne = false;
						player.floor = collision.other;
					}
					else if(Math.abs(collision.embed.y) < Math.abs(collision.embed.x)) {
						player.pos.y += collision.embed.y;
						player.vel.y = 0;
					}
					else {
						player.pos.x += collision.embed.x;
						if(player.pos.x > boxes[i].pos.x) {
							if(player.vel.x < 0) {
								player.vel.x = 0;
							}
						}
						else {
							if(player.vel.x > 0) {
								player.vel.x = 0;
							}
						}
						player.huggedWallDir = (boxes[i].pos.x > player.pos.x ? -1 : 1);
						player.isHuggingWall = true;
						player.wall = collision.other;
					}
				}
				else if(boxes[i].sameAs(player.floor)) {
					player.isAirborne = true;
					player.wantsToJump = false;
					player.floor = null;
				}
				else if(boxes[i].sameAs(player.wall)) {
					player.isHuggingWall = false;
					player.huggedWallDir = 0;
					player.wantsToWallJump = false;
					player.wall = null;
				}
			}

			//keep player in bounds, for debug purposes
			if(player.pos.x > width + player.width / 2) {
				player.pos.x = -player.width / 2;
			}
			else if(player.pos.x < -player.width / 2) {
				player.pos.x = width + player.width / 2;
			}
			if(player.pos.y > height + player.height / 2) {
				player.pos.y = -player.height / 2;
			}
			else if(player.pos.y < -player.height / 2) {
				player.pos.y = height + player.height / 2;
			}

			//draw background
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, width, height);

			//draw player
			if(player.isHuggingWall) {
				ctx.fillStyle = '#ff0';
			}
			else if(player.isAirborne) {
				ctx.fillStyle = '#fff';
			}
			else {
				ctx.fillStyle = '#f00';
			}
			ctx.fillRect(player.pos.x - player.width / 2,
				player.pos.y - player.height / 2,
				player.width, player.height);

			//draw boxes
			for(i = 0; i < boxes.length; i++) {
				if(boxes[i].sameAs(player.floor)) {
					ctx.fillStyle = '#0ff';
				}
				else if(boxes[i].sameAs(player.wall)) {
					ctx.fillStyle = '#00f';
				}
				else {
					ctx.fillStyle = '#0f0';
				}
				ctx.fillRect(boxes[i].pos.x - boxes[i].width / 2,
					boxes[i].pos.y - boxes[i].height / 2,
					boxes[i].width, boxes[i].height);
			}
		}

		//set up animation frame functionality
		var prevTime;
		requestAnimationFrame(function(time) {
			prevTime = time;
			loop(time);
		});
		function loop(time) {
			var ms = time - prevTime;
			prevTime = time;
			everyFrame(ms, time);
			requestAnimationFrame(loop);
		}
	};
});