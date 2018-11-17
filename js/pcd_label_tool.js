let camera, controls, scene, renderer;
let stats;
let cube;
let keyboard = new KeyboardState();
let guiAnnotationClasses = new dat.GUI();
let guiBoundingBoxAnnotationMap = {};
let guiOptions = new dat.GUI();
let folderBoundingBox3DArray = [];
let folderPositionArray = [];
let folderSizeArray = [];
let bboxFlag = true;
let clickFlag = false;
let clickedObjectIndex = -1;
let mouseDown = {x: 0, y: 0};
let mouseUp = {x: 0, y: 0};
let clickedPoint = THREE.Vector3();
let groundClickedPoint;
let groundPlaneArray = [];
let clickedPlaneArray = [];
let birdViewFlag = true;
let cls = 0;
let cFlag = false;
let rFlag = false;
let rotWorldMatrix;
let rotObjectMatrix;

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

let parameters = {
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
    bird_view: function () {
        setBirdsEyeView();
    },
    camera_view: function () {
        setCameraView();
    }
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

// Visualize 2d and 3d data
labelTool.onLoadData("PCD", function () {
    // remove previous loaded point clouds
    labelTool.removeObject("pointcloud");

    // ASCII pcd files
    let pcd_loader = new THREE.PCDLoader();
    let pcd_url = labelTool.workBlob + '/PCDPoints/all_scenes/' + labelTool.fileNames[labelTool.currentFileIndex] + '.pcd';
    pcd_loader.load(pcd_url, function (mesh) {
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

//read local calibration file.
function readYAMLFile(filename) {
    let rawFile = new XMLHttpRequest();
    let hasCameraExtrinsicMatrix = false;
    let cameraParameters = [];
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                let allText = rawFile.responseText;
                for (let i = 0; i < allText.split("\n").length; i++) {
                    if (allText.split("\n")[i].split(":")[0].trim() === 'CameraExtrinsicMat') {
                        hasCameraExtrinsicMatrix = true;
                    }
                    if (hasCameraExtrinsicMatrix && allText.split("\n")[i].split(":")[0].trim() === 'data') {
                        for (let m = 0; m < allText.split("\n")[i].split(":")[1].split("[")[1].split(",").length - 1; m++) {
                            let each_param = parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[m]);
                            cameraParameters.push(each_param)
                        }
                        while (cameraParameters.length < 12) {
                            i = i + 1;
                            for (let m = 0; m < allText.split("\n")[i].trim().split(",").length - 1; m++) {
                                let parameter = parseFloat(allText.split("\n")[i].trim().split(",")[m]);
                                cameraParameters.push(parameter);
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
    let annotations = labelTool.createAnnotations();
    let outputString = '';
    for (let i = 0; i < annotations.length; i++) {
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
    let fileName = labelTool.currentFileIndex.toString().padStart(6, '0');
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
    let bbox = parameters;
    let cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);//width, height, depth
    let color;
    if (parameters.fromFile === true) {
        if (labelTool.loadNuScenesLabels === true) {
            color = classesBoundingBox.content[parameters.class].color;
        } else {
            color = classesBoundingBox[parameters.class].color;
        }
    } else {
        color = classesBoundingBox.target().color;
    }

    let cubeMaterial = new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.4});
    let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(bbox.x, -bbox.y, bbox.z);
    cubeMesh.scale.set(bbox.width, bbox.height, bbox.depth);
    cubeMesh.rotation.z = bbox.yaw;
    cubeMesh.name = "cube-" + parameters.class.charAt(0) + parameters.trackId;
    scene.add(cubeMesh);
    labelTool.cubeArray[labelTool.currentFileIndex].push(cubeMesh);
    addBoundingBoxGui(bbox);
    return bbox;
}

function update2DBoundingBox(idx) {
    for (let channelObject in annotationObjects.contents[idx].channels) {
        if (annotationObjects.contents[idx].channels.hasOwnProperty(channelObject)) {
            let channelObj = annotationObjects.contents[idx].channels[channelObject];
            if (channelObj.channel !== '') {
                let x = annotationObjects.contents[idx]["x"];
                let y = annotationObjects.contents[idx]["y"];
                let z = annotationObjects.contents[idx]["z"];
                let width = annotationObjects.contents[idx]["width"];
                let height = annotationObjects.contents[idx]["height"];
                let depth = annotationObjects.contents[idx]["depth"];
                let channel = channelObj.channel;
                // TODO: exchange x with y because x should be longitudinal for correct projection
                //channelObj.projectedPoints = calculateProjectedBoundingBox(-y, z, -x, height, width, depth, channel);
                channelObj.projectedPoints = calculateProjectedBoundingBox(x, y, z, width, height, depth, channel);
                // remove previous drawn lines
                for (let lineObj in channelObj.lines) {
                    if (channelObj.lines.hasOwnProperty(lineObj)) {
                        let line = channelObj.lines[lineObj];
                        line.remove();
                    }
                }
                channelObj.lines = calculateLineSegments(channelObj);
            }
        }
    }
}

//register new bounding box
function addBoundingBoxGui(bbox) {
    let insertIndex = folderBoundingBox3DArray.length;
    let bb = guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
    folderBoundingBox3DArray.push(bb);

    let folderPosition = folderBoundingBox3DArray[insertIndex].addFolder('Position');
    let cubeX = folderPosition.add(bbox, 'x').min(-50).max(50).step(0.01).listen();
    let cubeY = folderPosition.add(bbox, 'y').min(-50).max(50).step(0.01).listen();
    let cubeZ = folderPosition.add(bbox, 'z').min(-3).max(10).step(0.01).listen();
    let cubeYaw = folderPosition.add(bbox, 'yaw').min(-Math.PI).max(Math.PI).step(0.05).listen();
    folderPosition.close();
    folderPositionArray.push(folderPosition);

    let folderSize = folderBoundingBox3DArray[insertIndex].addFolder('Size');
    let cubeW = folderSize.add(bbox, 'width').min(0).max(10).step(0.01).listen();
    let cubeH = folderSize.add(bbox, 'height').min(0).max(10).step(0.01).listen();
    let cubeD = folderSize.add(bbox, 'depth').min(0).max(10).step(0.01).listen();
    folderSize.close();
    folderSizeArray.push(folderSize);

    let textBoxTrackId = folderBoundingBox3DArray[insertIndex].add(bbox, 'trackId').min(0).step(1).name('Number');
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
        annotationObjects.contents[insertIndex]["x"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeY.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = value;
        annotationObjects.contents[insertIndex]["y"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeZ.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = value;
        annotationObjects.contents[insertIndex]["z"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeYaw.onChange(function (value) {
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z = value;
        // let rotatedObject = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotateZ(value);
        annotationObjects.contents[insertIndex]["yaw"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeW.onChange(function (value) {
        let newXPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = newXPos;
        bbox.x = newXPos;
        annotationObjects.contents[insertIndex]["x"] = newXPos;
        let newYPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = newYPos;
        bbox.y = -newYPos;
        annotationObjects.contents[insertIndex]["y"] = newYPos;

        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.x = value;
        annotationObjects.contents[insertIndex]["width"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeH.onChange(function (value) {
        let newXPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.sin(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.x = newXPos;
        bbox.x = newXPos;
        annotationObjects.contents[insertIndex]["x"] = newXPos;
        let newYPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y - (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y) * Math.cos(labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].rotation.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.y = newYPos;
        bbox.y = -newYPos;
        annotationObjects.contents[insertIndex]["y"] = newYPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.y = value;
        annotationObjects.contents[insertIndex]["height"] = value;
        update2DBoundingBox(insertIndex);
    });
    cubeD.onChange(function (value) {
        let newZPos = labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z + (value - labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z) / 2;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].position.z = newZPos;
        bbox.z = newZPos;
        labelTool.cubeArray[labelTool.currentFileIndex][insertIndex].scale.z = value;
        annotationObjects.contents[insertIndex]["depth"] = value;
        update2DBoundingBox(insertIndex);
    });
    let resetParameters = {
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
    folderBoundingBox3DArray[folderBoundingBox3DArray.length - 1].add(resetParameters, 'delete').name("Delete");
}

//reset cube patameter and position
function resetCube(index, num) {
    let reset_bbox = annotationObjects.contents[index];
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
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100000);

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
        camera.position.set(0, 0, 450);
        camera.up.set(0, 0, 1);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.rotateSpeed = 2.0;
    // controls.zoomSpeed = 0.3;
    // controls.panSpeed = 0.2;
    // controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = false;// default: true
    // controls.enableDamping = false;
    // controls.dampingFactor = 0.3;
    // controls.minDistance = 0.3;
    // controls.maxDistance = 0.3 * 100;
    // controls.noKey = true;
    // controls.enabled = false;
    // // controls.target.set(0, 0, 0);
    // controls.autoRotate = false;

    // front left
    // let yPos = 0.001;
    // let xPos = Math.tan(305 * Math.PI / 180) * yPos;
    if (birdViewFlag === false) {
        let pos = labelTool.camChannels[0].position;
        controls.object.position.set(-pos[1], pos[0] - labelTool.positionLidar[0], labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] - 0.0000001, pos[0] - labelTool.positionLidar[0] + 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward
    }
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
    //         copyBbox = annotationObjects.contents[copyBboxIndex];
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

    controls.update();
    stats.update();
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


//function calculateProjectedBoundingBox(pos_lat, pos_long, pos_vert, width, height, depth, channel) {
function calculateProjectedBoundingBox(xPos, yPos, zPos, width, height, depth, channel) {
    let idx = getChannelIndexByName(channel);
    // LIDAR uses long, lat, vert
    // pos_long = pos_long - labelTool.positionLidar[1];
    // pos_lat = pos_lat - labelTool.positionLidar[0];
    // pos_vert = pos_vert - labelTool.positionLidar[2];

    // xPos = xPos + labelTool.positionLidar[1];
    yPos = yPos - labelTool.positionLidar[0];
    // zPos = zPos - labelTool.positionLidar[2];


    // let projectedPoints = [];
    // let object3D = new THREE.Object3D();
    // let obj = scene.getObjectByName('prism');
    // object3D.position.x = obj.geometry.vertices[3].x;
    // object3D.position.y = obj.geometry.vertices[3].y;
    // object3D.position.z = obj.geometry.vertices[3].z;
    // object3D.position.x = -1.05;
    // object3D.position.y = 0.7;
    // object3D.position.z = 0.3;
    // object3D.updateWorldMatrix();
    // let point2D = new THREE.Vector3();
    // point2D.setFromMatrixPosition(object3D.matrixWorld);
    // // map to normalized device coordinate (NDC) space
    // point2D.project(camera);
    // let widthHalf = 0.5 * renderer.context.canvas.width;
    // let heightHalf = 0.5 * renderer.context.canvas.height;
    // // point2D.x = (point2D.x * widthHalf) + widthHalf;
    // // point2D.y = -(point2D.y * heightHalf) + heightHalf;
    // point2D.x = Math.round((point2D.x + 1) * widthHalf);
    // point2D.y = -Math.round((point2D.y - 1) * heightHalf);
    // projectedPoints.push({x: point2D.x, y: point2D.y});
    // test points
    // projectedPoints.push({x:50,y:50});
    // projectedPoints.push({x:60,y:40});
    // projectedPoints.push({x:70,y:40});
    // projectedPoints.push({x:60,y:50});
    // projectedPoints.push({x:50,y:30});
    // projectedPoints.push({x:60,y:20});
    // projectedPoints.push({x:70,y:20});
    // projectedPoints.push({x:60,y:30});
    // projectedPoints.push({x: 307, y: 434});
    // projectedPoints.push({x: 700, y: 448});
    // projectedPoints.push({x: -10, y: 440});
    // projectedPoints.push({x: -86, y: 428});
    // projectedPoints.push({x:50,y:50});
    // projectedPoints.push({x:60,y:40});
    // projectedPoints.push({x:70,y:40});
    // projectedPoints.push({x:60,y:50});
    // projectedPoints.push({x: 305, y: 534});
    // projectedPoints.push({x: 305, y: 534});
    // projectedPoints.push({x: 305, y: 534});
    // projectedPoints.push({x: 305, y: 534});
    // return projectedPoints;
    //------------------------------
    let cornerPoints = [];
    // cornerPoints.push(new THREE.Vector3(pos_long - height / 2, pos_lat - width / 2, pos_vert - depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long - height / 2, pos_lat + width / 2, pos_vert - depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long + height / 2, pos_lat + width / 2, pos_vert - depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long + height / 2, pos_lat - width / 2, pos_vert - depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long - height / 2, pos_lat - width / 2, pos_vert + depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long - height / 2, pos_lat + width / 2, pos_vert + depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long + height / 2, pos_lat + width / 2, pos_vert + depth / 2));
    // cornerPoints.push(new THREE.Vector3(pos_long + height / 2, pos_lat - width / 2, pos_vert + depth / 2));

    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos - depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos - height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos + width / 2, yPos + height / 2, zPos + depth / 2));
    cornerPoints.push(new THREE.Vector3(xPos - width / 2, yPos + height / 2, zPos + depth / 2));
    // // let projector = new THREE.Projector();
    let projectedPoints = [];
    for (let cornerPoint in cornerPoints) {
        // let object3D = new THREE.Object3D();
        // let cornerPointVector = cornerPoints[cornerPoint];
        // object3D.position.x = cornerPointVector.x;
        // object3D.position.y = cornerPointVector.y;
        // object3D.position.z = cornerPointVector.z;
        // object3D.updateWorldMatrix();
        // let point2D = new THREE.Vector3();
        // point2D.setFromMatrixPosition(object3D.matrixWorld);
        // point2D.project(camera);
        // let widthHalf = 0.5 * renderer.context.canvas.width;
        // let heightHalf = 0.5 * renderer.context.canvas.height;
        // point2D.x = (point2D.x * widthHalf) + widthHalf;
        // point2D.y = -(point2D.y * heightHalf) + heightHalf;
        //-------------
        // let point = cornerPoints[cornerPoint];
        // projectedPoints.push(projector.projectVector(point, camera));
        //-------------
        let point = cornerPoints[cornerPoint];
        let point3D = [-point.y, -point.x, point.z, 1];
        //let point3D = [point.x, point.y, point.z, 1];//long, lat, vert
        let projectionMatrix = labelTool.camChannels[idx].projectionMatrix;
        let point2D = matrixProduct(projectionMatrix, point3D);
        let windowX = point2D[0] / point2D[2];
        let windowY = point2D[1] / point2D[2];
        // windowX = Math.round(windowX / 2.5);
        // windowY = Math.round(windowY / 2.5);
        projectedPoints.push({x: windowX, y: windowY});
    }
    return projectedPoints;
}

function setCameraToChannel(channel) {
    let channelIdx = getChannelIndexByName(channel);
    let fieldOfView = labelTool.camChannels[channelIdx].fieldOfView;
    // scene.remove(camera);
    camera = new THREE.PerspectiveCamera(fieldOfView, window.innerWidth / window.innerHeight, 0.01, 100000);
    camera.up = new THREE.Vector3(0, 0, 1);
    // scene.add(camera);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = true;
    if (channel === labelTool.camChannels[0].channel) {
        // front left
        let pos = labelTool.camChannels[0].position;
        controls.object.position.set(-pos[1], pos[0] - labelTool.positionLidar[0], labelTool.positionLidar[2] - pos[2]);
        controls.target = new THREE.Vector3(-pos[1] + 0.0000001, pos[0] - labelTool.positionLidar[0] + 0.0000001, labelTool.positionLidar[2] - pos[2]);// look backward
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
    // camera.updateProjectionMatrix();
    controls.update();
}

function setCameraToBirdsEyeView() {
    camera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0, 2000);
    camera.position.set(0, 0, 450);
    camera.up.set(0, 1, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.update();
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
                let ray;
                if (birdViewFlag === false) {
                    let vector = new THREE.Vector3(mouseDown.x, mouseDown.y, 1);
                    vector.unproject(camera);
                    ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    ray = new THREE.Raycaster();
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
                        let material = new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            wireframe: false,
                            transparent: true,
                            opacity: 0.0
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
                        let label = annotationObjects.contents[clickedObjectIndex]["class"];
                        let trackId = annotationObjects.contents[clickedObjectIndex]["trackId"];
                        guiOptions.removeFolder(label + ' ' + trackId);
                        annotationObjects.remove(clickedObjectIndex);
                        annotationObjects.selectEmpty();
                    }
                } else if (birdViewFlag === true) {
                    clickedObjectIndex = -1;
                    groundPlaneArray = [];
                    let material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: false,
                        transparent: true,//default: true
                        opacity: 0.0//oefault 0.0
                    });
                    let geometry = new THREE.PlaneGeometry(200, 200);
                    let groundPlane = new THREE.Mesh(geometry, material);
                    groundPlane.position.x = 0;
                    groundPlane.position.y = 0;
                    groundPlane.position.z = -1;
                    groundPlaneArray.push(groundPlane);
                    let groundObject = ray.intersectObjects(groundPlaneArray);
                    groundClickedPoint = groundObject[0].point;
                }
            }
        }
    };

    canvas3D.onmouseup = function (ev) {
        if (ev.button == 0) {
            if (bboxFlag == true) {
                let rect = ev.target.getBoundingClientRect();
                mouseUp.x = ((ev.clientX - rect.left) / $("#canvas3d canvas").attr("width")) * 2 - 1;
                mouseUp.y = -((ev.clientY - rect.top) / $("#canvas3d canvas").attr("height")) * 2 + 1;
                let ray = undefined;
                if (birdViewFlag === false) {
                    let vector = new THREE.Vector3(mouseUp.x, mouseUp.y, 1);
                    vector.unproject(camera);
                    ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    ray = new THREE.Raycaster();
                    let mouse = new THREE.Vector2();
                    mouse.x = mouseUp.x;
                    mouse.y = mouseUp.y;
                    ray.setFromCamera(mouse, camera);
                }
                let clickedObjects = ray.intersectObjects(clickedPlaneArray);
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
                    for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                        let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                        meshObject.material.opacity = 0.4;
                    }
                    labelTool.cubeArray[labelTool.currentFileIndex][clickedObjectIndex].material.opacity = 0.8;
                } else {
                    // remove selection in camera view if 2d label exist
                    for (let i = 0; i < annotationObjects.contents.length; i++) {
                        if (annotationObjects.contents[i]["rect"] !== undefined) {
                            // removeBoundingBoxHighlight(i);
                            removeTextBox(i);
                        }
                    }

                    // remove selection in birds eye view (lower opacity)
                    for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
                        let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
                        meshObject.material.opacity = 0.4;
                    }

                }
                if (clickFlag === true) {
                    clickedPlaneArray = [];
                    let selectionIndex = labelTool.bboxIndexArray[labelTool.currentFileIndex][clickedObjectIndex];
                    // find out in which camera view the 3d object lies -> calculate angle
                    let channels = getChannelByPosition(annotationObjects.contents[selectionIndex]["x"], annotationObjects.contents[selectionIndex]["y"]);
                    for (let channel in channels) {
                        if (channels.hasOwnProperty(channel)) {
                            let camChannel = channels[channel];
                            annotationObjects.select(selectionIndex, camChannel);
                        }
                    }

                    clickFlag = false;
                } else if (groundPlaneArray.length === 1) {
                    let groundUpObject = ray.intersectObjects(groundPlaneArray);
                    let groundUpPoint = groundUpObject[0].point;

                    let trackId = -1;
                    let insertIndex;
                    if (annotationObjects.__selectionIndex === -1) {
                        trackId = classesBoundingBox[classesBoundingBox.targetName()].nextTrackId;
                        insertIndex = annotationObjects.__insertIndex;
                    } else {
                        trackId = annotationObjects.contents[annotationObjects.__selectionIndex]["trackId"];
                        insertIndex = annotationObjects.__selectionIndex;
                    }
                    // set channel based on 3d position of new bonding box
                    if (Math.abs(groundUpPoint.x - groundClickedPoint.x) > 0.1) {
                        let xPos = (groundUpPoint.x + groundClickedPoint.x) / 2;
                        let yPos = -(groundUpPoint.y + groundClickedPoint.y) / 2;
                        let zPos = 1;
                        let addBboxParameters = {
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
                                z: zPos,
                                width: Math.abs(groundUpPoint.x - groundClickedPoint.x),
                                height: Math.abs(groundUpPoint.y - groundClickedPoint.y),
                                depth: 1.0,
                                yaw: 0,
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
                            }],
                            fromFile: false
                        };
                        // set channel
                        let channels = getChannelByPosition(xPos, yPos);
                        for (let i = 0; i < channels.length; i++) {
                            let channel = channels[i];
                            addBboxParameters.channels[i].channel = channel;
                            // set camera to current channel
                            setCameraToChannel(channel);
                            let projectedBoundingBox = calculateProjectedBoundingBox(xPos, yPos, zPos, addBboxParameters.width, addBboxParameters.height, addBboxParameters.depth, channel);
                            setCameraToBirdsEyeView();
                            addBboxParameters.channels[i].projectedPoints = projectedBoundingBox;
                        }
                        // calculate line segments
                        for (let i = 0; i < addBboxParameters.channels.length; i++) {
                            let channelObj = addBboxParameters.channels[i];
                            addBboxParameters.channels[i]["lines"] = calculateLineSegments(channelObj);
                        }

                        annotationObjects.set(insertIndex, addBboxParameters);
                        annotationObjects.__insertIndex++;
                        classesBoundingBox.target().nextTrackId++;
                        for (let channel in channels) {
                            if (channels.hasOwnProperty(channel)) {
                                let camChannel = channels[channel];
                                annotationObjects.select(insertIndex, camChannel);
                            }
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
            if (clickedObjectIndex === -1) {
                annotationObjects.selectEmpty();
            }
        }
    };
    labelTool.cubeArray = [];
    labelTool.bboxIndexArray = [];
    labelTool.savedFrames = [];
    for (let i = 0; i < 3962; i++) {
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
    let classPickerElem = $('#class-picker ul li');
    classPickerElem.css('background-color', '#353535');
    $(classPickerElem[0]).css('background-color', '#525252');
    classPickerElem.css('border-bottom', '0px');

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
    let downloadAnnotationsItem = $($('#bounding-box-3d-menu ul li')[0]);
    let downloadAnnotationsDivItem = downloadAnnotationsItem.children().first();
    downloadAnnotationsDivItem.wrap("<a href=\"\"></a>");

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
