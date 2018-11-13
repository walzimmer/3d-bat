var classesBoundingBox = {
    "Vehicle": {
        color: '#51C38C',
        index: 0,
        nextTrackId: 1
    },
    "Truck": {
        color: '#EBCF36',
        index: 1,
        nextTrackId: 1
    },
    "Motorcycle": {
        color: '#FF604B',
        index: 2,
        nextTrackId: 1
    },
    "Bicycle": {
        color: '#F37CB2',
        index: 3,
        nextTrackId: 1

    },
    "Pedestrian": {
        color: '#74BAF5',
        index: 4,
        nextTrackId: 1
    },
    target: function () {
        return this[this.__target];
    },
    select: function (label) {
        this.onChange(label);
        if (annotationObjects.getSelectedBoundingBox() !== undefined) {
            annotationObjects.changeClass(annotationObjects.__selectionIndex, label);
        }
        this.__target = label;
    },
    onChange: function (label) {
        this.__target = label;
    },
    color: function (label) {
        return this[label].color;
    },
    targetName: function () {
        return this.__target;
    },
    __target: "Vehicle"
};