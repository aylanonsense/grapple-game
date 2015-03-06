describe("The level/geometry/Line module", function() {
	var test = require('../../setup');
	var expect = test.require('chai').expect;
	var Line = test.require('level/geometry/Line');
	var Vector = test.require('math/Vector');

	var ERROR_ALLOWED = 0.0001;

	function createCircleCollision(lineX1, lineY1, lineX2, lineY2, x1, y1, x2, y2, velX, velY, radius, bounceAmt) {
		var line = new Line(lineX1, lineY1, lineX2, lineY2);
		var circle = { prevPos: new Vector(x1, y1), pos: new Vector(x2, y2),
			vel: new Vector(velX, velY), radius: radius };
		return line.checkForCollisionWithMovingCircle(circle, bounceAmt);
	}

	function createPointCollision(lineX1, lineY1, lineX2, lineY2, x1, y1, x2, y2, velX, velY, bounceAmt) {
		var line = new Line(lineX1, lineY1, lineX2, lineY2);
		var point = { prevPos: new Vector(x1, y1), pos: new Vector(x2, y2), vel: new Vector(velX, velY) };
		return line.checkForCollisionWithMovingPoint(point, bounceAmt);
	}

	describe("checkForCollisionWithMovingCircle method", function() {
		describe("returns the correct contact point", function() {
			it("with a vertical line and a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(90 - ERROR_ALLOWED, 90 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
			});
			it("with a horizontal line and a vertical-moving circle", function() {
				var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(-5 - ERROR_ALLOWED, -5 + ERROR_ALLOWED);
			});
			it("with an angled line and an angled-moving circle", function() {
				var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   1.0);
				expect(collision).to.be.an('object');
				var x = 450 - 15 / Math.sqrt(2), y = 450 + 15 / Math.sqrt(2);
				expect(collision.contactPoint.x).to.be.within(x - ERROR_ALLOWED, x + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(y - ERROR_ALLOWED, y + ERROR_ALLOWED);
			});
		});
		describe("returns the correct distance traveled pre-collision", function() {
			it("with a vertical line and a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.distTraveled).to.be.within(75 - 10 - ERROR_ALLOWED, 75 - 10 + ERROR_ALLOWED);
			});
			it("with a horizontal line and a vertical-moving circle", function() {
				var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.distTraveled).to.be.within(25 - 20 - ERROR_ALLOWED, 25 - 20 + ERROR_ALLOWED);
			});
			it("with an angled line and an angled-moving circle", function() {
				var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   1.0);
				expect(collision).to.be.an('object');
				var dx = (450 - 15 / Math.sqrt(2) - 350), dy = (450 + 15 / Math.sqrt(2) - 550);
				var dist = Math.sqrt(dx * dx + dy * dy);
				expect(collision.distTraveled).to.be.within(dist - ERROR_ALLOWED, dist + ERROR_ALLOWED);
			});
		});
		describe("returns the correct final point based on bounceAmt", function() {
			describe("with a bounceAmt of 0.0", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(90 - ERROR_ALLOWED, 90 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(-5 - ERROR_ALLOWED, -5 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving circle", function() {
					var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   0.0);
					expect(collision).to.be.an('object');
					var x = 450 - 15 / Math.sqrt(2), y = 450 + 15 / Math.sqrt(2);
					expect(collision.finalPoint.x).to.be.within(x - ERROR_ALLOWED, x + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(y - ERROR_ALLOWED, y + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 0.25", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(81.25 - ERROR_ALLOWED, 81.25 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(43.75 - ERROR_ALLOWED, 43.75 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 1.0", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(55 - ERROR_ALLOWED, 55 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(190 - ERROR_ALLOWED, 190 + ERROR_ALLOWED);
				});
			});
		});
		describe("returns the correct final velocity based on bounceAmt", function() {
			describe("with a bounceAmt of 0.0", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving circle", function() {
					var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 0.25", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-12.5 - ERROR_ALLOWED, -12.5 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(12.5 - ERROR_ALLOWED, 12.5 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving circle", function() {
					var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-18.75 - ERROR_ALLOWED, -18.75 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(18.75 - ERROR_ALLOWED, 18.75 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 1.0", function() {
				it("with a vertical line and a horizontal-moving circle", function() {
					var collision = createCircleCollision(100,100,100,50,   25,75,125,75,   50,0,   10,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-50 - ERROR_ALLOWED, -50 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving circle", function() {
					var collision = createCircleCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   20,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(50 - ERROR_ALLOWED, 50 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving circle", function() {
					var collision = createCircleCollision(500,500,400,400,   350,550,550,350,   75,-75,   15,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-75 - ERROR_ALLOWED, -75 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
			});
		});
		describe("returns false when the circle doesn't move through the line at all", function() {
			it("with a vertical line and a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,100,100,50,   525,575,625,575,   50,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a horizontal line and a vertical-moving circle", function() {
				var collision = createCircleCollision(100,-25,50,-25,   560,500,560,400,   0,-50,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled line and an angled-moving circle", function() {
				var collision = createCircleCollision(500,500,400,400,   850,1050,1050,850,   75,-75,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
		describe("returns false when the circle moves through the \"back\" of the line", function() {
			it("with a vertical line and a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,100,100,50,   125,75,25,75,   -50,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a horizontal line and a vertical-moving circle", function() {
				var collision = createCircleCollision(100,-25,50,-25,   60,-200,60,0,   0,50,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled line and an angled-moving circle", function() {
				var collision = createCircleCollision(500,500,400,400,   550,350,350,550,   -75,75,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
	});

	describe("checkForCollisionWithMovingPoint method", function() {
		describe("returns the correct contact point", function() {
			it("with a vertical line and a horizontal-moving point", function() {
				var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(100 - ERROR_ALLOWED, 100 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
			});
			it("with a horizontal line and a vertical-moving point", function() {
				var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(-25 - ERROR_ALLOWED, -25 + ERROR_ALLOWED);
			});
			it("with an angled line and an angled-moving point", function() {
				var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(450 - ERROR_ALLOWED, 450 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(450 - ERROR_ALLOWED, 450 + ERROR_ALLOWED);
			});
		});
		describe("returns the correct distance traveled pre-collision", function() {
			it("with a vertical line and a horizontal-moving point", function() {
				var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.distTraveled).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
			});
			it("with a horizontal line and a vertical-moving point", function() {
				var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.distTraveled).to.be.within(25 - ERROR_ALLOWED, 25 + ERROR_ALLOWED);
			});
			it("with an angled line and an angled-moving point", function() {
				var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   1.0);
				expect(collision).to.be.an('object');
				var dx = (450 - 350), dy = (450 - 550);
				var dist = Math.sqrt(dx * dx + dy * dy);
				expect(collision.distTraveled).to.be.within(dist - ERROR_ALLOWED, dist + ERROR_ALLOWED);
			});
		});
		describe("returns the correct final point based on bounceAmt", function() {
			describe("with a bounceAmt of 0.0", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(100 - ERROR_ALLOWED, 100 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(-25 - ERROR_ALLOWED, -25 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving point", function() {
					var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(450 - ERROR_ALLOWED, 450 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(450 - ERROR_ALLOWED, 450 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 0.25", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(93.75 - ERROR_ALLOWED, 93.75 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(18.75 - ERROR_ALLOWED, 18.75 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 1.0", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalPoint.x).to.be.within(60 - ERROR_ALLOWED, 60 + ERROR_ALLOWED);
					expect(collision.finalPoint.y).to.be.within(150 - ERROR_ALLOWED, 150 + ERROR_ALLOWED);
				});
			});
		});
		describe("returns the correct final velocity based on bounceAmt", function() {
			describe("with a bounceAmt of 0.0", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving point", function() {
					var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   0.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 0.25", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-12.5 - ERROR_ALLOWED, -12.5 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(12.5 - ERROR_ALLOWED, 12.5 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving point", function() {
					var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   0.25);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-18.75 - ERROR_ALLOWED, -18.75 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(18.75 - ERROR_ALLOWED, 18.75 + ERROR_ALLOWED);
				});
			});
			describe("with a bounceAmt of 1.0", function() {
				it("with a vertical line and a horizontal-moving point", function() {
					var collision = createPointCollision(100,100,100,50,   25,75,125,75,   50,0,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-50 - ERROR_ALLOWED, -50 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
				});
				it("with a horizontal line and a vertical-moving point", function() {
					var collision = createPointCollision(100,-25,50,-25,   60,0,60,-200,   0,-50,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(0 - ERROR_ALLOWED, 0 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(50 - ERROR_ALLOWED, 50 + ERROR_ALLOWED);
				});
				it("with an angled line and an angled-moving point", function() {
					var collision = createPointCollision(500,500,400,400,   350,550,550,350,   75,-75,   1.0);
					expect(collision).to.be.an('object');
					expect(collision.finalVel.x).to.be.within(-75 - ERROR_ALLOWED, -75 + ERROR_ALLOWED);
					expect(collision.finalVel.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
				});
			});
		});
		describe("returns false when the point doesn't move through the line at all", function() {
			it("with a vertical line and a horizontal-moving point", function() {
				var collision = createPointCollision(100,100,100,50,   525,575,625,575,   50,0,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a horizontal line and a vertical-moving point", function() {
				var collision = createPointCollision(100,-25,50,-25,   560,500,560,400,   0,-50,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled line and an angled-moving point", function() {
				var collision = createPointCollision(500,500,400,400,   850,1050,1050,850,   75,-75,   1.0);
				expect(collision).to.equal(false);
			});
		});
		describe("returns false when the point moves through the \"back\" of the line", function() {
			it("with a vertical line and a horizontal-moving point", function() {
				var collision = createPointCollision(100,100,100,50,   125,75,25,75,   -50,0,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a horizontal line and a vertical-moving point", function() {
				var collision = createPointCollision(100,-25,50,-25,   60,-200,60,0,   0,50,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled line and an angled-moving point", function() {
				var collision = createPointCollision(500,500,400,400,   550,350,350,550,   -75,75,   1.0);
				expect(collision).to.equal(false);
			});
		});
	});
});