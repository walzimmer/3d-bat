var camera, controls, scene, renderer;
var stats;
var cube;
var keyboard = new KeyboardState();
var numbertagList = [];
var guiTag = [];
var guiAnnotationClasses = new dat.GUI();
var guiBoundingBoxAnnotationMap = {};
var guiOptions = new dat.GUI();
var folderBoundingBox3DArray = [];
var folderPositionArray = [];
var folderSizeArray = [];
var bboxFlag = true;
var clickFlag = false;
var clickedObjectIndex = -1;
var mouseDown = {x: 0, y: 0};
var mouseUp = {x: 0, y: 0};
var clickedPoint = THREE.Vector3();
var groundClickedPoint;
var groundPlaneArray = [];
var clickedPlaneArray = [];
var birdViewFlag = false;
var moveFlag = false;
var cls = 0;
var cFlag = false;
var rFlag = false;
var rotationBboxIndex = -1;
var copyBboxIndex = -1;
var rotWorldMatrix;

var parametersBoundingBox = {
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

var parameters = {
        save: function () {
            save();
        },
        download: function () {
            download();
        },
        view_mode: 'Image and point cloud',
        annotation_mode:
            'Bounding Boxes',
        i: -1,
        bird_view:
            function () {
                setBirdsEyeView();
            }
        ,
        camera_view: function () {
            setCameraView();
        }
        ,
        update_database: function () {
            labelTool.archiveWorkFiles();
        }
    }
;

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

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js pre r59:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // code for r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}

var rotObjectMatrix;

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

    var Shape = new THREE.Shape();

    (function f(ctx) {

        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);

    })(Shape);

    var settings = {};
    settings.amount = height;
    settings.bevelEnabled = false;
    THREE.ExtrudeGeometry.call(this, Shape, settings);

};
PrismGeometry.prototype = Object.create(THREE.ExtrudeGeometry.prototype);

// Visualize 2d and 3d data
labelTool.onLoadData("PCD", function () {
    // remove previous loaded point clouds
    labelTool.removeObject("pointcloud");


    // $("#jpeg-label-canvas-left").show();
    // changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);

    // var obj_loader = new THREE.OBJLoader();
    // var obj_url = labelTool.workBlob + '/PCDPoints_orig/' + labelTool.fileNames[labelTool.currentFileIndex] + 'all.pcd';
    // obj_loader.load(obj_url, function (mesh) {
    //     scene.add(mesh);
    //     labelTool.hasPCD = true;
    // });

    // ASCII pcd files
    var pcd_loader = new THREE.PCDLoader();
    var pcd_url = labelTool.workBlob + '/PCDPoints/all_scenes/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
    pcd_loader.load(pcd_url, function (mesh) {
        // var xAxis = new THREE.Vector3(0, 0, 1);
        //rotateAroundWorldAxis(mesh, xAxis, 2 * Math.PI / 180);
        // rotateAroundObjectAxis(mesh, xAxis, 2 * Math.PI / 180);
        mesh.name = 'pointcloud';
        scene.add(mesh);
    });

    // show FOV of camera within 3D pointcloud
    labelTool.removeObject('rightplane');
    labelTool.removeObject('leftplane');
    labelTool.removeObject('prism');
    labelTool.drawFieldOfView();
});

annotationObjects.onSelect("PCD", function (selectionIndex) {
    clickedPlaneArray = [];
    for (var i = 0; i < folderBoundingBox3DArray.length; i++) {
        if (folderBoundingBox3DArray[i] != undefined) {
            folderBoundingBox3DArray[i].close();
        }
    }
    if (folderBoundingBox3DArray[selectionIndex] != undefined) {
        folderBoundingBox3DArray[selectionIndex].open();
    }
    if (folderPositionArray[selectionIndex] != undefined) {
        folderPositionArray[selectionIndex].open();
    }
    if (folderSizeArray[selectionIndex] != undefined) {
        folderSizeArray[selectionIndex].open();
    }
});


annotationObjects.onChangeClass("PCD", function (index, label) {
    labelTool.cubeArray[labelTool.currentFileIndex][index].material.color.setHex(classesBoundingBox[label].color);
});

//add remove function in dat.GUI
dat.GUI.prototype.removeFolder = function (name) {
    var folder = this.__folders[name];
    if (!folder) {
        return;
    }

    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
};

