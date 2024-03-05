import {Utils} from "../util/utils";
import * as $ from "jquery";
import {AnnotationClass} from "./annotation_class";
import {LabelTool3D} from "../label_tool/tool_3d";
import {LabelToolImage} from "../label_tool/tool_image";
import {LabelTool} from "../label_tool/tool_main";
import THREE = require("three");
import {Euler, Mesh, Vector3} from "three";
import * as uuid from 'uuid'
import {Key} from "../util/keydown";
import * as KEYS from 'keycode-js';
import {Mutex} from "async-mutex";
import * as dat from "dat.gui/build/dat.gui"; // works with amd

type Channel = {
    rect: any[],
    projectedPoints: any[],
    lines: any[],
    channel: string
}

export type BoxPositionParams = {
    x: number,
    y: number,
    z: number,
}

export type BoxScaleParams = {
    length: number,
    width: number,
    height: number,
}

export type BoxRotationParams = {
    rotationYaw: number,
    rotationPitch: number,
    rotationRoll: number,
}

export type BoxParams =
    BoxPositionParams &
    BoxScaleParams &
    BoxRotationParams & {
    class: string,
    trackId: string,
    attributes: any
}

export type AnnotationObjectParams =
    BoxParams & {
    original: BoxParams,
    interpolationStartFileIndex: number,
    interpolationStart: {
        position: BoxPositionParams & BoxRotationParams,
        size: BoxScaleParams
    },
    interpolationEnd: {
        position: BoxPositionParams & BoxRotationParams,
        size: BoxScaleParams
    },
    fromFile: boolean,
    fileIndex: number,
    copyLabelToNextFrame: boolean,
    changeFrame: boolean,
    channels: Channel[],
}

class AnnotationObject {

    labelTool: LabelTool;
    labelTool3D: LabelTool3D;
    labelToolImage: LabelToolImage;
    annotationClasses: AnnotationClass;
    contents: AnnotationObjectParams[][] = [];
    contentsDetections = [];
    annotatedWeatherTypes: string[] = [];
    timestamps_secs: number[] = [];
    timestamps_nsecs: number[] = [];
    coordinate_systems: string[] = [];
    frame_properties: string[] = [];
    streams: string[] = [];
    __selectionIndexCurrentFrame = -1;
    __selectionIndexNextFrame = -1;
    __insertIndex = 0;
    resetPosition: Vector3 | undefined = undefined;
    resetRotation: Euler | undefined = undefined;
    resetScale: Vector3 | undefined = undefined;

    constructor(labelTool: LabelTool) {
        this.labelTool = labelTool;
        this.annotatedWeatherTypes = new Array(this.labelTool.numFrames);
        this.annotatedWeatherTypes[this.labelTool.currentFrameIndex] = Utils.getSequenceByName(this.labelTool.availableSequences, this.labelTool.currentSequence).default_weather_type;
    }

    /**
     * Return the box as an array of numbers [...pos, ...rot, ...scale]
     */
    static toArray(box: AnnotationObjectParams): number[] {
        return [
            box.x, box.y, box.z,
            box.rotationRoll, box.rotationPitch, box.rotationYaw,
            box.length, box.width, box.height
        ];
    }

    /**
     * Set params from an array of numbers [...pos, ...rot, ...scale]
     */
    setPosRotScaleFromArray(arr: number[], box: AnnotationObjectParams): void {
        box.x = arr[0];
        box.y = arr[1];
        box.z = arr[2];

        box.rotationRoll = arr[3];
        box.rotationPitch = arr[4];
        box.rotationYaw = arr[5];

        box.length = arr[6];
        box.width = arr[7];
        box.height = arr[8];
    }

    copy(box: AnnotationObjectParams): AnnotationObjectParams {
        return JSON.parse(JSON.stringify(box));
    }

    position(box: AnnotationObjectParams): Vector3 {
        return new THREE.Vector3(box.x, box.y, box.z);
    }

    rotation(box: AnnotationObjectParams): Euler {
        return new THREE.Euler(box.rotationRoll, box.rotationPitch, box.rotationYaw);
    }

    scale(box: AnnotationObjectParams): Vector3 {
        return new THREE.Vector3(box.length, box.width, box.height);
    }

    setScale(scale: Vector3, box: AnnotationObjectParams) {
        box.length = scale.x;
        box.width = scale.y;
        box.height = scale.z;
    }

