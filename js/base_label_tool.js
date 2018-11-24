function getIndexByDimension(width, height, depth) {
    for (let obj in annotationObjects.contents) {
        let annotation = annotationObjects.contents[obj];
        if (annotation.width === width && annotation.height === height && annotation.depth === depth) {
            return annotationObjects.contents.indexOf(annotation);
        }
    }
    return -1;
}

function storeAnnotations(annotations, camChannel) {
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
                }],
                fromFile: true
            };
            let channel;
            if (labelTool.loadNuScenesLabels === true) {
                classesBoundingBox.add(annotation.class);
                channel = camChannel;
                classesBoundingBox.__target = Object.keys(classesBoundingBox.content)[0];
                params.trackId = classesBoundingBox.content[annotation.class].nextTrackId;
                classesBoundingBox.content[annotation.class].nextTrackId++;
            } else {
                params.trackId = annotation.trackId;
                classesBoundingBox[annotation.class].nextTrackId++;
                channel = annotation.channel;
            }
            params.channels[0].channel = channel;

            let rect = [];
            if (annotation.left !== 0 && annotation.top !== 0 &&
                annotation.right !== 0 && annotation.bottom !== 0) {
                let minPos = convertPositionToCanvas(annotation.left, annotation.top, channel);
                let maxPos = convertPositionToCanvas(annotation.right, annotation.bottom, channel);
                rect.push(minPos[0]);
                rect.push(minPos[1]);
                rect.push(maxPos[0] - minPos[0]);
                rect.push(maxPos[1] - minPos[1]);
                params.channels[0].rect = rect;
            }
            // TODO: why multiply with cameraMatrix?
            let readMat = matrixProduct4x4(this.cameraMatrix, [parseFloat(annotation.x),
                parseFloat(annotation.y),
                parseFloat(annotation.z),
                1]);
            let tmpWidth = parseFloat(annotation.width);
            let tmpHeight = parseFloat(annotation.height);
            let tmpDepth = parseFloat(annotation.length);
            if (tmpWidth !== 0.0 && tmpHeight !== 0.0 && tmpDepth !== 0.0) {
                tmpWidth = Math.max(tmpWidth, 0.0001);
                tmpHeight = Math.max(tmpHeight, 0.0001);
                tmpDepth = Math.max(tmpDepth, 0.0001);
                params.x = readMat[0];
                params.y = -readMat[1];
                params.z = readMat[2];
                params.delta_x = 0;
                params.delta_y = 0;
                params.delta_z = 0;
                params.width = tmpWidth;
                params.height = tmpHeight;
                params.depth = tmpDepth;
                params.org.x = readMat[0];
                params.org.y = -readMat[1];
                params.org.z = readMat[2];
                params.org.width = tmpWidth;
                params.org.height = tmpHeight;
                params.org.depth = tmpDepth;
            }

            // project 3D position into 2D camera image
            params.channels[0].projectedPoints = calculateProjectedBoundingBox(params.x, params.y, -params.z, params.width, params.height, params.depth, channel);
            // calculate line segments
            let channelObj = params.channels[0];
            if (params.channels[0].projectedPoints !== undefined && params.channels[0].projectedPoints.length === 8) {
                params.channels[0].lines = calculateLineSegments(channelObj);
            }


            // check if that object already exists in annotationObjects.contents array (e.g. in another channel)
            let indexByDimension = getIndexByDimension(params.width, params.height, params.depth);
            if (indexByDimension !== -1) {
                // attach 2D bounding box to existing object
                annotationObjects.add2DBoundingBox(indexByDimension, params.channels[0]);
            } else {
                // add new entry to contents array
                annotationObjects.set(annotationObjects.__insertIndex, params);
                annotationObjects.__insertIndex++;
            }

            classesBoundingBox.target().nextTrackId++;

            // let channels = getChannelByPosition(annotationObjects.contents[annotationObjects.__insertIndex]["x"], annotationObjects.contents[annotationObjects.__insertIndex]["y"]);
            // for (let channel in channels) {
            //     if (channels.hasOwnProperty(channel)) {
            //         let camChannel = channels[channel];
            //         annotationObjects.select(annotationObjects.__insertIndex, camChannel);
            //     }
            // }

        }

    }
    // this.setTrackIds();
}

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

    $('#label-tool-wrapper').w2layout({
        name: 'layout',
        panels: [
            {type: 'top', size: maxHeight, resizable: true, style: topStyle, minSize: minHeight, maxSize: maxHeight}
        ],
        onResizing: function (event) {
            console.log('resize');
            let topElem = $("#layout_layout_panel_top")[0];
            let newHeight = topElem.offsetHeight;
            let newWidth = newHeight * 1.33333;
            if (newHeight === 0 || newWidth === 0) {
                return;
            }
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let channelObj = labelTool.camChannels[channelIdx];
                    let channel = channelObj.channel;
                    changeCanvasSize(newWidth, newHeight, channel);

                    // let id = "#image-" + channel.toLowerCase().replace(/_/g, '-');
                    // let imageElem = $(id)[0];
                    // imageElem.clientHeight = newHeight;
                    // imageElem.clientWidth = newHeight * 1.33333;

                }
            }
        }
    });
    w2ui['layout'].resizer = 10;
    w2ui['layout'].resize();

}

