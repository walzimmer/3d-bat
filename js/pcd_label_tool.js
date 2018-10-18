/* var canvas2D,stats,image_2d,ctx;*/
var camera, controls, scene, renderer;
var cube;
var keyboard = new KeyboardState();
var numbertag_list = [];
var gui_tag = [];
var gui_2d_labels = new dat.GUI();
var gui_3d_labels = new dat.GUI();
var bounding_box_3d_array = [];
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
//var attribute = ["car", "pedestrian", "motorbike", "bus", "truck", "cyclist", "train", "obstacle", "stop_signal", "wait_signal", "gosignal"];
var attribute = ["human.pedestrian.adult", "human.pedestrian.child", "human.pedestrian.wheelchair", "human.pedestrian.stroller", "human.pedestrian.personal_mobility", "human.pedestrian.police_officer", "human.pedestrian.construction_worker", "animal", "vehicle.car", "vehicle.motorcycle", "vehicle.bicycle", "vehicle.bus.bendy", "vehicle.bus.rigid", "vehicle.truck", "vehicle.construction", "vehicle.emergency.ambulance", "vehicle.emergency.police", "vehicle.trailer", "movable_object.barrier", "movable_object.trafficcone", "movable_object.pushable_pullable", "movable_object.debris", "static_object.bicycle_rack"];
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
var labelContentJSON = '';

var parameters_2d_bb = {
    "human.pedestrian.adult": function () {
        classes.select("human.pedestrian.adult");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[0]).css('background-color', '#525252');
    },
    "human.pedestrian.child": function () {
        classes.select("human.pedestrian.child");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[1]).css('background-color', '#525252');
    },
    "human.pedestrian.wheelchair": function () {
        classes.select("human.pedestrian.wheelchair");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[2]).css('background-color', '#525252');
    },
    "human.pedestrian.stroller": function () {
        classes.select("human.pedestrian.stroller");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[3]).css('background-color', '#525252');
    },
    "human.pedestrian.personal_mobility": function () {
        classes.select("human.pedestrian.personal_mobility");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[4]).css('background-color', '#525252');
    },
    "human.pedestrian.police_officer": function () {
        classes.select("human.pedestrian.police_officer");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[5]).css('background-color', '#525252');
    },
    "human.pedestrian.construction_worker": function () {
        classes.select("human.pedestrian.construction_worker");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[6]).css('background-color', '#525252');
    },
    "animal": function () {
        classes.select("animal");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[7]).css('background-color', '#525252');
    },
    "vehicle.car": function () {
        classes.select("vehicle.car");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[8]).css('background-color', '#525252');
    },
    "vehicle.motorcycle": function () {
        classes.select("vehicle.motorcycle");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[9]).css('background-color', '#525252');
    },
    "vehicle.bicycle": function () {
        classes.select("vehicle.bicycle");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[10]).css('background-color', '#525252');
    },
    "vehicle.bus.bendy": function () {
        classes.select("vehicle.bus.bendy");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[11]).css('background-color', '#525252');
    },
    "vehicle.bus.rigid": function () {
        classes.select("vehicle.bus.rigid");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[12]).css('background-color', '#525252');
    },
    "vehicle.truck": function () {
        classes.select("vehicle.truck");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[13]).css('background-color', '#525252');
    },
    "vehicle.construction": function () {
        classes.select("vehicle.construction");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[14]).css('background-color', '#525252');
    },
    "vehicle.emergency.ambulance": function () {
        classes.select("vehicle.emergency.ambulance");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[15]).css('background-color', '#525252');
    },
    "vehicle.emergency.police": function () {
        classes.select("vehicle.emergency.police");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[16]).css('background-color', '#525252');
    },
    "vehicle.trailer": function () {
        classes.select("vehicle.trailer");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[17]).css('background-color', '#525252');
    },
    "movable_object.barrier": function () {
        classes.select("movable_object.barrier");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[18]).css('background-color', '#525252');
    },
    "movable_object.trafficcone": function () {
        classes.select("movable_object.trafficcone");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[19]).css('background-color', '#525252');
    },
    "movable_object.pushable_pullable": function () {
        classes.select("movable_object.pushable_pullable");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[20]).css('background-color', '#525252');
    },
    "movable_object.debris": function () {
        classes.select("movable_object.debris");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[21]).css('background-color', '#525252');
    },
    "static_object.bicycle_rack": function () {
        classes.select("static_object.bicycle_rack");
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[22]).css('background-color', '#525252');
    }
};

console.log(parameters_2d_bb);

