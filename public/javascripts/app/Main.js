if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/PhysObj2',
], function(
	$,
	PhysObj
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
		player.width = 20;
		player.height = 20;
		player.mass = 500;

		//create obstacles
		var obstacles = [];
		obstacles[0] = new PhysObj();
		obstacles[0].pos.x = 200;
		obstacles[0].pos.y = 100;
		obstacles[0].width = 100;
		obstacles[0].height = 30;
		obstacles[0].frozen = true;
		obstacles[1] = new PhysObj();
		obstacles[1].pos.x = 600;
		obstacles[1].pos.y = 100;
		obstacles[1].width = 30;
		obstacles[1].height = 200;
		obstacles[1].frozen = true;

		//create grapple on click
		var grapples = [];
		$(document).on('click', function(evt) {
			var click = { x: evt.clientX, y: evt.clientY };
			var diffX = click.x - player.pos.x;
			var diffY = click.y - player.pos.y;
			var grapple = new PhysObj();
			grapple.mass = 1;
			grapple.pos.x = player.pos.x;
			grapple.pos.y = player.pos.y;
			grapple.applyForce(50000, diffX, diffY);
			grapple.ignoreFriction = true;
			grapple.embedded = false;
			grapples.push(grapple);
		});
		/*var speed = 100;
		var move = { x: 0, y : 0 };
		var keys = {};
		var KEY_MAP = { W: 87, A: 65, S: 83, D: 68, Z: 90, X: 88,
			C: 67, Q: 81, E: 69, R: 82, SPACE: 32, SHIFT: 16 };
		$(document).on('keydown', function(evt) {
			if(!keys[evt.which]) {
				keys[evt.which] = true;
				if(evt.which === KEY_MAP.A) {
					move.x = -1;
				}
				else if(evt.which === KEY_MAP.D) {
					move.x = 1;
				}
				else if(evt.which === KEY_MAP.SPACE) {
					for(var i = 0, len = grapples.length; i < len; i++) {
						var g = grapples[i];
						if(!g.detatched) {
							g.detatched = { x: player.pos.x, y: player.pos.y };
						}
					}
				}
			}
		});
		$(document).on('keyup', function(evt) {
			if(keys[evt.which]) {
				keys[evt.which] = false;
				if(evt.which === KEY_MAP.A) {
					move.x = (keys[KEY_MAP.D] ? 1 : 0);
				}
				else if(evt.which === KEY_MAP.D) {
					move.x = (keys[KEY_MAP.A] ? -1 : 0);
				}
			}
		});*/

		//do this all the time
		function everyFrame(ms, time) {
			var t = ms / 1000;

			//update player
			player.tick(ms);
			
			//update grapples
			for(var i = 0; i < grapples.length; i++) {
				grapples[i].tick(ms);
				if(!grapples[i].embedded) {
					for(var j = 0; j < obstacles.length; j++) {
						var collision = grapples[i].checkForCollision(obstacles[j]);
						if(collision) {
							grapples[i].frozen = true;
							grapples[i].embedded = true;
						}
					}
				}
			}
			/*player.pos.x += move.x * speed * t;
			for(i = 0, len = grapples.length; i < len; i++) {
				g = grapples[i];
				if(!g.colliding) {
					g.pos.x += g.vel.x * t;
					g.pos.y += g.vel.y * t;
				}
				if(g.detatched) {
					g.detatched.x += g.vel.x * t;
					g.detatched.y += g.vel.y * t;
				}

				//move player
				if(g.colliding && !g.detatched) {
					var dist = Math.sqrt(
						(g.pos.x - player.pos.x) * (g.pos.x - player.pos.x) +
						(g.pos.y - player.pos.y) * (g.pos.y - player.pos.y));
					if(dist > 0.6 * g.collisionDist) {
						var diff = dist - 0.6 * g.collisionDist;
						var vectorX = (g.pos.x - player.pos.x) / dist;
						var vectorY = (g.pos.y - player.pos.y) / dist;
						var force = diff;
						var forceX = 3000 * force * vectorX;
						var forceY = 3000 * force * vectorY;
						player.applyForce(forceX, forceY);
					}
				}
			}
			player.applyForce(0, 1000 * player.mass); //gravity
			player.tick(ms);
			if(player.pos.y > 400) {
				player.pos.y = 400;
				player.vel.y = 0;
			}

			//collision
			for(i = 0, len = grapples.length; i < len; i++) {
				g = grapples[i];
				for(j = 0, len2 = obstacles.length; j < len2 && !g.colliding; j++) {
					b = obstacles[j];
					if(g.pos.x > b.pos.x && g.pos.x < b.pos.x + b.width && g.pos.y > b.pos.y && g.pos.y < b.pos.y + b.height) {
						g.colliding = true;
						g.collisionDist = Math.sqrt(
							(g.pos.x - player.pos.x) * (g.pos.x - player.pos.x) +
							(g.pos.y - player.pos.y) * (g.pos.y - player.pos.y));
					}
				}
			}*/

			//draw background
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, width, height);

			//dra player
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#fff';
			ctx.fillRect(player.pos.x - 10, player.pos.y - 10, player.width, player.height);

			//draw grapples
			for(i = 0; i < grapples.length; i++) {
				ctx.beginPath();
				/*if(!g.colliding || !g.detatched) {
					if(g.detatched) {
						ctx.moveTo(g.detatched.x, g.detatched.y);
					}
					else {*/
						ctx.moveTo(player.pos.x, player.pos.y);
					//}
					ctx.lineTo(grapples[i].pos.x, grapples[i].pos.y);
					ctx.stroke();
					ctx.fillRect(grapples[i].pos.x - grapples[i].width / 2,
						grapples[i].pos.y - grapples[i].height / 2,
						grapples[i].width, grapples[i].height);
				//}
			}

			//draw obstacles
			ctx.fillStyle = '#0f0';
			for(i = 0; i < obstacles.length; i++) {
				ctx.fillRect(obstacles[i].pos.x - obstacles[i].width / 2,
					obstacles[i].pos.y - obstacles[i].height / 2,
					obstacles[i].width, obstacles[i].height);
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