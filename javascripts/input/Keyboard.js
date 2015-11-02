define([
	'global',
	'display/canvas',
	'util/EventHelper'
], function(
	global,
	canvas,
	EventHelper
) {
	var events = new EventHelper([ 'key-event' ]);
	var keyboardState = {};
	for(var key in global.KEY_BINDINGS) {
		keyboardState[global.KEY_BINDINGS[key]] = false;
	}

	//add keyboard handler
	function onKeyboardEvent(evt) {
		var isDown = (evt.type === 'keydown');
		if(global.KEY_BINDINGS[evt.which]) {
			evt.preventDefault();
			if(keyboardState[global.KEY_BINDINGS[evt.which]] !== isDown) {
				keyboardState[global.KEY_BINDINGS[evt.which]] = isDown;
				events.trigger('key-event', global.KEY_BINDINGS[evt.which], isDown, keyboardState);
			}
		}
	}
	if(global.RENDER) {
		document.onkeyup = onKeyboardEvent;
		document.onkeydown = onKeyboardEvent;
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		}
	};
});