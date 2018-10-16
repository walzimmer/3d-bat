/* var canvas2D,stats,image_2d,ctx;*/
var camera, controls, scene, renderer;
var cube;
var keyboard = new KeyboardState();
var numbertag_list = [];
var gui_tag = [];
var gui = new dat.GUI();
var bb1 = [];
var folder_position = [];
var folder_size = [];
var bbox_flag = true;
var click_flag = false;
var click_object_index = 0;
var mouse_down = {x: 0, y: 0};
var mouse_up = {x: 0, y: 0};
var click_point = THREE.Vector3();
var ground_click_point;
var ground_plane_array = [];
var click_plane_array = [];
var attribute = ["car", "pedestrian", "motorbike", "bus", "truck", "cyclist", "train", "obstacle", "stop_signal", "wait_signal", "gosignal"];
var input_filename = 'input';
var now_flame = 0;
var ground_mesh;
var bird_view_flag = true;
var move_flag = false;
var cls = 0;
var c_flag = false;
var r_flag = false;
var copy_box;
var rotation_bbox_index = -1;
var copy_bbox_index = -1;

var parameters = {
    save: function () {
        save();
    },
    i: -1,
    flame: now_flame,
    image_checkbox: true,
    hold_bbox_flag: false,
    bird_view: function () {
        bird_view();
    },
    camera_view: function () {
        camera_view();
    },
    update_database: function () {
        labelTool.archiveWorkFiles();
    }
};

labelTool.onInitialize("PCD", function () {
    if (!Detector.webgl) Detector.addGetWebGLMessage();
    init();
    animate();
});

// Visualize 2d and 3d data
labelTool.onLoadData("PCD", function () {
    parameters.flame = labelTool.curFile;
    $("#jpeg-label-canvas").show();
    changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);

    // var obj_loader = new THREE.OBJLoader();
    // var obj_url = labelTool.workBlob + '/PCDPoints/' + labelTool.fileNames[labelTool.curFile] + '.obj';
    // obj_loader.load(obj_url, function (mesh) {
    //     scene.add(mesh);
    //     ground_mesh = mesh;
    //     labelTool.hasPCD = true;
    // });

    // ASCII pcd files
    var pcd_loader = new THREE.PCDLoader();
    // var pcd_url = labelTool.workBlob + '/PCDPoints/' + labelTool.fileNames[labelTool.curFile] + '.pcd';
    var pcd_url = labelTool.workBlob+'/../../datasets/nuscenes/nuscenes_teaser_meta_v1/samples/LIDAR_TOP_ASCII/' + labelTool.fileNames[labelTool.curFile] + '.pcd';
    // [DONE]: convert all binary files to object ascii files
    // var pcd_url = labelTool.workBlob + '/PCDPoints/' + labelTool.fileNames[labelTool.curFile] + '.obj';
    console.log(pcd_url);
    pcd_loader.load(pcd_url, function (mesh) {
        scene.add(mesh);
        ground_mesh = mesh;
        labelTool.hasPCD = true;
    });

    if (parameters.image_checkbox == false) {
        $("#jpeg-label-canvas").hide();
    }
});

bboxes.onSelect(function (newIndex, oldIndex) {
    click_plane_array = [];
    for (var i = 0; i < bboxFolders.length; i++) {
        if (bboxFolders[i] != undefined) {
            bboxFolders[i].close();
        }
    }
    if (bboxFolders[newIndex] != undefined) {
        bboxFolders[newIndex].open();
    }
    if (folder_position[newIndex] != undefined) {
        folder_position[newIndex].open();
    }
    if (folder_size[newIndex] != undefined) {
        folder_size[newIndex].open();
    }
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
}

//read local calibration file.
function readYAMLFile(filename) {
    var rawFile = new XMLHttpRequest();
    var CameraEx_flag = false;
    var Camera_param = [];
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                for (var i = 0; i < allText.split("\n").length; i++) {
                    if (allText.split("\n")[i].split(":")[0].trim() == 'CameraExtrinsicMat') {
                        CameraEx_flag = true;
                    }
                    if (CameraEx_flag && allText.split("\n")[i].split(":")[0].trim() == 'data') {
                        for (m = 0; m < allText.split("\n")[i].split(":")[1].split("[")[1].split(",").length - 1; m++) {
                            var each_param = parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[m])
                            Camera_param.push(each_param)
                        }
                        while (Camera_param.length < 12) {
                            i = i + 1
                            for (m = 0; m < allText.split("\n")[i].trim().split(",").length - 1; m++) {
                                var each_param = parseFloat(allText.split("\n")[i].trim().split(",")[m])
                                Camera_param.push(each_param)
                            }
                        }
                        labelTool.CameraExMat = [[parseFloat(Camera_param[0]), parseFloat(Camera_param[1]), parseFloat(Camera_param[2]), parseFloat(Camera_param[3])],
                            [parseFloat(Camera_param[4]), parseFloat(Camera_param[5]), parseFloat(Camera_param[6]), parseFloat(Camera_param[7])],
                            [parseFloat(Camera_param[8]), parseFloat(Camera_param[9]), parseFloat(Camera_param[10]), parseFloat(Camera_param[11])],
                            [0, 0, 0, 1]];
                        CameraEx_flag = false;
                        if (isNaN(invMax(labelTool.CameraExMat)[0][0]) == true) {
                            alert("calibration parameter is wrong");
                            labelTool.CameraExMat = [[1, 0, 0, 0],
                                [parseFloat(Camera_param[4]), parseFloat(Camera_param[5]), parseFloat(Camera_param[6]), parseFloat(Camera_param[7])],
                                [parseFloat(Camera_param[8]), parseFloat(Camera_param[9]), parseFloat(Camera_param[10]), parseFloat(Camera_param[11])],
                                [0, 0, 0, 1]];
                        }
                        break
                    }
                }
            }
        }
    }
    rawFile.send(null);
}

