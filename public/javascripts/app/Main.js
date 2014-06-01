if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'jquery',
	'app/PhysObj',
], function(
	$,
	PhysObj
) {
	return function() {
		//set up canvas
		var width = 800, height = 600;
		var canvas = $('<canvas width="' + width + 'px" height = "' + height + 'px" />').appendTo(document.body);
		var ctx = canvas[0].getContext('2d');

		//interaction
		var player = new PhysObj();
		player.pos.x = 250;
		player.pos.y = 400;
		player.width = 20;
		player.height = 20;
		player.mass = 500;
		var boxes = [
			{ x: 200, y: 100, width: 100, height: 30 },
			{ x: 600, y: 100, width: 30, height: 200 }
		];
		var GRAPPLE_SPEED = 1000;
		var grapples = [];
		var DIAG = 1 / Math.sqrt(2);
		var speed = 100;
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
		});
		$(document).on('click', function(evt) {
			var click = { x: evt.clientX, y: evt.clientY };
			var diff = { x: click.x - player.pos.x, y: click.y - player.pos.y };
			var grapplePos = { x: player.pos.x, y: player.pos.y };
			var diffTotal = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
			var grappleVel = { x: GRAPPLE_SPEED * diff.x / diffTotal, y: GRAPPLE_SPEED * diff.y / diffTotal };
			grapples.push({
				pos: grapplePos,
				vel: grappleVel,
				detatched: false
			});
		});

		//do this all the time
		function everyFrame(ms, time) {
			var i, j, len, len2, g, b;
			var t = ms / 1000;

			//move
			player.pos.x += move.x * speed * t;
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
				for(j = 0, len2 = boxes.length; j < len2 && !g.colliding; j++) {
					b = boxes[j];
					if(g.pos.x > b.x && g.pos.x < b.x + b.width && g.pos.y > b.y && g.pos.y < b.y + b.height) {
						g.colliding = true;
						g.collisionDist = Math.sqrt(
							(g.pos.x - player.pos.x) * (g.pos.x - player.pos.x) +
							(g.pos.y - player.pos.y) * (g.pos.y - player.pos.y));
					}
				}
			}

			//draw
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, width, height);
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#fff';
			ctx.fillRect(player.pos.x - 10, player.pos.y - 10, player.width, player.height);
			for(i = 0, len = grapples.length; i < len; i++) {
				g = grapples[i];
				ctx.beginPath();
				if(!g.colliding || !g.detatched) {
					if(g.detatched) {
						ctx.moveTo(g.detatched.x, g.detatched.y);
					}
					else {
						ctx.moveTo(player.pos.x, player.pos.y);
					}
					ctx.lineTo(g.pos.x, g.pos.y);
					ctx.stroke();
					ctx.fillRect(g.pos.x - 2, g.pos.y - 2, 4, 4);
				}
			}
			ctx.fillStyle = '#0f0';
			for(i = 0, len = boxes.length; i < len; i++) {
				b = boxes[i];
				ctx.fillRect(b.x, b.y, b.width, b.height);
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