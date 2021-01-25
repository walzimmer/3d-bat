let canvasBEV;
let canvasSideView;
let canvasFrontView;
let views;
let grid;

let operationStack = [];

let perspectiveCamera;
let currentCamera;

let cameraBEV;
let cameraSideView;
let cameraFrontView;

let currentOrbitControls;
let pointerLockControls;
let pointerLockObject;
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
let moveUp = false;
let moveDown = false;
let rotateLeft = false;
let rotateRight = false;
let rotateUp = false;
let rotateDown = false;
let headerHeight = 0;
let translationVelocity = new THREE.Vector3();
let rotationVelocity = new THREE.Vector3();
let translationDirection = new THREE.Vector3();
let rotationDirection = new THREE.Vector3();
let prevTime = performance.now();

let cube;
let interpolationObjIndexCurrentFile = -1;
let interpolationObjIndexNextFile = -1;
let interpolateBtn;
let pointSizeSlider;

let guiAnnotationClasses;
let guiBoundingBoxAnnotationsInitialized = false;
let guiBoundingBoxMenuInitialized = false;
let guiOptions = new dat.GUI({autoPlace: true, width: 350, resizable: false});
let guiOptionsOpened = true;
let numGUIOptions = 17;
let showProjectedPointsFlag = false;
let showGridFlag = false;
let filterGround = false;
let hideOtherAnnotations = false;
let interpolationMode = false;
let showDetections = false;
let folderBoundingBox3DArray = [];
let folderPositionArray = [];
let folderRotationArray = [];
let folderSizeArray = [];
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
let rotWorldMatrix;
let rotObjectMatrix;
let circleArray = [];
let colorMap = [];
let activeColorMap = 'colorMapJet.js';
let currentPoints3D = [];
let currentDistances = [];
let spriteBehindObject;
let pointCloudScanMap = [];
let pointCloudScanNoGroundList = [];
let useTransformControls;
let dragControls = false;
let keyboardNavigation = false;
let canvas3D;
let pointSizeCurrent = 0.05;
let pointSizeMax = 1;
let defaultBoxHeight = 1.468628;
let gridSize = 200;

let parameters = {
    point_size: pointSizeCurrent,
    download_video: function () {
        downloadVideo();
    },
    download: function () {
        download();
    },
    undo: function () {
        undoOperation();
    },
    i: -1,
    views: labelTool.views.orthographic,
    show_projected_points: false,
    show_nuscenes_labels: labelTool.showOriginalNuScenesLabels,
    show_field_of_view: false,
    show_grid: false,
    filter_ground: false,
    hide_other_annotations: hideOtherAnnotations,
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
    show_detections: false,
    interpolation_mode: false,
    interpolate: function () {
        if (interpolationMode === true) {
            interpolate();
        }
    },
    reset_all: function () {
        labelTool.resetBoxes()
    },
    skip_frames: labelTool.skipFrameCount
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

    let rotationYawEnd = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"]);
    let rotationYawStart = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationYaw"]);
    let rotationYawDelta = (rotationYawEnd - rotationYawStart) / numFrames;

    let rotationPitchEnd = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"]);
    let rotationPitchStart = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationPitch"]);
    let rotationPitchDelta = (rotationPitchEnd - rotationPitchStart) / numFrames;

    let rotationRollEnd = Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"]);
    let rotationRollStart = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationRoll"]);
    let rotationRollDelta = (rotationRollEnd - rotationRollStart) / numFrames;

    let widthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"])) / numFrames;
    let lengthDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["length"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["length"])) / numFrames;
    let heightDelta = (Number(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"]) - Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"])) / numFrames;


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

        let newRotationYaw = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationYaw"]) + i * rotationYawDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationYaw"] = newRotationYaw;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["z"] = newRotationYaw;

        let newRotationPitch = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationPitch"]) + i * rotationPitchDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationPitch"] = newRotationPitch;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["x"] = newRotationPitch;

        let newRotationRoll = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationRoll"]) + i * rotationRollDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationRoll"] = newRotationRoll;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["y"] = newRotationRoll;

        let newWidth = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"]) + i * widthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["width"] = newWidth;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["x"] = newWidth;

        let newLength = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["length"]) + i * lengthDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["length"] = newLength;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["y"] = newLength;

        let newHeight = Number(annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"]) + i * heightDelta;
        annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["height"] = newHeight;
        labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["z"] = newHeight;
    }

    // Note: end frame index is the same as current file index
    // start position becomes current end position
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationYaw"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationPitch"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationRoll"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["x"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["x"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["y"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["y"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["z"] = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["z"];
    annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"] = labelTool.currentFileIndex;
    // set current frame to start position and start size
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
    folderRotationArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (labelTool.currentFileIndex + 1) + ")";
    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (labelTool.currentFileIndex + 1) + ")";
    // enable start position and start size
    enableStartPose();
    // remove end position folder and end position size
    folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Position (frame " + (labelTool.previousFileIndex + 1) + ")");
    folderBoundingBox3DArray[interpolationObjIndexCurrentFile].removeFolder("Interpolation End Size (frame " + (labelTool.previousFileIndex + 1) + ")");
    // disable interpolate button
    disableInterpolationBtn();

    labelTool.logger.success("Interpolation successfully!");
}

/**
 * The following operations can be undone:
 *  1. class label
 *  2. track ID
 *  3. delete object -> create it again
 *  4. position
 *  5. scale
 *  6. rotation
 *  7. reset (reset to previous position)
 *  8. add new object -> delete object
 *  9. interpolation (delete all non human annotations)
 *  10. change frame from 1 to 2 (go to prev. frame and remove all objects from frame 2 that were copied from frame 1)
 */
function undoOperation() {
    // get the last operation from the stack which is implemented as a map with key value pairs
    // the value is represented as a json object
    if (operationStack.length === 0) {
        return;
    }
    let lastOperation = operationStack[operationStack.length - 1];
    let lastOperationType = lastOperation["type"];

    // TODO: implement undo operations of all cases
    switch (lastOperationType) {
        case "classLabel":
            let objectIndex = Number(lastOperation["objectIndex"]);
            let previousClassLabel = lastOperation["previousClass"];
            annotationObjects.changeClass(objectIndex, previousClassLabel);
            // select previous class in class picker
            break;
        case "trackId":
            break;
        case "delete":
            break;
        case "position":
            break;
        case "scale":
            break;
        case "rotation":
            break;
        case "reset":
            break;
        case "add":
            break;
        case "interpolation":
            break;
        case "changeFrame":
            break;
    }
    // remove operation from stack
    operationStack.splice(operationStack.length - 1, 1);

    if (operationStack.length === 0) {
        // TODO: disable undo button
    }
}

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

function drawCameraPosition() {
    let camFrontGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    camFrontGeometry.translate(-3.402 / 100, 60.7137 / 100, -10.4301 / 100);
    let material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: false
    });
    let camFrontMesh = new THREE.Mesh(camFrontGeometry, material);
    addObject(camFrontMesh, 'cam-front-object');
    let camFrontRightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: false
    });
    // lat, long, vert
    camFrontRightGeometry.translate(59.35125262 / 100, 41.21713246 / 100, -15.43223025 / 100);
    let camFrontRightMesh = new THREE.Mesh(camFrontRightGeometry, material);
    addObject(camFrontRightMesh, 'cam-front-right-object');
    let camBackRightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
        transparent: false
    });
    camBackRightGeometry.translate(47.93776844 / 100, -90.71772718 / 100, -8.13149812 / 100);
    let camBackRightMesh = new THREE.Mesh(camBackRightGeometry, material);
    addObject(camBackRightMesh, 'cam-back-right-object');
    let camBackGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: false
    });
    camBackGeometry.translate(-4.07865574 / 100, -95.4603164 / 100, -13.38361257 / 100);
    let camBackMesh = new THREE.Mesh(camBackGeometry, material);
    addObject(camBackMesh, 'cam-back-object');
    let camBackLeftGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: false
    });
    camBackLeftGeometry.translate(-75.37243686 / 100, -77.11760848 / 100, -15.77163041 / 100);
    let camBackLeftMesh = new THREE.Mesh(camBackLeftGeometry, material);
    addObject(camBackLeftMesh, 'cam-back-left-object');
    let camFrontLeftGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    material = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
        transparent: false
    });
    camFrontLeftGeometry.translate(-59.9910821 / 100, 50.67448108 / 100, -14.11259497 / 100);
    let camFrontLeftMesh = new THREE.Mesh(camFrontLeftGeometry, material);
    addObject(camFrontLeftMesh, 'cam-front-left-object');
}

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
    if (folderRotationArray[selectionIndex] !== undefined) {
        folderRotationArray[selectionIndex].open();
    }
    if (folderSizeArray[selectionIndex] !== undefined) {
        folderSizeArray[selectionIndex].open();
    }
});


