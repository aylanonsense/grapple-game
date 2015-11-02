describe("The main module", function() {
	var test = require('./setup');
	var expect = test.require('chai').expect;
	var main = test.require('main');
	it("is a function", function() {
		expect(main).to.be.a('function');
	});
});