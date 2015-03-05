describe("The Main module", function() {
	var test = require('./setup');
	var expect = test.require('chai').expect;
	var Main = test.require('Main');
	it("is a function", function() {
		expect(Main).to.be.a('function');
	});
});