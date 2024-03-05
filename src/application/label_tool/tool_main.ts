import * as $ from "jquery";
import * as Raphael from "raphael/raphael";
import * as THREE from "three";
import jQuery = require("jquery");

import { FileOperations } from "../io/file_operations";
import { Utils } from "../util/utils";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

import { AnnotationClass } from "../annotation/annotation_class";
import { AnnotationObject } from "../annotation/annotation_object";
import { emptyObjectSizes, ObjectSizes } from "../config/object_params";
import { Mesh, Sprite } from "three";
import { LabelToolImage } from "./tool_image";
import { LabelTool3D } from "./tool_3d";
import getLoader from "./loaders/loader";
import {CanvasRenderer} from "openfl";

export const viewModeOptionsArray = ['orthographic', 'prespective'] as const;
export type ViewModeOption = typeof viewModeOptionsArray[number];

// TODO: AL/inference types
export const activeLearningOptionsArray = ['Active Train on Latest Data',
                                              'Active Train on All Data',
                                              'Query Data to Label',
                                              'Train Model on All Data',
                                              'Train Model on Latest Data',
                                              'None'];
export type ActiveLearninOption = typeof  activeLearningOptionsArray[number];
export const queryStrategyOptions = ['Continuous', 'Random'];
export type QueryOption = typeof  queryStrategyOptions[number];
export const inferenceOptionsArray = ['Detections All Frames', 'Detections Current Frame', 'Detections In Frame Range', 'None'];
export type InferOption = typeof inferenceOptionsArray[number];
export const evaluationOptionsArray = ['Evaluate All Frames', 'Evaluate Current Frame', 'Evaluate In Frame Range', 'None'];
export type EvalOption = typeof  evaluationOptionsArray[number];

const frameAnnotationTypeArray = ['continuous_sequence', 'random_frame'] as const;
export type FrameAnnotationType = typeof frameAnnotationTypeArray[number];

class LabelTool {
    labelToolImage: LabelToolImage;
    labelTool3D: LabelTool3D;

    annotationClasses: AnnotationClass;
    annotationObjects: AnnotationObject;

    configFileName = 'config.json';
    config: any; // Consider specifying a type for config instead of 'any' if possible

    // Dataset and sequences
    datasetArray: any = []; // Consider using a more specific type than 'any' if possible
    currentDataset = "";
    currentDatasetIdx: number;
    currentSequence = "";
    availableSequences: any[] = []; // Consider using a more specific type than 'any'
    sequenceArray: string[] = [];
    numFrames: number;

    cameraChannels: any[] = []; // Consider using a more specific type than 'any'
    lidarChannels: any[] = []; // Consider using a more specific type than 'any'
    currentCameraChannel = "";
    currentLidarChannel = "";

    classes: any[] = []; // Consider using a more specific type than 'any'
    weatherTypes = [];

    currentFrameIndex = 0;
    previousFrameIndex = 0;

    // File names
    annotationFileNames = [];
    pointCloudFileNames = [];
    imageFileNames: string[][] = [];
    fileNames = [];

    // Image properties
    originalImageSize: number[];
    currentImageArray = [{}];
    imageAspectRatio: number;
    imageScale: number[] = [];
    cursorPos: number[] = [];

    // Image Canvas
    canvasSize: number[] = [];

    defaultObjectSizes: ObjectSizes = emptyObjectSizes();

    positionLidar: number[];

    // Timing
    timeElapsed = 0;
    timeElapsedPlay = 0;
    timeDelay = 1000;
    timeDelayPlay = 100;

    imageCanvasInitialized = false;
    pointCloudLoaded = false;
    playSequence = false;

    rotationConvention = "";
    frameProperties: any[] = []; // Consider using a more specific type than 'any'
    coordinateSystem = {}; // Consider using a more specific type than 'any'
    streamInformation: any[] = []; // Consider using a more specific type than 'any'

    cubeArray: Mesh[][] = [];
    spriteArray: Sprite[][] = [];

    frameAnnotationType: FrameAnnotationType = "continuous_sequence";
    colorSelectedObject = "#ff0000";
    drawEgoVehicle = false;

    // active learning
    activeLearningConfig: {};


