let classesBoundingBox = {
    "vehicle": {
        color: '#51C38C',
        index: 0,
        nextTrackId: 1
    },
    "truck": {
        color: '#EBCF36',
        index: 1,
        nextTrackId: 1
    },
    "motorcycle": {
        color: '#FF604B',
        index: 2,
        nextTrackId: 1
    },
    "bicycle": {
        color: '#F37CB2',
        index: 3,
        nextTrackId: 1

    },
    "pedestrian": {
        color: '#74BAF5',
        index: 4,
        nextTrackId: 1
    },
    // nuscenes
    classNameArray: ["human.pedestrian.adult",
        "human.pedestrian.child",
        "human.pedestrian.wheelchair",
        "human.pedestrian.stroller",
        "human.pedestrian.personal_mobility",
        "human.pedestrian.police_officer",
        "human.pedestrian.construction_worker",
        "animal",
        "vehicle.car",
        "vehicle.motorcycle",
        "vehicle.bicycle",
        "vehicle.bus.bendy",
        "vehicle.bus.rigid",
        "vehicle.truck",
        "vehicle.construction",
        "vehicle.emergency.ambulance",
        "vehicle.emergency.police",
        "vehicle.trailer",
        "movable_object.barrier",
        "movable_object.trafficcone",
        "movable_object.pushable_pullable",
        "movable_object.debris",
        "static_object.bicycle_rack"],
    // nuscenes
    colorArray: ['#3ABB9D', '#4DA664', '#2F6CAD', '#4590B6', '#5CADCF', '#3585C5', '#2CA786', '#6ABB72', '#E66B5B', '#A28F85',
        '#F79E3D', '#75706B', '#EE7841', '#D1D5D8', '#CC4846', '#DC5047', '#28324E', '#EFEFEF', '#485675', '#F2D46F', '#533D7F',
        '#9069B5', '#F7C23E'],
    colorIdx: 0,
    content: [],
    addNuSceneLabel: function (label) {
        if (this.content[label] === undefined) {
            this.content[label] = {color: this.colorArray[this.colorIdx], index: this.colorIdx, nextTrackId: 1};
            this.colorIdx++;
        }
    },
    target: function () {
        if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
            return this.content[this.__target];
        } else {
            return this[this.__target];
        }

    },
    select: function (label) {
        this.onChange(label);

        let changeClassOperation = {
            "type": "classLabel",
            "objectIndex": annotationObjects.__selectionIndexCurrentFrame,
            "previousClass": annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndexCurrentFrame]["class"],
            "currentClass": label
        };

        if (annotationObjects.getSelectedBoundingBox() !== undefined) {
            annotationObjects.changeClass(annotationObjects.__selectionIndexCurrentFrame, label);
        }

        operationStack.push(changeClassOperation);


        this.__target = label;
        this.currentClass = label;
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
    getCurrentClass: function () {
        return this.currentClass;
    },
    __target: "vehicle",
    currentClass: "vehicle"
};