var parameters_3d_bb = {

    save: function () {
        save();
    },
    download: function () {
        download();
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
    parameters_3d_bb.flame = labelTool.curFile;
    $("#jpeg-label-canvas").show();
    changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);

    // var obj_loader = new THREE.OBJLoader();
    // var obj_url = labelTool.workBlob + '/PCDPoints_orig/' + labelTool.fileNames[labelTool.curFile] + 'all.pcd';
    // obj_loader.load(obj_url, function (mesh) {
    //     scene.add(mesh);
    //     ground_mesh = mesh;
    //     labelTool.hasPCD = true;
    // });

    // ASCII pcd files
    var pcd_loader = new THREE.PCDLoader();
    var pcd_url = labelTool.workBlob + '/PCDPoints/all_scenes/' + labelTool.fileNames[labelTool.curFile] + '.pcd';
    //var pcd_url = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1/samples/LIDAR_TOP_ASCII/'+ labelTool.fileNames[labelTool.curFile] + '.pcd';
    //var pcd_url = '../datasets/nuscenes/nuscenes_teaser_meta_v1/samples/LIDAR_TOP_ASCII/' + labelTool.fileNames[labelTool.curFile] + '.pcd';
    console.log(pcd_url);
    // [DONE]: convert all binary files to object ascii files
    // var pcd_url = labelTool.workBlob + '/PCDPoints/' + labelTool.fileNames[labelTool.curFile] + '.obj';
    // console.log(pcd_url);
    pcd_loader.load(pcd_url, function (mesh) {
        scene.add(mesh);
        ground_mesh = mesh;
        labelTool.hasPCD = true;
    });

    if (parameters_3d_bb.image_checkbox == false) {
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
    };
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
    labelTool.changeFrame(labelTool.curFile);
    // download annotations
    var annotations = labelTool.createAnnotations();
    labelContentJSON = JSON.stringify(annotations);
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
    var annotations = labelTool.createAnnotations();
    var outputString = '';
    for (var i = 0; i < annotations.length; i++) {
        outputString += annotations[i].label + " ";
        outputString += annotations[i].alpha + " ";
        outputString += annotations[i].occluded + " ";
        outputString += annotations[i].truncated + " ";
        outputString += annotations[i].left + " ";
        outputString += annotations[i].bottom + " ";
        outputString += annotations[i].right + " ";
        outputString += annotations[i].top + " ";
        outputString += annotations[i].x + " ";
        outputString += annotations[i].y + " ";
        outputString += annotations[i].z + " ";
        outputString += annotations[i].length + " ";
        outputString += annotations[i].width + " ";
        outputString += annotations[i].height + " ";
        outputString += annotations[i].rotation_y + "\n";
    }
    outputString = b64EncodeUnicode(outputString);
    var fileName = labelTool.curFile.toString().padStart(6, '0');
    $($('#bounding-box-3d-menu ul li')[1]).children().first().attr('href', 'data:application/octet-stream;base64,' + outputString).attr('download', fileName + '.txt');
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
    labelTool.bbox_index.push(index.toString());
    var cubeGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);
    var cubeMaterial = new THREE.MeshBasicMaterial({color: 0x008866, wireframe: true});
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(bbox.x, -bbox.y, bbox.z);
    cube.scale.set(bbox.width, bbox.height, bbox.depth);
    cube.rotation.z = bbox.yaw;
    scene.add(cube);
    labelTool.cube_array.push(cube);
    addBoundingBoxGui(bbox, num);
    return bbox;
});

//register new bounding box
function addBoundingBoxGui(bbox, num) {
    var index = bounding_box_3d_array.length;
    var bb = gui_3d_labels.addFolder('BoundingBox' + String(num));
    bounding_box_3d_array.push(bb);
    var folder1 = bounding_box_3d_array[index].addFolder('Position');
    var cubeX = folder1.add(bbox, 'x').min(-50).max(50).step(0.01).listen();
    var cubeY = folder1.add(bbox, 'y').min(-30).max(30).step(0.01).listen();
    var cubeZ = folder1.add(bbox, 'z').min(-3).max(10).step(0.01).listen();
    var cubeYaw = folder1.add(bbox, 'yaw').min(-Math.PI).max(Math.PI).step(0.05).listen();
    folder1.close();
    folder_position.push(folder1);
    var folder2 = bounding_box_3d_array[index].addFolder('Size');
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
            gui_3d_labels.removeFolder('BoundingBox' + String(num));
            labelTool.cube_array[index].visible = false;
            bboxes.remove(num, "PCD");
            labelTool.changeFrame(labelTool.curFile)
            //bboxes.selectEmpty();
        }
    };

    //numbertag_list.push(num);
    //labeltag = bounding_box_3d_array[num].add( bbox, 'label' ,attribute).name("Attribute");
    bounding_box_3d_array[bounding_box_3d_array.length - 1].add(reset_parameters, 'reset').name("Reset");
    d = bounding_box_3d_array[bounding_box_3d_array.length - 1].add(reset_parameters, 'delete').name("Delete");
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

