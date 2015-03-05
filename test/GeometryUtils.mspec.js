describe("The GeometryUtils module", function() {
	var test = require('./setup');
	var expect = test.require('chai').expect;
	var GeometryUtils = test.require('GeometryUtils');
	describe("toLine method", function() {
		it("returns isSinglePoint=true if the start point and end point are the same", function() {
			var line = GeometryUtils.toLine(10,10,  10,10); //point
			expect(line).to.deep.equal({
				isSinglePoint: true,
				isVertical: false,
				start: { x: 10, y: 10 },
				end: { x: 10, y: 10 },
				diff: { x: 0, y: 0 },
				dist: 0,
				x: 10,
				y: 10
			});
		});
		it("returns isVertical=true if the start point is above/below the end point", function() {
			var line = GeometryUtils.toLine(10,-20,  10,10); //vertical line
			expect(line).to.deep.equal({
				isSinglePoint: false,
				isVertical: true,
				start: { x: 10, y: -20 },
				end: { x: 10, y: 10 },
				diff: { x: 0, y: 30 },
				dist: 30,
				x: 10
			});
		});
		it("returns a line object with the proper slope and intersection values", function() {
			var line = GeometryUtils.toLine(5,7.5,  10,10); //line with slope=0.5
			expect(line).to.deep.equal({
				isSinglePoint: false,
				isVertical: false,
				start: { x: 5, y: 7.5 },
				end: { x: 10, y: 10 },
				diff: { x: 5, y: 2.5 },
				dist: Math.sqrt(5 * 5 + 2.5 * 2.5),
				m: 0.5,
				b: 5
			});
		});
		it("can take two point arguments or four number arguments", function() {
			var line1 = GeometryUtils.toLine(84,36,  112,-99);
			var line2 = GeometryUtils.toLine({ x: 84, y: 36 }, { x: 112, y: -99 });
			expect(line1).to.deep.equal(line2);
		});
	});
	describe("findLineToLineIntersection method", function() {
		describe("given two points", function() {
			it("where the points have the same coordinates, it returns that as the intersection", function() {
				var line1 = GeometryUtils.toLine(5,5,  5,5); //point
				var line2 = GeometryUtils.toLine(5,5,  5,5); //point
				expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 5, y: 5 });
				expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 5, y: 5 });
			});
			it("where the points have different coordinates, it returns null (no intersection)", function() {
				var line1 = GeometryUtils.toLine(5,5,  5,5); //point
				var line2 = GeometryUtils.toLine(6,6,  6,6); //point
				expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
				expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
			});
		});
		describe("given a point and a line", function() {
			describe("where the line is horizontal", function() {
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on the line segment", function() {
					var line1 = GeometryUtils.toLine(4,5,  4,5); //point
					var line2 = GeometryUtils.toLine(-10,5,  10,5); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 4, y: 5 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 4, y: 5 });
				});
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on an end point", function() {
					var line1 = GeometryUtils.toLine(-10,5,  -10,5); //point
					var line2 = GeometryUtils.toLine(-10,5,  10,5); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -10, y: 5 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -10, y: 5 });
				});
				it("returns the point's coordinates with intersectsBothSegments=false if the point is on line but not the line segment", function() {
					var line1 = GeometryUtils.toLine(12,5,  12,5); //point
					var line2 = GeometryUtils.toLine(-10,5,  10,5); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 12, y: 5 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: 12, y: 5 });
				});
				it("returns null (no intersection) if the point is not on the line", function() {
					var line1 = GeometryUtils.toLine(4,7,  4,7); //point
					var line2 = GeometryUtils.toLine(-10,5,  10,5); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
			});
			describe("where the line is vertical", function() {
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on the line segment", function() {
					var line1 = GeometryUtils.toLine(-5,19,  -5,19); //point
					var line2 = GeometryUtils.toLine(-5,20,  -5,10); //vertical line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -5, y: 19 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -5, y: 19 });
				});
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on an end point", function() {
					var line1 = GeometryUtils.toLine(-5,20,  -5,20); //point
					var line2 = GeometryUtils.toLine(-5,20,  -5,10); //vertical line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -5, y: 20 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -5, y: 20 });
				});
				it("returns the point's coordinates with intersectsBothSegments=false if the point is on line but not the line segment", function() {
					var line1 = GeometryUtils.toLine(-5,39,  -5,39); //point
					var line2 = GeometryUtils.toLine(-5,20,  -5,10); //vertical line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: -5, y: 39 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: -5, y: 39 });
				});
				it("returns null (no intersection) if the point is not on the line", function() {
					var line1 = GeometryUtils.toLine(2,14,  2,14); //point
					var line2 = GeometryUtils.toLine(-5,20,  -5,10); //vertical line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
			});
			describe("where the line is neither vertical nor horizontal", function() {
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on the line segment", function() {
					var line1 = GeometryUtils.toLine(-6,-5,  -6,-5); //point
					var line2 = GeometryUtils.toLine(-7,-3,  -3,-11); //line with slope=-2
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -6, y: -5 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -6, y: -5 });
				});
				it("returns the point's coordinates with intersectsBothSegments=true if the point is on an end point", function() {
					var line1 = GeometryUtils.toLine(-7,-3,  -7,-3); //point
					var line2 = GeometryUtils.toLine(-7,-3,  -3,-11); //line with slope=-2
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -7, y: -3 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -7, y: -3 });
				});
				it("returns the point's coordinates with intersectsBothSegments=false if the point is on line but not the line segment", function() {
					var line1 = GeometryUtils.toLine(0,-17,  0,-17); //point
					var line2 = GeometryUtils.toLine(-7,-3,  -3,-11); //line with slope=-2
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: -17 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: -17 });
				});
				it("returns null (no intersection) if the point is not on the line", function() {
					var line1 = GeometryUtils.toLine(0,0,  0,0); //point
					var line2 = GeometryUtils.toLine(-7,-3,  -3,-11); //line with slope=-2
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
			});
		});
		describe("given two lines", function() {
			describe("where both lines are vertical", function() {
				it("returns null if the lines do not share a x-coordinate", function() {
					var line1 = GeometryUtils.toLine(0,2,  0,3); //vertical line
					var line2 = GeometryUtils.toLine(0.001,1,  0.001,4); //vertical line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
				describe("the lines are oriented in the same direction", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(0,2,  0,3); //vertical line
						var line2 = GeometryUtils.toLine(0,1,  0,4); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: 2 });
					});
					it("returns the secondary line's start point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(0,-1,  0,-4); //vertical line
						var line2 = GeometryUtils.toLine(0,-2,  0,-3); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: -2 });
					});
					it("returns the seconary line's start point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(0,1,  0,3); //vertical line
						var line2 = GeometryUtils.toLine(0,2,  0,4); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: 2 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(0,1,  0,2); //vertical line
						var line2 = GeometryUtils.toLine(0,3,  0,4); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: 2 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(0,3,  0,4); //vertical line
						var line2 = GeometryUtils.toLine(0,1,  0,2); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: 3 });
					});
				});
				describe("the lines are oriented in opposite directions", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(0,2,  0,3); //vertical line
						var line2 = GeometryUtils.toLine(0,4,  0,1); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: 2 });
					});
					it("returns the secondary line's end point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(0,1,  0,4); //vertical line
						var line2 = GeometryUtils.toLine(0,3,  0,2); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: 2 });
					});
					it("returns the seconary line's end point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(0,1,  0,3); //vertical line
						var line2 = GeometryUtils.toLine(0,4,  0,2); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 0, y: 2 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(0,1,  0,2); //vertical line
						var line2 = GeometryUtils.toLine(0,4,  0,3); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: 2 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(0,3,  0,4); //vertical line
						var line2 = GeometryUtils.toLine(0,2,  0,1); //vertical line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 0, y: 3 });
					});
				});
			});
			describe("where both lines are horizontal", function() {
				it("returns null if the lines do not share a y-coordinate", function() {
					var line1 = GeometryUtils.toLine(2,0,  3,0); //horizontal line
					var line2 = GeometryUtils.toLine(1,0.001,  4,0.001); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
				describe("the lines are oriented in the same direction", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(2,0,  3,0); //horizontal line
						var line2 = GeometryUtils.toLine(1,0,  4,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the secondary line's start point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(1,0,  4,0); //horizontal line
						var line2 = GeometryUtils.toLine(2,0,  3,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the seconary line's start point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(1,0,  3,0); //horizontal line
						var line2 = GeometryUtils.toLine(2,0,  4,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(1,0,  2,0); //horizontal line
						var line2 = GeometryUtils.toLine(3,0,  4,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 2, y: 0 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(3,0,  4,0); //horizontal line
						var line2 = GeometryUtils.toLine(1,0,  2,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 3, y: 0 });
					});
				});
				describe("the lines are oriented in opposite directions", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(2,0,  3,0); //horizontal line
						var line2 = GeometryUtils.toLine(4,0,  1,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the secondary line's end point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(1,0,  4,0); //horizontal line
						var line2 = GeometryUtils.toLine(3,0,  2,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the seconary line's end point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(1,0,  3,0); //horizontal line
						var line2 = GeometryUtils.toLine(4,0,  2,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: 0 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(1,0,  2,0); //horizontal line
						var line2 = GeometryUtils.toLine(4,0,  3,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 2, y: 0 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(3,0,  4,0); //horizontal line
						var line2 = GeometryUtils.toLine(2,0,  1,0); //horizontal line
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 3, y: 0 });
					});
				});
			});
			describe("where one line is horizontal and the other line is vertical", function() {
				it("returns intersectsBothSegments=false if the vertical line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-55,100,  -55,149.9); //vertical line
					var line2 = GeometryUtils.toLine(-100,150,  -45,150); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: -55, y: 150 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: -55, y: 150 });
				});
				it("returns intersectsBothSegments=false if the horizontal line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-55,100,  -55,200); //vertical line
					var line2 = GeometryUtils.toLine(-100,150,  -55.001,150); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: -55, y: 150 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: -55, y: 150 });
				});
				it("returns intersectsBothSegments=true if both line segments encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-55,100,  -55,200); //vertical line
					var line2 = GeometryUtils.toLine(-100,150,  -45,150); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -55, y: 150 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -55, y: 150 });
				});
				it("returns intersectsBothSegments=true if the line segments share an end point", function() {
					var line1 = GeometryUtils.toLine(-55,100,  -55,200); //vertical line
					var line2 = GeometryUtils.toLine(-100,200,  -55,200); //horizontal line
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -55, y: 200 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -55, y: 200 });
				});
			});
			describe("where one line is horizontal and the other line is neither vertical nor horizontal", function() {
				it("returns intersectsBothSegments=false if the non-horizontal line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(20,-8,  30,-8); //horizontal line
					var line2 = GeometryUtils.toLine(26,32,  35,392); //line with slope=40
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 25, y: -8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: 25, y: -8 });
				});
				it("returns intersectsBothSegments=false if the horizontal line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(25.001,-8,  30,-8); //horizontal line
					var line2 = GeometryUtils.toLine(-5,-1208,  35,392); //line with slope=40
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 25, y: -8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: 25, y: -8 });
				});
				it("returns intersectsBothSegments=true if both line segments encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(20,-8,  30,-8); //horizontal line
					var line2 = GeometryUtils.toLine(-5,-1208,  35,392); //line with slope=40
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 25, y: -8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 25, y: -8 });
				});
				it("returns intersectsBothSegments=true if the line segments share an end point", function() {
					var line1 = GeometryUtils.toLine(20,-8,  30,-8); //horizontal line
					var line2 = GeometryUtils.toLine(20,-8,  30,392); //line with slope=40
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 20, y: -8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 20, y: -8 });
				});
			});
			describe("where one line is vertical and the other line is neither vertical nor horizontal", function() {
				it("returns intersectsBothSegments=false if the non-vertical line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-9.5,0,  -9.5,6); //vertical line
					var line2 = GeometryUtils.toLine(-9,4.5,  -8,4); //line with slope=-0.5
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: -9.5, y: 4.75 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: -9.5, y: 4.75 });
				});
				it("returns intersectsBothSegments=false if the vertical line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-9.5,5.0001,  -9.5,6); //vertical line
					var line2 = GeometryUtils.toLine(-10,5,  -8,4); //line with slope=-0.5
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: -9.5, y: 4.75 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: -9.5, y: 4.75 });
				});
				it("returns intersectsBothSegments=true if both line segments encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(-9.5,0,  -9.5,6); //vertical line
					var line2 = GeometryUtils.toLine(-10,5,  -8,4); //line with slope=-0.5
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -9.5, y: 4.75 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -9.5, y: 4.75 });
				});
				it("returns intersectsBothSegments=true if the line segments share an end point", function() {
					var line1 = GeometryUtils.toLine(-10,0,  -10,6); //vertical line
					var line2 = GeometryUtils.toLine(-10,5,  -8,4); //line with slope=-0.5
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -10, y: 5 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: -10, y: 5 });
				});
			});
			describe("where both lines are neither vertical nor horizontal and are parallel", function() {
				it("returns null if the lines are not along the same axis", function() {
					var line1 = GeometryUtils.toLine(2,-2,  3,-3); //line with slope=-1
					var line2 = GeometryUtils.toLine(1,-1.5,  4,-4.5); //line with slope=-1
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.equal(null);
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.equal(null);
				});
				describe("the lines are oriented in the same direction", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(2,-2,  3,-3); //line with slope=-1
						var line2 = GeometryUtils.toLine(1,-1,  4,-4); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: -2 });
					});
					it("returns the secondary line's start point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(1,-1,  4,-4); //line with slope=-1
						var line2 = GeometryUtils.toLine(2,-2,  3,-3); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: -2 });
					});
					it("returns the seconary line's start point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(1,-1,  3,-3); //line with slope=-1
						var line2 = GeometryUtils.toLine(2,-2,  4,-4); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: -2 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(1,-1,  2,-2); //line with slope=-1
						var line2 = GeometryUtils.toLine(3,-3,  4,-4); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 2, y: -2 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(3,-3,  4,-4); //line with slope=-1
						var line2 = GeometryUtils.toLine(1,-1,  2,-2); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 3, y: -3 });
					});
				});
				describe("the lines are oriented in opposite directions", function() {
					it("returns the primary line's start point if the primary line is contained in the secondary line", function() {
						var line1 = GeometryUtils.toLine(-2,2,  -3,3); //line with slope=-1
						var line2 = GeometryUtils.toLine(-4,4,  -1,1); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: -2, y: 2 });
					});
					it("returns the secondary line's end point if the secondary line is contained in the primary line", function() {
						var line1 = GeometryUtils.toLine(1,-1,  4,-4); //line with slope=-1
						var line2 = GeometryUtils.toLine(3,-3,  2,-2); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: -2 });
					});
					it("returns the seconary line's end point if the lines are only partially overlapping", function() {
						var line1 = GeometryUtils.toLine(1,-1,  3,-3); //line with slope=-1
						var line2 = GeometryUtils.toLine(4,-4,  2,-2); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 2, y: -2 });
					});
					it("returns the primary line's end point if the lines are not overlapping and secondary line comes \"after\" the primary line", function() {
						var line1 = GeometryUtils.toLine(1,-1,  2,-2); //line with slope=-1
						var line2 = GeometryUtils.toLine(4,-4,  3,-3); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 2, y: -2 });
					});
					it("returns the primary line's start point if the lines are not overlapping and secondary line comes \"before\" the primary line", function() {
						var line1 = GeometryUtils.toLine(3,-3,  4,-4); //line with slope=-1
						var line2 = GeometryUtils.toLine(2,-2,  1,-1); //line with slope=-1
						expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 3, y: -3 });
					});
				});
			});
			describe("where both lines are neither vertical nor horizontal and are not parallel", function() {
				it("returns intersectsBothSegments=false if either line segment does not encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(13,7,  20,0); //line with slope=-1
					var line2 = GeometryUtils.toLine(11.5,-92,  12.5,108); //line with slope=200
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: false, x: 12, y: 8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: false, x: 12, y: 8 });
				});
				it("returns intersectsBothSegments=true if both line segments encompass the intersection", function() {
					var line1 = GeometryUtils.toLine(10,10,  20,0); //line with slope=-1
					var line2 = GeometryUtils.toLine(11.5,-92,  12.5,108); //line with slope=200
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 12, y: 8 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 12, y: 8 });
				});
				it("returns intersectsBothSegments=true if the line segments share an end point", function() {
					var line1 = GeometryUtils.toLine(10,10,  20,0); //line with slope=-1
					var line2 = GeometryUtils.toLine(10,10,  11,210); //line with slope=200
					expect(GeometryUtils.findLineToLineIntersection(line1, line2)).to.deep.equal({ intersectsBothSegments: true, x: 10, y: 10 });
					expect(GeometryUtils.findLineToLineIntersection(line2, line1)).to.deep.equal({ intersectsBothSegments: true, x: 10, y: 10 });
				});
			});
		});
	});
});