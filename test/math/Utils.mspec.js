describe("The math/Utils module", function() {
	var test = require('../setup');
	var expect = test.require('chai').expect;
	var MathUtils = test.require('phys/Utils');
	var Vector = test.require('math/Vector');

	var ERROR_ALLOWED = 0.0001;

	describe("findCircleLineIntersection method", function() {
		describe("with a horizontal line in aligned with a circle", function() {
			var lineStart = new Vector(100, 100);
			var lineEnd = new Vector(200, 100);
			var circleCenter = new Vector(250, 100);
			it("returns false if the line segment is completely outside of the circle", function() {
				var intersection = MathUtils.findCircleLineIntersection(circleCenter, 49.5, lineStart, lineEnd);
				expect(intersection).to.equal(false);
			});
			it("returns the correct contact point when the line crosses towards the end", function() {
				var intersection = MathUtils.findCircleLineIntersection(circleCenter, 50.5, lineStart, lineEnd);
				expect(intersection).to.be.an('object');
				expect(intersection.x).to.be.within(199.5 - ERROR_ALLOWED, 199.5 + ERROR_ALLOWED);
				expect(intersection.y).to.be.within(100 - ERROR_ALLOWED, 100 + ERROR_ALLOWED);
			});
			it("returns the correct contact point when the line crosses towards the start", function() {
				var intersection = MathUtils.findCircleLineIntersection(circleCenter, 149.5, lineStart, lineEnd);
				expect(intersection).to.be.an('object');
				expect(intersection.x).to.be.within(100.5 - ERROR_ALLOWED, 100.5 + ERROR_ALLOWED);
				expect(intersection.y).to.be.within(100 - ERROR_ALLOWED, 100 + ERROR_ALLOWED);
			});
			it("returns false if the line segment is encompassed by the circle", function() {
				var intersection = MathUtils.findCircleLineIntersection(circleCenter, 150.5, lineStart, lineEnd);
				expect(intersection).to.equal(false);
			});
		});
	});
});