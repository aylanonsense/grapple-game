define([
	'display/Canvas',
	'util/EventHelper'
], function(
	Canvas,
	EventHelper
) {
	var events = new EventHelper([ 'mouse-event' ]);

	//add mouse handler
	function onMouseEvent(evt) {
		evt.preventDefault();
		events.trigger('mouse-event', evt.type,
			evt.clientX - Canvas.offsetLeft + document.body.scrollLeft,
			evt.clientY - Canvas.offsetTop + document.body.scrollTop);
	}
	if(Canvas) {
		Canvas.onmousedown = onMouseEvent;
		document.onmouseup = onMouseEvent;
		document.onmousemove = onMouseEvent;
	}

	return {
		on: function(eventName, callback) {
			events.on(eventName, callback);
		}
	};
});