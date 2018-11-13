function getLine(channel, pointStart, pointEnd) {
    let channelIdx = getChannelIndexByName(channel);
    if (pointStart !== undefined && pointEnd !== undefined) {
        let line = paperArray[channelIdx].path("M", pointStart.x, pointStart.y, "L", pointEnd.x, pointEnd.y);
        return line;
    } else {
        return undefined;
    }

}

let annotationObjects = {
    contents: [],
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
        if (params.x !== -1 && params.y !== -1 && params.z !== -1 && params.width !== -1 && params.height !== -1 && params.depth !== -1) {
            let obj = get3DLabel(params);
            if (this.contents[insertIndex] === undefined) {
                this.contents.push(obj);
            } else {
                this.contents[insertIndex] = obj;
            }
        }
        this.contents[insertIndex]["class"] = params.class;
        if (params.fromFile === false && this.__selectionIndex === -1) {
            this.contents[insertIndex]["trackId"] = classesBoundingBox[params.class].nextTrackId;
        } else {
            this.contents[insertIndex]["trackId"] = params.trackId;
        }
        this.contents[insertIndex]["channels"] = params.channels;

        // if (params.x_img !== -1 && params.y_img !== -1 && params.width_img !== -1 && params.height_img !== -1) {
        //     this.contents[insertIndex]["rect"] = getRect(params);
        // }
        for (let i = 0; i < params.channels.length; i++) {
            var channel = params.channels[i].channel;
            var lineArray = [];
            // bottom four lines
            lineArray.push(getLine(channel, params.channels[i].points2D[0], params.channels[i].points2D[1]));
            lineArray.push(getLine(channel, params.channels[i].points2D[1], params.channels[i].points2D[2]));
            lineArray.push(getLine(channel, params.channels[i].points2D[2], params.channels[i].points2D[3]));
            lineArray.push(getLine(channel, params.channels[i].points2D[3], params.channels[i].points2D[0]));
            // top four lines
            lineArray.push(getLine(channel, params.channels[i].points2D[4], params.channels[i].points2D[5]));
            lineArray.push(getLine(channel, params.channels[i].points2D[5], params.channels[i].points2D[6]));
            lineArray.push(getLine(channel, params.channels[i].points2D[6], params.channels[i].points2D[7]));
            lineArray.push(getLine(channel, params.channels[i].points2D[7], params.channels[i].points2D[4]));
            // vertical lines
            lineArray.push(getLine(channel, params.channels[i].points2D[0], params.channels[i].points2D[4]));
            lineArray.push(getLine(channel, params.channels[i].points2D[1], params.channels[i].points2D[5]));
            lineArray.push(getLine(channel, params.channels[i].points2D[2], params.channels[i].points2D[6]));
            lineArray.push(getLine(channel, params.channels[i].points2D[3], params.channels[i].points2D[7]));
            this.contents[insertIndex]["channels"][i]["lines"] = lineArray;
        }
        labelTool.bboxIndexArray[labelTool.currentFileIndex].push(insertIndex.toString());
        this.__insertIndex++;
    },
    changeClass: function (index, label) {
        if (this.contents[index] === undefined) {
            return false;
        }
        this.contents[index]["class"] = label;
        this.localOnChangeClass["PCD"](index, label);
    },
    expand: function (label, trackId, fromFile) {
        if (label === undefined) {
            label = classesBoundingBox.targetName();
        }
        if (fromFile === false && this.__selectionIndex === -1) {
            trackId = classesBoundingBox[label].nextTrackId;
        }
        this.contents[this.__insertIndex] = {
            "class": label,
            "trackId": trackId
        };
        this.__insertIndex++;
    },
    getSelectedBoundingBox: function () {
        if (this.__selectionIndex === -1 || this.contents[this.__selectionIndex] === undefined) {
            return undefined;
        } else {
            return this.contents[this.__selectionIndex];
        }
    },
    setSelectionIndex: function (selectionIndex, channel) {
        // show bounding box highlighting
        this.__selectionIndex = selectionIndex;
        if (selectionIndex !== -1) {
            this.localOnSelect[channel](selectionIndex);
            this.localOnSelect["PCD"](selectionIndex);
        }
        return true;
    },
    select: function (index, channel) {
        let notificationElem = $("#label-tool-log");
        notificationElem.val("3. Draw label in Birds-Eye-View");
        notificationElem.css("color", "#969696");
        this.setSelectionIndex(index, channel);
    },
    getSelectionIndex: function () {
        return this.__selectionIndex;
    },
    selectEmpty: function () {
        this.setSelectionIndex(-1, undefined);
    },
    remove: function (index) {
        // remove 3d object
        labelTool.removeObject("cube-" + this.contents[index]["class"].charAt(0) + this.contents[index]["trackId"]);
        // remove 2d object
        remove(index);
        delete this.contents[index];
        this.contents.splice(index, 1);
        delete labelTool.bboxIndexArray[labelTool.currentFileIndex][index];
        labelTool.bboxIndexArray[labelTool.currentFileIndex].splice(index, 1);
        delete labelTool.cubeArray[labelTool.currentFileIndex][index];
        labelTool.cubeArray[labelTool.currentFileIndex].splice(index, 1);
        this.__insertIndex--;
        this.select(-1, undefined);
    },
    removeSelectedBoundingBox: function () {
        this.remove(this.__selectionIndex);
    },
    clear: function () {
        for (let i = 0; i < this.contents.length; i++) {
            labelTool.removeObject("cube-" + this.contents[i]["class"].charAt(0) + this.contents[i]["trackId"]);
        }
        this.__selectionIndex = -1;
        this.__insertIndex = 0;
        this.contents = [];
    },
    __selectionIndex: -1,
    __insertIndex: 0
};
