define([
	'Global',
	'display/Canvas',
	'display/Camera'
], function(
	Global,
	Canvas,
	Camera
) {
	var CTX = Canvas && Canvas.getContext("2d");

	function applyDrawOptions(opts, defualtDrawMode) {
		var result = {
			shouldFill: false,
			shouldStroke: false,
			offset: { x: -Camera.pos.x, y: -Camera.pos.y }
		};

		//figure out if we should stroke
		if(!opts || !opts.fill || opts.stroke) {
			result.shouldStroke = true;
			CTX.strokeStyle = opts && opts.stroke || '#fff';
			CTX.lineWidth = opts && (opts.thickness || opts.thickness === 0) ? opts.thickness : 1;
		}
		else if(opts && opts.color && defualtDrawMode === 'stroke') {
			result.shouldStroke = true;
			CTX.strokeStyle = opts && opts.color || '#fff';
			CTX.lineWidth = opts && (opts.thickness || opts.thickness === 0) ? opts.thickness : 1;
		}

		//figure out if we should fille
		if(opts && opts.fill) {
			result.shouldFill = true;
			CTX.fillStyle = opts.fill || '#fff';
			result.shouldFill = true;
		}
		else if(opts && opts.color && defualtDrawMode === 'fill') {
			result.shouldFill = true;
			CTX.fillStyle = opts.color || '#fff';
			result.shouldFill = true;
		}

		//fixed drawings will ignore the position of the camera
		if(opts && opts.fixed === true) {
			result.offset.x = 0;
			result.offset.y = 0;
		}

		//return the results
		return result;
	}

	return {
		rect: function(x, y, width, height, opts) {
			//(Rect) or (Rect, opts)
			if(arguments.length < 3) {
				opts = y; height = x.height; width = x.width; y = x.top; x = x.left;
			}
			var result = applyDrawOptions(opts, 'fill');
			if(result.shouldFill) {
				CTX.fillRect(x + result.offset.x, y + result.offset.y, width, height);
			}
			if(result.shouldStroke) {
				CTX.strokeRect(x + result.offset.x, y + result.offset.y, width, height);
			}
		},
		circle: function(x, y, r, opts) {
			var result = applyDrawOptions(opts, 'fill');
			CTX.beginPath();
			CTX.arc(x + result.offset.x, y + result.offset.y, r, 0, 2 * Math.PI);
			if(result.shouldFill) {
				CTX.fill();
			}
			if(result.shouldStroke) {
				CTX.stroke();
			}
		},
		line: function(x1, y1, x2, y2, opts) {
			//(Vector, Vector) or (Vector, Vector, opts)
			if(arguments.length < 4) {
				opts = x2; y2 = y1.y; x2 = y1.x; y1 = x1.y; x1 = x1.x;
			}
			var result = applyDrawOptions(opts, 'stroke');
			if(result.shouldStroke) {
				CTX.beginPath();
				CTX.moveTo(x1 + result.offset.x, y1 + result.offset.y);
				CTX.lineTo(x2 + result.offset.x, y2 + result.offset.y);
				CTX.stroke();
			}
		},
		poly: function(/* x1, y1, x2, y2, ..., */ opts) {
			var result = applyDrawOptions(opts, 'stroke');
			CTX.beginPath();
			CTX.moveTo(arguments[0] + result.offset.x, arguments[1] + result.offset.y);
			for(var i = 2; i < arguments.length - 1; i += 2) {
				CTX.lineTo(arguments[i] + result.offset.x, arguments[i + 1] + result.offset.y);
			}
			//this function assumes opts is given...
			opts = arguments[arguments.length - 1];
			if(opts && opts.close) {
				CTX.closePath();
			}
			if(result.shouldFill) {
				CTX.fill();
			}
			if(result.shouldStroke) {
				CTX.stroke();
			}
		}
	};
});