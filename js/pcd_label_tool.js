let canvasBEV;
let canvasSideView;
let canvasFrontView;
let views;
let grid;

let orthographicCamera;
let perspectiveCamera;
let currentCamera;

let cameraBEV;
let cameraSideView;
let cameraFrontView;

let currentOrbitControls;
let controlsTarget = new THREE.Vector3(0, 0, 0);
let orthographicOrbitControls;
let perspectiveOrbitControls;
let pointerLockControls;
let pointerLockObject;
let transformControls;
let mapControlsBev;
let mapControlsFrontView;
let mapControlsSideView;

let scene;
let projector;

let renderer;
let rendererBev;
let rendererSideView;
let rendererFrontView;

let clock;
let container;
let keyboard;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let rotateLeft = false;
let rotateRight = false;
let rotateUp = false;
let rotateDown = false;
let headerHeight = 50;
let translationVelocity = new THREE.Vector3();
let rotationVelocity = new THREE.Vector3();
let translationDirection = new THREE.Vector3();
let rotationDirection = new THREE.Vector3();
let prevTime = performance.now();

// let stats;
let cube;
let interpolationObjIndexCurrentFile = -1;
let interpolationObjIndexNextFile = -1;
let interpolateBtn;

// let keyboard = new KeyboardState();

let guiAnnotationClasses = new dat.GUI({autoPlace: true, width: 90, resizable: false});
let guiBoundingBoxAnnotationMap;
let guiOptions = new dat.GUI({autoPlace: true, width: 350, resizable: false});
let numGUIOptions = 13;
let showProjectedPointsFlag = false;
let showGridFlag = false;
let filterGround = false;
let interpolationMode = false;
let folderBoundingBox3DArray = [];
let folderPositionArray = [];
let folderSizeArray = [];
let bboxFlag = true;
let clickFlag = false;
let clickedObjectIndex = -1;
let clickedObjectIndexPrevious = -1;
let mousePos = {x: 0, y: 0};
let intersectedObject;
let mouseDown = {x: 0, y: 0};
let mouseUp = {x: 0, y: 0};
let clickedPoint = THREE.Vector3();
let groundPointMouseDown;
let groundPlaneArray = [];
let clickedPlaneArray = [];
let birdsEyeViewFlag = true;
let cls = 0;
let cFlag = false;
let rFlag = false;
let rotWorldMatrix;
let rotObjectMatrix;
let circleArray = [];
let colorMap = [];
let activeColorMap = 'colorMapJet.js';
let currentPoints3D = [];
let currentDistances = [];
let spriteBehindObject;
let pointCloudFull;
let pointCloudWithoutGround;
let useTransformControls;
let dragControls = false;
let keyboardNavigation = false;
let canvas3D;

let parametersBoundingBox = {
    "Vehicle": function () {
        classesBoundingBox.select("Vehicle");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[0]).css('background-color', '#525252');
    },
    "Truck": function () {
        classesBoundingBox.select("Truck");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[1]).css('background-color', '#525252');
    },
    "Motorcycle": function () {
        classesBoundingBox.select("Motorcycle");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[2]).css('background-color', '#525252');
    },
    "Bicycle": function () {
        classesBoundingBox.select("Bicycle");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[3]).css('background-color', '#525252');
    },
    "Pedestrian": function () {
        classesBoundingBox.select("Pedestrian");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[4]).css('background-color', '#525252');
    },
};

function getObjectIndexByTrackIdAndClass(trackId, className, fileIdx) {
    for (let i = 0; i < annotationObjects.contents[fileIdx].length; i++) {
        let obj = annotationObjects.contents[fileIdx][i];
        if (obj["trackId"] === trackId && obj["class"] === className) {
            return i;
        }
    }
    return -1;
}

function interpolate() {
    interpolationObjIndexCurrentFile = annotationObjects.getSelectionIndex();
    let interpolationStartFileIndex = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"]);
    if (interpolationStartFileIndex === -1) {
        labelTool.logger.error("Interpolation failed. Select object to interpolate and try again.");
        return;
    }
    let numFrames = labelTool.currentFileIndex - interpolationStartFileIndex;
    let objectIndexStartFile = getObjectIndexByTrackIdAndClass(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex);
    let xDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["x"])) / numFrames;
    let yDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["y"])) / numFrames;
    let zDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["z"])) / numFrames;
    let rotationEnd = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationY"]);
    let rotationStart = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationY"]);
    let rotationDelta = (rotationEnd - rotationStart) / numFrames;
    let widthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"])) / numFrames;
    let heightDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"])) / numFrames;
    let depthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["depth"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["depth"])) / numFrames;


    for (let i = 1; i < numFrames; i++) {
        // cloning
        let clonedObject = jQuery.extend(true, {}, annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]);
        let clonedCubeObject = labelTool.cubeArray[interpolationStartFileIndex][objectIndexStartFile].clone();
        let clonedSprite = labelTool.spriteArray[interpolationStartFileIndex][objectIndexStartFile].clone();
        let objectIndexNextFrame = getObjectIndexByTrackIdAndClass(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex + i);
        // use length>2 because 1. element is insertIndex
        if (annotationObjects.contents[interpolationStartFileIndex + i] !== undefined && annotationObjects.contents[interpolationStartFileIndex + i].length > 0 && objectIndexNextFrame !== -1) {
            // if frame contains some objects, then find object with same trackId and overwrite it
            annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedObject;
            labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedCubeObject;
            labelTool.spriteArray[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedSprite;
        } else {
            // else clone object to new frame and adjusts interpolated position and size
            annotationObjects.contents[interpolationStartFileIndex + i].push(clonedObject);
            labelTool.cubeArray[interpolationStartFileIndex + i].push(clonedCubeObject);
            labelTool.spriteArray[interpolationStartFileIndex + i].push(clonedSprite);
            // recalculate index in next frame after cloning object
            objectIndexNextFrame = getObjectIndexByTrackIdAndClass(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex + i);
        }

        let newX = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["x"]) + i * xDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["x"] = newX;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["x"] = newX;

        let newY = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["y"]) + i * yDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["y"] = newY;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["y"] = newY;

        let newZ = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["z"]) + i * zDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["z"] = newZ;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["z"] = newZ;

        let newRotation = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationY"]) + i * rotationDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationY"] = newRotation;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["z"] = newRotation;

        let newWidth = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"]) + i * widthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["width"] = newWidth;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["x"] = newWidth;

        let newHeight = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"]) + i * heightDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["height"] = newHeight;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["y"] = newHeight;

        let newDepth = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["depth"]) + i * depthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["depth"] = newDepth;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["z"] = newDepth;
    }

    // Note: end frame index is the same as current file index
    // start position becomes current end position
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationY"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationY"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"] = labelTool.currentFileIndex;
    // set current frame to start position and start size
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (labelTool.currentFileIndex + 1) + ")";
    // enable start position and start size
    enableStartPositionAndSize();
    // remove end position folder and end position size
    folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Position (frame " + (labelTool.previousFileIndex + 1) + ")");
    folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Size (frame " + (labelTool.previousFileIndex + 1) + ")");
    // disable interpolate button
    disableInterpolationBtn();

    labelTool.logger.success("Interpolation successfully!");
}

let parameters = {
    save: function () {
        save();
    },
    download: function () {
        download();
    },
    i: -1,
    switch_view: function () {
        switchView();
    },
    datasets: labelTool.datasets.LISA_T,
    sequences: labelTool.sequencesLISAT.date_2018_05_23_001_frame_00042917_00043816_small,
    show_projected_points: false,
    show_nuscenes_labels: labelTool.showOriginalNuScenesLabels,
    show_field_of_view: false,
    show_grid: false,
    filter_ground: false,
    select_all_copy_label_to_next_frame: function () {
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            annotationObjects.contents[labelTool.currentFileIndex][i]["copyLabelToNextFrame"] = true;
            let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
            checkboxElem.firstChild.checked = true;
        }
    },
    unselect_all_copy_label_to_next_frame: function () {
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            // set all to false, expect the selected object (if interpolation mode active)
            if (interpolationMode === false || i !== annotationObjects.getSelectionIndex()) {
                annotationObjects.contents[labelTool.currentFileIndex][i]["copyLabelToNextFrame"] = false;
                let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
                checkboxElem.firstChild.checked = false;
                $(checkboxElem).children().first().removeAttr("checked");
            } else {
                annotationObjects.contents[labelTool.currentFileIndex][i]["copyLabelToNextFrame"] = true;
                let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
                checkboxElem.firstChild.checked = true;
            }
        }
    },
    interpolation_mode: false,
    interpolate: function () {
        if (interpolationMode === true) {
            interpolate();
        }
    },
};

/*********** Event handlers **************/

labelTool.onInitialize("PCD", function () {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    init();
    animate();
});


// Rotate an object around an arbitrary axis in world space
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply
    object.matrix = rotWorldMatrix;
    // code for r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}


function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js r50-r58:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // new code for Three.js r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}

PrismGeometry = function (vertices, height) {
    let shape = new THREE.Shape();
    (function f(ctx) {

        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);

    })(shape);

    let settings = {};
    settings.amount = height;
    settings.bevelEnabled = false;
    THREE.ExtrudeGeometry.call(this, shape, settings);

};
PrismGeometry.prototype = Object.create(THREE.ExtrudeGeometry.prototype);

function addObject(sceneObject, name) {
    sceneObject.name = name;
    // search whether object already exist
    for (let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        if (obj.name === name) {
            return;
        }
    }
    scene.add(sceneObject);
}

// Visualize 2d and 3d data
labelTool.onLoadData("PCD", function () {
    // remove previous loaded point clouds
    labelTool.removeObject("pointcloud_full");
    labelTool.removeObject("pointcloud_without_ground");
    // remove all bounding boxes

    // ASCII pcd files
    let pcdLoader = new THREE.PCDLoader();
    let pointCloudFullURL;
    let pointCloudWithoutGroundURL;
    pointCloudFullURL = 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/' + 'pointclouds/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
    pointCloudWithoutGroundURL = 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/' + 'pointclouds_without_ground/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';

    pcdLoader.load(pointCloudFullURL, function (mesh) {
        mesh.name = 'pointcloud_full';
        pointCloudFull = mesh.clone();
        scene.add(pointCloudFull);
    });

    pcdLoader.load(pointCloudWithoutGroundURL, function (mesh) {
        mesh.name = 'pointcloud_without_ground';
        pointCloudWithoutGround = mesh.clone();
    });

    // show FOV of camera within 3D pointcloud
    labelTool.removeObject('rightplane');
    labelTool.removeObject('leftplane');
    labelTool.removeObject('prism');
    if (labelTool.showFieldOfView === true) {
        labelTool.drawFieldOfView();
    }

    // draw positions of cameras
    // front (red)
    let posCamFront = [0, 0, 0, 1];
    let translation_vector_lidar_to_cam_front = [-7.151, 13.4829, 59.7093];//lat/vert/long
    let rotation_matrix_lidar_to_cam_front = [[0.9972, -0.0734, -0.0130],
        [-0.0094, 0.0500, -0.9987],
        [0.0740, 0.9960, 0.0492]];
    // let transformation_matrix_lidar_to_cam_front = [[0.9972, -0.0734, -0.013, -7.7151],
    //     [-0.0094, 0.05, -0.9987, 13.4829],
    //     [0.074, 0.996, 0.0492, 59.7093],
    //     [0, 0, 0, 1]];
    let transformation_matrix_lidar_to_cam_front = [[0.9972, -0.0734, -0.013, -3.402],
        [-0.0094, 0.05, -0.9987, 60.7137],
        [0.074, 0.996, 0.0492, -10.4301],
        [0, 0, 0, 1]];
    // posCamFront = matrixProduct4x4(transformation_matrix_lidar_to_cam_front, posCamFront);
    // long/vert/lat to lat,long,vert
    let camFrontGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    //camFrontGeometry.translate(translation_vector_lidar_to_cam_front[0]/100, translation_vector_lidar_to_cam_front[1]/100, translation_vector_lidar_to_cam_front[2]/100);//long,lat,vert
    //camFrontGeometry.translate(-posCamFront[0] / 100, posCamFront[2] / 100, -posCamFront[1] / 100);//long,lat,vert
    //camFrontGeometry.translate(posCamFront[0] / 100, posCamFront[1] / 100, posCamFront[2] / 100);//long,lat,vert

    // lat, vert, long -> -lat,long,vert
    // camFrontGeometry.translate(3.402 / 100, 60.7137 / 100, -10.4301 / 100);
    // lat, long, vert -> -lat,long,vert
    // camFrontGeometry.translate(3.402/100, 60.7137/100, -10.4301/100);
    // vert, long, lat -> lat, long, vert
    camFrontGeometry.translate(-3.402 / 100, 60.7137 / 100, -10.4301 / 100);
    // rotation_x = Math.atan2(rotation_matrix_lidar_to_cam_front[1][2], rotation_matrix_lidar_to_cam_front[2][2]);
    // rotation_y = Math.atan2(-rotation_matrix_lidar_to_cam_front[1][0], Math.sqrt(Math.pow(rotation_matrix_lidar_to_cam_front[1][2], 2) + Math.pow(rotation_matrix_lidar_to_cam_front[2][2], 2)));
    // rotation_z = Math.atan2(rotation_matrix_lidar_to_cam_front[0][1], rotation_matrix_lidar_to_cam_front[0][0]);
    // camFrontGeometry.rotateX(rotation_x);
    // camFrontGeometry.rotateY(rotation_y);
    // camFrontGeometry.rotateZ(rotation_z);
    let material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: false
    });
    let camFrontMesh = new THREE.Mesh(camFrontGeometry, material);
    addObject(camFrontMesh, 'cam-front-object');


    // front right (green)
    // let posCamFrontRight = [0, 0, 0, 1];
    let camFrontRightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // let transformation_matrix_lidar_to_cam_front_right = [[0.4899, -0.8708, 0.0407, 9.8561],
    //     [-0.0484, -0.0739, -0.9961, -2.676],
    //     [0.8704, 0.4861, -0.0785, -68.6021],
    //     [0, 0, 0, 1]];
    let transformation_matrix_lidar_to_cam_front_right = [[0.4899, -0.8708, 0.0407, 3.402],
        [-0.0484, -0.0739, -0.9961, -60.7137],
        [0.8704, 0.4861, -0.0785, 10.4301],
        [0, 0, 0, 1]];
    material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: false
    });
    // posCamFrontRight = matrixProduct4x4(transformation_matrix_lidar_to_cam_front_right, posCamFrontRight);
    //camFrontRightGeometry.translate(-posCamFrontRight[0] / 100, posCamFrontRight[2] / 100, -posCamFrontRight[1] / 100);//long,lat,vert
    //camFrontRightGeometry.translate(posCamFrontRight[0] / 100, posCamFrontRight[1] / 100, posCamFrontRight[2] / 100);//long,lat,vert
    //camFrontRightGeometry.translate(9.85241346 / 100, 68.60191404 / 100, -2.67767493 / 100);
    // lat, vert, long -> -lat,long,vert
    // camFrontRightGeometry.translate(48.50692475 / 100, 19.48044474 / 100, -7.04107117 / 100);
    // lat, long, vert-> -lat,long,vert
    // camFrontRightGeometry.translate(48.09335335, 102.48678976, -12.42106788);
    // vert, long, lat -> lat, long, vert
    //camFrontRightGeometry.translate(39.57155481 / 100, 17.14137681 / 100, -9.67783505 / 100);
    // lat, long, vert -> -lat, -long, vert
    camFrontRightGeometry.translate(59.35125262 / 100, 41.21713246 / 100, -15.43223025 / 100);

    let camFrontRightMesh = new THREE.Mesh(camFrontRightGeometry, material);
    addObject(camFrontRightMesh, 'cam-front-right-object');

    // back right (blue)
    let posCamBackRight = [0, 0, 0, 1];
    let camBackRightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let transformation_matrix_lidar_to_cam_back_right = [[-0.1932, -0.9775, -0.0856, -81.1507],
        [-0.09, 0.1046, -0.9904, -2.2588],
        [0.977, -0.1837, -0.1082, -60.6184],
        [0, 0, 0, 1]];
    material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
        transparent: false
    });
    // posCamBackRight = matrixProduct4x4(transformation_matrix_lidar_to_cam_back_right, posCamBackRight);
    //camBackRightGeometry.translate(-posCamBackRight[0] / 100, posCamBackRight[2] / 100, -posCamBackRight[1] / 100);//long,lat,vert
    // lat, vert, long -> -lat,long,vert
    //camBackRightGeometry.translate(142.34835515 / 100, -13.25334373 / 100, 4.29496243 / 100);
    // lat, long, vert-> -lat,long,vert
    //camBackRightGeometry.translate(142.07855337/100, 136.62693543/100, -9.68514665/100);
    // vert, long, lat -> lat, long, vert
    //camBackRightGeometry.translate(1.31533121e+02 / 100, -2.09856129e+01 / 100, 8.62667580e-02 / 100);
    // lat, long, vert -> -lat, -long, vert
    camBackRightGeometry.translate(47.93776844 / 100, -90.71772718 / 100, -8.13149812 / 100);
    let camBackRightMesh = new THREE.Mesh(camBackRightGeometry, material);
    addObject(camBackRightMesh, 'cam-back-right-object');

    // back (yellow)
    let posCamBack = [0, 0, 0, 1];
    let camBackGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let transformation_matrix_lidar_to_cam_back = [[-0.9988, 0.0439, 0.0189, -4.2963],
        [-0.0149, 0.0895, -0.9959, -2.0743],
        [-0.0455, -0.995, -0.0888, -95.8045],
        [0, 0, 0, 1]];
    material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: false
    });
    // posCamBack = matrixProduct4x4(transformation_matrix_lidar_to_cam_back, posCamBack);
    //camBackGeometry.translate(-posCamBack[0] / 100, posCamBack[2] / 100, -posCamBack[1] / 100);//long,lat,vert
    // lat, vert, long -> -lat,long,vert
    // camBackGeometry.translate(1.82904048 / 100, -94.42023039 / 100, 3.3679369 / 100);
    // lat, long, vert -> -lat,long,vert
    // camBackGeometry.translate(0.82947958/100, 216.3210723/100, -4.20344562/100);
    // vert, long, lat -> lat, long, vert
    //camBackGeometry.translate(-12.78487853 / 100, -94.7338226 / 100, -8.16539427 / 100);
    // lat, long, vert -> -lat, -long, vert
    camBackGeometry.translate(-4.07865574 / 100, -95.4603164 / 100, -13.38361257 / 100);
    let camBackMesh = new THREE.Mesh(camBackGeometry, material);
    addObject(camBackMesh, 'cam-back-object');

    // back left (light blue)
    let posCamBackLeft = [0, 0, 0, 1];
    let camBackLeftGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let transformation_matrix_lidar_to_cam_back_left = [[-0.0664, 0.995, 0.0742, 71.5185],
        [0.0397, 0.0769, -0.9962, 1.0001],
        [-0.997, -0.0632, -0.0446, -84.9344],
        [0, 0, 0, 1]];
    material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: false
    });
    // posCamBackLeft = matrixProduct4x4(transformation_matrix_lidar_to_cam_back_left, posCamBackLeft);
    //camBackLeftGeometry.translate(-posCamBackLeft[0] / 100, posCamBackLeft[2] / 100, -posCamBackLeft[1] / 100);//long,lat,vert
    // lat, vert, long -> -lat,long,vert
    //camBackLeftGeometry.translate(-127.9776 / 100, -24.2005 / 100, 5.4966 / 100);
    // vert, long, lat -> lat, long, vert
    //camBackLeftGeometry.translate(-138.99563226 / 100, -18.46088298 / 100, -2.0666138 / 100);
    // lat, long, vert -> -lat, -long, vert
    camBackLeftGeometry.translate(-75.37243686 / 100, -77.11760848 / 100, -15.77163041 / 100);
    let camBackLeftMesh = new THREE.Mesh(camBackLeftGeometry, material);
    addObject(camBackLeftMesh, 'cam-back-left-object');

    // front left (pink)
    let posCamFrontLeft = [0, 0, 0, 1];
    let camFrontLeftGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let transformation_matrix_lidar_to_cam_front_left = [[0.6119, 0.791, -0.0001, -0.9675],
        [0.0757, -0.0587, -0.9954, -1.8214],
        [-0.7873, 0.6091, -0.0958, -82.9684],
        [0, 0, 0, 1]];
    material = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
        transparent: false
    });
    // posCamFrontLeft = matrixProduct4x4(transformation_matrix_lidar_to_cam_front_left, posCamFrontLeft);
    //camFrontLeftGeometry.translate(-posCamFrontLeft[0] / 100, posCamFrontLeft[2] / 100, -posCamFrontLeft[1] / 100);//long,lat,vert
    // lat, vert, long -> -lat,long,vert
    //camFrontLeftGeometry.translate(-41.57191408 / 100, 18.40190109 / 100, -5.69111251 / 100);
    // vert, long, lat -> lat, long, vert
    //camFrontLeftGeometry.translate(-50.46079534 / 100, 20.4720023 / 100, -9.25820959 / 100);
    // lat, long, vert -> -lat, -long, vert
    camFrontLeftGeometry.translate(-59.9910821 / 100, 50.67448108 / 100, -14.11259497 / 100);
    let camFrontLeftMesh = new THREE.Mesh(camFrontLeftGeometry, material);
    addObject(camFrontLeftMesh, 'cam-front-left-object');


});

