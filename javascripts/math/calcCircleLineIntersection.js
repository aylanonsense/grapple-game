define(function() {
	return function calcCircleLineIntersection(circleCenter, circleRadius, lineStart, lineEnd) {
		//calculate the discriminant
		var line = lineStart.createVectorTo(lineEnd);
		var vectorToCircle = lineStart.createVectorTo(circleCenter);
		var a = line.dot(line);
		var b = 2 * vectorToCircle.dot(line);
		var c = vectorToCircle.dot(vectorToCircle) - circleRadius * circleRadius;
		var discriminant = b * b - 4 * a * c;

		//we'll only have real roots if the discriminant is >= 0
		if(discriminant >= 0) {
			//we have two roots, the intersection is the one closest to the starting point of the line
			discriminant = Math.sqrt(discriminant);
			var root1 = (-b - discriminant) / (2 * a);
			var root2 = (-b + discriminant) / (2 * a);
			var lineLength = line.length();
			var vectorToRoot1 = line.clone().setLength(lineLength * -root1);
			var vectorToRoot2 = line.clone().setLength(lineLength * -root2);
			var vectorToIntersection = (vectorToRoot1.squareLength() < vectorToRoot2.squareLength() ?
					vectorToRoot1 : vectorToRoot2);

			//the intersection is only valid if it's actually on the circle's path (not past it)
			var distToIntersection = line.dot(vectorToIntersection) / lineLength;
			if(0 <= distToIntersection && distToIntersection <= lineLength) {
				//yay, there definitely was an intersection! return the vector point of the intersection
				return lineStart.clone().add(vectorToIntersection);
			}
		}

		//otherwise there is no intersection
		return false;
	};
});