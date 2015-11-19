define([
	'global',
	'display/canvas',
	'display/camera'
], function(
	global,
	canvas,
	camera
) {
	var CTX = global.RENDER ? canvas.getContext("2d") : null;

	function applyDrawParams(params, defualtDrawMode) {
		var result = {
			shouldFill: false,
			shouldStroke: false,
			offset: { x: -camera.pos.x, y: -camera.pos.y }
		};

		//figure out if we should stroke
		if(!params || !params.fill || params.stroke) {
			result.shouldStroke = true;
			CTX.strokeStyle = params && params.stroke || '#fff';
			CTX.lineWidth = params && (params.thickness || params.thickness === 0) ? params.thickness : 1;
		}
		else if(params && params.color && defualtDrawMode === 'stroke') {
			result.shouldStroke = true;
			CTX.strokeStyle = params && params.color || '#fff';
			CTX.lineWidth = params && (params.thickness || params.thickness === 0) ? params.thickness : 1;
		}

		//figure out if we should fill
		if(params && params.fill) {
			result.shouldFill = true;
			CTX.fillStyle = params.fill || '#fff';
			result.shouldFill = true;
		}
		else if(params && params.color && defualtDrawMode === 'fill') {
			result.shouldFill = true;
			CTX.fillStyle = params.color || '#fff';
			result.shouldFill = true;
		}

		//fixed drawings will ignore the position of the camera
		if(params && params.fixed === true) {
			result.offset.x = 0;
			result.offset.y = 0;
		}

		//return the results
		return result;
	}

	return {
		rect: function(x, y, width, height, params) {
			if(global.RENDER) {
				//(Rect) or (Rect, params)
				if(arguments.length < 3) {
					params = y; height = x.height; width = x.width; y = x.top; x = x.left;
				}
				var result = applyDrawParams(params, 'fill');
				if(result.shouldFill) {
					CTX.fillRect(x + result.offset.x, y + result.offset.y, width, height);
				}
				if(result.shouldStroke) {
					CTX.strokeRect(x + result.offset.x, y + result.offset.y, width, height);
				}
			}
		},
		circle: function(x, y, r, params) {
			if(global.RENDER) {
				var result = applyDrawParams(params, 'fill');
				CTX.beginPath();
				CTX.arc(x + result.offset.x, y + result.offset.y, r, 0, 2 * Math.PI);
				if(result.shouldFill) {
					CTX.fill();
				}
				if(result.shouldStroke) {
					CTX.stroke();
				}
			}
		},
		line: function(x1, y1, x2, y2, params) {
			if(global.RENDER) {
				//(Vector, Vector) or (Vector, Vector, params)
				if(arguments.length < 4) {
					params = x2; y2 = y1.y; x2 = y1.x; y1 = x1.y; x1 = x1.x;
				}
				var result = applyDrawParams(params, 'stroke');
				if(result.shouldStroke) {
					CTX.beginPath();
					CTX.moveTo(x1 + result.offset.x, y1 + result.offset.y);
					CTX.lineTo(x2 + result.offset.x, y2 + result.offset.y);
					CTX.stroke();
				}
			}
		},
		poly: function(/* x1, y1, x2, y2, ..., */ params) {
			if(global.RENDER) {
				params = arguments.length % 2 === 0 ? {} : arguments[arguments.length - 1];
				var result = applyDrawParams(params, 'stroke');
				CTX.beginPath();
				CTX.moveTo(arguments[0] + result.offset.x, arguments[1] + result.offset.y);
				for(var i = 2; i < arguments.length - 1; i += 2) {
					CTX.lineTo(arguments[i] + result.offset.x, arguments[i + 1] + result.offset.y);
				}
				if(params && params.close) {
					CTX.closePath();
				}
				if(result.shouldFill) {
					CTX.fill();
				}
				if(result.shouldStroke) {
					CTX.stroke();
				}
			}
		},
		image: function(canvas, x1, y1, x2, y2, width, height, params) {
			if(global.RENDER) {
				params = params || {};
				var offset = {
					x: params.fixed ? 0 : -camera.pos.x,
					y: params.fixed ? 0 : -camera.pos.y
				};
				CTX.drawImage(canvas, x1, y1, width, height, x2 + offset.x, y2 + offset.y, width, height);
			}
		}
	};
});