annotationObjects.onSelect("PCD", function (selectionIndex) {
    clickedPlaneArray = [];
    for (let i = 0; i < folderBoundingBox3DArray.length; i++) {
        if (folderBoundingBox3DArray[i] !== undefined) {
            folderBoundingBox3DArray[i].close();
        }
    }
    if (folderBoundingBox3DArray[selectionIndex] !== undefined) {
        folderBoundingBox3DArray[selectionIndex].open();
    }
    if (folderPositionArray[selectionIndex] !== undefined) {
        folderPositionArray[selectionIndex].open();
    }
    if (folderSizeArray[selectionIndex] !== undefined) {
        folderSizeArray[selectionIndex].open();
    }
});


annotationObjects.onChangeClass("PCD", function (index, label) {
    labelTool.cubeArray[labelTool.currentFileIndex][index].material.color.setHex(classesBoundingBox[label].color.replace("#", "0x"));
    // change also color of the bounding box
    labelTool.cubeArray[labelTool.currentFileIndex][index].children[0].material.color.setHex(classesBoundingBox[label].color.replace("#", "0x"));
});

//add remove function in dat.GUI
dat.GUI.prototype.removeFolder = function (name) {
    let folder = this.__folders[name];
    if (!folder) {
        return;
    }

    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
};

//calculate inverse matrix
function inverseMatrix(inMax) {
    let det = (inMax[0][0] * inMax[1][1] * inMax[2][2] * inMax[3][3]) + (inMax[0][0] * inMax[1][2] * inMax[2][3] * inMax[3][1]) + (inMax[0][0] * inMax[1][3] * inMax[2][1] * inMax[3][2])
        - (inMax[0][0] * inMax[1][3] * inMax[2][2] * inMax[3][1]) - (inMax[0][0] * inMax[1][2] * inMax[2][1] * inMax[3][3]) - (inMax[0][0] * inMax[1][1] * inMax[2][3] * inMax[3][2])
        - (inMax[0][1] * inMax[1][0] * inMax[2][2] * inMax[3][3]) - (inMax[0][2] * inMax[1][0] * inMax[2][3] * inMax[3][1]) - (inMax[0][3] * inMax[1][0] * inMax[2][1] * inMax[3][2])
        + (inMax[0][3] * inMax[1][0] * inMax[2][2] * inMax[3][1]) + (inMax[0][2] * inMax[1][0] * inMax[2][1] * inMax[3][3]) + (inMax[0][1] * inMax[1][0] * inMax[2][3] * inMax[3][2])
        + (inMax[0][1] * inMax[1][2] * inMax[2][0] * inMax[3][3]) + (inMax[0][2] * inMax[1][3] * inMax[2][0] * inMax[3][1]) + (inMax[0][3] * inMax[1][1] * inMax[2][0] * inMax[3][2])
        - (inMax[0][3] * inMax[1][2] * inMax[2][0] * inMax[3][1]) - (inMax[0][2] * inMax[1][1] * inMax[2][0] * inMax[3][3]) - (inMax[0][1] * inMax[1][3] * inMax[2][0] * inMax[3][2])
        - (inMax[0][1] * inMax[1][2] * inMax[2][3] * inMax[3][0]) - (inMax[0][2] * inMax[1][3] * inMax[2][1] * inMax[3][0]) - (inMax[0][3] * inMax[1][1] * inMax[2][2] * inMax[3][0])
        + (inMax[0][3] * inMax[1][2] * inMax[2][1] * inMax[3][0]) + (inMax[0][2] * inMax[1][1] * inMax[2][3] * inMax[3][0]) + (inMax[0][1] * inMax[1][3] * inMax[2][2] * inMax[3][0]);
    let inv00 = (inMax[1][1] * inMax[2][2] * inMax[3][3] + inMax[1][2] * inMax[2][3] * inMax[3][1] + inMax[1][3] * inMax[2][1] * inMax[3][2] - inMax[1][3] * inMax[2][2] * inMax[3][1] - inMax[1][2] * inMax[2][1] * inMax[3][3] - inMax[1][1] * inMax[2][3] * inMax[3][2]) / det;
    let inv01 = (-inMax[0][1] * inMax[2][2] * inMax[3][3] - inMax[0][2] * inMax[2][3] * inMax[3][1] - inMax[0][3] * inMax[2][1] * inMax[3][2] + inMax[0][3] * inMax[2][2] * inMax[3][1] + inMax[0][2] * inMax[2][1] * inMax[3][3] + inMax[0][1] * inMax[2][3] * inMax[3][2]) / det;
    let inv02 = (inMax[0][1] * inMax[1][2] * inMax[3][3] + inMax[0][2] * inMax[1][3] * inMax[3][1] + inMax[0][3] * inMax[1][1] * inMax[3][2] - inMax[0][3] * inMax[1][2] * inMax[3][1] - inMax[0][2] * inMax[1][1] * inMax[3][3] - inMax[0][1] * inMax[1][3] * inMax[3][2]) / det;
    let inv03 = (-inMax[0][1] * inMax[1][2] * inMax[2][3] - inMax[0][2] * inMax[1][3] * inMax[2][1] - inMax[0][3] * inMax[1][1] * inMax[2][2] + inMax[0][3] * inMax[1][2] * inMax[2][1] + inMax[0][2] * inMax[1][1] * inMax[2][3] + inMax[0][1] * inMax[1][3] * inMax[2][2]) / det;
    let inv10 = (-inMax[1][0] * inMax[2][2] * inMax[3][3] - inMax[1][2] * inMax[2][3] * inMax[3][0] - inMax[1][3] * inMax[2][0] * inMax[3][2] + inMax[1][3] * inMax[2][2] * inMax[3][0] + inMax[1][2] * inMax[2][0] * inMax[3][3] + inMax[1][0] * inMax[2][3] * inMax[3][2]) / det;
    let inv11 = (inMax[0][0] * inMax[2][2] * inMax[3][3] + inMax[0][2] * inMax[2][3] * inMax[3][0] + inMax[0][3] * inMax[2][0] * inMax[3][2] - inMax[0][3] * inMax[2][2] * inMax[3][0] - inMax[0][2] * inMax[2][0] * inMax[3][3] - inMax[0][0] * inMax[2][3] * inMax[3][2]) / det;
    let inv12 = (-inMax[0][0] * inMax[1][2] * inMax[3][3] - inMax[0][2] * inMax[1][3] * inMax[3][0] - inMax[0][3] * inMax[1][0] * inMax[3][2] + inMax[0][3] * inMax[1][2] * inMax[3][0] + inMax[0][2] * inMax[1][0] * inMax[3][3] + inMax[0][0] * inMax[1][3] * inMax[3][2]) / det;
    let inv13 = (inMax[0][0] * inMax[1][2] * inMax[2][3] + inMax[0][2] * inMax[1][3] * inMax[2][0] + inMax[0][3] * inMax[1][0] * inMax[2][2] - inMax[0][3] * inMax[1][2] * inMax[2][0] - inMax[0][2] * inMax[1][0] * inMax[2][3] - inMax[0][0] * inMax[1][3] * inMax[2][2]) / det;
    let inv20 = (inMax[1][0] * inMax[2][1] * inMax[3][3] + inMax[1][1] * inMax[2][3] * inMax[3][0] + inMax[1][3] * inMax[2][0] * inMax[3][1] - inMax[1][3] * inMax[2][1] * inMax[3][0] - inMax[1][1] * inMax[2][0] * inMax[3][3] - inMax[1][0] * inMax[2][3] * inMax[3][1]) / det;
    let inv21 = (-inMax[0][0] * inMax[2][1] * inMax[3][3] - inMax[0][1] * inMax[2][3] * inMax[3][0] - inMax[0][3] * inMax[2][0] * inMax[3][1] + inMax[0][3] * inMax[2][1] * inMax[3][0] + inMax[0][1] * inMax[2][0] * inMax[3][3] + inMax[0][0] * inMax[2][3] * inMax[3][1]) / det;
    let inv22 = (inMax[0][0] * inMax[1][1] * inMax[3][3] + inMax[0][1] * inMax[1][3] * inMax[3][0] + inMax[0][3] * inMax[1][0] * inMax[3][1] - inMax[0][3] * inMax[1][1] * inMax[3][0] - inMax[0][1] * inMax[1][0] * inMax[3][3] - inMax[0][0] * inMax[1][3] * inMax[3][1]) / det;
    let inv23 = (-inMax[0][0] * inMax[1][1] * inMax[2][3] - inMax[0][1] * inMax[1][3] * inMax[2][0] - inMax[0][3] * inMax[1][0] * inMax[2][1] + inMax[0][3] * inMax[1][1] * inMax[2][0] + inMax[0][1] * inMax[1][0] * inMax[2][3] + inMax[0][0] * inMax[1][3] * inMax[2][1]) / det;
    let inv30 = (-inMax[1][0] * inMax[2][1] * inMax[3][2] - inMax[1][1] * inMax[2][2] * inMax[3][0] - inMax[1][2] * inMax[2][0] * inMax[3][1] + inMax[1][2] * inMax[2][1] * inMax[3][0] + inMax[1][1] * inMax[2][0] * inMax[3][2] + inMax[1][0] * inMax[2][2] * inMax[3][1]) / det;
    let inv31 = (inMax[0][0] * inMax[2][1] * inMax[3][2] + inMax[0][1] * inMax[2][2] * inMax[3][0] + inMax[0][2] * inMax[2][0] * inMax[3][1] - inMax[0][2] * inMax[2][1] * inMax[3][0] - inMax[0][1] * inMax[2][0] * inMax[3][2] - inMax[0][0] * inMax[2][2] * inMax[3][1]) / det;
    let inv32 = (-inMax[0][0] * inMax[1][1] * inMax[3][2] - inMax[0][1] * inMax[1][2] * inMax[3][0] - inMax[0][2] * inMax[1][0] * inMax[3][1] + inMax[0][2] * inMax[1][1] * inMax[3][0] + inMax[0][1] * inMax[1][0] * inMax[3][2] + inMax[0][0] * inMax[1][2] * inMax[3][1]) / det;
    let inv33 = (inMax[0][0] * inMax[1][1] * inMax[2][2] + inMax[0][1] * inMax[1][2] * inMax[2][0] + inMax[0][2] * inMax[1][0] * inMax[2][1] - inMax[0][2] * inMax[1][1] * inMax[2][0] - inMax[0][1] * inMax[1][0] * inMax[2][2] - inMax[0][0] * inMax[1][2] * inMax[2][1]) / det;

    return [[inv00, inv01, inv02, inv03], [inv10, inv11, inv12, inv13], [inv20, inv21, inv22, inv23], [inv30, inv31, inv32, inv33]]
}