//read local calibration file.
function readYAMLFile(filename) {
    var rawFile = new XMLHttpRequest();
    var hasCameraExtrinsicMatrix = false;
    var cameraParameters = [];
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                for (var i = 0; i < allText.split("\n").length; i++) {
                    if (allText.split("\n")[i].split(":")[0].trim() == 'CameraExtrinsicMat') {
                        hasCameraExtrinsicMatrix = true;
                    }
                    if (hasCameraExtrinsicMatrix && allText.split("\n")[i].split(":")[0].trim() == 'data') {
                        for (m = 0; m < allText.split("\n")[i].split(":")[1].split("[")[1].split(",").length - 1; m++) {
                            var each_param = parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[m])
                            cameraParameters.push(each_param)
                        }
                        while (cameraParameters.length < 12) {
                            i = i + 1
                            for (m = 0; m < allText.split("\n")[i].trim().split(",").length - 1; m++) {
                                var paramameter = parseFloat(allText.split("\n")[i].trim().split(",")[m]);
                                cameraParameters.push(paramameter)
                            }
                        }
                        labelTool.cameraMatrix = [[parseFloat(cameraParameters[0]), parseFloat(cameraParameters[1]), parseFloat(cameraParameters[2]), parseFloat(cameraParameters[3])],
                            [parseFloat(cameraParameters[4]), parseFloat(cameraParameters[5]), parseFloat(cameraParameters[6]), parseFloat(cameraParameters[7])],
                            [parseFloat(cameraParameters[8]), parseFloat(cameraParameters[9]), parseFloat(cameraParameters[10]), parseFloat(cameraParameters[11])],
                            [0, 0, 0, 1]];
                        hasCameraExtrinsicMatrix = false;
                        if (isNaN(inverseMatrix(labelTool.cameraMatrix)[0][0]) === true) {
                            alert("calibration parameter is wrong");
                            labelTool.cameraMatrix = [[1, 0, 0, 0],
                                [parseFloat(cameraParameters[4]), parseFloat(cameraParameters[5]), parseFloat(cameraParameters[6]), parseFloat(cameraParameters[7])],
                                [parseFloat(cameraParameters[8]), parseFloat(cameraParameters[9]), parseFloat(cameraParameters[10]), parseFloat(cameraParameters[11])],
                                [0, 0, 0, 1]];
                        }
                        break;
                    }
                }
            }
        }
    };
    rawFile.send(null);
}

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

//load pcd data and image data
function loadPCDData() {
    labelTool.showData();
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

function download() {
    // download annotations
    var annotations = labelTool.createAnnotations();
    var outputString = '';
    for (var i = 0; i < annotations.length; i++) {
        outputString += annotations[i].class + " ";
        outputString += annotations[i].alpha + " ";
        outputString += annotations[i].occluded + " ";
        outputString += annotations[i].truncated + " ";
        outputString += annotations[i].left + " ";
        outputString += annotations[i].top + " ";
        outputString += annotations[i].right + " ";
        outputString += annotations[i].bottom + " ";
        outputString += annotations[i].height + " ";//length
        outputString += annotations[i].width + " ";//height
        outputString += annotations[i].length + " ";//width
        outputString += annotations[i].x + " ";//lateral x
        outputString += annotations[i].y + " ";
        outputString += annotations[i].z + " ";
        outputString += annotations[i].rotation_y + " ";
        outputString += annotations[i].score + " ";
        outputString += annotations[i].trackId + " ";
        outputString += annotations[i].channel + "\n";
    }
    outputString = b64EncodeUnicode(outputString);
    var fileName = labelTool.currentFileIndex.toString().padStart(6, '0');
    $($('#bounding-box-3d-menu ul li')[0]).children().first().attr('href', 'data:application/octet-stream;base64,' + outputString).attr('download', fileName + '.txt');
}

//change camera position to bird view position
function setBirdsEyeView() {
    // birdViewFlag = true;
    // setCamera();


    labelTool.currentCameraChannelIndex++;
    setCameraToChannel(labelTool.camChannels[labelTool.currentCameraChannelIndex].channel);
    labelTool.removeObject('rightplane');
    labelTool.removeObject('leftplane');
    labelTool.removeObject('prism');
    labelTool.drawFieldOfView();
}

//change camera position to initial position
function setCameraView() {
    birdViewFlag = false;
    setCamera();
}

//add new bounding box

function get3DLabel(parameters) {
    var bbox = parameters;
    var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);//width, height, depth
    var color;
    if (parameters.fromFile === true) {
        color = classesBoundingBox[parameters.class].color;
    } else {
        color = classesBoundingBox.target().color;
    }

    var cubeMaterial = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.1});
    var cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(bbox.x, -bbox.y, bbox.z);
    cubeMesh.scale.set(bbox.width, bbox.height, bbox.depth);
    cubeMesh.rotation.z = bbox.yaw;
    cubeMesh.name = "cube-" + parameters.class.charAt(0) + parameters.trackId;
    scene.add(cubeMesh);
    labelTool.cubeArray[labelTool.currentFileIndex].push(cubeMesh);
    addBoundingBoxGui(bbox);
    return bbox;
}

