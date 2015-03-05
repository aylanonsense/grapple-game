define(function() {
	var START_TIME = Date.now();
	return {
		toLine: function(start, end) {
			if(arguments.length === 4) {
				start = { x: arguments[0], y: arguments[1] };
				end = { x: arguments[2], y: arguments[3] };
			}
			var diffX = end.x - start.x;
			var diffY = end.y - start.y;
			if(diffX === 0 && diffY === 0) {
				return {
					isVertical: false,
					isSinglePoint: true,
					x: start.x,
					y: start.y,
					dist: 0,
					diff: { x: 0, y: 0 },
					start: { x: start.x, y: start.y },
					end: { x: end.x, y: end.y }
				};
			}
			var dist = Math.sqrt(diffX * diffX + diffY * diffY);
			var slope = diffY / diffX;
			if(slope === Infinity || slope === -Infinity) {
				return {
					isVertical: true,
					isSinglePoint: false,
					x: start.x,
					dist: dist,
					diff: { x: diffX, y: diffY },
					start: { x: start.x, y: start.y },
					end: { x: end.x, y: end.y }
				};
			}
			return {
				isVertical: false,
				isSinglePoint: false,
				m: slope,
				b: end.y - slope * end.x,
				dist: dist,
				diff: { x: diffX, y: diffY },
				start: { x: start.x, y: start.y },
				end: { x: end.x, y: end.y }
			};
		},
		findLineToLineIntersection: function(line1, line2, err) {
			var c = err || 0;
			var intersection = null;
			var k, intersectionX, intersectionY;
			if(line1.isSinglePoint) {
				if(line2.isSinglePoint) {
					//two points intersect iif they are the same point
					if(line1.x === line2.x && line1.y === line2.y) {
						intersection = {
							x: line1.x,
							y: line1.y
						};
					}
				}
				else if(line2.isVertical) {
					//a vertical line intersects a point iff they have the same x coordinate
					if(line1.x === line2.x) {
						intersection = {
							x: line1.x,
							y: line1.y
						};
					}
				}
				else {
					//a point intersects a line iff its x-value satisfies the line equation and equals its y-value
					if(line1.y - c <= (line2.m * line1.x + line2.b) && (line2.m * line1.x + line2.b) <= line1.y + c) {
						intersection = {
							x: line1.x,
							y: line1.y
						};
					}
				}
			}
			else if(line1.isVertical) {
				if(line2.isSinglePoint) {
					//a vertical line intersects a point iff they have the same x coordinate
					if(line1.x === line2.x) {
						intersection = {
							x: line2.x,
							y: line2.y
						};
					}
				}
				else if(line2.isVertical) {
					//two vertical lines intersect (a lot) iif they have the same x coordinate
					if(line1.x === line2.x) {
						k = (line1.start.y < line1.end.y ? 1 : -1); //dir
						//secondary line starts before the primary line starts
						if(k * line2.start.y <= k * line1.start.y) {
							intersectionY = line1.start.y;
						}
						//secondary line is moving in the same direction
						else if(k * line2.start.y < k * line2.end.y) {
							intersectionY = (k * line2.start.y < k * line1.end.y ? line2.start.y : line1.end.y);
						}
						//secondary line ends before primary line starts
						else if(k * line2.end.y < k * line1.start.y) {
							intersectionY = line1.start.y;
						}
						else {
							intersectionY = (k * line2.end.y < k * line1.end.y ? line2.end.y : line1.end.y);
						}
						intersection = {
							x: line1.x,
							y: intersectionY
						};
					}
				}
				else {
					//a vertical line will always intersect a non-vertical line somewhere
					intersection = {
						x: line1.x,
						y: line2.m * line1.x + line2.b
					};
				}
			}
			else {
				if(line2.isSinglePoint) {
					//a point intersects a line iff its x-value satisfies the line equation and equals its y-value
					if(line2.y - c <= (line1.m * line2.x + line1.b) && (line1.m * line2.x + line1.b) <= line2.y + c) {
						intersection = {
							x: line2.x,
							y: line2.y
						};
					}
				}
				else if(line2.isVertical) {
					//a vertical line will always intersect a non-vertical line somewhere
					intersection = {
						x: line2.x,
						y: line1.m * line2.x + line1.b
					};
				}
				else if(line1.m === line2.m) {
					//parallel lines intersect if they have the same y value at x=0
					if(line1.b === line2.b) {
						k = (line1.start.x < line1.end.x ? 1 : -1); //dir
						//secondary line starts before the primary line starts
						if(k * line2.start.x <= k * line1.start.x) {
							intersectionX = line1.start.x;
						}
						//secondary line is moving in the same direction
						else if(k * line2.start.x < k * line2.end.x) {
							intersectionX = (k * line2.start.x < k * line1.end.x ? line2.start.x : line1.end.x);
						}
						//secondary line ends before primary line starts
						else if(k * line2.end.x < k * line1.start.x) {
							intersectionX = line1.start.x;
						}
						else {
							intersectionX = (k * line2.end.x < k * line1.end.x ? line2.end.x : line1.end.x);
						}
						intersection = {
							x: intersectionX,
							y: line1.m * intersectionX + line1.b
						};
					}
				}
				else {
					//if both lines are "true" lines, (b1 - b2) / (m2 - m1) will give us the intersection x-coordinate
					intersection = {
						x: (line1.b - line2.b) / (line2.m - line1.m),
						y: line1.m * (line1.b - line2.b) / (line2.m - line1.m) + line1.b
					};
				}
			}
			if(intersection) {
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