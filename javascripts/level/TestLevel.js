define([
	'level/Level',
	'platform/Platform'
], function(
	Level,
	Platform
) {
	function TestLevel() {
		Level.call(this);

		//create level geometry
		//floating V pit
		this.addPoly([-1600,-500, -1575,-500, -1550,-300,
			-1525,-500, -1500,-500, -1550,-200]);
		//spikes + mountain
		this.addPoly([-1400,-675, -1400,-900, -1200,-900,
			-1180,-1000, -1150,-980, -1130,-1100, -1110,-1070, -1100,-1200,
			-1060,-1400, -1030,-1650, -1010,-1500, -960,-1550, -950,-1320,
			-930,-1390, -920,-1220, -900,-1220, -880,-970, -860,-1000,
			-850,-900, -650,-900, -650,-675,
			-670,-650, -690,-675, -700,-620, -710,-650, -730,-580, -760,-675,
			-780,-650, -800,-600, -840,-620, -850,-580, -900,-550, -920,-650,
			-940,-630, -970,-640, -1000,-520, -1100,-590, -1110,-550, -1130,-580,
			-1140,-630, -1160,-600, -1200,-650, -1210,-600, -1240,-620, -1280,-570,
			-1290,-600, -1300,-590, -1340,-660, -1360,-630, -1370,-650, -1390,-675]);
		this.addPoly([-550,-70, -550,-400, -450,-400, -450,-350, -500,-300, -500,-70]);
		//triangles
		this.addPoly([-250,-700, -275,-650, -300,-700]);
		this.addPoly([-150,-550, -175,-500, -200,-550]);
		this.addPoly([-100,-850, -125,-800, -150,-850]);
		this.addPoly([175,-775, 150,-725, 125,-775]);
		this.addPoly([225,-1025, 200,-975, 175,-1025]); 
		this.addPoly([300,-950, 275,-900, 250,-950]);
		this.addPoly([400,-1100, 375,-1050, 350,-1100]);
		this.addPoly([600,-1150, 575,-1100, 550,-1150]);
		this.addPoly([950,-1250, 875,-1100, 800,-1250]);
		//platforms near spawn
		this.addPoly([-250,-250, -200,-250, -200,-225, -250,-225], { grapplesOnly: true });
		this.addPoly([150,-250, 200,-250, 200,-225, 150,-225], { noGrapples: true });
		//spawn point + cliff
		this.addPoly([-700,2000, -700,-300, -750,-350,
			-750,-400, -650,-400,
			-650,40, -70,40,
			-40,20,  40,20,
			70,80, 80,130, 90,200, 100,300, 100,800], { closed: false });
		//slippery launch slope
		var pts = [];
		for(i = 0; i < 20; i++) {
			pts.push(400 - 300 * Math.cos(3 * Math.PI / 4 * (i / 20)));
			pts.push(800 + 300 * Math.sin(3 * Math.PI / 4 * (i / 20)));
		}
		pts.push(580);
		pts.push(1100);
		this.addPoly(pts, { closed: false, slippery: true });
		//cos waves
		pts = [];
		for(i = 0; i < 300; i++) {
			pts.push(580 + i * (30 * (1 + i / 700)));
			pts.push(1100 - 50 * Math.cos(Math.PI * i / 10) * (i / 20));
		}
		this.addPoly(pts, { closed: false });
		// this.addPoly([-300,-200, -200,-200, -200,-150, -300,-150], { moving: true, velX: 20 });
		//this.addPoly([-100,200, 0,200, 0,250, -100,250], { moving: true, velY: -600 });
		var platform = this.addPlatform(new Platform({ x: -50, y: 50, points: [75,25, -75,25, -75,-25, 75,-25] }));
		platform.moveTo(1000, -500, { speed: 100 });
	}
	TestLevel.prototype = Object.create(Level.prototype);
	return TestLevel;
});