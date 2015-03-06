define(function() {
	var nextId = 0;
	function LevelGeom(type) {
		this._levelGeomId = nextId++;
		this.geomType = type;
		this._parents = [];
	}
	LevelGeom.prototype.addParent = function(other) {
		this._parents.push(other);
	};
	LevelGeom.prototype.isChildOf = function(other) {
		return other && other.sameAsAny(this._parents);
	};
	LevelGeom.prototype.sameAs = function(other) {
		return other && this._levelGeomId === other._levelGeomId;
	};
	LevelGeom.prototype.sameAsAny = function(others) {
		if(others) {
			for(var i = 0; i < others.length; i++) {
				if(this.sameAs(others[i])) {
					return true;
				}
			}
		}
		return false;
	};
	return LevelGeom;
});