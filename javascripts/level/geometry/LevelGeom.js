define(function() {
	var nextId = 0;
	function LevelGeom(type, opts) {
		opts = opts || {};
		this._levelGeomId = nextId++;
		this.geomType = type;
		this.collidesWithPlayer = opts.collidesWithPlayer !== false; //default: true
		this.collidesWithGrapple = opts.collidesWithGrapple !== false; //default: true
		this.jumpable = opts.jumpable !== false; //default: true
		this.slideOnly = opts.slideOnly === true; //default: false
	}
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