//calicurate inverce matrix
function invMax(inMax) {
    det = (inMax[0][0] * inMax[1][1] * inMax[2][2] * inMax[3][3]) + (inMax[0][0] * inMax[1][2] * inMax[2][3] * inMax[3][1]) + (inMax[0][0] * inMax[1][3] * inMax[2][1] * inMax[3][2])
        - (inMax[0][0] * inMax[1][3] * inMax[2][2] * inMax[3][1]) - (inMax[0][0] * inMax[1][2] * inMax[2][1] * inMax[3][3]) - (inMax[0][0] * inMax[1][1] * inMax[2][3] * inMax[3][2])
        - (inMax[0][1] * inMax[1][0] * inMax[2][2] * inMax[3][3]) - (inMax[0][2] * inMax[1][0] * inMax[2][3] * inMax[3][1]) - (inMax[0][3] * inMax[1][0] * inMax[2][1] * inMax[3][2])
        + (inMax[0][3] * inMax[1][0] * inMax[2][2] * inMax[3][1]) + (inMax[0][2] * inMax[1][0] * inMax[2][1] * inMax[3][3]) + (inMax[0][1] * inMax[1][0] * inMax[2][3] * inMax[3][2])
        + (inMax[0][1] * inMax[1][2] * inMax[2][0] * inMax[3][3]) + (inMax[0][2] * inMax[1][3] * inMax[2][0] * inMax[3][1]) + (inMax[0][3] * inMax[1][1] * inMax[2][0] * inMax[3][2])
        - (inMax[0][3] * inMax[1][2] * inMax[2][0] * inMax[3][1]) - (inMax[0][2] * inMax[1][1] * inMax[2][0] * inMax[3][3]) - (inMax[0][1] * inMax[1][3] * inMax[2][0] * inMax[3][2])
        - (inMax[0][1] * inMax[1][2] * inMax[2][3] * inMax[3][0]) - (inMax[0][2] * inMax[1][3] * inMax[2][1] * inMax[3][0]) - (inMax[0][3] * inMax[1][1] * inMax[2][2] * inMax[3][0])
        + (inMax[0][3] * inMax[1][2] * inMax[2][1] * inMax[3][0]) + (inMax[0][2] * inMax[1][1] * inMax[2][3] * inMax[3][0]) + (inMax[0][1] * inMax[1][3] * inMax[2][2] * inMax[3][0]);
    var inv00 = (inMax[1][1] * inMax[2][2] * inMax[3][3] + inMax[1][2] * inMax[2][3] * inMax[3][1] + inMax[1][3] * inMax[2][1] * inMax[3][2] - inMax[1][3] * inMax[2][2] * inMax[3][1] - inMax[1][2] * inMax[2][1] * inMax[3][3] - inMax[1][1] * inMax[2][3] * inMax[3][2]) / det;
    var inv01 = (-inMax[0][1] * inMax[2][2] * inMax[3][3] - inMax[0][2] * inMax[2][3] * inMax[3][1] - inMax[0][3] * inMax[2][1] * inMax[3][2] + inMax[0][3] * inMax[2][2] * inMax[3][1] + inMax[0][2] * inMax[2][1] * inMax[3][3] + inMax[0][1] * inMax[2][3] * inMax[3][2]) / det;
    var inv02 = (inMax[0][1] * inMax[1][2] * inMax[3][3] + inMax[0][2] * inMax[1][3] * inMax[3][1] + inMax[0][3] * inMax[1][1] * inMax[3][2] - inMax[0][3] * inMax[1][2] * inMax[3][1] - inMax[0][2] * inMax[1][1] * inMax[3][3] - inMax[0][1] * inMax[1][3] * inMax[3][2]) / det;
    var inv03 = (-inMax[0][1] * inMax[1][2] * inMax[2][3] - inMax[0][2] * inMax[1][3] * inMax[2][1] - inMax[0][3] * inMax[1][1] * inMax[2][2] + inMax[0][3] * inMax[1][2] * inMax[2][1] + inMax[0][2] * inMax[1][1] * inMax[2][3] + inMax[0][1] * inMax[1][3] * inMax[2][2]) / det;
    var inv10 = (-inMax[1][0] * inMax[2][2] * inMax[3][3] - inMax[1][2] * inMax[2][3] * inMax[3][0] - inMax[1][3] * inMax[2][0] * inMax[3][2] + inMax[1][3] * inMax[2][2] * inMax[3][0] + inMax[1][2] * inMax[2][0] * inMax[3][3] + inMax[1][0] * inMax[2][3] * inMax[3][2]) / det;
    var inv11 = (inMax[0][0] * inMax[2][2] * inMax[3][3] + inMax[0][2] * inMax[2][3] * inMax[3][0] + inMax[0][3] * inMax[2][0] * inMax[3][2] - inMax[0][3] * inMax[2][2] * inMax[3][0] - inMax[0][2] * inMax[2][0] * inMax[3][3] - inMax[0][0] * inMax[2][3] * inMax[3][2]) / det;
    var inv12 = (-inMax[0][0] * inMax[1][2] * inMax[3][3] - inMax[0][2] * inMax[1][3] * inMax[3][0] - inMax[0][3] * inMax[1][0] * inMax[3][2] + inMax[0][3] * inMax[1][2] * inMax[3][0] + inMax[0][2] * inMax[1][0] * inMax[3][3] + inMax[0][0] * inMax[1][3] * inMax[3][2]) / det;
    var inv13 = (inMax[0][0] * inMax[1][2] * inMax[2][3] + inMax[0][2] * inMax[1][3] * inMax[2][0] + inMax[0][3] * inMax[1][0] * inMax[2][2] - inMax[0][3] * inMax[1][2] * inMax[2][0] - inMax[0][2] * inMax[1][0] * inMax[2][3] - inMax[0][0] * inMax[1][3] * inMax[2][2]) / det;
    var inv20 = (inMax[1][0] * inMax[2][1] * inMax[3][3] + inMax[1][1] * inMax[2][3] * inMax[3][0] + inMax[1][3] * inMax[2][0] * inMax[3][1] - inMax[1][3] * inMax[2][1] * inMax[3][0] - inMax[1][1] * inMax[2][0] * inMax[3][3] - inMax[1][0] * inMax[2][3] * inMax[3][1]) / det;
    var inv21 = (-inMax[0][0] * inMax[2][1] * inMax[3][3] - inMax[0][1] * inMax[2][3] * inMax[3][0] - inMax[0][3] * inMax[2][0] * inMax[3][1] + inMax[0][3] * inMax[2][1] * inMax[3][0] + inMax[0][1] * inMax[2][0] * inMax[3][3] + inMax[0][0] * inMax[2][3] * inMax[3][1]) / det;
    var inv22 = (inMax[0][0] * inMax[1][1] * inMax[3][3] + inMax[0][1] * inMax[1][3] * inMax[3][0] + inMax[0][3] * inMax[1][0] * inMax[3][1] - inMax[0][3] * inMax[1][1] * inMax[3][0] - inMax[0][1] * inMax[1][0] * inMax[3][3] - inMax[0][0] * inMax[1][3] * inMax[3][1]) / det;
    var inv23 = (-inMax[0][0] * inMax[1][1] * inMax[2][3] - inMax[0][1] * inMax[1][3] * inMax[2][0] - inMax[0][3] * inMax[1][0] * inMax[2][1] + inMax[0][3] * inMax[1][1] * inMax[2][0] + inMax[0][1] * inMax[1][0] * inMax[2][3] + inMax[0][0] * inMax[1][3] * inMax[2][1]) / det;
    var inv30 = (-inMax[1][0] * inMax[2][1] * inMax[3][2] - inMax[1][1] * inMax[2][2] * inMax[3][0] - inMax[1][2] * inMax[2][0] * inMax[3][1] + inMax[1][2] * inMax[2][1] * inMax[3][0] + inMax[1][1] * inMax[2][0] * inMax[3][2] + inMax[1][0] * inMax[2][2] * inMax[3][1]) / det;
    var inv31 = (inMax[0][0] * inMax[2][1] * inMax[3][2] + inMax[0][1] * inMax[2][2] * inMax[3][0] + inMax[0][2] * inMax[2][0] * inMax[3][1] - inMax[0][2] * inMax[2][1] * inMax[3][0] - inMax[0][1] * inMax[2][0] * inMax[3][2] - inMax[0][0] * inMax[2][2] * inMax[3][1]) / det;
    var inv32 = (-inMax[0][0] * inMax[1][1] * inMax[3][2] - inMax[0][1] * inMax[1][2] * inMax[3][0] - inMax[0][2] * inMax[1][0] * inMax[3][1] + inMax[0][2] * inMax[1][1] * inMax[3][0] + inMax[0][1] * inMax[1][0] * inMax[3][2] + inMax[0][0] * inMax[1][2] * inMax[3][1]) / det;
    var inv33 = (inMax[0][0] * inMax[1][1] * inMax[2][2] + inMax[0][1] * inMax[1][2] * inMax[2][0] + inMax[0][2] * inMax[1][0] * inMax[2][1] - inMax[0][2] * inMax[1][1] * inMax[2][0] - inMax[0][1] * inMax[1][0] * inMax[2][2] - inMax[0][0] * inMax[1][2] * inMax[2][1]) / det;

    inv = [[inv00, inv01, inv02, inv03], [inv10, inv11, inv12, inv13], [inv20, inv21, inv22, inv23], [inv30, inv31, inv32, inv33]]
    return inv;
}