//save data
function save() {
    labelTool.savedFrames[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = true;
}

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

// right padding s with c to a total of n chars
// print 0.12300
// alert(padding_right('0.123', '0', 5));
function paddingRight(s, c, n) {
    if (!s || !c || s.length >= n) {
        return s;
    }
    let max = (n - s.length) / c.length;
    for (let i = 0; i < max; i++) {
        s += c;
    }
    return s;
}

function download() {
    // download annotations from all frames of current dataset
    let annotations = labelTool.createAnnotations();
    let outputString = JSON.stringify(annotations);
    outputString = b64EncodeUnicode(outputString);
    $($('#bounding-box-3d-menu ul li')[0]).children().first().attr('href', 'data:application/octet-stream;base64,' + outputString).attr('download', labelTool.currentDataset + "_" + labelTool.currentSequence + '_annotations.txt');
}

function hideMasterView() {
    $("#canvasSideView").hide();
    $("#canvasFrontView").hide();
    $("#canvasBev").hide();
}

//change camera position to bird view position
function switchView() {
    birdsEyeViewFlag = !birdsEyeViewFlag;
    if (transformControls !== undefined) {
        labelTool.selectedMesh = undefined;
        transformControls.detach();
        transformControls = undefined;
        hideMasterView();
    }
    setCamera();
    labelTool.removeObject("planeObject");
}

function increaseBrightness(hex, percent) {
    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }

    let r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    return '#' +
        ((0 | (1 << 8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
        ((0 | (1 << 8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
        ((0 | (1 << 8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}


function addClassTooltip(fileIndex, className, trackId, color, bbox) {
    let classTooltipElement = $("<div class='class-tooltip' id='class-" + className.charAt(0) + trackId + "'>" + className.charAt(0) + trackId + " | " + className + "</div>");
    // Sprite
    const spriteMaterial = new THREE.SpriteMaterial({
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(bbox.x, bbox.y, bbox.z + bbox.depth / 2);
    sprite.scale.set(1, 1, 1);
    sprite.name = "sprite-" + className.charAt(0) + trackId;

    // add tooltip only to DOM if fileIndex is equal to current file index
    if (fileIndex === labelTool.currentFileIndex) {
        $("body").append(classTooltipElement);
        // set background color
        $(classTooltipElement[0]).css("background", color);
        $(classTooltipElement[0]).css("opacity", 0.5);
        scene.add(sprite);
    }
    labelTool.spriteArray[fileIndex].push(sprite);
}

function get3DLabel(parameters) {
    let bbox = parameters;
    let cubeGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);//width, height, depth
    let color;
    if (parameters.fromFile === true) {
        if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
            color = classesBoundingBox.content[parameters.class].color;
        } else {
            color = classesBoundingBox[parameters.class].color;
        }
    } else {
        color = classesBoundingBox.target().color;
    }

    let cubeMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });

    let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(bbox.x, bbox.y, bbox.z);
    cubeMesh.scale.set(bbox.width, bbox.height, bbox.depth);
    cubeMesh.rotation.z = bbox.rotationY;
    cubeMesh.name = "cube-" + parameters.class.charAt(0) + parameters.trackId;

    // get bounding box from object
    let boundingBoxColor = increaseBrightness(color, 50);
    let edgesGeometry = new THREE.EdgesGeometry(cubeMesh.geometry);
    let edgesMaterial = new THREE.LineBasicMaterial({color: boundingBoxColor, linewidth: 4});
    let edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    cubeMesh.add(edges);

    // add object only to scene if file index is equal to current file index
    if (parameters.fileIndex === labelTool.currentFileIndex) {
        scene.add(cubeMesh);
        addBoundingBoxGui(bbox, undefined);
    }
    // class tooltip
    addClassTooltip(parameters.fileIndex, parameters.class, parameters.trackId, color, bbox);
    labelTool.cubeArray[parameters.fileIndex].push(cubeMesh);
    return bbox;
}

function update2DBoundingBox(fileIndex, objectIndex) {
    let className = annotationObjects.contents[fileIndex][objectIndex].class;
    for (let channelObject in annotationObjects.contents[fileIndex][objectIndex].channels) {
        if (annotationObjects.contents[fileIndex][objectIndex].channels.hasOwnProperty(channelObject)) {
            let channelObj = annotationObjects.contents[fileIndex][objectIndex].channels[channelObject];
            if (channelObj.channel !== '') {
                let x = annotationObjects.contents[fileIndex][objectIndex]["x"];
                let y = annotationObjects.contents[fileIndex][objectIndex]["y"];
                let z = annotationObjects.contents[fileIndex][objectIndex]["z"];
                let width = annotationObjects.contents[fileIndex][objectIndex]["width"];
                let height = annotationObjects.contents[fileIndex][objectIndex]["height"];
                let depth = annotationObjects.contents[fileIndex][objectIndex]["depth"];
                let rotationY = annotationObjects.contents[fileIndex][objectIndex]["rotationY"];
                let channel = channelObj.channel;
                // working for LISA_T
                // channelObj.projectedPoints = calculateProjectedBoundingBox(-x, -y, -z, width, height, depth, channel, rotationY);
                // new transformation matrices
                channelObj.projectedPoints = calculateProjectedBoundingBox(-x, -z, -y, width, depth, height, channel, rotationY);

                // remove previous drawn lines
                for (let lineObj in channelObj.lines) {
                    if (channelObj.lines.hasOwnProperty(lineObj)) {
                        let line = channelObj.lines[lineObj];
                        if (line !== undefined) {
                            line.remove();
                        }
                    }
                }
                if (channelObj.projectedPoints !== undefined && channelObj.projectedPoints.length === 8) {
                    channelObj.lines = calculateAndDrawLineSegments(channelObj, className);
                }
            }
        }
    }
}

// function updateChannels(insertIndex) {
// let annotationObj = annotationObjects.contents[labelTool.currentFileIndex][insertIndex];
// let posX = annotationObj.x;
// let posY = annotationObj.y;
// let posZ = annotationObj.z;
// let channels = getChannelsByPosition(posX, posY, posZ);
// annotationObj.channels[0].channel = channels[0];
// if (channels[1] !== undefined) {
//     annotationObj.channels[1].channel = channels[1];
// }
// }

function updateXPos(newFileIndex, value) {
    labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x = value;
    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = value;
    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["x"] = value;
    // update bounding box
    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
}

/**
 * calculates the highest available track id for a specific class
 * @param label
 */
function setHighestAvailableTrackId(label) {
    for (let newTrackId = 1; newTrackId <= annotationObjects.contents[labelTool.currentFileIndex].length; newTrackId++) {
        let exist = false;
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            if (label === annotationObjects.contents[labelTool.currentFileIndex][i]["class"] && newTrackId === annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]) {
                exist = true;
                break;
            }
        }
        if (exist === false) {
            // track id was not used yet
            if (labelTool.showOriginalNuScenesLabels === true) {
                classesBoundingBox.content[label].nextTrackId = newTrackId;
            } else {
                classesBoundingBox[label].nextTrackId = newTrackId;
            }
            break;
        }
        if (labelTool.showOriginalNuScenesLabels === true) {
            classesBoundingBox.content[label].nextTrackId = annotationObjects.contents[labelTool.currentFileIndex].length + 1;
        } else {
            classesBoundingBox[label].nextTrackId = annotationObjects.contents[labelTool.currentFileIndex].length + 1;
        }
    }
}

function getSmallestTrackId(classNameToFind) {
    let trackIds = [];
    for (let i = 0; i < annotationObjects.contents.length; i++) {
        for (let j = 0; j < annotationObjects.contents[i].length; j++) {
            let className = annotationObjects.contents[i][j]["class"];
            if (className === classNameToFind) {
                let trackId = annotationObjects.contents[i][j]["trackId"];
                if ($.inArray(trackId, trackIds) === -1) {
                    trackIds.push(trackId);
                }
            }

        }
    }
    trackIds.sort();
    for (let smallestAvailableTrackId = 1; smallestAvailableTrackId <= trackIds[trackIds.length - 1]; smallestAvailableTrackId++) {
        let exist = false;
        for (let j = 0; j < trackIds.length; j++) {
            if (smallestAvailableTrackId === trackIds[j]) {
                exist = true;
                break;
            }
        }
        if (exist === false) {
            return smallestAvailableTrackId;
        }
    }
    // return next highest track id
    return trackIds[trackIds.length - 1] + 1;
}

//register new bounding box
function addBoundingBoxGui(bbox, bboxEndParams) {
    let insertIndex = folderBoundingBox3DArray.length;
    let bb = guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
    folderBoundingBox3DArray.push(bb);

    let minXPos = -100;
    let minYPos = -100;
    let minZPos = -3;
    let maxXPos = 100;
    let maxYPos = 100;
    let maxZPos = 3;

    let folderPosition = folderBoundingBox3DArray[insertIndex].addFolder('Position');
    let cubeX = folderPosition.add(bbox, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
    let cubeY = folderPosition.add(bbox, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
    let cubeZ = folderPosition.add(bbox, 'z').name("z").min(minZPos).max(maxZPos).step(0.01).listen();
    let cubeYaw = folderPosition.add(bbox, 'rotationY').name("rotation").min(-Math.PI).max(Math.PI).step(0.01).listen();
    folderPosition.close();
    folderPositionArray.push(folderPosition);

    let folderSize = folderBoundingBox3DArray[insertIndex].addFolder('Size');
    let cubeW = folderSize.add(bbox, 'width').name("width").min(0.3).max(20).step(0.01).listen();
    let cubeH = folderSize.add(bbox, 'height').name("length").min(0.3).max(20).step(0.01).listen();
    let cubeD = folderSize.add(bbox, 'depth').name("height").min(0.3).max(20).step(0.01).listen();
    folderSize.close();
    folderSizeArray.push(folderSize);

    cubeX.onChange(function (value) {
        if (value >= minXPos && value < maxXPos) {
            labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = value;
            annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["x"] = value;
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
        }
    });
    cubeY.onChange(function (value) {
        if (value >= minYPos && value < maxYPos) {
            labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = value;
            annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["y"] = value;
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
        }
    });
    cubeZ.onChange(function (value) {
        if (value >= minZPos && value < maxZPos) {
            labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = value;
            annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["z"] = value;
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
        }
    });
    cubeYaw.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["rotationY"] = value;
        // update bounding box
        update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
    });
    cubeW.onChange(function (value) {
        let newXPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = newXPos;
        bbox.x = newXPos;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["x"] = newXPos;
        let newYPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = newYPos;
        bbox.y = -newYPos;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["y"] = newYPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["width"] = value;
        update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
    });
    cubeH.onChange(function (value) {
        let newXPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = newXPos;
        bbox.x = newXPos;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["x"] = newXPos;
        let newYPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y - (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = newYPos;
        bbox.y = -newYPos;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["y"] = newYPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["height"] = value;
        update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
    });
    cubeD.onChange(function (value) {
        let newZPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = newZPos;
        bbox.z = newZPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["depth"] = value;
        update2DBoundingBox(labelTool.currentFileIndex, insertIndex);
    });

    if (bboxEndParams !== undefined && interpolationMode === true) {
        //interpolationObjIndexCurrentFile = annotationObjects.getSelectionIndex();
        interpolationObjIndexNextFile = getObjectIndexByTrackIdAndClass(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["class"], bboxEndParams.newFileIndex);
        // change text
        let interpolationStartFileIndex = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
        folderPositionArray[interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + interpolationStartFileIndex + ")";
        folderSizeArray[interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + interpolationStartFileIndex + ")";

        if (interpolationStartFileIndex !== bboxEndParams.newFileIndex) {
            disableStartPositionAndSize();
            // add folders for end position and end size
            labelTool.folderEndPosition = folderBoundingBox3DArray[interpolationObjIndexNextFile].addFolder("Interpolation End Position (frame " + (labelTool.currentFileIndex + 1) + ")");
            let cubeEndX = labelTool.folderEndPosition.add(bboxEndParams, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
            let cubeEndY = labelTool.folderEndPosition.add(bboxEndParams, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
            let cubeEndZ = labelTool.folderEndPosition.add(bboxEndParams, 'z').name("z)").min(minZPos).max(maxZPos).step(0.01).listen();
            let cubeEndYaw = labelTool.folderEndPosition.add(bboxEndParams, 'rotationY').name("rotation").min(-Math.PI).max(Math.PI).step(0.01).listen();
            labelTool.folderEndPosition.domElement.id = 'interpolation-end-position-folder';
            labelTool.folderEndPosition.open();
            labelTool.folderEndSize = folderBoundingBox3DArray[interpolationObjIndexNextFile].addFolder("Interpolation End Size (frame " + (labelTool.currentFileIndex + 1) + ")");
            let cubeEndW = labelTool.folderEndSize.add(bboxEndParams, 'width').name("width").min(0.3).max(20).step(0.01).listen();
            let cubeEndH = labelTool.folderEndSize.add(bboxEndParams, 'height').name("length").min(0.3).max(20).step(0.01).listen();
            let cubeEndD = labelTool.folderEndSize.add(bboxEndParams, 'depth').name("height").min(0.3).max(20).step(0.01).listen();
            labelTool.folderEndPosition.domElement.id = 'interpolation-end-size-folder';
            labelTool.folderEndSize.open();
            let newFileIndex = bboxEndParams.newFileIndex;

            cubeEndX.onChange(function (value) {
                if (value >= minXPos && value < maxXPos) {
                    updateXPos(newFileIndex, value);
                }
            });
            cubeEndY.onChange(function (value) {
                if (value >= minYPos && value < maxYPos) {
                    labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.y = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["y"] = value;
                    // update bounding box
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
                }
            });
            cubeEndZ.onChange(function (value) {
                if (value >= minZPos && value < maxZPos) {
                    labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["z"] = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["z"] = value;
                    // update bounding box
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
                }
            });
            cubeEndYaw.onChange(function (value) {
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.z = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationY"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["rotationY"] = value;
                // update bounding box
                update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
            });
            cubeEndW.onChange(function (value) {
                let newXPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.x)
                    * Math.cos(labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x = newXPos;
                labelTool.cubeArray[labelTool.currentFileIndex][interpolationObjIndexCurrentFile].position.x = newXPos;

                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = newXPos;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["x"] = newXPos;
                let newYPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.y + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.x)
                    * Math.sin(labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.y = newYPos;
                labelTool.cubeArray[labelTool.currentFileIndex][interpolationObjIndexCurrentFile].position.y = newYPos;

                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = newYPos;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["y"] = newYPos;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.x = value;
                labelTool.cubeArray[labelTool.currentFileIndex][interpolationObjIndexCurrentFile].scale.x = value;

                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["size"]["width"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["width"] = value;
                update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
            });
            cubeEndH.onChange(function (value) {
                let newXPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.y) * Math.sin(labelTool.cubeArray[newFileIndex][interpolationObjIndexCurrentFile].rotation.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x = newXPos;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = newXPos;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["x"] = newXPos;
                let newYPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.y - (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.y) * Math.cos(labelTool.cubeArray[newFileIndex][interpolationObjIndexCurrentFile].rotation.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.y = newYPos;
                // test with -newYPos
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = newYPos;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["y"] = newYPos;

                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.y = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["size"]["height"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["height"] = value;
                update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
            });
            cubeEndD.onChange(function (value) {
                let newZPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z = newZPos;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.z = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["size"]["depth"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["depth"] = value;
                update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile);
            });
        }
    }

    let textBoxTrackId = folderBoundingBox3DArray[insertIndex].add(bbox, 'trackId').min(0).step(1).name('Track ID');
    textBoxTrackId.onChange(function (value) {
        // check validity
        // get smallest available track id for this class (look at all objects within that sequence)

        let minTrackId = getSmallestTrackId(bbox.class);
        if (value < 1 || value !== minTrackId) {
            labelTool.logger.error("You have entered an invalid track ID.");
        }
        labelTool.logger.success("Track ID for class " + bbox.class + " was set to " + minTrackId + ".");
        value = Math.round(minTrackId);
        // update cube name
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].name = 'cube-' + bbox.class.charAt(0) + value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["trackId"] = value;
        if (labelTool.selectedMesh !== undefined) {
            labelTool.selectedMesh.name = 'cube-' + bbox.class.charAt(0) + value;
        }
        $("#bounding-box-3d-menu ul").children().eq(insertIndex + numGUIOptions).children().first().children().first().children().first().text(bbox.class + " " + value);
    });

    let labelAttributes = {
        'copy_label_to_next_frame': bbox.copyLabelToNextFrame,
        reset: function () {
            resetCube(insertIndex);
        },
        delete: function () {
            let copyIdList = document.querySelectorAll('[id^="copy-label-to-next-frame-checkbox-"]'); // e.g. 0,1
            let labelIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            guiOptions.removeFolder(bbox.class + ' ' + bbox.trackId);
            // hide 3D bounding box instead of removing it (in case redo button will be pressed)
            if (transformControls !== undefined) {
                transformControls.detach();
            }

            labelTool.removeObject("transformControls");
            labelTool.cubeArray[labelTool.currentFileIndex][labelIndex].visible = false;
            labelTool.cubeArray[labelTool.currentFileIndex].splice(labelIndex, 1);
            let label = annotationObjects.contents[labelTool.currentFileIndex][labelIndex].class;
            let channels = annotationObjects.contents[labelTool.currentFileIndex][labelIndex].channels;
            // iterate all channels and remove projection
            for (let channelIdx in channels) {
                if (channels.hasOwnProperty(channelIdx)) {
                    let channelObj = channels[channelIdx];
                    for (let lineObj in channelObj.lines) {
                        if (channelObj.lines.hasOwnProperty(lineObj)) {
                            let line = channelObj.lines[lineObj];
                            if (line !== undefined) {
                                line.remove();
                            }

                        }
                    }
                }
            }
            annotationObjects.remove(labelIndex);
            folderBoundingBox3DArray.splice(labelIndex, 1);
            folderPositionArray.splice(labelIndex, 1);
            folderSizeArray.splice(labelIndex, 1);
            annotationObjects.selectEmpty();
            labelTool.spriteArray[labelTool.currentFileIndex].splice(labelIndex, 1);
            labelTool.removeObject("sprite-" + bbox.class.charAt(0) + bbox.trackId);
            // remove sprite from DOM tree
            $("#class-" + bbox.class.charAt(0) + bbox.trackId).remove();
            labelTool.selectedMesh = undefined;
            // reduce track id by 1 for this class
            if (labelTool.showOriginalNuScenesLabels) {
                classesBoundingBox.content[label].nextTrackId--;
            } else {
                if (insertIndex === annotationObjects.contents[labelTool.currentFileIndex].length) {
                    // decrement track id if the last object in the list was deleted
                    classesBoundingBox[label].nextTrackId--;
                } else {
                    // otherwise not last object was deleted -> find out the highest possible track id
                    setHighestAvailableTrackId(label);
                }
            }
            // if last object in current frame was deleted than disable interpolation mode
            if (annotationObjects.contents[labelTool.currentFileIndex].length === 0) {
                interpolationMode = false;
                $("#interpolation-checkbox").children().first().prop("checked", false);
                $("#interpolation-checkbox").children().first().removeAttr("checked");
            }
            //rename all ids following after insertIndexof
            // e.g. rename copy-label-to-next-frame-checkbox-1 to copy-label-to-next-frame-checkbox-0 if deleting first element
            for (let i = labelIndex + 1; i <= annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                let idToChange = copyIdList[i].id;
                let elem = document.getElementById(idToChange);
                elem.id = "copy-label-to-next-frame-checkbox-" + (i - 1);
            }
            annotationObjects.__selectionIndexCurrentFrame = -1;
        }
    };
    let copyLabelToNextFrameCheckbox = folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(labelAttributes, 'copy_label_to_next_frame').name("Copy label to next frame");
    copyLabelToNextFrameCheckbox.domElement.id = 'copy-label-to-next-frame-checkbox-' + insertIndex;
    // check copy checkbox AND disable it for selected object if in interpolation mode
    if (interpolationMode === true && bboxEndParams !== undefined) {
        copyLabelToNextFrameCheckbox.domElement.firstChild.checked = true;
        disableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox.domElement);

    }
    copyLabelToNextFrameCheckbox.onChange(function (value) {
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["copyLabelToNextFrame"] = value;
    });

    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(labelAttributes, 'reset').name("Reset");
    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(labelAttributes, 'delete').name("Delete");
}

//reset cube parameter and position
function resetCube(index) {
    let reset_bbox = annotationObjects.contents[labelTool.currentFileIndex][index];
    reset_bbox.x = reset_bbox.original.x;
    reset_bbox.y = reset_bbox.original.y;
    reset_bbox.z = reset_bbox.original.z;
    reset_bbox.rotationY = reset_bbox.original.rotationY;
    reset_bbox.width = reset_bbox.original.width;
    reset_bbox.height = reset_bbox.original.height;
    reset_bbox.depth = reset_bbox.original.depth;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.x = reset_bbox.x;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.y = reset_bbox.y;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.z = reset_bbox.z;
    labelTool.cubeArray[labelTool.currentFileIndex][index].rotation.z = reset_bbox.rotationY;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.x = reset_bbox.width;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.y = reset_bbox.height;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.z = reset_bbox.depth;
    // updateChannels(index);
}

//change window size
function onWindowResize() {
    // update height and top position of helper views
    let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let newHeight = Math.round((window.innerHeight - headerHeight - imagePanelHeight) / 3.0);
    $("#canvasSideView").css("height", newHeight);
    $("#canvasSideView").css("top", headerHeight + imagePanelHeight);
    views[1].height = newHeight;
    views[1].top = 0;
    $("#canvasFrontView").css("height", newHeight);
    $("#canvasFrontView").css("top", headerHeight + imagePanelHeight + newHeight);
    views[2].height = newHeight;
    views[2].top = newHeight;
    $("#canvasBev").css("height", newHeight);
    $("#canvasBev").css("top", headerHeight + imagePanelHeight + 2 * newHeight);
    views[3].height = newHeight;
    views[3].top = 2 * newHeight;

    // var canvas3D = $("canvas3d");
    // camera.aspect = canvas3D.getAttribute("width") / canvas3D.getAttribute("height");
    // camera.updateProjectionMatrix();
    // renderer.setSize(canvas3D.getAttribute("width"), canvas3D.getAttribute("height"));
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (rendererBev !== undefined) {
        rendererBev.setSize(window.innerWidth / 3, window.innerHeight / 3);
        rendererFrontView.setSize(window.innerWidth / 3, window.innerHeight / 3);
        rendererSideView.setSize(window.innerWidth / 3, window.innerHeight / 3);
    }
    animate();
}

function getObjectIndexByName(objectName) {
    let idToFind = objectName.split("-")[1];// e.g. cube-V1
    for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        let uniqueId = annotationObjects.contents[labelTool.currentFileIndex][i]["class"].toUpperCase().charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"];
        if (uniqueId === idToFind) {
            return i;
        }
    }
}

function updateObjectPosition() {
    let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["x"] = labelTool.selectedMesh.position.x;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["y"] = labelTool.selectedMesh.position.y;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["z"] = labelTool.selectedMesh.position.z;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["width"] = labelTool.selectedMesh.scale.x;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["length"] = labelTool.selectedMesh.scale.y;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["depth"] = labelTool.selectedMesh.scale.z;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["rotationY"] = labelTool.selectedMesh.rotation.z;
    // update cube array
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["x"] = labelTool.selectedMesh.position.x;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["y"] = labelTool.selectedMesh.position.y;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["z"] = labelTool.selectedMesh.position.z;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["width"] = labelTool.selectedMesh.scale.x;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["length"] = labelTool.selectedMesh.scale.y;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["depth"] = labelTool.selectedMesh.scale.z;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["rotationY"] = labelTool.selectedMesh.rotation.z;

    if (interpolationMode === true && labelTool.selectedMesh !== undefined) {
        // let selectionIndex = annotationObjects.getSelectionIndex();
        let interpolationStartFileIndex = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
        if (interpolationStartFileIndex !== labelTool.currentFileIndex) {
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"] = labelTool.selectedMesh.position.x;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"] = labelTool.selectedMesh.position.y;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"] = labelTool.selectedMesh.position.z;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationY"] = labelTool.selectedMesh.rotation.z;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"] = labelTool.selectedMesh.scale.x;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["length"] = labelTool.selectedMesh.scale.y;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["depth"] = labelTool.selectedMesh.scale.z;
        }
    }
}

function onChangeHandler(event) {
    useTransformControls = true;
    // update 2d bounding box
    if (dragControls === true) {
        if (labelTool.selectedMesh !== undefined) {
            updateObjectPosition();
            let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
            update2DBoundingBox(labelTool.currentFileIndex, objectIndexByTrackId);
            render();
        }
    }


    // dragObject = true;
    // change type (e.g. from translate to scale)
    // or a new bounding box object is created
    // or hover over an arrow
    // or dragging starts or draggin ends
    // or mousedown or mouseup
    render();

    // console.log("change");
    // console.log("mode: "+event.target.getMode());
    // translating works (no object is created), problem: selection randomly works
    // scaleRotateTranslate = true;
    // selection works (clicking on background, current object will be unselected), problem: after translation an object is created
    // scaleRotateTranslate = !scaleRotateTranslate;
    // update bounding box in image
    // console.log(event);
}

function onDraggingChangedHandler(event) {
    useTransformControls = true;
    dragControls = true;
    // update 2d bounding box
    if (labelTool.selectedMesh !== undefined) {
        updateObjectPosition();
        let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
        update2DBoundingBox(labelTool.currentFileIndex, objectIndexByTrackId);
        render();
    }
    // dragObject = false;
    // executed after drag finished
    // TODO: scale only on one side
    if (transformControls.getMode() === "scale") {
        // labelTool.selectedMesh.translateY(labelTool.selectedMesh.geometry.parameters.height / 2)
    }
    // orbitControls.enabled = !event.value;
    // translating works (no object is created)
    // scaleRotateTranslate = false;
}

function addTransformControls() {
    if (transformControls === undefined) {
        // labelTool.removeObject("transformControls");
        transformControls = new THREE.TransformControls(currentCamera, renderer.domElement);
        transformControls.name = "transformControls";
    } else {
        if (transformControls.object !== labelTool.selectedMesh) {
            transformControls.detach();
        } else {
            // transform controls are already defined and attached to selected object
            return;
        }
    }
    transformControls.removeEventListener('change', onChangeHandler);
    transformControls.addEventListener('change', onChangeHandler);
    transformControls.removeEventListener('dragging-changed', onDraggingChangedHandler);
    transformControls.addEventListener('dragging-changed', onDraggingChangedHandler);


    // if in birdseyeview then find minimum of longitude and latitude
    // otherwise find minimum of x, y and z
    // let smallestSide;
    // if (birdsEyeViewFlag === true) {
    //     smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
    // } else {
    //     smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
    // }
    //
    // let size = smallestSide / 2;
    // console.log("size controls addtransformcontrols: " + size);
    // transformControls.scale.x = size;
    // transformControls.scale.y = size;
    // transformControls.scale.z = size;
    transformControls.attach(labelTool.selectedMesh);
    labelTool.removeObject("transformControls");
    scene.add(transformControls);


    window.removeEventListener('keydown', keyDownHandler);
    window.addEventListener('keydown', keyDownHandler);
    window.removeEventListener('keyup', keyUpHandler);
    window.addEventListener('keyup', keyUpHandler);
}

function keyUpHandler(event) {
    switch (event.keyCode) {
        case 17: // Ctrl
            transformControls.setTranslationSnap(null);
            transformControls.setRotationSnap(null);
            break;
    }
}

function keyDownHandler(event) {
    switch (event.keyCode) {
        case 17: // Ctrl
            transformControls.setTranslationSnap(0.5);
            if (transformControls.getMode() === "rotate") {
                let newRotation = Math.ceil(labelTool.selectedMesh.rotation.z / THREE.Math.degToRad(15));
                let lowerBound = newRotation * 15;
                if (labelTool.selectedMesh.rotation.z - lowerBound < THREE.Math.degToRad(15) / 2) {
                    // rotate to lower bound
                    labelTool.selectedMesh.rotation.z = lowerBound;
                } else {
                    // rotate to upper bound
                    labelTool.selectedMesh.rotation.z = lowerBound + THREE.Math.degToRad(15);
                }
            }

            transformControls.setRotationSnap(THREE.Math.degToRad(15));
            break;
        case 84: // T
            transformControls.setMode("translate");
            transformControls.showX = true;
            transformControls.showY = true;
            if (birdsEyeViewFlag === true) {
                transformControls.showZ = true;
            } else {
                transformControls.showZ = false;
            }
            // enable planes (translation, scaling)
            transformControls.children[1].enabled = false;
            break;
        case 82: // R
            transformControls.setMode("rotate");
            transformControls.showX = false;
            transformControls.showY = false;
            transformControls.showZ = true;
            // enable gizmo
            transformControls.children[0].enabled = true;
            // disable planes (translation, scaling)
            transformControls.children[1].enabled = false;
            break;
        case 83: // S
            transformControls.setMode("scale");
            transformControls.showX = true;
            transformControls.showY = true;
            if (birdsEyeViewFlag === true) {
                transformControls.showZ = true;
            } else {
                transformControls.showZ = false;
            }
            // enable planes (translation, scaling)
            transformControls.children[1].enabled = false;
            break;
        case 187:
        case 107: // +, =, num+
            transformControls.setSize(Math.min(transformControls.size + 0.1, 10));
            break;
        case 189:
        case 109: // -, _, num-
            transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1));
            break;
        case 88: // X
            transformControls.showX = !transformControls.showX;
            break;
        case 89: // Y
            transformControls.showY = !transformControls.showY;
            break;
        case 90: // Z
            // only allow to switch z axis in 3d view
            if (birdsEyeViewFlag === false) {
                transformControls.showZ = !transformControls.showZ;
            } else {
                labelTool.logger.message("Show/Hide z-axis only in 3D view possible.");
            }
            break;
        case 32: // Spacebar
            transformControls.enabled = !transformControls.enabled;
            break;
        case 78:// N
            // next frame
            labelTool.nextFrame();
            break;
        case 80:// P
            // previous frame
            labelTool.previousFrame();
            break;
        case 73: //I
            if (annotationObjects.getSelectionIndex() !== -1) {
                if (interpolationMode === true) {
                    if (annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.getSelectionIndex()]["interpolationStartFileIndex"] !== labelTool.currentFileIndex) {
                        interpolate();
                    } else {
                        labelTool.logger.message("Please choose end frame.");
                    }
                } else {
                    labelTool.logger.message("Please activate interpolation mode first.");
                }
            } else {
                labelTool.logger.message("Please select an object first.");
            }

    }
}

function setOrbitControls() {
    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup', onKeyUp, false);
    scene.remove(pointerLockObject);


    currentCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    currentCamera.position.set(0, 0, 5);
    currentCamera.up.set(0, 0, 1);

    currentOrbitControls = new THREE.OrbitControls(currentCamera, renderer.domElement);
    currentOrbitControls.enablePan = true;
    currentOrbitControls.enableRotate = true;
    currentOrbitControls.autoRotate = false;// true for demo
    currentOrbitControls.enableKeys = false;
    currentOrbitControls.maxPolarAngle = Math.PI / 2;
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 38: // up
            rotateUp = true;
            break;
        case 69: //E
            moveUp = true;
            break;
        case 81: //Q
            moveDown = true;
            break;
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
            rotateLeft = true;
            break;
        case 65: // a
            moveLeft = true;
            break;
        case 40: // down
            rotateDown = true;
            break;
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
            rotateRight = true;
            break;
        case 68: // d
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.keyCode) {
        case 38: // up
            rotateUp = false;
            break;
        case 69: // E
            moveUp = false;
            break;
        case 81: //Q
            moveDown = false;
            break;
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
            rotateLeft = false;
            break;
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
            rotateDown = false;
            break;
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
            rotateRight = false;
            break;
        case 68: // d
            moveRight = false;
            break;
    }
}

function setPointerLockControls() {
    pointerLockControls = new THREE.PointerLockControls(currentCamera, canvas3D);
    pointerLockObject = pointerLockControls.getObject();
    pointerLockObject.position.set(0, 0, 0);
    pointerLockObject.rotation.set(Math.PI / 2, 0, 0);
    scene.add(pointerLockObject);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
}

//set camera type
function setCamera() {
    if (birdsEyeViewFlag === false) {
        // 3D mode (perspective mode)
        currentCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        // currentCamera = perspectiveCamera;
        if (transformControls !== undefined) {
            if (labelTool.selectedMesh !== undefined) {
                addTransformControls();
                // if in birdseyeview then find minimum of longitude and latitude
                // otherwise find minimum of x, y and z
                // let smallestSide;
                // if (birdsEyeViewFlag === true) {
                //     smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
                // } else {
                //     smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
                // }
                transformControls.size = 2;
                transformControls.showZ = true;
            } else {
                labelTool.removeObject("transformControls");
            }
        }

        currentCamera.position.set(0, 0, 5);
        currentCamera.up.set(0, 0, 1);

        canvas3D.removeEventListener('keydown', canvas3DKeyDownHandler);
        canvas3D.addEventListener('keydown', canvas3DKeyDownHandler);

        if (keyboardNavigation === true) {
            setPointerLockControls();
        } else {
            setOrbitControls();
        }

        // TODO: enable to fly through the 3d scene using keys
        // let onKeyDown = function (event) {
        //
        //     switch (event.keyCode) {
        //
        //         case 87: // w
        //             moveForward = true;
        //             break;
        //
        //         case 65: // a
        //             moveLeft = true;
        //             break;
        //
        //         case 83: // s
        //             moveBackward = true;
        //             break;
        //
        //         case 68: // d
        //             moveRight = true;
        //             break;
        //     }
        //
        // };
        //
        // let onKeyUp = function (event) {
        //
        //     switch (event.keyCode) {
        //
        //         case 87: // w
        //             moveForward = false;
        //             break;
        //
        //         case 65: // a
        //             moveLeft = false;
        //             break;
        //
        //         case 83: // s
        //             moveBackward = false;
        //             break;
        //
        //         case 68: // d
        //             moveRight = false;
        //             break;
        //
        //     }
        //
        // };
        //
        // document.removeEventListener('keydown', onKeyDown);
        // document.addEventListener('keydown', onKeyDown, false);
        // document.removeEventListener('keyup', onKeyUp);
        // document.addEventListener('keyup', onKeyUp, false);

        // let pos = labelTool.camChannels[0].position;
        // controls.object.position.set(-pos[1], pos[0] - labelTool.positionLidarNuscenes[0], labelTool.positionLidarNuscenes[2] - pos[2]);
        // controls.target = new THREE.Vector3(-pos[1] - 0.0000001, pos[0] - labelTool.positionLidarNuscenes[0] + 0.0000001, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward

        // orbitControls.update();
        // currentOrbitControls.removeEventListener('change', render);
        // currentOrbitControls.addEventListener('change', render);
    } else {
        // BEV
        if (transformControls !== undefined) {
            transformControls.showZ = false;
        }

        currentCamera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0.0001, 2000);
        // currentCamera = orthographicCamera;
        currentCamera.position.set(0, 0, 5);
        currentCamera.up.set(0, 0, 1);

        currentOrbitControls = new THREE.OrbitControls(currentCamera, renderer.domElement);
        currentOrbitControls.enablePan = true;
        currentOrbitControls.enableRotate = false;
        currentOrbitControls.autoRotate = false;
        currentOrbitControls.enableKeys = false;
        currentOrbitControls.maxPolarAngle = Math.PI / 2;

        // orbitControls = new THREE.OrbitControls(currentCamera, renderer.domElement);
        // currentOrbitControls = orthographicOrbitControls;
        // currentOrbitControls.object.position.set(0, 0, 100);
        // currentOrbitControls.object.rotation.set(0, THREE.Math.degToRad(90), 0);
        // controls.rotateSpeed = 2.0;
        // controls.zoomSpeed = 0.3;
        // controls.panSpeed = 0.2;
        // controls.enableZoom = true;
        // controls.enablePan = true;
        // orbitControls.enableRotate = false;


        // controls.enableDamping = false;
        // controls.dampingFactor = 0.3;
        // controls.minDistance = 0.3;
        // controls.maxDistance = 0.3 * 100;
        // controls.noKey = true;
        // controls.autoForward = true;
        // controls.movementSpeed = 1000;
        // controls.rollSpeed = Math.PI / 24;
        // controls.enabled = true;
        // controls.target.set(0, 0, 0);
        // controls.autoRotate = true;
        // orbitControls.update();
    }
    // scene.add(camera);
    // currentOrbitControls.addEventListener('change', render);
    if (keyboardNavigation === false) {
        currentOrbitControls.update();
    }

}

function render() {
    // renderer.clear();
    // renderer.clearColor(22, 22, 22);
    // renderer.setClearColor(new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0));
    // render main window
    let mainView = views[0];
    renderer.setViewport(mainView.left, mainView.top, mainView.width, mainView.height);
    renderer.setScissor(mainView.left, mainView.top, mainView.width, mainView.height);
    renderer.setScissorTest(true);
    renderer.setClearColor(mainView.background);

    currentCamera.aspect = mainView.width / mainView.height;
    currentCamera.updateProjectionMatrix();
    renderer.render(scene, currentCamera);

    // renderer.clear();
    if (labelTool.selectedMesh !== undefined) {
        for (let i = 1; i < views.length; i++) {
            let view = views[i];
            let camera = view.camera;
            view.updateCamera(camera, scene, labelTool.selectedMesh.position);
            renderer.setViewport(view.left, view.top, view.width, view.height);
            renderer.setScissor(view.left, view.top, view.width, view.height);
            renderer.setScissorTest(true);
            renderer.setClearColor(view.background);
            camera.aspect = view.width / view.height;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        }
    }

    if (labelTool.cubeArray !== undefined && labelTool.cubeArray.length > 0 && labelTool.cubeArray[labelTool.currentFileIndex] !== undefined && labelTool.cubeArray[labelTool.currentFileIndex].length > 0
        && labelTool.spriteArray !== undefined && labelTool.spriteArray.length > 0 && labelTool.spriteArray[labelTool.currentFileIndex] !== undefined && labelTool.spriteArray[labelTool.currentFileIndex].length > 0) {
        updateAnnotationOpacity();
        updateScreenPosition();
    }
    if (keyboardNavigation === false) {
        currentOrbitControls.update();
    }
}

function updateAnnotationOpacity() {
    for (let i = 0; i < labelTool.cubeArray[labelTool.currentFileIndex].length; i++) {
        let obj = labelTool.cubeArray[labelTool.currentFileIndex][i];
        let sprite = labelTool.spriteArray[labelTool.currentFileIndex][i];
        let meshDistance = currentCamera.position.distanceTo(obj.position);
        let spriteDistance = currentCamera.position.distanceTo(sprite.position);
        spriteBehindObject = spriteDistance > meshDistance;
        sprite.material.opacity = spriteBehindObject ? 0.2 : 0.8;

        // if number should change size according to its position
        // then comment out the following line and the ::before pseudo-element
        sprite.material.opacity = 0;
    }

}

function updateScreenPosition() {
    for (let i = 0; i < labelTool.cubeArray[labelTool.currentFileIndex].length; i++) {
        let cubeObj = labelTool.cubeArray[labelTool.currentFileIndex][i];
        let annotationObj = annotationObjects.contents[labelTool.currentFileIndex][i];
        const vector = new THREE.Vector3(cubeObj.position.x - cubeObj.scale.x / 2, cubeObj.position.y + cubeObj.scale.y / 2, cubeObj.position.z + cubeObj.scale.z / 2);
        const canvas = renderer.domElement;
        vector.project(currentCamera);
        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height));
        if (annotationObj.trackId !== undefined) {
            let classTooltip = $("#class-" + annotationObj.class.charAt(0) + annotationObj.trackId)[0];
            if (classTooltip !== undefined) {
                let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                classTooltip.style.top = `${vector.y + headerHeight + imagePaneHeight - 21}px`;
                classTooltip.style.left = `${vector.x}px`;
                classTooltip.style.opacity = spriteBehindObject ? 0.25 : 1;
            }
        }

    }
}

function update() {
    // disable rotation of orbit controls if object selected
    if (birdsEyeViewFlag === false) {
        if (labelTool.selectedMesh !== undefined) {
            currentOrbitControls.enableRotate = false;
        } else {
            currentOrbitControls.enableRotate = true;
        }
    }


    // rescale transform controls
    // if (labelTool.selectedMesh !== undefined && birdsEyeViewFlag === true) {
    //     let newSize = labelTool.selectedMesh.position.distanceTo(currentCamera.position) / 6;
    //     console.log(newSize);
    //     transformControls.size = newSize;
    // } else {
    //     // dis
    // }


    // find intersections
    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    let vector = new THREE.Vector3(mousePos.x, mousePos.y, 1);
    // console.log(vector.x + " " + vector.y);
    vector.unproject(currentCamera);
    let ray = new THREE.Raycaster(currentCamera.position, vector.sub(currentCamera.position).normalize());
    // create an array containing all objects in the scene with which the ray intersects
    // filter objects
    // let cubeList = [];
    // for (let objIdx in scene.children) {
    //     if (scene.children.hasOwnProperty(objIdx)) {
    //         let obj = scene.children[objIdx];
    //         if (obj.name.startsWith("cube")) {
    //             cubeList.push(obj);
    //         }
    //     }
    //
    // }
    //let intersects = ray.intersectObjects(cubeList);
    let intersects = ray.intersectObjects(scene.children);
    // intersectedObject = the object in the scene currently closest to the camera
    //		and intersected by the Ray projected from the mouse position

    // if there is one (or more) intersections
    if (intersects.length > 0) {
        // console.log("intersection");
        // if the closest object intersected is not the currently stored intersection object
        if (intersects[0].object !== intersectedObject && intersects[0].object.name.startsWith("cube")) {
            // restore previous intersection object (if it exists) to its original color
            if (intersectedObject) {
                intersectedObject.material.color.setHex(intersectedObject.currentHex);
            }
            // store reference to closest object as current intersection object
            intersectedObject = intersects[0].object;
            // store color of closest object (for later restoration)
            intersectedObject.currentHex = intersectedObject.material.color.getHex();
            // set a new color for closest object
            // intersectedObject.material.color.setHex(0xff0000);
        }
    } else {
        // there are no intersections
        // restore previous intersection object (if it exists) to its original color
        if (intersectedObject) {
            intersectedObject.material.color.setHex(intersectedObject.currentHex);
        }
        // remove previous intersection object reference
        //  by setting current intersection object to "nothing"
        intersectedObject = null;
    }

    keyboard.update();
    let moveDistance = 50 * clock.getDelta();
    // if (keyboardNavigation === true) {
    //     if (keyboard.down("A")) {
    //         // A MOVE LEFT
    //         currentCamera.position.x = currentCamera.position.x - moveDistance;
    //     }
    //     if (keyboard.down("W")) {
    //         // W MOVE FORWARD
    //         currentCamera.position.y = currentCamera.position.y + moveDistance;
    //     }
    //     if (keyboard.down("D")) {
    //         // D MOVE RIGHT
    //         currentCamera.position.x = currentCamera.position.x + moveDistance;
    //     }
    //     if (keyboard.down("S")) {
    //         // S MOVE BACKWARD
    //         currentCamera.position.y = currentCamera.position.y - moveDistance;
    //     }
    //     if (keyboard.down("left")) {
    //         // LEFT ROTATION (YAW)
    //         currentCamera.rotation.y = currentCamera.rotation.y - moveDistance;
    //     }
    //     if (keyboard.down("up")) {
    //         // UP ROTATION (PITCH)
    //         currentCamera.rotation.x = currentCamera.rotation.x + moveDistance;
    //     }
    //     if (keyboard.down("right")) {
    //         // RIGHT ROTATION (YAW)
    //         currentCamera.rotation.y = currentCamera.rotation.y + moveDistance;
    //     }
    //     if (keyboard.down("down")) {
    //         // DOWN ROTATION (PITCH)
    //         currentCamera.rotation.x = currentCamera.rotation.x - moveDistance;
    //     }
    //     currentCamera.updateProjectionMatrix();
    // }
}

//draw animation
function animate() {
    requestAnimationFrame(animate);

    // var delta = clock.getDelta();
    // controls.update(delta);
    // keyboard.update();
    // if (keyboard.down("shift")) {
    //     controls.enabled = true;
    //     bboxFlag = false;
    // }
    //
    // if (keyboard.up("shift")) {
    //     controls.enabled = false;
    //     bboxFlag = true;
    // }

    // if (keyboard.down("alt")) {
    //     moveFlag = true;
    // }
    // if (keyboard.up("alt")) {
    //     moveFlag = false;
    // }
    // if (keyboard.down("C")) {
    //     rFlag = false;
    //     if (cFlag === false) {
    //         copyBboxIndex = annotationObjects.getSelectionIndex();
    //         copyBbox = annotationObjects.contents[labelTool.currentFileIndex][copyBboxIndex];
    //         cFlag = true;
    //     } else {
    //         copyBboxIndex = -1;
    //         cFlag = false;
    //     }
    // }
    // if (keyboard.down("R")) {
    //     cFlag = false;
    //     if (rFlag === false) {
    //         rotationBboxIndex = annotationObjects.getSelectionIndex();
    //         rFlag = true;
    //     }
    //     else {
    //         rotationBboxIndex = -1;
    //         rFlag = false;
    //     }
    // }

    // required if autoupdate
    // currentOrbitControls.update();

    // stats.update();
    // if (annotationObjects.getSelectionIndex() !== rotationBboxIndex) {
    //     rFlag = false;
    // }
    // var cubeLength;
    // var cubes = labelTool.cubeArray[labelTool.currentFileIndex];
    // if (cubes == undefined) {
    //     cubeLength = 0;
    // } else {
    //     cubeLength = cubes.length;
    // }

    // for (var i = 0; i < labelTool.cubeArray[labelTool.currentFileIndex].length; i++) {
    //     if (labelTool.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][i] == annotationObjects.getSelectionIndex()) {
    //         folderBoundingBox3DArray[i].open();
    //         folderPositionArray[i].open();
    //         folderSizeArray[i].open();
    //     }
    //     else {
    //         folderBoundingBox3DArray[i].close();
    //     }
    //     if (i == labelTool.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex].lastIndexOf(copyBboxIndex.toString()) && cFlag == true) {
    //         labelTool.cubeArray[labelTool.currentFileIndex][i].material.color.setHex(0xffff00);
    //     }
    //     else if (folderBoundingBox3DArray[i].closed == false) {
    //         if (i == labelTool.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex].lastIndexOf(rotationBboxIndex.toString()) && rFlag == true) {
    //             labelTool.cubeArray[labelTool.currentFileIndex][i].material.color.setHex(0xff8000);
    //         }
    //         else {
    //             labelTool.cubeArray[labelTool.currentFileIndex][i].material.color.setHex(0xff0000);
    //             folderPositionArray[i].open();
    //             folderSizeArray[i].open();
    //         }
    //     }
    //
    //     else if (folderBoundingBox3DArray[i].closed == true) {
    //         labelTool.cubeArray[labelTool.currentFileIndex][i].material.color.setHex(0x008866);
    //     }
    // }
    // cameraControls.update(camera, keyboard, clock);
    update();
    if (keyboardNavigation === true && pointerLockControls !== undefined) {
        let time = performance.now();
        let delta = (time - prevTime) / 1000;
        translationVelocity.x -= translationVelocity.x * 10.0 * delta;
        translationVelocity.z -= translationVelocity.z * 10.0 * delta;
        translationVelocity.y -= translationVelocity.y * 10.0 * delta;
        rotationVelocity.x -= rotationVelocity.x * delta * 0.000000001;
        rotationVelocity.z -= rotationVelocity.z * delta * 0.000000001;
        rotationVelocity.y -= rotationVelocity.y * delta * 0.000000001;

        translationDirection.x = Number(moveLeft) - Number(moveRight);
        translationDirection.y = Number(moveForward) - Number(moveBackward);
        translationDirection.z = Number(moveUp) - Number(moveDown);
        translationDirection.normalize(); // this ensures consistent movements in all directions
        rotationDirection.x = Number(rotateUp) - Number(rotateDown);
        rotationDirection.y = Number(rotateRight) - Number(rotateLeft);
        rotationDirection.z = 0; // roll not used
        rotationDirection.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) translationVelocity.z -= translationDirection.y * 400.0 * delta;
        if (moveLeft || moveRight) translationVelocity.x -= translationDirection.x * 400.0 * delta;
        if (moveUp || moveDown) translationVelocity.y += translationDirection.z * 400.0 * delta;
        if (rotateUp || rotateDown) rotationVelocity.x += rotationDirection.x * delta;
        if (rotateRight || rotateLeft) rotationVelocity.y -= rotationDirection.y * delta;

        pointerLockControls.getObject().translateX(translationVelocity.x * delta);//lateral
        pointerLockControls.getObject().translateY(translationVelocity.y * delta);//vertical
        pointerLockControls.getObject().translateZ(translationVelocity.z * delta);//longitudinal

        // pointerLockControls.getObject().rotateX(rotationVelocity.x * delta);//pitch
        // pointerLockControls.getObject().rotateY(rotationVelocity.y * delta);//yaw
        //pointerLockControls.getObject().rotateZ(rotationVelocity.z * delta);//roll not used


        // TODO: do not allow to rotate up/down (pitch) because yaw will not work afterwards (because yaw rotation around local vertical axis)
        // solution: yaw rotation around vertical WORLD axis!
        // if (rotateUp) {
        //     pointerLockObject.rotateX(0.01);//pitch
        // } else {
        //     pointerLockObject.rotateX(0);//pitch
        // }
        // if (rotateDown) {
        //     pointerLockObject.rotateX(-0.01);//pitch
        // } else {
        //     pointerLockObject.rotateX(0);//pitch
        // }

        if (rotateLeft) {
            pointerLockObject.rotateY(0.01);//pitch
        } else {
            pointerLockObject.rotateY(0);//pitch
        }
        if (rotateRight) {
            pointerLockObject.rotateY(-0.01);//pitch
        } else {
            pointerLockObject.rotateY(0);//pitch
        }

        prevTime = time;
    }

    render();

}