//register new bounding box
function addBoundingBoxGui(bbox) {
    var insertIndex = folderBoundingBox3DArray.length;
    var bb = guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
    folderBoundingBox3DArray.push(bb);

    var folderPosition = folderBoundingBox3DArray[insertIndex].addFolder('Position');
    var cubeX = folderPosition.add(bbox, 'x').min(-50).max(50).step(0.01).listen();
    var cubeY = folderPosition.add(bbox, 'y').min(-30).max(30).step(0.01).listen();
    var cubeZ = folderPosition.add(bbox, 'z').min(-3).max(10).step(0.01).listen();
    var cubeYaw = folderPosition.add(bbox, 'yaw').min(-Math.PI).max(Math.PI).step(0.05).listen();
    folderPosition.close();
    folderPositionArray.push(folderPosition);

    var folderSize = folderBoundingBox3DArray[insertIndex].addFolder('Size');
    var cubeW = folderSize.add(bbox, 'width').min(0).max(10).step(0.01).listen();
    var cubeH = folderSize.add(bbox, 'height').min(0).max(10).step(0.01).listen();
    var cubeD = folderSize.add(bbox, 'depth').min(0).max(10).step(0.01).listen();
    folderSize.close();
    folderSizeArray.push(folderSize);

    var textBoxTrackId = folderBoundingBox3DArray[insertIndex].add(bbox, 'trackId').min(0).step(1).name('Number');
    // textBoxTrackId.name = "textbox-" + bbox.class.charAt(0) + ' ' + bbox.trackId;
    textBoxTrackId.onChange(function (value) {
        if (value < 0) {
            value = 0;
        }
        annotationObjects.contents[insertIndex]["trackId"] = Math.round(value);
        // alert("test");
        // console.log($("#bounding-box-3d-menu ul").children().eq(insertIndex + 2));
        $("#bounding-box-3d-menu ul").children().eq(insertIndex + 2).children().first().children().first().children().first().text(bbox.class + " " + Math.round(value));
        // $("#bounding-box-3d-menu ul li div ul li").text(bbox.class + " " + value);
        // $("#textbox-" + bbox.class.charAt(0) + ' ' + bbox.trackId);
    });

    cubeX.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = value;
    });
    cubeY.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = -value;
    });
    cubeZ.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = value;
    });
    cubeYaw.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z = value;
    });
    cubeW.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        bbox.x = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        bbox.y = -labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x = value;
    });
    cubeH.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        bbox.x = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y - (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        bbox.y = -labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y = value;
    });
    cubeD.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z) / 2;
        bbox.z = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z = value;
    });
    var resetParameters = {
        reset: function () {
            resetCube(insertIndex, insertIndex);
        },
        delete: function () {
            guiOptions.removeFolder(bbox.class + ' ' + bbox.trackId);
            labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].visible = false;
            annotationObjects.remove(insertIndex);
        }
    };
    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(resetParameters, 'reset').name("Reset");
    d = folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(resetParameters, 'delete').name("Delete");
}

//reset cube patameter and position
function resetCube(index, num) {
    var reset_bbox = annotationObjects.contents[index];
    reset_bbox.x = reset_bbox.org.x;
    reset_bbox.y = reset_bbox.org.y;
    reset_bbox.z = reset_bbox.org.z;
    reset_bbox.yaw = reset_bbox.org.yaw;
    reset_bbox.width = reset_bbox.org.width;
    reset_bbox.height = reset_bbox.org.height;
    reset_bbox.depth = reset_bbox.org.depth;
    labelTool.cubeArray[labelTool.currentFileIndex][num].position.x = reset_bbox.x;
    labelTool.cubeArray[labelTool.currentFileIndex][num].position.y = -reset_bbox.y;
    labelTool.cubeArray[labelTool.currentFileIndex][num].position.z = reset_bbox.z;
    labelTool.cubeArray[labelTool.currentFileIndex][num].rotation.z = reset_bbox.yaw;
    labelTool.cubeArray[labelTool.currentFileIndex][num].scale.x = reset_bbox.width;
    labelTool.cubeArray[labelTool.currentFileIndex][num].scale.y = reset_bbox.height;
    labelTool.cubeArray[labelTool.currentFileIndex][num].scale.z = reset_bbox.depth;
}

