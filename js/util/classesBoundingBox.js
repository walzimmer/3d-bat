let classesBoundingBox = {
    colorIdx: 0,
    getCurrentAnnotationClassObject: function () {
        return this[this.currentClass];
    },
    select: function (label) {
        this.onChangeAnnotationClass(label);

        if (annotationObjects.getSelectedBoundingBox() !== undefined) {
            annotationObjects.changeClass(annotationObjects.__selectionIndexCurrentFrame, label);
        }

        if (annotationObjects.__selectionIndexCurrentFrame !== -1) {
            let changeClassOperation = {
                "type": "classLabel",
                "objectIndex": annotationObjects.__selectionIndexCurrentFrame,
                "previousClass": annotationObjects.contents[labelTool.currentFileIndex][annotationObjects.__selectionIndexCurrentFrame]["class"],
                "currentClass": label
            };
            operationStack.push(changeClassOperation);
        }
        this.currentClass = label;
    },
    onChangeAnnotationClass: function (currentClass) {
        this.currentClass = currentClass;
    },
    getColorByClass: function (label) {
        return this[label].color;
    },
    getCurrentClass: function () {
        return this.currentClass;
    },
    currentClass: ""
};