/**
 * Find the corresponding camera channels in that the 3D object is visible.
 * Note that an object can be visible in one or two camera channels
 * @param x Lateral position
 * @param y Longitudinal position
 * @returns channel One of the six camera channels
 */
function getChannelsByPosition(x, y) {
    let channels = [];
    let alphaRadian;
    if (x >= 0 && y >= 0) {
        alphaRadian = Math.atan(Math.abs(y) / Math.abs(x)) + Math.PI / 2;
    } else if (x < 0 && y >= 0) {
        alphaRadian = Math.atan(Math.abs(x) / Math.abs(y)) + Math.PI;
    } else if (x < 0 && y < 0) {
        alphaRadian = Math.atan(Math.abs(y) / Math.abs(x)) + 1.5 * Math.PI;
    } else {
        // x>=0 and y<0
        alphaRadian = Math.atan(Math.abs(x) / Math.abs(y));
    }
    let alphaDegrees = 360 * alphaRadian / (2 * Math.PI);

    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        if ((alphaDegrees >= 325 && alphaDegrees < 360) || (alphaDegrees >= 0 && alphaDegrees < 35)) {
            channels.push(labelTool.camChannels[1].channel);
        }
        if (alphaDegrees >= 20 && alphaDegrees < 90) {
            channels.push(labelTool.camChannels[2].channel);
        }
        if (alphaDegrees >= 75 && alphaDegrees < 145) {
            channels.push(labelTool.camChannels[3].channel);
        }
        if (alphaDegrees >= 115 && alphaDegrees < 245) {
            channels.push(labelTool.camChannels[4].channel);
        }
        if (alphaDegrees >= 215 && alphaDegrees < 285) {
            channels.push(labelTool.camChannels[5].channel);
        }
        if (alphaDegrees >= 270 && alphaDegrees < 340) {
            channels.push(labelTool.camChannels[0].channel);
        }
    } else {
        // GoPro Hero 4 Black, 4:3, wide angle, 122.6 degree
        if ((alphaDegrees >= 312.8 && alphaDegrees < 360) || (alphaDegrees >= 0 && alphaDegrees < 47.2)) {
            channels.push(labelTool.camChannels[1].channel);
        }
        if (alphaDegrees >= 20 && alphaDegrees < 90) {
            channels.push(labelTool.camChannels[2].channel);
        }
        if (alphaDegrees >= 75 && alphaDegrees < 145) {
            channels.push(labelTool.camChannels[3].channel);
        }
        if (alphaDegrees >= 115 && alphaDegrees < 245) {
            channels.push(labelTool.camChannels[4].channel);
        }
        if (alphaDegrees >= 215 && alphaDegrees < 285) {
            channels.push(labelTool.camChannels[5].channel);
        }
        if (alphaDegrees >= 270 && alphaDegrees < 340) {
            channels.push(labelTool.camChannels[0].channel);
        }
    }

    return channels;
}