//calicurate prod of matrix
function MaxProd(inMax1, inMax2) {
    var outMax = [0, 0, 0, 0];
    outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
    outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
    outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
    outMax[3] = inMax1[3][0] * inMax2[0] + inMax1[3][1] * inMax2[1] + inMax1[3][2] * inMax2[2] + inMax1[3][3] * inMax2[3];
    return outMax
}

//load pcd data and image data
function data_load() {
    labelTool.showData;
}

//save data
function save() {
    ground_mesh.visible = false;
    labelTool.changeFrame(labelTool.curFile)
    alert("save!!");
}

//change camera position to bird view position
function bird_view() {
    bird_view_flag = true;
    setCamera();
}

//change camera position to initial position
function camera_view() {
    bird_view_flag = false;
    setCamera();
}

//add new bounding box
bboxes.onAdd("PCD", function (index, cls, read_parameters) {
    var num = index;
    var bbox = read_parameters;//labelTool.getPCDBBox(num);
    labelTool.bbox_index.push(index.toString())
    var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);
    var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x008866, wireframe: true});
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(bbox.x, -bbox.y, bbox.z);
    cube.scale.set(bbox.width, bbox.height, bbox.depth);
    cube.rotation.z = bbox.yaw;
    scene.add(cube);
    labelTool.cube_array.push(cube);
    addbbox_gui(bbox, num);
    return bbox;
});