    setPosition(position: Vector3, box: AnnotationObjectParams) {
        box.x = position.x;
        box.y = position.y;
        box.z = position.z;
    }

    setRotation(rotation: Euler, box: AnnotationObjectParams) {
        box.rotationRoll = rotation.x;
        box.rotationPitch = rotation.y;
        box.rotationYaw = rotation.z;
    }

    setBoxParams(boxParams: BoxParams, box: AnnotationObjectParams): void {
        box.length = boxParams.length;
        box.width = boxParams.width;
        box.height = boxParams.height;
        box.x = boxParams.x;
        box.y = boxParams.y;
        box.z = boxParams.z;
        box.rotationRoll = boxParams.rotationRoll;
        box.rotationPitch = boxParams.rotationPitch;
        box.rotationYaw = boxParams.rotationYaw;
        box.class = boxParams.class;
        box.trackId = boxParams.trackId;
        box.attributes = boxParams.attributes;
    }

    setBoxParamsToMesh(boxParams: BoxParams, mesh: Mesh): void {
        mesh.scale.x = boxParams.length;
        mesh.scale.y = boxParams.width;
        mesh.scale.z = boxParams.height;
        mesh.position.x = boxParams.x;
        mesh.position.y = boxParams.y;
        mesh.position.z = boxParams.z;
        mesh.rotation.x = boxParams.rotationRoll;
        mesh.rotation.y = boxParams.rotationPitch;
        mesh.rotation.z = boxParams.rotationYaw;
        mesh.name = 'cube-' + boxParams.class + '-' + boxParams.trackId;
    }

    boxParams(box: AnnotationObjectParams): BoxParams {
        return {
            length: box.length,
            width: box.width,
            height: box.height,
            x: box.x,
            y: box.y,
            z: box.z,
            rotationRoll: box.rotationRoll,
            rotationPitch: box.rotationPitch,
            rotationYaw: box.rotationYaw,
            class: box.class,
            trackId: box.trackId,
            attributes: box.attributes,
        }
    }

    /**
     * Set params of @arg interpolationStart .original to the values of box
     */
    updateInterpolationStartParams(annotationObjectParams: AnnotationObjectParams, interpolationStartFileIndex: number) {
        annotationObjectParams["interpolationStart"]["position"]["x"] = annotationObjectParams["x"];
        annotationObjectParams["interpolationStart"]["position"]["y"] = annotationObjectParams["y"];
        annotationObjectParams["interpolationStart"]["position"]["z"] = annotationObjectParams["z"];
        annotationObjectParams["interpolationStart"]["position"]["rotationYaw"] = annotationObjectParams["rotationYaw"];
        annotationObjectParams["interpolationStart"]["position"]["rotationPitch"] = annotationObjectParams["rotationPitch"];
        annotationObjectParams["interpolationStart"]["position"]["rotationRoll"] = annotationObjectParams["rotationRoll"];
        annotationObjectParams["interpolationStart"]["size"]["length"] = annotationObjectParams["length"];
        annotationObjectParams["interpolationStart"]["size"]["width"] = annotationObjectParams["width"];
        annotationObjectParams["interpolationStart"]["size"]["height"] = annotationObjectParams["height"];
        annotationObjectParams["interpolationStartFileIndex"] = interpolationStartFileIndex;
    }

    /**
     * Set params of @arg box .original to the values of box
     */
    updateOriginalParams(box: AnnotationObjectParams) {
        box.original.class = box.class;
        box.original.rotationYaw = box.rotationYaw;
        box.original.rotationPitch = box.rotationPitch;
        box.original.rotationRoll = box.rotationRoll;
        box.original.length = box.length;
        box.original.width = box.width;
        box.original.height = box.height;
        box.original.x = box.x;
        box.original.y = box.y;
        box.original.z = box.z;
        box.original.trackId = box.trackId;
        box.original.attributes = box.attributes;
    }

    updateParams(box: AnnotationObjectParams) {
        this.updateOriginalParams(box);
        if (this.labelTool3D.interpolationMode === true) {
            this.updateInterpolationStartParams(box, box.fileIndex);
        }
    }

    setAnnotationClasses(annotationClasses: AnnotationClass) {
        this.annotationClasses = annotationClasses;
    }

    setLabelTool3D(labelTool3D: LabelTool3D) {
        this.labelTool3D = labelTool3D;
    }

    setLabelToolImage(labelToolImage: LabelToolImage) {
        this.labelToolImage = labelToolImage;
    }

