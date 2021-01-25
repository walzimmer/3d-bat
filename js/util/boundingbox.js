let annotationObjects = {
    contents: [],
    contentsDetections: [],
    localOnSelect: {
        "CAM_FRONT_LEFT": function (index) {
        },
        "CAM_FRONT": function (index) {
        },
        "CAM_FRONT_RIGHT": function (index) {
        },
        "CAM_BACK_RIGHT": function (index) {
        },
        "CAM_BACK": function (index) {
        },
        "CAM_BACK_LEFT": function (index) {
        },
        "PCD": function (index) {
        }
    },
    onSelect: function (dataType, f) {
        this.localOnSelect[dataType] = f;
    },
    localOnChangeClass: {
        "CAM_FRONT_LEFT": function (index, label) {
        },
        "CAM_FRONT": function (index, label) {
        },
        "CAM_FRONT_RIGHT": function (index, label) {
        },
        "CAM_BACK_RIGHT": function (index, label) {
        },
        "CAM_BACK": function (index, label) {
        },
        "CAM_BACK_LEFT": function (index, label) {
        },
        "PCD": function (index, label) {
        }
    },
    onChangeClass: function (dataType, f) {
        this.localOnChangeClass[dataType] = f;
    },
    onRemove: function (dataType) {

    },
    get: function (index, channel) {
        if (this.contents[index] === undefined) {
            return undefined;
        }
        if (channel === undefined) {
            return this.contents[index];
        }
        return this.contents[index][channel];
    },
    set: function (insertIndex, params) {
        let obj = get3DLabel(params);
        if (this.contents[params.fileIndex][insertIndex] === undefined) {
            this.contents[params.fileIndex].push(obj);
        } else {
            this.contents[params.fileIndex][insertIndex] = obj;
        }
        this.contents[params.fileIndex][insertIndex]["class"] = params.class;
        this.contents[params.fileIndex][insertIndex]["interpolationStart"] = params["interpolationStart"];
        this.contents[params.fileIndex][insertIndex]["interpolationStartFileIndex"] = params.interpolationStartFileIndex;
        this.contents[params.fileIndex].insertIndex = insertIndex;
        if (params.fromFile === false && this.__selectionIndexCurrentFrame === -1) {
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                this.contents[params.fileIndex][insertIndex]["trackId"] = classesBoundingBox[params.class].nextTrackId;
            } else {
                this.contents[params.fileIndex][insertIndex]["trackId"] = classesBoundingBox[params.class].nextTrackId;
            }
        } else {
            this.contents[params.fileIndex][insertIndex]["trackId"] = params.trackId;
        }
        this.contents[params.fileIndex][insertIndex]["channels"] = params.channels;
        this.contents[params.fileIndex][insertIndex]["fileIndex"] = params.fileIndex;
        this.contents[params.fileIndex][insertIndex]["copyLabelToNextFrame"] = params.copyLabelToNextFrame;
    },
    changeClass: function (selectedObjectIndex, newClassLabel) {
        if (this.contents[labelTool.currentFileIndex][selectedObjectIndex] === undefined) {
            return false;
        }

        // return if same class was chosen again
        let currentClassLabel = this.contents[labelTool.currentFileIndex][selectedObjectIndex]["class"];
        if (currentClassLabel === newClassLabel) {
            return false;
        }


        // update id of sprite
        let currentTrackId = this.contents[labelTool.currentFileIndex][selectedObjectIndex]["trackId"];
        let spriteElem = $("#class-" + currentClassLabel.charAt(0) + currentTrackId);
        // use original track id if original class selected
        let nextTrackIdNewClass;
        if (newClassLabel === this.contents[labelTool.currentFileIndex][selectedObjectIndex]["original"]["class"]) {
            nextTrackIdNewClass = this.contents[labelTool.currentFileIndex][selectedObjectIndex]["original"]["trackId"]
        } else {
            nextTrackIdNewClass = classesBoundingBox[newClassLabel]["nextTrackId"];
        }

        $(spriteElem).attr("id", "class-" + newClassLabel.charAt(0) + nextTrackIdNewClass).attr("background", "rgba(255, 255, 255, 0.8)");

        // update background color of sprite
        $($(spriteElem)[0]).css("background", classesBoundingBox[newClassLabel].color);

        // update class label
        this.contents[labelTool.currentFileIndex][selectedObjectIndex]["class"] = newClassLabel;

        // update track id
        this.contents[labelTool.currentFileIndex][selectedObjectIndex]["trackId"] = nextTrackIdNewClass;
        // set next highest track ID of current class

        setHighestAvailableTrackId(currentClassLabel);
        // increase track id of new class
        classesBoundingBox[newClassLabel]["nextTrackId"] = classesBoundingBox[newClassLabel]["nextTrackId"] + 1;

        // update text of sprite
        $($(spriteElem)[0]).text(newClassLabel.charAt(0) + nextTrackIdNewClass + " | " + newClassLabel);
        // update name of sprite
        labelTool.spriteArray[labelTool.currentFileIndex][selectedObjectIndex].name = "sprite-" + newClassLabel.charAt(0) + nextTrackIdNewClass;

        // update class of folder and track id instead of creating new folder
        folderBoundingBox3DArray[selectedObjectIndex].domElement.children[0].children[0].innerHTML = newClassLabel + ' ' + nextTrackIdNewClass;
        //                                                           ul        number      div       div[class c]    input
        folderBoundingBox3DArray[selectedObjectIndex].domElement.children[0].children[4].children[0].children[1].children[0].value = nextTrackIdNewClass;

        guiOptions.__folders[newClassLabel + ' ' + nextTrackIdNewClass] = guiOptions.__folders[currentClassLabel + ' ' + currentTrackId];
        delete guiOptions.__folders[currentClassLabel + ' ' + currentTrackId];

        // open current folder
        folderBoundingBox3DArray[selectedObjectIndex].open();
        folderPositionArray[selectedObjectIndex].open();
        folderRotationArray[selectedObjectIndex].open();
        folderSizeArray[selectedObjectIndex].open();
        // update name of selected object
        labelTool.selectedMesh.name = "cube-" + newClassLabel.charAt(0) + nextTrackIdNewClass;
        for (let channelObj in labelTool.camChannels) {
            if (labelTool.camChannels.hasOwnProperty(channelObj)) {
                let channelObject = labelTool.camChannels[channelObj];
                this.localOnChangeClass[channelObject.channel](selectedObjectIndex, newClassLabel);
            }
        }
        this.localOnChangeClass["PCD"](selectedObjectIndex, newClassLabel);
        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[classesBoundingBox[newClassLabel].index]).css('background-color', '#525252');
    },
    getSelectedBoundingBox: function () {
        if (this.__selectionIndexCurrentFrame === -1 || this.contents[labelTool.currentFileIndex][this.__selectionIndexCurrentFrame] === undefined) {
            return undefined;
        } else {
            return this.contents[labelTool.currentFileIndex][this.__selectionIndexCurrentFrame];
        }
    },
    setSelectionIndex: function (selectionIndex, channel) {
        // show bounding box highlighting
        this.__selectionIndexCurrentFrame = selectionIndex;
        if (selectionIndex !== -1) {
            this.localOnSelect[channel](selectionIndex);
            return true;
        } else {
            return false;
        }
    },
    select: function (objectIndex, channel) {
        this.setSelectionIndex(objectIndex, channel);
        this.localOnSelect["PCD"](objectIndex);
    },
    getSelectionIndex: function () {
        return this.__selectionIndexCurrentFrame;
    },
    selectEmpty: function () {
        this.setSelectionIndex(-1, undefined);
    },
    remove: function (index) {
        // remove 3d object
        labelTool.removeObject("cube-" + this.contents[labelTool.currentFileIndex][index]["class"].charAt(0) + this.contents[labelTool.currentFileIndex][index]["trackId"]);
        // remove 2d object
        remove(index);
        delete this.contents[labelTool.currentFileIndex][index];
        this.contents[labelTool.currentFileIndex].splice(index, 1);
        delete labelTool.cubeArray[labelTool.currentFileIndex][index];
        labelTool.cubeArray[labelTool.currentFileIndex].splice(index, 1);
        this.__insertIndex--;
        this.select(-1, undefined);
    },
    removeSelectedBoundingBox: function () {
        this.remove(this.__selectionIndexCurrentFrame);
    },
    clear: function () {
        for (let j = 0; j < this.contents.length; j++) {
            for (let i = 0; i < this.contents[j].length; i++) {
                labelTool.removeObject("cube-" + this.contents[j][i]["class"].charAt(0) + this.contents[j][i]["trackId"]);
            }
        }

        this.__selectionIndexCurrentFrame = -1;
        this.__selectionIndexNextFrame = -1;
        this.__insertIndex = 0;
        this.contents[labelTool.currentFileIndex] = [];
    },
    __selectionIndexCurrentFrame: -1,
    __selectionIndexNextFrame: -1,
    __insertIndex: 0
};

function drawLine(channelIdx, pointStart, pointEnd, color) {
    if (pointStart !== undefined && pointEnd !== undefined && isFinite(pointStart.x) && isFinite(pointStart.y) && isFinite(pointEnd.x) && isFinite(pointEnd.y)) {
        let line = paperArrayAll[labelTool.currentFileIndex][channelIdx].path(["M", pointStart.x, pointStart.y, "L", pointEnd.x, pointEnd.y]);
        line.attr("stroke", color);
        line.attr("stroke-width", 3);
        return line;
    } else {
        return undefined;
    }
}