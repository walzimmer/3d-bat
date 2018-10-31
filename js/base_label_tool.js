var labelTool = {
    dataTypes: [],
    workBlob: '',         // Base url of blob
    currentFileIndex: 0,           // Base name of current file
    // fileNames: ['000000', '000001', '000002', '000003', '000004', '000005', '000006', '000007', '000008', '000009', '000010', '000011', '000012', '000013', '000014'],         // List of basenames of the files
    fileNames: [],
    labelId: -1,          // Initialize with 'setParameters'
    hasImage: false,      // Initialize with 'setParameters'
    hasPCD: false,        // Initialize with 'setParameters'
    hasLoadedImage: false,
    hasLoadedPCD: false,
    originalSize: [0, 0], // Original size of jpeg image
    originalAnnotations: [],   // For checking modified or not
    hold_flag: false,     // Hold bbox flag
    loadCount: 0,         // To prevent sending annotations before loading them
    selectedDataType: "",
    skipFrameCount: 1,
    targetClass: "vehicle.car",
    pageBox: document.getElementById('page_num'),
    savedFrames: [],
    // unsavedAnnotations: [], // For retrying save.
    // unsavedFrame: -1,
    // bkupExists: false,
    cameraMatrix: [],
    cubeArray: [],
    keypointsArray: [],
    bboxIndex: [],
    currentCameraChannelIndex: 0,
    camChannels: ['CAM_FRONT', 'CAM_FRONT_RIGHT', 'CAM_BACK_RIGHT', 'CAM_BACK', 'CAM_BACK_LEFT', 'CAM_FRONT_LEFT'],
    currentChannelLabel: document.getElementById('cam_channel'),
    positionLidar: [0.891067, 0.0, 1.84292],//(long, lat, vert)
    positionCameraFront: [1.671, -0.026, 1.536],//(long,lat, vert)
    positionCameraFrontRight: [1.593, -0.527, 1.526],
    positionCameraBackRight: [1.042, -0.456, 1.595],
    positionCameraBack: [0.086, -0.007, 1.541],
    positionCameraBackLeft: [1.055, 0.441, 1.605],
    positionCameraFrontLeft: [1.564, 0.472, 1.535],
    fieldOfViewLength: 50,
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
        "Image": function () {
        },
        "PCD": function () {
        }
    },

    localOnLoadAnnotation: {
        "Image": function (index, annotation) {
        },
        "PCD": function (index, annotation) {
        }
    },

    localOnSelectBBox: {
        "Image": function (newIndex, oldIndex) {
        },
        "PCD": function (newIndex, oldIndex) {
        }
    },

    localOnInitialize: {
        "Image": function () {
        },
        "PCD": function () {
        }
    },

    // Visualize 2d and 3d data
    showData: function () {
        if (this.selectedDataType == "Image" && !this.hasLoadedImage) {
            this.localOnLoadData["Image"]();
            this.hasLoadedImage = true;
        }
        if (this.selectedDataType == "PCD" && !this.hasLoadedPCD) {
            this.localOnLoadData["Image"]();
            this.localOnLoadData["PCD"]();
            this.hasLoadedPCD = true;
        }
    },

    loadKeypoints: function (keypoints) {
        // Remove old keypointObjects of current frame.
        keypoints.clear();
        // Add new bounding boxes.
        for (var i in keypoints) {
            var hasLabel = {
                "Image": false
            };
            var keypoint = keypoints[i];
            keypoints.selectEmpty();
            if (this.hasData("Image")) {
                var params = {
                    x: keypoint.x,
                    y: keypoint.y,
                };
                //annotationObjects.setTarget("Image", params, label);
                keypoints.setTarget("Image", params, keypoints[i].label);
                hasLabel["Image"] = true;
            }
        }
    },

    // Set values to this.annotationObjects from annotations
    loadAnnotations: function (annotations) {
        // Remove old bounding boxes of current frame.
        annotationObjects.clear();
        // Add new bounding boxes.
        for (var i in annotations) {
            // convert 2D bounding box to integer values
            ["left", "right", "top", "bottom"].forEach(function (key) {
                annotations[i][key] = parseInt(annotations[i][key]);
            });
            var hasLabel = {
                "Image": false,
                "PCD": false
            };
            var annotation = annotations[i];
            annotationObjects.selectEmpty();
            if (this.hasData("Image")) {
                if (!(annotation.left == 0 && annotation.top == 0 &&
                    annotation.right == 0 && annotation.bottom == 0)) {
                    var minPos = convertPositionToCanvas(annotation.left, annotation.top);
                    var maxPos = convertPositionToCanvas(annotation.right, annotation.bottom);
                    var params = {
                        x: minPos[0],
                        y: minPos[1],
                        width: maxPos[0] - minPos[0],
                        height: maxPos[1] - minPos[1]
                    };
                    //annotationObjects.setTarget("Image", params, label);
                    annotationObjects.setTarget("Image", params, annotations[i].label);
                    hasLabel["Image"] = true;
                }
            }
            if (this.hasData("PCD")) {
                var readMat = matrixProduct(this.cameraMatrix, [parseFloat(annotation.x),
                    parseFloat(annotation.y),
                    parseFloat(annotation.z),
                    1]);
                var tmpWidth = parseFloat(annotation.width);
                var tmpHeight = parseFloat(annotation.height);
                var tmpDepth = parseFloat(annotation.length);
                if (!(tmpWidth == 0.0 && tmpHeight == 0.0 && tmpDepth == 0.0)) {
                    hasPCDLabel = true;
                    tmpWidth = Math.max(tmpWidth, 0.0001);
                    tmpHeight = Math.max(tmpHeight, 0.0001);
                    tmpDepth = Math.max(tmpDepth, 0.0001);
                    var params = {
                        x: readMat[0],
                        y: -readMat[1],
                        z: readMat[2],
                        delta_x: 0,
                        delta_y: 0,
                        delta_z: 0,
                        width: tmpWidth,
                        height: tmpHeight,
                        depth: tmpDepth,
                        yaw: parseFloat(annotation.rotation_y),
                        org: original = {
                            x: readMat[0],
                            y: -readMat[1],
                            z: readMat[2],
                            width: tmpWidth,
                            height: tmpHeight,
                            depth: tmpDepth,
                            yaw: parseFloat(annotation.rotation_y)
                        }
                    };
                    //addbbox(readfile_parameters, index); //
                    //annotationObjects.selectEmpty();
                    annotationObjects.set(i, "PCD", params);
                    //annotationObjects.setTarget("PCD", params, label);
                    hasLabel["PCD"] = true;
                }
            }
            /* else {
                    annotations[i].truncated = 0;
                    annotations[i].occluded = 3;
                    annotations[i].alpha = 0;
                    annotations[i].height = 0;
                    annotations[i].width = 0;
                    annotations[i].length = 0;
                    annotations[i].x = 0;
                    annotations[i].y = 0;
                    annotations[i].z = 0;
                    annotations[i].rotation_y = 0;
                    }*/
            if (!hasLabel["Image"] && !hasLabel["PCD"]) {
                annotationObjects.pop();
            }
        }
        // Backup initial positions.
        // this.originalAnnotations = this.createAnnotations();
        /* this.originalAnnotations = annotations;*/ // This is better but messed by 1px diffs.
    },

    // Create annotations from this.annotationObjects
    createAnnotations: function () {
        var annotations = [];
        for (var i = 0; i < annotationObjects.length(); ++i) {
            if (!annotationObjects.exists(i, "Image") && !annotationObjects.exists(i, "PCD")) {
                continue;
            }
            var annotation = {
                label: annotationObjects.get(i, "class"),
                truncated: 0,
                occluded: 3,
                alpha: 0, // calculated by python script
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                height: 0,
                width: 0,
                length: 0, // depth
                x: 0,
                y: 0,
                z: 0,
                rotation_y: 0,
                score: 0,
                vehicle: {
                    rear_light_left: {x: -1, y: -1},
                    rear_light_right: {x: -1, y: -1},
                    front_light_left: {x: -1, y: -1},
                    front_light_right: {x: -1, y: -1},
                }
            };

            if (annotationObjects.exists(i, "Image")) {
                var rect = annotationObjects.get(i, "Image")["rect"];
                var minPos = convertPositionToFile(rect.attr("x"), rect.attr("y"));
                var maxPos = convertPositionToFile(rect.attr("x") + rect.attr("width"),
                    rect.attr("y") + rect.attr("height"));
                annotation["left"] = minPos[0];
                annotation["top"] = minPos[1];
                annotation["right"] = maxPos[0];
                annotation["bottom"] = maxPos[1];
                var keypoints = annotationObjects.get(i, "Image")["keypoints"];
                annotation["vehicle"]["rear_light_left"]["x"] = keypoints["vehicle"]["rear_light_left"]["x"];
                annotation["vehicle"]["rear_light_left"]["y"] = keypoints["vehicle"]["rear_light_left"]["y"];
                annotation["vehicle"]["rear_light_right"]["x"] = keypoints["vehicle"]["rear_light_right"]["x"];
                annotation["vehicle"]["rear_light_right"]["y"] = keypoints["vehicle"]["rear_light_right"]["y"];
                annotation["vehicle"]["front_light_left"]["x"] = keypoints["vehicle"]["front_light_left"]["x"];
                annotation["vehicle"]["front_light_left"]["y"] = keypoints["vehicle"]["front_light_left"]["y"];
                annotation["vehicle"]["front_light_right"]["x"] = keypoints["vehicle"]["front_light_right"]["x"];
                annotation["vehicle"]["front_light_right"]["y"] = keypoints["vehicle"]["front_light_right"]["y"];
            }
            if (annotationObjects.exists(i, "PCD")) {
                var currentAnnotationIndex = this.bboxIndex[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex].lastIndexOf(i.toString());
                if (currentAnnotationIndex !== -1) {
                    var cubeMat = [this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].position.x,
                        this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].position.y,
                        this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].position.z,
                        1];
                    var resultMat = matrixProduct(inverseMatrix(this.cameraMatrix), cubeMat);
                    annotation["height"] = this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].scale.y;
                    annotation["width"] = this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].scale.x;
                    annotation["length"] = this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].scale.z;
                    annotation["x"] = resultMat[0];
                    annotation["y"] = resultMat[1];
                    annotation["z"] = resultMat[2];
                    annotation["rotation_y"] = this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex][currentAnnotationIndex].rotation.z;
                    annotation["score"] = 1.0;
                }
            }
            annotations.push(annotation);
        }
        return annotations;
    },
    createKeypoints: function () {
        var keypointsList = [];
        for (var i = 0; i < keypointObjects.length(); ++i) {
            var keypoint = {
                label: keypointObjects.get(i, "class"),
                x: labelTool.keypointsArray[i].x,
                y: labelTool.keypointsArray[i].y
            };
            keypoint["x"] = keypoint.x;
            keypoint["y"] = keypoint.y;
            keypointsList.push(keypoint);
        }
        return keypointsList;
    },

    /* addImageBBoxToTable: function(index) {
       $("#bbox-image-" + index).css("color", classesBoundingBox[this.annotationObjects[index]["label"]].color);
     * },
     * 
     * addPCDBBoxToTable: function(index) {
       var color = classesBoundingBox.selected().color;
       if (this.annotationObjects[index] != undefined) {
       color = classesBoundingBox[this.annotationObjects[index]["label"]].color;
       }
       $("#bbox-pcd-" + index).css("color", color);
     * },
     * 
     * removeImageBBoxFromTable: function(index) {
       $("#bbox-image-" + index).css("color", "#888");
     * },
     * 
     * removePCDBBoxFromTable: function(index) {
       $("#bbox-pcd-" + index).css("color", "#888");
     * },

     * clearBBoxTable: function() {
       $("#bbox-table").empty();
     * },
     */
    /* 
     * addBBoxToTable: function(index, hasImageLabel, hasPCDLabel) {
       if (!$("#bbox-number-" + index)[0]) {
       var $li = $('<li class="jpeg-label-sidebar-item" onClick="labelTool.selectBBox(' + index + ')">'
       + '<div class="label-tool-sidebar-number-box">'
       + '<p class="label-tool-sidebar-text number" id="bbox-number-' + index + '">' + index + '.</p>'
       + '</div>'
       + '</li>'
       );
       $li.append($('<p class="label-tool-sidebar-text bbox" id="bbox-image-' + index + '">Image</p>'));
       $li.append($('<p class="label-tool-sidebar-text bbox" id="bbox-pcd-' + index + '">PCD</p>'));
       $("#bbox-table").append($li);
       }
       if (hasImageLabel) {
       this.addImageBBoxToTable(index);
       }
       if (hasPCDLabel) {
       this.addPCDBBoxToTable(index);
       }
     * },*/

    initialize: function () {
        this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        // annotationObjects.init();
        annotationObjects.selectEmpty();
        keypointObjects.selectEmpty();
        this.dataTypes.forEach(function (dataType) {
            this.localOnInitialize[dataType]();
        }.bind(this));

        // changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);
        // // dat.GUI.toggleHide();
        // $('#canvas3d').show();
        // this.addResizeEventForPCD();
        // this.showData();
    },

    getKeypoints(currentFileIndex) {
        this.loadCount++;
        var fileName = this.fileNames[currentFileIndex] + ".txt";
        var targetFile = this.currentFileIndex;
        request({
            url: '/label/keypointObjects/',
            type: 'GET',
            dataType: 'json',
            data: {
                file_name: fileName,
                label_id: this.labelId,
                channel: this.camChannels[this.currentCameraChannelIndex]
            },
            success: function (res) {
                if (targetFile == this.currentFileIndex) {
                    this.loadKeypoints(res);
                }
                this.loadCount--;
            }.bind(this),
            error: function (res) {
                this.loadCount--;
            }.bind(this)
        });
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
                file_name: fileName,
                label_id: this.labelId,
                channel: this.camChannels[this.currentCameraChannelIndex]
            },
            success: function (res) {
                if (targetFile == this.currentFileIndex) {
                    this.loadAnnotations(res);
                }
                this.loadCount--;
            }.bind(this),
            error: function (res) {
                this.loadCount--;
            }.bind(this)
        });
    },

    setAnnotations(annotations) {
        if (this.loadCount != 0) {
            return;
        }
        this.pending = true;
        var fileName = this.fileNames[this.currentFileIndex];
        var fileNumber = this.currentFileIndex;
        request({
            url: '/label/annotations/',
            type: 'POST',
            dataType: 'html',
            data: {
                file_name: fileName + ".txt",
                annotations: JSON.stringify(annotations),
                label_id: this.labelId
            },
            success: function (res) {
                // $("#label-tool-log").val("Saved frame " + (fileNumber + 1));
                // $("#label-tool-log").css("color", "#3ABB9D");
                this.pending = false;
            }.bind(this),
            error: function (res) {
                // $("#label-tool-log").val("Failed to save frame " + (fileNumber + 1));
                // $("#label-tool-log").css("color", "#E66B5B");
                // this.unsavedAnnotations = annotations;
                // this.unsavedFrame = fileNumber;
                // this.bkupExists = true;
                this.pending = false;
            }.bind(this)
        })
    },

    // retrySave() {
    //     if (!this.bkupExists) {
    //         return;
    //     }
    //     $("#label-tool-log").val("Retrying to save frame " + (this.unsavedFrame + 1) + "...");
    //     $("#label-tool-log").css("color", "#fff");
    //     var fileName = this.fileNames[this.unsavedFrame];
    //     request({
    //         url: '/label/annotations/',
    //         type: 'POST',
    //         dataType: 'html',
    //         data: {
    //             file_name: fileName + ".txt",
    //             annotations: JSON.stringify(this.unsavedAnnotations),
    //             label_id: this.labelId + 1
    //         },
    //         success: function (res) {
    //             $("#label-tool-log").val("Saved frame " + (this.unsavedFrame + 1));
    //             $("#label-tool-log").css("color", "#fff");
    //             this.bkupExists = false;
    //             this.pending = false;
    //         }.bind(this),
    //         error: function (res) {
    //             $("#label-tool-log").val("Failed to save frame " + (this.unsavedFrame + 1));
    //             $("#label-tool-log").css("color", "#f00");
    //             this.pending = false;
    //         }.bind(this)
    //     });
    // },

    getInformations() {
        request({
            url: "/labels/",
            type: "GET",
            dataType: "json",
            data: {label_id: this.labelId},
            complete: function (res) {
                var dict = JSON.parse(res.responseText)[0];
                this.workBlob = dict.blob;
                // this.currentFileIndex = dict.progress - 101;
                this.getImageSize();
            }.bind(this)
            /* ,fail: function(res) {
               if (this.dataType == "JPEG") {
               textBox.value = "Failed....";
               }
               }.bind(this)*/
        })
    },

    getImageSize() {
        request({
            url: "/label/image_size/",
            type: "GET",
            dataType: "json",
            data: {label_id: this.labelId},
            complete: function (res) {
                var dict = JSON.parse(res.responseText);
                this.originalSize[0] = dict.width;
                this.originalSize[1] = dict.height;
                this.getFileNames();
            }.bind(this)
            /* ,fail: function(res) {
               if (this.dataType == "JPEG") {
               textBox.value = "Failed....";
               }
               }.bind(this)*/
        })
    },

    getFileNames() {
        request({
            url: "/label/file_names/",
            type: "GET",
            dataType: "json",
            data: {label_id: this.labelId},
            complete: function (res) {
                var dict = JSON.parse(res.responseText);
                this.fileNames = dict["file_names"];
                this.initialize();
                this.showData();
                this.getAnnotations(this.currentFileIndex);
                this.getKeypoints(this.currentFileIndex);
            }.bind(this)
        });
    },

    setParameters: function (labelId, dataTypeString) {
        ["Image", "PCD"].forEach(function (dataType) {
            if (dataTypeString.indexOf(dataType) != -1) {
                this.dataTypes.push(dataType);
            }
        }.bind(this));
        this.labelId = labelId;
        this.selectedDataType = this.dataTypes[1];
        // dat.GUI.toggleHide();
        // if (!(this.dataTypes.indexOf("Image") >= 0)) {
        //     this.toggleDataType();
        // }
    },

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
     * 	return this.annotationObjects[index]["Image"];
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
     * 	return this.annotationObjects[this.targetBBox]["Image"];
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
     * 		"Image": bbox
     * 	    };
     * 	} else {
     * 	    this.annotationObjects[index]["Image"] = bbox;
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
     * 		"Image": bbox
     * 	    };
     * 	} else {
     * 	    this.annotationObjects[this.targetBBox]["Image"] = bbox;
     * 	}
     *     },*/

    hasData: function (dataType) {
        return this.dataTypes.indexOf(dataType) >= 0;
    },

    previousCamChannel: function () {
        var currentChannel = this.currentCameraChannelIndex;
        this.currentCameraChannelIndex = this.currentCameraChannelIndex - 1;
        if (this.currentCameraChannelIndex < 0) {
            this.currentCameraChannelIndex = 5;
        }
        this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    },

    nextCamChannel: function () {
        var currentChannel = this.currentCameraChannelIndex;
        this.currentCameraChannelIndex = this.currentCameraChannelIndex + 1;
        if (this.currentCameraChannelIndex > 5) {
            this.currentCameraChannelIndex = 0;
        }
        this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    },

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
        for (var i = scene.children.length - 1; i >= 0; i--) {
            obj = scene.children[i];
            if (obj.name == objectName) {
                scene.remove(obj);
            }
        }
    },
    createPlane: function (name, angle, xpos, ypos) {
        var geometryRightPlane = new THREE.BoxGeometry(this.fieldOfViewLength, 2, 0.08);
        geometryRightPlane.rotateX(Math.PI / 2);
        geometryRightPlane.rotateZ(angle);
        geometryRightPlane.translate(ypos, xpos, -0.7);//y/x/z
        var material = new THREE.MeshBasicMaterial({
            color: 0x525252,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        var planeRight = new THREE.Mesh(geometryRightPlane, material);
        planeRight.name = name;
        scene.add(planeRight);
    }, createPrism: function (angle, posx, posy, width, openingLength, offsetX) {
        var posXCenter = 0 * Math.cos(angle) - offsetX * Math.sin(angle);
        var posYCenter = 0 * Math.sin(angle) + offsetX * Math.cos(angle);
        var positionCornerCenter = new THREE.Vector2(posXCenter, posYCenter);
        var posXLeft = -width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        var posYLeft = -width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        var positionCornerLeft = new THREE.Vector2(posXLeft, posYLeft);
        var posXRight = width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        var posYRight = width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        var positionCornerRight = new THREE.Vector2(posXRight, posYRight);
        var materialPrism = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5});
        var height = 2;
        var geometryPrism = new PrismGeometry([positionCornerCenter, positionCornerLeft, positionCornerRight], height);
        geometryPrism.translate(-posy, posx, -1.7);
        var prismMesh = new THREE.Mesh(geometryPrism, materialPrism);
        prismMesh.name = "prism";
        scene.add(prismMesh);
    }, drawFieldOfView: function () {
        switch (labelTool.currentCameraChannelIndex) {
            case 0:
                this.createPlane('rightplane', Math.PI / 2 - 35 * 2 * Math.PI / 360, this.positionCameraFront[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(35 * 2 * Math.PI / 360), -this.positionCameraFront[1] + this.fieldOfViewLength / 2 * Math.sin(35 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - (-35) * 2 * Math.PI / 360, this.positionCameraFront[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(-35 * 2 * Math.PI / 360), -this.positionCameraFront[1] + this.fieldOfViewLength / 2 * Math.sin(-35 * 2 * Math.PI / 360));
                this.createPrism(0 * 2 * Math.PI / 360, this.positionCameraFront[0] - this.positionLidar[0], this.positionCameraFront[1], 0.3, 1.0, 0.073);
                break;
            case 1:
                this.createPlane('rightplane', Math.PI / 2 - 90 * 2 * Math.PI / 360, this.positionCameraFrontRight[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(90 * 2 * Math.PI / 360), -this.positionCameraFrontRight[1] + this.fieldOfViewLength / 2 * Math.sin(90 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - 20 * 2 * Math.PI / 360, this.positionCameraFrontRight[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(20 * 2 * Math.PI / 360), -this.positionCameraFrontRight[1] + this.fieldOfViewLength / 2 * Math.sin(20 * 2 * Math.PI / 360));
                this.createPrism(-55 * 2 * Math.PI / 360, this.positionCameraFrontRight[0] - this.positionLidar[0], this.positionCameraFrontRight[1], 0.3, 1.0, 0.073);
                break;
            case 2:
                this.createPlane('rightplane', Math.PI / 2 - 145 * 2 * Math.PI / 360, this.positionCameraBackRight[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(145 * 2 * Math.PI / 360), -this.positionCameraBackRight[1] + this.fieldOfViewLength / 2 * Math.sin(145 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - 75 * 2 * Math.PI / 360, this.positionCameraBackRight[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(75 * 2 * Math.PI / 360), -this.positionCameraBackRight[1] + this.fieldOfViewLength / 2 * Math.sin(75 * 2 * Math.PI / 360));
                this.createPrism(-110 * 2 * Math.PI / 360, this.positionCameraBackRight[0] - this.positionLidar[0], this.positionCameraBackRight[1], 0.3, 1.0, 0.073);
                break;
            case 3:
                this.createPlane('rightplane', Math.PI / 2 - 245 * 2 * Math.PI / 360, this.positionCameraBack[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(245 * 2 * Math.PI / 360), -this.positionCameraBack[1] + this.fieldOfViewLength / 2 * Math.sin(245 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - 115 * 2 * Math.PI / 360, this.positionCameraBack[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(115 * 2 * Math.PI / 360), -this.positionCameraBack[1] + this.fieldOfViewLength / 2 * Math.sin(115 * 2 * Math.PI / 360));
                this.createPrism(-180 * 2 * Math.PI / 360, this.positionCameraBack[0] - this.positionLidar[0], this.positionCameraBack[1], 0.97, 1.0, 0.046);
                break;
            case 4:
                this.createPlane('rightplane', Math.PI / 2 - 285 * 2 * Math.PI / 360, this.positionCameraBackLeft[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(285 * 2 * Math.PI / 360), -this.positionCameraBackLeft[1] + this.fieldOfViewLength / 2 * Math.sin(285 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - 215 * 2 * Math.PI / 360, this.positionCameraBackLeft[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(215 * 2 * Math.PI / 360), -this.positionCameraBackLeft[1] + this.fieldOfViewLength / 2 * Math.sin(215 * 2 * Math.PI / 360));
                this.createPrism(-250 * 2 * Math.PI / 360, this.positionCameraBackLeft[0] - this.positionLidar[0], this.positionCameraBackLeft[1], 0.3, 1.0, 0.073);
                break;
            case 5:
                this.createPlane('rightplane', Math.PI / 2 - 340 * 2 * Math.PI / 360, this.positionCameraFrontLeft[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(340 * 2 * Math.PI / 360), -this.positionCameraFrontLeft[1] + this.fieldOfViewLength / 2 * Math.sin(340 * 2 * Math.PI / 360));
                this.createPlane('leftplane', Math.PI / 2 - 270 * 2 * Math.PI / 360, this.positionCameraFrontLeft[0] - this.positionLidar[0] + this.fieldOfViewLength / 2 * Math.cos(270 * 2 * Math.PI / 360), -this.positionCameraFrontLeft[1] + this.fieldOfViewLength / 2 * Math.sin(270 * 2 * Math.PI / 360));
                this.createPrism(-305 * 2 * Math.PI / 360, this.positionCameraFrontLeft[0] - this.positionLidar[0], this.positionCameraFrontLeft[1], 0.3, 1.0, 0.073);
                break;
        }
    }, changeCamChannel: function (currentChannelNumber, nextChannelNumber) {
        // change label text
        this.currentChannelLabel.innerHTML = this.camChannels[nextChannelNumber];
        // if (this.bkupExists) {
        //     return;
        // }
        // var annotations = this.createAnnotations();
        // if (JSON.stringify(annotations) != JSON.stringify(this.originalAnnotations)) {
        //     this.setAnnotations(annotations);
        // }
        // this.currentFileIndex = Number(this.pageBox.value);
        // remove gui elements from previous frame
        if (this.dataTypes.indexOf("PCD") >= 0 && this.hold_flag == false) {
            //for (var k = 0; k < this.cubeArray.length; k++) {
            var cubeLength;
            if (this.cubeArray[labelTool.currentFileIndex][currentChannelNumber] == undefined) {
                cubeLength = 0;
            } else {
                cubeLength = this.cubeArray[labelTool.currentFileIndex][currentChannelNumber].length
            }
            // remove all folder of current channel
            for (var k = 0; k < cubeLength; k++) {
                guiOptions.removeFolder('BoundingBox' + String(this.bboxIndex[labelTool.currentFileIndex][currentChannelNumber][k]));
                this.cubeArray[labelTool.currentFileIndex][currentChannelNumber][k].visible = false;
            }
        }
        if (this.hasPCD && this.hasLoadedPCD) {
            ground_mesh.visible = false;
            c_flag = false;
            r_flag = false;
            if (this.hold_flag == false) {
                this.bboxes = [];
                // do not delete bounding boxes that were set previously
                // this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex] = [];
                numbertagList = [];
                bounding_box_3d_array = [];
                guiTag = [];
                numbertagList = [];
                folder_position = [];
                folder_size = [];
                this.bboxIndex[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
            }
        }
        this.hasLoadedImage = false;
        this.hasLoadedPCD = false;
        this.showData();

        // render labels
        if (this.hold_flag) {
            // use annotations of current frame for next frame
        } else {
            // hold flag not set
            // if annotations were saved for this frame before then use those
            // otherwise load annotations from file
            if (this.savedFrames[this.currentFileIndex][this.currentCameraChannelIndex] == true) {

            } else {
                // load annotations from file if they exist, otherwise show blank image
                if (annotationFileExist(this.currentFileIndex, nextChannelNumber)) {
                    this.getAnnotations(this.currentFileIndex);
                } else {
                    // no annotations are loaded
                }
                // load keypointObjects from file if they exist, otherwise show blank image
                if (keypointFileExist(this.currentFileIndex, nextChannelNumber)) {
                    this.getKeypoints(this.currentFileIndex);
                } else {
                    // no annotations are loaded
                }

            }
        }

        // change FOV of camera
        this.removeObject('rightplane');
        this.removeObject('leftplane');
        this.removeObject('prism');
        this.drawFieldOfView();


    },
    changeFrame: function (fileNumber) {
        // reset channel index
        // this.currentCameraChannelIndex = 0;
        // if (this.bkupExists) {
        //     return;
        // }
        // var annotations = this.createAnnotations();
        // if (JSON.stringify(annotations) != JSON.stringify(this.originalAnnotations)) {
        //     this.setAnnotations(annotations);
        // }
        this.currentFileIndex = fileNumber;
        this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        this.pageBox.value = "";
        if (this.dataTypes.indexOf("PCD") >= 0 && this.hold_flag == false) {
            //for (var k = 0; k < this.cubeArray.length; k++) {
            for (var k = 0; k < this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex].length; k++) {
                guiOptions.removeFolder('BoundingBox' + String(this.bboxIndex[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][k]));
                //this.cubeArray[k].visible = false;
                this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][k].visible = false;
            }
        }
        if (this.hasPCD && this.hasLoadedPCD) {
            ground_mesh.visible = false;
            c_flag = false;
            r_flag = false;
            if (this.hold_flag == false) {
                // this.annotationObjects = [];
                this.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
                numbertagList = [];
                bounding_box_3d_array = [];
                guiTag = [];
                numbertagList = [];
                folder_position = [];
                folder_size = [];
                this.bboxIndex[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
            }
        }
        this.hasLoadedImage = false;
        this.hasLoadedPCD = false;
        this.showData();
        // if (!this.hold_flag) {
        //     this.getAnnotations();
        // } else {
        //     this.originalAnnotations = "Unknown";
        // }
        // render labels
        if (this.hold_flag) {
            // use annotations of current frame for next frame
            if (annotationFileExist(this.currentFileIndex - 1, this.currentCameraChannelIndex)) {
                this.getAnnotations(this.currentFileIndex - 1);
            }
            if (keypointFileExist(this.currentFileIndex - 1, this.currentCameraChannelIndex)) {
                this.getKeypoints(this.currentFileIndex - 1);
            }
        } else {
            // hold flag not set
            // if annotations were saved for this frame before then use those
            // otherwise load annotations from file
            if (this.savedFrames[this.currentFileIndex][this.currentCameraChannelIndex] == true) {

            } else {
                // load annotations from file if they exist, otherwise show blank image
                if (annotationFileExist(this.currentFileIndex, this.currentCameraChannelIndex)) {
                    this.getAnnotations(this.currentFileIndex);
                } else {
                    // no annotations are loaded
                    annotationObjects.clear();
                }
                // load keypointObjects from file if they exist, otherwise show blank image
                if (keypointFileExist(this.currentFileIndex, this.currentCameraChannelIndex)) {
                    this.getKeypoints(this.currentFileIndex);
                } else {
                    // no annotations are loaded
                    keypointObjects.clear();
                }
            }
        }
    },

    addResizeEventForImage: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            keepAspectRatio();
        });
    },

    addResizeEventForPCD: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            $(function () {
                if ($("#jpeg-label-canvas").css("display") == "block") {
                    var windowWidth = $('#label-tool-wrapper').width();
                    var width = windowWidth / 4 > 100 ? windowWidth / 4 : 100;
                    var height = width * 5 / 8;
                    // changeCanvasSize(width, height);
                }
            });
        });
    },

    // toggleDataType: function () {
    //     $("#label-tool-log").val("4. Step: Draw 3D label");
    //     $("#label-tool-log").css("color", "#969696");
    //     if (this.selectedDataType == "Image") {
    //         if (this.dataTypes.indexOf("PCD") >= 0) {
    //             dat.GUI.toggleHide();
    //             this.selectedDataType = "PCD";
    //             $('#canvas3d').show();
    //             if (!bird_view_flag) {
    //                 $('#jpeg-label-canvas').hide();
    //             } else {
    //                 changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);
    //             }
    //             document.getElementById("label-toggle-button").innerText = "Image";
    //             this.addResizeEventForPCD();
    //             this.showData();
    //         }
    //     } else {
    //         if (this.dataTypes.indexOf("Image") >= 0) {
    //             dat.GUI.toggleHide();
    //             this.selectedDataType = "Image";
    //             $('#canvas3d').hide();
    //             $('#jpeg-label-canvas').show();
    //             document.getElementById("label-toggle-button").innerText = "PCD";
    //             this.addResizeEventForImage();
    //             keepAspectRatio();
    //             this.showData();
    //         }
    //     }
    // },

    toggleHold: function () {
        if (this.hold_flag) {
            $("#hold-toggle-button").css("color", "#ddd");
        } else {
            $("#hold-toggle-button").css("color", "#4894f4");
        }
        this.hold_flag = !this.hold_flag;
    },

    resetBoxesAndKeypoints: function () {
        this.getAnnotations(this.currentFileIndex);
        this.getKeypoints(this.currentFileIndex);
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


    getTargetDataType: function () {
        return this.selectedDataType;
    },

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