    get(index: number, channel: string) {
        if (this.contents[index] === undefined) {
            return undefined;
        }
        if (channel === undefined) {
            return this.contents[index];
        }
        return this.contents[index][channel];
    }

    set(insertIndex: number, params: AnnotationObjectParams) {
        const obj: AnnotationObjectParams = this.labelTool3D.get3DLabel(insertIndex, params);
        if (this.contents[params.fileIndex][insertIndex] === undefined) {
            this.contents[params.fileIndex].push(obj);
        } else {
            this.contents[params.fileIndex][insertIndex] = obj;
        }
        this.contents[params.fileIndex][insertIndex]["class"] = params.class;
        this.contents[params.fileIndex][insertIndex]["interpolationStart"] = params["interpolationStart"];
        this.contents[params.fileIndex][insertIndex]["interpolationStartFileIndex"] = params.interpolationStartFileIndex;
        this.contents[params.fileIndex][insertIndex]["trackId"] = params.trackId;
        this.contents[params.fileIndex][insertIndex]["channels"] = params.channels;
        this.contents[params.fileIndex][insertIndex]["fileIndex"] = params.fileIndex;
        this.contents[params.fileIndex][insertIndex]["copyLabelToNextFrame"] = params.copyLabelToNextFrame;
        this.contents[params.fileIndex][insertIndex]["attributes"] = params.attributes;
    }

    setBBox(bbox: AnnotationObjectParams, newFileIndex: number, insertIndex: number) {
        let box = this.contents[newFileIndex][insertIndex];
        bbox.class = box["class"];
        bbox.trackId = box["trackId"];
        bbox.x = box["x"];
        bbox.y = box["y"];
        bbox.z = box["z"];
        bbox.rotationYaw = box["rotationYaw"];
        bbox.rotationPitch = box["rotationPitch"];
        bbox.rotationRoll = box["rotationRoll"];
        bbox.length = box["length"];
        bbox.width = box["width"];
        bbox.height = box["height"];
        bbox.attributes = box["attributes"];
        return bbox;
    }

    changeClass(selectedObjectIndex: number, newClassLabel: string) {
        if (this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex] === undefined) {
            return false;
        }

        // return if same class was chosen again
        let currentClassLabel = this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["class"];
        if (currentClassLabel === newClassLabel) {
            return false;
        }


        // update id of sprite
        const currentTrackId = this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["trackId"];
        const spriteElem = $("#class-" + currentClassLabel + "-" + currentTrackId);
        // use original track id if original class selected
        const nextTrackIdNewClass = this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["original"]["trackId"];

        $(spriteElem).attr("id", "class-" + newClassLabel + "-" + nextTrackIdNewClass).attr("background", "rgba(255, 255, 255, 0.8)");

        // update background color of sprite
        $($(spriteElem)[0]).css("background", this.annotationClasses.annotationClasses[newClassLabel].color);

        // update class label
        this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["class"] = newClassLabel;

        // update track id
        this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["trackId"] = nextTrackIdNewClass;

        // update attributes in GUI
        // remove all sub folders of attributes of old class
        let idx = 0;
        for (const attributeKey in this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["attributes"]) {
            if (this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["attributes"].hasOwnProperty(attributeKey)) {
                for (const controllerGUIAttribute of this.labelTool3D.controllerGUIArray[selectedObjectIndex]) {
                    if (controllerGUIAttribute["object"]["attribute_name"] === attributeKey) {
                        controllerGUIAttribute.remove(attributeKey);
                    }
                }
            }
            idx = idx + 1;
        }

        // update attributes in variables
        // remove attributes of old class and set default attributes of new class
        const objectClassIdx = this.annotationClasses.getIndexByObjectClass(newClassLabel);
        if (objectClassIdx === -1 || this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[objectClassIdx]["attributes"] === undefined) {
            console.log("Could not change class. objectClassIdx not found.");
            return;
        }
        const attributesConfig = this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[objectClassIdx]["attributes"];
        const folderAttributes = this.labelTool3D.folderAttributeArray[selectedObjectIndex];
        const bbox = {};
        bbox["fromFile"] = false;
        const attributesGUI = this.labelTool3D.createControllers(attributesConfig, folderAttributes, selectedObjectIndex, bbox);
        this.labelTool3D.controllerGUIArray[selectedObjectIndex] = attributesGUI;
        const attributes = this.getDefaultAttributesByClassIdx(objectClassIdx);
        this.contents[this.labelTool.currentFrameIndex][selectedObjectIndex]["attributes"] = attributes;