function rotatePoint(pointX, pointY, originX, originY, angle) {
    angle = angle * Math.PI / 180.0;
    return {
        x: Math.cos(angle) * (pointX - originX) - Math.sin(angle) * (pointY - originY) + originX,
        y: Math.sin(angle) * (pointX - originX) + Math.cos(angle) * (pointY - originY) + originY
    };
}


function calculateProjectedBoundingBox(xPos, yPos, zPos, width, height, depth, channel, rotationY) {
    // xPos = 2.8725;
    // yPos = 12.4287;
    // zPos = -0.1678;
    // width = 1.9793;
    // height = 1.2933;
    // depth = 4.2928;// longitudinal
    let idx = getChannelIndexByName(channel);
    // LIDAR uses long, lat, vert
    // pos_long = pos_long - labelTool.positionLidarNuscenes[1];
    // pos_lat = pos_lat - labelTool.positionLidarNuscenes[0];
    // pos_vert = pos_vert - labelTool.positionLidarNuscenes[2];

    // working, but user sees back of camera
    // xPos = xPos - labelTool.positionLidarNuscenes[1];
    // yPos = yPos - labelTool.positionLidarNuscenes[2];
    // zPos = zPos - labelTool.positionLidarNuscenes[0];
    // TODO: calculate scaling factor dynamically (based on top position of slider)
    let imageScalingFactor;
    let dimensionScalingFactor;
    let streetVerticalOffset = 0;
    let longitudeOffset = 0;
    let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        streetVerticalOffset = 0;//[0,labelTool.positionLidarNuscenes[2],1]
        imageScalingFactor = 1600 / imagePanelHeight;//5
        //imageScalingFactor = 5;
        dimensionScalingFactor = 1;
        longitudeOffset = 0;
        xPos = xPos + labelTool.translationVectorLidarToCamFront[1];//lat
        yPos = yPos + labelTool.translationVectorLidarToCamFront[0];//long
        zPos = zPos + labelTool.translationVectorLidarToCamFront[2];//vertical
    } else {
        if (channel === "CAM_FRONT") {
            imageScalingFactor = 960 / imagePanelHeight;
            // TODO: height should be 1.4478m (1.6 m) but 0.6m is working
            //streetVerticalOffset = 60.7137000000000 / 100;//height of lidar; scene1: 60.7137000000000 / 100; scene4: 0
        } else if (channel === "CAM_BACK") {
            imageScalingFactor = 960 / imagePanelHeight;//960
            //streetVerticalOffset = -130 / 100;// scene1:-100 / 100; scene4: 0
        } else {
            imageScalingFactor = 1440 / imagePanelHeight;//6
            //streetVerticalOffset = 0;
        }

        if (channel === "CAM_BACK_LEFT" || channel === "CAM_BACK_RIGHT") {
            //longitudeOffset = -100 / 100;// sequence1 -100/100, sequence4: 0
        } else {
            //longitudeOffset = 0;
        }
        //dimensionScalingFactor = 100;// multiply by 100 to transform from m to cm
        // with new transformation matrix
        dimensionScalingFactor = 1;
    }
    let cornerPoints = [];

    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        // working
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
        // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos));
        // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos));
        // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos));
        // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos));
        // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth));
        // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth));
        // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth));
        // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth));
    } else {
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
    }


    let projectedPoints = [];
    for (let cornerPoint in cornerPoints) {
        let point = cornerPoints[cornerPoint];

        // swap vertical and long before projection
        let tmp = point[1];
        point[1] = point[2];
        point[2] = tmp;

        // rotate all 8 corner points before projection
        // TMP: commented out
        // let pointRotated = rotatePoint(point.x, point.y, xPos, yPos, rotationY * 360 / (2 * Math.PI));
        // point.x = pointRotated.x;
        // point.y = pointRotated.y;

        //let point3D = [point.x * dimensionScalingFactor, (point.y + longitudeOffset) * dimensionScalingFactor, (point.z + streetVerticalOffset) * dimensionScalingFactor, 1];
        let point3D = [point.x * dimensionScalingFactor, point.y * dimensionScalingFactor, point.z * dimensionScalingFactor, 1];
        let projectionMatrix;
        let point2D;
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            let transformationMatrixLidarToCam = matrixInvert(labelTool.camChannels[idx].transformationMatrixCamToLidar);

            // swap vert with long before projection
            let tmp = point3D[1];
            point3D[1] = point3D[2];
            point3D[2] = tmp;
            let transformedPoint = matrixProduct4x4(transformationMatrixLidarToCam, point3D);//result will be 4x1

            let pointRotated = rotatePoint(transformedPoint.x, transformedPoint.y, xPos, yPos, rotationY * 360 / (2 * Math.PI));
            transformedPoint.x = pointRotated.x;
            transformedPoint.y = pointRotated.y;

            point2D = matrixProduct3x4(labelTool.camChannels[idx].intrinsicMatrixLISAT, transformedPoint);

            // projectionMatrix = labelTool.camChannels[idx].projectionMatrixLISAT;
            // point2D = matrixProduct3x4(projectionMatrix, point3D);
        } else {
            projectionMatrix = labelTool.camChannels[idx].projectionMatrixNuScenes;
            point2D = matrixProduct3x4(projectionMatrix, point3D);
        }


        // lisat and old projection matrix: <
        if (point2D[2] < 0) {
            // add only points that are in front of camera
            let windowX = point2D[0] / point2D[2];
            let windowY = point2D[1] / point2D[2];
            //projectedPoints.push({x: windowX / imageScalingFactor, y: windowY / imageScalingFactor});
            projectedPoints.push(new THREE.Vector2(windowX / imageScalingFactor, windowY / imageScalingFactor));
        } else {
            // do not draw bounding box if it is too close too camera or behind
            return [];
        }

    }
    return projectedPoints;
}

// function setCameraToChannel(channel) {
//     let channelIdx = getChannelIndexByName(channel);
//     let fieldOfView = labelTool.camChannels[channelIdx].fieldOfView;
//     // scene.remove(camera);
//     camera = new THREE.PerspectiveCamera(fieldOfView, window.innerWidth / window.innerHeight, 0.01, 100000);
//     camera.up = new THREE.Vector3(0, 0, 1);
//     // scene.add(camera);
//     controls = new THREE.OrbitControls(camera, renderer.domElement);
//     controls.enableRotate = false;
//     controls.enablePan = true;
//     if (channel === labelTool.camChannels[0].channel) {
//         // front left
//         let pos = labelTool.camChannels[0].position;
//         controls.object.position.set(-pos[1], pos[0] - labelTool.positionLidarNuscenes[0], labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(-pos[1] + 0.0000001, pos[0] - labelTool.positionLidarNuscenes[0] + 0.0000001, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward
//     } else if (channel === labelTool.camChannels[1].channel) {
//         // front
//         let pos = labelTool.camChannels[1].position;
//         controls.object.position.set(pos[1], pos[0], labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(pos[1], pos[0] + 0.0000001, labelTool.positionLidarNuscenes[2] - pos[2]);
//     } else if (channel === labelTool.camChannels[2].channel) {
//         // front right
//         let yPos = 0.5;
//         let xPos = Math.tan(55 * Math.PI / 180) * yPos;
//         let pos = labelTool.camChannels[2].position;
//         controls.object.position.set(-pos[1] + xPos, pos[0] - labelTool.positionLidarNuscenes[0] + yPos, labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(-pos[1] + xPos + 0.0000001, pos[0] - labelTool.positionLidarNuscenes[0] + yPos + 0.0000001, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward
//     } else if (channel === labelTool.camChannels[3].channel) {
//         // back right
//         let yPos = 0.5;
//         let xPos = Math.tan(110 * Math.PI / 180) * yPos;
//         let pos = labelTool.camChannels[3].position;
//         controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidarNuscenes[0] - yPos, labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(-pos[1] - xPos + 0.0000001, pos[0] - labelTool.positionLidarNuscenes[0] - yPos - 0.0000001, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward
//     } else if (channel === labelTool.camChannels[4].channel) {
//         // back
//         let yPos = 0.5;
//         let xPos = Math.tan(180 * Math.PI / 180) * yPos;
//         let pos = labelTool.camChannels[4].position;
//         controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidarNuscenes[0] - yPos, labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(-pos[1] - xPos - 0.0000001, pos[0] - labelTool.positionLidarNuscenes[0] - yPos - 0.01, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward
//     } else if (channel === labelTool.camChannels[5].channel) {
//         // back left
//         let yPos = 0.5;
//         let xPos = Math.tan(250 * Math.PI / 180) * yPos;
//         let pos = labelTool.camChannels[5].position;
//         controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidarNuscenes[0] - yPos, labelTool.positionLidarNuscenes[2] - pos[2]);
//         controls.target = new THREE.Vector3(-pos[1] - xPos - 0.00000001, pos[0] - labelTool.positionLidarNuscenes[0] - yPos - 0.000000001, labelTool.positionLidarNuscenes[2] - pos[2]);// look backward
//     } else {
//         // channel undefined
//     }
//     // camera.updateProjectionMatrix();
//     controls.update();
// }

// function setCameraToBirdsEyeView() {
//     camera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0, 2000);
//     camera.position.set(0, 0, 450);
//     camera.up.set(0, 1, 0);
//     camera.lookAt(new THREE.Vector3(0, 0, 0));
//
//     controls = new THREE.OrbitControls(camera, renderer.domElement);
//     controls.enableRotate = false;
//     controls.enablePan = true;
//     controls.update();
// }

function changeDataset(datasetName) {
    labelTool.currentDataset = datasetName;
    labelTool.reset();
    labelTool.start();
}

function changeSequence(sequence) {
    labelTool.currentSequence = sequence;
    labelTool.reset();
    labelTool.start();
}

function readPointCloud() {
    let rawFile = new XMLHttpRequest();
    try {
        if (labelTool.showOriginalNuScenesLabels === true) {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/pointclouds/all_scenes/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
        } else {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/pointclouds/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
        }
    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    let points3D = [];
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                let allText = rawFile.responseText;
                let allLines = allText.split("\n");
                for (let i = 0; i < allLines.length; i++) {
                    if (i < 11) {
                        // skip header
                        continue;
                    }
                    let points3DStringArray = allLines[i].split(" ");
                    let point3D = [];
                    // skip the last value (intensity)
                    for (let j = 0; j < points3DStringArray.length - 1; j++) {
                        let value = Number(points3DStringArray[j]);
                        // points are stored in meters within .h5 file and .pcd files
                        // For LISA_T dataset multiply by 100 to get points in cm, because projection matrix requires it
                        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                            point3D.push(value * 100);
                        } else {
                            point3D.push(value);
                        }

                    }
                    // make point a 4x1 vector to multiply it with the 3x4 projection matrix P*X
                    point3D.push(1);
                    points3D.push(point3D);
                }
                return points3D;
            }
        }
    };
    rawFile.send(null);
    return points3D;
}

