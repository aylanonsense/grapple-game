define(function() {
	//a helper module that loads a sprite
	var SPRITES = {};
	return {
		load: function(name, require, onload, config) {
			//name represents the key in sprite-config
			if(SPRITES[name]) {
				onload(SPRITES[name]);
			}
			else {
				require([ 'display/Sprite' ], function(Sprite) {
					SPRITES[name] = new Sprite(name);
					onload(SPRITES[name]);
				});
			}
		}
	};
});