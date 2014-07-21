if (typeof define !== 'function') { var define = require('amdefine')(module); }
define([
	'app/Point',
	'app/Line'
], function(
	Point,
	Line
) {
	function Level() {
		this.obstacles = [];

		//create the level
		this._createPoly([900,1100,  1100,1100, 1100,1110,  900,1110],  true);
		this._createPoly([600,1210,  600,1220,  710,1220,   710,1210]);
		this._createPoly([1300,900,  1400,1000, 1300,1000], true);
		this._createPoly([1500,900,  1510,900,  1510,600,   1500,600]);
		this._createPoly([1600,860,  1590,860,  1590,600,   1600,600], true);
		this._createPoly([980,1220,  900,1180,  900,1170,   1100,1170, 1100,1180, 1020,1220], true);
		this._createPoly([200,1510,  200,1500,  2000,1500,  2000,1510],  true);
		this._createPoly([1300,1315, 1260,1250, 1300,1340,  1340,1250]);
		this._createPoly([1400,1300, 1360,1250, 1400,1320,  1440,1250]);
		this._createPoly([1500,1285, 1460,1250, 1500,1320,  1540,1250]);
		this._createPoly([1600,1270, 1560,1250, 1600,1320,  1640,1250]);
		this._createPoly([1600,1100, 1560,1150, 1600,1080,  1640,1150], true);
		this._createPoly([990,800,   1010,800,  1010,820,   990,820], true);
		this._createPoly([1030,880,  1050,880,  1050,900,   1030,900], true);
		this._createPoly([950,880,   970,880,   970,900,    950,900], true);
		this._createPoly([1030,720,  1050,720,  1050,740,   1030,740], true);
		this._createPoly([950,720,   970,720,   970,740,    950,740], true);
		this._createPoly([910,840,   930,840,  930,860,   910,860], true);
		this._createPoly([910,760,   930,760,  930,780,   910,780], true);
		this._createPoly([1070,840,   1090,840,  1090,860,   1070,860], true);
		this._createPoly([1070,760,   1090,760,  1090,780,   1070,780], true);
	}
	Level.prototype.render = function(ctx, camera) {
		for(var i = 0; i < this.obstacles.length; i++) {
			this.obstacles[i].render(ctx, camera);
		}
	};
	Level.prototype._createPoly = function(points, reverse) {
		var i, line, point, lines = [];
		if(reverse) {
			var reversedPoints = [];
			for(i = 0; i < points.length; i += 2) {
				reversedPoints[i] = points[points.length - i - 2];
				reversedPoints[i+1] = points[points.length - i - 1];
			}
			points = reversedPoints;
		}
		//create the lines
		for(i = 0; i < points.length - 2; i += 2) {
			line = new Line(points[i], points[i + 1], points[i + 2], points[i + 3]);
			lines.push(line);
			this.obstacles.push(line);
		}
		line = new Line(points[points.length - 2], points[points.length - 1], points[0], points[1]);
		lines.push(line);
		this.obstacles.push(line);
		//create the points
		for(i = 0; i < lines.length - 1; i++) {
			point = new Point(lines[i].end.x, lines[i].end.y);
			point.addParent(lines[i]);
			point.addParent(lines[i + 1]);
			this.obstacles.push(point);
		}
		point = new Point(lines[0].start.x, lines[0].start.y);
		point.addParent(lines[0]);
		point.addParent(lines[lines.length - 1]);
		this.obstacles.push(point);
	};
	return Level;
});