//register now bounding box
function addbbox_gui(bbox, num) {
    var index = bb1.length
    var bb = gui.addFolder('BoundingBox' + String(num));
    bb1.push(bb);
    var folder1 = bb1[index].addFolder('Position');
    var cubeX = folder1.add(bbox, 'x').min(-50).max(50).step(0.01).listen();
    var cubeY = folder1.add(bbox, 'y').min(-30).max(30).step(0.01).listen();
    var cubeZ = folder1.add(bbox, 'z').min(-3).max(10).step(0.01).listen();
    var cubeYaw = folder1.add(bbox, 'yaw').min(-Math.PI).max(Math.PI).step(0.05).listen();
    folder1.close();
    folder_position.push(folder1);
    var folder2 = bb1[index].addFolder('Size');
    var cubeW = folder2.add(bbox, 'width').min(0).max(10).step(0.01).listen();
    var cubeH = folder2.add(bbox, 'height').min(0).max(10).step(0.01).listen();
    var cubeD = folder2.add(bbox, 'depth').min(0).max(10).step(0.01).listen();
    folder2.close();
    folder_size.push(folder2);
    cubeX.onChange(function (value) {
        labelTool.cube_array[index].position.x = value;
    });
    cubeY.onChange(function (value) {
        labelTool.cube_array[index].position.y = -value;
    });
    cubeZ.onChange(function (value) {
        labelTool.cube_array[index].position.z = value;
    });
    cubeYaw.onChange(function (value) {
        labelTool.cube_array[index].rotation.z = value;
    });
    cubeW.onChange(function (value) {
        labelTool.cube_array[index].position.x = labelTool.cube_array[index].position.x + (value - labelTool.cube_array[index].scale.x) * Math.cos(labelTool.cube_array[index].rotation.z) / 2;
        bbox.x = labelTool.cube_array[index].position.x;
        labelTool.cube_array[index].position.y = labelTool.cube_array[index].position.y + (value - labelTool.cube_array[index].scale.x) * Math.sin(labelTool.cube_array[index].rotation.z) / 2;
        bbox.y = -labelTool.cube_array[index].position.y;
        labelTool.cube_array[index].scale.x = value;
    });
    cubeH.onChange(function (value) {
        labelTool.cube_array[index].position.x = labelTool.cube_array[index].position.x + (value - labelTool.cube_array[index].scale.y) * Math.sin(labelTool.cube_array[index].rotation.z) / 2;
        bbox.x = labelTool.cube_array[index].position.x;
        labelTool.cube_array[index].position.y = labelTool.cube_array[index].position.y - (value - labelTool.cube_array[index].scale.y) * Math.cos(labelTool.cube_array[index].rotation.z) / 2;
        bbox.y = -labelTool.cube_array[index].position.y;
        labelTool.cube_array[index].scale.y = value;
    });
    cubeD.onChange(function (value) {
        labelTool.cube_array[index].position.z = labelTool.cube_array[index].position.z + (value - labelTool.cube_array[index].scale.z) / 2;
        bbox.z = labelTool.cube_array[index].position.z;
        labelTool.cube_array[index].scale.z = value;
    });
    var reset_parameters = {
        reset: function () {
            resetCube(num, index);
        },
        delete: function () {
            gui.removeFolder('BoundingBox' + String(num));
            labelTool.cube_array[index].visible = false;
            bboxes.remove(num, "PCD");
            labelTool.changeFrame(labelTool.curFile)
            //bboxes.selectEmpty();
        }
    };

    //numbertag_list.push(num);
    //labeltag = bb1[num].add( bbox, 'label' ,attribute).name("Attribute");
    bb1[bb1.length - 1].add(reset_parameters, 'reset').name("Reset");
    d = bb1[bb1.length - 1].add(reset_parameters, 'delete').name("Delete");
}