let labelTool = {
    datasets: Object.freeze({"NuScenes": "NuScenes", "LISA_T": "LISA_T"}),
    sequences: Object.freeze({
        "FIRST": "2018-05-23-001-frame-00042917-00043816",
        "SECOND": "2018-05-23-001-frame-00077323-00078222",
        "THIRD": "2018-05-23-001-frame-00080020-00080919"
    }),
    currentDataset: 'LISA_T',
    currentSequence: '',
    numFrames: 0,
    dataTypes: [],
    workBlob: '',         // Base url of blob
    currentFileIndex: 0,           // Base name of current file
    // fileNames: ['000000', '000001', '000002', '000003', '000004', '000005', '000006', '000007', '000008', '000009', '000010', '000011', '000012', '000013', '000014'],         // List of basenames of the files
    fileNames: [],
    // labelId: -1,          // Initialize with 'setParameters'
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
    cameraMatrix: [],
    cubeArray: [],
    bboxIndexArray: [],
    currentCameraChannelIndex: 0,
    camChannels: [{
        channel: 'CAM_FRONT_LEFT',
        position: [1.564, 0.472, 1.535],
        fieldOfView: 70,
        rotationY: 305 * Math.PI / 180,//305 degree
        projectionMatrix: [[5.85177527e+02, -4.87057717e+01, 1.36795440e+01, -1.25263992e+03],
            [1.09848120e+02, 1.35213575e+02, -5.00233407e+02, -4.94018067e+02],
            [5.86538603e-01, 8.09812692e-01, 1.32616689e-02, -1.53500000e+00]],
        projectionMatrixLISA: [[-251.25471266126286, 1271.4131017512532, -94.08147145637669, -82230.40765539104],
            [-480.6212728089816, 371.7218954940578, -912.1641583067685, -58976.298755304604],
            [-0.7873, 0.6091, -0.0958, -82.9684]],
        rotation: 305
    }, {
        channel: 'CAM_FRONT',
        position: [1.671, -0.026, 1.536],
        fieldOfView: 70,
        rotationY: 0, // 0 degree
        projectionMatrix: [[3.12258552e+02, -5.06569044e+02, 7.10472974e+00, -1.32739702e+03],
            [1.82040476e+02, -3.66543008e+00, -5.02684133e+02, -2.55967282e+02],
            [9.99896593e-01, -4.63590596e-03, 1.36129354e-02, -1.53600000e+00]],
        //  using translation_vector_lidar_to_cam_front = -np.array([-59.7093, 7.7151, -13.4829]).T
        // projectionMatrixLISA: [[1.39444832e+02, -1.64650603e+02, 1.85512595e+01, 8.66888457e+03],
        //     [-1.18951416e+01, -1.08130948e+02, 1.46736454e+02, 8.79774529e+03],
        //     [-1.30000000e-02, -9.98700000e-01, 4.92000000e-02, 5.97093000e+01]]
        // using translation_vector_lidar_to_cam_front = -np.array([7.7151, -59.7093, -13.4829]).T
        // projectionMatrixLISA: [[139.44483229405185, -164.65060309249841, 18.551259509590313, 1109.5419777589204],
        //     [-11.8951415546322, -108.13094806356696, 146.73645394171749, 10011.875332363627],
        //     [-0.013, -0.9987, 0.0492, 13.4829]]
        // projectionMatrixLISA: [[139.44483229405185, -164.65060309249841, 18.551259509590313, -1109.5419777589204],
        //     [-11.8951415546322, -108.13094806356696, 146.73645394171749, -10011.875332363627],
        //     [-0.013, -0.9987, 0.0492, -13.4829]]
        projectionMatrixLISA: [[922.033620236691, 914.742127292118, 37.1306002570457, -52013.3448439892],
            [43.2552503707437, 731.907745080755, -814.641807656038, -52786.4684187814],
            [0.0739896518701493, 0.996046991878090, 0.0491520232212485, -59.7093249377266]],
        rotation: 0
    }, {
        channel: 'CAM_FRONT_RIGHT',
        position: [1.593, -0.527, 1.526],
        fieldOfView: 70,
        rotationY: 55 * Math.PI / 180, // 55 degree
        projectionMatrix: [[-2.31755207e+02, -5.42971937e+02, -4.83981324e+00, -1.27054365e+03],
            [1.06727074e+02, -1.34248981e+02, -5.03820234e+02, 1.31146956e+01],
            [5.84932270e-01, -8.11014555e-01, 1.04704634e-02, -1.52600000e+00]],
        projectionMatrixLISA: [[1271.3136011165718, -264.8077615167896, -42.35337418192368, -58914.95130031767],
            [561.3394288862174, 273.6681408112988, -900.78438804512, -49758.5316810427],
            [0.8704, 0.4861, -0.0785, -68.6021]],
        rotation: 55
    }, {
        channel: 'CAM_BACK_RIGHT',
        position: [1.042, -0.456, 1.595],
        fieldOfView: 70,
        rotationY: 110 * Math.PI / 180, // 110 degree
        projectionMatrix: [[-5.77808286e+02, -1.02972103e+02, -5.55447232e+00, -1.00531506e+03],
            [-5.59368762e+01, -1.61381901e+02, -5.04106508e+02, -4.42780364e+01],
            [-3.54597523e-01, -9.35016690e-01, -2.09429354e-03, -1.59500000e+00]],
        projectionMatrixLISA: [[794.0356195429831, -1012.8849095439483, -179.07770087021203, -128602.00570706779],
            [599.7750068083451, -38.26710841555636, -916.4982974817447, -43877.90381297301],
            [0.977, -0.1837, -0.1082, -60.6184]],
        rotation: 110

    }, {
        channel: 'CAM_BACK',
        position: [0.086, -0.007, 1.541],
        fieldOfView: 130,
        rotationY: Math.PI,//180 degree
        projectionMatrix: [[-2.65847240e+02, 3.24032801e+02, -4.08488699e+00, -4.45996076e+02],
            [-1.62919716e+02, 2.84450505e+00, -3.21702344e+02, -2.56189382e+02],
            [-9.99731565e-01, 1.77968704e-02, -1.48347542e-02, -1.54100000e+00]],
        projectionMatrixLISA: [[-895.4304585339987, -938.871846096237, -71.02888985836256, -5982.317869225711],
            [-44.155367517485175, -612.6590140263143, -907.7438241324993, -84384.88883048057],
            [-0.0455, -0.995, -0.0888, -4.2963]],
        rotation: 180
    }, {
        channel: 'CAM_BACK_LEFT',
        position: [1.055, 0.441, 1.605],
        fieldOfView: 70,
        rotationY: 250 * Math.PI / 180, //250 degree
        projectionMatrix: [[3.79416560e+02, 4.44554116e+02, 4.90223542e+00, -1.00791882e+03],
            [-5.18851401e+01, 1.62909404e+02, -5.02685127e+02, -4.93475056e+02],
            [-3.24931351e-01, 9.45731163e-01, 3.49054849e-03, -1.60500000e+00]],
        projectionMatrixLISA: [[-1034.7887558860443, 785.54017213604, 19.44397266029749, -22415.14333034558],
            [-656.3615503272123, 21.601386673152174, -877.404677400356, -57939.50633439972],
            [-0.997, -0.0632, -0.0446, -84.9344]],
        rotation: 305
    }],

    currentChannelLabel: document.getElementById('cam_channel'),
    positionLidar: [0.891067, 0.0, 1.84292],//(long, lat, vert)
    // positionLidar: [1.84, 0.0, 1.84292],//(long, lat, vert)
    loadNuScenesLabels: false,
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
        this.localOnLoadData["PCD"]();
    },

    setTrackIds: function () {
        for (let annotationObj in annotationObjects.contents) {
            let annotation = annotationObjects.contents[annotationObj];
            let label = annotation["class"];
            classesBoundingBox[label].nextTrackId++;
        }
    },
    // Set values to this.annotationObjects from annotations
    loadAnnotations: function (annotations) {
        // Remove old bounding boxes of current frame.
        annotationObjects.clear();
        // Add new bounding boxes.
        if (labelTool.loadNuScenesLabels) {
            for (let annotationObj in annotations) {
                if (annotations.hasOwnProperty(annotationObj)) {
                    let annotationObject = annotations[annotationObj];
                    storeAnnotations.call(this, annotationObject.content, annotationObject.channel);
                }
            }

        } else {
            storeAnnotations.call(this, annotations, undefined);
        }

    },

    // Create annotations from this.annotationObjects
    createAnnotations: function () {
        let annotations = [];
        for (let i = 0; i < annotationObjects.length; i++) {
            let annotationObj = this.annotationObjects[i];
            let rect = annotationObj["rect"];
            let minPos = convertPositionToFile(rect.attr("x"), rect.attr("y"), annotationObj["channel"]);
            let maxPos = convertPositionToFile(rect.attr("x") + rect.attr("width"),
                rect.attr("y") + rect.attr("height"), annotationObj["channel"]);
            let cubeMat = [this.cubeArray[this.currentFileIndex][i].position.x,
                this.cubeArray[this.currentFileIndex][i].position.y,
                this.cubeArray[this.currentFileIndex][i].position.z,
                1];
            let resultMat = matrixProduct4x4(inverseMatrix(this.cameraMatrix), cubeMat);
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
                x: resultMat[0],
                y: resultMat[1],
                z: resultMat[2],
                rotation_y: this.cubeArray[this.currentFileIndex][i].rotation.z,
                score: 1,
                trackId: annotationObj["trackId"],
                channel: annotationObj["channel"]
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
                paperArray.push(Raphael(canvasElem, image_width, height));
            }
        }
        let pointCloudContainer = $("#layout_layout_panel_main .w2ui-panel-content");
        pointCloudContainer.append('<div id="canvas3d" style="z-index: 0; background-color: #000000;"></div>');

        if (this.currentDataset === this.datasets.LISA_T) {
            this.numFrames = 900;
        } else {
            this.numFrames = 3962;
        }

        this.currentSequence = this.sequences.FIRST;
        this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        this.camChannels.forEach(function (channelObj) {
            this.localOnInitialize[channelObj.channel]();
        }.bind(this));
        this.localOnInitialize["PCD"]();
    },

    getAnnotations(currentFileIndex) {
        this.loadCount++;
        var fileName = this.fileNames[currentFileIndex] + ".txt";
        var targetFile = this.currentFileIndex;
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
        this.currentFileIndex = 0;
        this.fileNames = [];
        this.originalAnnotations = [];
        this.targetClass = "Vehicle";
        this.savedFrames = [];
        this.cubeArray = [];
        this.currentCameraChannelIndex = 0;
        guiAnnotationClasses = new dat.GUI();
        guiOptions = new dat.GUI();
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
    },

    start() {
        request({
            url: "/labels/",
            type: "GET",
            dataType: "json",
            // data: {label_id: this.labelId},
            data: {},
            complete: function (res) {
                var dict = JSON.parse(res.responseText)[0];
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
                var dict = JSON.parse(res.responseText);
                this.originalSize[0] = dict.width;
                this.originalSize[1] = dict.height;
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
                var dict = JSON.parse(res.responseText);
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
        if (this.currentFileIndex >= 0 + this.skipFrameCount) {
            this.changeFrame(this.currentFileIndex - this.skipFrameCount);
        } else if (this.currentFileIndex != 0) {
            this.changeFrame(0);
        }
    },

    nextFrame: function () {
        if (this.currentFileIndex < (this.fileNames.length - 1 - this.skipFrameCount)) {
            this.changeFrame(this.currentFileIndex + this.skipFrameCount);
        } else if (this.currentFileIndex != this.fileNames.length - 1) {
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
                this.createPlane('rightplane', Math.PI / 2 - 340 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidar[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(340 * 2 * Math.PI / 360), -this.camChannels[0].position[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(340 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 270 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidar[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(270 * 2 * Math.PI / 360), -this.camChannels[0].position[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(270 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPrism(-305 * 2 * Math.PI / 360, this.camChannels[0].position[0] - this.positionLidar[0], this.camChannels[0].position[1], 0.3, 1.0, 0.073);
                break;
            case 1:
                // front
                this.createPlane('rightplane', Math.PI / 2 - 35 * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidar[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(35 * 2 * Math.PI / 360), -this.camChannels[1].position[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPlane('leftplane', Math.PI / 2 - (-35) * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidar[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(-35 * 2 * Math.PI / 360), -this.camChannels[1].position[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(-35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPrism(0 * 2 * Math.PI / 360, this.camChannels[1].position[0] - this.positionLidar[0], this.camChannels[1].position[1], 0.3, 1.0, 0.073);
                break;
            case 2:
                // front right
                this.createPlane('rightplane', Math.PI / 2 - 90 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidar[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(90 * 2 * Math.PI / 360), -this.camChannels[2].position[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(90 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 20 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidar[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(20 * 2 * Math.PI / 360), -this.camChannels[2].position[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(20 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPrism(-55 * 2 * Math.PI / 360, this.camChannels[2].position[0] - this.positionLidar[0], this.camChannels[2].position[1], 0.3, 1.0, 0.073);
                break;
            case 3:
                // back right
                this.createPlane('rightplane', Math.PI / 2 - 145 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidar[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(145 * 2 * Math.PI / 360), -this.camChannels[3].position[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(145 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 75 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidar[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(75 * 2 * Math.PI / 360), -this.camChannels[3].position[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(75 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPrism(-110 * 2 * Math.PI / 360, this.camChannels[3].position[0] - this.positionLidar[0], this.camChannels[3].position[1], 0.3, 1.0, 0.073);
                break;
            case 4:
                // back
                this.createPlane('rightplane', Math.PI / 2 - 245 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidar[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(245 * 2 * Math.PI / 360), -this.camChannels[4].position[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(245 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPlane('leftplane', Math.PI / 2 - 115 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidar[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(115 * 2 * Math.PI / 360), -this.camChannels[4].position[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(115 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPrism(-180 * 2 * Math.PI / 360, this.camChannels[4].position[0] - this.positionLidar[0], this.camChannels[4].position[1], 0.97, 1.0, 0.046);
                break;
            case 5:
                // back left
                this.createPlane('rightplane', Math.PI / 2 - 285 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidar[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(285 * 2 * Math.PI / 360), -this.camChannels[5].position[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(285 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 215 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidar[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(215 * 2 * Math.PI / 360), -this.camChannels[5].position[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(215 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPrism(-250 * 2 * Math.PI / 360, this.camChannels[5].position[0] - this.positionLidar[0], this.camChannels[5].position[1], 0.3, 1.0, 0.073);
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
    changeFrame: function (fileNumber) {
        this.currentFileIndex = fileNumber;
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
        if (annotationFileExist(this.currentFileIndex, undefined)) {
            this.getAnnotations(this.currentFileIndex);
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
                    var windowWidth = $('#label-tool-wrapper').width();
                    var width = windowWidth / 4 > 100 ? windowWidth / 4 : 100;
                    var height = width * 5 / 8;
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
    var value = $(this).val();
    if (value == "") {
        value = 1;
    } else {
        value = parseInt(value);
    }
    labelTool.skipFrameCount = value;
});
