if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	var nextObstacleId = 0;
	function Obstacle() {
		this._id = nextObstacleId++;
		this.type = null;
	}
	Obstacle.prototype.sameAs = function(other) {
		return other && (this._id === other._id);
	}
	return Obstacle;
});