//reset cube patameter and position
function resetCube(index, num) {
    var reset_bbox = bboxes.get(index, "PCD");
    reset_bbox.x = reset_bbox.org.x;
    reset_bbox.y = reset_bbox.org.y;
    reset_bbox.z = reset_bbox.org.z;
    reset_bbox.yaw = reset_bbox.org.yaw;
    reset_bbox.width = reset_bbox.org.width;
    reset_bbox.height = reset_bbox.org.height;
    reset_bbox.depth = reset_bbox.org.depth;
    labelTool.cube_array[num].position.x = reset_bbox.x;
    labelTool.cube_array[num].position.y = -reset_bbox.y;
    labelTool.cube_array[num].position.z = reset_bbox.z;
    labelTool.cube_array[num].rotation.z = reset_bbox.yaw;
    labelTool.cube_array[num].scale.x = reset_bbox.width;
    labelTool.cube_array[num].scale.y = reset_bbox.height;
    labelTool.cube_array[num].scale.z = reset_bbox.depth;
}

//change window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//set camera type
function setCamera() {
    if (bird_view_flag == false) {
        camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 10000);
        camera.position.set(0, 0, 0.5);
        camera.up.set(0, 0, 1);
    } else {
        camera = new THREE.OrthographicCamera(-40, 40, 20, -20, 0, 2000);
        camera.position.set(0, 0, 450);
        camera.up.set(0, 0, 1);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    controls.target.set(1, 0, 0);
    controls.update();

}

