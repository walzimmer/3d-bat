class BBoxTable {
    constructor(options) {
        this.__bboxes = [];
        this.__insertIndex = 0;
        this.__selectionIndex = -1;
        this.tableId = options.tableId;
        if (options.liOptions == undefined) {
            this.liOptions = function (index) {
                return "";
            }
        } else {
            this.liOptions = options.liOptions;
        }
    }

    expand(label, hasImageLabel, hasPCDLabel) {
        if (!$("#" + this.tableId + "-number-" + this.__insertIndex)[0]) {
            var label = annotationObjects.contents[this.__insertIndex]["class"];
            var firstLetterOfClass = label.charAt(0);
            var trackId = annotationObjects.contents[this.__insertIndex]["trackId"];
            var $li = $('<li class="jpeg-label-sidebar-item" ' + this.liOptions(this.__insertIndex) + '>'
                + '<div class="label-tool-sidebar-number-box">'
                + '<p class="label-tool-sidebar-text number" id="' + this.tableId + '-number-' + this.__insertIndex + '">' + firstLetterOfClass + trackId + '</p>'
                + '</div>'
                + '</li>'
            );
            $li.append($('<p class="label-tool-sidebar-text bbox" id="' + this.tableId + '-Image-' + this.__insertIndex + '">Image</p>'));
            $li.append($('<p class="label-tool-sidebar-text bbox" id="' + this.tableId + '-PCD-' + this.__insertIndex + '">PCD</p>'));
            $("#" + this.tableId).append($li);
        }
        this.__bboxes[this.__insertIndex] = {label: label};
        if (hasImageLabel) {
            this.add(this.__insertIndex, "Image");
        }
        if (hasPCDLabel) {
            this.add(this.__insertIndex, "PCD");
        }
        this.__insertIndex++;
    }

    add(index, dataType) {
        var color = classesBoundingBox[this.__bboxes[index]["label"]]["color"];
        if (this.__bboxes[index] != undefined) {
            color = classesBoundingBox[this.__bboxes[index]["label"]].color;
        }
        $("#" + this.tableId + "-" + dataType + "-" + index).css("color", color);
        this.__bboxes[index][dataType] = 0; // Dummy
    }

    changeClass(index, cls) {
        //var color = classesBoundingBox[cls]["color"];
        var color = classesBoundingBox[cls].color;
        if (this.__bboxes[index]["Image"] != undefined) {
            $("#" + this.tableId + "-" + "Image" + "-" + index).css("color", color);
        }
        if (this.__bboxes[index]["PCD"] != undefined) {
            $("#" + this.tableId + "-" + "PCD" + "-" + index).css("color", color);
        }
        this.__bboxes[index]["label"] = cls;
    }

    remove(tableIndex, dataType) {
        $("#" + this.tableId + "-" + dataType + "-" + tableIndex).css("color", "#888");
        if (this.__bboxes[tableIndex] != undefined) {
            delete this.__bboxes[tableIndex][dataType];
        }
        if (this.__bboxes[tableIndex]["Image"] == undefined && this.__bboxes[tableIndex]["PCD"] == undefined) {
            delete this.__bboxes[tableIndex];
            //$("#bbox-table").children().remove(tableIndex);
            $("#bbox-table").children().eq(tableIndex).remove();
        }
    }

    select(index) {
        // remove highlight from previous selected object
        $("#bbox-table li").css("background-color", "#333");
        // highlight selected object in list
        $($("#bbox-table").children()[this.__selectionIndex]).css("background-color", "#525252");
        this.__selectionIndex = index;
    }

    selectEmpty() {
        // remove highlight from previous selected object
        $("#bbox-table li").css("background-color", "#333");
    }

    clear() {
        $("#" + this.tableId).empty();
        this.__insertIndex = 0;
        this.__bboxes = []
    }
};
