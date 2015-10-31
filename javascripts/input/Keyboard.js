define([
	'Global',
	'display/Canvas',
	'util/EventHelper'
], function(
	Global,
	Canvas,
	EventHelper
) {
	var events = new EventHelper([ 'key-event' ]);
	var keyboardState = {};
	for(var key in Global.KEY_BINDINGS) {
		keyboardState[Global.KEY_BINDINGS[key]] = false;
	}

	//add keyboard handler
	function onKeyboardEvent(evt) {
		var isDown = (evt.type === 'keydown');
		if(Global.KEY_BINDINGS[evt.which]) {
			evt.preventDefault();
			if(keyboardState[Global.KEY_BINDINGS[evt.which]] !== isDown) {
				keyboardState[Global.KEY_BINDINGS[evt.which]] = isDown;
				events.trigger('key-event', Global.KEY_BINDINGS[evt.which], isDown, keyboardState);
			}
		}
	}
	if(Canvas) {
		document.onkeyup = onKeyboardEvent;
		document.onkeydown = onKeyboardEvent;
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		}
	};
});