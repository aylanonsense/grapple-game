define([
	'global',
	'display/canvas',
	'util/EventHelper'
], function(
	global,
	canvas,
	EventHelper
) {
	var events = new EventHelper([ 'mouse-event' ]);

	//add mouse handler
	function onMouseEvent(evt) {
		//evt.preventDefault();
		events.trigger('mouse-event', evt.type,
			evt.clientX - canvas.offsetLeft + document.body.scrollLeft,
			evt.clientY - canvas.offsetTop + document.body.scrollTop);
	}
	if(global.RENDER) {
		canvas.onmousedown = onMouseEvent;
		document.onmouseup = onMouseEvent;
		document.onmousemove = onMouseEvent;
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		}
	};
});
