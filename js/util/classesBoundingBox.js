var classesBoundingBox = {
    "human.pedestrian.adult": {
        color: '#3ABB9D',
        minSize: {x: 10, y: 15},
    },
    "human.pedestrian.child": {
        color: '#4DA664',
        minSize: {x: 10, y: 15}
    },
    "human.pedestrian.wheelchair": {
        color: '#2F6CAD',
        minSize: {x: 10, y: 15}
    },
    "human.pedestrian.stroller": {
        color: '#4590B6',
        minSize: {x: 10, y: 15}
    },
    "human.pedestrian.personal_mobility": {
        color: '#5CADCF',
        minSize: {x: 10, y: 15}
    },
    "human.pedestrian.police_officer": {
        color: '#3585C5',
        minSize: {x: 10, y: 15}
    },
    "human.pedestrian.construction_worker": {
        color: '#2CA786',
        minSize: {x: 10, y: 15}
    },
    "animal": {
        color: '#6ABB72',
        minSize: {x: 30, y: 15},
    },
    "vehicle.car": {
        color: '#E66B5B',
        minSize: {x: 10, y: 15}
    },
    "vehicle.motorcycle": {
        color: '#A28F85',
        minSize: {x: 10, y: 15}
    },
    "vehicle.bicycle": {
        color: '#F79E3D',
        minSize: {x: 10, y: 15}
    },
    "vehicle.bus.bendy": {
        color: '#75706B',
        minSize: {x: 10, y: 15}
    },
    "vehicle.bus.rigid": {
        color: '#EE7841',
        minSize: {x: 10, y: 15}
    },
    "vehicle.truck": {
        color: '#D1D5D8',
        minSize: {x: 10, y: 15}
    },
    "vehicle.construction": {
        color: '#CC4846',
        minSize: {x: 10, y: 15}
    },
    "vehicle.emergency.ambulance": {
        color: '#DC5047',
        minSize: {x: 10, y: 15}
    },
    "vehicle.emergency.police": {
        color: '#28324E',
        minSize: {x: 10, y: 15}
    },
    "vehicle.trailer": {
        color: '#EFEFEF',
        minSize: {x: 10, y: 15}
    },
    "movable_object.barrier": {
        color: '#485675',
        minSize: {x: 10, y: 15}
    },
    "movable_object.trafficcone": {
        color: '#F2D46F',
        minSize: {x: 10, y: 15}
    },
    "movable_object.pushable_pullable": {
        color: '#533D7F',
        minSize: {x: 10, y: 15}
    },
    "movable_object.debris": {
        color: '#9069B5',
        minSize: {x: 10, y: 15}
    },
    "static_object.bicycle_rack": {
        color: '#F7C23E',
        minSize: {x: 10, y: 15}
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
    __target: "vehicle.car"
};