    constructor() {
        this.setKeyUpHandler();
        this.loadConfig();
        this.setFileNames();
        this.annotationObjects = new AnnotationObject(this);
        this.annotationClasses = new AnnotationClass(this, this.annotationObjects);
        this.labelToolImage = new LabelToolImage(this, this.annotationClasses, this.annotationObjects);
        this.labelTool3D = new LabelTool3D(this, this.annotationClasses, this.annotationObjects, this.labelToolImage);
        this.start();
    }

    setKeyUpHandler() {
        $("#previous-frame-button").keyup(function (e) {
            if (e.which === 32) {
                return false;
            }
        });

        $("#next-frame-button").keyup(function (e) {
            if (e.which === 32) {
                return false;
            }
        });
    }



    loadConfig(datasetName = ''){

        this.config = require('../config/' + this.configFileName);

        for (let i = 0; i < this.config.datasets.length; i++) {
            let datasetName = this.config.datasets[i].name;
            this.datasetArray.push(datasetName);
        }

        if (datasetName) {
            let datasetIndex = this.datasetArray.indexOf(datasetName);
            if (datasetIndex !== -1) {
                this.currentDatasetIdx = datasetIndex;
            } else {
                throw new Error(`Dataset with name ${datasetName} not found.`);
            }
        }

        if (this.currentDatasetIdx == undefined){
            this.currentDatasetIdx = 0;
        }
        this.currentDataset = this.datasetArray[this.currentDatasetIdx];

        this.availableSequences = this.config.datasets[this.currentDatasetIdx].sequences;
        for (let i = 0; i < this.availableSequences.length; i++){
            this.sequenceArray.push(this.availableSequences[i].name);
        }

        this.currentSequence = this.config.datasets[this.currentDatasetIdx].default_sequence;
        this.classes = this.config.datasets[this.currentDatasetIdx].classes;
        this.positionLidar = this.config.datasets[this.currentDatasetIdx].position_lidar;

        this.lidarChannels = this.config.datasets[this.currentDatasetIdx].lidar_channels;
        this.cameraChannels = this.config.datasets[this.currentDatasetIdx].camera_channels;
        this.currentLidarChannel = this.config.datasets[this.currentDatasetIdx].lidar_channels[0];
        this.currentCameraChannel = this.config.datasets[this.currentDatasetIdx].camera_channels[0];

        this.numFrames = this.config.datasets[this.currentDatasetIdx].num_frames;

        this.originalImageSize = this.config.datasets[this.currentDatasetIdx].image_size;
        this.imageAspectRatio = this.originalImageSize[0] / this.originalImageSize[1];
        for (let i = 0; i < this.cameraChannels.length; i++){
            this.imageScale.push(this.config.datasets[this.currentDatasetIdx].image_scale_factor);
        }

        this.frameAnnotationType = this.config.datasets[this.currentDatasetIdx].frame_annotation_type;
        this.weatherTypes = this.config.datasets[this.currentDatasetIdx].weather_types;

        this.rotationConvention = this.config.datasets[this.currentDatasetIdx].rotation_convention;

        this.coordinateSystem = this.config.datasets[this.currentDatasetIdx].coordinate_system;

        // this.activeLearningConfig = this.config.datasets[this.currentDatasetIdx].active_learning
    }

    setFileNames(){
        const fileNameArray: any = [];

        this.annotationFileNames = FileOperations.loadFileNames("annotation_filenames.txt", this);

        for (let i= 0; i < this.cameraChannels.length; i++){
            let channel = this.cameraChannels[i].channel;
            let fileName = `${channel}_filenames.txt`;
            this.imageFileNames[channel] = FileOperations.loadFileNames(fileName, this);
        }

        this.pointCloudFileNames = FileOperations.loadFileNames("point_cloud_filenames.txt", this);
        this.numFrames = this.pointCloudFileNames.length;

        for (let i = 0; i < this.numFrames; i++) {
            fileNameArray.push(Utils.pad(i, 6, 0))
        }
        this.fileNames = fileNameArray;
        this.frameProperties = Array(this.numFrames).fill({});
    }