        // update text of sprite
        $($(spriteElem)[0]).text(newClassLabel + nextTrackIdNewClass + " | " + newClassLabel);
        // update name of sprite
        this.labelTool.spriteArray[this.labelTool.currentFrameIndex][selectedObjectIndex].name = "sprite-" + newClassLabel + "-" + nextTrackIdNewClass;

        // update class of folder and track id instead of creating new folder
        this.labelTool3D.folderBoundingBox3DArray[selectedObjectIndex].domElement.children[0].children[0].innerHTML = newClassLabel + ' ' + nextTrackIdNewClass;
        //                                                           ul        number      div       div[class c]    input
        this.labelTool3D.folderBoundingBox3DArray[selectedObjectIndex].domElement.children[0].children[5].children[0].children[1].children[0].value = nextTrackIdNewClass;

        this.labelTool3D.guiOptions.__folders[newClassLabel + ' ' + nextTrackIdNewClass] = this.labelTool3D.guiOptions.__folders[currentClassLabel + ' ' + currentTrackId];
        delete this.labelTool3D.guiOptions.__folders[currentClassLabel + ' ' + currentTrackId];

        // open current folder
        this.labelTool3D.folderBoundingBox3DArray[selectedObjectIndex].open();
        this.labelTool3D.folderPositionArray[selectedObjectIndex].open();
        this.labelTool3D.folderRotationArray[selectedObjectIndex].open();
        this.labelTool3D.folderSizeArray[selectedObjectIndex].open();
        this.labelTool3D.folderAttributeArray[selectedObjectIndex].open();

