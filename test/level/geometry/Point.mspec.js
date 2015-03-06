describe("The level/geometry/Point module", function() {
	var test = require('../../setup');
	var expect = test.require('chai').expect;
	var Point = test.require('level/geometry/Point');
	var Vector = test.require('math/Vector');

	var ERROR_ALLOWED = 0.0001;

	function createCircleCollision(pointX, pointY, x1, y1, x2, y2, velX, velY, radius, bounceAmt) {
		var point = new Point(pointX, pointY);
		var circle = { prevPos: new Vector(x1, y1), pos: new Vector(x2, y2),
			vel: new Vector(velX, velY), radius: radius };
		return point.checkForCollisionWithMovingCircle(circle, bounceAmt);
	}

	describe("checkForCollisionWithMovingCircle method", function() {
		describe("returns the correct contact point", function() {
			it("with a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,77,   50,77,120,77,   40,0,   10,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(90 - ERROR_ALLOWED, 90 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(77 - ERROR_ALLOWED, 77 + ERROR_ALLOWED);
			});
			it("with a vertical-moving circle", function() {
				var collision = createCircleCollision(55,55,   55,400,55,-400,   0,-100,   20,   1.0);
				expect(collision).to.be.an('object');
				expect(collision.contactPoint.x).to.be.within(55 - ERROR_ALLOWED, 55 + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(75 - ERROR_ALLOWED, 75 + ERROR_ALLOWED);
			});
			it("with an angled-moving circle", function() {
				var collision = createCircleCollision(-300,-300,   -500,-100,-200,-400,   30,-30,   15,   1.0);
				expect(collision).to.be.an('object');
				var l = 15 / Math.sqrt(2);
				expect(collision.contactPoint.x).to.be.within(-300 - l - ERROR_ALLOWED, -300 - l + ERROR_ALLOWED);
				expect(collision.contactPoint.y).to.be.within(-300 + l - ERROR_ALLOWED, -300 + l + ERROR_ALLOWED);
			});
		});
		describe("returns false if the point started out inside of the circle", function() {
			it("with a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,77,   95,77,120,77,   40,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a vertical-moving circle", function() {
				var collision = createCircleCollision(55,55,   55,50,55,-400,   0,-100,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled-moving circle", function() {
				var collision = createCircleCollision(-300,-300,   -300,-300,-200,-400,   30,-30,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
		describe("returns false if the circle hasn't gotten to the point yet", function() {
			it("with a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,77,   50,77,70,77,   40,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a vertical-moving circle", function() {
				var collision = createCircleCollision(55,55,   55,400,55,300,   0,-100,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled-moving circle", function() {
				var collision = createCircleCollision(-300,-300,   -500,-100,-400,-200,   30,-30,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
		describe("returns false if the circle has gone past the point already", function() {
			it("with a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,77,   111,77,120,77,   40,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a vertical-moving circle", function() {
				var collision = createCircleCollision(55,55,   55,30,55,-400,   0,-100,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled-moving circle", function() {
				var collision = createCircleCollision(-300,-300,   -250,-350,-200,-400,   30,-30,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
		describe("returns false if the circle doesn't touch the point at all", function() {
			it("with a horizontal-moving circle", function() {
				var collision = createCircleCollision(100,177,   50,77,120,77,   40,0,   10,   1.0);
				expect(collision).to.equal(false);
			});
			it("with a vertical-moving circle", function() {
				var collision = createCircleCollision(95,55,   55,400,55,-400,   0,-100,   20,   1.0);
				expect(collision).to.equal(false);
			});
			it("with an angled-moving circle", function() {
				var collision = createCircleCollision(-300,-150,   -500,-100,-200,-400,   30,-30,   15,   1.0);
				expect(collision).to.equal(false);
			});
		});
	});
});