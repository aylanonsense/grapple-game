if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(function() {
	var nextObstacleId = 0;
	function Obstacle() {
		this._obstacleId = nextObstacleId++;
		this.type = null;
	}
	Obstacle.prototype.sameAs = function(other) {
		return other && (this._obstacleId === other._obstacleId);
	};
	return Obstacle;
});