function projectPoints(points3D, channelIdx) {
    let points2D = [];
    currentPoints3D = [];
    currentDistances = [];
    let projectionMatrix;
    let scalingFactor;
    let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {

        if (channelIdx === 1 || channelIdx === 4) {
            // back and front camera image have a width of 480 px
            scalingFactor = 960 / imagePanelHeight;
        } else {
            scalingFactor = 1440 / imagePanelHeight;
        }

        projectionMatrix = labelTool.camChannels[channelIdx].projectionMatrixLISAT;
    } else {
        scalingFactor = 900 / imagePanelHeight;
        projectionMatrix = labelTool.camChannels[channelIdx].projectionMatrixNuScenes;
    }

    for (let point3DObj in points3D) {
        if (points3D.hasOwnProperty(point3DObj)) {
            let point3D = points3D[point3DObj];
            let point2D = matrixProduct3x4(projectionMatrix, point3D);
            if (point2D[2] > 0) {
                // use only points that are in front of the camera
                let windowX = point2D[0] / point2D[2];
                let windowY = point2D[1] / point2D[2];
                currentPoints3D.push(point3D);
                // calculate distance
                let distance = Math.sqrt(Math.pow(point3D[0], 2) + Math.pow(point3D[1], 2) + Math.pow(point3D[2], 2));
                currentDistances.push(distance);
                points2D.push({x: windowX / scalingFactor, y: windowY / scalingFactor});
            }
        }
    }
    return points2D;
}

function normalizeDistances() {
    let maxDistance = 0;
    for (let distanceIdx in currentDistances) {
        if (currentDistances.hasOwnProperty(distanceIdx)) {
            let distance = currentDistances[distanceIdx];
            if (distance > maxDistance) {
                maxDistance = distance;
            }
        }
    }
    for (let i = 0; i < currentDistances.length; i++) {
        currentDistances[i] = (currentDistances[i] / (maxDistance)) * 255;
    }
}

// function filterPoints(points3D, channel) {
//     for (let ){
//
//     }
// }

function showProjectedPoints() {
    let points3D = readPointCloud();
    for (let channelIdx in labelTool.camChannels) {
        if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
            let channelObj = labelTool.camChannels[channelIdx];
            let channelIndexByName = getChannelIndexByName(channelObj.channel);
            let paper = paperArray[channelIndexByName];
            let points2D = projectPoints(points3D, channelIndexByName);
            normalizeDistances();
            for (let i = 0; i < points2D.length; i++) {
                let pt2D = points2D[i];
                let circle = paper.circle(pt2D.x, pt2D.y, 1);
                let distance = currentDistances[i];
                let color = colorMap[Math.floor(distance)];
                circle.attr("stroke", color);
                circle.attr("stroke-width", 1);
                circleArray.push(circle);
            }

        }
    }

}

function hideProjectedPoints() {
    for (let i = circleArray.length - 1; i >= 0; i--) {
        let circle = circleArray[i];
        circle.remove();
        circleArray.splice(i, 1);
    }
}

function loadColorMap() {
    let rawFile = new XMLHttpRequest();
    try {
        rawFile.open("GET", 'colormaps/' + activeColorMap, false);
    } catch (error) {
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                let allText = rawFile.responseText;
                colorMap = allText.replace(/"/g, '').split("\n");
            }
        }
    };
    rawFile.send(null);
}

function onDocumentMouseWheel(event) {
    let factor = 15;
    let mX = (event.clientX / jQuery(container).width()) * 2 - 1;
    let mY = -(event.clientY / jQuery(container).height()) * 2 + 1;
    let vector = new THREE.Vector3(mX, mY, 0.1);
    vector.unproject(currentCamera);
    vector.sub(currentCamera.position);
    if (event.deltaY < 0) {
        currentCamera.position.addVectors(currentCamera.position, vector.setLength(factor));
        currentOrbitControls.target.addVectors(currentOrbitControls.target, vector.setLength(factor));
    } else {
        currentCamera.position.subVectors(currentCamera.position, vector.setLength(factor));
        currentOrbitControls.target.subVectors(currentOrbitControls.target, vector.setLength(factor));
    }
}

function onDocumentMouseMove(event) {
    // the following line would stop any other event handler from firing
    // (such as the mouse's TrackballControls)
    // event.preventDefault();

    // update the mouse variable
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function increaseTrackId(label, dataset) {
    let classesBB;
    if (dataset === labelTool.datasets.LISA_T) {
        classesBB = classesBoundingBox;
    } else {
        classesBB = classesBoundingBox.content;
    }

    // find out the lowest possible track id for a specific class

    for (let newTrackId = 1; newTrackId <= annotationObjects.contents[labelTool.currentFileIndex].length; newTrackId++) {
        let exist = false;
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            if (label !== annotationObjects.contents[labelTool.currentFileIndex]["class"]) {
                continue;
            }
            if (newTrackId === annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]) {
                exist = true;
                break;
            }
        }
        if (exist === false) {
            // track id was not used yet
            return newTrackId;
        }
    }
    return -1;
}

function disableStartPositionAndSize() {
    // disable slider
    folderPositionArray[interpolationObjIndexNextFile].domElement.style.opacity = 0.2;
    folderPositionArray[interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
    folderSizeArray[interpolationObjIndexNextFile].domElement.style.opacity = 0.2;
    folderSizeArray[interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
}

function enableStartPositionAndSize() {
    // disable slider
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
    folderSizeArray[interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
    folderSizeArray[interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
}

function scatter(vertices, size, color, texture = "") {
    let geometry = new THREE.BufferGeometry();
    let settings = {
        size: size,
        sizeAttenuation: false,
        alphaTest: 0.5,
        transparent: true
    };
    if (texture !== "") {
        console.log(texture);
        settings["map"] = new THREE.TextureLoader().load(texture);
    }
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    material = new THREE.PointsMaterial(settings);
    material.color.set(color);
    return new THREE.Points(geometry, material);
}

function updateBEV(xPos, yPos, zPos, width, height, depth) {
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let panelTopPos = headerHeight + imagePaneHeight;
    canvasBEV.left = "0px";
    canvasBEV.top = panelTopPos;

    cameraBEV.position.set(xPos, yPos, zPos + 100);
    cameraBEV.lookAt(xPos, yPos, zPos);
}

function initBev() {
    canvasBEV = document.createElement("canvas");
    canvasBEV.id = "canvasBev";
    let wBev = window.innerWidth / 3;
    canvasBEV.width = wBev;
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let hBev;
    if (isFullscreen() === true) {
        hBev = (window.innerHeight - imagePaneHeight - headerHeight) / 3;
    } else {
        hBev = (screen.height + 24 - imagePaneHeight - headerHeight) / 3;
    }
    canvasBEV.height = hBev;
    $("body").append(canvasBEV);
    $("#canvasBev").css("top", headerHeight + imagePaneHeight + 2 * hBev);

    cameraBEV = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraBEV.up = new THREE.Vector3(0, 0, -1);
    cameraBEV.lookAt(new THREE.Vector3(0, -1, 0));
    scene.add(cameraBEV);
}

function showBEV(xPos, yPos, zPos, width, height, depth) {
    if ($("#canvasBev").length === 0) {
        initBev();
    }
    updateBEV(xPos, yPos, zPos, width, height, depth);
    $("#canvasBev").show();
}

function initFrontView() {
    canvasFrontView = document.createElement("canvas");
    canvasFrontView.id = "canvasFrontView";
    let widthFrontView = window.innerWidth / 3;
    canvasFrontView.width = widthFrontView;
    let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let heightFrontView;
    if (isFullscreen() === true) {
        heightFrontView = (window.innerHeight - imagePanelTopPos - headerHeight) / 3;
    } else {
        heightFrontView = (screen.height + 24 - imagePanelTopPos - headerHeight) / 3;
    }
    canvasFrontView.height = heightFrontView;

    $("body").append(canvasFrontView);
    $("#canvasFrontView").css("top", headerHeight + imagePanelTopPos + heightFrontView);
    cameraFrontView = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraFrontView.lookAt(new THREE.Vector3(0, 0, -1));
    scene.add(cameraFrontView);
}

function updateFrontView(xPos, yPos, zPos, width, height, depth) {
    let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let panelTopPos = imagePanelTopPos + headerHeight + 270;
    canvasFrontView.left = "0px";
    canvasFrontView.top = panelTopPos;
    if (rendererFrontView === undefined) {
        rendererFrontView = new THREE.WebGLRenderer({
            antialias: true
        });
    }
    rendererFrontView.setSize(window.innerWidth, window.innerHeight);
    rendererFrontView.setClearColor(0x000000, 1);
    rendererFrontView.autoClear = false;
}

function showFrontView(xPos, yPos, zPos, width, height, depth) {
    if ($("#canvasFrontView").length === 0) {
        initFrontView();
    }
    updateFrontView(xPos, yPos, zPos, width, height, depth);
    $("#canvasFrontView").show();
}

function initSideView() {
    canvasSideView = document.createElement("canvas");
    canvasSideView.id = "canvasSideView";
    let widthSideView = window.innerWidth / 3;
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let heightSideView;
    if (isFullscreen() === true) {
        heightSideView = (window.innerHeight - imagePaneHeight - headerHeight) / 3;
    } else {
        heightSideView = (screen.height + 24 - imagePaneHeight - headerHeight) / 3;
    }

    canvasSideView.width = widthSideView;
    canvasSideView.height = heightSideView;
    canvasSideView.offsetTop = 0;
    $("body").append(canvasSideView);

    cameraSideView = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraSideView.lookAt(new THREE.Vector3(1, 0, 0));

    // TODO: let user move bounding box also in helperviews (master view)
    // canvasSideView.addEventListener('mousemove', onDocumentMouseMove, false);
    //
    // canvasSideView.onmousedown = function (ev) {
    //     console.log("mouse down");
    //     handleMouseDown(ev);
    // };
    //
    // canvasSideView.onmouseup = function (ev) {
    //     handleMouseUp(ev);
    // };

    scene.add(cameraSideView);
    // cameraSideView.up.set(0, 0, -1);
    // cameraSideView.position.set(xPos - 10, yPos, zPos);

    // if (Detector.webgl) {
    //     rendererSideView = new THREE.WebGLRenderer({
    //         antialias: true
    //     });
    // } else {
    //     rendererSideView = new CanvasRenderer();
    // }


    // mapControlsSideView = new THREE.MapControls(cameraSideView, canvasSideView);
    // mapControlsSideView.enableRotate = false;
}

function updateSideView(xPos, yPos, zPos, width, height, depth) {
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let panelTopPos = headerHeight + imagePaneHeight;
    canvasSideView.left = "0px";
    canvasSideView.top = panelTopPos;
}

function showSideView(xPos, yPos, zPos, width, height, depth) {
    if ($("#canvasSideView").length === 0) {
        initSideView();
    }
    updateSideView(xPos, yPos, zPos, width, height, depth);
    $("#canvasSideView").show();

}

function showHelperViews(xPos, yPos, zPos, width, height, depth) {
    showSideView(xPos, yPos, zPos, width, height, depth);
    showFrontView(xPos, yPos, zPos, width, height, depth);
    showBEV(xPos, yPos, zPos, width, height, depth);//width along x axis (lateral), height along y axis (longitudinal)
    // move class picker to right
    $("#class-picker").css("left", window.innerWidth / 3 + 10);
}

function enableInterpolationModeCheckbox(interpolationModeCheckbox) {
    interpolationModeCheckbox.parentElement.parentElement.style.opacity = 1.0;
    interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "all";
    $(interpolationModeCheckbox.firstChild).removeAttr("tabIndex");
}

function enableInterpolationBtn() {
    interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "all";
    interpolateBtn.domElement.parentElement.parentElement.style.opacity = 1.0;
}

function mouseUpLogic(ev) {
    dragControls = false;
    // check if scene contains transform controls
    useTransformControls = false;
    for (let i = 0; i < scene.children.length; i++) {
        if (scene.children[i].name === "transformControls") {
            useTransformControls = true;
        }
    }
    if (ev.button === 0) {
        let rect = ev.target.getBoundingClientRect();
        mouseUp.x = ((ev.clientX - rect.left) / $("#canvas3d canvas").attr("width")) * 2 - 1;
        mouseUp.y = -((ev.clientY - rect.top) / $("#canvas3d canvas").attr("height")) * 2 + 1;
        let ray = undefined;
        if (birdsEyeViewFlag === false) {
            let vector = new THREE.Vector3(mouseUp.x, mouseUp.y, 1);
            vector.unproject(currentCamera);
            ray = new THREE.Raycaster(currentCamera.position, vector.sub(currentCamera.position).normalize());
        } else {
            ray = new THREE.Raycaster();
            let mouse = new THREE.Vector2();
            mouse.x = mouseUp.x;
            mouse.y = mouseUp.y;
            ray.setFromCamera(mouse, currentCamera);
        }
        let clickedObjects;
        if (birdsEyeViewFlag === true) {
            clickedObjects = ray.intersectObjects(clickedPlaneArray);
        } else {
            clickedObjects = ray.intersectObjects(labelTool.cubeArray[labelTool.currentFileIndex]);
        }


        // close folders
        for (let i = 0; i < folderBoundingBox3DArray.length; i++) {
            if (folderBoundingBox3DArray[i] !== undefined) {
                folderBoundingBox3DArray[i].close();
            }
        }

        if (clickedObjects.length > 0 && clickedObjectIndex !== -1) {
            // one object was selected
            // for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
            //     let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
            // meshObject.material.opacity = 0.1;
            // }
            // labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].material.opacity = 0.9;
            // open folder of selected object
            annotationObjects.localOnSelect["PCD"](clickedObjectIndex);
            // set selected object

            labelTool.selectedMesh = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];
            if (labelTool.selectedMesh !== undefined) {
                addTransformControls();

                if (transformControls.position !== undefined) {
                    transformControls.detach();
                    transformControls.attach(labelTool.selectedMesh);
                }

                // if in birdseyeview then find minimum of longitude and latitude
                // otherwise find minimum of x, y and z
                // let smallestSide;
                // if (birdsEyeViewFlag === true) {
                //     smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
                // } else {
                //     smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
                // }
                // let size = smallestSide / 2.0;
                transformControls.size = 2;
            } else {
                labelTool.removeObject("transformControls");
            }

            // open folder of selected object
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let camChannel = labelTool.camChannels[channelIdx].channel;
                    annotationObjects.select(clickedObjectIndex, camChannel);
                }
            }
            let obj = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex];
            showHelperViews(obj["x"], obj["y"], obj["z"], obj["width"], obj["height"], obj["depth"]);

            // enable interpolate button if interpolation mode is activated AND selected object is the same as interpolated object
            if (interpolationMode === true) {
                if (annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["interpolationStartFileIndex"] !== -1 && annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["interpolationStartFileIndex"] !== labelTool.currentFileIndex) {
                    enableInterpolationBtn();
                } else {
                    interpolationObjIndexCurrentFile = clickedObjectIndex;
                    let obj = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile];
                    obj["interpolationStart"]["position"]["x"] = obj["x"];
                    obj["interpolationStart"]["position"]["y"] = obj["y"];
                    obj["interpolationStart"]["position"]["z"] = obj["z"];
                    obj["interpolationStart"]["position"]["rotationY"] = obj["rotationY"];
                    obj["interpolationStart"]["size"]["width"] = obj["width"];
                    obj["interpolationStart"]["size"]["height"] = obj["height"];
                    obj["interpolationStart"]["size"]["depth"] = obj["depth"];
                    obj["interpolationStartFileIndex"] = labelTool.currentFileIndex;

                    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
                    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (labelTool.currentFileIndex + 1) + ")";

                    if (clickedObjectIndexPrevious !== -1) {
                        folderPositionArray[clickedObjectIndexPrevious].domElement.firstChild.firstChild.innerText = "Position";
                        folderSizeArray[clickedObjectIndexPrevious].domElement.firstChild.firstChild.innerText = "Size";
                        // remove start position from previous selected object
                        annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndexPrevious]["interpolationStartFileIndex"] = -1;
                        annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndexPrevious]["interpolationStart"] = {
                            position: {
                                x: -1,
                                y: -1,
                                z: -1,
                                rotationY: -1
                            },
                            size: {
                                width: -1,
                                height: -1,
                                depth: -1
                            }
                        };
                        // enable copy checkbox of prev. object
                        let checkboxElemPrev = document.getElementById("copy-label-to-next-frame-checkbox-" + clickedObjectIndexPrevious);
                        enableCopyLabelToNextFrameCheckbox(checkboxElemPrev);
                        // disable copy checkbox of current obj
                        let checkboxElemCurrent = document.getElementById("copy-label-to-next-frame-checkbox-" + interpolationObjIndexCurrentFile);
                        disableCopyLabelToNextFrameCheckbox(checkboxElemCurrent);

                    }
                }
            }
            let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
            enableInterpolationModeCheckbox(interpolationModeCheckbox);
            // select corresponding class in class menu
            // get class name of selected object
            // get index of selected object within 5 classes (using class name)
            let classPickerElem = $('#class-picker ul li');
            classPickerElem.css('background-color', '#353535');
            $(classPickerElem[classesBoundingBox[obj["class"]].index]).css('background-color', '#525252');


        } else {
            // remove selection in camera view if 2d label exist
            for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                if (annotationObjects.contents[labelTool.currentFileIndex][i]["rect"] !== undefined) {
                    // removeBoundingBoxHighlight(i);
                    removeTextBox(i);
                }
            }

            // remove selection in birds eye view (lower opacity)
            for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                meshObject.material.opacity = 0.9;
            }

            // remove arrows (transform controls)
            if (transformControls !== undefined) {
                transformControls.detach();
            }
            labelTool.removeObject("transformControls");
            labelTool.selectedMesh = undefined;
            annotationObjects.selectEmpty();

            // disable interpolate button
            disableInterpolationBtn();

            $("#canvasBev").hide();
            $("#canvasSideView").hide();
            $("#canvasFrontView").hide();
            // move class picker to left
            $("#class-picker").css("left", 10);

            let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
            disableInterpolationModeCheckbox(interpolationModeCheckbox);

        }

        if (clickFlag === true) {
            clickedPlaneArray = [];
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let camChannel = labelTool.camChannels[channelIdx].channel;
                    annotationObjects.select(clickedObjectIndex, camChannel);
                }
            }

            clickFlag = false;
        } else if (groundPlaneArray.length === 1 && birdsEyeViewFlag === true && useTransformControls === false) {
            let groundUpObject = ray.intersectObjects(groundPlaneArray);
            let groundPointMouseUp = groundUpObject[0].point;

            let trackId = -1;
            let insertIndex;
            setHighestAvailableTrackId(classesBoundingBox.targetName());
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                if (annotationObjects.__selectionIndexCurrentFrame === -1) {
                    // no object selected in 3d scene (new object was created)-> use selected class from class menu
                    trackId = classesBoundingBox.content[classesBoundingBox.targetName()].nextTrackId;
                    insertIndex = annotationObjects.contents[labelTool.currentFileIndex].length;
                } else {
                    // object was selected in 3d scene
                    trackId = annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndexCurrentFrame]["trackId"];
                    insertIndex = annotationObjects.__selectionIndexCurrentFrame;
                    clickedObjectIndexPrevious = annotationObjects.__selectionIndexCurrentFrame;
                }
            } else {
                if (annotationObjects.__selectionIndexCurrentFrame === -1) {
                    trackId = classesBoundingBox[classesBoundingBox.targetName()].nextTrackId;
                    insertIndex = annotationObjects.contents[labelTool.currentFileIndex].length;
                    clickedObjectIndexPrevious = annotationObjects.contents[labelTool.currentFileIndex].length;
                } else {
                    trackId = annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndexCurrentFrame]["trackId"];
                    insertIndex = annotationObjects.__selectionIndexCurrentFrame;
                    clickedObjectIndexPrevious = annotationObjects.__selectionIndexCurrentFrame;
                }
            }

            // set channel based on 3d position of new bonding box
            if (Math.abs(groundPointMouseUp.x - groundPointMouseDown.x) > 0.1) {
                let xPos = (groundPointMouseUp.x + groundPointMouseDown.x) / 2;
                let yPos = (groundPointMouseUp.y + groundPointMouseDown.y) / 2;
                //let zPos = -100 / 100; // height of lidar sensor. Use it to put object on street
                //let zPos = -60.7137000000000 / 100;
                let zPos = 0;

                // average car height in meters (ref: https://www.carfinderservice.com/car-advice/a-careful-look-at-different-sedan-dimensions)
                let defaultDepth = 1.468628;
                let addBboxParameters = getDefaultObject();
                addBboxParameters.class = classesBoundingBox.targetName();
                addBboxParameters.x = xPos;
                addBboxParameters.y = yPos;
                addBboxParameters.z = zPos + defaultDepth / 2 - labelTool.positionLidarLISAT[2];
                addBboxParameters.width = Math.abs(groundPointMouseUp.x - groundPointMouseDown.x);
                addBboxParameters.height = Math.abs(groundPointMouseUp.y - groundPointMouseDown.y);
                addBboxParameters.depth = defaultDepth;
                addBboxParameters.rotationY = 0;
                addBboxParameters.original = {
                    class: classesBoundingBox.targetName(),
                    x: (groundPointMouseUp.x + groundPointMouseDown.x) / 2,
                    y: (groundPointMouseUp.y + groundPointMouseDown.y) / 2,
                    z: zPos + defaultDepth / 2 - labelTool.positionLidarLISAT[2],
                    width: Math.abs(groundPointMouseUp.x - groundPointMouseDown.x),
                    height: Math.abs(groundPointMouseUp.y - groundPointMouseDown.y),
                    depth: defaultDepth,
                    rotationY: 0,
                    trackId: trackId
                };
                addBboxParameters.trackId = trackId;
                addBboxParameters.fromFile = false;
                addBboxParameters.fileIndex = labelTool.currentFileIndex;
                addBboxParameters.copyLabelToNextFrame = false;

                if (interpolationMode === true) {
                    addBboxParameters["interpolationStart"]["position"]["x"] = addBboxParameters["x"];
                    addBboxParameters["interpolationStart"]["position"]["y"] = addBboxParameters["y"];
                    addBboxParameters["interpolationStart"]["position"]["z"] = addBboxParameters["z"];
                    addBboxParameters["interpolationStart"]["position"]["rotationY"] = addBboxParameters["rotationY"];
                    addBboxParameters["interpolationStart"]["size"]["width"] = addBboxParameters["width"];
                    addBboxParameters["interpolationStart"]["size"]["height"] = addBboxParameters["height"];
                    addBboxParameters["interpolationStart"]["size"]["depth"] = addBboxParameters["depth"];
                    addBboxParameters["interpolationStartFileIndex"] = labelTool.currentFileIndex;
                }
                // set channel
                // let channels = getChannelsByPosition(xPos, -yPos);
                // for (let i = 0; i < channels.length; i++) {
                for (let i = 0; i < labelTool.camChannels.length; i++) {
                    let channel = labelTool.camChannels[i].channel;
                    addBboxParameters.channels[i].channel = channel;
                    // working for LISA_T
                    // let projectedBoundingBox = calculateProjectedBoundingBox(-xPos, -yPos, -zPos, addBboxParameters.width, addBboxParameters.height, addBboxParameters.depth, channel, addBboxParameters.rotationY);
                    // new transformation matrices
                    let projectedBoundingBox = calculateProjectedBoundingBox(-xPos, -zPos, -yPos, addBboxParameters.width, addBboxParameters.depth, addBboxParameters.height, channel, addBboxParameters.rotationY);
                    addBboxParameters.channels[i].projectedPoints = projectedBoundingBox;
                }
                // calculate line segments
                for (let i = 0; i < addBboxParameters.channels.length; i++) {
                    let channelObj = addBboxParameters.channels[i];
                    if (channelObj.channel !== undefined && channelObj.channel !== '') {
                        if (addBboxParameters.channels[i].projectedPoints !== undefined && addBboxParameters.channels[i].projectedPoints.length === 8) {
                            addBboxParameters.channels[i]["lines"] = calculateAndDrawLineSegments(channelObj, classesBoundingBox.targetName());
                        }
                    }
                }
                annotationObjects.set(insertIndex, addBboxParameters);
                labelTool.selectedMesh = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex];
                if (labelTool.selectedMesh !== undefined) {
                    addTransformControls();
                } else {
                    labelTool.removeObject("transformControls");
                }
                showHelperViews(xPos, yPos, zPos, addBboxParameters["width"], addBboxParameters["height"], addBboxParameters["depth"]);


                annotationObjects.__insertIndex++;
                classesBoundingBox.target().nextTrackId++;
                for (let channelIdx in labelTool.camChannels) {
                    if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                        let camChannel = labelTool.camChannels[channelIdx].channel;
                        annotationObjects.select(insertIndex, camChannel);
                    }
                }
                let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
                enableInterpolationModeCheckbox(interpolationModeCheckbox);

                if (interpolationMode === true) {
                    interpolationObjIndexCurrentFile = insertIndex;
                }

            }
            groundPlaneArray = [];
            $("#label-tool-log").val("4. Choose class from drop down list");
            $("#label-tool-log").css("color", "#969696");
        }

    }
}