    start() {
        this.initTimer();
        this.initClasses();
        this.initClassPicker();
        this.initFrameSelector();

        this.initCameraWindows();
        this.loadImageData();

        this.initPointCloudWindow();
        this.loadDefaultObjectSizes();
        this.labelTool3D.start();

        // draw ego vehicle
        if (this.drawEgoVehicle === true) {
            this.loadVehicleModel();
        }
        this.labelToolImage.draw2DProjections();
        this.addEventHandler();
    }

    private addEventHandler() {
        document.getElementById('left-btn')!.addEventListener('click', () => {
            this.previousFrame();
        });
        document.getElementById('right-btn')!.addEventListener('click', () => {
            this.nextFrame();
        });
    }

    initTimer() {
        this.timeElapsed = 0;
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        let timeString = "";

        setInterval(() => {
            // increase elapsed time every second
            this.timeElapsed = this.timeElapsed + 1;
            seconds = this.timeElapsed % 60;
            minutes = Math.floor(this.timeElapsed / 60);
            if (minutes > 59) {
                minutes = 0;
            }
            hours = Math.floor(this.timeElapsed / (60 * 60));
            timeString = Utils.pad(hours, 2, 0) + ":" + Utils.pad(minutes, 2, 0) + ":" + Utils.pad(seconds, 2, 0);
            $("#time-elapsed").text(timeString);
        }, this.timeDelay);
    }

    initClasses() {
        for (let i = 0; i < this.classes.length; i++) {
            this.annotationClasses.annotationClasses[this.classes[i].name] = {
                color: this.config.datasets[this.datasetArray.indexOf(this.currentDataset)].classes[i]["annotation_color"],
                index: i
            };
        }

    }

    initClassPicker() {
        this.annotationClasses.currentClass = this.classes[0].name;
        $('#class-picker>ul>li').hover(function () {
            $(this).css('background-color', "#535353");
        }, () => {
            // on mouseout, reset the background color if not selected
            let currentClass = this.annotationClasses.getCurrentClass();
            let currentClassIndex = this.annotationClasses.annotationClasses[currentClass].index;
            let currentHoverIndex = $("#class-picker>ul>li").index();
            if (currentClassIndex !== currentHoverIndex) {
                $(this).css('background-color', "#353535");
            }
        });
    }

    initFrameSelector() {
        // add bar segments to frame selection bar
        for (let i = 0; i < this.numFrames; i++) {
            let selectedClass = "";
            if (i === 0) {
                selectedClass = "selected";
            }
            let divElem = $("<div data-tip=" + i + " data-for=\"frame-selector\" class=\"frame default " + selectedClass + "\"></div>");
            $(divElem).on("click", (item) => {
                $("div.frame").attr("class", "frame default");
                item.target.className = "frame default selected";
                let elemIndex = Number(item.target.dataset.tip);
                this.changeFrame(elemIndex);
            });
            $(".frame-selector__frames").append(divElem);

        }
        $(".current").text((this.currentFrameIndex + 1) + "/" + this.numFrames);
    }

    initCameraWindows() {

        for (let i = 0; i < this.cameraChannels.length; i++) {
            this.labelToolImage.canvasParamsArray.push({});
        }

        $("#label-tool-wrapper").empty();

        let imageContainer;
        imageContainer = $("#label-tool-wrapper");

        this.setCanvasSize();

        for (let i = 0; i < this.cameraChannels.length; i++){
            this.imageScale[i] *= this.canvasSize[0] / this.originalImageSize[0];
            this.currentImageArray[i] = {
                x: 0,
                y: 0,
                width: this.canvasSize[0],
                height: this.canvasSize[1],
                cursorX: 0,
                cursorY: 0
            }
        }

        let imageWidth;
        let imageHeight;
        let canvasElem: HTMLCanvasElement;

        for (let i = 0; i < this.numFrames; i++) {
            this.labelToolImage.paperArray = [];
            for (let channelIdx = 0; channelIdx < this.cameraChannels.length; channelIdx++) {
                if (this.imageCanvasInitialized === false) {
                    let channel = this.cameraChannels[channelIdx].channel;
                    let id = "image-" + channel.toLowerCase().replace(/_/g, '-');

                    imageWidth = this.canvasSize[0];
                    imageHeight = this.canvasSize[1];

                    imageContainer.append("<div id='" + id + "'></div>");
                    $("#" + id).css("width", imageWidth);
                    $("#" + id).css("height", imageHeight);

                    canvasElem = imageContainer["0"].children[channelIdx];
                    this.labelToolImage.canvasArray.push(canvasElem);

                }
                this.labelToolImage.paperArray.push(Raphael(this.labelToolImage.canvasArray[channelIdx], imageWidth, imageHeight));
            }
            this.imageCanvasInitialized = true;
            this.labelToolImage.paperArrayAll.push(this.labelToolImage.paperArray);
        }

        for (let canvasElem in this.labelToolImage.canvasArray) {
            let canvas = this.labelToolImage.canvasArray[canvasElem];
            this.labelToolImage.addEvent(canvas, 'contextmenu',  (e) => {
                return this.labelToolImage.cancelDefault(e);
            });
        }

        for (let channelIdx in this.cameraChannels) {
            if (this.cameraChannels.hasOwnProperty(channelIdx)) {
                this.labelToolImage.initializeCamChannel(this.cameraChannels[channelIdx].channel);
            }
        }

        this.setPanelSizeAndPosition(this.currentFrameIndex);

    }

