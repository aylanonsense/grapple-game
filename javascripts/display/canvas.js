define([
	'global'
], function(
	global
) {
	return (global.RENDER ? document.getElementById("canvas") : null);
});