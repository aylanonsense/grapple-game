define(function() {
	var nextLevelGeomId = 0;
	function LevelGeom(params) {
		params = params || {};
		this._levelGeomId = nextLevelGeomId++;
		this.levelGeomType = params.levelGeomType;

		this.slippery = params.slippery || false;
		this._grapplesOnly = params.grapplesOnly || false;
		this._noGrapples = params.noGrapples || false;
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
	LevelGeom.prototype.canCollideWithEntity = function(entity) {
		if(!entity) {
			return false;
		}
		else if(this._grapplesOnly) {
			return entity.entityType === 'Grapple';
		}
		else if(this._noGrapples) {
			return entity.entityType !== 'Grapple';
		}
		else {
			return true;
		}
	};
	LevelGeom.prototype.checkForCollisionWithEntity = function(enttiy) {
		throw new Error("Need to implement in subclasses");
	};
	return LevelGeom;
});