    loadImageData() {
        for (let i = 0; i < this.numFrames; i++) {
            for (let camChannelObj in this.cameraChannels) {
                if (this.cameraChannels.hasOwnProperty(camChannelObj)) {
                    let camChannelObject = this.cameraChannels[camChannelObj];
                    this.labelToolImage.loadCameraImages(camChannelObject.channel, i, this);
                }
            }
            this.labelToolImage.imageArrayAll.push(this.labelToolImage.imageArray);
        }

        for (let i = 0; i < this.cameraChannels.length; i++) {
            this.labelToolImage.imageArrayAll[this.currentFrameIndex][i].toBack();

            const canvasElem = this.labelToolImage.canvasArray[i];
            const camChannel = this.cameraChannels[i].channel;


            canvasElem.addEventListener('wheel', (event) => {
                // Handle scroll event here

                const wheelEvent = event as WheelEvent;
                let zoomFactor;
                const delta = wheelEvent.deltaY; // Get the scroll delta value
                const adjustmentRate = 100;

                const rect = canvasElem.getBoundingClientRect();

                this.currentImageArray[i]['cursorX'] = wheelEvent.clientX - rect.left;
                this.currentImageArray[i]['cursorY'] = wheelEvent.clientY - rect.top;

                if (delta > 0){
                    // scrolling down = zoom in
                    const delta = Math.abs(wheelEvent.deltaY);

                    zoomFactor = (1 + (delta / adjustmentRate))
                    if (!((this.currentImageArray[i]['width'] * zoomFactor) > this.originalImageSize[0] * 1.2)){
                        this.imageScale[i] *= zoomFactor; //this is used later for the bounding box projection
                        this.currentImageArray[i]['width'] *= zoomFactor;
                        this.currentImageArray[i]['height'] *= zoomFactor;

                        this.currentImageArray[i]['x'] -= this.currentImageArray[i]['cursorX'] * (zoomFactor - 1);
                        this.currentImageArray[i]['y'] -= this.currentImageArray[i]['cursorY'] * (zoomFactor - 1);

                    }
                }
                else {
                    // scrolling up = zoom out
                    const delta = Math.abs(wheelEvent.deltaY);

                    // check if the zoomed out image is smaller than the canvas.
                    zoomFactor = (1 - (delta / adjustmentRate))
                    if (!((this.currentImageArray[i]['width'] * zoomFactor) < this.canvasSize[0])){
                        this.imageScale[i] *= zoomFactor;
                        this.currentImageArray[i]['width'] *= zoomFactor;
                        this.currentImageArray[i]['height'] *= zoomFactor;

                        // this.currentImageArray[i]['x'] -= this.currentImageArray[i]['cursorX'] * (zoomFactor - 1);
                        // this.currentImageArray[i]['y'] -= this.currentImageArray[i]['cursorY']* (zoomFactor - 1);
                        this.currentImageArray[i]['x'] = 0;
                        this.currentImageArray[i]['y'] = 0;
                    }
                }
                event.preventDefault();
                this.labelToolImage.loadCameraImages(camChannel, this.currentFrameIndex, this);
                this.labelToolImage.draw2DProjections();

            });
        }
    }

