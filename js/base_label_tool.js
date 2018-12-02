function getIndexByDimension(width, height, depth) {
    for (let obj in annotationObjects.contents[labelTool.currentFileIndex]) {
        let annotation = annotationObjects.contents[labelTool.currentFileIndex][obj];
        if (annotation.width === width && annotation.height === height && annotation.depth === depth) {
            return annotationObjects.contents[labelTool.currentFileIndex].indexOf(annotation);
        }
    }
    return -1;
}

function draw2DProjections(params) {
    for (let i = 0; i < params.channels.length; i++) {
        if (params.channels[i].channel !== undefined && params.channels[i].channel !== "") {
            params.channels[i].projectedPoints = calculateProjectedBoundingBox(-params.x, -params.y, -params.z, params.width, params.height, params.depth, params.channels[i].channel);
            // calculate line segments
            let channelObj = params.channels[i];
            if (params.channels[i].projectedPoints !== undefined && params.channels[i].projectedPoints.length === 8) {
                params.channels[i].lines = calculateLineSegments(channelObj, params.class);
            }
        }
    }
}

function numberToText(n) {
    if (n === 0) {
        return "";
    } else if (n <= 19) {
        let textNumbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        return textNumbers[n - 1];
    } else if (n <= 99) {
        let textNumbers = ["Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        let firstPart = textNumbers[Math.floor(n / 10) - 2];
        let secondPart = numberToText(n % 10);
        if (secondPart === "") {
            return firstPart;
        } else {
            return firstPart + "_" + secondPart;
        }
    } else if (n === 100) {
        return "HUNDRED";
    }
}

function setSequences() {
    for (let i = 1; i <= 100; i++) {
        let numberAsText = numberToText(i).toUpperCase();
        labelTool.sequencesNuScenes.push(numberAsText);
    }
}

let labelTool = {
    datasets: Object.freeze({"NuScenes": "NuScenes", "LISA_T": "LISA_T"}),
    sequencesLISAT: Object.freeze({
        "FIRST": "2018-05-23-001-frame-00042917-00043816",
        "SECOND": "2018-05-23-001-frame-00077323-00078222",
        "THIRD": "2018-05-23-001-frame-00080020-00080919"
    }),
    sequencesNuScenes: [],
    currentDataset: 'LISA_T',
    currentSequence: '',
    numFrames: 0,
    dataTypes: [],
    workBlob: '',
    currentFileIndex: 0,
    fileNames: [],
    hasLoadedImage: [false, false, false, false, false, false],
    hasLoadedPCD: false,
    originalSize: [0, 0], // Original size of jpeg image
    originalAnnotations: [],   // For checking modified or not
    hold_flag: true,     // Hold bbox flag
    loadCount: 0,         // To prevent sending annotations before loading them
    skipFrameCount: 1,
    targetClass: "Vehicle",
    pageBox: document.getElementById('page_num'),
    savedFrames: [],
    cubeArray: [],
    bboxIndexArray: [],
    currentCameraChannelIndex: 0,
    camChannels: [{
        channel: 'CAM_FRONT_LEFT',
        position: [1.564, 0.472, 1.535],
        fieldOfView: 70,
        rotationY: 305 * Math.PI / 180,//305 degree
        projectionMatrixNuScenes: [[110.4698206116641, 1464.0011761439307, 26.41455707029287, -916.4598489300432],
            [-337.97741211920834, 265.1972065752412, -1252.6308707181809, -729.4327569362895],
            [-0.8143136873894475, 0.5803598650034878, 0.008697449242951868, -0.7728492390141875]],
        transformationMatrixEgoToCamNuScenes: [[8.09585281e-01, -5.86688274e-01, 1.91974424e-02, 1.56400000e+00],
            [2.33267982e-02, -5.23589075e-04, -9.99727756e-01, 4.72000000e-01],
            [5.86538603e-01, 8.09812692e-01, 1.32616689e-02, 1.53500000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        projectionMatrixLISAT: [[-251.25471266126286, 1271.4131017512532, -94.08147145637669, -82230.40765539104],
            [-480.6212728089816, 371.7218954940578, -912.1641583067685, -58976.298755304604],
            [-0.7873, 0.6091, -0.0958, -82.9684]],
        // projectionMatrixLISAT: [[-215.2526681977112, 1310.3693441729433, -93.64018907169996, -81894.77674601768],
        //     [-491.1015539416495, 379.8210484742729, -980.7314142419619, -60737.10982639055],
        //     [-0.7873, 0.6091, -0.0958, -82.9684]],
        transformationMatrixEgoToCamLISAT: [[0.6119, 0.791, -0.0001, -0.9675],
            [0.0757, -0.0587, -0.9954, -1.8214],
            [-0.7873, 0.6091, -0.0958, -82.9684],
            [0, 0, 0, 1]],
        rotation: 305
    }, {
        channel: 'CAM_FRONT',
        position: [1.671, -0.026, 1.536],
        fieldOfView: 70,
        rotationY: 0, // 0 degree
        projectionMatrixNuScenes: [[1260.3593003446563, 790.4433526756009, 15.627522424805397, -636.3274027306582],
            [7.834243891370816, 448.30558439994263, -1259.159501002805, -740.8962245421313],
            [-0.003064512389859362, 0.9999620062762187, 0.008160561736325754, -0.7757948007768039]],
        transformationMatrixEgoToCamNuScenes: [[-0.0047123, -0.9999733, 0.00558502, 1.671],
            [0.01358668, -0.0056486, -0.99989174, -0.026],
            [0.99989659, -0.00463591, 0.01361294, 1.536],
            [0, 0, 0, 1,]],
        // old intrinsic
        // projectionMatrixLISAT: [[922.033620236691, 914.742127292118, 37.1306002570457, 52013.3448439892],
        //     [43.2552503707437, 731.907745080755, -814.641807656038, 52786.4684187814],
        //     [0.0739896518701493, 0.996046991878090, 0.0491520232212485, 59.7093249377266]],
        // tmp test with new translation vector
        projectionMatrixLISAT: [[922.0309695035186, 914.7246439533986, 37.20014817055355, -13131.578714839563],
            [43.23307990854648, 731.8931026225239, -814.6031955744643, 44372.80515324952],
            [0.074, 0.996, 0.0492, -10.4301]],
        // new intrinsic
        // projectionMatrixLISAT: [[1032.0809269597441, 983.234693051346, 39.603066911575674, 55773.41899194405],
        //     [46.91969034275177, 800.4238080880446, -918.475825334129, 58018.158075382664],
        //     [0.074, 0.996, 0.0492, 59.7093]],
        transformationMatrixEgoToCamLISAT: [[9.97200e-01, -9.40000e-03, 7.40000e-02, -7.71510e+00],
            [-7.34000e-02, 5.00000e-02, 9.96000e-01, 1.34829e+01],
            [-1.30000e-02, -9.98700e-01, 4.92000e-02, 5.97093e+01]],
        rotation: 0
    }, {
        channel: 'CAM_FRONT_RIGHT',
        position: [1.593, -0.527, 1.526],
        fieldOfView: 70,
        rotationY: 55 * Math.PI / 180, // 55 degree
        projectionMatrixNuScenes: [[1361.856983203004, -568.9937879652269, -6.653895294513566, -312.50854189580144],
            [335.73347658567, 262.5244187804859, -1260.4228451038455, -763.337941668381],
            [0.8064805242536375, 0.5911975331694409, 0.00863948921786484, -0.8346696345144945]],
        transformationMatrixEgoToCamNuScenes: [[-8.10859430e-01, -5.85025428e-01, -1.58818285e-02, 1.59300000e+00],
            [1.90058814e-02, 7.99720013e-04, -9.99819052e-01, -5.27000000e-01],
            [5.84932270e-01, -8.11014555e-01, 1.04704634e-02, 1.52600000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        // old intrinsic
        projectionMatrixLISAT: [[1271.3136011165718, -264.8077615167896, -42.35337418192368, -58914.95130031767],
            [561.3394288862174, 273.6681408112988, -900.78438804512, -49758.5316810427],
            [0.8704, 0.4861, -0.0785, -68.6021]],
        // new intrinsic
        // projectionMatrixLISAT: [[1271.6922710846952, -304.99836406619386, -39.3907887583833, -57233.65791384971],
        //     [583.4133290049833, 284.0465837849785, -944.3857374439146, -51768.28201250383],
        //     [0.8704, 0.4861, -0.0785, -68.6021]],
        transformationMatrixEgoToCamLISAT: [[4.89900e-01, -8.70800e-01, 4.07000e-02, 9.85610e+00],
            [-4.84000e-02, -7.39000e-02, -9.96100e-01, -2.67600e+00],
            [8.70400e-01, 4.86100e-01, -7.85000e-02, -6.86021e+01],
            [0, 0, 0, 1]],
        rotation: 55
    }, {
        channel: 'CAM_BACK_RIGHT',
        position: [1.042, -0.456, 1.595],
        fieldOfView: 70,
        rotationY: 110 * Math.PI / 180, // 110 degree
        projectionMatrixNuScenes: [[268.5366860205932, -1442.5534066704236, -5.5654251139895745, 97.19498615315976],
            [406.6870884392414, -143.59988581953755, -1258.8039286060184, -475.31377943361736],
            [0.9377138162782094, -0.34740581495648687, 0.0014136814971854525, -0.37336636003724444]],
        transformationMatrixEgoToCamNuScenes: [[-9.34966822e-01, 3.54600502e-01, -9.77368820e-03, 1.04200000e+00],
            [9.88119913e-03, -1.50763065e-03, -9.99950043e-01, -4.56000000e-01],
            [-3.54597523e-01, -9.35016690e-01, -2.09429354e-03, 1.59500000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        projectionMatrixLISAT: [[794.0356195429831, -1012.8849095439483, -179.07770087021203, -128602.00570706779],
            [599.7750068083451, -38.26710841555636, -916.4982974817447, -43877.90381297301],
            [0.977, -0.1837, -0.1082, -60.6184]],
        // projectionMatrixLISAT: [[848.5512598840686,-1129.2646483996264,-196.315756621337,-141734.32068581556],
        // [652.1020273778403,-38.71272862691212,-1029.46526109555,-47964.78590957537],
        // [0.977,-0.1837,-0.1082,-60.6184]],
        transformationMatrixEgoToCamLISAT: [[-0.1932, -0.9775, -0.0856, -81.1507],
            [-0.09, 0.1046, -0.9904, -2.2588],
            [0.977, -0.1837, -0.1082, -60.6184],
            [0, 0, 0, 1]],
        rotation: 110

    }, {
        channel: 'CAM_BACK',
        position: [0.086, -0.007, 1.541],
        fieldOfView: 130,
        rotationY: Math.PI,//180 degree
        projectionMatrixNuScenes: [[-804.9366490955063, -670.8712520139895, -7.944554855775981, -532.4747992653032],
            [-2.598392799509179, -411.71700732441207, -802.0306250329542, -570.6743676244683],
            [-0.010095206737515048, -0.9999048082463075, -0.009405383928480443, -0.8092052225128153]],
        transformationMatrixEgoToCamNuScenes: [[1.78014178e-02, 9.99841527e-01, -1.74532924e-04, 8.60000000e-02],
            [1.48292972e-02, -4.38565732e-04, -9.99889944e-01, -7.00000000e-03],
            [-9.99731565e-01, 1.77968704e-02, -1.48347542e-02, 1.54100000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        projectionMatrixLISAT: [[-895.4304585339987, -938.871846096237, -71.02888985836256, -5982.317869225711],
            [-44.155367517485175, -612.6590140263143, -907.7438241324993, -84384.88883048057],
            [-0.0455, -0.995, -0.0888, -4.2963]],
        // projectionMatrixLISAT: [[-986.505781537663,-883.3532006027316,-64.67265646137503,-93111.9226453282],
        // [-47.88317051477141,-651.6533925460091,-1014.0108621580484,-72925.35490935268],
        // [-0.0455,-0.995,-0.0888,-95.8045]],
        transformationMatrixEgoToCamLISAT: [[-0.9988, 0.0439, 0.0189, -2.0743],
            [-0.0149, 0.0895, -0.9959, -95.8045],
            [-0.0455, -0.995, -0.0888, -4.2963],
            [0, 0, 0, 1]],
        rotation: 180
    }, {
        channel: 'CAM_BACK_LEFT',
        position: [1.055, 0.441, 1.605],
        fieldOfView: 70,
        rotationY: 250 * Math.PI / 180, //250 degree
        projectionMatrixNuScenes: [[-1118.65453545052, 940.0229558602045, 5.20775624882033, -642.7023004564963],
            [-404.09996798165156, -139.683623818749, -1256.6685898616693, -457.3405152874417],
            [-0.943213201117988, -0.33216765461657427, 0.003675114050138092, -0.36297000058026163]],
        transformationMatrixEgoToCamNuScenes: [[0.94571775, 0.3248984, 0.00767937, 1.055],
            [0.00612855, 0.00579634, -0.99996442, 0.441],
            [-0.32493135, 0.94573116, 0.00349055, 1.605],
            [0, 0, 0, 1]],
        // old intrinsic
        projectionMatrixLISAT: [[-1034.7887558860443, 785.54017213604, 19.44397266029749, -22415.14333034558],
            [-656.3615503272123, 21.601386673152174, -877.404677400356, -57939.50633439972],
            [-0.997, -0.0632, -0.0446, -84.9344]],
        // new intrinsic
        // projectionMatrixLISAT: [[-1017.8956117124864, 947.0278929555594, 32.58889806014775, -8586.028158741105],
        //     [-750.7556140821051, 27.649591167257046, -1043.054541250592, -66366.2238780424],
        //     [-0.997, -0.0632, -0.0446, -84.9344]],
        transformationMatrixEgoToCamLISAT: [[-0.0664, 0.995, 0.0742, 71.5185],
            [0.0397, 0.0769, -0.9962, 1.0001],
            [-0.997, -0.0632, -0.0446, -84.9344],
            [0, 0, 0, 1]],
        rotation: 305
    }],

    currentChannelLabel: document.getElementById('cam_channel'),
    // position of the lidar sensor in ego vehicle space
    positionLidarNuscenes: [0.891067, 0.0, 1.84292],//(long, lat, vert)
    // translationVectorLidarToCamFront: [0.77, -0.02, -0.3],
    // positionLidarNuscenes: [1.84, 0.0, 1.84292],//(long, lat, vert)
    showOriginalNuScenesLabels: false,
    imageAspectRatioNuScenes: 1.777777778,
    imageAspectRatioLISAT: 1.333333333,
    showFieldOfView: false,


    /********** Externally defined functions **********
     * Define these functions in the labeling tools.
     **************************************************/

    onLoadData: function (dataType, f) {
        this.localOnLoadData[dataType] = f;
    },

    onInitialize: function (dataType, f) {
        this.localOnInitialize[dataType] = f;
    },

    /****************** Private functions **************/

    localOnLoadData: {
        "CAM_FRONT_LEFT":
            function () {
            }
        ,
        "CAM_FRONT":

            function () {
            }

        ,
        "CAM_FRONT_RIGHT":

            function () {
            }

        ,
        "CAM_BACK_RIGHT":

            function () {
            }

        ,
        "CAM_BACK":

            function () {
            }

        ,
        "CAM_BACK_LEFT":

            function () {
            }

        ,
        "PCD":

            function () {
            }
    },

    localOnLoadAnnotation: {
        "CAM_FRONT_LEFT":

            function (index, annotation) {
            }

        ,
        "CAM_FRONT":

            function (index, annotation) {
            }

        ,
        "CAM_FRONT_RIGHT":

            function (index, annotation) {
            }

        ,
        "CAM_BACK_RIGHT":

            function (index, annotation) {
            }

        ,
        "CAM_BACK":

            function (index, annotation) {
            }

        ,
        "CAM_BACK_LEFT":

            function (index, annotation) {
            }

        ,
        "PCD":

            function (index, annotation) {
            }
    },

    localOnSelectBBox: {
        "CAM_FRONT_LEFT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_FRONT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_FRONT_RIGHT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK_RIGHT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK_LEFT":

            function (newIndex, oldIndex) {
            }

        ,
        "PCD":

            function (newIndex, oldIndex) {
            }
    },

    localOnInitialize: {
        "CAM_FRONT_LEFT":

            function () {
            }

        ,
        "CAM_FRONT":

            function () {
            }

        ,
        "CAM_FRONT_RIGHT":

            function () {
            }

        ,
        "CAM_BACK_RIGHT":

            function () {
            }

        ,
        "CAM_BACK":

            function () {
            }

        ,
        "CAM_BACK_LEFT":

            function () {
            }

        ,
        "PCD":

            function () {
            }
    },

// Visualize 2d and 3d data
    showData: function () {
        for (let camChannelObj in this.camChannels) {
            if (this.camChannels.hasOwnProperty(camChannelObj)) {
                let camChannelObject = this.camChannels[camChannelObj];
                this.localOnLoadData[camChannelObject.channel]();
            }
        }
        // draw 2D bb for all objects
        for (let annotationObjIndex in annotationObjects.contents[this.currentFileIndex]) {
            if (annotationObjects.contents[this.currentFileIndex].hasOwnProperty(annotationObjIndex)) {
                let annotationObj = annotationObjects.contents[this.currentFileIndex][annotationObjIndex];
                let channelTwo = "";
                if (annotationObj["channels"][1].channel !== undefined) {
                    channelTwo = annotationObj["channels"][1].channel;
                }
                let params = {
                    class: annotationObj["class"],
                    x: annotationObj["x"],
                    y: annotationObj["y"],
                    z: annotationObj["z"],
                    width: annotationObj["width"],
                    height: annotationObj["height"],
                    depth: annotationObj["depth"],
                    yaw: parseFloat(annotationObj["rotation_y"]),
                    channels: [{
                        rect: [],
                        projectedPoints: [],
                        lines: [],
                        channel: annotationObj["channels"][0].channel
                    }, {
                        rect: [],
                        projectedPoints: [],
                        lines: [],
                        channel: channelTwo
                    }]
                };
                draw2DProjections(params);
                // set new params
                annotationObjects.contents[this.currentFileIndex][annotationObjIndex]["channels"][0]["lines"] = params["channels"][0]["lines"];
                annotationObjects.contents[this.currentFileIndex][annotationObjIndex]["channels"][1]["lines"] = params["channels"][1]["lines"];
            }
        }

        this.localOnLoadData["PCD"]();
    },

    setTrackIds: function () {
        for (let annotationObj in annotationObjects.contents[labelTool.currentFileIndex]) {
            let annotation = annotationObjects.contents[labelTool.currentFileIndex][annotationObj];
            let label = annotation["class"];
            classesBoundingBox[label].nextTrackId++;
        }
    },
    // Set values to this.annotationObjects from annotations
    loadAnnotations: function (annotations) {
        // Remove old bounding boxes of current frame.
        annotationObjects.clear();
        // Add new bounding boxes.
        for (let i in annotations) {
            // convert 2D bounding box to integer values
            if (annotations.hasOwnProperty(i)) {
                ["left", "right", "top", "bottom"].forEach(function (key) {
                    annotations[i][key] = parseInt(annotations[i][key]);
                });
                let annotation = annotations[i];
                // annotationObjects.selectEmpty();
                let params = {
                    class: annotation.class,
                    x: -1,
                    y: -1,
                    z: -1,
                    delta_x: -1,
                    delta_y: -1,
                    delta_z: -1,
                    width: -1,
                    height: -1,
                    depth: -1,
                    yaw: parseFloat(annotation.rotation_y),
                    org: {
                        x: -1,
                        y: -1,
                        z: -1,
                        width: -1,
                        height: -1,
                        depth: -1,
                        yaw: parseFloat(annotation.rotation_y)
                    },
                    trackId: -1,
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
                    fromFile: true
                };
                let channels = getChannelsByPosition(parseFloat(annotation.x), parseFloat(annotation.y));
                for (let i = 0; i < channels.length; i++) {
                    params.channels[i].channel = channels[i];
                }
                if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                    classesBoundingBox.addNuSceneLabel(annotation.class);
                    classesBoundingBox.__target = Object.keys(classesBoundingBox.content)[0];
                    params.trackId = classesBoundingBox.content[annotation.class].nextTrackId;
                    classesBoundingBox.content[annotation.class].nextTrackId++;
                } else {
                    params.trackId = annotation.trackId;
                    classesBoundingBox[annotation.class].nextTrackId++;
                }

                // Nuscenes labels are stored in global frame in the database
                // Nuscenes: labels (3d positions) are transformed from global frame to point cloud (global -> ego, ego -> point cloud) before exporting them
                // LISAT: labels are stored in ego frame which is also the point cloud frame (no transformation needed)
                // let channelIndexByName = getChannelIndexByName(channel);
                if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                    params.x = parseFloat(annotation.x);
                    params.y = -parseFloat(annotation.y);
                    params.z = parseFloat(annotation.z);
                    params.org.x = parseFloat(annotation.x);
                    params.org.y = -parseFloat(annotation.y);
                    params.org.z = parseFloat(annotation.z);
                } else {
                    // let transformedPosition = matrixProduct4x4(this.camChannels[channelIndexByName].transformationMatrixEgoToCamNuScenes, [parseFloat(annotation.x),
                    //     parseFloat(annotation.y),
                    //     parseFloat(annotation.z),
                    //     1]);
                    params.x = parseFloat(annotation.x);
                    params.y = -parseFloat(annotation.y);
                    params.z = parseFloat(annotation.z);
                    params.org.x = parseFloat(annotation.x);
                    params.org.y = -parseFloat(annotation.y);
                    params.org.z = parseFloat(annotation.z);
                    // params.x = transformedPosition[0];
                    // params.y = -transformedPosition[1];
                    // params.z = transformedPosition[2];
                    // params.org.x = transformedPosition[0];
                    // params.org.y = -transformedPosition[1];
                    // params.org.z = transformedPosition[2];
                }
                let tmpWidth = parseFloat(annotation.width);
                let tmpHeight = parseFloat(annotation.height);
                let tmpDepth = parseFloat(annotation.length);
                if (tmpWidth !== 0.0 && tmpHeight !== 0.0 && tmpDepth !== 0.0) {
                    tmpWidth = Math.max(tmpWidth, 0.0001);
                    tmpHeight = Math.max(tmpHeight, 0.0001);
                    tmpDepth = Math.max(tmpDepth, 0.0001);
                    params.delta_x = 0;
                    params.delta_y = 0;
                    params.delta_z = 0;
                    params.width = tmpWidth;
                    params.height = tmpHeight;
                    params.depth = tmpDepth;
                    params.org.width = tmpWidth;
                    params.org.height = tmpHeight;
                    params.org.depth = tmpDepth;
                }

                // project 3D position into 2D camera image
                draw2DProjections(params);


                // check if that object already exists in annotationObjects.contents array (e.g. in another channel)
                // let indexByDimension = getIndexByDimension(params.width, params.height, params.depth);
                // if (indexByDimension !== -1) {
                //     // attach 2D bounding box to existing object
                //     annotationObjects.add2DBoundingBox(indexByDimension, params.channels[0]);
                // } else {
                //     // add new entry to contents array
                //     annotationObjects.set(annotationObjects.__insertIndex, params);
                //     annotationObjects.__insertIndex++;
                // }

                // add new entry to contents array
                annotationObjects.set(annotationObjects.__insertIndex, params);
                annotationObjects.__insertIndex++;
                classesBoundingBox.target().nextTrackId++;
            }
        }
    },

    // Create annotations from this.annotationObjects
    createAnnotations: function () {
        let annotations = [];
        for (let i = 0; i < annotationObjects.length; i++) {
            let annotationObj = this.annotationObjects[i];
            let camChannel = annotationObj["channel"];
            let rect = annotationObj["rect"];
            let minPos = convertPositionToFile(rect.attr("x"), rect.attr("y"), camChannel);
            let maxPos = convertPositionToFile(rect.attr("x") + rect.attr("width"),
                rect.attr("y") + rect.attr("height"), annotationObj["channel"]);
            let objectPosition = [this.cubeArray[this.currentFileIndex][i].position.x,
                this.cubeArray[this.currentFileIndex][i].position.y,
                this.cubeArray[this.currentFileIndex][i].position.z,
                1];
            // LISAT: labels are stored in ego frame which is also the point cloud frame (no transformation needed)
            let channelIndexByName = getChannelIndexByName(camChannel);
            let transformedPosition = [];
            if (this.currentDataset === this.datasets.LISA_T) {
                // no transformation needed
                transformedPosition = objectPosition;
            } else {
                // TODO:
                // Nuscenes labels are stored in global frame
                // Nuscenes: transform 3d positions from point cloud to global frame (point cloud-> ego, ego -> global)
                transformedPosition = matrixProduct4x4(inverseMatrix(this.camChannels[channelIndexByName].transformationMatrixEgoToCamNuScenes), objectPosition);
            }
            let annotation = {
                class: annotationObj["class"],
                truncated: 0,
                occluded: 3,
                alpha: 0,
                left: minPos[0],
                top: minPos[1],
                right: maxPos[0],
                bottom: maxPos[1],
                // TODO: store information of 3D objects also in annotationObjects.contents instead of cubeArray
                height: this.cubeArray[this.currentFileIndex][i].scale.y,
                width: this.cubeArray[this.currentFileIndex][i].scale.x,
                length: this.cubeArray[this.currentFileIndex][i].scale.z, // depth
                x: transformedPosition[0],
                y: transformedPosition[1],
                z: transformedPosition[2],
                rotationYaw: this.cubeArray[this.currentFileIndex][i].rotation.z,
                score: 1,
                trackId: annotationObj["trackId"]
            };
            annotations.push(annotation);
        }
        return annotations;
    },

    initialize: function () {
        initPanes();

        let imageContainer = $("#layout_layout_panel_top .w2ui-panel-content");
        // create six image divs
        for (let channelIdx in labelTool.camChannels) {
            if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                let channel = labelTool.camChannels[channelIdx].channel;
                let id = "image-" + channel.toLowerCase().replace(/_/g, '-');
                imageContainer.append("<div id='" + id + "'></div>");
                let canvasElem = imageContainer["0"].children[channelIdx];
                canvasArray.push(canvasElem);
                let height = $("#layout_layout_resizer_top").attr("top");
                paperArray.push(Raphael(canvasElem, imageWidth, height));
            }
        }

        // make image container scrollable
        $("#layout_layout_panel_top .w2ui-panel-content").addClass("dragscroll");
        $("#layout_layout_panel_top .w2ui-panel-content").css("overflow", "scroll");
        // <div class="dragscroll" style="width: 320px; height: 160px; overflow: scroll; cursor: grab; cursor : -o-grab; cursor : -moz-grab; cursor : -webkit-grab;">

        let pointCloudContainer = $("#layout_layout_panel_main .w2ui-panel-content");
        pointCloudContainer.append('<div id="canvas3d" style="z-index: 0; background-color: #000000;"></div>');

        if (this.currentDataset === this.datasets.LISA_T) {
            this.numFrames = 900;
            this.currentSequence = this.sequencesLISAT.FIRST;
        } else {
            this.numFrames = 3962;
            setSequences();
            this.currentSequence = this.sequencesNuScenes[0];
        }


        this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        this.camChannels.forEach(function (channelObj) {
            this.localOnInitialize[channelObj.channel]();
        }.bind(this));
        this.localOnInitialize["PCD"]();
    },

    getAnnotations(currentFileIndex) {
        this.loadCount++;
        let fileName = this.fileNames[currentFileIndex] + ".txt";
        let targetFile = this.currentFileIndex;
        request({
            url: '/label/annotations/',
            type: 'GET',
            dataType: 'json',
            data: {
                file_name: fileName
                // label_id: this.labelId
            },
            success: function (res) {
                if (targetFile === this.currentFileIndex) {
                    this.loadAnnotations(res);
                }
                this.loadCount--;
            }.bind(this),
            error: function (res) {
                this.loadCount--;
            }.bind(this)
        });
    },

    reset() {
        // base label tool
        this.currentFileIndex = 0;
        // this.bboxIndexArray = [];
        this.fileNames = [];
        this.originalAnnotations = [];
        this.targetClass = "Vehicle";
        this.savedFrames = [];
        this.cubeArray = [];
        this.currentCameraChannelIndex = 0;

        // $("#label-tool-wrapper").remove();
        // $("#label-tool-wrapper").attr("name", "");
        // $("#label-tool-wrapper").attr("class", "");
        // image label tool
        canvasArray = [];
        canvasParamsArray = [];
        paperArray = [];
        imageArray = [];
        // pcd label tool
        // guiAnnotationClasses = new dat.GUI();
        // guiOptions = new dat.GUI();
        folderBoundingBox3DArray = [];
        folderPositionArray = [];
        folderSizeArray = [];

        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[0]).css('background-color', '#525252');
        classPickerElem.css('border-bottom', '0px');

        classPickerElem.each(function (i, item) {
            let propNamesArray = Object.getOwnPropertyNames(classesBoundingBox);
            let color = classesBoundingBox[propNamesArray[i]].color;
            let attribute = "20px solid" + ' ' + color;
            $(item).css("border-left", attribute);
            $(item).css('border-bottom', '0px');
        });

        // remove image divs
        $("#layout_layout_panel_top .w2ui-panel-content").empty();

        if (this.currentDataset === this.datasets.LISA_T) {
            w2ui['layout'].panels[0].maxSize = 480;
            w2ui['layout'].panels[0].minSize = 240;
            w2ui['layout'].panels[0].size = 480;
            // let resizerElem = $("#layout_layout_resizer_top")[0];
            // resizerElem.offsetTop = 480;
            // console.log(resizerElem.offsetTop);
        } else {
            w2ui['layout'].panels[0].maxSize = 360;
            w2ui['layout'].panels[0].minSize = 180;
            w2ui['layout'].panels[0].size = 360;
            // let resizerElem = $("#layout_layout_resizer_top")[0];
            // resizerElem.offsetTop = 360;
            // console.log(resizerElem.offsetTop);
        }
        // w2ui['layout'].refresh();
        w2ui['layout'].resize();

    },

    start() {
        request({
            url: "/labels/",
            type: "GET",
            dataType: "json",
            // data: {label_id: this.labelId},
            data: {},
            complete: function (res) {
                let dict = JSON.parse(res.responseText)[0];
                this.workBlob = dict.blob;
                this.getImageSize();
            }.bind(this)
        })
    },

    getImageSize() {
        request({
            url: "/label/image_size/",
            type: "GET",
            dataType: "json",
            // data: {label_id: this.labelId},
            data: {},
            complete: function (res) {
                let dict = JSON.parse(res.responseText);
                this.originalSize[0] = dict.maxWidth;
                this.originalSize[1] = dict.maxHeight;
                this.getFileNames();
            }.bind(this)
        })
    },

    getFileNames() {
        request({
            url: "/label/file_names/",
            type: "GET",
            dataType: "json",
            // data: {label_id: this.labelId},
            data: {},
            complete: function (res) {
                let dict = JSON.parse(res.responseText);
                this.fileNames = dict["file_names"];
                this.initialize();
                this.showData();
                this.getAnnotations(this.currentFileIndex);
            }.bind(this)
        });
    },

// setParameters: function (labelId) {
//     this.labelId = labelId;
// },

    /****************** Public functions **************/

    /* isModified: function() {
       return this..toString() != this.originalBboxes.toString();
     * },*/

    getFileName: function (index) {
        return this.fileNames[index];
    },

    getTargetFileName: function () {
        return this.fileNames[this.currentFileIndex];
    },
    /*
     *     getImageBBox: function(index) {
     * 	if (this.annotationObjects[index] == undefined) {
     * 	    return undefined;
     * 	}
     * 	return this.annotationObjects[index]["CAM_FRONT_LEFT"];
     *     },
     *
     *     getPCDBBox: function(index) {
     * 	if (this.annotationObjects[index] == undefined) {
     * 	    return undefined;
     * 	}
     * 	return this.annotationObjects[index]["PCD"];
     *     },
     *
     *     getSelectedImageBBox: function() {
     * 	if (this.annotationObjects[this.targetBBox] == undefined) {
     * 	    return undefined;
     * 	}
     * 	return this.annotationObjects[this.targetBBox]["CAM_FRONT_LEFT"];
     *     },
     *
     *     getSelectedPCDBBox: function() {
     * 	if (this.annotationObjects[this.targetBBox] == undefined) {
     * 	    return undefined;
     * 	}
     * 	return this.annotationObjects[this.targetBBox]["PCD"];
     *     },
     *
     *     setImageBBox: function(index, bbox) {
     * 	if (this.annotationObjects[index] == undefined) {
     * 	    this.annotationObjects[index] = {
     * 		"label": this.targetClass,
     * 		"CAM_FRONT_LEFT": bbox
     * 	    };
     * 	} else {
     * 	    this.annotationObjects[index]["CAM_FRONT_LEFT"] = bbox;
     * 	}
     *     },
     *
     *     setPCDBBox: function(index, bbox) {
     * 	if (this.annotationObjects[index] == undefined) {
     * 	    this.annotationObjects[index] = {
     * 		"label": this.targetClass,
     * 		"PCD": bbox
     * 	    };
     * 	} else {
     * 	    this.annotationObjects[index]["PCD"] = bbox;
     * 	}
     *     },*/
    /*
     *     setSelectedImageBBox: function(bbox) {
     * 	if (this.targetBBox == -1) {
     * 	    console.error("No annotationObjects selected.");
     * 	}
     * 	if (this.annotationObjects[this.targetBBox] == undefined) {
     * 	    this.annotationObjects[this.targetBBox] = {
     * 		"label": this.targetClass,
     * 		"CAM_FRONT_LEFT": bbox
     * 	    };
     * 	} else {
     * 	    this.annotationObjects[this.targetBBox]["CAM_FRONT_LEFT"] = bbox;
     * 	}
     *     },*/

    // previousCamChannel: function () {
    //     var currentChannel = this.currentCameraChannelIndex;
    //     this.currentCameraChannelIndex = this.currentCameraChannelIndex - 1;
    //     if (this.currentCameraChannelIndex < 0) {
    //         this.currentCameraChannelIndex = 5;
    //     }
    //     this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    // }
    // ,
    //
    // nextCamChannel: function () {
    //     var currentChannel = this.currentCameraChannelIndex;
    //     this.currentCameraChannelIndex = this.currentCameraChannelIndex + 1;
    //     if (this.currentCameraChannelIndex > 5) {
    //         this.currentCameraChannelIndex = 0;
    //     }
    //     this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    // }
    // ,

    previousFrame: function () {
        if (this.currentFileIndex >= this.skipFrameCount) {
            this.changeFrame(this.currentFileIndex - this.skipFrameCount);
        } else if (this.currentFileIndex !== 0) {
            this.changeFrame(0);
        }
    },

    nextFrame: function () {
        if (this.currentFileIndex < (this.fileNames.length - 1 - this.skipFrameCount)) {
            this.changeFrame(this.currentFileIndex + this.skipFrameCount);
        } else if (this.currentFileIndex !== this.fileNames.length - 1) {
            this.changeFrame(this.fileNames.length - 1);
        }
    },

    jumpFrame: function () {
        if (0 <= Number(this.pageBox.value) - 1 && Number(this.pageBox.value) - 1 < this.fileNames.length) {
            this.changeFrame(Number(this.pageBox.value) - 1);
        }
    },

    removeObject: function (objectName) {
        for (let i = scene.children.length - 1; i >= 0; i--) {
            let obj = scene.children[i];
            if (obj.name === objectName) {
                scene.remove(obj);
            }
        }
    },
    createPlane: function (name, angle, xpos, ypos, channel) {
        let channelIdx = getChannelIndexByName(channel);
        let geometryRightPlane = new THREE.BoxGeometry(this.camChannels[channelIdx].fieldOfView, 2, 0.08);
        geometryRightPlane.rotateX(Math.PI / 2);
        geometryRightPlane.rotateZ(angle);
        geometryRightPlane.translate(ypos, xpos, -0.7);//y/x/z
        let material = new THREE.MeshBasicMaterial({
            color: 0x525252,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        let planeRight = new THREE.Mesh(geometryRightPlane, material);
        planeRight.name = name;
        scene.add(planeRight);
    },
    createPrism: function (angle, posx, posy, width, openingLength, offsetX) {
        let posXCenter = 0 * Math.cos(angle) - offsetX * Math.sin(angle);
        let posYCenter = 0 * Math.sin(angle) + offsetX * Math.cos(angle);
        let positionCornerCenter = new THREE.Vector2(posXCenter, posYCenter);
        let posXLeft = -width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        let posYLeft = -width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        let positionCornerLeft = new THREE.Vector2(posXLeft, posYLeft);
        let posXRight = width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        let posYRight = width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        let positionCornerRight = new THREE.Vector2(posXRight, posYRight);
        let materialPrism = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5});
        let height = 2;
        let geometryPrism = new PrismGeometry([positionCornerCenter, positionCornerLeft, positionCornerRight], height);
        geometryPrism.translate(-posy, posx, -1.7);
        let prismMesh = new THREE.Mesh(geometryPrism, materialPrism);
        prismMesh.name = "prism";
        scene.add(prismMesh);
    },
    drawFieldOfView: function () {
        switch (labelTool.currentCameraChannelIndex) {
            case 0:
                // front left
                this.createPlane('rightplane', Math.PI / 2 - 340 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidarNuscenes[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(340 * 2 * Math.PI / 360), -this.camChannels[0].position[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(340 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 270 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidarNuscenes[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(270 * 2 * Math.PI / 360), -this.camChannels[0].position[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(270 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPrism(-305 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidarNuscenes[0], this.camChannels[0].position[1], 0.3, 1.0, 0.073);
                break;
            case 1:
                // front
                this.createPlane('rightplane', Math.PI / 2 - 35 * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidarNuscenes[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(35 * 2 * Math.PI / 360), -this.camChannels[1].position[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPlane('leftplane', Math.PI / 2 - (-35) * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidarNuscenes[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(-35 * 2 * Math.PI / 360), -this.camChannels[1].position[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(-35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPrism(0 * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidarNuscenes[0], this.camChannels[1].position[1], 0.3, 1.0, 0.073);
                break;
            case 2:
                // front right
                this.createPlane('rightplane', Math.PI / 2 - 90 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidarNuscenes[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(90 * 2 * Math.PI / 360), -this.camChannels[2].position[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(90 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 20 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidarNuscenes[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(20 * 2 * Math.PI / 360), -this.camChannels[2].position[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(20 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPrism(-55 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidarNuscenes[0], this.camChannels[2].position[1], 0.3, 1.0, 0.073);
                break;
            case 3:
                // back right
                this.createPlane('rightplane', Math.PI / 2 - 145 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidarNuscenes[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(145 * 2 * Math.PI / 360), -this.camChannels[3].position[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(145 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 75 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidarNuscenes[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(75 * 2 * Math.PI / 360), -this.camChannels[3].position[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(75 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPrism(-110 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidarNuscenes[0], this.camChannels[3].position[1], 0.3, 1.0, 0.073);
                break;
            case 4:
                // back
                this.createPlane('rightplane', Math.PI / 2 - 245 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidarNuscenes[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(245 * 2 * Math.PI / 360), -this.camChannels[4].position[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(245 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPlane('leftplane', Math.PI / 2 - 115 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidarNuscenes[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(115 * 2 * Math.PI / 360), -this.camChannels[4].position[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(115 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPrism(-180 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidarNuscenes[0], this.camChannels[4].position[1], 0.97, 1.0, 0.046);
                break;
            case 5:
                // back left
                this.createPlane('rightplane', Math.PI / 2 - 285 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidarNuscenes[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(285 * 2 * Math.PI / 360), -this.camChannels[5].position[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(285 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 215 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidarNuscenes[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(215 * 2 * Math.PI / 360), -this.camChannels[5].position[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(215 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPrism(-250 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidarNuscenes[0], this.camChannels[5].position[1], 0.3, 1.0, 0.073);
                break;
        }
    },
    // changeCamChannel: function (currentChannelNumber, nextChannelNumber) {
    //     // if (this.dataTypes.indexOf("PCD") >= 0) {
    //     //     // remove all folder of current channel
    //     //     for (var k = 0; k < annotationObjects.contents.length; k++) {
    //     //         guiOptions.removeFolder(annotationObjects.contents[k]["class"] + ' ' + annotationObjects.contents[k]["trackId"]);
    //     //     }
    //     // }
    //     if (this.hasLoadedPCD) {
    //         cFlag = false;
    //         rFlag = false;
    //         this.bboxes = [];
    //         // do not delete bounding boxes that were set previously
    //         // this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex] = [];
    //         numbertagList = [];
    //         folderBoundingBox3DArray = [];
    //         guiTag = [];
    //         numbertagList = [];
    //         folderPositionArray = [];
    //         folderSizeArray = [];
    //         this.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
    //     }
    //     var previousChannelNumber = currentChannelNumber - 1;
    //     if (previousChannelNumber < 0) {
    //         previousChannelNumber = 5;
    //     }
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(previousChannelNumber)] = false;
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(currentChannelNumber)] = false;
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(nextChannelNumber)] = false;
    //     this.hasLoadedPCD = false;
    //     this.showData();
    //
    //     // render labels
    //     // hold flag not set
    //     if (this.savedFrames[this.currentFileIndex][this.currentCameraChannelIndex] == true) {
    //
    //     } else {
    //         // load annotations from file for all three camera views if they exist, otherwise show blank image
    //         if (annotationFileExist(this.currentFileIndex)) {
    //             this.getAnnotations(this.currentFileIndex);
    //         } else {
    //             // no annotations are loaded
    //             annotationObjects.clear();
    //         }
    //     }
    //
    //     // change FOV of camera
    //     this.removeObject('rightplane');
    //     this.removeObject('leftplane');
    //     this.removeObject('prism');
    //     this.drawFieldOfView();
    //
    //
    // }
    // ,
    changeFrame: function (newFileIndex) {
        // remove all 3D BB objects from scene
        for (let i = scene.children.length; i >= 0; i--) {
            let obj = scene.children[i];
            scene.remove(obj);
        }
        // remove all 2D BB objects from camera images
        for (let annotationObjIndex in annotationObjects.contents[this.currentFileIndex]) {
            if (annotationObjects.contents[this.currentFileIndex].hasOwnProperty(annotationObjIndex)) {
                let annotationObj = annotationObjects.contents[this.currentFileIndex][annotationObjIndex];
                for (let channelIdx in annotationObj.channels) {
                    if (annotationObj.channels.hasOwnProperty(channelIdx)) {
                        let channelObj = annotationObj.channels[channelIdx];
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
        }
        // remove all folders
        folderBoundingBox3DArray = [];
        folderPositionArray = [];
        folderSizeArray = [];


        if (this.cubeArray[newFileIndex].length === 0) {
            // move all 3d objects to new frame if nextFrame has no labels
            for (let i = 0; i < this.cubeArray[this.currentFileIndex].length; i++) {
                let mesh = this.cubeArray[this.currentFileIndex][i];
                let clonedMesh = mesh.clone();
                this.cubeArray[newFileIndex].push(clonedMesh);
                scene.add(clonedMesh);
            }
            // Deep copy
            for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
                annotationObjects.contents[newFileIndex][i] = jQuery.extend(true, {}, annotationObjects.contents[this.currentFileIndex][i]);
                // check
            }
        } else {
            // next frame has already 3D annotations which will be added to the scene
            for (let i = 0; i < this.cubeArray[newFileIndex].length; i++) {
                let mesh = this.cubeArray[newFileIndex][i];
                scene.add(mesh);
            }
        }

        this.currentFileIndex = newFileIndex;
        this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        this.pageBox.value = "";
        // for (var k = 0; k < this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex].length; k++) {
        //     guiOptions.removeFolder('BoundingBox' + String(this.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][k]));
        //     this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][k].visible = false;
        // }
        cFlag = false;
        rFlag = false;
        // this.annotationObjects = [];
        // this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
        // numbertagList = [];
        // folderBoundingBox3DArray = [];
        // guiTag = [];
        // numbertagList = [];
        // folderPositionArray = [];
        // folderSizeArray = [];
        // this.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
        this.hasLoadedImage = [false, false, false, false, false, false];
        this.hasLoadedPCD = false;
        this.showData();
        // render labels
        // use annotations of current frame for next frame
        // if (annotationFileExist(this.currentFileIndex, undefined)) {
        //     this.getAnnotations(this.currentFileIndex);
        // }
        // update folders with values of next/previous frame
        for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
            let annotationObj = annotationObjects.contents[this.currentFileIndex][i];
            let bbox = {
                class: annotationObj["class"],
                x: annotationObj["x"],
                y: annotationObj["y"],
                z: annotationObj["z"],
                width: annotationObj["width"],
                height: annotationObj["height"],
                depth: annotationObj["depth"],
                yaw: parseFloat(annotationObj["yaw"]),
                trackId: annotationObj["trackId"]
            };
            guiOptions.removeFolder(bbox.class + ' ' + bbox.trackId);
            addBoundingBoxGui(bbox);
        }
        // open folder of selected object
        let selectionIndex = annotationObjects.getSelectionIndex();
        let channels = annotationObjects.contents[this.currentFileIndex][selectionIndex]["channels"];
        for (let channelIdx in channels) {
            if (channels.hasOwnProperty(channelIdx)) {
                annotationObjects.select(selectionIndex, channels[channelIdx].channel);
            }
        }


    },

    addResizeEventForImage: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            // keepAspectRatio();
        });
    },

    addResizeEventForPCD: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            $(function () {
                if ($("#image-cam-front-left").css("display") === "block") {
                    let windowWidth = $('#label-tool-wrapper').width();
                    let width = windowWidth / 4 > 100 ? windowWidth / 4 : 100;
                    let height = width * 5 / 8;
                    // changeCanvasSize(width, height);
                }
            });
        });
    },

    resetBoxes: function () {
        this.getAnnotations(this.currentFileIndex);
    },

// selectYes() {
//     $(function () {
//         $("#label-tool-dialogue-overlay").remove();
//     });
//     if (updateFlag)
//         return;
//     updateFlag = true;
//     document.getElementById("overlay-text").innerHTML = "Updating Database...";
//     $(function () {
//         $("#label-tool-status-overlay").fadeIn();
//     });
//     this.setAnnotations();
//     $.ajax({
//         url: '/labeling_tool/update_database/',
//         type: 'POST',
//         dataType: 'json',
//         data: {
//             images: this.fileNames.length,
//             label_id: this.labelId
//         },
//         complete: function (res) {
//             location.href = "label_select";
//         }.bind(this)
//     })
// },
//
// selectNo() {
//     $(function () {
//         $("#label-tool-dialogue-overlay").fadeOut();
//     });
// },


    handlePressKey: function (code, value) {
        if (code === 13) {
            this.jumpFrame();
        }
    }
};

function initPanes() {
    let maxHeight;
    let minHeight;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        maxHeight = 480;
        minHeight = 240;
    } else {
        maxHeight = 360;
        minHeight = 180;
    }
    let topStyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 0px;';

    // let wrapperElem = $("#wrapper").append("<div id=\"label-tool-wrapper\"></div>")[0];
    // let numChildren = wrapperElem.children.length;
    // $(wrapperElem.children[numChildren - 1]).w2layout({
    $('#label-tool-wrapper').w2layout({
        name: 'layout',
        panels: [
            {type: 'top', size: maxHeight, resizable: true, style: topStyle, minSize: minHeight, maxSize: maxHeight}
        ],
        onResizing: function (event) {
            let topElem = $("#layout_layout_panel_top")[0];
            let newHeight = topElem.offsetHeight;
            let newWidth;
            if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                newWidth = newHeight * labelTool.imageAspectRatioLISAT;
            } else {
                newWidth = newHeight * labelTool.imageAspectRatioNuScenes;
            }
            if (newHeight === 0 || newWidth === 0) {
                return;
            }
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let channelObj = labelTool.camChannels[channelIdx];
                    let channel = channelObj.channel;
                    changeCanvasSize(newWidth, newHeight, channel);
                }
            }
            w2ui['layout'].set('top', {size: newHeight});


        },
        onRefresh: function (event) {
            console.log('object ' + event.target + ' is refreshed');
            event.onComplete = function () {
                $("#layout_layout_resizer_top").on('click', function () {
                    w2ui['layout'].resize();
                });
            }
        }
    });

    w2ui['layout'].resizer = 10;
    w2ui['layout'].resize();
    w2ui['layout'].refresh();

}

$("#previous-frame-button").keyup(function (e) {
    if (e.which === 32) {
        return false;
    }
});

$("#next-frame-button").keyup(function (e) {
    if (e.which === 32) {
        return false;
    }
});

$("#frame-skip").change(function () {
    let value = $(this).val();
    if (value == "") {
        value = 1;
    } else {
        value = parseInt(value);
    }
    labelTool.skipFrameCount = value;
});
