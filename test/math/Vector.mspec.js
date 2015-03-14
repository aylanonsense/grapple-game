describe("The math/Vector module", function() {
	var test = require('../setup');
	var expect = test.require('chai').expect;
	var Vector = test.require('math/Vector');

	var ERROR_ALLOWED = 0.0001;

	describe("rotate method", function() {
		function runRotateTest(description, angle, expectedX, expectedY) {
			it(description, function() {
				var vector = new Vector(123, -456);
				vector.rotate(angle);
				expect(vector.x).to.be.within(expectedX - ERROR_ALLOWED, expectedX + ERROR_ALLOWED);
				expect(vector.y).to.be.within(expectedY - ERROR_ALLOWED, expectedY + ERROR_ALLOWED);
			});
		}
		runRotateTest("properly rotates by -90 degrees", -Math.PI / 2, -456, -123);
		runRotateTest("properly rotates by 0 degrees", 0, 123, -456);
		it("properly rotates by 45 degrees", function() {
			var vector = new Vector(100, 0);
			vector.rotate(Math.PI / 4);
			var len = 100 / Math.sqrt(2);
			expect(vector.x).to.be.within(len - ERROR_ALLOWED, len + ERROR_ALLOWED);
			expect(vector.y).to.be.within(len - ERROR_ALLOWED, len + ERROR_ALLOWED);
		});
		runRotateTest("properly rotates by 90 degrees", Math.PI / 2, 456, 123);
		runRotateTest("properly rotates by 180 degrees", Math.PI, -123, 456);
		runRotateTest("properly rotates by 270 degrees", Math.PI * 3 / 2, -456, -123);
		runRotateTest("properly rotates by 360 degrees", 2 * Math.PI, 123, -456);
	});
	describe("unrotate method", function() {
		function runUnrotateTest(description, angle) {
			it(description, function() {
				var vector = new Vector(123, -456);
				vector.rotate(angle);
				vector.unrotate(angle);
				expect(vector.x).to.be.within(123 - ERROR_ALLOWED, 123 + ERROR_ALLOWED);
				expect(vector.y).to.be.within(-456 - ERROR_ALLOWED, -456 + ERROR_ALLOWED);
			});
		}
		runUnrotateTest("properly unrotates -90 degrees", -Math.PI / 2);
		runUnrotateTest("properly unrotates 0 degrees", 0);
		runUnrotateTest("properly unrotates 45 degrees", Math.PI / 4);
		runUnrotateTest("properly unrotates 90 degrees", Math.PI / 2);
		runUnrotateTest("properly unrotates 180 degrees", Math.PI);
		runUnrotateTest("properly unrotates 270 degrees", Math.PI * 3 / 2);
		runUnrotateTest("properly unrotates 360 degrees", 2 * Math.PI);
	});
});