annotationObjects.onChangeClass("PCD", function (index, label) {
    labelTool.cubeArray[labelTool.currentFileIndex][index].material.color.setHex(classesBoundingBox[label].color.replace("#", "0x"));
    // change also color of the bounding box
    labelTool.cubeArray[labelTool.currentFileIndex][index].children[0].material.color.setHex(classesBoundingBox[label].color.replace("#", "0x"));
    annotationObjects.contents[labelTool.currentFileIndex][index]["class"] = label;
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
    let annotationFiles = labelTool.createAnnotationFiles();
    let zip = new JSZip();
    for (let i = 0; i < annotationFiles.length; i++) {
        zip.add(labelTool.fileNames[i] + ".json", annotationFiles[i]);
    }
    let zipContent = zip.generate();
    $($('#bounding-box-3d-menu ul li')[0]).children().first().attr('href', 'data:application/zip;base64,' + zipContent).attr('download', labelTool.currentDataset + "_" + labelTool.sequence + '_annotations.zip');
}

function downloadVideo() {
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        labelTool.takeCanvasScreenshot = true;
        labelTool.changeFrame(0);
        initScreenshotTimer();
    }
}

function hideMasterView() {
    $("#canvasSideView").hide();
    $("#canvasFrontView").hide();
    $("#canvasBev").hide();
}

//change camera position to bird view position
function switchView() {
    birdsEyeViewFlag = !birdsEyeViewFlag;
    if (birdsEyeViewFlag) {
        disablePointSizeSlider();
    } else {
        enablePointSizeSlider();
    }
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
    let classTooltipElement = $("<div class='class-tooltip' id='tooltip-" + className.charAt(0) + trackId + "'>" + trackId + "</div>");
    // Sprite
    const spriteMaterial = new THREE.SpriteMaterial({
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(bbox.x + bbox.width / 2, bbox.y + bbox.length / 2, bbox.z + bbox.height / 2);
    sprite.scale.set(1, 1, 1);
    sprite.name = "sprite-" + className.charAt(0) + trackId;

    // add tooltip only to DOM if fileIndex is equal to current file index
    if (fileIndex === labelTool.currentFileIndex) {
        $("body").append(classTooltipElement);
        scene.add(sprite);
    }
    labelTool.spriteArray[fileIndex].push(sprite);
}

function get3DLabel(parameters) {
    let bbox = parameters;
    let cubeGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);//width, length, height
    let color;
    if (parameters.fromFile === true) {
        color = classesBoundingBox[parameters.class].color;
    } else {
        color = classesBoundingBox.getCurrentAnnotationClassObject().color;
    }

    let cubeMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });

    let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(bbox.x, bbox.y, bbox.z);
    cubeMesh.scale.set(bbox.width, bbox.length, bbox.height);
    cubeMesh.rotation.z = bbox.rotationYaw;
    cubeMesh.rotation.x = bbox.rotationPitch;
    cubeMesh.rotation.y = bbox.rotationRoll;
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

function update2DBoundingBox(fileIndex, objectIndex, isSelected) {
    let className = annotationObjects.contents[fileIndex][objectIndex].class;
    for (let channelObject in annotationObjects.contents[fileIndex][objectIndex].channels) {
        if (annotationObjects.contents[fileIndex][objectIndex].channels.hasOwnProperty(channelObject)) {
            let channelObj = annotationObjects.contents[fileIndex][objectIndex].channels[channelObject];
            if (channelObj.channel !== '') {
                let x = annotationObjects.contents[fileIndex][objectIndex]["x"];
                let y = annotationObjects.contents[fileIndex][objectIndex]["y"];
                let z = annotationObjects.contents[fileIndex][objectIndex]["z"];
                let width = annotationObjects.contents[fileIndex][objectIndex]["width"];
                let length = annotationObjects.contents[fileIndex][objectIndex]["length"];
                let height = annotationObjects.contents[fileIndex][objectIndex]["height"];
                let rotationYaw = annotationObjects.contents[fileIndex][objectIndex]["rotationYaw"];
                let rotationPitch = annotationObjects.contents[fileIndex][objectIndex]["rotationPitch"];
                let rotationRoll = annotationObjects.contents[fileIndex][objectIndex]["rotationRoll"];
                let channel = channelObj.channel;
                channelObj.projectedPoints = calculateProjectedBoundingBox(x, y, z, width, length, height, channel, rotationYaw, rotationPitch, rotationRoll);
                // remove previous drawn lines of all 6 channels
                for (let lineObj in channelObj.lines) {
                    if (channelObj.lines.hasOwnProperty(lineObj)) {
                        let line = channelObj.lines[lineObj];
                        if (line !== undefined) {
                            line.remove();
                        }
                    }
                }
                if (channelObj.projectedPoints !== undefined && channelObj.projectedPoints.length === 8) {
                    let horizontal = width > height;
                    channelObj.lines = calculateAndDrawLineSegments(channelObj, className, horizontal, isSelected);
                }
            }
        }
    }
}

function updateXPos(newFileIndex, value) {
    labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.x = value;
    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = value;
    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["x"] = value;
    if (labelTool.pointCloudOnlyAnnotation === false) {
        // update bounding box
        update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
    }
}

/**
 * calculates the highest available track id for a specific class
 * @param label
 */
function setHighestAvailableTrackId(label) {
    for (let newTrackId = 0; newTrackId <= annotationObjects.contents[labelTool.currentFileIndex].length; newTrackId++) {
        let exist = false;
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            if (label === annotationObjects.contents[labelTool.currentFileIndex][i]["class"] && newTrackId === annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]) {
                exist = true;
                break;
            }
        }
        if (exist === false) {
            // track id was not used yet
            classesBoundingBox[label].nextTrackId = newTrackId;
            break;
        }
        classesBoundingBox[label].nextTrackId = annotationObjects.contents[labelTool.currentFileIndex].length + 1;
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

function deleteObject(bboxClass, trackId, labelIndex) {
    guiOptions.removeFolder(bboxClass + ' ' + trackId);
    // hide 3D bounding box instead of removing it (in case redo button will be pressed)
    if (transformControls !== undefined) {
        transformControls.detach();
    }

    labelTool.removeObject("transformControls");
    // NOTE: already removed in annotationObjects.remove()
    if (labelTool.pointCloudOnlyAnnotation === false) {
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
    }
    annotationObjects.remove(labelIndex);
    folderBoundingBox3DArray.splice(labelIndex, 1);
    folderPositionArray.splice(labelIndex, 1);
    folderRotationArray.splice(labelIndex, 1);
    folderSizeArray.splice(labelIndex, 1);
    annotationObjects.selectEmpty();
    labelTool.spriteArray[labelTool.currentFileIndex].splice(labelIndex, 1);
    labelTool.removeObject("sprite-" + bboxClass.charAt(0) + trackId);
    // NOTE: already removed in annotationObjects.remove()
    // remove sprite from DOM tree
    $("#tooltip-" + bboxClass.charAt(0) + trackId).remove();
    labelTool.selectedMesh = undefined;

    setHighestAvailableTrackId(bboxClass);
    // if last object in current frame was deleted than disable interpolation mode
    if (annotationObjects.contents[labelTool.currentFileIndex].length === 0) {
        interpolationMode = false;
        $("#interpolation-checkbox").children().first().prop("checked", false);
        $("#interpolation-checkbox").children().first().removeAttr("checked");
    }
    //rename all ids following after insertIndexof
    // e.g. rename copy-label-to-next-frame-checkbox-1 to copy-label-to-next-frame-checkbox-0 if deleting first element
    let copyIdList = document.querySelectorAll('[id^="copy-label-to-next-frame-checkbox-"]'); // e.g. 0,1
    for (let i = labelIndex; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        let idToChange = copyIdList[i].id;
        let elem = document.getElementById(idToChange);
        elem.id = "copy-label-to-next-frame-checkbox-" + (i);
    }
    // hide master view
    $("#canvasBev").hide();
    $("#canvasSideView").hide();
    $("#canvasFrontView").hide();
    // move class picker to left
    $("#class-picker").css("left", 10);
    annotationObjects.__selectionIndexCurrentFrame = -1;
}

