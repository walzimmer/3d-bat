var annotationObjects = {
    contents: [],
    localOnSelect: {
        "Image": function (index) {
        },
        "PCD": function (index) {
        }
    },
    onSelect: function (dataType, f) {
        this.localOnSelect[dataType] = f;
    },
    localOnChangeClass: {
        "Image": function (index, label) {
        },
        "PCD": function (index, label) {
        }
    },
    onChangeClass: function (dataType, f) {
        this.localOnChangeClass[dataType] = f;
    },
    localOnAdd: {
        "Image": function (index, label, params) {
        },
        "PCD": function (index, label, params) {
        }
    },
    onAdd: function (dataType, f) {
        this.localOnAdd[dataType] = f;
    },
    localOnRemove: {
        "Image": function (index) {
        },
        "PCD": function (index) {
        }
    },
    onRemove: function (dataType, f) {
        this.localOnRemove[dataType] = f;
    },
    get: function (index, dataType) {
        if (this.contents[index] == undefined) {
            return undefined;
        }
        if (dataType == undefined) {
            return this.contents[index];
        }
        return this.contents[index][dataType];
    },
    set: function (index, dataType, params, label, fromFile) {
        if (this.contents[index] == undefined) {
            this.expand(label, dataType, params.trackId, fromFile);
        } else {
            if (this.contents[index]["trackId"] == undefined) {
                this.contents[index]["trackId"] = params.trackId;
            }

        }
        if (label == undefined) {
            label = this.get(index, "class");
        }
        var obj = this.localOnAdd[dataType](index, label, params);//calls annotationObjects.onAdd(...) in image_label_tool.js line 60
        this.contents[index][dataType] = obj;
        this.contents[index]["class"] = label;
        this.__table.changeClass(index, label);
        this.__table.add(index, dataType);
    },
    changeClass: function (index, label) {
        if (this.contents[index] == undefined) {
            return false;
        }
        this.contents[index]["class"] = label;
        labelTool.dataTypes.forEach(function (dataType) {
            this.localOnChangeClass[dataType](index, label);
        }.bind(this));
        this.__table.changeClass(index, label);
    },
    expand: function (label, dataType, trackId, fromFile) {
        if (label == undefined) {
            label = classesBoundingBox.targetName();
        }
        if (fromFile == false && this.__selectionIndex == -1) {
            trackId = classesBoundingBox[label].nextTrackId;
        }
        this.contents[this.__insertIndex] = {
            "class": label,
            "trackId": trackId
        };
        this.__insertIndex++;
        if (dataType == "Image") {
            this.__table.expand(classesBoundingBox.targetName(), true, false);
        } else {
            this.__table.expand(classesBoundingBox.targetName(), false, true);
        }

    },
    getSelectedBoundingBox: function (dataType) {
        if (dataType == undefined) {
            return this.contents[this.__selectionIndex];
        }
        if (this.__selectionIndex == -1 || this.contents[this.__selectionIndex] == undefined) {
            return undefined;
        } else {
            return this.contents[this.__selectionIndex][dataType];
        }
    },
    setSelection: function (insertIndex, dataType, params, label, fromFile) {
        // if a bounding box was selected in the camera image
        // then assign the bounding box in the birds eye view to the one in the camera image
        this.set(insertIndex, dataType, params, label, fromFile);
    },
    setSelectionIndex: function (selectionIndex) {
        // show bounding box highlighting
        this.__selectionIndex = selectionIndex;
        if (selectionIndex != -1) {
            labelTool.dataTypes.forEach(function (dataType) {
                this.localOnSelect[dataType](selectionIndex, this.__selectionIndex);
            }.bind(this));
        }
        this.__table.__selectionIndex = selectionIndex;
        if (this.__selectionIndex != -1) {
            this.__table.select(this.__selectionIndex);
        } else {
            this.__table.selectEmpty();
        }
        return true;
    },
    select: function (index) {
        $("#label-tool-log").val("3. Draw label in Birds-Eye-View");
        $("#label-tool-log").css("color", "#969696");
        this.setSelectionIndex(index);
    },
    exists: function (index, dataType) {
        if (this.contents[index] == undefined) {
            return false;
        }
        return this.contents[index][dataType] != undefined;
    },
    getSelectionIndex: function () {
        return this.__selectionIndex;
    },
    selectTail: function () {
        this.setSelectionIndex(this.__insertIndex - 1);
    },
    selectEmpty: function () {
        this.setSelectionIndex(-1);
    },
    length: function () {
        return this.__insertIndex;
    },
    remove: function (index, dataType) {
        if (dataType == undefined) {
            labelTool.dataTypes.forEach(function (dataType) {
                if (this.exists(index, dataType)) {
                    this.localOnRemove[dataType](index);
                    delete this.contents[index][dataType];
                    this.__table.remove(index, dataType);
                }
            }.bind(this));
            this.contents.splice(index, 1);
            this.__insertIndex--;
            this.__table.__insertIndex--;
            this.select(-1);
        } else {
            this.localOnRemove[dataType](index);
            delete this.contents[index][dataType];
            this.__table.remove(index, dataType);
            if (this.contents[index]["Image"] == undefined && this.contents[index]["PCD"] == undefined) {
                delete this.contents[index];
                this.__insertIndex--;
                this.__table.__insertIndex--;
            }
        }
    },
    removeSelectedBoundingBox: function (dataType) {
        this.remove(this.__selectionIndex, dataType);
    },
    pop: function () {
        this.remove(this.__insertIndex - 1);
    },
    clear: function () {
        for (var i = 0; i < this.length(); ++i) {
            if (this.exists(i, "Image")) {
                this.localOnRemove["Image"](i);
            }
            if (this.exists(i, "PCD")) {
                this.localOnRemove["PCD"](i);
            }
        }
        this.__selectionIndex = -1;
        this.__insertIndex = 0;
        this.contents = [];
        this.__table.clear();
    },
    __selectionIndex: -1,
    __insertIndex: 0,
    __table: new BBoxTable({
        tableId: "bbox-table",
        liOptions: function (index) {
            return "onClick='annotationObjects.select(" + index + ");'";
        }
    })
};