        // update name of selected object
        this.labelToolImage.changeClassColorImage(selectedObjectIndex, newClassLabel);
        this.labelTool3D.selectedMesh!.name = "cube-" + newClassLabel + "-" + nextTrackIdNewClass;
        this.labelTool3D.changeClassColorPCD(selectedObjectIndex, newClassLabel);
        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[this.annotationClasses.annotationClasses[newClassLabel].index]).css('background-color', '#525252');
    }

    getSelectedBoundingBox() {
        if (this.__selectionIndexCurrentFrame === -1 || this.contents[this.labelTool.currentFrameIndex][this.__selectionIndexCurrentFrame] === undefined) {
            return undefined;
        } else {
            return this.contents[this.labelTool.currentFrameIndex][this.__selectionIndexCurrentFrame];
        }
    }

    saveObjectRotation(objectIndex: number): void {
        if (Key.isDownQE()) {
            return;
        }
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const resRot = this.resetRotation;
        if (resRot === undefined) {
            this.resetRotation = this.rotation(box);
        } else if (!resRot.equals(this.rotation(box))) {
            this.labelTool3D.operationStack.push({
                type: 'rotation',
                rotation: resRot,
                objectIndex: objectIndex
            });
            this.resetRotation = undefined;
        }
    }

    undoObjectRotation(objectIndex: number, savedRotation: Euler) {
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIndex];
        this.setRotation(savedRotation, box);
        mesh.setRotationFromEuler(savedRotation);
        this.resetRotation = undefined;
    }

    saveObjectScale(objectIndex: number): void {
        if (Key.isDownWASDQE()) {
            return;
        }
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const resScale = this.resetScale;
        if (resScale === undefined) {
            this.resetScale = this.scale(box);
        } else if (!resScale.equals(this.scale(box))) {
            this.labelTool3D.operationStack.push({
                type: 'scale',
                scale: resScale,
                objectIndex: objectIndex
            });
            this.resetScale = undefined;
        }
    }

    undoObjectScale(objectIndex: number, savedScale: Vector3) {
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIndex];
        this.setScale(savedScale, box);
        mesh.scale.copy(savedScale);
        this.resetScale = undefined;
    }

    saveObjectPosition(objectIndex: number): void {
        if (Key.isDownWASDQE()) {
            return;
        }
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const resPos = this.resetPosition;
        if (resPos === undefined) {
            this.resetPosition = this.position(box);
        } else if (!resPos.equals(this.position(box))) {
            this.labelTool3D.operationStack.push({
                type: 'position',
                position: resPos,
                objectIndex: objectIndex
            });
            this.resetPosition = undefined;
        }
    }

    undoObjectPosition(objectIndex: number, savedPosition: Vector3) {
        const box = this.contents[this.labelTool.currentFrameIndex][objectIndex];
        const mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIndex];
        this.setPosition(savedPosition, box);
        mesh.position.copy(savedPosition);
        this.resetPosition = undefined;
    }

    setSelectionIndex(selectionIndex: number) {
        // show bounding box highlighting
        this.__selectionIndexCurrentFrame = selectionIndex;
        if (selectionIndex !== -1) {
            // unhighlight bb in BEV
            for (let meshIndex in this.labelTool.cubeArray[this.labelTool.currentFrameIndex]) {
                const meshObject: Mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][meshIndex];
                meshObject.material[0].opacity = 0.9;
            }
            // highlight selected bb in BEV
            if (this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex] !== undefined) {
                this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].material[0].opacity = 0.1;
            }
            return true;
        } else {
            return false;
        }
    }

    select(objectIndex: number) {
        this.setSelectionIndex(objectIndex);
        this.labelTool3D.openFolder(objectIndex);
        this.resetPosition = undefined;
        this.resetRotation = undefined;
        this.resetScale = undefined;
    }

    getSelectionIndex() {
        return this.__selectionIndexCurrentFrame;
    }

    selectEmpty() {
        this.setSelectionIndex(-1);
    }

    remove(index: number, fileIndex: number = this.labelTool.currentFrameIndex) {
        if (!this.contents[fileIndex][index]) {
            console.warn(`No object to remove at fileIndex ${fileIndex} objectIndex ${index}`);
            return;
        }
        // remove 3d object
        this.labelTool3D.removeObject("cube-" + this.contents[fileIndex][index]["class"].toLowerCase() + "-" + this.contents[fileIndex][index]["trackId"]);
        // remove 2d object
        delete this.contents[fileIndex][index];
        this.contents[fileIndex].splice(index, 1);
        delete this.labelTool.cubeArray[fileIndex][index];
        this.labelTool.cubeArray[fileIndex].splice(index, 1);
        this.__insertIndex--;
        this.select(-1);
    }

    removeSelectedBoundingBox() {
        this.remove(this.__selectionIndexCurrentFrame);
    }

    clear() {
        for (let j = 0; j < this.contents.length; j++) {
            for (let i = 0; i < this.contents[j].length; i++) {
                this.labelTool3D.removeObject("cube-" + this.contents[j][i]["class"] + "-" + this.contents[j][i]["trackId"]);
            }
        }

        this.__selectionIndexCurrentFrame = -1;
        this.__selectionIndexNextFrame = -1;
        this.__insertIndex = 0;
        this.contents[this.labelTool.currentFrameIndex] = [];
    }

    undoResetSingleObject(objIdx: number, boxParams: BoxParams) {
        this.setBoxParams(boxParams, this.contents[this.labelTool.currentFrameIndex][objIdx]);
        this.setBoxParamsToMesh(boxParams, this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objIdx]);
        this.changeClass(objIdx, boxParams.class);

        let isSelected = (this.labelTool3D.selectedMesh !== undefined);
        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, objIdx, isSelected);
    }

    resetSingleObject(objIdx: number) {
        const obj: AnnotationObjectParams = this.contents[this.labelTool.currentFrameIndex][objIdx];
        const cubeObj: Mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objIdx];

        this.labelTool3D.operationStack.push({
            type: 'reset',
            boxParams: this.boxParams(obj),
            objectIndex: objIdx
        })

        this.setBoxParams(obj.original, obj);
        this.setBoxParamsToMesh(obj.original, cubeObj);

        let isSelected = (this.labelTool3D.selectedMesh !== undefined);
        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, objIdx, isSelected);
    }

    getNextTrackID(): string {
        return uuid.v4();
    }

    getDefaultObject(): AnnotationObjectParams {
        const params: AnnotationObjectParams = {
            class: "",
            x: -1,
            y: -1,
            z: -1,
            length: -1,
            width: -1,
            height: -1,
            rotationYaw: 0,
            rotationPitch: 0,
            rotationRoll: 0,
            original: {
                class: "",
                x: -1,
                y: -1,
                z: -1,
                length: -1,
                width: -1,
                height: -1,
                rotationYaw: 0,
                rotationPitch: 0,
                rotationRoll: 0,
                trackId: "",
                attributes: []
            },
            interpolationStartFileIndex: -1,
            interpolationStart: {
                position: {
                    x: -1,
                    y: -1,
                    z: -1,
                    rotationYaw: 0,
                    rotationPitch: 0,
                    rotationRoll: 0
                },
                size: {
                    length: -1,
                    width: -1,
                    height: -1
                }
            },
            interpolationEnd: {
                position: {
                    x: -1,
                    y: -1,
                    z: -1,
                    rotationYaw: 0,
                    rotationPitch: 0,
                    rotationRoll: 0
                },
                size: {
                    length: -1,
                    width: -1,
                    height: -1
                }
            },
            trackId: "",
            fromFile: true,
            fileIndex: -1,
            copyLabelToNextFrame: false,
            changeFrame: false,
            attributes: {},
            channels: []
        };
        // add channels
        const channels: Channel[] = [];
        for (let i = 0; i < this.labelTool.cameraChannels.length; i++) {
            channels.push({
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: this.labelTool.cameraChannels[i].channel
            })
        }
        params.channels = channels;
        return params;
    }

    getObjectIndexByTrackIdAndClass(trackId: string, className: string, fileIdx: number) {
        for (let i = 0; i < this.contents[fileIdx].length; i++) {
            let obj = this.contents[fileIdx][i];
            if (obj["trackId"].localeCompare(trackId) === 0 && obj.class.toLowerCase() === className.toLowerCase()) {
                return i;
            }
        }
        return -1;
    }

    getObjectIndexByName(objectName: string): number {
        // TODO: use unique track ID instead of name
        if (objectName === "") {
            console.log("Invalid object name: " + objectName);
            return -1;
        }
        const parts = objectName.split("-");
        const classToFind = parts[1].toLowerCase();// e.g. cube-car-1
        const idToFind = parts.slice(2).join('-');
        for (let i = 0; i < this.contents[this.labelTool.currentFrameIndex].length; i++) {
            if (this.contents[this.labelTool.currentFrameIndex][i].class.toLowerCase() === classToFind && this.contents[this.labelTool.currentFrameIndex][i].trackId.localeCompare(idToFind) === 0) {
                return i;
            }
        }
        return -1;
    }

    getDefaultAttributesByClassIdx(objectClassIdx: number) {
        let keyValueMap = {}
        let datasetIdx = this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset);
        let defaultAttributes = this.labelTool.config.datasets[datasetIdx].classes[objectClassIdx].attributes
        for (let attributeIdx in defaultAttributes) {
            if (defaultAttributes.hasOwnProperty(attributeIdx)) {
                let attribute = defaultAttributes[attributeIdx];
                keyValueMap[attribute.name] = attribute.default
            }
        }
        return keyValueMap;
    }

    setObjectParameters(annotationObj) {
        const params = {
            class: annotationObj["class"],
            x: annotationObj["x"],
            y: annotationObj["y"],
            z: annotationObj["z"],
            width: annotationObj["width"],
            length: annotationObj["length"],
            height: annotationObj["height"],
            rotationYaw: parseFloat(annotationObj["rotationYaw"]),
            rotationPitch: parseFloat(annotationObj["rotationPitch"]),
            rotationRoll: parseFloat(annotationObj["rotationRoll"]),
            channels: [{
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }, {
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }, {
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }, {
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }, {
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }, {
                rect: [],
                projectedPoints: [],
                lines: [],
                channel: ""
            }]
        };
        for (let i = 0; i < annotationObj["channels"].length; i++) {
            const channelObj = annotationObj["channels"][i];
            if (channelObj.channel !== undefined) {
                params["channels"][i]["channel"] = channelObj.channel;
            }
        }
        return params;
    }

    setToDefaultSize(objectIdx: number) {
        let isSelected = (this.labelTool3D.selectedMesh !== undefined);
        if (isSelected) {
            this.contents[this.labelTool.currentFrameIndex][objectIdx]["length"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][0];
            this.contents[this.labelTool.currentFrameIndex][objectIdx]["width"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][1];
            this.contents[this.labelTool.currentFrameIndex][objectIdx]["height"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][2];
            this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["scale"]["x"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][0];
            this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["scale"]["y"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][1];
            this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["scale"]["z"] = this.labelTool.defaultObjectSizes[this.annotationClasses.currentClass][2];
            // this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["position"]["z"] = this.contents[this.labelTool.currentFrameIndex][objectIdx]["z"] - this.contents[this.labelTool.currentFrameIndex][objectIdx]["height"] / 2.0;

            this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, objectIdx, true);
        }
    }
}

export {AnnotationObject};