    initPointCloudWindow(){

        let pointCloudContainer;

        pointCloudContainer = $("#label-tool-wrapper");

        pointCloudContainer.append('<div id="canvas3d" style="position: absolute; top: 0px"></div>');

        this.labelTool3D.initPCDWindow();

    }


    setCanvasSize() {
        this.canvasSize[0] = window.innerWidth / this.cameraChannels.length;
        this.canvasSize[1] = this.canvasSize[0] / this.imageAspectRatio;
    }

    setPanelSizeAndPosition(newFileIndex) {
        let imageHeight = this.canvasSize[1];

        for (let i = 0; i < this.cameraChannels.length; i++) {
            let imageId: string = "#image-" + this.cameraChannels[i].channel.toLowerCase().replace(/_/g, '-');
            $(imageId).css("height", imageHeight);

            // bring all svgs of current channel into background (set z index to 0)
            let allSvg = $(imageId + " svg");
            let imgWidth = this.canvasSize[0];
            let imgHeight = this.canvasSize[1];

            for (let j = 0; j < allSvg.length; j++) {
                allSvg[j].style.width = String(imgWidth);
                allSvg[j].style.height = String(imgHeight);
                allSvg[j].style.zIndex = String(0);
                allSvg[j].style.position = "absolute";

                let posLeft = 0;
                posLeft = i * imgWidth;
                allSvg[j].style.left = posLeft + "px";
            }
            allSvg[this.numFrames - newFileIndex - 1].style.zIndex = String(2);
        }
    }

    loadAnnotations(fileName: string, fileIndex: number) {
        const res = FileOperations.parseAnnotationFile(fileName, this);
        getLoader(this).loadAnnotations(res, fileIndex, this);
    }

    setLabelTool3D(labelTool3D: LabelTool3D) {
        this.labelTool3D = labelTool3D;
    }

    getLabelTool3D(): LabelTool3D {
        return this.labelTool3D;
    }

    loadDefaultObjectSizes() {
        // this.defaultObjectSizes = FileOperations.loadJSONFile("default_vehicle_sizes.json");
        this.defaultObjectSizes = require("../config/default_vehicle_sizes.json");
    }

    loadVehicleModel() {
        let lexusTexture = new THREE.TextureLoader().load('assets/models/lexus/lexus.jpg');
        let lexusMaterial = new THREE.MeshBasicMaterial({map: lexusTexture});
        let objLoader = new OBJLoader();
        objLoader.load('assets/models/lexus/lexus_hs.obj', (object) => {
            // @ts-ignore
            let lexusGeometry = object.children[0].geometry;
            let lexusMesh = new THREE.Mesh(lexusGeometry, lexusMaterial);

            lexusMesh.scale.set(0.065, 0.065, 0.065);
            lexusMesh.rotation.set(0, 0, -Math.PI / 2);
            lexusMesh.position.set(0, 0, -this.positionLidar[2]);

            this.labelTool3D.scene.add(lexusMesh)
        });
    }

    setLabelToolImage(labelToolImage: LabelToolImage) {
        this.labelToolImage = labelToolImage;
    }

    getLabelToolImage(): LabelToolImage {
        return this.labelToolImage;
    }


    resetBoxes() {
        if (this.annotationObjects.contents.length === 0) {
            return;
        }
        for (let i = 0; i < this.annotationObjects.contents[this.currentFrameIndex].length; i++) {
            this.annotationObjects.resetSingleObject(i);
        }
    }

    setWeatherType(value) {
        this.annotationObjects.annotatedWeatherTypes[this.currentFrameIndex] = value;
    }