//register new bounding box
function addBoundingBoxGui(bbox, bboxEndParams) {
    let insertIndex = folderBoundingBox3DArray.length;
    let bb;
    if (guiOptions.__folders[bbox.class + ' ' + bbox.trackId] === undefined) {
        bb = guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
    } else {
        bb = guiOptions.__folders[bbox.class + ' ' + bbox.trackId];
    }

    folderBoundingBox3DArray.push(bb);

    let minXPos = -150;
    let maxXPos = 150;
    let minYPos = -150;
    let maxYPos = 150;

    let minZPos;
    let maxZPos;

    if (labelTool.currentDataset === labelTool.datasets.providentia) {
        minZPos = -7;
        maxZPos = -1;
    } else {
        minZPos = -3;
        maxZPos = 3;
    }


    let folderPosition = folderBoundingBox3DArray[insertIndex].addFolder('Position');
    let cubeX = folderPosition.add(bbox, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
    let cubeY = folderPosition.add(bbox, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
    let cubeZ = folderPosition.add(bbox, 'z').name("z").min(minZPos).max(maxZPos).step(0.01).listen();
    folderPosition.close();
    folderPositionArray.push(folderPosition);

    let folderRotation = folderBoundingBox3DArray[insertIndex].addFolder('Rotation');
    let cubeYaw = folderRotation.add(bbox, 'rotationYaw').name("rotationYaw").min(-Math.PI).max(Math.PI).step(0.01).listen();
    let cubePitch = folderRotation.add(bbox, 'rotationPitch').name("rotationPitch").min(-Math.PI).max(Math.PI).step(0.01).listen();
    let cubeRoll = folderRotation.add(bbox, 'rotationRoll').name("rotationRoll").min(-Math.PI).max(Math.PI).step(0.01).listen();
    folderRotation.close();
    folderRotationArray.push(folderRotation);

    let folderSize = folderBoundingBox3DArray[insertIndex].addFolder('Size');
    let cubeWidth = folderSize.add(bbox, 'width').name("width").min(0.3).max(20).step(0.01).listen();
    let cubeLength = folderSize.add(bbox, 'length').name("length").min(0.3).max(20).step(0.01).listen();
    let cubeHeight = folderSize.add(bbox, 'height').name("height").min(0.3).max(20).step(0.01).listen();
    folderSize.close();
    folderSizeArray.push(folderSize);

    cubeX.onChange(function (value) {
        if (value >= minXPos && value < maxXPos) {
            // Note: Do not use insertIndex because it might change (if deleting e.g. an object in between)
            // use track id and class to calculate selection index
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].position.x = value;
            annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["x"] = value;
            if (labelTool.pointCloudOnlyAnnotation === false) {
                // update bounding box
                update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
            }
        }
    });
    cubeY.onChange(function (value) {
        if (value >= minYPos && value < maxYPos) {
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].position.y = value;
            annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["y"] = value;
            if (labelTool.pointCloudOnlyAnnotation === false) {
                // update bounding box
                update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
            }
        }
    });
    cubeZ.onChange(function (value) {
        if (value >= minZPos && value < maxZPos) {
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].position.z = value;
            annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["z"] = value;
            if (labelTool.pointCloudOnlyAnnotation === false) {
                // update bounding box
                update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
            }
        }
    });
    cubeYaw.onChange(function (value) {
        let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
        labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].rotation.z = value;
        annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["rotationYaw"] = value;
        if (labelTool.pointCloudOnlyAnnotation === false) {
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
        }
    });
    cubePitch.onChange(function (value) {
        let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
        labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].rotation.x = value;
        annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["rotationPitch"] = value;
        if (labelTool.pointCloudOnlyAnnotation === false) {
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
        }
    });
    cubeRoll.onChange(function (value) {
        let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
        labelTool.cubeArray[labelTool.currentFileIndex][selectionIndex].rotation.y = value;
        annotationObjects.contents[labelTool.currentFileIndex][selectionIndex]["rotationRoll"] = value;
        if (labelTool.pointCloudOnlyAnnotation === false) {
            // update bounding box
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
        }
    });
    cubeWidth.onChange(function (value) {
        for (let i = 0; i < labelTool.numFrames; i++) {
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, i);
            if (selectionIndex !== -1) {
                let newXPos = labelTool.cubeArray[i][selectionIndex].position.x + (value - labelTool.cubeArray[i][selectionIndex].scale.x) * Math.cos(labelTool.cubeArray[i][selectionIndex].rotation.z) / 2;
                labelTool.cubeArray[i][selectionIndex].position.x = newXPos;
                if (i === labelTool.currentFileIndex) {
                    bbox.x = newXPos;
                }
                annotationObjects.contents[i][selectionIndex]["x"] = newXPos;
                let newYPos = labelTool.cubeArray[i][selectionIndex].position.y + (value - labelTool.cubeArray[i][selectionIndex].scale.x) * Math.sin(labelTool.cubeArray[i][selectionIndex].rotation.z) / 2;
                labelTool.cubeArray[i][selectionIndex].position.y = newYPos;
                if (i === labelTool.currentFileIndex) {
                    bbox.y = newYPos;
                }
                annotationObjects.contents[i][selectionIndex]["y"] = newYPos;
                labelTool.cubeArray[i][selectionIndex].scale.x = value;
                annotationObjects.contents[i][selectionIndex]["width"] = value;
            }
        }
        if (labelTool.pointCloudOnlyAnnotation === false) {
            let selectionIndexCurrentFrame = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndexCurrentFrame, true);
        }
    });
    cubeLength.onChange(function (value) {
        for (let i = 0; i < labelTool.numFrames; i++) {
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, i);
            if (selectionIndex !== -1) {
                let newXPos = labelTool.cubeArray[i][selectionIndex].position.x + (value - labelTool.cubeArray[i][selectionIndex].scale.y) * Math.sin(labelTool.cubeArray[i][selectionIndex].rotation.z) / 2;
                labelTool.cubeArray[i][selectionIndex].position.x = newXPos;
                bbox.x = newXPos;
                annotationObjects.contents[i][selectionIndex]["x"] = newXPos;
                let newYPos = labelTool.cubeArray[i][selectionIndex].position.y - (value - labelTool.cubeArray[i][selectionIndex].scale.y) * Math.cos(labelTool.cubeArray[i][selectionIndex].rotation.z) / 2;
                labelTool.cubeArray[i][selectionIndex].position.y = newYPos;
                bbox.y = newYPos;
                annotationObjects.contents[i][selectionIndex]["y"] = newYPos;
                labelTool.cubeArray[i][selectionIndex].scale.y = value;
                annotationObjects.contents[i][selectionIndex]["length"] = value;
            }
        }
        if (labelTool.pointCloudOnlyAnnotation === false) {
            let selectionIndexCurrent = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndexCurrent, true);
        }
    });
    cubeHeight.onChange(function (value) {
        for (let i = 0; i < labelTool.numFrames; i++) {
            let selectionIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, i);
            if (selectionIndex !== -1) {
                let newZPos = labelTool.cubeArray[i][selectionIndex].position.z + (value - labelTool.cubeArray[i][selectionIndex].scale.z) / 2;
                labelTool.cubeArray[i][selectionIndex].position.z = newZPos;
                bbox.z = newZPos;
                labelTool.cubeArray[i][selectionIndex].scale.z = value;
                annotationObjects.contents[i][selectionIndex]["height"] = value;
            }
        }
        if (labelTool.pointCloudOnlyAnnotation === false) {
            let selectionIndexCurrent = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            update2DBoundingBox(labelTool.currentFileIndex, selectionIndexCurrent, true);
        }

    });

    if (bboxEndParams !== undefined && interpolationMode === true) {
        //interpolationObjIndexCurrentFile = annotationObjects.getSelectionIndex();
        interpolationObjIndexNextFile = getObjectIndexByTrackIdAndClass(annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["class"], bboxEndParams.newFileIndex);
        // change text
        let interpolationStartFileIndex = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
        folderPositionArray[interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + interpolationStartFileIndex + ")";
        folderRotationArray[interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + interpolationStartFileIndex + ")";
        folderSizeArray[interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + interpolationStartFileIndex + ")";

        if (interpolationStartFileIndex !== bboxEndParams.newFileIndex) {
            disableStartPose();
            // add folders for end position and end size
            labelTool.folderEndPosition = folderBoundingBox3DArray[interpolationObjIndexNextFile].addFolder("Interpolation End Position (frame " + (labelTool.currentFileIndex + 1) + ")");
            let cubeEndX = labelTool.folderEndPosition.add(bboxEndParams, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
            let cubeEndY = labelTool.folderEndPosition.add(bboxEndParams, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
            let cubeEndZ = labelTool.folderEndPosition.add(bboxEndParams, 'z').name("z)").min(minZPos).max(maxZPos).step(0.01).listen();
            let cubeEndYaw = labelTool.folderEndPosition.add(bboxEndParams, 'rotationYaw').name("rotationYaw").min(-Math.PI).max(Math.PI).step(0.01).listen();
            let cubeEndPitch = labelTool.folderEndPosition.add(bboxEndParams, 'rotationPitch').name("rotationPitch").min(-Math.PI).max(Math.PI).step(0.01).listen();
            let cubeEndRoll = labelTool.folderEndPosition.add(bboxEndParams, 'rotationRoll').name("rotationRoll").min(-Math.PI).max(Math.PI).step(0.01).listen();
            labelTool.folderEndPosition.domElement.id = 'interpolation-end-position-folder';
            labelTool.folderEndPosition.open();
            labelTool.folderEndSize = folderBoundingBox3DArray[interpolationObjIndexNextFile].addFolder("Interpolation End Size (frame " + (labelTool.currentFileIndex + 1) + ")");
            let cubeEndWidth = labelTool.folderEndSize.add(bboxEndParams, 'width').name("width").min(0.3).max(20).step(0.01).listen();
            let cubeEndLength = labelTool.folderEndSize.add(bboxEndParams, 'length').name("length").min(0.3).max(20).step(0.01).listen();
            let cubeEndHeight = labelTool.folderEndSize.add(bboxEndParams, 'height').name("height").min(0.3).max(20).step(0.01).listen();
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
                    if (labelTool.pointCloudOnlyAnnotation === false) {
                        // update bounding box
                        update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                    }
                }
            });
            cubeEndZ.onChange(function (value) {
                if (value >= minZPos && value < maxZPos) {
                    labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["z"] = value;
                    annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["z"] = value;
                    if (labelTool.pointCloudOnlyAnnotation === false) {
                        // update bounding box
                        update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                    }
                }
            });
            cubeEndYaw.onChange(function (value) {
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.z = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationYaw"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["rotationYaw"] = value;
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    // update bounding box
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
            });
            cubeEndPitch.onChange(function (value) {
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.x = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationPitch"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["rotationPitch"] = value;
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    // update bounding box
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
            });
            cubeEndRoll.onChange(function (value) {
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].rotation.y = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationRoll"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["rotationRoll"] = value;
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    // update bounding box
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
            });
            cubeEndWidth.onChange(function (value) {
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
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
            });
            cubeEndLength.onChange(function (value) {
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
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["size"]["length"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["length"] = value;
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
            });
            cubeEndHeight.onChange(function (value) {
                let newZPos = labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z + (value - labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.z) / 2;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].position.z = newZPos;
                labelTool.cubeArray[newFileIndex][interpolationObjIndexNextFile].scale.z = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["interpolationEnd"]["size"]["height"] = value;
                annotationObjects.contents[newFileIndex][interpolationObjIndexNextFile]["height"] = value;
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    update2DBoundingBox(labelTool.currentFileIndex, interpolationObjIndexCurrentFile, true);
                }
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
            let labelIndex = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFileIndex);
            deleteObject(bbox.class, bbox.trackId, labelIndex);
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
    reset_bbox.class = reset_bbox.original.class;
    reset_bbox.x = reset_bbox.original.x;
    reset_bbox.y = reset_bbox.original.y;
    reset_bbox.z = reset_bbox.original.z;
    reset_bbox.rotationYaw = reset_bbox.original.rotationYaw;
    reset_bbox.rotationPitch = reset_bbox.original.rotationPitch;
    reset_bbox.rotationRoll = reset_bbox.original.rotationRoll;
    reset_bbox.width = reset_bbox.original.width;
    reset_bbox.length = reset_bbox.original.length;
    reset_bbox.height = reset_bbox.original.height;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.x = reset_bbox.x;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.y = reset_bbox.y;
    labelTool.cubeArray[labelTool.currentFileIndex][index].position.z = reset_bbox.z;
    labelTool.cubeArray[labelTool.currentFileIndex][index].rotation.z = reset_bbox.rotationYaw;
    labelTool.cubeArray[labelTool.currentFileIndex][index].rotation.x = reset_bbox.rotationPitch;
    labelTool.cubeArray[labelTool.currentFileIndex][index].rotation.y = reset_bbox.rotationRoll;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.x = reset_bbox.width;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.y = reset_bbox.length;
    labelTool.cubeArray[labelTool.currentFileIndex][index].scale.z = reset_bbox.height;
    // TODO: redraw in 3D and 2D to change color

}

//change window size
function onWindowResize() {
    // update height and top position of helper views
    let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let newHeight = Math.round((window.innerHeight - headerHeight - imagePanelHeight) / 3.0);
    $("#canvasSideView").css("height", newHeight);
    $("#canvasSideView").css("top", headerHeight + imagePanelHeight);
    console.log("window resize: top: " + headerHeight + imagePanelHeight);
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
        let uniqueId = annotationObjects.contents[labelTool.currentFileIndex][i]["class"].toLowerCase().charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"];
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
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["height"] = labelTool.selectedMesh.scale.z;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["rotationYaw"] = labelTool.selectedMesh.rotation.z;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["rotationPitch"] = labelTool.selectedMesh.rotation.x;
    annotationObjects.contents[labelTool.currentFileIndex][objectIndexByTrackId]["rotationRoll"] = labelTool.selectedMesh.rotation.y;
    // update cube array
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["x"] = labelTool.selectedMesh.position.x;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["y"] = labelTool.selectedMesh.position.y;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["z"] = labelTool.selectedMesh.position.z;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["width"] = labelTool.selectedMesh.scale.x;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["length"] = labelTool.selectedMesh.scale.y;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["height"] = labelTool.selectedMesh.scale.z;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["rotationYaw"] = labelTool.selectedMesh.rotation.z;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["rotationPitch"] = labelTool.selectedMesh.rotation.x;
    labelTool.cubeArray[labelTool.currentFileIndex][objectIndexByTrackId]["rotationRoll"] = labelTool.selectedMesh.rotation.y;

    if (interpolationMode === true && labelTool.selectedMesh !== undefined) {
        // let selectionIndex = annotationObjects.getSelectionIndex();
        let interpolationStartFileIndex = annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
        if (interpolationStartFileIndex !== labelTool.currentFileIndex) {
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"] = labelTool.selectedMesh.position.x;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"] = labelTool.selectedMesh.position.y;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"] = labelTool.selectedMesh.position.z;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"] = labelTool.selectedMesh.rotation.z;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"] = labelTool.selectedMesh.rotation.x;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"] = labelTool.selectedMesh.rotation.y;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"] = labelTool.selectedMesh.scale.x;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["length"] = labelTool.selectedMesh.scale.y;
            annotationObjects.contents[labelTool.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"] = labelTool.selectedMesh.scale.z;
        }
    }
}