function handleMouseUp(ev) {
    if (rendererBev === undefined) {
        mouseUpLogic(ev);
    } else {
        if (ev.target !== rendererBev.domElement) {
            mouseUpLogic(ev);
        }
    }

}

function mouseDownLogic(ev) {
    let rect = ev.target.getBoundingClientRect();
    mouseDown.x = ((ev.clientX - rect.left) / window.innerWidth) * 2 - 1;
    mouseDown.y = -((ev.clientY - rect.top) / window.innerHeight) * 2 + 1;
    let ray;
    if (birdsEyeViewFlag === false) {
        let vector = new THREE.Vector3(mouseDown.x, mouseDown.y, 1);
        vector.unproject(currentCamera);
        ray = new THREE.Raycaster(currentCamera.position, vector.sub(currentCamera.position).normalize());
    } else {
        ray = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        mouse.x = mouseDown.x;
        mouse.y = mouseDown.y;
        ray.setFromCamera(mouse, currentCamera);
    }
    let clickedObjects = ray.intersectObjects(labelTool.cubeArray[labelTool.currentFileIndex]);

    if (clickedObjects.length > 0) {

        if (ev.button === 0) {
            clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
            clickFlag = true;
            clickedPoint = clickedObjects[0].point;
            clickedCube = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];

            if (birdsEyeViewFlag === true) {
                let material = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    wireframe: false,
                    transparent: true,
                    opacity: 0.0,
                    side: THREE.DoubleSide
                });
                let geometry = new THREE.PlaneGeometry(200, 200);
                let clickedPlane = new THREE.Mesh(geometry, material);
                clickedPlane.position.x = clickedPoint.x;
                clickedPlane.position.y = clickedPoint.y;
                clickedPlane.position.z = clickedPoint.z;
                let normal = clickedObjects[0].face;
                if ([normal.a, normal.b, normal.c].toString() == [6, 3, 2].toString() || [normal.a, normal.b, normal.c].toString() == [7, 6, 2].toString()) {
                    clickedPlane.rotation.x = Math.PI / 2;
                    clickedPlane.rotation.y = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                }
                else if ([normal.a, normal.b, normal.c].toString() == [6, 7, 5].toString() || [normal.a, normal.b, normal.c].toString() == [4, 6, 5].toString()) {
                    clickedPlane.rotation.x = -Math.PI / 2;
                    clickedPlane.rotation.y = -Math.PI / 2 - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                }
                else if ([normal.a, normal.b, normal.c].toString() == [0, 2, 1].toString() || [normal.a, normal.b, normal.c].toString() == [2, 3, 1].toString()) {
                    clickedPlane.rotation.x = Math.PI / 2;
                    clickedPlane.rotation.y = Math.PI / 2 + labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                }
                else if ([normal.a, normal.b, normal.c].toString() == [5, 0, 1].toString() || [normal.a, normal.b, normal.c].toString() == [4, 5, 1].toString()) {
                    clickedPlane.rotation.x = -Math.PI / 2;
                    clickedPlane.rotation.y = -labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                }
                else if ([normal.a, normal.b, normal.c].toString() == [3, 6, 4].toString() || [normal.a, normal.b, normal.c].toString() == [1, 3, 4].toString()) {
                    clickedPlane.rotation.y = -Math.PI
                }
                clickedPlane.name = "planeObject";
                scene.add(clickedPlane);
                clickedPlaneArray.push(clickedPlane);
            }

        } else if (ev.button === 2) {
            // rightclick
            let copyIdList = document.querySelectorAll('[id^="copy-label-to-next-frame-checkbox-"]'); // e.g. 0,1
            clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
            let label = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["class"];
            let trackId = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["trackId"];
            guiOptions.removeFolder(label + ' ' + trackId);
            if (transformControls !== undefined) {
                transformControls.detach();
            }
            labelTool.removeObject("transformControls");
            let channels = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex].channels;
            // iterate all channels and remove projection
            for (let channelIdx in channels) {
                if (channels.hasOwnProperty(channelIdx)) {
                    let channelObj = channels[channelIdx];
                    for (let lineObj in channelObj.lines) {
                        if (channelObj.lines.hasOwnProperty(lineObj)) {
                            let line = channelObj.lines[lineObj];
                            if (line !== undefined) {
                                line.remove();
                            }

                        }
                    }
                }

            }
            annotationObjects.remove(clickedObjectIndex);
            labelTool.cubeArray[labelTool.currentFileIndex].splice(clickedObjectIndex, 1);
            folderBoundingBox3DArray.splice(clickedObjectIndex, 1);
            folderPositionArray.splice(clickedObjectIndex, 1);
            folderSizeArray.splice(clickedObjectIndex, 1);
            annotationObjects.selectEmpty();
            labelTool.spriteArray[labelTool.currentFileIndex].splice(clickedObjectIndex, 1);
            labelTool.removeObject("sprite-" + label.charAt(0) + trackId);
            // remove sprite from DOM tree
            $("#class-" + label.charAt(0) + trackId).remove();
            labelTool.selectedMesh = undefined;
            // reduce track id by 1 for this class
            if (labelTool.showOriginalNuScenesLabels === true) {
                classesBoundingBox.content[label].nextTrackId--;
            } else {
                if (clickedObjectIndex === annotationObjects.contents[labelTool.currentFileIndex].length) {
                    // decrement track id if the last object in the list was deleted
                    classesBoundingBox[label].nextTrackId--;
                } else {
                    // otherwise not last object was deleted -> find out the highest possible track id
                    for (let newTrackId = 1; newTrackId <= annotationObjects.contents[labelTool.currentFileIndex].length; newTrackId++) {
                        let exist = false;
                        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                            if (newTrackId === annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]) {
                                exist = true;
                                break;
                            }
                        }
                        if (exist === false) {
                            // track id was not used yet
                            classesBoundingBox[label].nextTrackId = newTrackId;
                            break;
                        }
                    }
                }

            }
            $("#canvasSideView").remove();
            $("#canvasFrontView").remove();
            $("#canvasBev").remove();

            // if last object in current frame was deleted than disable interpolation mode
            if (annotationObjects.contents[labelTool.currentFileIndex].length === 0) {
                interpolationMode = false;
                $("#interpolation-checkbox").children().first().prop("checked", false);
                $("#interpolation-checkbox").children().first().removeAttr("checked");
            }
            //rename all ids following after insertIndexof
            // e.g. rename copy-label-to-next-frame-checkbox-1 to copy-label-to-next-frame-checkbox-0 if deleting first element
            for (let i = clickedObjectIndex + 1; i <= annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                let idToChange = copyIdList[i].id;
                let elem = document.getElementById(idToChange);
                elem.id = "copy-label-to-next-frame-checkbox-" + (i - 1);
            }
            annotationObjects.__selectionIndexCurrentFrame = -1;
        }//end right click
    } else {
        if (birdsEyeViewFlag === true) {
            clickedObjectIndex = -1;
            groundPlaneArray = [];
            let material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: false,
                transparent: true,//default: true
                opacity: 0.0,//oefault 0.0
                side: THREE.DoubleSide
            });
            let geometry = new THREE.PlaneGeometry(200, 200);
            let groundPlane = new THREE.Mesh(geometry, material);
            groundPlane.position.x = 0;
            groundPlane.position.y = 0;
            groundPlane.position.z = -1;
            groundPlaneArray.push(groundPlane);
            let groundObject = ray.intersectObjects(groundPlaneArray);
            groundPointMouseDown = groundObject[0].point;
        }
    }
}

function handleMouseDown(ev) {
    if (rendererBev === undefined) {
        mouseDownLogic(ev);
    } else {
        if (ev.target !== rendererBev.domElement) {
            mouseDownLogic(ev);
        }
    }
}

function isFullscreen() {
    return Math.round(window.innerHeight * window.devicePixelRatio) === screen.height;
}

function initViews() {
    let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let viewHeight;
    if (isFullscreen() === true) {
        viewHeight = Math.round((window.innerHeight - headerHeight - imagePanelTopPos) / 3);
    } else {
        viewHeight = Math.round((screen.height + 24 - headerHeight - imagePanelTopPos) / 3);
    }

    views = [
        // main view
        {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
            up: [0, 1, 0],
            fov: 70
        },
        // side view
        {
            left: 0,
            top: 0,
            width: window.innerWidth / 3,
            height: viewHeight,
            background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
            up: [-1, 0, 0],
            fov: 70,
            updateCamera: function (camera, scene, objectPosition) {
                camera.position.set(objectPosition.x + 10, objectPosition.y, objectPosition.z);
                camera.lookAt(objectPosition);
            }
        },
        // front view
        {
            left: 0,
            top: viewHeight,
            width: window.innerWidth / 3,
            height: viewHeight,
            background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
            up: [0, -1, 0],
            fov: 70,
            updateCamera: function (camera, scene, objectPosition) {
                camera.position.set(objectPosition.x, objectPosition.y + 10, objectPosition.z);
                camera.lookAt(objectPosition);
            }
        },
        // BEV
        {
            left: 0,
            top: 2 * viewHeight,
            width: window.innerWidth / 3,
            height: viewHeight,
            background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
            up: [1, 0, 0],
            fov: 70,
            updateCamera: function (camera, scene, objectPosition) {
                camera.position.set(objectPosition.x, objectPosition.y, objectPosition.z + 10);
                camera.lookAt(objectPosition);
            }
        }
    ];
    $("#canvasSideView").css("height", viewHeight);
    $("#canvasSideView").css("top", headerHeight + imagePanelTopPos);
    $("#canvasFrontView").css("height", viewHeight);
    $("#canvasFrontView").css("top", headerHeight + imagePanelTopPos + viewHeight);
    $("#canvasBev").css("height", viewHeight);
    $("#canvasBev").css("top", headerHeight + imagePanelTopPos + 2 * viewHeight);


    let mainView = views[0];
    let mainCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    mainCamera.position.set(10, 10, 10);//default
    mainCamera.up.fromArray(mainView.up);
    mainView.camera = mainCamera;
    for (let i = 1; i < views.length; i++) {
        let view = views[i];
        let top = 4;
        let bottom = -4;
        let aspectRatio = view.width / view.height;
        let left = bottom * aspectRatio;
        let right = top * aspectRatio;
        let camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.001, 2000);
        camera.position.set(0, 0, 0);//default
        camera.up.fromArray(view.up);
        view.camera = camera;
    }
}

function disableInterpolationModeCheckbox(interpolationModeCheckbox) {
    interpolationModeCheckbox.parentElement.parentElement.style.opacity = 0.2;
    interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "none";
    interpolationModeCheckbox.firstChild.setAttribute("tabIndex", "-1");
}

function disableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox) {
    copyLabelToNextFrameCheckbox.parentElement.parentElement.style.opacity = 0.2;
    copyLabelToNextFrameCheckbox.parentElement.parentElement.style.pointerEvents = "none";
    copyLabelToNextFrameCheckbox.firstChild.setAttribute("tabIndex", "-1");
}

function enableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox) {
    copyLabelToNextFrameCheckbox.parentElement.parentElement.style.opacity = 1.0;
    copyLabelToNextFrameCheckbox.parentElement.parentElement.style.pointerEvents = "all";
    $(copyLabelToNextFrameCheckbox.firstChild).removeAttr("tabIndex");
}

function disableInterpolationBtn() {
    interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "none";
    interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.2;
}

function disableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox) {
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.pointerEvents = "none";
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.opacity = 0.2;
    showNuScenesLabelsCheckbox.tabIndex = -1;
}

function enableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox) {
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.pointerEvents = "all";
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.opacity = 1.0;
    $(showNuScenesLabelsCheckbox.firstChild).removeAttr("tabIndex");
}

function enableChooseSequenceDropDown(chooseSequenceDropDown) {
    chooseSequenceDropDown.parentElement.parentElement.parentElement.style.pointerEvents = "all";
    chooseSequenceDropDown.parentElement.parentElement.parentElement.style.opacity = 1.0;
    $(chooseSequenceDropDown.firstChild).removeAttr("tabIndex");
}

function disableChooseSequenceDropDown(chooseSequenceDropDown) {
    chooseSequenceDropDown.parentElement.parentElement.style.pointerEvents = "none";
    chooseSequenceDropDown.parentElement.parentElement.style.opacity = 0.2;
    chooseSequenceDropDown.tabIndex = -1;
}

function createGrid() {
    labelTool.removeObject("grid");
    grid = new THREE.GridHelper(100, 100);
    let posZLidar;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        posZLidar = labelTool.positionLidarLISAT[2];
    } else {
        posZLidar = labelTool.positionLidarNuscenes[2];
    }
    grid.translateZ(-posZLidar);
    grid.rotateX(Math.PI / 2);
    grid.name = "grid";
    if (showGridFlag === true) {
        grid.visible = true;
    } else {
        grid.visible = false;
    }
    scene.add(grid);
}

