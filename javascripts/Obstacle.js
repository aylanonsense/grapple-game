define(function() {
	var nextObstacleId = 0;
	function Obstacle() {
		this._obstacleId = nextObstacleId++;
		this.type = null;
	}
	Obstacle.prototype.sameAs = function(other) {
		return other && (this._obstacleId === other._obstacleId);
	};
	Obstacle.prototype.sameAsAny = function(others) {
		if(!others) {
			return false;
		}
		for(var i = 0; i < others.length; i++) {
			if(this.sameAs(others[i])) {
				return true;
			}
		}
		return false;
	}
	return Obstacle;
});