var classesBoundingBox = {
    "Vehicle": {
        color: '#51C38C',
        minSize: {x: 10, y: 15},
        index: 0
    },
    "Truck": {
        color: '#EBCF36',
        minSize: {x: 10, y: 15},
        index: 1
    },
    "Motorcycle": {
        color: '#FF604B',
        minSize: {x: 10, y: 15},
        index: 2
    },
    "Bicycle": {
        color: '#F37CB2',
        minSize: {x: 10, y: 15},
        index: 3
    },
    "Pedestrian": {
        color: '#74BAF5',
        minSize: {x: 10, y: 15},
        index: 4
    },
    target: function () {
        return this[this.__target];
    },
    select: function (cls) {
        this.onChange(cls);
        if (annotationObjects.getTarget() != undefined) {
            annotationObjects.changeClass(annotationObjects.__target, cls);
        }
        this.__target = cls;
    },
    onChange: function (cls) {
        $("#class-table-" + this.__target).css("color", "#fafafa");
        $("#class-table-" + cls).css("color", "#4894f4");
        this.__target = cls;
    },
    color: function (cls) {
        return this[cls].color;
    },
    minSize: function (cls) {
        return this[cls].minSize;
    },
    targetName: function () {
        return this.__target;
    },
    __target: "Vehicle"
};