//draw animation
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
            bounding_box_3d_array[i].open();
            folder_position[i].open();
            folder_size[i].open();
        }
        else {
            bounding_box_3d_array[i].close();
        }
        if (i == labelTool.bbox_index.lastIndexOf(copy_bbox_index.toString()) && c_flag == true) {
            labelTool.cube_array[i].material.color.setHex(0xffff00);
        }
        else if (bounding_box_3d_array[i].closed == false) {
            if (i == labelTool.bbox_index.lastIndexOf(rotation_bbox_index.toString()) && r_flag == true) {
                labelTool.cube_array[i].material.color.setHex(0xff8000);
            }
            else {
                labelTool.cube_array[i].material.color.setHex(0xff0000);
                folder_position[i].open();
                folder_size[i].open();
            }
        }

        else if (bounding_box_3d_array[i].closed == true) {
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
                        gui_3d_labels.removeFolder('BoundingBox' + String(num1));
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
    };

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
                if (click_object.length > 0 && bounding_box_3d_array[click_object_index].closed == false) {
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
                    $("#label-tool-log").val("5. Step: Choose class from drop down list");
                    $("#label-tool-log").css("color", "#969696");
                }

            }
        }
    };
    // 2D BB controls
    // gui_2d_labels.add(parameters_2d_bb, 'car').name("Car");
    // gui_2d_labels.add(parameters_2d_bb, 'pedestrian').name("Pedestrian");
    // gui_2d_labels.add(parameters_2d_bb, 'cyclist').name("Cyclist");

    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.adult").name("human.pedestrian.adult");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.child").name("human.pedestrian.child");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.wheelchair").name("human.pedestrian.wheelchair");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.stroller").name("human.pedestrian.stroller");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.personal_mobility").name("human.pedestrian.personal_mobility");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.police_officer").name("human.pedestrian.police_officer");
    gui_2d_labels.add(parameters_2d_bb, "human.pedestrian.construction_worker").name("human.pedestrian.construction_worker");
    gui_2d_labels.add(parameters_2d_bb, "animal").name("animal");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.car").name("vehicle.car");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.motorcycle").name("vehicle.motorcycle");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.bicycle").name("vehicle.bicycle");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.bus.bendy").name("vehicle.bus.bendy");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.bus.rigid").name("vehicle.bus.rigid");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.truck").name("vehicle.truck");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.construction").name("vehicle.construction");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.emergency.ambulance").name("vehicle.emergency.ambulance");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.emergency.police").name("vehicle.emergency.police");
    gui_2d_labels.add(parameters_2d_bb, "vehicle.trailer").name("vehicle.trailer");
    gui_2d_labels.add(parameters_2d_bb, "movable_object.barrier").name("movable_object.barrier");
    gui_2d_labels.add(parameters_2d_bb, "movable_object.trafficcone").name("movable_object.trafficcone");
    gui_2d_labels.add(parameters_2d_bb, "movable_object.pushable_pullable").name("movable_object.pushable_pullable");
    gui_2d_labels.add(parameters_2d_bb, "movable_object.debris").name("movable_object.debris");
    gui_2d_labels.add(parameters_2d_bb, "static_object.bicycle_rack").name("static_object.bicycle_rack");
    gui_2d_labels.domElement.id = 'class-picker';
    $('#class-picker ul li').css('background-color', '#353535');
    $($('#class-picker ul li')[8]).css('background-color', '#525252');
    $('#class-picker ul li').css('border-bottom', '0px');
    gui_2d_labels.open();


    // $.each(liItems, function(i, item) {
    //     var color = classes[key].color;
    //     $(item).css("border-left", "3px solid "+color);
    // });

    // classType.onChange(function (value) {
    //     parameters_2d_bb.classType = value;
    //     // TODO
    //     // setClassType();
    // });

    // 3D BB controls
    gui_3d_labels.add(parameters_3d_bb, 'save').name("Save");
    gui_3d_labels.add(parameters_3d_bb, 'download').name("Download");
    gui_3d_labels.add(parameters_3d_bb, 'bird_view').name("BirdView");
    gui_3d_labels.add(parameters_3d_bb, 'camera_view').name("CameraView");
    var ImageCheck = gui_3d_labels.add(parameters_3d_bb, 'image_checkbox').name("Image").listen();
    //gui_3d_labels.add(parameters_3d_bb,'result').name("result");

    readYAMLFile(labelTool.workBlob + "/calibration.yml");
    data_load(parameters_3d_bb);
    gui_3d_labels.domElement.id = 'bounding-box-3d-menu';
    $('#bounding-box-3d-menu ul li').css('background-color', '#353535');
    // add download button
    var liItem = $($('#bounding-box-3d-menu ul li')[1]);
    var divItem = liItem.children().first();
    divItem.wrap("<a href=\"data:application/octet-stream," + labelContentJSON + "\"></a>");

    gui_3d_labels.open();
    //HoldCheck.onChange(function(value){labelTool.hold_flag = value;})
    ImageCheck.onChange(function (value) {
        if (value) {
            $("#jpeg-label-canvas").show();
            changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);
        } else {
            $("#jpeg-label-canvas").hide();
        }
    });
    var liItems = $("#class-picker ul li");
    liItems.each(function (i, item) {
        var propNamesArray = Object.getOwnPropertyNames(classes);
        var color = classes[propNamesArray[i]].color;
        var attribute = "20px solid" + ' ' + color;
        $(item).css("border-left", attribute);
        $(item).css('border-bottom', '0px');
    });

    $("#label-tool-log").val("1. Step: Draw bounding box ");
    $("#label-tool-log").css("color", "#969696");
}
