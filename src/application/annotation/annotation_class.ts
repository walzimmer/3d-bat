import { LabelTool } from "../label_tool/tool_main";
import { AnnotationObject } from "./annotation_object";
import * as $ from "jquery";
import { ClassLabelOperation } from "../util/operation_stack";

export type AnnotationClassObject  = {
    [name in string]: {
        color: string,
        index: number,
    }
}

class AnnotationClass {

    colorIdx = 0;
    currentClass = "";
    labelTool: LabelTool;
    annotationObjects: AnnotationObject;
    annotationClasses: AnnotationClassObject = {};
    content: any;

    constructor(labelTool: LabelTool, annotationObjects: AnnotationObject) {
        this.labelTool = labelTool;
        this.annotationObjects = annotationObjects;
        this.annotationObjects.setAnnotationClasses(this);
    }

    setLabelTool(labelTool: LabelTool){
        this.labelTool = labelTool;
    }

    getCurrentAnnotationClassObject() {
        return this.annotationClasses[this.currentClass];
    }

    objectsNumberForClass(): number {
        return Object.keys(this.annotationClasses).length;
    }

    pushChangeClassOperationToStack(label: string) {
        const prevLabel: string = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.annotationObjects.__selectionIndexCurrentFrame]["class"]
        const changeClassOperation: ClassLabelOperation = {
            'type': 'classLabel',
            'objectIndex': this.annotationObjects.__selectionIndexCurrentFrame,
            'prev': prevLabel,
            'cur': label
        };
        const labelTool3D = this.labelTool.getLabelTool3D();
        labelTool3D.operationStack.push(changeClassOperation);
    }

    select(index: number) {
        const label: string = this.labelTool.classes[index].name;
        if (this.annotationObjects.__selectionIndexCurrentFrame !== -1) {
            this.pushChangeClassOperationToStack(label);
        }
        this.changeAnnotationClass(label);

        if (this.annotationObjects.getSelectedBoundingBox() !== undefined) {
            this.annotationObjects.changeClass(this.annotationObjects.__selectionIndexCurrentFrame, label);
        }

        this.currentClass = label;
        $('#class-picker ul li').css('background-color', '#323232');
        $($('#class-picker ul li')[index]).css('background-color', '#525252');
    }

    changeAnnotationClass(currentClass: string) {
        this.currentClass = currentClass;
    }

    getCurrentClass(): string {
        return this.currentClass;
    }

    getIndexByObjectClass(objectClassToFind: string) {
        let datasetIdx = this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset);
        for (let objectClassIdx = 0; objectClassIdx < this.labelTool.config.datasets[datasetIdx].classes.length; objectClassIdx++) {
            let obj = this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[objectClassIdx];
            if (obj.name === objectClassToFind) {
                return objectClassIdx;
            }
        }
        return -1;
    }

}

export {AnnotationClass};