//drow animation
function animate() {
    requestAnimationFrame(animate);
    keyboard.update();
    if (keyboard.down("shift")) {
        controls.enabled = true;
        bbox_flag = false;
    }

    if (keyboard.up("shift")) {
        controls.enabled = false;
        bbox_flag = true;
    }

    if (keyboard.down("alt")) {
        move_flag = true;
    }
    if (keyboard.up("alt")) {
        move_flag = false;
    }
    if (keyboard.down("C")) {
        r_flag = false;
        if (c_flag == false) {
            if (bboxes.exists(bboxes.getTargetIndex(), "PCD") == true) {
                copy_bbox_index = bboxes.getTargetIndex()
                copy_bbox = bboxes.get(copy_bbox_index, "PCD");
                c_flag = true
            }
        }
        else {
            copy_bbox_index = -1
            c_flag = false;
        }
    }
    if (keyboard.down("R")) {
        c_flag = false;
        if (r_flag == false) {
            if (bboxes.exists(bboxes.getTargetIndex(), "PCD") == true) {
                rotation_bbox_index = bboxes.getTargetIndex()
                r_flag = true;
            }
        }
        else {
            rotation_bbox_index = -1
            r_flag = false;
        }
    }

    controls.update();
    stats.update();
    if (bboxes.getTargetIndex() != rotation_bbox_index) {
        r_flag = false;
    }
    for (var i = 0; i < labelTool.cube_array.length; i++) {
        if (labelTool.bbox_index[i] == bboxes.getTargetIndex()) {
            bb1[i].open();
            folder_position[i].open();
            folder_size[i].open();
        }
        else {
            bb1[i].close();
        }
        if (i == labelTool.bbox_index.lastIndexOf(copy_bbox_index.toString()) && c_flag == true) {
            labelTool.cube_array[i].material.color.setHex(0xffff00);
        }
        else if (bb1[i].closed == false) {
            if (i == labelTool.bbox_index.lastIndexOf(rotation_bbox_index.toString()) && r_flag == true) {
                labelTool.cube_array[i].material.color.setHex(0xff8000);
            }
            else {
                labelTool.cube_array[i].material.color.setHex(0xff0000);
                folder_position[i].open();
                folder_size[i].open();
            }
        }

        else if (bb1[i].closed == true) {
            labelTool.cube_array[i].material.color.setHex(0x008866);
        }
    }
    renderer.render(scene, camera);
}