//change window size
function onWindowResize() {
    // var canvas3D = $("canvas3d");
    // camera.aspect = canvas3D.getAttribute("width") / canvas3D.getAttribute("height");
    // camera.updateProjectionMatrix();
    // renderer.setSize(canvas3D.getAttribute("width"), canvas3D.getAttribute("height"));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//set camera type
function setCamera() {
    if (birdViewFlag === false) {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000);

        // camera.position.set(0.0000000001, 0, 0);//look left
        // camera.position.set(0, 0.0000000001, 0);//look back
        // camera.position.set(-0.0000000001, 0, 0);//look right
        // camera.position.set(0, -0.0000000001, 0);//look forward
        // camera.position.set(-0.0000000001, -0.0000000001, 0);// look front right

        // camera.position.set(labelTool.camChannels[1].position[1], labelTool.camChannels[1].position[0] - labelTool.positionLidar[0], labelTool.camChannels[1].position[2]);

        // let yPos = 1;
        // let xPos = Math.tan(110 * Math.PI / 180) * yPos;
        // camera.position.set(-xPos, -yPos, 1.5);

        // camera.target = new THREE.Vector3(1500,500,0);
        // camera.lookAt(scene.position);
        camera.up = new THREE.Vector3(0, 0, 1);
        // camera.lookAt(new THREE.Vector3(100, 100, 0));


        // camera.updateProjectionMatrix();

    } else {
        camera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0, 2000);
        camera.position.set(0, 0, 1000);
        camera.up.set(0, 1, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;// default: true
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;

    // front left
    // let yPos = 0.001;
    // let xPos = Math.tan(305 * Math.PI / 180) * yPos;
    let pos = labelTool.camChannels[0].position;
    controls.object.position.set(-pos[1], pos[0] - labelTool.positionLidar[0], labelTool.positionLidar[2] - pos[2]);
    controls.target = new THREE.Vector3(-pos[1] - 0.0000001, pos[0] - labelTool.positionLidar[0] + 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward

    // front
    // let positionFront = labelTool.camChannels[1].position;
    // controls.object.position.set(positionFront[1], positionFront[0], labelTool.positionLidar[2] - positionFront[2]);
    // controls.target = new THREE.Vector3(positionFront[1], positionFront[0] + 0.00000000000001, labelTool.positionLidar[2] - positionFront[2]);// look backward
    controls.update();

}

//draw animation
function animate() {
    requestAnimationFrame(animate);
    keyboard.update();
    if (keyboard.down("shift")) {
        controls.enabled = true;
        bboxFlag = false;
    }

    if (keyboard.up("shift")) {
        controls.enabled = false;
        bboxFlag = true;
    }

    if (keyboard.down("alt")) {
        moveFlag = true;
    }
    if (keyboard.up("alt")) {
        moveFlag = false;
    }
    if (keyboard.down("C")) {
        rFlag = false;
        if (cFlag == false) {
            copyBboxIndex = annotationObjects.getSelectionIndex();
            copyBbox = annotationObjects.contents[copyBboxIndex];
            cFlag = true;
        } else {
            copyBboxIndex = -1;
            cFlag = false;
        }
    }
    if (keyboard.down("R")) {
        cFlag = false;
        if (rFlag == false) {
            rotationBboxIndex = annotationObjects.getSelectionIndex();
            rFlag = true;
        }
        else {
            rotationBboxIndex = -1;
            rFlag = false;
        }
    }

    controls.update();
    stats.update();
    if (annotationObjects.getSelectionIndex() !== rotationBboxIndex) {
        rFlag = false;
    }
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
    renderer.render(scene, camera);
}


/**
 * Find the corresponding camera channels in that the 3D object is visible.
 * Note that an object can be visible in one or two camera channels
 * @param x Lateral position
 * @param y Longitudinal position
 * @returns channel One of the six camera channels
 */
function getChannelByPosition(x, y) {
    var channels = [];
    var alphaRadian;
    if (x >= 0 && y >= 0) {
        alphaRadian = Math.PI - Math.atan(Math.abs(x) / Math.abs(y));
    } else if (x < 0 && y >= 0) {
        alphaRadian = 2 * Math.PI - Math.atan(Math.abs(y) / Math.abs(x));
    } else if (x < 0 && y < 0) {
        alphaRadian = 2 * Math.PI - Math.atan(Math.abs(x) / Math.abs(y)) + Math.PI / 2;
    } else {
        // x>=0 and y<0
        alphaRadian = Math.atan(Math.abs(y) / Math.abs(x)) + 1.5 * Math.PI;
    }
    var alphaDegrees = 360 * alphaRadian / (2 * Math.PI);
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
    return channels;
}

function calculateProjectedBoundingBox(xPos, yPos, zPos, width, height, depth) {
    var cornerPoints = [];
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    let projector = new THREE.Projector();
    let projectedPoints = [];
    for (let cornerPoint in cornerPoints) {
        let point = cornerPoints[cornerPoint];
        projectedPoints.push(projector.projectVector(point, camera));
    }
    return projectedPoints;
}

function setCameraToChannel(channel) {
    let channelIdx = getChannelIndexByName(channel);
    let fieldOfView = labelTool.camChannels[channelIdx].fieldOfView;
    camera.fov = fieldOfView;

    if (channel === labelTool.camChannels[0].channel) {
        // front left
        let yPos = 0.5;
        let xPos = Math.tan(305 * Math.PI / 180) * yPos;
        let pos = labelTool.camChannels[0].position;
        controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidar[0] + yPos, labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] - xPos + 0.0000001, pos[0] - labelTool.positionLidar[0] + yPos + 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward
    } else if (channel === labelTool.camChannels[1].channel) {
        // front
        let pos = labelTool.camChannels[1].position;
        controls.object.position.set(pos[1], pos[0], labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(pos[1], pos[0] + 0.0000001, labelTool.positionLidar[2] - pos[2]);
    } else if (channel === labelTool.camChannels[2].channel) {
        // front right
        let yPos = 0.5;
        let xPos = Math.tan(55 * Math.PI / 180) * yPos;
        let pos = labelTool.camChannels[2].position;
        controls.object.position.set(-pos[1] + xPos, pos[0] - labelTool.positionLidar[0] + yPos, labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] + xPos + 0.0000001, pos[0] - labelTool.positionLidar[0] + yPos + 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward
    } else if (channel === labelTool.camChannels[3].channel) {
        // back right
        let yPos = 0.5;
        let xPos = Math.tan(110 * Math.PI / 180) * yPos;
        let pos = labelTool.camChannels[3].position;
        controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidar[0] - yPos, labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] - xPos + 0.0000001, pos[0] - labelTool.positionLidar[0] - yPos - 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward
    } else if (channel === labelTool.camChannels[4].channel) {
        // back
        let yPos = 0.5;
        let xPos = Math.tan(180 * Math.PI / 180) * yPos;
        let pos = labelTool.camChannels[4].position;
        controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidar[0] - yPos, labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] - xPos - 0.0000001, pos[0] - labelTool.positionLidar[0] - yPos - 0.01, labelTool.positionLidar[2] - pos[2]);// look backward
    } else if (channel === labelTool.camChannels[5].channel) {
        // back left
        let yPos = 0.5;
        let xPos = Math.tan(250 * Math.PI / 180) * yPos;
        let pos = labelTool.camChannels[5].position;
        controls.object.position.set(-pos[1] - xPos, pos[0] - labelTool.positionLidar[0] - yPos, labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] - xPos - 0.00000001, pos[0] - labelTool.positionLidar[0] - yPos - 0.000000001, labelTool.positionLidar[2] - pos[2]);// look backward
    } else {
        // channel undefined
    }
}

