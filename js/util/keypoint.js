var keypointObjects = {
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
        }
    },
    onSelect: function (dataType, f) {
        this.localOnSelect[dataType] = f;
    },
    localOnChangeClass: {
        "Image": function (index, cls) {
        }
    },
    onChangeClass: function (dataType, f) {
        this.localOnChangeClass[dataType] = f;
    },
    localOnAdd: {
        "Image": function (index, cls, params) {
        }
    },
    onAdd: function (dataType, f) {
        this.localOnAdd[dataType] = f;
    },
    localOnRemove: {
        "Image": function (index) {
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
        if (isExpanded) {
            this.selectEmpty();
        }
    },
    changeClass: function (index, cls) {
        if (this.contents[index] == undefined) {
            return false;
        }
        this.contents[index]["class"] = cls;
        this.localOnChangeClass[labelTool.dataTypes[0]](index, cls);
        this.__table.changeClass(index, cls);
    },
    expand: function (cls) {
        this.selectEmpty();
        if (cls == undefined) {
            this.contents[this.__tail + 1] = {"class": classesKeypoint.targetName()};
        } else {
            this.contents[this.__tail + 1] = {"class": cls};
        }
        this.__tail++;
    },
    getTarget: function (dataType) {
        if (dataType == undefined) {
            return this.contents[this.__target];
        }
        if (!this.isTargetDefined()) {
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
        // if (this.isEmpty(this.__target) && this.__target != this.__tail + 1) {
        //     this.contents.splice(this.__target, 1);
        //     this.__tail--;
        //     if (index > this.__target) {
        //         index--;
        //     }
        // this.__table.refresh();
        // }
        this.localOnSelect[labelTool.dataTypes[0]](index, oldIndex);
        if (!this.isEmpty(index)) {
            classesKeypoint.onChange(classesKeypoint.get(index, "class"));
        }
        this.__target = index;
        // this.__table.select(this.__target);
        return true;
    },
    select: function (index) {
        this.setTargetIndex(index);
    },
    isTargetDefined: function () {
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
        var exists = !this.exists(index, "Image");
        return exists;
    },
    remove: function (index, dataType) {
        if (dataType == undefined) {
            if (this.exists(index, dataType)) {
                this.localOnRemove[dataType](index);
                delete this.contents[index][dataType];
                this.__table.remove(index, dataType);
            }
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
            return "onClick='keypointObjects.select(" + index + ");'";
        }
    })
};
