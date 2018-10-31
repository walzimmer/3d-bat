var classesKeypoint = {
    "vehicle.rear_light_left": {
        color: '#B33234'
    },
    "vehicle.rear_light_right": {
        color: '#ff4345'
    },
    "vehicle.front_light_left": {
        color: '#ffffff'
    },
    "vehicle.front_light_right": {
        color: '#c4c4c4'
    },
    "vehicle.wheel_bottom": {
        color: '#565656'
    },
    target: function () {
        return this[this.__target];
    },
    // TODO: test add select method that runs code after keypoint was selected
    select: function (cls) {
        this.onChange(cls);
        if (keypointObjects.getTarget() !== undefined) {
            keypointObjects.changeClass(keypointObjects.__target, cls);
        }
        this.__target = cls;
    },
    // TODO: test change class of keypoint
    onChange: function (cls) {
        // $("#class-table-" + this.__target).css("color", "#fafafa");
        // $("#class-table-" + cls).css("color", "#4894f4");
        this.__target = cls;
    },
    color: function (cls) {
        return this[cls].color;
    },
    targetName: function () {
        return this.__target;
    },
    __target: "vehicle.rear_light_left"
};