function init() {
    scene = new THREE.Scene();
    let axisHelper = new THREE.AxisHelper(1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x161616);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    setCamera();

    let canvas3D = document.getElementById('canvas3d');
    canvas3D.appendChild(renderer.domElement);
    stats = new Stats();
    canvas3D.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    canvas3D.onmousedown = function (ev) {
        if (bboxFlag === true) {
            if (ev.target === renderer.domElement) {
                let rect = ev.target.getBoundingClientRect();
                mouseDown.x = ((ev.clientX - rect.left) / window.innerWidth) * 2 - 1;
                mouseDown.y = -((ev.clientY - rect.top) / window.innerHeight) * 2 + 1;
                if (birdViewFlag === false) {
                    let vector = new THREE.Vector3(mouseDown.x, mouseDown.y, 1);
                    vector.unproject(camera);
                    let ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    let ray = new THREE.Raycaster();
                    let mouse = new THREE.Vector2();
                    mouse.x = mouseDown.x;
                    mouse.y = mouseDown.y;
                    ray.setFromCamera(mouse, camera);
                }
                let clickedObjects = ray.intersectObjects(labelTool.cubeArray[labelTool.currentFileIndex]);
                if (clickedObjects.length > 0) {
                    clickedObjectIndex = labelTool.cubeArray[labelTool.currentFileIndex].indexOf(clickedObjects[0].object);
                    if (ev.button === 0) {
                        clickFlag = true;
                        clickedPoint = clickedObjects[0].point;
                        clickedCube = labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex];
                        var material = new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            wireframe: false,
                            transparent: true,
                            opacity: 0.0
                        });
                        var geometry = new THREE.PlaneGeometry(200, 200);
                        var clickedPlane = new THREE.Mesh(geometry, material);
                        clickedPlane.position.x = clickedPoint.x;
                        clickedPlane.position.y = clickedPoint.y;
                        clickedPlane.position.z = clickedPoint.z;
                        var normal = clickedObjects[0].face;
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
                    else if (ev.button == 2) {
                        // rightclick
                        let label = annotationObjects.contents[clickedObjectIndex]["class"];
                        let trackId = annotationObjects.contents[clickedObjectIndex]["trackId"];
                        guiOptions.removeFolder(label + ' ' + trackId);
                        annotationObjects.remove(clickedObjectIndex);
                        annotationObjects.selectEmpty();
                    }
                } else if (birdViewFlag == true) {
                    clickedObjectIndex = -1;
                    groundPlaneArray = [];
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: false,
                        transparent: true,//default: true
                        opacity: 0.0//oefault 0.0
                    });
                    var geometry = new THREE.PlaneGeometry(200, 200);
                    var groundPlane = new THREE.Mesh(geometry, material);
                    groundPlane.position.x = 0;
                    groundPlane.position.y = 0;
                    groundPlane.position.z = -1;
                    groundPlaneArray.push(groundPlane);
                    var groundObject = ray.intersectObjects(groundPlaneArray);
                    groundClickedPoint = groundObject[0].point;
                }
            }
        }
    };

    canvas3D.onmouseup = function (ev) {
        if (ev.button == 0) {
            if (bboxFlag == true) {
                var rect = ev.target.getBoundingClientRect();
                mouseUp.x = ((ev.clientX - rect.left) / $("#canvas3d canvas").attr("width")) * 2 - 1;
                mouseUp.y = -((ev.clientY - rect.top) / $("#canvas3d canvas").attr("height")) * 2 + 1;
                if (birdViewFlag == false) {
                    var vector = new THREE.Vector3(mouseUp.x, mouseUp.y, 1);
                    vector.unproject(camera);
                    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    var ray = new THREE.Raycaster();
                    var mouse = new THREE.Vector2();
                    mouse.x = mouseUp.x;
                    mouse.y = mouseUp.y;
                    ray.setFromCamera(mouse, camera);
                }
                var clickedObjects = ray.intersectObjects(clickedPlaneArray);
                // if (clickedObjects.length > 0 && folderBoundingBox3DArray[clickedObjectIndex].closed == false) {
                //     var clickedBBox = annotationObjects.contents[labelTool.bboxIndexArray[labelTool.currentFileIndex][clickedObjectIndex]];
                //     var dragVector = {
                //         x: clickedObjects[0].point.x - clickedPoint.x,
                //         y: clickedObjects[0].point.y - clickedPoint.y,
                //         z: clickedObjects[0].point.z - clickedPoint.z
                //     };
                //     var yawDragVector = {
                //         x: dragVector.x * Math.cos(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z) - dragVector.y * Math.sin(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z),
                //         y: dragVector.x * Math.sin(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z) + dragVector.y * Math.cos(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z),
                //         z: dragVector.z
                //     };
                //     var judgeClickPoint = {
                //         x: (clickedPoint.x - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.x) * Math.cos(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z) - (clickedPoint.y - labelTool.cubeArray[clickedObjectIndex].position.y) * Math.sin(-labelTool.cubeArray[clickedObjectIndex].rotation.z),
                //         y: (clickedPoint.x - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.x) * Math.sin(-labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z) + (clickedPoint.y - labelTool.cubeArray[clickedObjectIndex].position.y) * Math.cos(-labelTool.cubeArray[clickedObjectIndex].rotation.z)
                //     };
                //     if (moveFlag == true) {
                //         clickedBBox.x = dragVector.x + clickedBBox.x;
                //         clickedBBox.y = -dragVector.y + clickedBBox.y;
                //         clickedBBox.z = dragVector.z + clickedBBox.z;
                //     } else if (rFlag == true) {
                //         clickedBBox.yaw = clickedBBox.yaw + Math.atan2(yawDragVector.y, yawDragVector.x) / (2 * Math.PI);
                //     }
                //     else {
                //         clickedBBox.width = judgeClickPoint.x * yawDragVector.x / Math.abs(judgeClickPoint.x) + clickedBBox.width;
                //         clickedBBox.x = dragVector.x / 2 + clickedBBox.x;
                //         clickedBBox.height = judgeClickPoint.y * yawDragVector.y / Math.abs(judgeClickPoint.y) + clickedBBox.height;
                //         clickedBBox.y = -dragVector.y / 2 + clickedBBox.y;
                //         clickedBBox.depth = (clickedPoint.z - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.z) * dragVector.z / Math.abs((clickedPoint.z - labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.z)) + clickedBBox.depth;
                //         clickedBBox.z = dragVector.z / 2 + clickedBBox.z;
                //     }
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.x = clickedBBox.x;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.y = -clickedBBox.y;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].position.z = clickedBBox.z;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].rotation.z = clickedBBox.yaw;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].scale.x = clickedBBox.width;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].scale.y = clickedBBox.height;
                //     labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].scale.z = clickedBBox.depth;
                // }

                if (clickedObjects.length > 0) {
                    for (var mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                        var meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                        meshObject.material.opacity = 0.1;
                    }
                    labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].material.opacity = 0.5;
                } else {
                    // remove selection in camera view if 2d label exist
                    for (var i = 0; i < annotationObjects.contents.length; i++) {
                        if (annotationObjects.contents[i]["rect"] !== undefined) {
                            // removeBoundingBoxHighlight(i);
                            removeTextBox(i);
                        }
                    }

                    // remove selection in birds eye view (lower opacity)
                    for (var mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                        var meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                        meshObject.material.opacity = 0.1;
                    }

                }
                if (clickFlag === true) {
                    clickedPlaneArray = [];
                    var selectionIndex = labelTool.bboxIndexArray[labelTool.currentFileIndex][clickedObjectIndex];
                    // find out in which camera view the 3d object lies -> calculate angle
                    var channels = getChannelByPosition(annotationObjects.contents[selectionIndex]["x"], annotationObjects.contents[selectionIndex]["y"]);
                    for (var channel in channels) {
                        var camChannel = channels[channel];
                        annotationObjects.select(selectionIndex, camChannel);
                    }

                    clickFlag = false;
                } else if (groundPlaneArray.length == 1) {
                    var groundUpObject = ray.intersectObjects(groundPlaneArray);
                    var groundUpPoint = groundUpObject[0].point;

                    var trackId = -1;
                    var insertIndex;
                    if (annotationObjects.__selectionIndex === -1) {
                        trackId = classesBoundingBox[classesBoundingBox.targetName()].nextTrackId;
                        insertIndex = annotationObjects.__insertIndex;
                    } else {
                        trackId = annotationObjects.contents[annotationObjects.__selectionIndex]["trackId"];
                        insertIndex = annotationObjects.__selectionIndex;
                    }
                    // set channel based on 3d position of new bonding box
                    if (Math.abs(groundUpPoint.x - groundClickedPoint.x) > 0.1) {
                        var xPos = (groundUpPoint.x + groundClickedPoint.x) / 2;
                        var yPos = -(groundUpPoint.y + groundClickedPoint.y) / 2;
                        var zPos = -0.5;
                        var addBboxParameters = {
                            class: classesBoundingBox.targetName(),
                            x: xPos,
                            y: yPos,
                            z: zPos,
                            width: Math.abs(groundUpPoint.x - groundClickedPoint.x),
                            height: Math.abs(groundUpPoint.y - groundClickedPoint.y),
                            depth: 1.0,
                            yaw: 0,
                            org: {
                                x: (groundUpPoint.x + groundClickedPoint.x) / 2,
                                y: -(groundUpPoint.y + groundClickedPoint.y) / 2,
                                z: -0.5,
                                width: Math.abs(groundUpPoint.x - groundClickedPoint.x),
                                height: Math.abs(groundUpPoint.y - groundClickedPoint.y),
                                depth: 1.0,
                                yaw: 0,
                            },
                            trackId: trackId,
                            channels: [{
                                points2D: [],
                                lines: [],
                                channel: ''
                            }, {
                                points2D: [],
                                lines: [],
                                channel: ''
                            }],
                            fromFile: false
                        };
                        // set channel
                        var channels = getChannelByPosition(xPos, yPos);
                        for (var i = 0; i < channels.length; i++) {
                            var channel = channels[i];
                            addBboxParameters.channels[i].channel = channel;
                            // set camera to current channel
                            setCameraToChannel(channel);
                            let projectedBoundingBox = calculateProjectedBoundingBox(xPos, yPos, zPos, addBboxParameters.width, addBboxParameters.height, addBboxParameters.depth);
                            addBboxParameters.channels[i].points2D = projectedBoundingBox;
                        }
                        // set 2D bounding box(es)

                        annotationObjects.set(insertIndex, addBboxParameters);
                        classesBoundingBox.target().nextTrackId++;
                        for (var channel in channels) {
                            var camChannel = channels[channel];
                            annotationObjects.select(insertIndex, camChannel);
                        }

                    }

                    // else if (cFlag == true) {
                    //     var addBboxParameters = {
                    //         class: classesBoundingBox.targetName(),
                    //         x_img: -1,
                    //         y_img: -1,
                    //         width_img: -1,
                    //         height_img: -1,
                    //         x: (groundUpPoint.x + groundClickedPoint.x) / 2,
                    //         y: -(groundUpPoint.y + groundClickedPoint.y) / 2,
                    //         z: copyBbox.z,
                    //         width: copyBbox.width,
                    //         height: copyBbox.height,
                    //         depth: copyBbox.depth,
                    //         yaw: copyBbox.yaw,
                    //         org: {
                    //             x: (groundUpPoint.x + groundClickedPoint.x) / 2,
                    //             y: -(groundUpPoint.y + groundClickedPoint.y) / 2,
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
                    //         var channels = getChannelByPosition(annotationObjects.contents[selectionIndex]["x"], annotationObjects.contents[selectionIndex]["y"]);
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
                    //         var channels = getChannelByPosition(annotationObjects.contents[insertIndex]["x"], annotationObjects.contents[insertIndex]["y"]);
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
            if (clickedObjectIndex == -1) {
                annotationObjects.selectEmpty();
            }
        }
    };
    labelTool.cubeArray = [];
    labelTool.bboxIndexArray = [];
    labelTool.savedFrames = [];
    for (var i = 0; i < 3962; i++) {
        labelTool.cubeArray.push([]);
        labelTool.bboxIndexArray.push([]);
        labelTool.savedFrames.push([]);
    }

    guiBoundingBoxAnnotationMap = {
        "Vehicle": guiAnnotationClasses.add(parametersBoundingBox, "Vehicle").name("Vehicle"),
        "Truck": guiAnnotationClasses.add(parametersBoundingBox, "Truck").name("Truck"),
        "Motorcycle": guiAnnotationClasses.add(parametersBoundingBox, "Motorcycle").name("Motorcycle"),
        "Bicycle": guiAnnotationClasses.add(parametersBoundingBox, "Bicycle").name("Bicycle"),
        "Pedestrian": guiAnnotationClasses.add(parametersBoundingBox, "Pedestrian").name("Pedestrian"),
    };

    guiAnnotationClasses.domElement.id = 'class-picker';
    $('#class-picker ul li').css('background-color', '#353535');
    $($('#class-picker ul li')[0]).css('background-color', '#525252');
    $('#class-picker ul li').css('border-bottom', '0px');

    // 3D BB controls
    guiOptions.add(parameters, 'download').name("Download");
    guiOptions.add(parameters, 'bird_view').name("Birds-Eye-View");
    // guiOptions.add(parameters, 'setCameraView').name("Camera View");
    readYAMLFile(labelTool.workBlob + "/calibration.yml");
    loadPCDData(parameters);
    guiOptions.domElement.id = 'bounding-box-3d-menu';
    $('#bounding-box-3d-menu').css('width', '290px');
    $('#bounding-box-3d-menu ul li').css('background-color', '#353535');
    // add download Annotations button
    var downloadAnnotationsItem = $($('#bounding-box-3d-menu ul li')[0]);
    var downloadAnnotationsDivItem = downloadAnnotationsItem.children().first();
    downloadAnnotationsDivItem.wrap("<a href=\"\"></a>");

    guiOptions.open();
    var liItems = $("#class-picker ul li");
    liItems.each(function (i, item) {
        var propNamesArray = Object.getOwnPropertyNames(classesBoundingBox);
        var color = classesBoundingBox[propNamesArray[i]].color;
        var attribute = "20px solid" + ' ' + color;
        $(item).css("border-left", attribute);
        $(item).css('border-bottom', '0px');
    });

    $("#label-tool-log").val("1. Draw bounding box ");
    $("#label-tool-log").css("color", "#969696");
}