function windowKeyDownHandler(event) {
    switch (event.keyCode) {
        case 67: // C
            switchView();
            break;
    }
    if (birdsEyeViewFlag === false) {
        switch (event.keyCode) {
            case 75: //K
                toggleKeyboardNavigation();
                break;
        }
        // if (keyboardNavigation === true) {
        //     let delta = 1;
        //     let rotationDelta = 0.1;
        //     switch (event.keyCode) {
        //         case 65: // A MOVE LEFT
        //             currentCamera.position.x = currentCamera.position.x - delta;
        //             break;
        //         case 87: // W MOVE FORWARD
        //             currentCamera.position.y = currentCamera.position.y + delta;
        //             break;
        //         case 68: // D MOVE RIGHT
        //             currentCamera.position.x = currentCamera.position.x + delta;
        //             break;
        //         case 83: // S MOVE BACKWARD
        //             currentCamera.position.y = currentCamera.position.y - delta;
        //             break;
        //         case 37:// LEFT ROTATION (YAW)
        //             currentCamera.rotation.y = currentCamera.rotation.y - rotationDelta;
        //             break;
        //         case 38:// UP ROTATION (PITCH)
        //             currentCamera.rotation.x = currentCamera.rotation.x + rotationDelta;
        //             break;
        //         case 39:// RIGHT ROTATION (YAW)
        //             currentCamera.rotation.y = currentCamera.rotation.y + rotationDelta;
        //             break;
        //         case 40:// DOWN ROTATION (PITCH)
        //             currentCamera.rotation.x = currentCamera.rotation.x - rotationDelta;
        //             break;
        //     }
        //     currentCamera.updateProjectionMatrix();
        // }
    }
}

function toggleKeyboardNavigation() {
    keyboardNavigation = !keyboardNavigation;
    if (keyboardNavigation === true) {
        setPointerLockControls();
    } else {
        setOrbitControls();
    }
}

// function canvas3DKeyUpHandler(event) {
//     if (keyboardNavigation === true) {
//         switch (event.keyCode) {
//             case 38: // up
//                 break;
//             case 87: // w
//                 moveForward = false;
//                 console.log("move forward false");
//                 break;
//             case 37: // left
//                 break;
//             case 65: // a
//                 moveLeft = false;
//                 console.log("move left false");
//                 break;
//             case 40: // down
//                 break;
//             case 83: // s
//                 moveBackward = false;
//                 break;
//             case 39: // right
//                 break;
//             case 68: // d
//                 moveRight = false;
//                 break;
//         }
//     }
// }

function canvas3DKeyDownHandler(event) {
    switch (event.keyCode) {
        case 75: //K
            toggleKeyboardNavigation();
            break;
    }
    // if (keyboardNavigation === true) {
    //     switch (event.keyCode) {
    //         case 38: // up
    //             break;
    //         case 87: // w
    //             moveForward = true;
    //             console.log("move forward true");
    //             break;
    //         case 37: // left
    //             break;
    //         case 65: // a
    //             moveLeft = true;
    //             console.log("move left true");
    //             break;
    //         case 40: // down
    //             break;
    //         case 83: // s
    //             moveBackward = true;
    //             break;
    //         case 39: // right
    //             break;
    //         case 68: // d
    //             moveRight = true;
    //             break;
    //     }
    // }
    // if (keyboardNavigation === true) {
    //     let delta = 1;
    //     switch (event.keyCode) {
    //         case 37: // LEFT
    //             currentCamera.position.x = currentCamera.position.x - delta;
    //             break;
    //         case 38: // UP
    //             currentCamera.position.z = currentCamera.position.z - delta;
    //             break;
    //         case 39: // RIGHT
    //             currentCamera.position.x = currentCamera.position.x + delta;
    //             break;
    //         case 40: // DOWN
    //             currentCamera.position.z = currentCamera.position.z + delta;
    //             break;
    //     }
    //     currentCamera.updateProjectionMatrix();
    // }
}

function init() {
    if (WEBGL.isWebGLAvailable() === false) {
        document.body.appendChild(WEBGL.getWebGLErrorMessage());
    }
    /**
     * CameraControls
     */
    // function CameraControls() {
    //     //constructor
    // }

    // CameraControls.prototype = {
    //     constructor: CameraControls,
    //     update: function (camera, keyboard, clock) {
    //         //functionality to go here
    //         let delta = clock.getDelta(); // seconds.
    //         let moveDistance = 10 * delta; // 200 pixels per second
    //         let rotateAngle = delta;   // pi/2 radians (90 degrees) per second
    //         if (keyboard.pressed("w")) {
    //             // camera.translateZ(-moveDistance);
    //             let angle = Math.abs(camera.rotation.y + Math.PI / 2);
    //             let posX = camera.position.x + Math.cos(angle) * moveDistance;
    //             let posY = camera.position.y + Math.sin(angle) * moveDistance;
    //             camera.position.set(posX, posY, camera.position.z);
    //         }
    //         if (keyboard.pressed("s")) {
    //             let angle = Math.abs(camera.rotation.y + Math.PI / 2);
    //             moveDistance = -moveDistance;
    //             let posX = camera.position.x + Math.cos(angle) * moveDistance;
    //             let posY = camera.position.y + Math.sin(angle) * moveDistance;
    //             camera.position.set(posX, posY, camera.position.z);
    //             // camera.position.set(0, 0, camera.position.z + moveDistance);
    //             // camera.translateZ(moveDistance);
    //         }
    //         if (keyboard.pressed("a")) {
    //             camera.translateX(-moveDistance);//great!
    //         }
    //         if (keyboard.pressed("d")) {
    //             camera.translateX(moveDistance);//great!
    //         }
    //         if (keyboard.pressed("q")) {
    //             camera.position.z = camera.position.z - moveDistance;
    //         }
    //         if (keyboard.pressed("e")) {
    //             camera.position.z = camera.position.z + moveDistance;
    //         }
    //
    //         if (keyboard.pressed("left")) {
    //             camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
    //         }
    //         if (keyboard.pressed("right")) {
    //             camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
    //         }
    //         // if (keyboard.pressed("up")) {
    //         //     camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateAngle);
    //         // }
    //         // if (keyboard.pressed("down")) {
    //         //     camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), -rotateAngle);
    //         // }
    //
    //
    //     }
    // };
    //
    // cameraControls = new CameraControls();
    // keyboard = new THREEx.KeyboardState();
    keyboard = new KeyboardState();
    clock = new THREE.Clock();
    // container = document.createElement('div');
    // document.body.appendChild(container);


    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x323232);
    scene.fog = new THREE.Fog(scene.background, 3500, 15000);

    let axisHelper = new THREE.AxisHelper(1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);

    let light = new THREE.DirectionalLight(0xffffff, 20);
    light.position.set(0, 0, 0);
    scene.add(light);

    canvas3D = document.getElementById('canvas3d');

    if (birdsEyeViewFlag === false) {
        canvas3D.removeEventListener('keydown', canvas3DKeyDownHandler);
        canvas3D.addEventListener('keydown', canvas3DKeyDownHandler);
    }


    window.removeEventListener('keydown', windowKeyDownHandler);
    window.addEventListener('keydown', windowKeyDownHandler);
    // controls.domElement = container;

    renderer = new THREE.WebGLRenderer({antialias: true});
    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    setCamera();
    createGrid();

    if ($("#canvas3d").children().size() > 0) {
        $($("#canvas3d").children()[0]).remove();
    }
    canvas3D.appendChild(renderer.domElement);

    // stats = new Stats();
    // canvas3D.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    projector = new THREE.Projector();
    canvas3D.addEventListener('mousemove', onDocumentMouseMove, false);

    canvas3D.onmousedown = function (ev) {
        handleMouseDown(ev);
    };

    canvas3D.onmouseup = function (ev) {
        handleMouseUp(ev);
    };

    // currentOrbitControls.noZoom = true;
    // $('#canvas3d').on('mousewheel', function (e) {
    //     let mouseX = (e.clientX - (window.innerWidth / 2)) * 10;
    //     let mouseY = (e.clientY - (window.innerHeight / 2)) * 10;
    //
    //     if (e.originalEvent.deltaY < 0) { // zoom to the front
    //         currentCamera.position.x -= mouseX * .00125;
    //         currentCamera.position.z += mouseY * .00125;
    //         currentCamera.position.y += 1.1 * 10;
    //         currentOrbitControls.target.x -= mouseX * .00125;
    //         currentOrbitControls.target.z += mouseY * .00125;
    //         currentOrbitControls.target.y += 1.1 * 10;
    //     } else {                          // zoom to the back
    //         currentCamera.position.x += mouseX * .00125;
    //         currentCamera.position.z -= mouseY * .00125;
    //         currentCamera.position.y -= 1.1 * 10;
    //         currentOrbitControls.target.x += mouseX * .00125;
    //         currentOrbitControls.target.z -= mouseY * .00125;
    //         currentOrbitControls.target.y -= 1.1 * 10;
    //     }
    // });
    //canvas3D.addEventListener('mousewheel', onDocumentMouseWheel, false);
    // canvas3D.onmousewheel = function (event) {
    //     let factor = 15;
    //     let mX = (event.clientX / jQuery(container).width()) * 2 - 1;
    //     let mY = -(event.clientY / jQuery(container).height()) * 2 + 1;
    //     let vector = new THREE.Vector3(mX, mY, 0.1);
    //     vector.unproject(currentCamera);
    //     vector.sub(currentCamera.position);
    //     if (event.deltaY < 0) {
    //         currentCamera.position.addVectors(currentCamera.position, vector.setLength(factor));
    //         currentOrbitControls.target.addVectors(currentOrbitControls.target, vector.setLength(factor));
    //     } else {
    //         currentCamera.position.subVectors(currentCamera.position, vector.setLength(factor));
    //         currentOrbitControls.target.subVectors(currentOrbitControls.target, vector.setLength(factor));
    //     }
    // };

    labelTool.cubeArray = [];
    labelTool.spriteArray = [];
    labelTool.savedFrames = [];
    annotationObjects.contents = [];
    for (let i = 0; i < labelTool.numFrames; i++) {
        labelTool.cubeArray.push([]);
        labelTool.spriteArray.push([]);
        labelTool.savedFrames.push([]);
        annotationObjects.contents.push([]);
    }

    if (guiBoundingBoxAnnotationMap === undefined) {
        guiBoundingBoxAnnotationMap = {
            "Vehicle": guiAnnotationClasses.add(parametersBoundingBox, "Vehicle").name("Vehicle"),
            "Truck": guiAnnotationClasses.add(parametersBoundingBox, "Truck").name("Truck"),
            "Motorcycle": guiAnnotationClasses.add(parametersBoundingBox, "Motorcycle").name("Motorcycle"),
            "Bicycle": guiAnnotationClasses.add(parametersBoundingBox, "Bicycle").name("Bicycle"),
            "Pedestrian": guiAnnotationClasses.add(parametersBoundingBox, "Pedestrian").name("Pedestrian"),
        };
        guiAnnotationClasses.domElement.id = 'class-picker';
        // 3D BB controls
        guiOptions.add(parameters, 'download').name("Download");
        guiOptions.add(parameters, 'switch_view').name("Switch view");
        let showOriginalNuScenesLabelsCheckbox = guiOptions.add(parameters, 'show_nuscenes_labels').name('NuScenes Labels').listen();
        showOriginalNuScenesLabelsCheckbox.onChange(function (value) {
            labelTool.showOriginalNuScenesLabels = value;
            if (labelTool.showOriginalNuScenesLabels === true) {
                // TODO: improve:
                // - do not reset
                // - show current labels and in addition nuscenes labels
                labelTool.reset();
                labelTool.start();
            } else {
                // TODO: hide nuscenes labels (do not reset)
                labelTool.reset();
                labelTool.start();
            }
        });
        let allCheckboxes = $(":checkbox");
        let showNuScenesLabelsCheckbox = allCheckboxes[0];
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            disableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
        } else {
            enableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
        }
        let chooseSequenceDropDown;
        guiOptions.add(parameters, 'datasets', ['NuScenes', 'LISA_T']).name("Choose dataset")
            .onChange(function (value) {
                changeDataset(value);
                let allCheckboxes = $(":checkbox");
                let showNuScenesLabelsCheckbox = allCheckboxes[0];
                if (value === labelTool.datasets.LISA_T) {
                    disableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
                    enableChooseSequenceDropDown(chooseSequenceDropDown.domElement);
                } else {
                    enableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
                    disableChooseSequenceDropDown(chooseSequenceDropDown.domElement);
                }
                hideMasterView();
            });
        chooseSequenceDropDown = guiOptions.add(parameters, 'sequences', [
            labelTool.sequencesLISAT.date_2018_05_23_001_frame_00042917_00043816_small,
            labelTool.sequencesLISAT.date_2018_05_23_001_frame_00042917_00043816,
            labelTool.sequencesLISAT.date_2018_05_23_001_frame_00077323_00078222,
            labelTool.sequencesLISAT.date_2018_05_23_001_frame_00080020_00080919,
            labelTool.sequencesLISAT.date_2018_05_23_001_frame_00106993_00107892,
            labelTool.sequencesLISAT.date_2018_07_02_005_frame_00000000_00000900,
            labelTool.sequencesLISAT.date_2018_07_02_005_frame_00000900_00001800,
            labelTool.sequencesLISAT.date_2018_07_02_005_frame_00001800_00002700]).name("Choose Sequence")
            .onChange(function (value) {
                changeSequence(value);
                hideMasterView();
            });

        let showFieldOfViewCheckbox = guiOptions.add(parameters, 'show_field_of_view').name('Field-Of-View').listen();
        showFieldOfViewCheckbox.onChange(function (value) {
            labelTool.showFieldOfView = value;
            if (labelTool.showFieldOfView === true) {
                labelTool.removeObject('rightplane');
                labelTool.removeObject('leftplane');
                labelTool.removeObject('prism');
                labelTool.drawFieldOfView();
            } else {
                labelTool.removeObject('rightplane');
                labelTool.removeObject('leftplane');
                labelTool.removeObject('prism');
            }
        });
        let showProjectedPointsCheckbox = guiOptions.add(parameters, 'show_projected_points').name('Show projected points').listen();
        showProjectedPointsCheckbox.onChange(function (value) {
            showProjectedPointsFlag = value;
            if (showProjectedPointsFlag === true) {
                showProjectedPoints();
            } else {
                hideProjectedPoints();
            }
        });
        let showGridCheckbox = guiOptions.add(parameters, 'show_grid').name('Show grid').listen();
        showGridCheckbox.onChange(function (value) {
            showGridFlag = value;
            //let grid = scene.getObjectByName("grid");
            if (grid === undefined || grid.parent === null) {
                createGrid();
            }
            if (showGridFlag === true) {
                grid.visible = true;
            } else {
                grid.visible = false;
            }
        });
        let filterGroundCheckbox = guiOptions.add(parameters, 'filter_ground').name('Filter ground').listen();
        filterGroundCheckbox.onChange(function (value) {
            filterGround = value;
            if (filterGround === true) {
                labelTool.removeObject("pointcloud_full");
                addObject(pointCloudWithoutGround, "pointcloud_without_ground");
            } else {
                labelTool.removeObject("pointcloud_without_ground");
                addObject(pointCloudFull, "pointcloud_full");
            }
        });
        guiOptions.add(parameters, 'select_all_copy_label_to_next_frame').name("Select all 'Copy label to next frame'");
        guiOptions.add(parameters, 'unselect_all_copy_label_to_next_frame').name("Unselect all 'Copy label to next frame'");
        let interpolationModeCheckbox = guiOptions.add(parameters, 'interpolation_mode').name('Interpolation Mode');
        interpolationModeCheckbox.domElement.id = 'interpolation-checkbox';
        // if scene contains no objects then deactivate checkbox
        if (annotationFileExist(undefined, undefined) === false || interpolationMode === false) {
            // no annotation file exist -> deactivate checkbox
            disableInterpolationModeCheckbox(interpolationModeCheckbox.domElement);
        }

        interpolationModeCheckbox.onChange(function (value) {
            interpolationMode = value;
            if (interpolationMode === true) {
                interpolationObjIndexCurrentFile = annotationObjects.getSelectionIndex();
                if (interpolationObjIndexCurrentFile !== -1) {
                    // set interpolation start position
                    let obj = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile];
                    obj["interpolationStart"]["position"]["x"] = obj["x"];
                    obj["interpolationStart"]["position"]["y"] = obj["y"];
                    obj["interpolationStart"]["position"]["z"] = obj["z"];
                    obj["interpolationStart"]["position"]["rotationY"] = obj["rotationY"];
                    obj["interpolationStart"]["size"]["width"] = obj["width"];
                    obj["interpolationStart"]["size"]["height"] = obj["height"];
                    obj["interpolationStart"]["size"]["depth"] = obj["depth"];
                    // short interpolation start index (Interpolation Start Position (frame 400)
                    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
                    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (labelTool.currentFileIndex + 1) + ")";
                    // set start index
                    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"] = labelTool.currentFileIndex;
                }
                // check 'copy label to next frame' of selected object
                annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["copyLabelToNextFrame"] = true;
                let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + interpolationObjIndexCurrentFile);
                checkboxElem.firstChild.checked = true;
                // disable checkbox
                disableCopyLabelToNextFrameCheckbox(checkboxElem);
            } else {
                disableInterpolationBtn();
                if (interpolationObjIndexCurrentFile !== -1) {
                    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Position";
                    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Size";
                    enableStartPositionAndSize();
                    //[1].__folders[""Interpolation End Position (frame 1)""]
                    for (let i = 0; i < folderBoundingBox3DArray.length; i++) {
                        // get all keys of folders object
                        let keys = Object.keys(folderBoundingBox3DArray[i].__folders);
                        for (let j = 0; j < keys.length; j++) {
                            if (keys[j].startsWith("Interpolation End")) {
                                folderBoundingBox3DArray[i].removeFolder(keys[j]);
                            }
                        }
                    }
                    // folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Position (frame " + (labelTool.previousFileIndex + 1) + ")");
                    // folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Size (frame " + (labelTool.previousFileIndex + 1) + ")");
                    // enable checkbox
                    let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + interpolationObjIndexCurrentFile);
                    enableCopyLabelToNextFrameCheckbox(checkboxElem);
                }
                interpolationObjIndexCurrentFile = -1;

            }
        });
        interpolateBtn = guiOptions.add(parameters, 'interpolate').name("Interpolate");
        interpolateBtn.domElement.id = 'interpolate-btn';
        disableInterpolationBtn();
        guiOptions.domElement.id = 'bounding-box-3d-menu';
        // add download Annotations button
        let downloadAnnotationsItem = $($('#bounding-box-3d-menu ul li')[0]);
        let downloadAnnotationsDivItem = downloadAnnotationsItem.children().first();
        downloadAnnotationsDivItem.wrap("<a href=\"\"></a>");
        loadColorMap();
        if (showProjectedPointsFlag === true) {
            showProjectedPoints();
        } else {
            hideProjectedPoints();
        }
    }
    let classPickerElem = $('#class-picker ul li');
    classPickerElem.css('background-color', '#353535');
    $(classPickerElem[0]).css('background-color', '#525252');
    classPickerElem.css('border-bottom', '0px');


    $('#bounding-box-3d-menu').css('width', '480px');
    $('#bounding-box-3d-menu ul li').css('background-color', '#353535');


    guiOptions.open();
    classPickerElem.each(function (i, item) {
        let propNamesArray = Object.getOwnPropertyNames(classesBoundingBox);
        let color = classesBoundingBox[propNamesArray[i]].color;
        let attribute = "20px solid" + ' ' + color;
        $(item).css("border-left", attribute);
        $(item).css('border-bottom', '0px');
    });

    let elem = $("#label-tool-log");
    elem.val("1. Draw bounding box ");
    elem.css("color", "#969696");

    initViews();

}
