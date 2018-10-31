var annotationObjects = {
    contents: [],
    // init: function () {
    //     this.contents = [];
    //     for (var i = 0; i < 3962; i++) {
    //         this.contents.push([]);
    //         for (var j = 0; j < 6; j++) {
    //             this.contents[i].push([]);
    //         }
    //     }
    // },
    localOnSelect: {
        "Image": function (newIndex, oldIndex) {
        },
        "PCD": function (newIndex, oldIndex) {
        }
    },
    onSelect: function (dataType, f) {
        this.localOnSelect[dataType] = f;
    },
    localOnChangeClass: {
        "Image": function (index, cls) {
        },
        "PCD": function (index, cls) {
        }
    },
    onChangeClass: function (dataType, f) {
        this.localOnChangeClass[dataType] = f;
    },
    localOnAdd: {
        "Image": function (index, cls, params) {
        },
        "PCD": function (index, cls, params) {
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
    set: function (index, dataType, params, cls) {
        var isExpanded = false;
        if (this.contents[index] == undefined) {
            if (index == this.__tail + 1) {
                this.expand();
                isExpanded = true;
            } else {
                return false;
            }
        }
        if (cls == undefined) {
            cls = this.get(index, "class");
        }
        var obj = this.localOnAdd[dataType](index, cls, params);
        this.contents[index][dataType] = obj;
        this.contents[index]["class"] = cls;
        this.__table.changeClass(index, cls);
        this.__table.add(index, dataType);
        if (isExpanded) {
            this.selectEmpty();
        }
    },
    changeClass: function (index, cls) {
        if (this.contents[index] == undefined) {
            return false;
        }
        this.contents[index]["class"] = cls;
        labelTool.dataTypes.forEach(function (dataType) {
            this.localOnChangeClass[dataType](index, cls);
        }.bind(this));
        this.__table.changeClass(index, cls);
    },
    expand: function (cls) {
        this.selectEmpty();
        if (cls == undefined) {
            this.contents[this.__tail + 1] = {"class": classesBoundingBox.targetName()};
        } else {
            this.contents[this.__tail + 1] = {"class": cls};
        }
        this.__tail++;
        this.__table.expand(classesBoundingBox.targetName(), false, false);
    },
    getTarget: function (dataType) {
        if (dataType == undefined) {
            return this.contents[this.__target];
        }
        if (!this.isValidTarget()) {
            return undefined;
        }
        return this.contents[this.__target][dataType];
    },
    setTarget: function (dataType, params, cls) {
        if (!this.isValid(this.__target)) {
            return false;
        }
        this.set(this.__target, dataType, params, cls);
        return true;
    },
    setTargetIndex: function (index) {
        if (!this.isValid(index)) {
            return false;
        }
        if (index == this.__target) {
            return false;
        }
        var oldIndex = this.__target;
        if (this.isEmpty(this.__target) && this.__target != this.__tail + 1) {
            this.contents.splice(this.__target, 1);
            this.__tail--;
            if (index > this.__target) {
                index--;
            }
            this.__table.refresh();
        }
        labelTool.dataTypes.forEach(function (dataType) {
            this.localOnSelect[dataType](index, oldIndex);
        }.bind(this));
        if (!this.isEmpty(index)) {
            classesBoundingBox.onChange(annotationObjects.get(index, "class"));
        }
        this.__target = index;
        this.__table.select(this.__target);
        return true;
    },
    select: function (index) {
        $("#label-tool-log").val("3. Draw 3D label");
        $("#label-tool-log").css("color", "#969696");
        this.setTargetIndex(index);
    },
    isValidTarget: function () { // Should be another name. Checking if target is not undefined.
        if (this.__tail == -1) {
            return false;
        }
        return this.__target >= 0 && this.__target <= this.__tail;
    },
    isValid: function (index) {
        return index >= 0 && index <= this.__tail + 1;
    },
    exists: function (index, dataType) {
        if (this.contents[index] == undefined) {
            return false;
        }
        return this.contents[index][dataType] != undefined;
    },
    getTargetIndex: function () {
        return this.__target;
    },
    selectTail: function () {
        this.setTargetIndex(this.__tail);
    },
    selectEmpty: function () {
        this.setTargetIndex(this.__tail + 1);
    },
    selectNext: function () {
        if (this.isEmpty(this.__target)) {
            this.select(0);
        } else {
            this.select(this.__target + 1);
        }
    },
    length: function () {
        return this.__tail + 1;
    },
    isEmpty: function (index) {
        return !this.exists(index, "Image") && !this.exists(index, "PCD");
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
            this.__tail--;
            if (index <= this.__target) {
                this.select(this.__target - 1);
            }
        } else {
            this.localOnRemove[dataType](index);
            delete this.contents[index][dataType];
            this.__table.remove(index, dataType);
        }
    },
    removeTarget: function (dataType) {
        if (!this.exists(this.__target, dataType)) {
            return;
        }
        this.remove(this.__target, dataType);
    },
    pop: function () {
        if (this.__tail == -1) {
            return false;
        }
        this.remove(this.__tail);
        return true;
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
        this.__target = 0;
        this.__tail = -1;
        this.contents = [];
        this.__table.clear();
    },
    __target: 0,
    __tail: -1,
    __table: new BBoxTable({
        tableId: "bbox-table",
        liOptions: function (index) {
            return "onClick='annotationObjects.select(" + index + ");'";
        }
    })
};