function onChangeHandler(event) {
    useTransformControls = true;
    // update 2d bounding box
    if (labelTool.pointCloudOnlyAnnotation === false) {
        if (dragControls === true) {
            if (labelTool.selectedMesh !== undefined) {
                updateObjectPosition();
                let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
                update2DBoundingBox(labelTool.currentFileIndex, objectIndexByTrackId, true);
                render();
            }
        }
    }
    render();
}

function onDraggingChangedHandler(event) {
    useTransformControls = true;
    dragControls = true;
    // update 2d bounding box
    if (labelTool.selectedMesh !== undefined) {
        updateObjectPosition();
        if (labelTool.pointCloudOnlyAnnotation === false) {
            let objectIndexByTrackId = getObjectIndexByName(labelTool.selectedMesh.name);
            update2DBoundingBox(labelTool.currentFileIndex, objectIndexByTrackId, true);
        }
        render();
    }
    // executed after drag finished
    // TODO: scale only on one side
    if (transformControls.getMode() === "scale") {
        // labelTool.selectedMesh.translateY(labelTool.selectedMesh.geometry.parameters.height / 2)
    }
}

function addTransformControls() {
    if (transformControls === undefined) {
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
    if (labelTool.selectedMesh !== undefined) {
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
            case 187:
            case 107: // +, =, num+
                transformControls.setSize(Math.min(transformControls.size + 0.1, 10));
                break;
            case 189:
            case 109: // -, _, num-
                transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1));
                break;
        }
    }

    switch (event.keyCode) {
        case 67: // C
            switchView();
            break;
        case 75: //K
            toggleKeyboardNavigation();
            break;
        case 32: // Spacebar
            // play video sequence from current frame on to end
            labelTool.playSequence = !labelTool.playSequence;
            if (labelTool.playSequence === true) {
                initPlayTimer();
            }
            break;
        case 78:// N
            // next frame
            labelTool.nextFrame();
            break;
        case 80:// P
            // previous frame
            labelTool.previousFrame();
            break;
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

function setPerspectiveView() {
    // 3D mode (perspective mode)
    currentCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    // currentCamera = perspectiveCamera;
    if (transformControls !== undefined) {
        if (labelTool.selectedMesh !== undefined) {
            addTransformControls();
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
}

function setOrthographicView() {
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
}

//set camera type
function setCamera() {
    if (birdsEyeViewFlag === false) {
        setPerspectiveView();
    } else {
        setOrthographicView();
    }
    if (keyboardNavigation === false) {
        currentOrbitControls.update();
    }

}

function render() {
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
        const cubePosition = new THREE.Vector3(cubeObj.position.x, cubeObj.position.y, cubeObj.position.z + cubeObj.scale.z / 2);
        const canvas = renderer.domElement;
        cubePosition.project(currentCamera);
        cubePosition.x = Math.round((0.5 + cubePosition.x / 2) * (canvas.width));
        cubePosition.y = Math.round((0.5 - cubePosition.y / 2) * (canvas.height));
        if (annotationObj.trackId !== undefined) {
            let classTooltip = $("#tooltip-" + annotationObj.class.charAt(0) + annotationObj.trackId)[0];
            if (classTooltip !== undefined) {
                let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                classTooltip.style.top = `${cubePosition.y + headerHeight + imagePaneHeight - 21}px`;
                classTooltip.style.left = `${cubePosition.x}px`;
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

    // find intersections
    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    let vector = new THREE.Vector3(mousePos.x, mousePos.y, 1);
    vector.unproject(currentCamera);
    let ray = new THREE.Raycaster(currentCamera.position, vector.sub(currentCamera.position).normalize());
    let intersects = ray.intersectObjects(scene.children);

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
}

//draw animation
function animate() {
    requestAnimationFrame(animate);

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


function calculateProjectedBoundingBox(xPos, yPos, zPos, width, length, height, channel, rotationYaw, rotationPitch, rotationRoll) {
    // TODO: incorporate yaw, pitch and roll before projecting the 3D points into image plane
    let idx = getChannelIndexByName(channel);
    // TODO: calculate scaling factor dynamically (based on top position of slider)
    let imageScalingFactor;
    let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        imageScalingFactor = 900 / imagePanelHeight;//5
        xPos = xPos + labelTool.translationVectorLidarToCamFront[1];//lat
        yPos = yPos + labelTool.translationVectorLidarToCamFront[0];//long
        zPos = zPos + labelTool.translationVectorLidarToCamFront[2];//vertical
    }
    let cornerPoints = [];

    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - length / 2, zPos + height / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - length / 2, zPos + height / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + length / 2, zPos + height / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + length / 2, zPos + height / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - length / 2, zPos - height / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - length / 2, zPos - height / 2));
        cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + length / 2, zPos - height / 2));
        cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + length / 2, zPos - height / 2));
    }


    let projectedPoints = [];
    for (let cornerPoint in cornerPoints) {
        let point = cornerPoints[cornerPoint];
        let point3D = [point.x, point.y, point.z, 1];
        let projectionMatrix;
        let point2D;
        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
            projectionMatrix = labelTool.camChannels[idx].projectionMatrixNuScenes;
            point2D = matrixProduct3x4(projectionMatrix, point3D);
        }

        if (point2D[2] > 0) {
            // add only points that are in front of camera
            let windowX = point2D[0] / point2D[2];
            let windowY = point2D[1] / point2D[2];
            projectedPoints.push(new THREE.Vector2(windowX / imageScalingFactor, windowY / imageScalingFactor));
        } else {
            // do not draw bounding box if it is too close too camera or behind
            return [];
        }

    }
    return projectedPoints;
}

