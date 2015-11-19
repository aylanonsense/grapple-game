define([
	'math/Vector'
], function(
	Vector
) {
	var nextPlatformGeometryId = 0;
	function PlatformGeometry(params) {
		params = params || {};
		this._platformGeometryId = nextPlatformGeometryId++;
		this.platformGeometryType = params.type;

		this.slippery = params.slippery || false;
		this._grapplesOnly = params.grapplesOnly || false;
		this._noGrapples = params.noGrapples || false;

		this._vel = new Vector(0, 0);
		this._movement = new Vector(0, 0);
	}
	PlatformGeometry.prototype.sameAs = function(other) {
		return other && this._platformGeometryId === other._platformGeometryId;
	};
	PlatformGeometry.prototype.sameAsAny = function(others) {
		if(others) {
			for(var i = 0; i < others.length; i++) {
				if(this.sameAs(others[i])) {
					return true;
				}
			}
		}
		return false;
	};
	PlatformGeometry.prototype.move = function(movement, vel) {
		this._movement.copy(movement);
		this._vel.copy(vel);
	};
	PlatformGeometry.prototype.canCollideWithEntity = function(entity) {
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
	PlatformGeometry.prototype.checkForCollisionWithEntity = function(enttiy) {
		throw new Error("Need to implement in subclasses");
	};
	PlatformGeometry.prototype.render = function() {};
	return PlatformGeometry;
});