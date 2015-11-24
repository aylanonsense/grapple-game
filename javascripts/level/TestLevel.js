define([
	'level/Level',
	'entity/Player2',
	'entity/BouncyBall',
	'entity/BowlingBall',
	'platform/Platform'
], function(
	Level,
	Player,
	BouncyBall,
	BowlingBall,
	Platform
) {
	function TestLevel() {
		Level.call(this);

		//create entities
		this.player = new Player({ velX: -100, level: this });
		this.entities = [
			this.player,
			new BouncyBall({ x: 130, y: -225, level: this }),
			new BouncyBall({ x: 130, y: -275, level: this }),
			new BouncyBall({ x: 130, y: -325, level: this }),
			new BouncyBall({ x: 130, y: -375, level: this }),
			new BouncyBall({ x: 130, y: -425, level: this }),
			new BouncyBall({ x: 130, y: -475, level: this }),
			new BouncyBall({ x: 130, y: -525, level: this }),
			new BouncyBall({ x: 130, y: -575, level: this }),
			new BouncyBall({ x: 130, y: -625, level: this }),
			new BouncyBall({ x: 130, y: -675, level: this }),
			new BouncyBall({ x: -45, y: -225, level: this }),
			new BouncyBall({ x: -45, y: -275, level: this }),
			new BouncyBall({ x: -45, y: -325, level: this }),
			new BouncyBall({ x: -45, y: -375, level: this }),
			new BouncyBall({ x: -45, y: -425, level: this }),
			new BouncyBall({ x: -45, y: -475, level: this }),
			new BouncyBall({ x: -45, y: -525, level: this }),
			new BouncyBall({ x: -45, y: -575, level: this }),
			new BouncyBall({ x: -45, y: -625, level: this }),
			new BouncyBall({ x: -45, y: -675, level: this }),
			new BowlingBall({ x: 130, y: -200, level: this }),
			new BowlingBall({ x: 130, y: -250, level: this }),
			new BowlingBall({ x: 130, y: -300, level: this }),
			new BowlingBall({ x: 130, y: -350, level: this }),
			new BowlingBall({ x: 130, y: -400, level: this }),
			new BowlingBall({ x: 130, y: -450, level: this }),
			new BowlingBall({ x: 130, y: -500, level: this }),
			new BowlingBall({ x: 130, y: -550, level: this }),
			new BowlingBall({ x: 130, y: -600, level: this }),
			new BowlingBall({ x: 130, y: -650, level: this }),
			new BowlingBall({ x: -45, y: -200, level: this }),
			new BowlingBall({ x: -45, y: -250, level: this }),
			new BowlingBall({ x: -45, y: -300, level: this }),
			new BowlingBall({ x: -45, y: -350, level: this }),
			new BowlingBall({ x: -45, y: -400, level: this }),
			new BowlingBall({ x: -45, y: -450, level: this }),
			new BowlingBall({ x: -45, y: -500, level: this }),
			new BowlingBall({ x: -45, y: -550, level: this }),
			new BowlingBall({ x: -45, y: -600, level: this }),
			new BowlingBall({ x: -45, y: -650, level: this })
		];

		//create platforms
		//floating V pit
		this.addPlatform(new Platform({ points: [-1600,-500, -1575,-500, -1550,-300,
			-1525,-500, -1500,-500, -1550,-200] }));
		//spikes + mountain
		this.addPlatform(new Platform({ points: [-1400,-675, -1400,-900, -1200,-900,
			-1180,-1000, -1150,-980, -1130,-1100, -1110,-1070, -1100,-1200,
			-1060,-1400, -1030,-1650, -1010,-1500, -960,-1550, -950,-1320,
			-930,-1390, -920,-1220, -900,-1220, -880,-970, -860,-1000,
			-850,-900, -650,-900, -650,-675,
			-670,-650, -690,-675, -700,-620, -710,-650, -730,-580, -760,-675,
			-780,-650, -800,-600, -840,-620, -850,-580, -900,-550, -920,-650,
			-940,-630, -970,-640, -1000,-520, -1100,-590, -1110,-550, -1130,-580,
			-1140,-630, -1160,-600, -1200,-650, -1210,-600, -1240,-620, -1280,-570,
			-1290,-600, -1300,-590, -1340,-660, -1360,-630, -1370,-650, -1390,-675] }));
		this.addPlatform(new Platform({ points: [-550,-70, -550,-400, -450,-400, -450,-350, -500,-300, -500,-70] }));
		//triangles
		this.addPlatform(new Platform({ points: [-250,-700, -275,-650, -300,-700] }));
		this.addPlatform(new Platform({ points: [-150,-550, -175,-500, -200,-550] }));
		this.addPlatform(new Platform({ points: [-100,-850, -125,-800, -150,-850] }));
		this.addPlatform(new Platform({ points: [175,-775, 150,-725, 125,-775] }));
		this.addPlatform(new Platform({ points: [225,-1025, 200,-975, 175,-1025] })); 
		this.addPlatform(new Platform({ points: [300,-950, 275,-900, 250,-950] }));
		this.addPlatform(new Platform({ points: [400,-1100, 375,-1050, 350,-1100] }));
		this.addPlatform(new Platform({ points: [600,-1150, 575,-1100, 550,-1150] }));
		this.addPlatform(new Platform({ points: [950,-1250, 875,-1100, 800,-1250] }));
		//platforms near spawn
		this.addPlatform(new Platform({ points: [-250,-250, -200,-250, -200,-225, -250,-225] }));
		this.addPlatform(new Platform({ points: [150,-250, 200,-250, 200,-225, 150,-225] }));
		//spawn point + cliff
		this.addPlatform(new Platform({ points: [-700,2000, -700,-300, -750,-350,
			-750,-400, -650,-400,
			-650,40, -70,40,
			-40,20,  40,20,
			70,80, 80,130, 90,200, 100,300, 100,800] }));
		//slippery launch slope
		var pts = [580,2000, 100,2000];
		for(i = 0; i < 20; i++) {
			pts.push(400 - 300 * Math.cos(3 * Math.PI / 4 * (i / 20)));
			pts.push(800 + 300 * Math.sin(3 * Math.PI / 4 * (i / 20)));
		}
		this.addPlatform(new Platform({ points: pts }));
		//cos waves
		pts = [20000,3000, 580,3000];
		for(i = 0; i < 300; i++) {
			pts.push(580 + i * (30 * (1 + i / 700)));
			pts.push(1100 - 50 * Math.cos(Math.PI * i / 10) * (i / 20));
		}
		this.addPlatform(new Platform({ points: pts }));
		// this.addPlatform(new Platform({ points: [-300,-200, -200,-200, -200,-150, -300,-150], { moving: true, velX: 20 });
		//this.addPlatform(new Platform({ points: [-100,200, 0,200, 0,250, -100,250], { moving: true, velY: -600 });
		var platform = this.addPlatform(new Platform({ x: -50, y: 50, points: [75,25, -75,25, -75,-25, 75,-25] }));
		platform.moveTo(1000, -500, { speed: 100 });
		// var platform = this.addPlatform(new Platform({ x: -300, y: -175, points: [75,325, -75,325, -75,-325, 75,-325] }));
		// platform.moveTo(150, -175, { speed: 2000 });
	}
	TestLevel.prototype = Object.create(Level.prototype);
	return TestLevel;
});