    changeFrame(newFileIndex: number, undo: boolean = false) {

        if (!undo) {
            this.labelTool3D.operationStack.push({
                type: 'changeFrame',
                prev: this.currentFrameIndex,
                cur: newFileIndex
            })
        }

        if (newFileIndex === this.numFrames && this.playSequence === true) {
            // start from first frame
            this.playSequence = false;
            newFileIndex = 0;
        }


        let interpolationObjIndexCurrentFile = -1;
        if (this.frameAnnotationType === "continuous_sequence") {
            interpolationObjIndexCurrentFile = this.annotationObjects.getSelectionIndex();
        }

        this.labelTool3D.removeObject("pointcloud-scan-" + this.currentFrameIndex);
        this.labelTool3D.removeObject("pointcloud-scan-no-ground-" + this.currentFrameIndex);

        // bring current image into background instead of removing it
        this.setPanelSizeAndPosition(newFileIndex);

        // remove all 3D BB objects from scene
        for (let i = this.labelTool3D.scene.children.length; i >= 0; i--) {
            let obj = this.labelTool3D.scene.children[i];
            if (this.labelTool3D.scenePersistentObjects.includes(obj)) {
                // Don't remove hd map
                continue;
            }
            this.labelTool3D.scene.remove(obj);
        }
        // remove all 2D BB objects from camera images
        this.labelToolImage.remove2DBoundingBoxes();

        // remove all class labels in point cloud or bird eye view
        $(".class-tooltip").remove();

        // store copy flags before removing folder
        const copyFlags: boolean[] = [];
        // remove all folders
        for (let i = 0; i < this.annotationObjects.contents[this.currentFrameIndex].length; i++) {
            let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
            if (checkboxElem !== null) {
                let checkbox = <HTMLInputElement>checkboxElem.firstChild;
                copyFlags.push(checkbox.checked);
            }
            this.labelTool3D.guiOptions.removeFolder(this.annotationObjects.contents[this.currentFrameIndex][i]["class"] + ' ' + this.annotationObjects.contents[this.currentFrameIndex][i]["trackId"]);
        }
        // empty all folder arrays
        this.emptyAllFolders();

        // check for labels to copy to the next frame and copy them
        if (this.cubeArray[newFileIndex].length === 0) {
            // move 3D objects to new frame if nextFrame has no labels and copy flag is set
            for (let i = 0; i < this.cubeArray[this.currentFrameIndex].length; i++) {
                let copyLabelToNextFrame = copyFlags[i];
                if (copyLabelToNextFrame === true) {
                    const mesh: Mesh = this.cubeArray[this.currentFrameIndex][i];
                    const clonedMesh: Mesh = mesh.clone();
                    this.cubeArray[newFileIndex].push(clonedMesh);
                    this.labelTool3D.scene.add(clonedMesh);

                    const sprite: Sprite = this.spriteArray[this.currentFrameIndex][i];
                    const clonedSprite: Sprite = sprite.clone();
                    this.spriteArray[newFileIndex].push(clonedSprite);
                    this.labelTool3D.scene.add(clonedSprite);
                }
            }
            // Deep copy
            for (let i = 0; i < this.annotationObjects.contents[this.currentFrameIndex].length; i++) {
                let copyLabelToNextFrame = this.labelTool3D.annotationObjects.contents[this.currentFrameIndex][i]["copyLabelToNextFrame"];
                // let copyLabelToNextFrame = copyFlags[i];
                if (copyLabelToNextFrame === true) {
                    if (this.frameAnnotationType === "continuous_sequence" && this.labelTool3D.interpolationMode === true) {
                        // set start index
                        this.annotationObjects.contents[this.currentFrameIndex][interpolationObjIndexCurrentFile]["interpolationEndFileIndex"] = newFileIndex;
                    }
                    this.annotationObjects.contents[newFileIndex].push(jQuery.extend(true, {}, this.annotationObjects.contents[this.currentFrameIndex][i]));
                }
            }
        }
        else {
            // next frame has already 3D annotations which will be added to the scene
            for (let i = 0; i < this.cubeArray[newFileIndex].length; i++) {
                const mesh = this.cubeArray[newFileIndex][i];
                this.labelTool3D.scene.add(mesh);
                const sprite = this.spriteArray[newFileIndex][i];
                this.labelTool3D.scene.add(sprite);

                const trackId = this.annotationObjects.contents[newFileIndex][i]["trackId"];
                const className = this.annotationObjects.contents[newFileIndex][i]["class"];
                // next frame contains a new object -> add tooltip for new object
                const classTooltipElement = $("<div class='class-tooltip' id='tooltip-" + className + "-" + trackId + "'>" + trackId + "</div>");
                const imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                const vector = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
                const canvas = this.labelTool3D.renderer.domElement;
                vector.project(this.labelTool3D.currentCamera);
                vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width));
                vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height));
                $(classTooltipElement[0]).css("top", `${vector.y + this.labelToolImage.headerHeight + imagePaneHeight - 21}px`);
                $(classTooltipElement[0]).css("left", `${vector.x}px`);
                $(classTooltipElement[0]).css("opacity", 1.0);
                $("body").append(classTooltipElement);
            }
            for (let i = 0; i < this.annotationObjects.contents[this.currentFrameIndex].length; i++) {
                let trackId = this.annotationObjects.contents[this.currentFrameIndex][i]["trackId"];
                let className = this.annotationObjects.contents[this.currentFrameIndex][i]["class"];
                let objectIndexByTrackIdAndClass = this.annotationObjects.getObjectIndexByTrackIdAndClass(trackId, className, newFileIndex);
                let copyLabelToNextFrame = copyFlags[i];
                if (objectIndexByTrackIdAndClass === -1 && copyLabelToNextFrame === true) {
                    // clone that object to new frame if copy flag set and it not yet exist in next frame
                    let mesh = this.cubeArray[this.currentFrameIndex][i];
                    let clonedMesh = mesh.clone();
                    this.cubeArray[newFileIndex].push(clonedMesh);
                    this.labelTool3D.scene.add(clonedMesh);
                    let sprite = this.spriteArray[this.currentFrameIndex][i];
                    let clonedSprite = sprite.clone();
                    this.spriteArray[newFileIndex].push(clonedSprite);
                    this.labelTool3D.scene.add(clonedSprite);
                    this.annotationObjects.contents[newFileIndex].push(jQuery.extend(true, {}, this.annotationObjects.contents[this.currentFrameIndex][i]));
                }
            }
        }

        // create the GUI options
        if (this.annotationObjects.contents[newFileIndex] === undefined || this.annotationObjects.contents[newFileIndex].length === 0) {

            this.loadAnnotations(this.annotationFileNames[newFileIndex], newFileIndex);

        }
        else {
            // create gui elements
            for (let i = 0; i < this.annotationObjects.contents[newFileIndex].length; i++) {
                let bboxDefault = this.annotationObjects.getDefaultObject();
                let bbox = this.annotationObjects.setBBox(bboxDefault, newFileIndex, i);
                this.labelTool3D.addBoundingBoxGui(bbox, undefined, i);
            }
        }

        if (this.annotationObjects.annotatedWeatherTypes[newFileIndex] !== "") {
            this.labelTool3D.parameters.weather_type = this.annotationObjects.annotatedWeatherTypes[newFileIndex];
        } else {
            // set default weather type to CLOUDY (index 1)
            let sequence = Utils.getSequenceByName(this.availableSequences, this.currentSequence);
            this.labelTool3D.parameters.weather_type = sequence.default_weather_type;
            this.annotationObjects.annotatedWeatherTypes[newFileIndex] = sequence.default_weather_type;
        }

        $(".current").text((newFileIndex + 1) + "/" + this.numFrames);
        // set class selected to current frame bar
        // unselect all
        $("div.frame").attr("class", "frame default");
        let currentBar = $("div.frame")[newFileIndex];
        currentBar.className = "frame default selected";


        let selectionIndexNextFile = -1;
        if (this.frameAnnotationType === "continuous_sequence") {
            if (interpolationObjIndexCurrentFile !== -1) {
                if (this.labelTool3D.interpolationMode === true) {
                    selectionIndexNextFile = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.currentFrameIndex][interpolationObjIndexCurrentFile]["trackId"], this.annotationObjects.contents[this.currentFrameIndex][interpolationObjIndexCurrentFile]["class"], newFileIndex);
                } else {
                    if (this.annotationObjects.getSelectionIndex() !== -1 && this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()] !== undefined) {
                        selectionIndexNextFile = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()]["trackId"], this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()]["class"], newFileIndex);
                    }

                }
            }
        }

        // TODO: fix interpolation (when track id 0)
        if (this.annotationObjects.getSelectionIndex() !== -1 && this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()] !== undefined) {
            let objectIndexNextFrame = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()]["trackId"], this.annotationObjects.contents[this.currentFrameIndex][this.annotationObjects.getSelectionIndex()]["class"], newFileIndex);
            this.annotationObjects.__selectionIndexNextFrame = objectIndexNextFrame;
        }

        this.previousFrameIndex = this.currentFrameIndex;
        // open folder of selected object
        if (selectionIndexNextFile !== -1) {
            // NOTE: set current file index after querying index above
            this.currentFrameIndex = newFileIndex;
            // interpolationObjIndexCurrentFile = interpolationObjIndexNextFile;
            this.annotationObjects.__selectionIndexCurrentFrame = this.annotationObjects.__selectionIndexNextFrame;
            this.labelTool3D.selectedMesh = this.cubeArray[newFileIndex][selectionIndexNextFile];
            this.labelTool3D.addTransformControls();
            this.annotationObjects.select(selectionIndexNextFile);
        } else {
            this.labelTool3D.mouseUpLogicLeftClickNoObject();
        }

        this.currentFrameIndex = newFileIndex;
        this.annotationObjects.__selectionIndexCurrentFrame = this.annotationObjects.__selectionIndexNextFrame;
        this.loadImageData();
        this.labelToolImage.draw2DProjections();

        this.labelTool3D.loadPointCloudData();
        this.labelTool3D.setHDMap();

    }

    previousFrame() {
        if (this.currentFrameIndex >= this.labelTool3D.parameters.skip_frames) {
            this.changeFrame(this.currentFrameIndex - this.labelTool3D.parameters.skip_frames);
        } else if (this.currentFrameIndex !== 0) {
            this.changeFrame(0);
        }
    }

    nextFrame() {
        if (this.currentFrameIndex < (this.fileNames.length - 1 - this.labelTool3D.parameters.skip_frames)) {
            this.changeFrame(this.currentFrameIndex + this.labelTool3D.parameters.skip_frames);
        } else if (this.currentFrameIndex !== this.fileNames.length - 1) {
            this.changeFrame(this.fileNames.length - 1);
        }
    }

    resetTool() {
        for (let i = this.labelTool3D.scene.children.length; i >= 0; i--) {
            let obj = this.labelTool3D.scene.children[i];
            this.labelTool3D.scene.remove(obj);
        }

        // base label tool
        this.currentFrameIndex = 0;
        this.fileNames = [];
        this.imageFileNames = [];
        this.annotationFileNames = [];
        this.availableSequences = [];
        this.sequenceArray = [];
        this.currentSequence = "";
        this.weatherTypes = [];
        this.cubeArray = [];

        for (let i = 0; i < this.annotationObjects.contents[this.currentFrameIndex].length; i++) {
            let annotationObj = this.annotationObjects.contents[this.currentFrameIndex][i];
            this.labelTool3D.guiOptions.removeFolder(annotationObj["class"] + ' ' + annotationObj["trackId"]);
        }

        this.annotationObjects.contents = [];
        $(".class-tooltip").remove();
        this.spriteArray = [];
        this.labelTool3D.selectedMesh = undefined;

        // pcd label tool
        this.emptyAllFolders();
        this.labelTool3D.pointCloudScanMap = [];

        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[0]).css('background-color', '#525252');
        classPickerElem.css('border-bottom', '0px');

        // annotation_classes
        this.annotationClasses.colorIdx = 0;
        this.annotationClasses.currentClass = this.classes[0].name;
        for (let i = 0; i < this.classes.length; i++) {
            delete this.annotationClasses[this.classes[i].name];
        }
        // remove guiClassesBoundingBox
        $("#class-picker").remove();

        // image label tool
        this.imageCanvasInitialized = false;
        this.labelToolImage.canvasArray = [];
        this.labelToolImage.canvasParamsArray = [];
        this.labelToolImage.paperArray = [];
        this.labelToolImage.paperArrayAll = [];
        this.labelToolImage.imageArray = [];
        this.labelToolImage.imageHeightOriginal = -1;
        this.labelToolImage.imageWidthOriginal = -1;

        $(".frame-selector__frames").empty();
    }

    private emptyAllFolders() {
        this.labelTool3D.folderBoundingBox3DArray = [];
        this.labelTool3D.folderPositionArray = [];
        this.labelTool3D.folderRotationArray = [];
        this.labelTool3D.folderSizeArray = [];
        this.labelTool3D.folderAttributeArray = [];
        this.labelTool3D.controllerGUIArray = [];
    }
}
export {LabelTool};