let canvasBEV;
let canvasSideView;
let canvasFrontView;
let orthographicCamera;
let perspectiveCamera;
let currentCamera;
let cameraBEV;
let cameraSideView;
let cameraFrontView;
let currentOrbitControls;
let orthographicOrbitControls;
let perspectiveOrbitControls;
let transformControls;
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
let headerHeight = 50;
// let velocity = new THREE.Vector3();
// let direction = new THREE.Vector3();

// let stats;
let cube;
let interpolationObjIndex;
let interpolateBtn;

// let keyboard = new KeyboardState();

let guiAnnotationClasses = new dat.GUI({autoPlace: true, width: 90, resizable: false});
let guiBoundingBoxAnnotationMap;
let guiOptions = new dat.GUI({autoPlace: true, width: 300, resizable: false});
let numGUIOptions = 10;
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

function getObjectIndexByTrackId(trackId, fileIdx) {
    for (let i = 0; i < annotationObjects.contents[fileIdx].length; i++) {
        let obj = annotationObjects.contents[fileIdx][i];
        if (obj["trackId"] === trackId) {
            return i;
        }
    }
    return -1;
}

function interpolate() {
    interpolationObjIndex = annotationObjects.getSelectionIndex();
    let interpolationStartFileIndex = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationStartFileIndex"]);
    let numFrames = labelTool.currentFileIndex - interpolationStartFileIndex;
    let xDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["x"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["position"]["x"])) / numFrames;
    let yDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["y"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["position"]["y"])) / numFrames;
    let zDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["z"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["position"]["z"])) / numFrames;
    let rotationEnd = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["rotationY"]);
    let rotationStart = Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["position"]["rotationY"]);
    let rotationDelta = (rotationEnd - rotationStart) / numFrames;
    let widthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["size"]["width"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["size"]["width"])) / numFrames;
    let heightDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["size"]["height"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["size"]["height"])) / numFrames;
    let depthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationEnd"]["size"]["depth"]) - Number(annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]["interpolationStart"]["size"]["depth"])) / numFrames;


    let idx = getObjectIndexByTrackId(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["trackId"], labelTool.currentFileIndex);
    for (let i = 1; i < numFrames; i++) {
        // cloning
        let clonedObject = jQuery.extend(true, {}, annotationObjects.contents[interpolationStartFileIndex][interpolationObjIndex]);
        let clonedCubeObject = labelTool.cubeArray[interpolationStartFileIndex][interpolationObjIndex].clone();
        let clonedSprite = labelTool.spriteArray[interpolationStartFileIndex][interpolationObjIndex].clone();

        if (annotationObjects.contents[interpolationStartFileIndex + i] !== undefined && annotationObjects.contents[interpolationStartFileIndex + i].length > 1) {
            // if frame contains some objects, then find object with same trackId and overwrite it
            if (idx !== -1) {
                annotationObjects.contents[interpolationStartFileIndex + i][idx] = clonedObject;
                labelTool.cubeArray[interpolationStartFileIndex + i][idx] = clonedCubeObject;
                // scene.add(clonedCubeObject);
                labelTool.spriteArray[interpolationStartFileIndex + i][idx] = clonedSprite;
                // scene.add(clonedSprite);
            } else {
                alert("track id not found");
                break;
            }
        } else {
            // else clone object to new frame and adjusts interpolated position and size
            annotationObjects.contents[interpolationStartFileIndex + i].push(clonedObject);
            labelTool.cubeArray[interpolationStartFileIndex + i].push(clonedCubeObject);
            labelTool.spriteArray[interpolationStartFileIndex + i].push(clonedSprite);
        }


        let idx = getObjectIndexByTrackId(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["trackId"], interpolationStartFileIndex + i);

        let newX = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["position"]["x"]) + i * xDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["x"] = newX;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["position"]["x"] = newX;

        let newY = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["position"]["y"]) + i * yDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["y"] = newY;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["position"]["y"] = newY;

        let newZ = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["position"]["z"]) + i * zDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["z"] = newZ;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["position"]["z"] = newZ;

        let newRotation = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["position"]["rotationY"]) + i * rotationDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["rotationY"] = newRotation;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["rotation"]["z"] = newRotation;

        let newWidth = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["size"]["width"]) + i * widthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["width"] = newWidth;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["scale"]["x"] = newWidth;

        let newHeight = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["size"]["height"]) + i * heightDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["height"] = newHeight;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["scale"]["y"] = newHeight;

        let newDepth = Number(annotationObjects.contents[interpolationStartFileIndex][idx]["interpolationStart"]["size"]["depth"]) + i * depthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][idx]["depth"] = newDepth;
        labelTool.cubeArray[interpolationStartFileIndex + i][idx]["scale"]["z"] = newDepth;
    }

    // start position becomes current end position
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["position"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["position"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["position"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["position"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["position"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["position"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["position"]["rotationY"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["position"]["rotationY"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["size"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["size"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["size"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["size"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStart"]["size"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationEnd"]["size"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][idx]["interpolationStartFileIndex"] = labelTool.currentFileIndex;

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
    datasets: 'LISA_T',
    show_projected_points: false,
    show_nuscenes_labels: labelTool.showOriginalNuScenesLabels,
    show_field_of_view: false,
    show_grid: false,
    filter_ground: false,
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
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        pointCloudFullURL = labelTool.workBlob + '/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/' + 'pointclouds/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
        pointCloudWithoutGroundURL = labelTool.workBlob + '/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/' + 'pointclouds_without_ground/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
    } else {
        pointCloudFullURL = labelTool.workBlob + '/' + labelTool.currentDataset + '/pointclouds/all_scenes/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
        pointCloudWithoutGroundURL = labelTool.workBlob + '/' + labelTool.currentDataset + '/pointclouds_without_ground/all_scenes/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
    }

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
    // labelTool.changeFrame(labelTool.currentFileIndex);
    // download annotations
    // var annotations = labelTool.createAnnotations();
    // annotationContentJSON = JSON.stringify(annotations);
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
    // for (let i = 0; i < annotations.length; i++) {
    //     outputString += annotations[i].class + " ";
    //     // outputString += annotations[i].alpha + " ";
    //     // outputString += annotations[i].occluded + " ";
    //     // outputString += annotations[i].truncated + " ";
    //     // outputString += annotations[i].left + " ";
    //     // outputString += annotations[i].top + " ";
    //     // outputString += annotations[i].right + " ";
    //     // outputString += annotations[i].bottom + " ";
    //     outputString += (annotations[i].height).toFixed(6) + " ";//length
    //     outputString += (annotations[i].width).toFixed(6) + " ";//height
    //     outputString += (annotations[i].length).toFixed(6) + " ";//width
    //     outputString += (annotations[i].x).toFixed(6) + " ";//lateral x
    //     outputString += (annotations[i].y).toFixed(6) + " ";
    //     outputString += (annotations[i].z).toFixed(6) + " ";
    //     outputString += (annotations[i].rotationYaw).toFixed(6) + " ";
    //     // outputString += annotations[i].score + " ";
    //     outputString += annotations[i].trackId + "\n";
    // }
    outputString = b64EncodeUnicode(outputString);
    let fileName = labelTool.currentFileIndex.toString().padStart(6, '0');
    $($('#bounding-box-3d-menu ul li')[0]).children().first().attr('href', 'data:application/octet-stream;base64,' + outputString).attr('download', fileName + '.txt');
}

//change camera position to bird view position
function switchView() {
    birdsEyeViewFlag = !birdsEyeViewFlag;
    setCamera();
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


function get3DLabel(parameters) {
    let bbox = parameters;
    //let cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);//width, height, depth
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
        opacity: 0.4,
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

    scene.add(cubeMesh);

    // class tooltip
    let classTooltipElement = $("<div class='class-tooltip' id='class-" + parameters.class.charAt(0) + parameters.trackId + "'>" + parameters.class.charAt(0) + parameters.trackId + " | " + parameters.class + "</div>");
    $("body").append(classTooltipElement);
    // set background color
    $(classTooltipElement[0]).css("background", color);
    $(classTooltipElement[0]).css("opacity", 0.5);

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
    sprite.name = "sprite-" + parameters.class.charAt(0) + parameters.trackId;
    scene.add(sprite);
    labelTool.spriteArray[labelTool.currentFileIndex].push(sprite);


    labelTool.cubeArray[labelTool.currentFileIndex].push(cubeMesh);
    addBoundingBoxGui(bbox, undefined);
    return bbox;
}

function update2DBoundingBox(idx) {
    let className = annotationObjects.contents[labelTool.currentFileIndex][idx].class;
    for (let channelObject in annotationObjects.contents[labelTool.currentFileIndex][idx].channels) {
        if (annotationObjects.contents[labelTool.currentFileIndex][idx].channels.hasOwnProperty(channelObject)) {
            let channelObj = annotationObjects.contents[labelTool.currentFileIndex][idx].channels[channelObject];
            if (channelObj.channel !== '') {
                let x = annotationObjects.contents[labelTool.currentFileIndex][idx]["x"];
                let y = annotationObjects.contents[labelTool.currentFileIndex][idx]["y"];
                let z = annotationObjects.contents[labelTool.currentFileIndex][idx]["z"];
                let width = annotationObjects.contents[labelTool.currentFileIndex][idx]["width"];
                let height = annotationObjects.contents[labelTool.currentFileIndex][idx]["height"];
                let depth = annotationObjects.contents[labelTool.currentFileIndex][idx]["depth"];
                // TODO: rotation
                let rotationYaw = annotationObjects.contents[labelTool.currentFileIndex][idx]["rotationY"];
                let channel = channelObj.channel;
                // working for LISA_T
                channelObj.projectedPoints = calculateProjectedBoundingBox(-x, -y, -z, width, height, depth, channel);
                // channelObj.projectedPoints = calculateProjectedBoundingBox(-x, -y, z, width, height, depth, channel);
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
                    channelObj.lines = calculateLineSegments(channelObj, className);
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

//register new bounding box
function addBoundingBoxGui(bbox, bboxEndParams) {
    let insertIndex = folderBoundingBox3DArray.length;
    let bb = guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
    folderBoundingBox3DArray.push(bb);

    let folderPosition = folderBoundingBox3DArray[insertIndex].addFolder('Position');
    let cubeX = folderPosition.add(bbox, 'x').name("x (lateral)").min(-100).max(100).step(0.01).listen();
    let cubeY = folderPosition.add(bbox, 'y').name("y (longitudinal)").min(-100).max(100).step(0.01).listen();
    let cubeZ = folderPosition.add(bbox, 'z').name("z (vertical)").min(-3).max(10).step(0.01).listen();
    let cubeYaw = folderPosition.add(bbox, 'rotationY').name("rotation (yaw)").min(-Math.PI).max(Math.PI).step(0.05).listen();
    folderPosition.close();
    folderPositionArray.push(folderPosition);

    let folderSize = folderBoundingBox3DArray[insertIndex].addFolder('Size');
    let cubeW = folderSize.add(bbox, 'width').name("width (lateral)").min(0).max(20).step(0.01).listen();
    let cubeH = folderSize.add(bbox, 'height').name("length (longitudinal)").min(0).max(20).step(0.01).listen();
    let cubeD = folderSize.add(bbox, 'depth').name("height (vertical)").min(0).max(20).step(0.01).listen();
    folderSize.close();
    folderSizeArray.push(folderSize);

    cubeX.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["x"] = value;
        // update bounding box
        update2DBoundingBox(insertIndex);
    });
    cubeY.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["y"] = value;
        // update bounding box
        update2DBoundingBox(insertIndex);
    });
    cubeZ.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["z"] = value;
        // update bounding box
        update2DBoundingBox(insertIndex);
    });
    cubeYaw.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["rotationY"] = value;
        // update bounding box
        update2DBoundingBox(insertIndex);
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
        update2DBoundingBox(insertIndex);
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
        update2DBoundingBox(insertIndex);
    });
    cubeD.onChange(function (value) {
        let newZPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = newZPos;
        bbox.z = newZPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["depth"] = value;
        update2DBoundingBox(insertIndex);
    });

    if (bboxEndParams !== undefined && interpolationMode === true) {
        interpolationObjIndex = annotationObjects.getSelectionIndex();
        disableStartPositionAndSize();
        // change text
        folderPositionArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Interpolation Start Position";
        folderSizeArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Interpolation Start Size";
        // add folders for end position and end size
        this.folderEndPosition = folderBoundingBox3DArray[interpolationObjIndex].addFolder('Interpolation End Position');
        let cubeEndX = this.folderEndPosition.add(bboxEndParams, 'x').name("x (lateral)").min(-100).max(100).step(0.01).listen();
        let cubeEndY = this.folderEndPosition.add(bboxEndParams, 'y').name("y (longitudinal)").min(-100).max(100).step(0.01).listen();
        let cubeEndZ = this.folderEndPosition.add(bboxEndParams, 'z').name("z (vertical)").min(-3).max(10).step(0.01).listen();
        let cubeEndYaw = this.folderEndPosition.add(bboxEndParams, 'rotationY').name("rotation (yaw)").min(-Math.PI).max(Math.PI).step(0.01).listen();
        this.folderEndPosition.open();
        this.folderEndSize = folderBoundingBox3DArray[interpolationObjIndex].addFolder('Interpolation End Size');
        let cubeEndW = this.folderEndSize.add(bboxEndParams, 'width').name("width (lateral)").min(0).max(20).step(0.01).listen();
        let cubeEndH = this.folderEndSize.add(bboxEndParams, 'height').name("length (longitudinal)").min(0).max(20).step(0.01).listen();
        let cubeEndD = this.folderEndSize.add(bboxEndParams, 'depth').name("height (vertical)").min(0).max(20).step(0.01).listen();
        this.folderEndSize.open();
        let newFileIndex = bboxEndParams.newFileIndex;
        cubeEndX.onChange(function (value) {
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.x = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["x"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["x"] = value;
            // update bounding box
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndY.onChange(function (value) {
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.y = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["y"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["y"] = value;
            // update bounding box
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndZ.onChange(function (value) {
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.z = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["z"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["z"] = value;
            // update bounding box
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndYaw.onChange(function (value) {
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].rotation.z = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["rotationY"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["rotationY"] = value;
            // update bounding box
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndW.onChange(function (value) {
            let newXPos = labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.x + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.x)
                * Math.cos(labelTool.cubeArray[newFileIndex][interpolationObjIndex].rotation.z) / 2;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.x = newXPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["x"] = newXPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["x"] = newXPos;
            let newYPos = labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.y + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.x)
                * Math.sin(labelTool.cubeArray[newFileIndex][interpolationObjIndex].rotation.z) / 2;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.y = newYPos;
            // test with -newYPos
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["y"] = newYPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["y"] = newYPos;

            labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.x = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["scale"]["width"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["width"] = value;
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndH.onChange(function (value) {
            let newXPos = labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.x + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.y) * Math.sin(labelTool.cubeArray[newFileIndex][interpolationObjIndex].rotation.z) / 2;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.x = newXPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["x"] = newXPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["x"] = newXPos;
            let newYPos = labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.y - (value - labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.y) * Math.cos(labelTool.cubeArray[newFileIndex][interpolationObjIndex].rotation.z) / 2;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.y = newYPos;
            // test with -newYPos
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["position"]["y"] = newYPos;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["y"] = newYPos;

            labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.y = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["scale"]["height"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["height"] = value;
            update2DBoundingBox(interpolationObjIndex);
        });
        cubeEndD.onChange(function (value) {
            let newZPos = labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.z + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.z) / 2;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].position.z = newZPos;
            labelTool.cubeArray[newFileIndex][interpolationObjIndex].scale.z = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["interpolationEnd"]["scale"]["depth"] = value;
            annotationObjects.contents[newFileIndex][interpolationObjIndex]["depth"] = value;
            update2DBoundingBox(interpolationObjIndex);
        });
    }

    let textBoxTrackId = folderBoundingBox3DArray[insertIndex].add(bbox, 'trackId').min(0).step(1).name('Track ID');
    textBoxTrackId.onChange(function (value) {
        if (value < 0) {
            value = 0;
        }
        annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["trackId"] = Math.round(value);
        $("#bounding-box-3d-menu ul").children().eq(insertIndex + numGUIOptions).children().first().children().first().children().first().text(bbox.class + " " + Math.round(value));
    });

    let resetParameters = {
        reset: function () {
            resetCube(insertIndex);
        },
        delete: function () {
            guiOptions.removeFolder(bbox.class + ' ' + bbox.trackId);
            // hide 3D bounding box instead of removing it (in case redo button will be pressed)
            transformControls.detach();
            labelTool.removeObject("transformControls");
            labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].visible = false;
            let label = annotationObjects.contents[labelTool.currentFileIndex][insertIndex].class;
            let channels = annotationObjects.contents[labelTool.currentFileIndex][insertIndex].channels;
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
            annotationObjects.remove(insertIndex);
            folderBoundingBox3DArray.splice(insertIndex, 1);
            folderPositionArray.splice(insertIndex, 1);
            folderSizeArray.splice(insertIndex, 1);
            annotationObjects.selectEmpty();
            labelTool.spriteArray[labelTool.currentFileIndex].splice(insertIndex, 1);
            labelTool.removeObject("sprite-" + bbox.class.charAt(0) + bbox.trackId);
            // remove sprite from DOM tree
            $("#class-" + bbox.class.charAt(0) + bbox.trackId).remove();
            labelTool.selectedMesh = undefined;
            // reduce track id by 1 for this class
            if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                if (insertIndex === annotationObjects.contents[labelTool.currentFileIndex].length) {
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
            } else {
                classesBoundingBox.content[label].nextTrackId--;
            }
        }
    };
    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(resetParameters, 'reset').name("Reset");
    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(resetParameters, 'delete').name("Delete");
}

//reset cube parameter and position
function resetCube(index) {
    let reset_bbox = annotationObjects.contents[labelTool.currentFileIndex][index];
    reset_bbox.x = reset_bbox.org.x;
    reset_bbox.y = reset_bbox.org.y;
    reset_bbox.z = reset_bbox.org.z;
    reset_bbox.rotationY = reset_bbox.org.rotationY;
    reset_bbox.width = reset_bbox.org.width;
    reset_bbox.height = reset_bbox.org.height;
    reset_bbox.depth = reset_bbox.org.depth;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.x = reset_bbox.x;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.y = -reset_bbox.y;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.z = reset_bbox.z;
    labelTool.cubeArray[labelTool.currentFileIndex][index].rotation.z = reset_bbox.rotationY;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.x = reset_bbox.width;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.y = reset_bbox.height;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.z = reset_bbox.depth;
    // updateChannels(index);
}

//change window size
function onWindowResize() {
    // var canvas3D = $("canvas3d");
    // camera.aspect = canvas3D.getAttribute("width") / canvas3D.getAttribute("height");
    // camera.updateProjectionMatrix();
    // renderer.setSize(canvas3D.getAttribute("width"), canvas3D.getAttribute("height"));
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererBev.setSize(window.innerWidth / 3, window.innerHeight / 3);
    rendererFrontView.setSize(window.innerWidth / 3, window.innerHeight / 3);
    rendererSideView.setSize(window.innerWidth / 3, window.innerHeight / 3);
    animate();
}

function getObjectIndexByName(objectName) {
    let trackIdFind = objectName.split("-")[1];
    for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        let trackId = annotationObjects.contents[labelTool.currentFileIndex][i]["class"].toUpperCase().charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"];
        if (trackId === trackIdFind) {
            return i;
        }
    }
}

function addTransformControls() {
    labelTool.removeObject("transformControls");

    // transformControls.detach();
    // transformControls.position = [0, 0, 0];
    // TODO: try detaching object instead of creating new transformcontrols object
    transformControls = new THREE.TransformControls(currentCamera, renderer.domElement);
    transformControls.addEventListener('change', function (event) {
        useTransformControls = true;
        // update 2d bounding box
        if (labelTool.selectedMesh !== undefined) {
            let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["x"] = labelTool.selectedMesh.position.x;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["y"] = labelTool.selectedMesh.position.y;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["z"] = labelTool.selectedMesh.position.z;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["width"] = labelTool.selectedMesh.scale.x;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["length"] = labelTool.selectedMesh.scale.y;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["depth"] = labelTool.selectedMesh.scale.z;
            annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["rotationY"] = labelTool.selectedMesh.rotation.z;
            update2DBoundingBox(objectIndexByTrackId);
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
    });
    transformControls.addEventListener('dragging-changed', function (event) {
        useTransformControls = true;
        // dragObject = false;
        console.log("dragging-changed");
        // executed after drag finished
        // TODO: scale only on one side
        if (transformControls.getMode() === "scale") {
            // labelTool.selectedMesh.translateY(labelTool.selectedMesh.geometry.parameters.height / 2)
        }
        // orbitControls.enabled = !event.value;
        // translating works (no object is created)
        // scaleRotateTranslate = false;
    });
    transformControls.name = "transformControls";
    // if in birdseyeview then find minimum of longitude and latitude
    // otherwise find minimum of x, y and z
    let smallestSide;
    if (birdsEyeViewFlag === true) {
        smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
    } else {
        smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
    }

    let size = smallestSide / 2;
    console.log("size controls addtransformcontrols: " + size);
    transformControls.size = size;
    transformControls.attach(labelTool.selectedMesh);
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
            break;
        case 82: // R
            transformControls.setMode("rotate");
            transformControls.showX = false;
            transformControls.showY = false;
            break;
        case 83: // S
            transformControls.setMode("scale");
            transformControls.showX = true;
            transformControls.showY = true;
            break;
        case 187:
        case 107: // +, =, num+
            transformControls.setSize(transformControls.size + 0.1);
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
            transformControls.showZ = !transformControls.showZ;
            break;
        case 32: // Spacebar
            transformControls.enabled = !transformControls.enabled;
            break;
    }
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
                let smallestSide;
                if (birdsEyeViewFlag === true) {
                    smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
                } else {
                    smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
                }
                transformControls.size = smallestSide / 2.0;
                transformControls.showZ = true;
            }
        }

        currentCamera.position.set(0, 0, 5);
        currentCamera.up.set(0, 0, 1);


        currentOrbitControls = new THREE.OrbitControls(currentCamera, renderer.domElement);
        currentOrbitControls.enablePan = true;
        currentOrbitControls.enableRotate = true;
        currentOrbitControls.autoRotate = false;
        currentOrbitControls.enableKeys = false;
        currentOrbitControls.maxPolarAngle = Math.PI / 2;
        // currentOrbitControls = perspectiveOrbitControls;

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
    currentOrbitControls.update();
}

function render() {
    renderer.render(scene, currentCamera);
    // labelRenderer.render(scene, cameraBEV);

    if (rendererBev !== undefined) {
        rendererBev.render(scene, cameraBEV);
        let context = canvasBEV.getContext("2d");
        context.drawImage(rendererBev.domElement, 0, 0);
    } else if (rendererSideView !== undefined) {
        rendererSideView.render(scene, cameraSideView);
        let context = canvasSideView.getContext("2d");
        context.drawImage(rendererSideView.domElement, 0, 0);
    } else if (rendererFrontView !== undefined) {
        rendererFrontView.render(scene, cameraFrontView);
        let context = canvasFrontView.getContext("2d");
        context.drawImage(rendererFrontView.domElement, 0, 0);
    }

    updateAnnotationOpacity();
    updateScreenPosition();
}

function updateAnnotationOpacity() {
    for (let i = 0; i < labelTool.cubeArray[labelTool.currentFileIndex].length; i++) {
        let obj = labelTool.cubeArray[labelTool.currentFileIndex][i];
        let sprite = labelTool.spriteArray[labelTool.currentFileIndex][i];
        const meshDistance = currentCamera.position.distanceTo(obj.position);
        const spriteDistance = currentCamera.position.distanceTo(sprite.position);
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
        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));
        if (annotationObj.trackId !== undefined) {
            let classTooltip = $("#class-" + annotationObj.class.charAt(0) + annotationObj.trackId)[0];
            let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
            classTooltip.style.top = `${vector.y + headerHeight + imagePaneHeight - 21}px`;
            classTooltip.style.left = `${vector.x}px`;
            classTooltip.style.opacity = spriteBehindObject ? 0.25 : 1;
        }

    }
}

function update() {
    // disable rotation of orbitcontrols if object selected
    if (birdsEyeViewFlag === false) {
        if (labelTool.selectedMesh !== undefined) {
            console.log("disabled");
            currentOrbitControls.enableRotate = false;
        } else {
            console.log("enabled");
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


function calculateProjectedBoundingBox(xPos, yPos, zPos, width, height, depth, channel) {
    let idx = getChannelIndexByName(channel);
    // LIDAR uses long, lat, vert
    // pos_long = pos_long - labelTool.positionLidarNuscenes[1];
    // pos_lat = pos_lat - labelTool.positionLidarNuscenes[0];
    // pos_vert = pos_vert - labelTool.positionLidarNuscenes[2];

    // working, but user sees back of camera
    // xPos = xPos - labelTool.positionLidarNuscenes[1];
    // yPos = yPos - labelTool.positionLidarNuscenes[2];
    // zPos = zPos - labelTool.positionLidarNuscenes[0];
    let imageScalingFactor;
    let dimensionScalingFactor;
    let streetVerticalOffset;
    let longitudeOffset = 0;
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        streetVerticalOffset = 0;
        imageScalingFactor = 5;
        dimensionScalingFactor = 1;
        longitudeOffset = 0;
        xPos = xPos + labelTool.translationVectorLidarToCamFront[1];//lat
        yPos = yPos + labelTool.translationVectorLidarToCamFront[0];//long
        zPos = zPos + labelTool.translationVectorLidarToCamFront[2];//vertical
    } else {
        if (channel === "CAM_FRONT") {
            imageScalingFactor = 4;
            // TODO: height should be 1.4478m but 0.6m is working
            streetVerticalOffset = 60.7137000000000 / 100;//height of lidar
            //streetVerticalOffset = 1.4478; //height of lidar
        } else if (channel === "CAM_BACK") {
            imageScalingFactor = 4;
            streetVerticalOffset = -100 / 100;
        } else {
            imageScalingFactor = 6;
            streetVerticalOffset = 0;
        }

        if (channel === "CAM_BACK_LEFT" || channel === "CAM_BACK_RIGHT") {
            longitudeOffset = -100 / 100;
        } else {
            longitudeOffset = 0;
        }
        dimensionScalingFactor = 100;// multiply by 100 to transform from cm to m
    }
    let cornerPoints = [];
    // working LISA_T
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth / 2));
    // cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth / 2));
    let projectedPoints = [];
    for (let cornerPoint in cornerPoints) {
        let point = cornerPoints[cornerPoint];
        // working for LISA_T
        let point3D = [point.x * dimensionScalingFactor, (point.y + longitudeOffset) * dimensionScalingFactor, (point.z + streetVerticalOffset) * dimensionScalingFactor, 1];
        // let point3D = [point.x * dimensionScalingFactor, (point.y + longitudeOffset) * dimensionScalingFactor, (-point.z + streetVerticalOffset) * dimensionScalingFactor, 1];
        let projectionMatrix;
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            projectionMatrix = labelTool.camChannels[idx].projectionMatrixLISAT;
        } else {
            projectionMatrix = labelTool.camChannels[idx].projectionMatrixNuScenes;
        }

        let point2D = matrixProduct3x4(projectionMatrix, point3D);
        // lisat and old projection matrix: <
        if (point2D[2] < 0) {
            // add only points that are in front of camera
            let windowX = point2D[0] / point2D[2];
            let windowY = point2D[1] / point2D[2];
            projectedPoints.push({x: windowX / imageScalingFactor, y: windowY / imageScalingFactor});
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

function readPointCloud() {
    let rawFile = new XMLHttpRequest();
    try {
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {

            rawFile.open("GET", labelTool.workBlob + '/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/pointclouds/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
        } else {
            rawFile.open("GET", labelTool.workBlob + '/' + labelTool.currentDataset + '/pointclouds/all_scenes/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
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
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        if (channelIdx === 1 || channelIdx === 4) {
            // back and front camera image have a width of 480 px
            scalingFactor = 4;//1920/480 =4
        } else {
            scalingFactor = 6;//1920/320 =6
        }

        projectionMatrix = labelTool.camChannels[channelIdx].projectionMatrixLISAT;
    } else {
        scalingFactor = 5;//1600/320=5
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
    folderPositionArray[interpolationObjIndex].domElement.style.opacity = 0.2;
    folderPositionArray[interpolationObjIndex].domElement.style.pointerEvents = "none";
    folderSizeArray[interpolationObjIndex].domElement.style.opacity = 0.2;
    folderSizeArray[interpolationObjIndex].domElement.style.pointerEvents = "none";
}

function enableStartPositionAndSize() {
    // disable slider
    folderPositionArray[interpolationObjIndex].domElement.style.opacity = 1.0;
    folderPositionArray[interpolationObjIndex].domElement.style.pointerEvents = "all";
    folderSizeArray[interpolationObjIndex].domElement.style.opacity = 1.0;
    folderSizeArray[interpolationObjIndex].domElement.style.pointerEvents = "all";
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

function showBEV(xPos, yPos, width, height) {
    canvasBEV = document.createElement("canvas");
    //cameraBEV.up.set(0, 1, 0);// bev
    const wBev = window.innerWidth / 3;
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    const hBev = (window.innerHeight - imagePaneHeight - headerHeight - 3 * 34) / 3;
    let aspectRatio = wBev / hBev;
    // check which side is longer
    if (height > width) {
        let left = yPos + height / 2 + height / 100;
        let right = yPos - height / 2 - height / 100;
        let lateralSize = Math.abs(right - left);
        let bottom = -xPos - lateralSize / (aspectRatio * 2);
        let top = -xPos + lateralSize / (aspectRatio * 2);
        cameraBEV = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    } else {
        let bottom = -xPos - height / 2 - height / 100;
        let top = -xPos + height / 2 + height / 100;
        let verticalSize = Math.abs(top - bottom);
        let left = yPos + verticalSize * aspectRatio / 2;
        let right = yPos - verticalSize * aspectRatio / 2;
        cameraBEV = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    }

    cameraBEV.up.set(-1, 0, 1); //BEV view
    let panelBev = jsPanel.create({
        id: "panelBev",
        theme: "primary",
        contentSize: {
            width: function () {
                return Math.min(wBev, window.innerWidth / 3);
            },
            height: hBev
        },
        position: "left-bottom 0 0",
        headerTitle: "Bird's Eye View",
        content: function (panel) {
            let container = $(this.content)[0];
            canvasBEV.width = wBev;
            canvasBEV.height = hBev;
            cameraBEV.position.set(0, 0, 100); // bev
            //cameraBEV.position.set(0, 0, 0);// front view
            cameraBEV.lookAt(0, 0, 0);//bev
            //cameraBEV.lookAt(0, 0, 10);//front view
            container.appendChild(canvasBEV);
        },
        onwindowresize: true
    });
    rendererBev = new THREE.WebGLRenderer({
        antialias: true
    });
    rendererBev.setPixelRatio(window.devicePixelRatio);
    rendererBev.setSize(wBev, hBev);

}

function showFrontView(xPos, yPos, zPos, width, height, depth) {
    canvasFrontView = document.createElement("canvas");
    const widthFrontView = window.innerWidth / 3;
    let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    const heightFrontView = (window.innerHeight - imagePanelTopPos - headerHeight - 3 * 34) / 3;
    let aspectRatio = widthFrontView / heightFrontView;

    if (width > depth) {
        let left = -xPos + width;
        let right = -xPos - width;
        let lateralSize = Math.abs(right - left);
        let bottom = zPos - lateralSize / (aspectRatio * 2);
        let top = zPos + lateralSize / (aspectRatio * 2);
        cameraFrontView = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    } else {
        let bottom = zPos - depth / 2 - depth / 100;
        let top = zPos + depth / 2 + depth / 100;
        let verticalSize = Math.abs(top - bottom);
        let left = -xPos + verticalSize * aspectRatio / 2;
        let right = -xPos - verticalSize * aspectRatio / 2;
        cameraFrontView = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    }

    cameraFrontView.up.set(-1, 0, 1);
    let panelFrontView = jsPanel.create({
        id: "panelFrontView",
        theme: "primary",
        contentSize: {
            width: function () {
                return Math.min(widthFrontView, window.innerWidth / 3);
            },
            height: heightFrontView
        },
        position: "left-bottom 0 0",
        headerTitle: "Front View",
        content: function (panel) {
            let container = $(this.content)[0];
            canvasFrontView.width = widthFrontView;
            canvasFrontView.height = heightFrontView;
            cameraFrontView.position.set(0, 0, 0);
            cameraFrontView.lookAt(0, 0, 10);//front view
            container.appendChild(canvasFrontView);
        },
        onwindowresize: true
    });
    let panelTopPos = (window.innerHeight - imagePanelTopPos-34) * 2 / 3;
    $("#panelFrontView").css("top", panelTopPos);
    rendererFrontView = new THREE.WebGLRenderer({
        antialias: true
    });
    rendererFrontView.setPixelRatio(window.devicePixelRatio);
    rendererFrontView.setSize(widthFrontView, heightFrontView);

}

function showSideView(xPos, yPos, zPos, width, height, depth) {
    canvasSideView = document.createElement("canvas");
    const widthSideView = window.innerWidth / 3;
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    const heightSideView = (window.innerHeight - imagePaneHeight - headerHeight - 3 * 34) / 3;
    let aspectRatio = widthSideView / heightSideView;

    if (height > depth) {
        let left = xPos + width / 2 + width / 100;
        let right = xPos - width / 2 - width / 100;
        let lateralSize = Math.abs(right - left);
        let bottom = zPos - lateralSize / (aspectRatio * 2);
        let top = zPos + lateralSize / (aspectRatio * 2);
        cameraSideView = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    } else {
        let bottom = zPos - depth / 2 - depth / 100;
        let top = zPos + depth / 2 + depth / 100;
        let verticalSize = Math.abs(top - bottom);
        let left = xPos + verticalSize * aspectRatio / 2;
        let right = xPos - verticalSize * aspectRatio / 2;
        cameraSideView = new THREE.OrthographicCamera(left, right, bottom, top, 0.0001, 2000);
    }

    cameraSideView.up.set(-1, 0, 1);
    let panelSideView = jsPanel.create({
        id: "panelSideView",
        theme: "primary",
        contentSize: {
            width: function () {
                return Math.min(widthSideView, window.innerWidth / 3);
            },
            height: heightSideView
        },
        position: "left-bottom 0 0",
        headerTitle: "Side View",
        content: function (panel) {
            let container = $(this.content)[0];
            canvasSideView.width = widthSideView;
            canvasSideView.height = heightSideView;
            cameraSideView.position.set(0, 0, 0);
            cameraSideView.lookAt(0, 0, 10);//front view
            container.appendChild(canvasSideView);
        },
        onwindowresize: true
    });
    let panelTopPos = headerHeight + imagePaneHeight;
    $("#panelSideView").css("top", panelTopPos);
    rendererSideView = new THREE.WebGLRenderer({
        antialias: true
    });
    rendererSideView.setPixelRatio(window.devicePixelRatio);
    rendererSideView.setSize(widthSideView, heightSideView);
}

function showSideViews(xPos, yPos, zPos, width, height, depth) {
    showBEV(xPos, yPos, width, height);//width along x axis (lateral), height along y axis (longitudinal)
    // move class picker to right
    showSideView(xPos, yPos, zPos, width, height, depth);
    showFrontView(xPos, yPos, zPos, width, height, depth);
    $("#class-picker").css("left", window.innerWidth / 3 + 10);
}

function init() {
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
    // clock = new THREE.Clock();
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

    let canvas3D = document.getElementById('canvas3d');
    // controls.domElement = container;

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x161616);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 3d
    // perspectiveCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    // perspectiveOrbitControls = new THREE.OrbitControls(perspectiveCamera, renderer.domElement);
    // perspectiveOrbitControls.enablePan = true;
    // perspectiveOrbitControls.enableRotate = true;

    // BEV
    // orthographicCamera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0.0001, 2000);
    // orthographicOrbitControls = new THREE.OrbitControls(orthographicCamera, renderer.domElement);
    // orthographicOrbitControls.enablePan = true;
    // orthographicOrbitControls.enableRotate = false;

    setCamera();
    let grid = new THREE.GridHelper(100, 100);
    let posXLidar = labelTool.positionLidarNuscenes[2];
    grid.translateZ(-posXLidar);
    grid.rotateX(Math.PI / 2);
    grid.name = "grid";
    if (showGridFlag === true) {
        grid.visible = true;
    } else {
        grid.visible = false;
    }
    scene.add(grid);

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

        if (ev.target === renderer.domElement) {
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
                clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
                if (ev.button === 0) {
                    clickFlag = true;
                    clickedPoint = clickedObjects[0].point;
                    clickedCube = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];
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
                    scene.add(clickedPlane);
                    clickedPlaneArray.push(clickedPlane);
                }
                else if (ev.button === 2) {
                    // rightclick
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
                    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
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
                    } else {
                        classesBoundingBox.content[label].nextTrackId--;
                    }

                }
            } else {
                labelTool.selectedMesh = undefined;
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
    };


    canvas3D.onmouseup = function (ev) {
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
            let clickedObjects = ray.intersectObjects(clickedPlaneArray);

            // close folders
            for (let i = 0; i < folderBoundingBox3DArray.length; i++) {
                if (folderBoundingBox3DArray[i] !== undefined) {
                    folderBoundingBox3DArray[i].close();
                }
            }

            if (clickedObjects.length > 0 && clickedObjectIndex !== -1) {
                // one object was selected
                for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                    let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                    meshObject.material.opacity = 0.4;
                }
                labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].material.opacity = 0.8;
                // open folder of selected object
                annotationObjects.localOnSelect["PCD"](clickedObjectIndex);
                // set selected object
                labelTool.selectedMesh = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];
                if (transformControls.position !== undefined) {
                    transformControls.detach();
                    transformControls.attach(labelTool.selectedMesh);
                }

                // if in birdseyeview then find minimum of longitude and latitude
                // otherwise find minimum of x, y and z
                let smallestSide;
                if (birdsEyeViewFlag === true) {
                    smallestSide = Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y);
                } else {
                    smallestSide = Math.min(Math.min(labelTool.selectedMesh.scale.x, labelTool.selectedMesh.scale.y), labelTool.selectedMesh.scale.z);
                }
                let size = smallestSide / 2.0;
                console.log("size controls mouseup: " + size);
                transformControls.size = size;
                // add transform controls to scene
                scene.add(transformControls);

                // open folder of selected object
                for (let channelIdx in labelTool.camChannels) {
                    if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                        let camChannel = labelTool.camChannels[channelIdx].channel;
                        annotationObjects.select(clickedObjectIndex, camChannel);
                    }
                }
                let obj = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex];
                showSideViews(obj["x"], obj["y"], obj["z"], obj["width"], obj["height"], obj["depth"]);

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
                    meshObject.material.opacity = 0.4;
                }

                // remove arrows (transform controls)
                if (transformControls !== undefined) {
                    transformControls.detach();
                }
                labelTool.removeObject("transformControls");
                labelTool.selectedMesh = undefined;
                annotationObjects.selectEmpty();
                // disable interpolate button
                interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "none";
                interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.2;

                $("#panelBev").remove();
                // move class picker to left
                $("#class-picker").css("left", 10);

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
                if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                    if (annotationObjects.__selectionIndex === -1) {
                        // no object selected in 3d scene (new object was created)-> use selected class from class menu
                        trackId = classesBoundingBox.content[classesBoundingBox.targetName()].nextTrackId;
                        //trackId = getNextTrackId(classesBoundingBox.targetName(), labelTool.datasets.NuScenes);
                        insertIndex = annotationObjects.__insertIndex;
                    } else {
                        // object was selected in 3d scene
                        trackId = annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndex]["trackId"];
                        insertIndex = annotationObjects.__selectionIndex;
                    }
                } else {
                    if (annotationObjects.__selectionIndex === -1) {
                        trackId = classesBoundingBox[classesBoundingBox.targetName()].nextTrackId;
                        //trackId = getNextTrackId(classesBoundingBox.targetName(), labelTool.datasets.LISA_T);
                        insertIndex = annotationObjects.__insertIndex;
                    } else {
                        trackId = annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndex]["trackId"];
                        insertIndex = annotationObjects.__selectionIndex;
                    }
                }

                // set channel based on 3d position of new bonding box
                if (Math.abs(groundPointMouseUp.x - groundPointMouseDown.x) > 0.1) {
                    let xPos = (groundPointMouseUp.x + groundPointMouseDown.x) / 2;
                    let yPos = (groundPointMouseUp.y + groundPointMouseDown.y) / 2;
                    //let zPos = -100 / 100; // height of lidar sensor. Use it to put object on street
                    let zPos = -60.7137000000000 / 100;
                    let addBboxParameters = {
                        class: classesBoundingBox.targetName(),
                        x: xPos,
                        y: yPos,
                        z: zPos,
                        width: Math.abs(groundPointMouseUp.x - groundPointMouseDown.x),
                        height: Math.abs(groundPointMouseUp.y - groundPointMouseDown.y),
                        depth: 2.0,
                        rotationY: 0,
                        original: {
                            class: classesBoundingBox.targetName(),
                            x: (groundPointMouseUp.x + groundPointMouseDown.x) / 2,
                            y: (groundPointMouseUp.y + groundPointMouseDown.y) / 2,
                            z: zPos,
                            width: Math.abs(groundPointMouseUp.x - groundPointMouseDown.x),
                            height: Math.abs(groundPointMouseUp.y - groundPointMouseDown.y),
                            depth: 2.0,
                            rotationY: 0,
                            trackId: trackId
                        },
                        interpolationStartFileIndex: -1,
                        interpolationStart: {
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
                        },
                        interpolationEnd: {
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
                        },
                        trackId: trackId,
                        channels: [{
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }, {
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }, {
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }, {
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }, {
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }, {
                            rect: [],
                            projectedPoints: [],
                            lines: [],
                            channel: ''
                        }],
                        fromFile: false
                    };
                    // set channel
                    // let channels = getChannelsByPosition(xPos, -yPos);
                    // for (let i = 0; i < channels.length; i++) {
                    for (let i = 0; i < labelTool.camChannels.length; i++) {
                        let channel = labelTool.camChannels[i].channel;
                        addBboxParameters.channels[i].channel = channel;
                        // working for LISA_T
                        let projectedBoundingBox = calculateProjectedBoundingBox(-xPos, -yPos, -zPos, addBboxParameters.width, addBboxParameters.height, addBboxParameters.depth, channel);
                        // let projectedBoundingBox = calculateProjectedBoundingBox(-xPos, -yPos, zPos, addBboxParameters.width, addBboxParameters.height, addBboxParameters.depth, channel);
                        addBboxParameters.channels[i].projectedPoints = projectedBoundingBox;
                    }
                    // calculate line segments
                    for (let i = 0; i < addBboxParameters.channels.length; i++) {
                        let channelObj = addBboxParameters.channels[i];
                        if (channelObj.channel !== undefined && channelObj.channel !== '') {
                            if (addBboxParameters.channels[i].projectedPoints !== undefined && addBboxParameters.channels[i].projectedPoints.length === 8) {
                                addBboxParameters.channels[i]["lines"] = calculateLineSegments(channelObj, classesBoundingBox.targetName());
                            }
                        }
                    }
                    annotationObjects.set(insertIndex, addBboxParameters);
                    labelTool.selectedMesh = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex];
                    addTransformControls();
                    showSideViews(xPos, yPos, zPos, addBboxParameters["width"], addBboxParameters["height"], addBboxParameters["depth"]);


                    annotationObjects.__insertIndex++;
                    classesBoundingBox.target().nextTrackId++;
                    for (let channelIdx in labelTool.camChannels) {
                        if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                            let camChannel = labelTool.camChannels[channelIdx].channel;
                            annotationObjects.select(insertIndex, camChannel);
                        }
                    }
                    let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
                    interpolationModeCheckbox.parentElement.parentElement.style.opacity = 1.0;
                    interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "all";
                    $(interpolationModeCheckbox.firstChild).removeAttr("tabIndex");

                }

                // else if (cFlag == true) {
                //     var addBboxParameters = {
                //         class: classesBoundingBox.targetName(),
                //         x_img: -1,
                //         y_img: -1,
                //         width_img: -1,
                //         height_img: -1,
                //         x: (groundUpPoint.x + groundPointMouseDown.x) / 2,
                //         y: -(groundUpPoint.y + groundPointMouseDown.y) / 2,
                //         z: copyBbox.z,
                //         width: copyBbox.width,
                //         height: copyBbox.height,
                //         depth: copyBbox.depth,
                //         yaw: copyBbox.yaw,
                //         org: {
                //             x: (groundUpPoint.x + groundPointMouseDown.x) / 2,
                //             y: -(groundUpPoint.y + groundPointMouseDown.y) / 2,
                //             z: copyBbox.z,
                //             width: copyBbox.width,
                //             height: copyBbox.height,
                //             depth: copyBbox.depth,
                //             yaw: copyBbox.yaw,
                //         },
                //         trackId: trackId,
                //         fromFile: false
                //     };
                //     annotationObjects.selectEmpty();
                //     var selectionIndex = annotationObjects.getSelectionIndex();
                //     if (selectionIndex !== -1) {
                //         // a bounding box was already selected (either in camera or birds eye view)
                //         // replace the bounding box in birds eye view with the new one
                //         annotationObjects.set(selectionIndex, addBboxParameters);
                //         // select that new bounding box
                //         var channels = getChannelsByPosition(annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["x"], annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["y"]);
                //         for (var channel in channels) {
                //             var camChannel = channels[channel];
                //             annotationObjects.select(selectionIndex, camChannel);
                //         }
                //     } else {
                //         // no object was selected
                //         // add a new entry
                //         var insertIndex = annotationObjects.__insertIndex;
                //         annotationObjects.set(insertIndex, addBboxParameters);
                //         // select last placed bounding box
                //         var channels = getChannelsByPosition(annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["x"], annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["y"]);
                //         for (var channel in channels) {
                //             var camChannel = channels[channel];
                //             annotationObjects.select(insertIndex, camChannel);
                //         }
                //     }
                // }

                groundPlaneArray = [];
                $("#label-tool-log").val("4. Choose class from drop down list");
                $("#label-tool-log").css("color", "#969696");
            }

        }
    };

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
        guiOptions.add(parameters, 'datasets', ['NuScenes', 'LISA_T']).name("Choose dataset")
            .onChange(function (value) {
                changeDataset(value);
                let allCheckboxes = $(":checkbox");
                let checkbox = allCheckboxes[0];
                if (value === labelTool.datasets.LISA_T) {
                    // disable checkbox to show original nuscenes labels
                    checkbox.disabled = true;
                    // $(checkbox).attr("disabled", true);
                    // $("#show-nuscenes-labels").disabled = true;
                } else {
                    checkbox.disabled = false;
                    // $(checkbox).attr("disabled", false);
                    // $("#show-nuscenes-labels").disabled = false;
                }
            });


        let showOriginalNuScenesLabelsCheckbox = guiOptions.add(parameters, 'show_nuscenes_labels').name('NuScenes Labels').listen();
        // showOriginalNuScenesLabelsCheckbox.domElement.id = "show-nuscenes-labels";
        // showOriginalNuScenesLabelsCheckbox.domElement.previousSibling.disabled = true;
        showOriginalNuScenesLabelsCheckbox.onChange(function (value) {
            labelTool.showOriginalNuScenesLabels = value;
            if (labelTool.showOriginalNuScenesLabels === true) {
                labelTool.reset();
                labelTool.start();
            } else {
                // TODO:
                labelTool.reset();
                labelTool.start();
            }
        });
        let allCheckboxes = $(":checkbox");
        let showNuScenesLabelsCheckbox = allCheckboxes[0];
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            showNuScenesLabelsCheckbox.disabled = true;
            showNuScenesLabelsCheckbox.style.pointerEvents = "none";
        } else {
            showNuScenesLabelsCheckbox.disabled = false;
            showNuScenesLabelsCheckbox.style.pointerEvents = "all";
        }

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
            let grid = scene.getObjectByName("grid");
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
        let interpolationModeCheckbox = guiOptions.add(parameters, 'interpolation_mode').name('Interpolation Mode').listen();
        interpolationModeCheckbox.domElement.id = 'interpolation-checkbox';
        interpolationModeCheckbox.domElement.parentElement.parentElement.style.opacity = 0.2;
        interpolationModeCheckbox.domElement.parentElement.parentElement.style.pointerEvents = "none";
        interpolationModeCheckbox.domElement.firstChild.setAttribute("tabIndex", "-1");
        interpolationModeCheckbox.onChange(function (value) {
            interpolationMode = value;
            if (interpolationMode === true) {

                interpolationObjIndex = annotationObjects.getSelectionIndex();
                if (interpolationObjIndex !== -1) {
                    // change text
                    folderPositionArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Interpolation Start Position";
                    folderSizeArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Interpolation Start Size";
                    // set start index
                    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex]["interpolationStartFileIndex"] = labelTool.currentFileIndex;
                    // set interpolation start position
                    let obj = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndex];
                    obj["interpolationStart"]["position"]["x"] = obj["x"];
                    obj["interpolationStart"]["position"]["y"] = obj["y"];
                    obj["interpolationStart"]["position"]["z"] = obj["z"];
                    obj["interpolationStart"]["position"]["rotationY"] = obj["rotationY"];
                    obj["interpolationStart"]["size"]["width"] = obj["width"];
                    obj["interpolationStart"]["size"]["height"] = obj["height"];
                    obj["interpolationStart"]["size"]["depth"] = obj["depth"];
                    interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "all";
                    interpolateBtn.domElement.parentElement.parentElement.style.opacity = 1.0;
                    disableStartPositionAndSize();
                }

            } else {

                interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "none";
                interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.2;
                if (interpolationObjIndex !== -1) {
                    folderPositionArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Position";
                    folderSizeArray[interpolationObjIndex].domElement.firstChild.firstChild.innerText = "Size";
                    enableStartPositionAndSize();
                    // remove end position and end size
                    folderBoundingBox3DArray[interpolationObjIndex].removeFolder("Interpolation End Position");
                    folderBoundingBox3DArray[interpolationObjIndex].removeFolder("Interpolation End Size");
                }
            }
        });
        interpolateBtn = guiOptions.add(parameters, 'interpolate').name("Interpolate");
        interpolateBtn.domElement.id = 'interpolate-btn';
        interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.2;
        interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "none";
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


    $('#bounding-box-3d-menu').css('width', '290px');
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

}