function init() {
    scene = new THREE.Scene();
    var axisHelper = new THREE.AxisHelper(0.1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    setCamera();

    var canvas3D = document.getElementById('canvas3d');
    canvas3D.appendChild(renderer.domElement);
    stats = new Stats();
    canvas3D.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize, false)
    window.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    window.onmousedown = function (ev) {
        if (bbox_flag == true) {
            if (ev.target == renderer.domElement) {
                var rect = ev.target.getBoundingClientRect();
                mouse_down.x = ((ev.clientX - rect.left) / window.innerWidth) * 2 - 1;
                mouse_down.y = -((ev.clientY - rect.top) / window.innerHeight) * 2 + 1;
                if (bird_view_flag == false) {
                    var vector = new THREE.Vector3(mouse_down.x, mouse_down.y, 1);
                    vector.unproject(camera);
                    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    var ray = new THREE.Raycaster();
                    var mouse = new THREE.Vector2();
                    mouse.x = mouse_down.x;
                    mouse.y = mouse_down.y;
                    ray.setFromCamera(mouse, camera);
                }
                var click_object = ray.intersectObjects(labelTool.cube_array);
                if (click_object.length > 0) {
                    click_object_index = labelTool.cube_array.indexOf(click_object[0].object);
                    if (ev.button == 0) {
                        click_flag = true;
                        click_point = click_object[0].point;
                        click_cube = labelTool.cube_array[click_object_index];
                        var material = new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            wireframe: false,
                            transparent: true,
                            opacity: 0.0
                        });
                        var geometry = new THREE.PlaneGeometry(200, 200);
                        var click_plane = new THREE.Mesh(geometry, material);
                        click_plane.position.x = click_point.x;
                        click_plane.position.y = click_point.y;
                        click_plane.position.z = click_point.z;
                        var normal = click_object[0].face;
                        if ([normal.a, normal.b, normal.c].toString() == [6, 3, 2].toString() || [normal.a, normal.b, normal.c].toString() == [7, 6, 2].toString()) {
                            click_plane.rotation.x = Math.PI / 2;
                            click_plane.rotation.y = labelTool.cube_array[click_object_index].rotation.z;
                        }
                        else if ([normal.a, normal.b, normal.c].toString() == [6, 7, 5].toString() || [normal.a, normal.b, normal.c].toString() == [4, 6, 5].toString()) {
                            click_plane.rotation.x = -Math.PI / 2;
                            click_plane.rotation.y = -Math.PI / 2 - labelTool.cube_array[click_object_index].rotation.z;
                        }
                        else if ([normal.a, normal.b, normal.c].toString() == [0, 2, 1].toString() || [normal.a, normal.b, normal.c].toString() == [2, 3, 1].toString()) {
                            click_plane.rotation.x = Math.PI / 2;
                            click_plane.rotation.y = Math.PI / 2 + labelTool.cube_array[click_object_index].rotation.z;
                        }
                        else if ([normal.a, normal.b, normal.c].toString() == [5, 0, 1].toString() || [normal.a, normal.b, normal.c].toString() == [4, 5, 1].toString()) {
                            click_plane.rotation.x = -Math.PI / 2;
                            click_plane.rotation.y = -labelTool.cube_array[click_object_index].rotation.z;
                        }
                        else if ([normal.a, normal.b, normal.c].toString() == [3, 6, 4].toString() || [normal.a, normal.b, normal.c].toString() == [1, 3, 4].toString()) {
                            click_plane.rotation.y = -Math.PI
                        }
                        scene.add(click_plane);
                        click_plane_array.push(click_plane);
                    }
                    else if (ev.button == 2) {
                        labelTool.cube_array[click_object_index].visible = false;
                        num1 = labelTool.bbox_index[click_object_index];
                        gui.removeFolder('BoundingBox' + String(num1));
                        bboxes.remove(num1, "PCD");
                        labelTool.changeFrame(labelTool.curFile)
                    }
                } else if (bird_view_flag == true) {
                    ground_plane_array = [];
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: false,
                        transparent: true,
                        opacity: 0.0
                    });
                    var geometry = new THREE.PlaneGeometry(200, 200);
                    var ground_plane = new THREE.Mesh(geometry, material);
                    ground_plane.position.x = 0;
                    ground_plane.position.y = 0;
                    ground_plane.position.z = -1;
                    ground_plane_array.push(ground_plane);
                    var ground_object = ray.intersectObjects(ground_plane_array);
                    ground_click_point = ground_object[0].point;
                }
            }
        }
    }

    window.onmouseup = function (ev) {
        if (ev.button == 0) {
            if (bbox_flag == true) {
                var rect = ev.target.getBoundingClientRect();
                mouse_up.x = ((ev.clientX - rect.left) / window.innerWidth) * 2 - 1;
                mouse_up.y = -((ev.clientY - rect.top) / window.innerHeight) * 2 + 1;
                if (bird_view_flag == false) {
                    var vector = new THREE.Vector3(mouse_up.x, mouse_up.y, 1);
                    vector.unproject(camera);
                    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                } else {
                    var ray = new THREE.Raycaster();
                    var mouse = new THREE.Vector2();
                    mouse.x = mouse_up.x;
                    mouse.y = mouse_up.y;
                    ray.setFromCamera(mouse, camera);
                }
                var click_object = ray.intersectObjects(click_plane_array);
                if (click_object.length > 0 && bb1[click_object_index].closed == false) {
                    var click_box = bboxes.get(labelTool.bbox_index[click_object_index], "PCD");
                    var drag_vector = {
                        x: click_object[0].point.x - click_point.x,
                        y: click_object[0].point.y - click_point.y,
                        z: click_object[0].point.z - click_point.z
                    };
                    var yaw_drag_vector = {
                        x: drag_vector.x * Math.cos(-labelTool.cube_array[click_object_index].rotation.z) - drag_vector.y * Math.sin(-labelTool.cube_array[click_object_index].rotation.z),
                        y: drag_vector.x * Math.sin(-labelTool.cube_array[click_object_index].rotation.z) + drag_vector.y * Math.cos(-labelTool.cube_array[click_object_index].rotation.z),
                        z: drag_vector.z
                    };
                    var judge_click_point = {
                        x: (click_point.x - labelTool.cube_array[click_object_index].position.x) * Math.cos(-labelTool.cube_array[click_object_index].rotation.z) - (click_point.y - labelTool.cube_array[click_object_index].position.y) * Math.sin(-labelTool.cube_array[click_object_index].rotation.z),
                        y: (click_point.x - labelTool.cube_array[click_object_index].position.x) * Math.sin(-labelTool.cube_array[click_object_index].rotation.z) + (click_point.y - labelTool.cube_array[click_object_index].position.y) * Math.cos(-labelTool.cube_array[click_object_index].rotation.z)
                    };
                    if (move_flag == true) {
                        click_box.x = drag_vector.x + click_box.x;
                        click_box.y = -drag_vector.y + click_box.y;
                        click_box.z = drag_vector.z + click_box.z;
                    }
                    else if (r_flag == true) {
                        click_box.yaw = click_box.yaw + Math.atan2(yaw_drag_vector.y, yaw_drag_vector.x) / (2 * Math.PI);
                    }
                    else {
                        click_box.width = judge_click_point.x * yaw_drag_vector.x / Math.abs(judge_click_point.x) + click_box.width;
                        click_box.x = drag_vector.x / 2 + click_box.x;
                        click_box.height = judge_click_point.y * yaw_drag_vector.y / Math.abs(judge_click_point.y) + click_box.height;
                        click_box.y = -drag_vector.y / 2 + click_box.y;
                        click_box.depth = (click_point.z - labelTool.cube_array[click_object_index].position.z) * drag_vector.z / Math.abs((click_point.z - labelTool.cube_array[click_object_index].position.z)) + click_box.depth;
                        click_box.z = drag_vector.z / 2 + click_box.z;
                    }
                    labelTool.cube_array[click_object_index].position.x = click_box.x;
                    labelTool.cube_array[click_object_index].position.y = -click_box.y;
                    labelTool.cube_array[click_object_index].position.z = click_box.z;
                    labelTool.cube_array[click_object_index].rotation.z = click_box.yaw;
                    labelTool.cube_array[click_object_index].scale.x = click_box.width;
                    labelTool.cube_array[click_object_index].scale.y = click_box.height;
                    labelTool.cube_array[click_object_index].scale.z = click_box.depth;
                }
                if (click_flag == true) {
                    click_plane_array = [];
                    bboxes.select(labelTool.bbox_index[click_object_index], "PCD");
                    click_flag = false;
                } else if (ground_plane_array.length == 1) {
                    var ground_up_object = ray.intersectObjects(ground_plane_array);
                    var ground_up_point = ground_up_object[0].point;
                    if (Math.abs(ground_up_point.x - ground_click_point.x) > 0.1) {
                        var add_bbox_parameters = {
                            x: (ground_up_point.x + ground_click_point.x) / 2,
                            y: -(ground_up_point.y + ground_click_point.y) / 2,
                            z: -0.5,
                            width: Math.abs(ground_up_point.x - ground_click_point.x),
                            height: Math.abs(ground_up_point.y - ground_click_point.y),
                            depth: 1.0,
                            yaw: 0,
                            org: original = {
                                x: (ground_up_point.x + ground_click_point.x) / 2,
                                y: -(ground_up_point.y + ground_click_point.y) / 2,
                                z: -0.5,
                                width: Math.abs(ground_up_point.x - ground_click_point.x),
                                height: Math.abs(ground_up_point.y - ground_click_point.y),
                                depth: 1.0,
                                yaw: 0,
                            }
                        };
                        if (bboxes.exists(bboxes.getTargetIndex(), "PCD") == true) {
                            bboxes.selectEmpty();
                        }
                        var number = bboxes.getTargetIndex();
                        bboxes.setTarget("PCD", add_bbox_parameters);
                        bboxes.select(number, "PCD");
                    }
                    else if (c_flag == true) {
                        var add_bbox_parameters = {
                            x: (ground_up_point.x + ground_click_point.x) / 2,
                            y: -(ground_up_point.y + ground_click_point.y) / 2,
                            z: copy_bbox.z,
                            width: copy_bbox.width,
                            height: copy_bbox.height,
                            depth: copy_bbox.depth,
                            yaw: copy_bbox.yaw,
                            org: original = {
                                x: (ground_up_point.x + ground_click_point.x) / 2,
                                y: -(ground_up_point.y + ground_click_point.y) / 2,
                                z: copy_bbox.z,
                                width: copy_bbox.width,
                                height: copy_bbox.height,
                                depth: copy_bbox.depth,
                                yaw: copy_bbox.yaw,
                            }
                        };
                        if (bboxes.exists(bboxes.getTargetIndex(), "PCD") == true) {
                            bboxes.selectEmpty();
                        }
                        let number = bboxes.getTargetIndex();
                        bboxes.setTarget("PCD", add_bbox_parameters);
                        bboxes.select(number, "PCD");
                    }

                    ground_plane_array = [];
                }
            }
        }
    };
    gui.add(parameters, 'save').name("Save");
    gui.add(parameters, 'bird_view').name("BirdView");
    gui.add(parameters, 'camera_view').name("CameraView");
    var ImageCheck = gui.add(parameters, 'image_checkbox').name("Image").listen();
    //gui.add(parameters,'result').name("result");

    readYAMLFile(labelTool.workBlob + "/calibration.yml");
    data_load(parameters);
    gui.open();
    //HoldCheck.onChange(function(value){labelTool.hold_flag = value;})
    ImageCheck.onChange(function (value) {
        if (value) {
            $("#jpeg-label-canvas").show();
            changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);
        } else {
            $("#jpeg-label-canvas").hide();
        }
    });
}
