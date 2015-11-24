define(function() {
	function Level() {
		this.player = null;
		this.entities = [];
		this.platforms = [];
	}
	Level.prototype.addPlatform = function(platform) {
		this.platforms.push(platform);
		return platform;
	};
	return Level;
});