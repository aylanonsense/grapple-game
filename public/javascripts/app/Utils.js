if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	return {
		transformToJumpAngle: function(angle) {
			var distFromTop = (angle + Math.PI / 2) % (2 * Math.PI);
			if(distFromTop > Math.PI) {
				distFromTop = distFromTop - 2 * Math.PI;
			}
			var squareDistFromTop = distFromTop * distFromTop;
			var const1 = -0.9;
			var const2 = -const1 / Math.PI;
			return angle + const1 * distFromTop + const2 * (distFromTop > 0 ? 1 : -1) * squareDistFromTop;
		},
		toLine: function(x1, y1, x2, y2) {
			if(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
				//pass in bad points, don't get a line back
				return null;
			}
			var diffX = x2 - x1;
			var diffY = y2 - y1;
			if(diffX === 0 && diffY === 0) {
				//not a line at all, this is just a point
				return null;
			}
			var dist = Math.sqrt(diffX * diffX + diffY * diffY);
			var slope = diffY / diffX;
			if(slope === Infinity || slope === -Infinity) {
				return {
					isVertical: true,
					x: x1,
					dist: dist,
					diff: { x: diffX, y: diffY },
					start: { x: x1, y: y1 },
					end: { x: x2, y: y2 }
				};
			}
			return {
				isVertical: false,
				m: slope,
				b: y2 - slope * x2,
				dist: dist,
				diff: { x: diffX, y: diffY },
				start: { x: x1, y: y1 },
				end: { x: x2, y: y2 }
			};
		},
		findIntersection: function(line1, line2, err) {
			var intersection;
			if(!line1 || !line2) {
				intersection = null;
			}
			else if(line1.isVertical && line2.isVertical) {
				intersection = null; //either all points are intersections or none are... we don't like either case
			}
			else if(line1.isVertical) {
				intersection = {
					x: line1.x,
					y: line2.m * line1.x + line2.b
				};
			}
			else if(line2.isVertical) {
				intersection = {
					x: line2.x,
					y: line1.m * line2.x + line1.b
				};
			}
			else {
				intersection = {
					x: (line1.b - line2.b) / (line2.m - line1.m),
					y: line1.m * (line1.b - line2.b) / (line2.m - line1.m) + line1.b
				};
			}
			if(intersection) {
				var c = err || 0;
				intersection.intersectsBothSegments =
					((line1.start.x <= line1.end.x && line1.start.x - c <= intersection.x && intersection.x <= line1.end.x + c) ||
					(line1.end.x < line1.start.x && line1.end.x - c <= intersection.x && intersection.x <= line1.start.x + c)) &&
					((line2.start.x <= line2.end.x && line2.start.x - c <= intersection.x && intersection.x <= line2.end.x + c) ||
					(line2.end.x < line2.start.x && line2.end.x - c <= intersection.x && intersection.x <= line2.start.x + c)) &&
					((line1.start.y <= line1.end.y && line1.start.y - c <= intersection.y && intersection.y <= line1.end.y + c) ||
					(line1.end.y < line1.start.y && line1.end.y - c <= intersection.y && intersection.y <= line1.start.y + c)) &&
					((line2.start.y <= line2.end.y && line2.start.y - c <= intersection.y && intersection.y <= line2.end.y + c) ||
					(line2.end.y < line2.start.y && line2.end.y - c <= intersection.y && intersection.y <= line2.start.y + c));
			}
			return intersection;
		}
	};
});