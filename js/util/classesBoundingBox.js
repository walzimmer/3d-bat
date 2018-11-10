var classesBoundingBox = {
    "Vehicle": {
        color: '#51C38C',
        minSize: {x: 10, y: 15},
        index: 0,
        nextTrackId: 1
    },
    "Truck": {
        color: '#EBCF36',
        minSize: {x: 10, y: 15},
        index: 1,
        nextTrackId: 1
    },
    "Motorcycle": {
        color: '#FF604B',
        minSize: {x: 10, y: 15},
        index: 2,
        nextTrackId: 1
    },
    "Bicycle": {
        color: '#F37CB2',
        minSize: {x: 10, y: 15},
        index: 3,
        nextTrackId: 1

    },
    "Pedestrian": {
        color: '#74BAF5',
        minSize: {x: 10, y: 15},
        index: 4,
        nextTrackId: 1
    },
    target: function () {
        return this[this.__target];
    },
    select: function (label) {
        this.onChange(label);
        if (annotationObjects.getSelectedBoundingBox() != undefined) {
            annotationObjects.changeClass(annotationObjects.__selectionIndex, label);
        }
        this.__target = label;
    },
    onChange: function (label) {
        $("#class-table-" + this.__target).css("color", "#fafafa");
        $("#class-table-" + label).css("color", "#4894f4");
        this.__target = label;
    },
    color: function (label) {
        return this[label].color;
    },
    minSize: function (cls) {
        return this[cls].minSize;
    },
    targetName: function () {
        return this.__target;
    },
    __target: "Vehicle"
};