define([
	'level/Level'
], function(
	Level
) {
	var level = new Level();

	//create level geometry
	addLines([-1600,-500, -1575,-500, -1550,-300,
		-1525,-500, -1500,-500, -1550,-200], true); //floating V pit
	addLines([-1400,-675, -1400,-900, -1200,-900, //left edge of spikes
		-1180,-1000, -1150,-980, -1130,-1100, -1110,-1070, -1100,-1200, //mountain
		-1060,-1400, -1030,-1650, -1010,-1500, -960,-1550, -950,-1320,
		-930,-1390, -920,-1220, -900,-1220, -880,-970, -860,-1000,
		-850,-900, -650,-900, -650,-675, //right edge of spikes
		-670,-650, -690,-675, -700,-620, -710,-650, -730,-580, -760,-675, //spikes
		-780,-650, -800,-600, -840,-620, -850,-580, -900,-550, -920,-650,
		-940,-630, -970,-640, -1000,-520, -1100,-590, -1110,-550, -1130,-580,
		-1140,-630, -1160,-600, -1200,-650, -1210,-600, -1240,-620, -1280,-570,
		-1290,-600, -1300,-590, -1340,-660, -1360,-630, -1370,-650, -1390,-675], true);
	addLines([-550,-70, -550,-400, -450,-400, -450,-350, -500,-300, -500,-70], true);
	addLines([-250,-700, -275,-650, -300,-700], true); //triangle
	addLines([-150,-550, -175,-500, -200,-550], true); //triangle
	addLines([-100,-850, -125,-800, -150,-850], true); //triangle
	addLines([175,-775, 150,-725, 125,-775], true); //triangle
	addLines([225,-1025, 200,-975, 175,-1025], true); //triangle
	addLines([300,-950, 275,-900, 250,-950], true); //triangle
	addLines([400,-1100, 375,-1050, 350,-1100], true); //triangle
	addLines([600,-1150, 575,-1100, 550,-1150], true); //triangle
	addLines([950,-1250, 875,-1100, 800,-1250], true); //triangle
	addLines([-250,-250, -200,-250, -200,-225, -250,-225], true, { collidesWithPlayer: false });
	addLines([-700,2000, -700,-300, -750,-350, //pit
		-750,-400, -650,-400, //wall
		-650,40, -70,40, //flat area
		-40,20,  40,20, //spawn point
		70,80, 80,130, 90,200, 100,300, 100,800]); //cliff
	var pts = [];
	for(i = 0; i < 20; i++) {
		pts.push(400 - 300 * Math.cos(3 * Math.PI / 4 * (i / 20)));
		pts.push(800 + 300 * Math.sin(3 * Math.PI / 4 * (i / 20)));
	}
	pts.push(580);
	pts.push(1100);
	addLines(pts, false, { slideOnly: true }); //launch
	pts = [];
	for(i = 0; i < 300; i++) {
		pts.push(580 + i * (30 * (1 + i / 700)));
		pts.push(1100 - 50 * Math.cos(Math.PI * i / 10) * (i / 20));
	}
	addLines(pts, false);

	//helper method
	function addLines(points, closed, opts) {
		for(var i = 0; i < points.length - 2; i += 2) {
			level.addLine(points[i+0], points[i+1], points[i+2], points[i+3], opts || {});
		}
		if(closed) {
			level.addLine(points[points.length-2], points[points.length-1], points[0], points[1], opts || {});
		}
	}

	return level;
});