function changeDataset(datasetName) {
    labelTool.reset();
    labelTool.currentDataset = datasetName;
    labelTool.currentDatasetIdx = labelTool.datasetArray.indexOf(datasetName);
    labelTool.sequence = labelTool.dataStructure.datasets[labelTool.datasetArray.indexOf(datasetName)].sequences[0];
    labelTool.classes = labelTool.dataStructure.datasets[labelTool.datasetArray.indexOf(datasetName)].classes;
    labelTool.classColors = labelTool.dataStructure.datasets[labelTool.datasetArray.indexOf(datasetName)].class_colors;
    labelTool.initClasses();
    initGuiBoundingBoxAnnotations();
    // move button to left
    $("#left-btn").css("left", 0);
    // move class picker to left
    $("#class-picker").css("left", 10);
    labelTool.start();
}

function changeSequence(sequence) {
    labelTool.sequence = sequence;
    labelTool.reset();
    labelTool.start();
}

function readPointCloud() {
    let rawFile = new XMLHttpRequest();
    try {
        if (labelTool.showOriginalNuScenesLabels === true) {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/pointclouds/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
        } else {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.sequence + '/pointclouds/' + pad(labelTool.currentFileIndex, 6) + '.pcd', false);
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
                        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
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
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        scalingFactor = 900 / imagePanelHeight;
        projectionMatrix = labelTool.camChannels[channelIdx].projectionMatrixNuScenes;
    }

    for (let i = 0; i < points3D.length; i++) {
        let point3D = points3D[i];
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

function showProjectedPoints() {
    let points3D = readPointCloud();
    for (let channelIdx = 0; channelIdx < labelTool.camChannels.length; channelIdx++) {
        let paper = paperArrayAll[labelTool.currentFileIndex][channelIdx];
        let points2D = projectPoints(points3D, channelIdx);
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
        rawFile.open("GET", 'assets/colormaps/' + activeColorMap, false);
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
    // update the mouse variable
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function disableStartPose() {
    // disable slider
    folderPositionArray[interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
    folderPositionArray[interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
    folderRotationArray[interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
    folderRotationArray[interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
    folderSizeArray[interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
    folderSizeArray[interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
}

function enableStartPose() {
    // disable slider
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
    folderPositionArray[interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
    folderRotationArray[interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
    folderRotationArray[interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
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

function updateBEV(xPos, yPos, zPos) {
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
    hBev = (window.innerHeight - imagePaneHeight - headerHeight) / 3;
    canvasBEV.height = hBev;
    $("body").append(canvasBEV);
    $("#canvasBev").css("top", headerHeight + imagePaneHeight + 2 * hBev);

    cameraBEV = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraBEV.up = new THREE.Vector3(0, 0, -1);
    cameraBEV.lookAt(new THREE.Vector3(0, -1, 0));
    scene.add(cameraBEV);
}

function showBEV(xPos, yPos, zPos) {
    if ($("#canvasBev").length === 0) {
        initBev();
    }
    updateBEV(xPos, yPos, zPos);
    $("#canvasBev").show();
}

function initFrontView() {
    canvasFrontView = document.createElement("canvas");
    canvasFrontView.id = "canvasFrontView";
    let widthFrontView = window.innerWidth / 3;
    canvasFrontView.width = widthFrontView;
    let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let heightFrontView;
    heightFrontView = (window.innerHeight - imagePanelTopPos - headerHeight) / 3;
    canvasFrontView.height = heightFrontView;

    $("body").append(canvasFrontView);
    $("#canvasFrontView").css("top", headerHeight + imagePanelTopPos + heightFrontView);
    cameraFrontView = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraFrontView.lookAt(new THREE.Vector3(0, 0, -1));
    scene.add(cameraFrontView);
}

function updateFrontView() {
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

function showFrontView() {
    if ($("#canvasFrontView").length === 0) {
        initFrontView();
    }
    updateFrontView();
    $("#canvasFrontView").show();
}

function initSideView() {
    canvasSideView = document.createElement("canvas");
    canvasSideView.id = "canvasSideView";
    let widthSideView = window.innerWidth / 3;
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let heightSideView;
    heightSideView = (window.innerHeight - imagePaneHeight - headerHeight) / 3;
    canvasSideView.width = widthSideView;
    canvasSideView.height = heightSideView;
    $("body").append(canvasSideView);
    $("#canvasSideView").css({top: imagePaneHeight + headerHeight + 'px'});

    cameraSideView = new THREE.OrthographicCamera(window.innerWidth / -4, window.innerWidth / 4, window.innerHeight / 4, window.innerHeight / -4, -5000, 10000);
    cameraSideView.lookAt(new THREE.Vector3(1, 0, 0));

    // TODO: let user move bounding box also in helper views (master view)
    scene.add(cameraSideView);
}

function updateSideView() {
    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let panelTopPos = headerHeight + imagePaneHeight;
    canvasSideView.left = "0px";
    canvasSideView.top = panelTopPos;
}

function showSideView() {
    if ($("#canvasSideView").length === 0) {
        initSideView();
    }
    updateSideView();
    $("#canvasSideView").show();

}

function showHelperViews(xPos, yPos, zPos) {
    showSideView();
    showFrontView();
    showBEV(xPos, yPos, zPos);//width along x axis (lateral), height along y axis (longitudinal)
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
    $(interpolateBtn.domElement.firstChild).removeAttr("tabIndex");
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
            // open folder of selected object
            annotationObjects.localOnSelect["PCD"](clickedObjectIndex);
            // set selected object

            labelTool.selectedMesh = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];
            if (labelTool.selectedMesh !== undefined) {
                for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                    $("#tooltip-" + annotationObjects.contents[labelTool.currentFileIndex][i]["class"].charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]).show();
                }
                $("#tooltip-" + annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["class"].charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["trackId"]).hide();
                addTransformControls();

                if (transformControls.position !== undefined) {
                    transformControls.detach();
                    transformControls.attach(labelTool.selectedMesh);
                }

                transformControls.size = 2;
            } else {
                labelTool.removeObject("transformControls");
            }

            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let camChannel = labelTool.camChannels[channelIdx].channel;
                    annotationObjects.select(clickedObjectIndex, camChannel);
                }
            }

            if (labelTool.pointCloudOnlyAnnotation === false) {
                // uncolor previous selected object in image view
                if (clickedObjectIndexPrevious !== -1) {
                    update2DBoundingBox(labelTool.currentFileIndex, clickedObjectIndexPrevious, false);
                }
                // select object in cam images
                update2DBoundingBox(labelTool.currentFileIndex, clickedObjectIndex, true);
            }

            // move button to right
            $("#left-btn").css("left", window.innerWidth / 3);

            let obj = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex];
            showHelperViews(obj["x"], obj["y"], obj["z"]);

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
                    obj["interpolationStart"]["position"]["rotationYaw"] = obj["rotationYaw"];
                    obj["interpolationStart"]["position"]["rotationPitch"] = obj["rotationPitch"];
                    obj["interpolationStart"]["position"]["rotationRoll"] = obj["rotationRoll"];
                    obj["interpolationStart"]["size"]["width"] = obj["width"];
                    obj["interpolationStart"]["size"]["length"] = obj["length"];
                    obj["interpolationStart"]["size"]["height"] = obj["height"];
                    obj["interpolationStartFileIndex"] = labelTool.currentFileIndex;

                    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
                    folderRotationArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (labelTool.currentFileIndex + 1) + ")";
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
                                rotationYaw: 0,
                                rotationPitch: 0,
                                rotationRoll: 0
                            },
                            size: {
                                width: -1,
                                length: -1,
                                height: -1
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
            classesBoundingBox.currentClass = obj["class"];


        } else {
            if (labelTool.pointCloudOnlyAnnotation === false) {
                // remove selection in camera view if 2d label exist
                for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                    if (annotationObjects.contents[labelTool.currentFileIndex][i]["rect"] !== undefined) {
                        // removeBoundingBoxHighlight(i);
                        removeTextBox(i);
                    }
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

            // move button to left
            $("#left-btn").css("left", 0);

        }

        if (clickFlag === true) {
            clickedPlaneArray = [];
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let camChannel = labelTool.camChannels[channelIdx].channel;
                    annotationObjects.select(clickedObjectIndex, camChannel);
                }
            }
            clickedObjectIndexPrevious = annotationObjects.__selectionIndexCurrentFrame;
            clickFlag = false;
        } else if (groundPlaneArray.length === 1 && birdsEyeViewFlag === true && useTransformControls === false) {
            let groundUpObject = ray.intersectObjects(groundPlaneArray);
            if (groundUpObject === undefined || groundUpObject[0] === undefined) {
                return;
            }
            let groundPointMouseUp = groundUpObject[0].point;

            let trackId = -1;
            let insertIndex;
            setHighestAvailableTrackId(classesBoundingBox.getCurrentClass());
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                if (annotationObjects.__selectionIndexCurrentFrame === -1) {
                    // no object selected in 3d scene (new object was created)-> use selected class from class menu
                    trackId = classesBoundingBox.content[classesBoundingBox.getCurrentClass()].nextTrackId;
                    insertIndex = annotationObjects.contents[labelTool.currentFileIndex].length;
                } else {
                    // object was selected in 3d scene
                    trackId = annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndexCurrentFrame]["trackId"];
                    insertIndex = annotationObjects.__selectionIndexCurrentFrame;
                    clickedObjectIndexPrevious = annotationObjects.__selectionIndexCurrentFrame;
                }
            } else {
                if (annotationObjects.__selectionIndexCurrentFrame === -1) {
                    trackId = classesBoundingBox[classesBoundingBox.getCurrentClass()].nextTrackId;
                    insertIndex = annotationObjects.contents[labelTool.currentFileIndex].length;
                    clickedObjectIndexPrevious = annotationObjects.__selectionIndexCurrentFrame;
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
                let zPos = 0;

                // average car height in meters (ref: https://www.carfinderservice.com/car-advice/a-careful-look-at-different-sedan-dimensions)
                let addBboxParameters = getDefaultObject();
                addBboxParameters.class = classesBoundingBox.getCurrentClass();
                addBboxParameters.x = xPos;
                addBboxParameters.y = yPos;
                if (labelTool.currentDataset === labelTool.datasets.providentia) {
                    addBboxParameters.z = zPos + defaultBoxHeight / 2 - labelTool.positionLidar[2];
                } else {
                    addBboxParameters.z = zPos + defaultBoxHeight / 2 - labelTool.positionLidarNuscenes[2];
                }
                addBboxParameters.width = Math.abs(groundPointMouseUp.x - groundPointMouseDown.x);
                addBboxParameters.length = Math.abs(groundPointMouseUp.y - groundPointMouseDown.y);
                addBboxParameters.height = defaultBoxHeight;
                addBboxParameters.rotationYaw = 0;
                addBboxParameters.rotationPitch = 0;
                addBboxParameters.rotationRoll = 0;
                addBboxParameters.original = {
                    class: classesBoundingBox.getCurrentClass(),
                    x: (groundPointMouseUp.x + groundPointMouseDown.x) / 2,
                    y: (groundPointMouseUp.y + groundPointMouseDown.y) / 2,
                    z: zPos + defaultBoxHeight / 2 - labelTool.positionLidarNuscenes[2],
                    width: Math.abs(groundPointMouseUp.x - groundPointMouseDown.x),
                    length: Math.abs(groundPointMouseUp.y - groundPointMouseDown.y),
                    height: defaultBoxHeight,
                    rotationYaw: 0,
                    rotationPitch: 0,
                    rotationRoll: 0,
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
                    addBboxParameters["interpolationStart"]["position"]["rotationYaw"] = addBboxParameters["rotationYaw"];
                    addBboxParameters["interpolationStart"]["position"]["rotationPitch"] = addBboxParameters["rotationPitch"];
                    addBboxParameters["interpolationStart"]["position"]["rotationRoll"] = addBboxParameters["rotationRoll"];
                    addBboxParameters["interpolationStart"]["size"]["width"] = addBboxParameters["width"];
                    addBboxParameters["interpolationStart"]["size"]["length"] = addBboxParameters["length"];
                    addBboxParameters["interpolationStart"]["size"]["height"] = addBboxParameters["height"];
                    addBboxParameters["interpolationStartFileIndex"] = labelTool.currentFileIndex;
                }
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    // calculate projected points for each channel
                    for (let i = 0; i < labelTool.camChannels.length; i++) {
                        let channel = labelTool.camChannels[i].channel;
                        let projectedBoundingBox = calculateProjectedBoundingBox(xPos, yPos, addBboxParameters.z, addBboxParameters.width, addBboxParameters.length, addBboxParameters.height, channel, addBboxParameters.rotationYaw, addBboxParameters.rotationPitch, addBboxParameters.rotationRoll);
                        addBboxParameters.channels[i].projectedPoints = projectedBoundingBox;
                    }

                    // calculate 2D line segments
                    for (let i = 0; i < addBboxParameters.channels.length; i++) {
                        let channelObj = addBboxParameters.channels[i];
                        if (channelObj.channel !== undefined && channelObj.channel !== '') {
                            if (addBboxParameters.channels[i].projectedPoints !== undefined && addBboxParameters.channels[i].projectedPoints.length === 8) {
                                let horizontal = addBboxParameters.width > addBboxParameters.length;
                                addBboxParameters.channels[i]["lines"] = calculateAndDrawLineSegments(channelObj, classesBoundingBox.getCurrentClass(), horizontal, true);
                            }
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
                $("#tooltip-" + annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["class"].charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][insertIndex]["trackId"]).hide();
                // move left button to right
                $("#left-btn").css("left", window.innerWidth / 3);
                showHelperViews(xPos, yPos, zPos);


                annotationObjects.__insertIndex++;
                classesBoundingBox.getCurrentAnnotationClassObject().nextTrackId++;
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
    let geometry = new THREE.PlaneGeometry(2 * gridSize, 2 * gridSize);
    let material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: false,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
    });
    let groundPlane = new THREE.Mesh(geometry, material);
    if (clickedObjects.length > 0) {

        if (ev.button === 0) {
            clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
            clickFlag = true;
            clickedPoint = clickedObjects[0].point;
            clickedCube = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];

            if (birdsEyeViewFlag === true) {
                groundPlane.position.x = clickedPoint.x;
                groundPlane.position.y = clickedPoint.y;
                groundPlane.position.z = -10;//clickedPoint.z;
                let normal = clickedObjects[0].face;
                if ([normal.a, normal.b, normal.c].toString() == [6, 3, 2].toString() || [normal.a, normal.b, normal.c].toString() == [7, 6, 2].toString()) {
                    groundPlane.rotation.x = Math.PI / 2;
                    groundPlane.rotation.y = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                } else if ([normal.a, normal.b, normal.c].toString() == [6, 7, 5].toString() || [normal.a, normal.b, normal.c].toString() == [4, 6, 5].toString()) {
                    groundPlane.rotation.x = -Math.PI / 2;
                    groundPlane.rotation.y = -Math.PI / 2 - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                } else if ([normal.a, normal.b, normal.c].toString() == [0, 2, 1].toString() || [normal.a, normal.b, normal.c].toString() == [2, 3, 1].toString()) {
                    groundPlane.rotation.x = Math.PI / 2;
                    groundPlane.rotation.y = Math.PI / 2 + labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                } else if ([normal.a, normal.b, normal.c].toString() == [5, 0, 1].toString() || [normal.a, normal.b, normal.c].toString() == [4, 5, 1].toString()) {
                    groundPlane.rotation.x = -Math.PI / 2;
                    groundPlane.rotation.y = -labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z;
                } else if ([normal.a, normal.b, normal.c].toString() == [3, 6, 4].toString() || [normal.a, normal.b, normal.c].toString() == [1, 3, 4].toString()) {
                    groundPlane.rotation.y = -Math.PI
                }
                groundPlane.name = "planeObject";
                scene.add(groundPlane);
                clickedPlaneArray.push(groundPlane);
            }

        } else if (ev.button === 2) {
            // rightclick
            clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
            let bboxClass = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["class"];
            let trackId = annotationObjects.contents[labelTool.currentFileIndex][clickedObjectIndex]["trackId"];
            deleteObject(bboxClass, trackId, clickedObjectIndex);
            // move button to left
            $("#left-btn").css("left", 0);
        }//end right click
    } else {
        for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
            $("#tooltip-" + annotationObjects.contents[labelTool.currentFileIndex][i]["class"].charAt(0) + annotationObjects.contents[labelTool.currentFileIndex][i]["trackId"]).show();
        }
        if (birdsEyeViewFlag === true) {
            clickedObjectIndex = -1;
            groundPlaneArray = [];
            groundPlane.position.x = 0;
            groundPlane.position.y = 0;
            groundPlane.position.z = -10;
            groundPlaneArray.push(groundPlane);
            let groundObject = ray.intersectObjects(groundPlaneArray);
            if (groundObject !== undefined && groundObject[0] !== undefined) {
                groundPointMouseDown = groundObject[0].point;
            }
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
    let imagePanelTopPos;
    if (labelTool.pointCloudOnlyAnnotation === false) {
        imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    } else {
        imagePanelTopPos = 0;
    }
    let viewHeight;
    if (isFullscreen() === true) {
        viewHeight = Math.round((window.innerHeight - headerHeight - imagePanelTopPos) / 3);
    } else {
        viewHeight = Math.round((screen.height + 24 - headerHeight - imagePanelTopPos) / 3) - 40;
    }

    views = [
        // main view
        {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            //background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
            background: new THREE.Color(1, 1, 1),
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
    interpolationModeCheckbox.parentElement.parentElement.style.opacity = 0.5;
    interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "none";
    interpolationModeCheckbox.firstChild.setAttribute("tabIndex", "-1");
}

function disableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox) {
    copyLabelToNextFrameCheckbox.parentElement.parentElement.style.opacity = 0.5;
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
    interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.5;
    interpolateBtn.domElement.firstChild.setAttribute("tabIndex", "-1");
}

function enablePointSizeSlider() {
    pointSizeSlider.domElement.parentElement.parentElement.style.pointerEvents = "all";
    pointSizeSlider.domElement.parentElement.parentElement.style.opacity = 1.0;
}

function disablePointSizeSlider() {
    pointSizeSlider.domElement.parentElement.parentElement.style.pointerEvents = "none";
    pointSizeSlider.domElement.parentElement.parentElement.style.opacity = 0.5;
}

function disableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox) {
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.pointerEvents = "none";
    showNuScenesLabelsCheckbox.parentElement.parentElement.parentElement.style.opacity = 0.5;
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
    chooseSequenceDropDown.parentElement.parentElement.style.opacity = 0.5;
    chooseSequenceDropDown.tabIndex = -1;
}

function createGrid() {
    labelTool.removeObject("grid");
    grid = new THREE.GridHelper(gridSize, gridSize);
    let posZLidar;
    let translationX;
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        posZLidar = labelTool.positionLidarNuscenes[2];
        translationX = 0;
    } else {
        posZLidar = labelTool.positionLidar[2];
        translationX = gridSize / 2;
    }
    grid.translateZ(-posZLidar);
    grid.translateX(translationX);
    grid.rotateX(Math.PI / 2);
    grid.name = "grid";
    if (showGridFlag === true) {
        grid.visible = true;
    } else {
        grid.visible = false;
    }
    scene.add(grid);
}

function toggleKeyboardNavigation() {
    keyboardNavigation = !keyboardNavigation;
    if (keyboardNavigation === true) {
        setPointerLockControls();
    } else {
        setOrbitControls();
    }
}

function canvas3DKeyDownHandler(event) {
    switch (event.keyCode) {
        case 75: //K
            toggleKeyboardNavigation();
            break;
    }
}

function loadDetectedBoxes() {
    let rawFile = new XMLHttpRequest();
    try {
        rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.sequence + '/detections/detections_lidar.json', false);
    } catch (error) {
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                let allText = rawFile.responseText;
                let allLines = allText.replace(/"/g, '').split("\n");
                let objectIndexWithinFrame = 0;
                let frameNumber = 1;
                let frameNumberPrevious = -1;
                for (let i = 0; i < allLines.length; i++) {
                    let line = allLines[i];
                    if (line === "") {
                        continue;
                    }
                    let params = getDefaultObject();
                    let attributes = line.split(",");
                    frameNumber = parseFloat(attributes[0].trim().split(" ")[1]);
                    if (frameNumber === frameNumberPrevious) {
                        objectIndexWithinFrame = objectIndexWithinFrame + 1;
                    } else {
                        objectIndexWithinFrame = 0;
                    }
                    frameNumberPrevious = frameNumber;
                    params.x = parseFloat(attributes[1].trim().split(" ")[2]);
                    params.y = parseFloat(attributes[2].trim().split(" ")[2]);
                    params.z = parseFloat(attributes[3].trim().split(" ")[2]);
                    params.original.x = params.x;
                    params.original.y = params.y;
                    params.original.z = params.z;
                    let tmpLength = parseFloat(attributes[4].trim().split(" ")[2]);
                    let tmpWidth = parseFloat(attributes[5].trim().split(" ")[2]);
                    let tmpHeight = parseFloat(attributes[6].trim().split(" ")[2]);
                    let rotationYaw = parseFloat(attributes[7].trim().split(" ")[1]);
                    let rotationPitch = parseFloat(attributes[8].trim().split(" ")[1]);
                    let rotationRoll = parseFloat(attributes[9].trim().split(" ")[1]);
                    params.class = "vehicle";
                    params.rotationYaw = rotationYaw;
                    params.rotationPitch = rotationPitch;
                    params.rotationRoll = rotationRoll;
                    params.original.rotationYaw = rotationYaw;
                    params.original.rotationPitch = rotationPitch;
                    params.original.rotationRoll = rotationRoll;
                    params.trackId = objectIndexWithinFrame + 1;
                    if (tmpWidth !== 0.0 && tmpLength !== 0.0 && tmpHeight !== 0.0) {
                        tmpWidth = Math.max(tmpWidth, 0.0001);
                        tmpLength = Math.max(tmpLength, 0.0001);
                        tmpHeight = Math.max(tmpHeight, 0.0001);
                        params.width = tmpWidth;
                        params.length = tmpLength;
                        params.height = tmpHeight;
                        params.original.width = tmpWidth;
                        params.original.length = tmpLength;
                        params.original.height = tmpHeight;
                    }
                    params.fileIndex = frameNumber - 1;
                    annotationObjects.set(objectIndexWithinFrame, params);
                    classesBoundingBox.getCurrentAnnotationClassObject().nextTrackId++;
                }
            }
        }
    };
    rawFile.send(null);
}

function initGuiBoundingBoxAnnotations() {
    let parametersBoundingBox = {};
    for (let i = 0; i < labelTool.classes.length; i++) {
        parametersBoundingBox[labelTool.classes[i]] =
            function () {
                classesBoundingBox.select(labelTool.classes[i]);
                $('#class-picker ul li').css('background-color', '#323232');
                $($('#class-picker ul li')[i]).css('background-color', '#525252');
            }
    }
    let guiAnnotationClassesWidth;
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        guiAnnotationClassesWidth = 220;
    } else {
        guiAnnotationClassesWidth = 90;
    }
    guiAnnotationClasses = new dat.GUI({autoPlace: true, width: guiAnnotationClassesWidth, resizable: false});

    let guiBoundingBoxAnnotationMap = {};
    for (let i = 0; i < labelTool.classes.length; i++) {
        guiBoundingBoxAnnotationMap[labelTool.classes[i]] = guiAnnotationClasses.add(parametersBoundingBox, labelTool.classes[i]).name(labelTool.classes[i]);
    }
    guiAnnotationClasses.domElement.id = 'class-picker';
}

function init() {
    if (WEBGL.isWebGLAvailable() === false) {
        document.body.appendChild(WEBGL.getWebGLErrorMessage());
    }
    keyboard = new KeyboardState();
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x323232);

    scene.fog = new THREE.Fog(scene.background, 3500, 15000);

    let axisHelper = new THREE.AxisHelper(1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);

    let light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(0, 0, 6).normalize();
    scene.add(light);

    canvas3D = document.getElementById('canvas3d');

    if (birdsEyeViewFlag === false) {
        canvas3D.removeEventListener('keydown', canvas3DKeyDownHandler);
        canvas3D.addEventListener('keydown', canvas3DKeyDownHandler);
    }

    window.removeEventListener('keydown', keyDownHandler);
    window.addEventListener('keydown', keyDownHandler);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        clearColor: 0x000000,
        clearAlpha: 0,
        alpha: true,
        preserveDrawingBuffer: true
    });
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

    if (guiBoundingBoxAnnotationsInitialized === false) {
        guiBoundingBoxAnnotationsInitialized = true;
        initGuiBoundingBoxAnnotations();
    }

    if (guiBoundingBoxMenuInitialized === false) {
        guiBoundingBoxMenuInitialized = true;
        // 3D BB controls
        guiOptions.add(parameters, 'download').name("Download Annotations");
        guiOptions.add(parameters, 'download_video').name("Create and Download Video");
        guiOptions.add(parameters, 'undo').name("Undo");
        guiOptions.add(parameters, 'views', ['perspective', 'orthographic']).name("Select View").onChange(function (value) {
            if (transformControls !== undefined) {
                labelTool.selectedMesh = undefined;
                transformControls.detach();
                transformControls = undefined;
                hideMasterView();
            }
            if (value === labelTool.views.orthographic) {
                birdsEyeViewFlag = true;
                disablePointSizeSlider();
                setOrthographicView();
            } else {
                birdsEyeViewFlag = false;
                enablePointSizeSlider();
                setPerspectiveView();
            }
            if (keyboardNavigation === false) {
                currentOrbitControls.update();
            }
            labelTool.removeObject("planeObject");
            scene.remove('pointcloud-scan-' + labelTool.currentFileIndex);
            scene.add(pointCloudScanMap[labelTool.currentFileIndex]);
        });
        pointSizeSlider = guiOptions.add(parameters, 'point_size').name("Point Size").min(0.001).max(pointSizeMax).step(0.001).onChange(function (value) {
            pointSizeCurrent = value;
            pointCloudScanMap[labelTool.currentFileIndex].material.size = value;
        });
        disablePointSizeSlider();
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
        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
            enableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
        }

        let chooseSequenceDropDownController;
        let currentDatasetDropDownController = guiOptions.add(labelTool, 'currentDataset', labelTool.datasetArray).name("Choose dataset")
            .onChange(function (value) {
                changeDataset(value);
                chooseSequenceDropDownController = chooseSequenceDropDownController.options(labelTool.dataStructure.datasets[labelTool.currentDatasetIdx].sequences);
                let allCheckboxes = $(":checkbox");
                let showNuScenesLabelsCheckbox = allCheckboxes[0];
                if (value === labelTool.datasets.NuScenes) {
                    enableShowNuscenesLabelsCheckbox(showNuScenesLabelsCheckbox);
                }
                hideMasterView();
            });

        chooseSequenceDropDownController = guiOptions.add(labelTool, 'sequence', labelTool.dataStructure.datasets[labelTool.currentDatasetIdx].sequences).name("Choose Sequence")
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

        if (labelTool.pointCloudOnlyAnnotation === false) {
            let showProjectedPointsCheckbox = guiOptions.add(parameters, 'show_projected_points').name('Show projected points').listen();
            showProjectedPointsCheckbox.onChange(function (value) {
                showProjectedPointsFlag = value;
                if (showProjectedPointsFlag === true) {
                    showProjectedPoints();
                } else {
                    hideProjectedPoints();
                }
            });
        }

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
                labelTool.removeObject("pointcloud-scan-" + labelTool.currentFileIndex);
                addObject(pointCloudScanNoGroundList[labelTool.currentFileIndex], "pointcloud-scan-no-ground-" + labelTool.currentFileIndex);
            } else {
                labelTool.removeObject("pointcloud-scan-no-ground-" + labelTool.currentFileIndex);
                addObject(pointCloudScanMap[labelTool.currentFileIndex], "pointcloud-scan-" + labelTool.currentFileIndex);
            }
        });

        let hideOtherAnnotationsCheckbox = guiOptions.add(parameters, 'hide_other_annotations').name('Hide other annotations').listen();
        hideOtherAnnotationsCheckbox.onChange(function (value) {
            hideOtherAnnotations = value;
            let selectionIndex = annotationObjects.getSelectionIndex();
            if (hideOtherAnnotations === true) {
                for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                    // remove 3D labels
                    let mesh = labelTool.cubeArray[labelTool.currentFileIndex][i];
                    mesh.material.opacity = 0;
                    if (labelTool.pointCloudOnlyAnnotation === false) {
                        // remove all 2D labels
                        for (let j = 0; j < annotationObjects.contents[labelTool.currentFileIndex][i].channels.length; j++) {
                            let channelObj = annotationObjects.contents[labelTool.currentFileIndex][i].channels[j];
                            // remove drawn lines of all 6 channels
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
                }
                if (labelTool.pointCloudOnlyAnnotation === false) {
                    if (selectionIndex !== -1) {
                        // draw selected object in 2D and 3D
                        update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
                    }
                }
            } else {
                for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                    // show 3D labels
                    let mesh = labelTool.cubeArray[labelTool.currentFileIndex][i];
                    mesh.material.opacity = 0.9;
                    if (labelTool.pointCloudOnlyAnnotation === false) {
                        // show 2D labels
                        if (selectionIndex === i) {
                            // draw selected object in 2D and 3D
                            update2DBoundingBox(labelTool.currentFileIndex, selectionIndex, true);
                        } else {
                            if (selectionIndex !== -1) {
                                update2DBoundingBox(labelTool.currentFileIndex, i, false);
                            }
                        }
                    }

                }
            }

        });

        guiOptions.add(parameters, 'select_all_copy_label_to_next_frame').name("Select all 'Copy label to next frame'");
        guiOptions.add(parameters, 'unselect_all_copy_label_to_next_frame').name("Unselect all 'Copy label to next frame'");


        let interpolationModeCheckbox = guiOptions.add(parameters, 'interpolation_mode').name('Interpolation Mode');
        interpolationModeCheckbox.domElement.id = 'interpolation-checkbox';
        // if scene contains no objects then deactivate checkbox
        if (annotationFileExist(0, undefined) === false || interpolationMode === false) {
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
                    obj["interpolationStart"]["position"]["rotationYaw"] = obj["rotationYaw"];
                    obj["interpolationStart"]["position"]["rotationPitch"] = obj["rotationPitch"];
                    obj["interpolationStart"]["position"]["rotationRoll"] = obj["rotationRoll"];
                    obj["interpolationStart"]["size"]["width"] = obj["width"];
                    obj["interpolationStart"]["size"]["length"] = obj["length"];
                    obj["interpolationStart"]["size"]["height"] = obj["height"];
                    // short interpolation start index (Interpolation Start Position (frame 400)
                    folderPositionArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (labelTool.currentFileIndex + 1) + ")";
                    folderRotationArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (labelTool.currentFileIndex + 1) + ")";
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
                    folderRotationArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Rotation";
                    folderSizeArray[interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Size";
                    enableStartPose();
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

        guiOptions.add(parameters, 'reset_all').name("Reset all");
        guiOptions.add(parameters, 'skip_frames').name("Skip frames").onChange(function (value) {
            if (value === "") {
                value = 1;
            } else {
                value = parseInt(value);
            }
            labelTool.skipFrameCount = value;
        });


        guiOptions.domElement.id = 'bounding-box-3d-menu';
        // add download Annotations button
        let downloadAnnotationsItem = $($('#bounding-box-3d-menu ul li')[0]);
        let downloadAnnotationsDivItem = downloadAnnotationsItem.children().first();
        downloadAnnotationsDivItem.wrap("<a href=\"\"></a>");
        loadColorMap();
        if (labelTool.pointCloudOnlyAnnotation === false) {
            if (showProjectedPointsFlag === true) {
                showProjectedPoints();
            } else {
                hideProjectedPoints();
            }
        }
    }// end if guiBoundingBoxMenuInitialized

    let classPickerElem = $('#class-picker ul li');
    classPickerElem.css('background-color', '#353535');
    $(classPickerElem[0]).css('background-color', '#525252');
    classPickerElem.css('border-bottom', '0px');
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        $("#class-picker").css("width", '220px');
    }
    $('#bounding-box-3d-menu').css('width', '480px');
    $('#bounding-box-3d-menu ul li').css('background-color', '#353535');
    $("#bounding-box-3d-menu .close-button").click(function () {
        guiOptionsOpened = !guiOptionsOpened;
        if (guiOptionsOpened === true) {
            $("#right-btn").css("right", 500);
        } else {
            $("#right-btn").css("right", 0);
        }
    });
    guiOptions.open();
    classPickerElem.each(function (i, item) {
        let color = labelTool.classColors[i];
        let attribute = "20px solid" + ' ' + color;
        $(item).css("border-left", attribute);
        $(item).css('border-bottom', '0px');
    });
    initViews();
}