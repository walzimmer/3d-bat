function getLine(channelIdx, pointStart, pointEnd, color) {
    if (pointStart !== undefined && pointEnd !== undefined && isFinite(pointStart.x) && isFinite(pointStart.y) && isFinite(pointEnd.x) && isFinite(pointEnd.y)) {
        let line = paperArray[channelIdx].path(["M", pointStart.x, pointStart.y, "L", pointEnd.x, pointEnd.y]);
        // uncomment line to use yellow to color bottom 4 lines
        let color = classesBoundingBox[classesBoundingBox.__target].color;
        line.attr("stroke", color);
        line.attr("stroke-width", 3);
        return line;
    } else {
        return undefined;
    }
}

function calculateLineSegments(channelObj) {
    let channel = channelObj.channel;
    let lineArray = [];
    let channelIdx = getChannelIndexByName(channel);
    // temporary color bottom 4 lines in yellow to check if projection matrix is correct
    let color = '#ffff00';
    // bottom four lines
    if ((channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > 320) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > 240)
        && (channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > 320) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[1], color));
    }
    if ((channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > 320) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > 240)
        && (channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > 320) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[2], color));
    }
    if ((channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > 320) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > 240)
        && (channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > 320) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[3], color));
    }
    if ((channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > 320) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > 240)
        && (channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > 320) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[0], color));
    }
    color = '#00ff00';
    // top four lines
    if ((channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)
        && (channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[4], channelObj.projectedPoints[5], color));
    }

    if ((channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)
        && (channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[5], channelObj.projectedPoints[6], color));
    }
    if ((channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)
        && (channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[6], channelObj.projectedPoints[7], color));
    }
    if ((channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)
        && (channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[7], channelObj.projectedPoints[4], color));
    }

    // vertical lines
    if ((channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > 320) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > 240)
        && (channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[4], color));
    }
    if ((channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > 320) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > 240)
        && (channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[5], color));
    }
    if ((channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > 320) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > 240)
        && (channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[6], color));
    }
    if ((channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > 320) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > 240)
        && (channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[7], color));
    }
    return lineArray;
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
    add2DBoundingBox: function (indexByDimension, channelObj) {
        annotationObjects.contents[indexByDimension].channels.push(channelObj);
    },
    set: function (insertIndex, params) {
        // if (params.x !== -1 && params.y !== -1 && params.z !== -1 && params.width !== -1 && params.height !== -1 && params.depth !== -1) {
        let obj = get3DLabel(params);
        if (this.contents[insertIndex] === undefined) {
            this.contents.push(obj);
        } else {
            this.contents[insertIndex] = obj;
        }
        // }
        this.contents[insertIndex]["class"] = params.class;
        if (params.fromFile === false && this.__selectionIndex === -1) {
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                this.contents[insertIndex]["trackId"] = classesBoundingBox.content[params.class].nextTrackId;
            } else {
                this.contents[insertIndex]["trackId"] = classesBoundingBox[params.class].nextTrackId;
            }

        } else {
            this.contents[insertIndex]["trackId"] = params.trackId;
        }
        this.contents[insertIndex]["channels"] = params.channels;

        labelTool.bboxIndexArray[labelTool.currentFileIndex].push(insertIndex.toString());
    },
    changeClass: function (index, label) {
        if (this.contents[index] === undefined) {
            return false;
        }
        this.contents[index]["class"] = label;
        for (let channelObj in labelTool.camChannels) {
            if (labelTool.camChannels.hasOwnProperty(channelObj)) {
                let channelObject = labelTool.camChannels[channelObj];
                this.localOnChangeClass[channelObject.channel](index, label);

            }
        }
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
