var classes = {
    Car: {
	color:   "blue",
	minSize: {x: 30, y: 15},
    },
    Motorbike: {
	color:   "green",
	minSize: {x: 15, y: 15},
    },
    Pedestrian: {
	color:   "red",
	minSize: {x: 10, y: 15},
    },
    Bus: {
	color:   "yellow",
	minSize: {x: 30, y: 15},
    },
    Truck: {
	color:   "white",
	minSize: {x: 30, y: 15},
    },
    Bicycle: {
	color:   "orange",
	minSize: {x: 15, y: 15},
    },
    Train: {
	color:   "cyan",
	minSize: {x: 30, y: 15},
    },
    SVehicle: {
	color:   "purple",
	minSize: {x: 30, y: 15},
    },
    Signal: {
	color:   "yellow",
	minSize: {x: 10, y: 10},
    },
    Signs: {
	color:   "green",
	minSize: {x: 15, y: 15}
    },
    target: function() {
	return this[this.__target];
    },
    select: function(cls) {
	this.onChange(cls);
	if (bboxes.getTarget() != undefined) {
	    bboxes.changeClass(bboxes.__target, cls);
	}
	this.__target = cls;
    },
    onChange: function(cls) {
	$("#class-table-" + this.__target).css("color", "#fafafa");
	$("#class-table-" + cls).css("color", "#4894f4");
	this.__target = cls;
    },
    color: function(cls) {
	return this[cls].color;
    },
    minSize: function(cls) {
	return this[cls].minSize;
    },
    targetName: function() {
	return this.__target;
    },
    __target: "Car"
}
