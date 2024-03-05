import * as $ from "jquery";

import * as THREE from "three";
import { WEBGL } from "three/examples/jsm/WebGL";
import { OrbitControls } from 'three-orbitcontrols-ts';
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { Projector } from "three/examples/jsm/renderers/Projector";

import * as dat from "dat.gui/build/dat.gui";
import * as JSZip from "jszip/dist/jszip";
import * as KEYS from 'keycode-js';
import { Mutex } from 'async-mutex';

import { Utils } from "../util/utils";
import { Extreme, MathUtils } from "../util/math_utils";
import { Key } from "../util/keydown";
import { Mouse } from "../util/mouse";
import { MaFilter } from "../util/ma_filter";
import { annMath } from "../util/ann_math";
import { OperationStack, OperationStackItem } from "../util/operation_stack";
import { FileOperations } from "../io/file_operations";
import { AnnotationObject, AnnotationObjectParams } from "../annotation/annotation_object";
import { AnnotationClass } from "../annotation/annotation_class";

import { LabelToolImage } from "./tool_image";
import { LabelTool, ViewModeOption, viewModeOptionsArray } from "./tool_main";
import {ActiveLearninOption, activeLearningOptionsArray} from "./tool_main";
import {InferOption, inferenceOptionsArray} from "./tool_main";
import {EvalOption, evaluationOptionsArray} from "./tool_main";
import {QueryOption, queryStrategyOptions} from "./tool_main";

import getLoader from "./loaders/loader";
import { HDMap } from "./hdmap";


import {
    AnimationUtils,
    AxesHelper,
    BoxBufferGeometry,
    BufferGeometry,
    Camera,
    Clock,
    Color,
    DirectionalLight,
    DoubleSide,
    EdgesGeometry,
    Euler,
    FileLoader,
    Float32BufferAttribute,
    Fog,
    GridHelper,
    Intersection,
    LineBasicMaterial,
    LineSegments,
    LoadingManager,
    Material,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MOUSE,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    Sprite,
    SpriteMaterial,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer
} from "three";
import arraySlice = AnimationUtils.arraySlice;

export type LabelTool3DParameters = {
    point_size: number
    download: () => void,
    undo: any,
    i: number,
    viewMode: ViewModeOption,
    modeAL: ActiveLearninOption,
    inferMode: InferOption
    evalMode: EvalOption,
    SelectNums: number,
    rangeEvalFrames: string,
    rangeInferFrames: string,
    QueryStrategy: QueryOption,
    show_projected_points: boolean,
    show_field_of_view: boolean,
    show_grid: boolean,
    filter_ground: boolean,
    hide_other_annotations: boolean,
    select_all_copy_label_to_next_frame: () => void,
    unselect_all_copy_label_to_next_frame: () => void,
    show_detections: boolean,
    interpolation_mode: boolean,
    interpolate: () => void,
    reset_all: () => void,
    skip_frames: number,
    weather_type: string,
    call_for_inference: () => void
};

class LabelTool3D {
    labelTool: LabelTool;
    labelToolImage: LabelToolImage;
    annotationClasses: AnnotationClass;
    annotationObjects: AnnotationObject;
    hdmap: HDMap;
    operationStack: OperationStack = new OperationStack();
    parameters: LabelTool3DParameters;

    // Canvas elements
    canvas3D: HTMLElement;
    canvasBEV: HTMLCanvasElement;
    canvasSideView: HTMLCanvasElement;
    canvasFrontView: HTMLCanvasElement;

    // Cameras
    currentCamera: PerspectiveCamera | OrthographicCamera;
    cameraBEV: OrthographicCamera;
    cameraSideView: OrthographicCamera;
    cameraFrontView: OrthographicCamera;

    // Renderers
    renderer: WebGLRenderer;

    // Scene and helpers
    scene: Scene;
    grid: GridHelper;
    projector: Projector;
    clock: Clock;

    // Controls
    currentOrbitControls: OrbitControls;
    pointerLockControls: PointerLockControls | undefined;
    pointerLockObject: Camera | undefined;
    transformControls: TransformControls | undefined;

    // GUI Elements
    guiOptions: dat.GUI = new dat.GUI({ autoPlace: true, width: 350, resizable: false });
    textBoxTrackId: dat.Gui.Controller;
    interpolateBtn: dat.Controller;
    pointSizeSlider: dat.Controller;
    guiAnnotationClasses: dat.GUI;
    controllerGUIArray: dat.Controller[][] = [];

    // GUI Folders
    folderBoundingBox3DArray: dat.gui.GUI[] = [];
    folderPositionArray: dat.Gui[] = [];
    folderRotationArray: dat.Gui[] = [];
    folderSizeArray: dat.Gui[] = [];
    folderAttributeArray: dat.dat.Gui[] = [];
    folderEndPosition: dat.dat.Gui;
    folderEndSize: dat.dat.Gui;

    // Flags and settings
    showGridFlag: boolean = false;
    filterGround: boolean = false;
    hideOtherAnnotations: boolean = false;
    interpolationMode: boolean = false;
    showDetections: boolean = false;
    birdsEyeViewFlag: boolean = true;
    guiBoundingBoxAnnotationsInitialized: boolean = false;
    guiBoundingBoxMenuInitialized: boolean = false;
    guiOptionsOpened: boolean = true;
    dragControls: boolean = false;
    clickFlag: boolean = false;
    spriteBehindObject: boolean = false;
    showProjectedPointsFlag: boolean = false;

    views: any[] = [];
    selectedViewModeIndex: number = 0;
    viewModeController: dat.GUI.Controller = undefined;
    showMasterViews: boolean = false;

    detectionList: any = [];
    detectionIndex: number = 0;
    modeALcontroller: dat.GUI.Controller = undefined;
    inferModeController: dat.GUI.Controller = undefined;
    evalModeController: dat.GUI.Controller = undefined;
    detRange = {'start': 0, 'end': 0};
    evalRange = {'start': 0, 'end': 0};

    pointCloudScanMap: Points<BufferGeometry, Material | Material[]>[] = [];
    pointCloudScanNoGroundList: Points<BufferGeometry, Material | Material[]>[] = [];
    groundPlaneArray: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
    clickedPlaneArray: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
    currentPoints3D: number[][] = [];
    currentDistances: number[] = [];

    selectedMesh: Mesh | undefined;
    scenePersistentObjects: THREE.Object3D[] = [];
    cube: THREE.Mesh;
    intersectedObject;
    useTransformControls;

    mouse_mutex: Mutex = new Mutex();

    // Time and Animation
    prevTime: number = performance.now();
    autoSaveInterval: number = 2000;

    interpolationObjIndexCurrentFile: number = -1;
    interpolationObjIndexNextFile: number = -1;
    clickedObjectIndex: number = -1;
    clickedObjectIndexPrevious: number = -1;
    clickedPoint = new Vector3();
    groundPointMouseDown;

    colorMap: string[] = [];
    activeColorMap = 'colorMapJet.js';

    numGUIOptions: number = 17;
    pointSizeCurrent: number = 0.1;
    pointSizeMax: number = 1;
    gridSize: number = 1000;

    responseData;
    saveAnnotationsNow = true;

    constructor(labelTool: LabelTool, annotationClasses: AnnotationClass, annotationObjects: AnnotationObject, labelToolImage: LabelToolImage) {
        this.labelTool = labelTool;
        this.annotationClasses = annotationClasses;
        this.annotationObjects = annotationObjects;
        this.annotationObjects.setLabelTool3D(this);
        this.parameters = this.startParameters();
        this.registerRemoveFunction();
        this.labelToolImage = labelToolImage;
    }

    start() {
        this.loadPointCloudData();
        this.setHDMap();
        this.loadAnnotations();
        this.autoSaveAnnotations();
        this.addKeyEventListeners();
    }

    addKeyEventListeners() {
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    setLabelToolImage(labelToolImage) {
        this.labelToolImage = labelToolImage;
    }

    initPlayTimer() {
        this.labelTool.timeElapsedPlay = 0;
        let playIntervalHandle = setInterval(() => {
            this.labelTool.timeElapsedPlay = this.labelTool.timeElapsedPlay + 1;
            if (this.labelTool.playSequence === true) {
                if (this.labelTool.currentFrameIndex < this.labelTool.numFrames) {
                    this.labelTool.changeFrame(this.labelTool.currentFrameIndex + 1);
                } else {
                    clearInterval(playIntervalHandle);
                }
            } else {
                clearInterval(playIntervalHandle);
            }

        }, this.labelTool.timeDelayPlay);
    }

    startParameters(): LabelTool3DParameters {
        return {
            point_size: this.pointSizeCurrent,
            download: this.downloadAnnotations,
            undo: this.undoOperation,
            i: -1,
            viewMode: "orthographic",
            modeAL: 'None',
            inferMode: 'None',
            evalMode: 'None',
            SelectNums: 0,
            rangeEvalFrames: '',
            rangeInferFrames: '',
            QueryStrategy: 'CRB',
            show_projected_points: false,
            show_field_of_view: false,
            show_grid: false,
            filter_ground: false,
            hide_other_annotations: this.hideOtherAnnotations,
            select_all_copy_label_to_next_frame: this.selectAllCopyLabelToNextFrame,
            unselect_all_copy_label_to_next_frame: this.unselectAllCopyLabelToNextFrame,
            show_detections: false,
            interpolation_mode: false,
            interpolate: this.interpolateSelectedBox,
            reset_all: this.labelTool.resetBoxes,
            skip_frames: 1,
            weather_type: Utils.getSequenceByName(this.labelTool.availableSequences, this.labelTool.currentSequence).default_weather_type,
            call_for_inference: this.aCallForInference
        };
    }

    aCallForEvaluation = async () => {
        let files: string[];
        if (this.evalRange['start'] === this.evalRange['end']){
            // detection in current frame only
            files = [this.labelTool.pointCloudFileNames[this.evalRange['start']]]
        }
        else {
            files = arraySlice(this.labelTool.pointCloudFileNames, this.evalRange['start'], this.evalRange['end']+1);
        }
        const argsDict = {
            filenames: files,
            op: "evaluation",
            mode: "evaluation",
        };
        const requestInit: RequestInit = this.requestInitFromJson(argsDict);
        const response = await (await fetch("/connect-to-workstation",requestInit));
        if (!response.ok){
            throw new Error('HTTP Error! Could not connect to workstation for Inference.')
        }

        const responseData = await response.json();
    }
    aCallForInference = async() => {
        let files: string[];
        if (this.detRange['start'] === this.detRange['end']){
            // detection in current frame only
            files = [this.labelTool.pointCloudFileNames[this.detRange['start']]]
        }
        else {
            // detections either in all frames or a range of frames.
            files = arraySlice(this.labelTool.pointCloudFileNames, this.detRange['start'], this.detRange['end']+1);
        }

        // Filter out files that exist in detectionList
        files = files.filter(file =>
            !this.detectionList.some(item =>
                Object.keys(item).some(key => key === file)
            )
        );
        const argsDict = {
            filenames: files,
            op: "inference",
            mode: "inference",
        };
        const requestInit: RequestInit = this.requestInitFromJson(argsDict);
        const response = await (await fetch("/connect-to-workstation",requestInit));
        if (!response.ok){
            throw new Error('HTTP Error! Could not connect to workstation for Inference.')
        }
        const responseData = await response.json();

        this.saveAnnotationsNow = false;
        // Convert each element in this.responseData.preds to a JSON string
        const stringifiedPreds = responseData.preds.map(element => JSON.stringify(element));

        const annotationFiles = {
            annotationFiles: stringifiedPreds,
            fileNames: argsDict['filenames'],
            dataset: this.labelTool.currentDataset,
            lidarChannel: this.labelTool.currentLidarChannel,
            sequence: this.labelTool.currentSequence
        };
        const requestInitSaveDets: RequestInit = this.requestInitFromJson(annotationFiles);
        const responseSaveDets = await fetch('/save_annotations', requestInitSaveDets);
        if (!responseSaveDets.ok) {
            throw Error("Response status not OK")
        }
        this.loadAnnotations();
        this.saveAnnotationsNow = true;

        // const boxes = responseData.preds.boxes;
        // const labels = responseData.preds.labels;
        // const numDetections = boxes.length;
        // for (let idx = 0; idx < numDetections; idx++) {
        //     let params = this.labelTool.annotationObjects.getDefaultObject();
        //     params.class = labels[idx];
        //     params.original.class = labels[idx]
        //     params.trackId = this.annotationObjects.getNextTrackID();
        //     params.original.trackId = this.annotationObjects.getNextTrackID();
        //
        //     const euler = new Euler(boxes[idx][6], 0, 0);
        //     params.rotationYaw = euler.z;
        //     params.original.rotationYaw = euler.z;
        //     params.rotationPitch = euler.y;
        //     params.original.rotationPitch = euler.y;
        //     params.rotationRoll = euler.x;
        //     params.original.rotationRoll = euler.x;
        //
        //     params.x = boxes[idx][0];
        //     params.original.x = boxes[idx][0];
        //     params.y = boxes[idx][1];
        //     params.original.y = boxes[idx][1];
        //     params.z = boxes[idx][2];
        //     params.original.z = boxes[idx][2];
        //
        //     let length;
        //     let width;
        //     let height;
        //
        //     length = Math.max(boxes[idx][3], 0.0001);
        //     width = Math.max(boxes[idx][4], 0.0001);
        //     height = Math.max(boxes[idx][5], 0.0001);
        //
        //     params.length = length;
        //     params.original.length = length;
        //     params.width = width;
        //     params.original.width = width;
        //     params.height = height;
        //     params.original.height = height;
        //
        //     params.fileIndex = this.labelTool.currentFrameIndex;
        //
        //     let objectClassIdx = this.annotationClasses.getIndexByObjectClass(labels[idx]);
        //     let defaultAttributes = this.annotationObjects.getDefaultAttributesByClassIdx(objectClassIdx);
        //     params.attributes = defaultAttributes;
        //
        //     this.annotationObjects.set(this.annotationObjects.__insertIndex, params);
        //     this.annotationObjects.__insertIndex++;
        // }
        // this.annotationObjects.__insertIndex = 0;
    }


    aCallForActiveLearning = async() => {
        console.log("this.parameters.modeAL: ", this.parameters.modeAL);
        console.log("number of frames to selection: ", this.parameters.SelectNums);

        const opMap = {
            'Active Train on Latest Data': 'active_train_latest',
            'Active Train on All Data': 'active_train_all',
            'Query Data to Label': 'query_only',
            'Train Model on All Data': 'train_all_only',
            'Train Model on Latest Data': 'train_latest_only',
        };

        const queryMap = {
            'Continuous': 'tCRB',
            'Random': 'CRB'
        }

        const argsDict = {
            'mode': 'AL',
            'op': opMap[this.parameters.modeAL],
            'N_select': this.parameters.SelectNums,
            'query': queryMap[this.parameters.QueryStrategy],
        }
        const requestInit: RequestInit = this.requestInitFromJson(argsDict);
        const response = await (await fetch("/connect-to-workstation",requestInit));

        if (!response.ok){
            throw new Error('HTTP Error! Could not connect to workstation for Inference.')
        }

        const responseData = await response.json();
    }

    //TODO: this is just a testing method
    callToWorkstation = async() => {

        const argsDict = {
            fileName: this.labelTool.pointCloudFileNames[0],
            fileList: this.labelTool.pointCloudFileNames,
            modelCkpt: "Oracle_80.pth",
            cfgFile: "/ahmed/tools/cfgs/tumtraf_models/pv_rcnn.yaml",
            op: "inference",
            activeTrain: false,
            trainScheme: "tunedAll"
        };
        const requestInit: RequestInit = this.requestInitFromJson(argsDict);

        const response = await (await fetch("/connect-to-workstation",requestInit));

        const responseData = await response.json();
        console.log('workstation response: ', responseData);
        if (!response.ok){
            throw new Error('HTTP Error! Could not connect to workstation.')
        }
    }

    async setHDMap() {
        this.hdmap = HDMap.getInstance(this.labelTool);
        const hdmap = await this.hdmap.get();
        this.scenePersistentObjects.push(hdmap);
        this.scene.add(hdmap);
    }

    initPCDWindow() {
        // if (!Detector.webgl) {
        //     Detector.addGetWebGLMessage();
        // }
        let isWebglEnabled = require('detector-webgl');
        if (!isWebglEnabled) {
            console.log("WebGL is not available! Please use a browser with WebGL support.")
        }

        this.initializePointCloudWindow();
        this.animate();
    }

    initializePointCloudWindow() {

        if (WEBGL.isWebGLAvailable() === false) {
            document.body.appendChild(WEBGL.getWebGLErrorMessage());
        }

        this.clock = new Clock();

        // Set up the scene
        this.scene = new Scene();
        this.scene.background = new Color(0x323232);
        this.scene.fog = new Fog(this.scene.background, 3500, 15000);
        let axisHelper = new AxesHelper(1);
        axisHelper.position.set(0, 0, 0);
        this.scenePersistentObjects.push(axisHelper);
        this.scene.add(axisHelper);
        let light = new DirectionalLight(0xffffff, 0.7);
        light.position.set(0, 0, 6).normalize();
        this.scenePersistentObjects.push(light);
        this.scene.add(light);

        this.renderer = new WebGLRenderer({
            "antialias": true,
            "alpha": true,
            "preserveDrawingBuffer": true
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.domElement.addEventListener('resize', () => {
            // update height and top position of helper views
            let imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
            let newHeight = Math.round((window.innerHeight - this.labelToolImage.headerHeight - imagePanelHeight) / 3.0);
            $("#canvasSideView").css("height", newHeight);
            $("#canvasSideView").css("top", this.labelToolImage.headerHeight + imagePanelHeight);
            this.views[1].height = newHeight;
            this.views[1].top = 0;
            $("#canvasFrontView").css("height", newHeight);
            $("#canvasFrontView").css("top", this.labelToolImage.headerHeight + imagePanelHeight + newHeight);
            this.views[2].height = newHeight;
            this.views[2].top = newHeight;
            $("#canvasBev").css("height", newHeight);
            $("#canvasBev").css("top", this.labelToolImage.headerHeight + imagePanelHeight + 2 * newHeight);
            this.views[3].height = newHeight;
            this.views[3].top = 2 * newHeight;

            (<PerspectiveCamera>this.currentCamera).aspect = window.innerWidth / window.innerHeight;
            this.currentCamera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.animate();
        }, false);

        this.renderer.domElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        }, false);

        this.setCamera();
        this.createGrid();

        this.canvas3D = document.getElementById('canvas3d')!;
        if ($("#canvas3d").children().length > 0) {
            $($("#canvas3d").children()[0]).remove();
        }
        this.canvas3D.appendChild(this.renderer.domElement);

        this.projector = new Projector();
        this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, true);
        this.renderer.domElement.removeEventListener('mousedown', this.handleMouseDown, false);
        this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown, true);
        this.renderer.domElement.removeEventListener('mouseup', this.handleMouseUp, false);
        this.renderer.domElement.addEventListener('mouseup', this.handleMouseUp, true);

        this.labelTool.cubeArray = [];
        this.labelTool.spriteArray = [];
        this.annotationObjects.contents = [];
        this.annotationObjects.annotatedWeatherTypes = [];
        for (let i = 0; i < this.labelTool.numFrames; i++) {
            this.labelTool.cubeArray.push([]);
            this.labelTool.spriteArray.push([]);
            this.annotationObjects.contents.push([]);
        }

        if (this.guiBoundingBoxAnnotationsInitialized === false) {
            this.guiBoundingBoxAnnotationsInitialized = true;
            this.initGuiBoundingBoxAnnotations();
        }

        if (this.guiBoundingBoxMenuInitialized === false) {
            this.guiBoundingBoxMenuInitialized = true;
            // 3D BB controls
            this.guiOptions.add(this.parameters, 'download').name("Download Annotations");
            // TODO: enable downloading the annotations video
            // guiOptions.add(parameters, 'download_video').name("Create and Download Video");
            this.guiOptions.add(this.parameters, 'undo').name("Undo");
            this.viewModeController = this.guiOptions.add(this.parameters, 'viewMode', viewModeOptionsArray).name("Select View").onChange((value: ViewModeOption) => {
                this.setView(value);
            });
            this.pointSizeSlider = this.guiOptions.add(this.parameters, 'point_size').name("Point Size").min(0.001).max(this.pointSizeMax).step(0.001).onChange((value: number) => {
                this.pointSizeCurrent = value;
                // @ts-ignore
                this.pointCloudScanMap[this.labelTool.currentFrameIndex].material.size = value;
            });

            let allCheckboxes = $(":checkbox");

            let chooseSequenceDropDownController;
            let currentDatasetDropDownController = this.guiOptions.add(this.labelTool, 'currentDataset', this.labelTool.datasetArray).name("Choose Dataset").listen();

            currentDatasetDropDownController.onChange((value) => {
                this.changeDataset(value);
                chooseSequenceDropDownController = chooseSequenceDropDownController.options(this.labelTool.sequenceArray);
                let allCheckboxes = $(":checkbox");
                // this.hideMasterViews();
            });

            chooseSequenceDropDownController = this.guiOptions.add(this.labelTool, 'currentSequence', this.labelTool.sequenceArray).name("Choose Sequence").listen();
            chooseSequenceDropDownController.onChange((value) => {
                this.changeSequence(value);
                // this.hideMasterViews();
            });


            let showGridCheckbox = this.guiOptions.add(this.parameters, 'show_grid').name('Show Grid').listen();
            showGridCheckbox.onChange((value) => {
                this.showGridFlag = value;
                //let grid = scene.getObjectByName("grid");
                if (this.grid === undefined || this.grid.parent === null) {
                    this.createGrid();
                }
                if (this.showGridFlag === true) {
                    this.grid.visible = true;
                } else {
                    this.grid.visible = false;
                }
            });

            let filterGroundCheckbox = this.guiOptions.add(this.parameters, 'filter_ground').name('Filter Ground').listen();
            filterGroundCheckbox.onChange((value) => {
                this.filterGround = value;
                if (this.filterGround === true) {
                    this.removeObject("pointcloud-scan-" + this.labelTool.currentFrameIndex);
                    this.addObject(this.pointCloudScanNoGroundList[this.labelTool.currentFrameIndex], "pointcloud-scan-no-ground-" + this.labelTool.currentFrameIndex);
                } else {
                    this.removeObject("pointcloud-scan-no-ground-" + this.labelTool.currentFrameIndex);
                    this.addObject(this.pointCloudScanMap[this.labelTool.currentFrameIndex], "pointcloud-scan-" + this.labelTool.currentFrameIndex);
                }
            });

            let hideOtherAnnotationsCheckbox = this.guiOptions.add(this.parameters, 'hide_other_annotations').name('Hide Other Annotations').listen();
            hideOtherAnnotationsCheckbox.onChange((value) => {
                this.hideOtherAnnotations = value;
                let selectionIndex = this.annotationObjects.getSelectionIndex();
                if (this.hideOtherAnnotations === true) {
                    for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
                        // remove 3D labels
                        let mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][i];
                        if (Array.isArray(mesh.material)) {
                            for (let i = 0; i < mesh.material.length; i++) {
                                mesh.material[i].opacity = 0;
                            }
                        } else {
                            mesh.material.opacity = 0;
                        }
                        // remove all 2D labels
                        for (let j = 0; j < this.annotationObjects.contents[this.labelTool.currentFrameIndex][i].channels.length; j++) {
                            let channelObj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][i].channels[j];
                            // remove drawn lines of all 6 channels
                            for (let lineObj in channelObj.lines) {
                                if (channelObj.lines.hasOwnProperty(lineObj)) {
                                    let line = channelObj.lines[lineObj];
                                    if (line !== undefined) {
                                        line.remove();
                                    }
                                }
                            }
                        }
                    }
                    if (selectionIndex !== -1) {
                        // draw selected object in 2D and 3D
                        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);
                    }
                }
                else {
                    for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
                        // show 3D labels
                        let mesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][i];
                        if (Array.isArray(mesh.material)) {
                            for (let i = 0; i < mesh.material.length; i++) {
                                if (i === 0) {
                                    mesh.material[i].opacity = 0.9;
                                } else {
                                    mesh.material[i].opacity = 0.1;
                                }
                            }
                        } else {
                            mesh.material.opacity = 0.9;
                        }
                        // show 2D labels
                        if (selectionIndex === i) {
                            // draw selected object in 2D and 3D
                            this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);
                        } else {
                            if (selectionIndex !== -1) {
                                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, i, false);
                            }
                        }
                    }
                }

            });

            const parameters = {
                selectAllCopyLabelToNextFrame: this.parameters.select_all_copy_label_to_next_frame,
                unselectAllCopyLabelToNextFrame: this.parameters.unselect_all_copy_label_to_next_frame,
                aCallForInference: this.parameters.call_for_inference,
                annotationObjects: this.annotationObjects,
                labelTool: this.labelTool
            }
            this.guiOptions.add(parameters, 'selectAllCopyLabelToNextFrame').name("Select all 'Copy label to next frame'");
            this.guiOptions.add(parameters, 'unselectAllCopyLabelToNextFrame').name("Unselect all 'Copy label to next frame'");

            if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                let interpolationModeCheckbox = this.guiOptions.add(this.parameters, 'interpolation_mode').name('Interpolation Mode');
                interpolationModeCheckbox.domElement.id = 'interpolation-checkbox';
                // if scene contains no objects then deactivate checkbox
                if (FileOperations.annotationFileExist(0, undefined, this.labelTool) === false || this.interpolationMode === false) {
                    // no annotation file exist -> deactivate checkbox
                    this.disableInterpolationModeCheckbox(interpolationModeCheckbox.domElement);
                }

                interpolationModeCheckbox.onChange((value) => {
                    this.interpolationMode = value;
                    if (this.interpolationMode === true) {
                        this.interpolationObjIndexCurrentFile = this.annotationObjects.getSelectionIndex();
                        if (this.interpolationObjIndexCurrentFile !== -1) {
                            // set interpolation start position
                            let obj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile];
                            obj["interpolationStart"]["position"]["x"] = obj["x"];
                            obj["interpolationStart"]["position"]["y"] = obj["y"];
                            obj["interpolationStart"]["position"]["z"] = obj["z"];
                            obj["interpolationStart"]["position"]["rotationYaw"] = obj["rotationYaw"];
                            obj["interpolationStart"]["position"]["rotationPitch"] = obj["rotationPitch"];
                            obj["interpolationStart"]["position"]["rotationRoll"] = obj["rotationRoll"];
                            obj["interpolationStart"]["size"]["width"] = obj["width"];
                            obj["interpolationStart"]["size"]["length"] = obj["length"];
                            obj["interpolationStart"]["size"]["height"] = obj["height"];
                            // short interpolation start index (Interpolation Start Position (frame 400)
                            this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
                            this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
                            this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
                            // set start index
                            this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStartFileIndex"] = this.labelTool.currentFrameIndex;
                        }
                        // check 'copy label to next frame' of selected object
                        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["copyLabelToNextFrame"] = true;
                        let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + this.interpolationObjIndexCurrentFile)!;
                        checkboxElem.firstChild!["checked"] = true;
                        // disable checkbox
                        this.disableCopyLabelToNextFrameCheckbox(checkboxElem);
                    } else {
                        this.disableInterpolationBtn();
                        if (this.interpolationObjIndexCurrentFile !== -1) {
                            this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Position";
                            this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Rotation";
                            this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Size";
                            this.enableStartPose();
                            //[1].__folders[""Interpolation End Position (frame 1)""]
                            for (let i = 0; i < this.folderBoundingBox3DArray.length; i++) {
                                // get all keys of folders object
                                let keys = Object.keys(this.folderBoundingBox3DArray[i].__folders);
                                for (let j = 0; j < keys.length; j++) {
                                    if (Utils.startsWith(keys[j], "Interpolation End")) {
                                        this.folderBoundingBox3DArray[i].removeFolder(keys[j]);
                                    }
                                }
                            }
                            // enable checkbox
                            let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + this.interpolationObjIndexCurrentFile);
                            this.enableCopyLabelToNextFrameCheckbox(checkboxElem);
                        }
                        this.interpolationObjIndexCurrentFile = -1;

                    }
                });
                this.interpolateBtn = this.guiOptions.add(this.parameters, 'interpolate').name("Interpolate");
                this.interpolateBtn.domElement.id = 'interpolate-btn';
                this.disableInterpolationBtn();
            }

            // TODO: proannoV2
            this.inferModeController = this.guiOptions.add(this.parameters, 'inferMode', inferenceOptionsArray).name("Generate Detections");
            const rangeInferFramesBox = this.guiOptions.add(this.parameters, 'rangeInferFrames').name('Range of Frames For Detections:');
            rangeInferFramesBox.domElement.parentElement.parentElement.style.display = 'none';
            this.inferModeController.onChange((inferValue) => {
                if (inferValue === 'Detections In Frame Range'){
                    rangeInferFramesBox.domElement.parentElement.parentElement.style.display = '';
                    rangeInferFramesBox.onChange((rangeVal) => {
                        const startNum = parseInt(rangeVal.split('-')[0], 10);
                        const endNum = parseInt(rangeVal.split('-')[1], 10);
                        if (startNum >= 0 && endNum < this.labelTool.pointCloudFileNames.length){
                            this.detRange['start'] = startNum;
                            this.detRange['end'] = endNum;
                            this.aCallForInference();
                        }
                    });
                }
                else if (inferValue === 'Detections All Frames') {
                    this.detRange['start'] = 0;
                    this.detRange['end'] = this.labelTool.pointCloudFileNames.length - 1;
                    this.aCallForInference();
                }
                else if (inferValue === 'Detections Current Frame') {
                    this.detRange['start'] = this.labelTool.currentFrameIndex;
                    this.detRange['end'] = this.labelTool.currentFrameIndex;
                    this.aCallForInference();
                }
            });

            this.evalModeController = this.guiOptions.add(this.parameters, 'evalMode', evaluationOptionsArray).name('Evaluate Detections');
            const rangeEvalFramesBox = this.guiOptions.add(this.parameters, 'rangeEvalFrames').name('Range of Frames to Evaluate:');
            rangeEvalFramesBox.domElement.parentElement.parentElement.style.display = 'none';
            this.evalModeController.onChange((evalValue) => {
                if (evalValue === 'Evaluate In Frame Range') {
                    rangeEvalFramesBox.domElement.parentElement.parentElement.style.display = '';
                    rangeEvalFramesBox.onChange((rangeValue) => {
                       const startNum = parseInt(rangeValue.split('-')[0], 10);
                       const endNum = parseInt(rangeValue.split('-')[1], 10);
                       if (startNum >= 0 && endNum < this.labelTool.pointCloudFileNames.length ){
                           this.evalRange['start'] = startNum;
                           this.evalRange['end'] = endNum;
                           this.aCallForEvaluation();
                       }
                    });
                }
                else if (evalValue === 'Evaluate All Frames') {
                    this.evalRange['start'] = 0;
                    this.evalRange['end'] = this.labelTool.pointCloudFileNames.length - 1;
                    this.aCallForEvaluation();
                }
                else if (evalValue === 'Evaluate Current Frame') {
                    this.evalRange['start'] = this.labelTool.currentFrameIndex;
                    this.evalRange['end'] = this.labelTool.currentFrameIndex;
                    this.aCallForEvaluation();
                }
                else {
                    rangeEvalFramesBox.domElement.parentElement.parentElement.style.display = 'none';
                    this.aCallForEvaluation();
                }
            });


            this.modeALcontroller = this.guiOptions.add(this.parameters, 'modeAL', activeLearningOptionsArray).name("Active Learning");
            const queryStrategyBox = this.guiOptions.add(this.parameters, 'QueryStrategy', queryStrategyOptions).name('Query Strategy:');
            queryStrategyBox.domElement.parentElement.parentElement.style.display = 'none';

            const numQueryFramesBox = this.guiOptions.add(this.parameters, 'SelectNums').name('Number of Frames to Query:');
            numQueryFramesBox.domElement.parentElement.parentElement.style.display = 'none';

            this.modeALcontroller.onChange((valueAL) => {
                if (valueAL === 'Active Train on Latest Data' ||
                    valueAL === 'Active Train on All Data' ||
                    valueAL === 'Query Data to Label') {
                    queryStrategyBox.domElement.parentElement.parentElement.style.display = '';

                    queryStrategyBox.onChange((queryVal) => {
                        numQueryFramesBox.domElement.parentElement.parentElement.style.display = '';
                        numQueryFramesBox.onChange((selectValue) => {
                            this.parameters.SelectNums = selectValue;
                            if (this.parameters.SelectNums > 0) {
                                this.aCallForActiveLearning();
                            }
                            else {
                                console.error("YOU HAVE TO ENTER THE NUMBER OF FRAMES YOU WANT TO SELECT FROM LABELING NEXT!");
                            }
                        });
                    });
                }
                else if (valueAL === 'Train Model on All Data' ||
                            valueAL === 'Train Model on Latest Data' ||
                            valueAL === 'None') {
                    numQueryFramesBox.domElement.parentElement.parentElement.style.display = 'none';
                    queryStrategyBox.domElement.parentElement.parentElement.style.display = 'none';
                    this.parameters.SelectNums = 0;
                    this.aCallForActiveLearning();
                }
            });


            this.guiOptions.add(this.parameters, 'reset_all').name("Reset all");
            this.guiOptions.add(this.parameters, 'skip_frames').name("Skip frames").onChange((value) => {
                if (value === "") {
                    value = 1;
                } else {
                    value = parseInt(value);
                    if (value < 0) {
                        value = 1;
                    } else if (value > this.labelTool.numFrames) {
                        value = this.labelTool.numFrames - 1;
                    }
                }
                this.parameters.skip_frames = value;
            });

            // set default weather type to cloudy (index 1)
            let chooseWeatherTypeDropDownController = this.guiOptions.add(this.parameters, 'weather_type', this.labelTool.weatherTypes).name("Weather Type").listen();
            chooseWeatherTypeDropDownController.onChange((value) => {
                this.labelTool.setWeatherType(value);
            });

            this.guiOptions.add(this.parameters, 'reset_all').name("Reset all");

            this.guiOptions.domElement.id = 'bounding-box-3d-menu';
            // add download Annotations button
            let downloadAnnotationsItem = $($('#bounding-box-3d-menu ul li')[0]);
            let downloadAnnotationsDivItem = downloadAnnotationsItem.children().first();
            downloadAnnotationsDivItem.wrap("<a href=\"\"></a>");
            this.colorMap = FileOperations.loadColorMap(this.activeColorMap);
            if (this.showProjectedPointsFlag === true) {
                this.labelToolImage.showProjectedPoints(this.pointCloudScanMap[this.labelTool.currentFrameIndex]);
            } else {
                this.labelToolImage.hideProjectedPoints();
            }
        }// end if guiBoundingBoxMenuInitialized

        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[0]).css('background-color', '#525252');
        classPickerElem.css('border-bottom', '0px');
        $('#bounding-box-3d-menu').css('width', '480px');
        $('#bounding-box-3d-menu ul li').css('background-color', '#353535');
        $("#bounding-box-3d-menu .close-button").click(() => {
            this.guiOptionsOpened = !this.guiOptionsOpened;
            if (this.guiOptionsOpened === true) {
                $("#right-btn").css("right", 500);
            } else {
                $("#right-btn").css("right", 0);
            }
        });
        this.guiOptions.open();

        classPickerElem.each((i, item) => {
            let color = this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[i]["annotation_color"];
            let attribute = "20px solid" + ' ' + color;
            $(item).css("border-left", attribute);
            $(item).css('border-bottom', '0px');
        });
        this.initViews();
    }

    loadPointCloudData() {
        // ASCII pcd files
        let pcdLoader = new PCDLoader();
        let pointCloudFullURL: string;
        let pointCloudWithoutGroundURL: string = "";


        // load all point cloud scans in the beginning
        if (this.labelTool.pointCloudLoaded === false) {
            for (let i = 0; i < this.labelTool.numFrames; i++) {
                let data_set = this.labelTool.currentDataset;
                let seq = this.labelTool.currentSequence;
                let lidar = this.labelTool.currentLidarChannel['channel'];
                let file = this.labelTool.pointCloudFileNames[i];
                pointCloudFullURL = `input/${data_set}/${seq}/point_clouds/${lidar}/${file}`;

                pcdLoader.load(pointCloudFullURL, (mesh: Points) => {
                    mesh.name = 'pointcloud-scan-' + i;
                    // @ts-ignore
                    mesh.material.vertexColors = THREE.VertexColors;
                    // @ts-ignore
                    mesh.material.size = Number(this.pointSizeCurrent);
                    let colors = mesh.geometry.getAttribute('color')?.array;
                    if (!colors || colors.length == 0) {
                        colors = Array(mesh.geometry.attributes.position.array.length).fill(255);
                    }

                    mesh.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3, true));

                    this.pointCloudScanMap[i] = mesh;
                    if (i === this.labelTool.currentFrameIndex) {
                        this.scene.add(mesh);
                    }
                });
                if (pointCloudWithoutGroundURL) {
                    pcdLoader.load(pointCloudWithoutGroundURL, (mesh) => {
                        mesh.name = 'pointcloud-scan-no-ground-' + i;
                        this.pointCloudScanNoGroundList.push(mesh);
                    });
                }
            }
        } else {
            let pointCloudScan = this.pointCloudScanMap[this.labelTool.currentFrameIndex];
            // @ts-ignore
            pointCloudScan.material.size = this.pointSizeCurrent;
            this.scene.add(pointCloudScan);
        }
    }

    //draw animation
    animate = () => {
        requestAnimationFrame(this.animate);
        this.update();
        this.updateControls();
        this.render();
    }

    hideMasterViews() {
        $("#canvasSideView").hide();
        $("#canvasFrontView").hide();
        $("#canvasBev").hide();
    }

    render() {
        // render main window
        let mainView = this.views[0];
        this.renderer.setViewport(mainView.left, mainView.top, mainView.width, mainView.height);
        this.renderer.setScissor(mainView.left, mainView.top, mainView.width, mainView.height);
        this.renderer.setScissorTest(true);
        this.renderer.setClearColor(mainView.background);

        (<PerspectiveCamera>this.currentCamera).aspect = mainView.width / mainView.height;
        this.currentCamera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.currentCamera);

        if (this.selectedMesh !== undefined) {
            for (let i = 1; i < this.views.length; i++) {
                let view = this.views[i];
                let camera = view.camera;
                view.updateCamera(camera, this.scene, this.selectedMesh.position);
                this.renderer.setViewport(view.left, view.top, view.width, view.height);
                this.renderer.setScissor(view.left, view.top, view.width, view.height);
                this.renderer.setScissorTest(true);
                this.renderer.setClearColor(view.background);
                camera.aspect = view.width / view.height;
                camera.updateProjectionMatrix();
                this.renderer.render(this.scene, camera);
            }
        }

        if (this.labelTool.cubeArray !== undefined && this.labelTool.cubeArray.length > 0 && this.labelTool.cubeArray[this.labelTool.currentFrameIndex] !== undefined && this.labelTool.cubeArray[this.labelTool.currentFrameIndex].length > 0
            && this.labelTool.spriteArray !== undefined && this.labelTool.spriteArray.length > 0 && this.labelTool.spriteArray[this.labelTool.currentFrameIndex] !== undefined && this.labelTool.spriteArray[this.labelTool.currentFrameIndex].length > 0) {
            this.updateAnnotationOpacity();
            // TODO: temp commented out because of mousedown
            this.updateScreenPosition();
        }
    }

    //set camera type
    setCamera() {
        if (this.birdsEyeViewFlag === false) {
            this.setPerspectiveView();
        } else {
            this.setOrthographicView();
        }
    }

    initViews() {

        let viewHeight;
        viewHeight = Math.round((window.innerHeight - this.labelToolImage.canvasArray[0].scrollHeight) / 3);

        this.views = [
            // main view
            {
                name: "main",
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                background: new THREE.Color(1, 1, 1),
                up: [0, 1, 0],
                fov: 70
            },
            // side view
            {
                name: "side",
                left: 0,
                top: 0,
                width: window.innerWidth / 3,
                height: viewHeight,
                background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
                up: [-1, 0, 0],
                fov: 70,
                updateCamera: function (camera, scene, objectPosition) {
                    camera.position.set(objectPosition.x + 10, objectPosition.y, objectPosition.z);
                    camera.lookAt(objectPosition);
                }
            },
            // front view
            {
                name: "front",
                left: 0,
                top: viewHeight,
                width: window.innerWidth / 3,
                height: viewHeight,
                background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
                up: [0, -1, 0],
                fov: 70,
                updateCamera: function (camera, scene, objectPosition) {
                    camera.position.set(objectPosition.x, objectPosition.y + 10, objectPosition.z);
                    camera.lookAt(objectPosition);
                }
            },
            // bev view
            {
                name: "bev",
                left: 0,
                top: 2 * viewHeight,
                width: window.innerWidth / 3,
                height: viewHeight,
                background: new THREE.Color(22 / 256.0, 22 / 256.0, 22 / 256.0),
                up: [0, 0, 0],
                fov: 70,
                updateCamera: function (camera, scene, objectPosition) {
                    camera.position.set(objectPosition.x, objectPosition.y, objectPosition.z + 10);
                    camera.lookAt(objectPosition);
                }
            }
            ];

        $("#canvasSideView").css("height", viewHeight);
        $("#canvasSideView").css("top", this.labelToolImage.canvasArray[0].scrollHeight);
        $("#canvasFrontView").css("height", viewHeight);
        $("#canvasFrontView").css("top", this.labelToolImage.canvasArray[0].scrollHeight + viewHeight);
        $("#canvasBev").css("height", viewHeight);
        $("#canvasBev").css("top", this.labelToolImage.canvasArray[0].scrollHeight + 2 * viewHeight);

        let mainView = this.views[0];
        let mainCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        mainCamera.position.set(1000, 1000, 1000);//default
        mainCamera.up.fromArray(mainView.up);
        mainView.camera = mainCamera;

        for (let i = 1; i < this.views.length; i++) {
            let view = this.views[i];
            let top = 4;
            let bottom = -4;
            let aspectRatio = view.width / view.height;
            let left = bottom * aspectRatio;
            let right = top * aspectRatio;
            let camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.001, 2000);
            camera.position.set(0, 0, 0);//default
            camera.up.fromArray(view.up);
            view.camera = camera;
        }

    }

    initBev() {
        this.canvasBEV = document.createElement("canvas");
        this.canvasBEV.id = "canvasBev";

        let widthBev = window.innerWidth / 3;
        let heightBev = (window.innerHeight - this.labelToolImage.canvasArray[0].scrollHeight) / 3;

        this.canvasBEV.width = widthBev;
        this.canvasBEV.height = heightBev;

        $("body").append(this.canvasBEV);
        $("#canvasBev").css({
            top: this.labelToolImage.canvasArray[0].scrollHeight + 2 * heightBev +'px',
            position: "absolute"
        });

        this.cameraBEV = new OrthographicCamera(
            window.innerWidth / -4,
            window.innerWidth / 4,
            window.innerHeight / 4,
            window.innerHeight / -4,
            -5000,
            10000);

        this.cameraBEV.up = new Vector3(0, 0, 0);
        this.cameraBEV.lookAt(new Vector3(0, -1, 0));
        this.scene.add(this.cameraBEV);

    }

    updateBEV(xPos: number, yPos: number, zPos: number) {
        this.cameraBEV.position.set(xPos, yPos, zPos + 100);
        this.cameraBEV.lookAt(xPos, yPos, zPos);
    }

    showBEV(xPos: number, yPos: number, zPos: number) {
        if ($("#canvasBev").length === 0) {
            this.initBev();
        }
        this.updateBEV(xPos, yPos, zPos);
        $("#canvasBev").show();
    }

    initFrontView() {
        this.canvasFrontView = document.createElement("canvas");
        this.canvasFrontView.id = "canvasFrontView";

        const widthFrontView = window.innerWidth / 3;
        let heightFrontView = (window.innerHeight - this.labelToolImage.canvasArray[0].scrollHeight) / 3;

        this.canvasFrontView.width = widthFrontView;
        this.canvasFrontView.height = heightFrontView;

        $("body").append(this.canvasFrontView);
        $("#canvasFrontView").css({
            top: this.labelToolImage.canvasArray[0].scrollHeight + heightFrontView + "px",
            position: "absolute"
        });

        this.cameraFrontView = new OrthographicCamera(
            window.innerWidth / -4,
            window.innerWidth / 4,
            window.innerHeight / 4,
            window.innerHeight / -4,
            -5000,
            10000);

        this.cameraFrontView.lookAt(new Vector3(0, 0, -1));
        this.scene.add(this.cameraFrontView);

        // TODO: enable adjusting bounding box z-position in front view
        // this.canvasFrontView = document.getElementById('canvasFrontView') as HTMLCanvasElement;
    }

    showFrontView() {
        if ($("#canvasFrontView").length === 0) {
            this.initFrontView();
        }
        $("#canvasFrontView").show();
    }

    initSideView() {
        this.canvasSideView = document.createElement("canvas");
        this.canvasSideView.id = "canvasSideView";

        let widthSideView = window.innerWidth / 3;
        let heightSideView;
        heightSideView = (window.innerHeight - this.labelToolImage.canvasArray[0].scrollHeight) / 3;

        this.canvasSideView.width = widthSideView;
        this.canvasSideView.height = heightSideView;

        $("body").append(this.canvasSideView);
        $("#canvasSideView").css({
            top: this.labelToolImage.canvasArray[0].scrollHeight + 'px',
            position: 'absolute'});

        this.cameraSideView = new OrthographicCamera(
            window.innerWidth / -4,
            window.innerWidth / 4,
            window.innerHeight / 4,
            window.innerHeight / -4,
            -5000,
            10000);

        this.cameraSideView.lookAt(new Vector3(1, 0, 0));
        this.scene.add(this.cameraSideView);

        // TODO: enable adjusting bounding box z-position in side view

        // this.canvasSideView = document.getElementById('canvasSideView') as HTMLCanvasElement;
    }

    showSideView() {
        if ($("#canvasSideView").length === 0) {
            this.initSideView();
        }
        $("#canvasSideView").show();
    }

    showHelperViews(xPos: number, yPos: number, zPos: number) {
        this.showSideView();
        this.showFrontView();
        this.showBEV(xPos, yPos, zPos);//width along x-axis (lateral), height along y axis (longitudinal)
        // move class picker to right
        $("#class-picker").css("left", window.innerWidth / 3 + 10);
    }

    setView(value: ViewModeOption) {
        if (viewModeOptionsArray.indexOf(value) == -1) {
            console.error(`No such view mode: ${value}`);
            return;
        }
        if (this.transformControls !== undefined) {
            this.selectedMesh = undefined;
            this.transformControls.detach();
            this.transformControls = undefined;
            this.hideMasterViews();
        }
        if (value === 'orthographic') {
            this.birdsEyeViewFlag = true;
            this.setOrthographicView();
        }
        else {
            this.birdsEyeViewFlag = false;
            this.enablePointSizeSlider();
            this.setPerspectiveView();
        }

        this.removeObject("planeObject");
        this.scene.add(this.pointCloudScanMap[this.labelTool.currentFrameIndex]);
        this.selectedViewModeIndex = viewModeOptionsArray.indexOf(value);
    }

    setPerspectiveView() {
        // 3D mode (perspective mode)
        this.currentCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.currentCamera.position.set(0, 0, 5);
        this.currentCamera.up.set(0, 0, 1);

        if (this.transformControls !== undefined) {
            if (this.selectedMesh !== undefined) {
                this.addTransformControls();
                this.transformControls.size = 2;
                this.transformControls.showZ = true;
            } else {
                this.removeTransformControls();
            }
        }
        this.setOrbitControls(true);
    }

    setOrthographicView() {
        if (this.transformControls !== undefined) {
            this.transformControls.showZ = false;
        }

        this.currentCamera = new OrthographicCamera(-40, 40, 20, -20, 0.0001, 2000);
        this.currentCamera.position.set(0, 0, 5);
        this.currentCamera.up.set(0, 0, 1);

        this.removePointerLock();
        this.setOrbitControls(false);
    }

    onChangeHandler = (event: THREE.Event) => {
        this.useTransformControls = true;
        // update 2d bounding box
        if (this.dragControls === true) {
            if (this.selectedMesh !== undefined) {
                this.updateObjectPosition();
                let objectIndexByTrackId = this.annotationObjects.getObjectIndexByName(this.selectedMesh.name);
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, objectIndexByTrackId, true);
            }
        }
        this.render();
    }

    onDraggingChangedHandler = (event: THREE.Event) => {
        this.useTransformControls = true;
        this.dragControls = true;
        // update 2d bounding box
        if (this.selectedMesh !== undefined) {
            this.updateObjectPosition();
            let objectIndexByTrackId = this.annotationObjects.getObjectIndexByName(this.selectedMesh.name);
            this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, objectIndexByTrackId, true);
            this.render();
        }
        // executed after drag finished
        // TODO: scale only on one side using arrows
        if (this.transformControls && this.transformControls.getMode() === "scale") {
            //this.selectedMesh.translateY(this.selectedMesh.geometry.parameters.height / 2)
        }
    }

    addTransformControls() {
        if (!this.selectedMesh) {
            throw Error('Adding transform controls while mesh not selected')
        }
        if (this.transformControls === undefined) {
            this.transformControls = new TransformControls(this.currentCamera, this.renderer.domElement);
            this.transformControls.name = "transformControls";
        } else {
            if (this.transformControls.object !== this.selectedMesh) {
                this.transformControls.detach();
            } else {
                // transform controls are already defined and attached to selected object
                return;
            }
        }
        this.transformControls.removeEventListener('change', this.onChangeHandler);
        this.transformControls.addEventListener('change', this.onChangeHandler);
        this.transformControls.removeEventListener('dragging-changed', this.onDraggingChangedHandler);
        this.transformControls.addEventListener('dragging-changed', this.onDraggingChangedHandler);
        this.transformControls.attach(this.selectedMesh);

        this.removeTransformControls();
        this.scene.add(this.transformControls);
    }

    removeTransformControls() {
        this.removeObject("transformControls");
    }

    addObject(sceneObject: Object3D, name: string) {
        sceneObject.name = name;
        // search whether object already exist
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            let obj = this.scene.children[i];
            if (obj.name === name) {
                return;
            }
        }
        this.scene.add(sceneObject);
    }

    deleteObject(labelIndex: number, fileIndex: number = this.labelTool.currentFrameIndex, undo: boolean = false) {

        const box = this.annotationObjects.contents[fileIndex][labelIndex];
        if (!undo) {
            this.operationStack.push({
                type: 'delete',
                position: this.annotationObjects.position(box),
                rotation: this.annotationObjects.rotation(box),
                scale: this.annotationObjects.scale(box),
                trackId: box.trackId,
                objectIndex: labelIndex,
                objectClass: box.class,
                fileIndex: fileIndex
            });
        }

        if (this.guiOptions.__folders[box.class + ' ' + box.trackId]) {
            this.guiOptions.removeFolder(box.class + ' ' + box.trackId);
        }

        // hide 3D bounding box instead of removing it (in case redo button will be pressed)
        if (this.transformControls !== undefined) {
            this.transformControls.detach();
        }

        this.removeTransformControls();
        // NOTE: already removed in this.annotationObjects.remove()
        let channels = this.annotationObjects.contents[fileIndex][labelIndex].channels;
        // iterate all channels and remove projection
        for (let channelIdx in channels) {
            if (channels.hasOwnProperty(channelIdx)) {
                let channelObj = channels[channelIdx];
                for (let lineObj in channelObj.lines) {
                    if (channelObj.lines.hasOwnProperty(lineObj)) {
                        let line = channelObj.lines[lineObj];
                        if (line !== undefined) {
                            line.remove();
                        }
                    }
                }
            }
        }

        this.annotationObjects.remove(labelIndex, fileIndex);
        this.folderBoundingBox3DArray.splice(labelIndex, 1);
        this.folderPositionArray.splice(labelIndex, 1);
        this.folderRotationArray.splice(labelIndex, 1);
        this.folderSizeArray.splice(labelIndex, 1);
        this.folderAttributeArray.splice(labelIndex, 1);
        this.controllerGUIArray.splice(labelIndex, 1);
        this.annotationObjects.selectEmpty();
        this.labelTool.spriteArray[fileIndex].splice(labelIndex, 1);
        this.removeObject("sprite-" + box.class + "-" + box.trackId);
        // NOTE: already removed in this.annotationObjects.remove()
        // remove sprite from DOM tree
        $("#tooltip-" + box.class + "-" + box.trackId).remove();

        if (fileIndex === this.labelTool.currentFrameIndex) {
            this.selectedMesh = undefined;
            // if last object in current frame was deleted than disable interpolation mode
            if (this.annotationObjects.contents[fileIndex].length === 0 && this.labelTool.frameAnnotationType === "continuous_sequence") {
                this.interpolationMode = false;
                $("#interpolation-checkbox").children().first().prop("checked", false);
                $("#interpolation-checkbox").children().first().removeAttr("checked");
            }
            //rename all ids following after insertIndexof
            // e.g. rename copy-label-to-next-frame-checkbox-1 to copy-label-to-next-frame-checkbox-0 if deleting first element
            const copyIdList = document.querySelectorAll('[id^="copy-label-to-next-frame-checkbox-"]'); // e.g. 0,1
            for (let i = labelIndex; i < this.annotationObjects.contents[fileIndex].length; i++) {
                const idToChange = copyIdList[i].id;
                const elem = document.getElementById(idToChange);
                elem!.id = "copy-label-to-next-frame-checkbox-" + (i);
            }
            // hide master view
            $("#canvasBev").hide();
            $("#canvasSideView").hide();
            $("#canvasFrontView").hide();
            // move class picker to left
            $("#class-picker").css("left", 10);
            this.annotationObjects.__selectionIndexCurrentFrame = -1;
        }
    }

    isFullscreen() {
        return Math.round(window.innerHeight * window.devicePixelRatio) === screen.height;
    }

    createGrid() {
        this.removeObject("grid");

        this.grid = new GridHelper(this.gridSize, this.gridSize);

        let posZGrid: number;
        let translationX: number;
        posZGrid = this.labelTool.positionLidar[2];
        translationX = this.gridSize / 2;

        this.grid.translateZ(-posZGrid);
        this.grid.translateX(translationX);
        this.grid.rotateX(Math.PI / 2);
        this.grid.name = "grid";
        if (this.showGridFlag === true) {
            this.grid.visible = true;
        } else {
            this.grid.visible = false;
        }
        this.scene.add(this.grid);
        this.scenePersistentObjects.push(this.grid);
    }

    initGuiBoundingBoxAnnotations() {
        let parametersBoundingBox = {};
        for (let i = 0; i < this.labelTool.classes.length; i++) {
            parametersBoundingBox[this.labelTool.classes[i].name] = () => {
                this.annotationClasses.select(i);
            }
        }

        let guiAnnotationClassesWidth;
        guiAnnotationClassesWidth = 130;
        this.guiAnnotationClasses = new dat.GUI({autoPlace: true, width: guiAnnotationClassesWidth, resizable: false});

        let guiBoundingBoxAnnotationMap = {};
        for (let i = 0; i < this.labelTool.classes.length; i++) {
            guiBoundingBoxAnnotationMap[this.labelTool.classes[i].name] = this.guiAnnotationClasses.add(parametersBoundingBox, this.labelTool.classes[i].name).name(this.labelTool.classes[i].name);
        }
        this.guiAnnotationClasses.domElement.id = 'class-picker';
    }

    addBoundingBoxGui(bbox: AnnotationObjectParams, bboxEndParams, insertIndex: number) {
        const folderInsertIdx = this.folderBoundingBox3DArray.length;
        let bb;
        if (this.guiOptions.__folders[bbox.class + ' ' + bbox.trackId] === undefined) {
            bb = this.guiOptions.addFolder(bbox.class + ' ' + bbox.trackId);
        } else {
            bb = this.guiOptions.__folders[bbox.class + ' ' + bbox.trackId];
        }

        this.folderBoundingBox3DArray.push(bb);

        let minXPos = -500;
        let maxXPos = 1000;
        let minYPos = -150;
        let maxYPos = 150;

        let minZPos;
        let maxZPos;

        minZPos = -10;
        maxZPos = 10;

        const bboxFolders = this.folderBoundingBox3DArray[folderInsertIdx];
        let folderPosition = bboxFolders.__folders['Position'] ?? bboxFolders.addFolder('Position');
        let cubeX = folderPosition.add(bbox, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
        let cubeY = folderPosition.add(bbox, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
        let cubeZ = folderPosition.add(bbox, 'z').name("z").min(minZPos).max(maxZPos).step(0.01).listen();
        folderPosition.close();
        this.folderPositionArray.push(folderPosition);

        let folderRotation = bboxFolders.__folders['Rotation'] ?? bboxFolders.addFolder('Rotation');
        let cubeYaw = folderRotation.add(bbox, 'rotationYaw').name("rotationYaw").min(-Math.PI).max(Math.PI).step(0.01).listen();
        let cubePitch = folderRotation.add(bbox, 'rotationPitch').name("rotationPitch").min(-Math.PI).max(Math.PI).step(0.01).listen();
        let cubeRoll = folderRotation.add(bbox, 'rotationRoll').name("rotationRoll").min(-Math.PI).max(Math.PI).step(0.01).listen();

        folderRotation.close();
        this.folderRotationArray.push(folderRotation);

        let folderSize = bboxFolders.__folders['Size'] ?? bboxFolders.addFolder('Size');
        let cubeLength = folderSize.add(bbox, 'length').name("length").min(0.3).max(20).step(0.01).listen();
        let cubeWidth = folderSize.add(bbox, 'width').name("width").min(0.3).max(5).step(0.01).listen();
        let cubeHeight = folderSize.add(bbox, 'height').name("height").min(0.3).max(5).step(0.01).listen();
        folderSize.close();
        this.folderSizeArray.push(folderSize);

        let objectClassIdx = this.annotationClasses.getIndexByObjectClass(bbox.class);
        if (objectClassIdx !== -1 && this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[objectClassIdx]["attributes"] !== undefined) {
            const folderAttributes: dat.dat.GUI = bboxFolders.__folders['Attributes'] ?? bboxFolders.addFolder('Attributes');
            // get attributes and properties for this object class
            let attributesConfig = this.labelTool.config.datasets[this.labelTool.datasetArray.indexOf(this.labelTool.currentDataset)].classes[objectClassIdx]["attributes"];
            const attributesGUI: dat.Controller[] = this.createControllers(attributesConfig, folderAttributes, insertIndex, bbox);
            folderAttributes.close();
            this.folderAttributeArray.push(folderAttributes);
            this.controllerGUIArray.push(attributesGUI);
        }

        cubeX.onChange((value: number) => {
            if (value >= minXPos && value < maxXPos) {
                // Note: Do not use insertIndex because it might change (if deleting e.g. an object in between)
                // use track id and class to calculate selection index
                // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
                let selectionIndex = this.annotationObjects.getSelectionIndex();
                if (selectionIndex !== -1) {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].position.x = value;
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["x"] = value;
                    // update bounding box
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);

                } else {
                    console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
                }
            }
        });

        cubeY.onChange((value: number) => {
            if (value >= minYPos && value < maxYPos) {
                // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
                let selectionIndex = this.annotationObjects.getSelectionIndex();
                if (selectionIndex !== -1) {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].position.y = value;
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["y"] = value;
                    // update bounding box
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);
                } else {
                    console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
                }
            }
        });

        cubeZ.onChange((value: number) => {
            if (value >= minZPos && value < maxZPos) {
                // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
                let selectionIndex = this.annotationObjects.getSelectionIndex();
                if (selectionIndex !== -1) {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].position.z = value;
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["z"] = value;
                    // update bounding box
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);
                }
                else {
                    console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
                }
            }
        });

        cubeYaw.onChange((value: number) => {
            // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
            let selectionIndex = this.annotationObjects.getSelectionIndex();
            if (selectionIndex !== -1) {
                this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].rotation.z = value;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["rotationYaw"] = value;

                // update bounding box
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);

            } else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        cubePitch.onChange((value: number) => {
            // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
            let selectionIndex = this.annotationObjects.getSelectionIndex();

            if (selectionIndex !== -1) {

                if (this.labelTool.rotationConvention == "standard") {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].rotation.y = value;
                }
                else if (this.labelTool.rotationConvention == "naval") {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].rotation.x = value;
                }

                this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["rotationPitch"] = value;
                // update bounding box
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);
            }
            else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        cubeRoll.onChange((value: number) => {
            // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, this.labelTool.currentFrameIndex);
            let selectionIndex = this.annotationObjects.getSelectionIndex();
            if (selectionIndex !== -1) {

                if (this.labelTool.rotationConvention == "standard") {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].rotation.x = value;
                }
                else if (this.labelTool.rotationConvention == "naval") {
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][selectionIndex].rotation.y = value;
                }

                this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIndex]["rotationRoll"] = value;
                // update bounding box
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndex, true);

            }
            else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        cubeLength.onChange((value: number) => {
            if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                // update box in all frames of the sequence
                for (let frameIndex = 0; frameIndex < this.labelTool.numFrames; frameIndex++) {
                    let objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, frameIndex);
                    if (objectIndex === -1) {
                        continue;
                    }
                    // this.updateCubeLength(bbox, i, value);
                    let newXPos = this.labelTool.cubeArray[frameIndex][objectIndex].position.x + (value - this.labelTool.cubeArray[frameIndex][objectIndex].scale.x) * Math.cos(this.labelTool.cubeArray[frameIndex][objectIndex].rotation.z) / 2;
                    this.labelTool.cubeArray[frameIndex][objectIndex].position.x = newXPos;
                    bbox.x = newXPos;
                    this.annotationObjects.contents[frameIndex][objectIndex]["x"] = newXPos;
                    let newYPos = this.labelTool.cubeArray[frameIndex][objectIndex].position.y + (value - this.labelTool.cubeArray[frameIndex][objectIndex].scale.x) * Math.sin(this.labelTool.cubeArray[frameIndex][objectIndex].rotation.z) / 2;
                    this.labelTool.cubeArray[frameIndex][objectIndex].position.y = newYPos;
                    bbox.y = newYPos;
                    this.annotationObjects.contents[frameIndex][objectIndex]["y"] = newYPos;
                    this.labelTool.cubeArray[frameIndex][objectIndex].scale.x = value;
                    this.annotationObjects.contents[frameIndex][objectIndex]["length"] = value;
                }
            } else {
                this.updateCubeLength(bbox, this.labelTool.currentFrameIndex, value);
            }
            // let selectionIndexCurrentFrame = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFrameIndex);
            let selectionIndexCurrentFrame = this.annotationObjects.getSelectionIndex();
            if (selectionIndexCurrentFrame !== -1) {
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndexCurrentFrame, true);
            } else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        cubeWidth.onChange((value: number) => {
            if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                // update box in all frames of the sequence
                for (let frameIndex = 0; frameIndex < this.labelTool.numFrames; frameIndex++) {
                    let objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, frameIndex);
                    if (objectIndex === -1) {
                        continue;
                    }
                    let newXPos = this.labelTool.cubeArray[frameIndex][objectIndex].position.x + (value - this.labelTool.cubeArray[frameIndex][objectIndex].scale.y) * Math.sin(this.labelTool.cubeArray[frameIndex][objectIndex].rotation.z) / 2;
                    this.labelTool.cubeArray[frameIndex][objectIndex].position.x = newXPos;
                    bbox.x = newXPos;
                    this.annotationObjects.contents[frameIndex][objectIndex]["x"] = newXPos;
                    let newYPos = this.labelTool.cubeArray[frameIndex][objectIndex].position.y - (value - this.labelTool.cubeArray[frameIndex][objectIndex].scale.y) * Math.cos(this.labelTool.cubeArray[frameIndex][objectIndex].rotation.z) / 2;
                    this.labelTool.cubeArray[frameIndex][objectIndex].position.y = newYPos;
                    bbox.y = newYPos;
                    this.annotationObjects.contents[frameIndex][objectIndex]["y"] = newYPos;
                    this.labelTool.cubeArray[frameIndex][objectIndex].scale.y = value;
                    this.annotationObjects.contents[frameIndex][objectIndex]["width"] = value;
                }
            } else {
                this.updateCubeWidth(bbox, this.labelTool.currentFrameIndex, value);
            }
            // let selectionIndexCurrentFrame = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFrameIndex);
            let selectionIndexCurrentFrame = this.annotationObjects.getSelectionIndex();
            if (selectionIndexCurrentFrame !== -1) {
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndexCurrentFrame, true);
            } else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        cubeHeight.onChange((value: number) => {
            if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                for (let frameIndex = 0; frameIndex < this.labelTool.numFrames; frameIndex++) {
                    // this.updateCubeHeight(bbox, i, value);
                    let objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, frameIndex);
                    if (objectIndex === -1) {
                        continue;
                    }
                    const newZPos = this.labelTool.cubeArray[frameIndex][objectIndex].position.z + (value - this.labelTool.cubeArray[frameIndex][objectIndex].scale.z) / 2;
                    this.labelTool.cubeArray[frameIndex][objectIndex].scale.z = value;
                    this.labelTool.cubeArray[frameIndex][objectIndex].position.z = newZPos;
                    this.annotationObjects.contents[frameIndex][objectIndex]["height"] = value;
                }
            } else {
                this.updateCubeHeight(bbox, this.labelTool.currentFrameIndex, value);
            }
            // let selectionIndexCurrentFrame = getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, labelTool.currentFrameIndex);
            let selectionIndexCurrentFrame = this.annotationObjects.getSelectionIndex();

            if (selectionIndexCurrentFrame !== -1) {
                this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, selectionIndexCurrentFrame, true);
            }
            else {
                console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
            }
        });

        if (bboxEndParams !== undefined && this.interpolationMode === true && this.labelTool.frameAnnotationType === "continuous_sequence") {
            //interpolationObjIndexCurrentFile = this.annotationObjects.getSelectionIndex();
            this.interpolationObjIndexNextFile = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["trackId"], this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["class"], bboxEndParams.newFileIndex);
            // change text
            let interpolationStartFileIndex = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
            this.folderPositionArray[this.interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + interpolationStartFileIndex + ")";
            this.folderRotationArray[this.interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + interpolationStartFileIndex + ")";
            this.folderSizeArray[this.interpolationObjIndexNextFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + interpolationStartFileIndex + ")";

            if (interpolationStartFileIndex !== bboxEndParams.newFileIndex) {
                this.disableStartPose();
                // add folders for end position and end size
                this.folderEndPosition = this.folderBoundingBox3DArray[this.interpolationObjIndexNextFile].addFolder("Interpolation End Position (frame " + (this.labelTool.currentFrameIndex + 1) + ")");
                let cubeEndX = this.folderEndPosition.add(bboxEndParams, 'x').name("x").min(minXPos).max(maxXPos).step(0.01).listen();
                let cubeEndY = this.folderEndPosition.add(bboxEndParams, 'y').name("y").min(minYPos).max(maxYPos).step(0.01).listen();
                let cubeEndZ = this.folderEndPosition.add(bboxEndParams, 'z').name("z)").min(minZPos).max(maxZPos).step(0.01).listen();
                let cubeEndYaw = this.folderEndPosition.add(bboxEndParams, 'rotationYaw').name("rotationYaw").min(-Math.PI).max(Math.PI).step(0.01).listen();
                let cubeEndPitch = this.folderEndPosition.add(bboxEndParams, 'rotationPitch').name("rotationPitch").min(-Math.PI).max(Math.PI).step(0.01).listen();
                let cubeEndRoll = this.folderEndPosition.add(bboxEndParams, 'rotationRoll').name("rotationRoll").min(-Math.PI).max(Math.PI).step(0.01).listen();
                this.folderEndPosition.domElement.id = 'interpolation-end-position-folder';
                this.folderEndPosition.open();
                this.folderEndSize = this.folderBoundingBox3DArray[this.interpolationObjIndexNextFile].addFolder("Interpolation End Size (frame " + (this.labelTool.currentFrameIndex + 1) + ")");
                let cubeEndWidth = this.folderEndSize.add(bboxEndParams, 'width').name("width").min(0.3).max(20).step(0.01).listen();
                let cubeEndLength = this.folderEndSize.add(bboxEndParams, 'length').name("length").min(0.3).max(20).step(0.01).listen();
                let cubeEndHeight = this.folderEndSize.add(bboxEndParams, 'height').name("height").min(0.3).max(20).step(0.01).listen();
                this.folderEndPosition.domElement.id = 'interpolation-end-size-folder';
                this.folderEndSize.open();
                let newFileIndex = bboxEndParams.newFileIndex;

                cubeEndX.onChange((value) => {
                    if (value >= minXPos && value < maxXPos) {
                        this.updateXPos(newFileIndex, value);
                    }
                });
                cubeEndY.onChange((value) => {
                    if (value >= minYPos && value < maxYPos) {
                        this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.y = value;
                        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = value;
                        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["y"] = value;
                        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                    }
                });
                cubeEndZ.onChange((value) => {
                    if (value >= minZPos && value < maxZPos) {
                        this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.z = value;
                        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["z"] = value;
                        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["z"] = value;
                        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                    }
                });
                cubeEndYaw.onChange((value) => {
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].rotation.z = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationYaw"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["rotationYaw"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
                cubeEndPitch.onChange((value) => {
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].rotation.x = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationPitch"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["rotationPitch"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
                cubeEndRoll.onChange((value) => {
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].rotation.y = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["rotationRoll"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["rotationRoll"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
                cubeEndWidth.onChange((value) => {
                    let newXPos = this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.x + (value - this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.x)
                        * Math.cos(this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].rotation.z) / 2;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.x = newXPos;
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile].position.x = newXPos;

                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = newXPos;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["x"] = newXPos;
                    let newYPos = this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.y + (value - this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.x)
                        * Math.sin(this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].rotation.z) / 2;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.y = newYPos;
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile].position.y = newYPos;

                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = newYPos;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["y"] = newYPos;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.x = value;
                    this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile].scale.x = value;

                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["size"]["width"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["width"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
                cubeEndLength.onChange((value) => {
                    let newXPos = this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.x + (value - this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.y) * Math.sin(this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexCurrentFile].rotation.z) / 2;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.x = newXPos;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = newXPos;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["x"] = newXPos;
                    let newYPos = this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.y - (value - this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.y) * Math.cos(this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexCurrentFile].rotation.z) / 2;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.y = newYPos;
                    // test with -newYPos
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["y"] = newYPos;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["y"] = newYPos;

                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.y = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["size"]["length"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["length"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
                cubeEndHeight.onChange((value) => {
                    let newZPos = this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.z + (value - this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.z) / 2;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.z = newZPos;
                    this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].scale.z = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["size"]["height"] = value;
                    this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["height"] = value;
                    this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
                });
            }
        }

        if (this.labelTool.frameAnnotationType === "continuous_sequence") {
            this.textBoxTrackId = this.folderBoundingBox3DArray[folderInsertIdx].add(bbox, 'trackId').name('Track ID');
            this.textBoxTrackId.setValue = (newValue: string, undo: boolean = false) => {
                const prevValue = this.annotationObjects.contents[this.labelTool.currentFrameIndex][folderInsertIdx]["trackId"];
                if (!undo) {
                    this.operationStack.push({
                        type: 'trackID',
                        class: bbox.class,
                        objectIndex: folderInsertIdx,
                        prev: prevValue,
                        cur: newValue
                    });
                }
                this.updateTooltip(bbox.class, prevValue, newValue, bbox);
                this.textBoxTrackId.object[this.textBoxTrackId.property] = newValue;
                if (this.textBoxTrackId.__onChange) {
                    this.textBoxTrackId.__onChange.call(this, newValue);
                }
                this.textBoxTrackId.updateDisplay();
                return this;
            }
            this.textBoxTrackId.onChange((value: string) => {
                this.changeTrackId(bbox.class, folderInsertIdx, value);
            });
        }

        const labelOperations = {
            'copy_label_to_next_frame': bbox.copyLabelToNextFrame,
            setToDefaultSize: () => {
                this.annotationObjects.setToDefaultSize(folderInsertIdx);
            },
            reset: () => {
                this.annotationObjects.resetSingleObject(folderInsertIdx);
            },
            delete: () => {
                let objectIdx = this.annotationObjects.getSelectionIndex();
                if (objectIdx !== -1) {
                    this.deleteObject(objectIdx);
                } else {
                    console.log("Could not find object with track ID " + bbox.trackId + " and class " + bbox.class);
                }
            },
            track: () => this.track(bbox),
            deleteInAllFrames: () => this.deleteInAllFrames(bbox)
        };
        const copyLabelToNextFrameCheckbox = this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'copy_label_to_next_frame').name("Copy label to next frame");

        copyLabelToNextFrameCheckbox.domElement.id = 'copy-label-to-next-frame-checkbox-' + folderInsertIdx;

        // check copy checkbox AND disable it for selected object if in interpolation mode
        if (this.interpolationMode === true && bboxEndParams !== undefined && this.labelTool.frameAnnotationType === "continuous_sequence") {
            copyLabelToNextFrameCheckbox.domElement.firstChild.checked = true;
            this.disableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox.domElement);

        }
        copyLabelToNextFrameCheckbox.onChange((value) => {
            this.annotationObjects.contents[this.labelTool.currentFrameIndex][folderInsertIdx]["copyLabelToNextFrame"] = value;
        });

        this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'setToDefaultSize').name("Set to default size");
        this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'reset').name("Reset");
        this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'delete').name("Delete");
        this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'track').name("Track");
        this.folderBoundingBox3DArray[this.folderBoundingBox3DArray.length - 1].add(labelOperations, 'deleteInAllFrames').name("Delete in all frames");
    }

    changeTrackId(boxClass: string, objectIndex: number, value: string): void {
        // update cube name
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIndex].name = 'cube-' + boxClass.toLowerCase() + "-" + value;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIndex]["trackId"] = value;
        if (this.selectedMesh !== undefined) {
            this.selectedMesh.name = 'cube-' + boxClass.toLowerCase() + "-" + value;
        }
        $("#bounding-box-3d-menu ul").children().eq(objectIndex + this.numGUIOptions).children().first().children().first().children().first().text(boxClass + " " + value);
    }

    deleteInAllFrames(box: AnnotationObjectParams) {
        for (let frameIndex = 0; frameIndex < this.labelTool.numFrames; frameIndex++) {
            const objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(box.trackId, box.class, frameIndex);
            if (objectIndex >= 0) {
                this.deleteObject(objectIndex, frameIndex);
            }
        }
    }

    updateXPos(newFileIndex: number, value: number) {
        this.labelTool.cubeArray[newFileIndex][this.interpolationObjIndexNextFile].position.x = value;
        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["interpolationEnd"]["position"]["x"] = value;
        this.annotationObjects.contents[newFileIndex][this.interpolationObjIndexNextFile]["x"] = value;
        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.interpolationObjIndexCurrentFile, true);
    }

    updateCubeWidth(bbox: AnnotationObjectParams, frameIndex: number, value: number) {
        // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, frameIndex);
        let selectionIndex = this.annotationObjects.getSelectionIndex();
        if (selectionIndex !== -1) {
            let newXPos = this.labelTool.cubeArray[frameIndex][selectionIndex].position.x + (value - this.labelTool.cubeArray[frameIndex][selectionIndex].scale.y) * Math.sin(this.labelTool.cubeArray[frameIndex][selectionIndex].rotation.z) / 2;
            this.labelTool.cubeArray[frameIndex][selectionIndex].position.x = newXPos;
            bbox.x = newXPos;
            this.annotationObjects.contents[frameIndex][selectionIndex]["x"] = newXPos;
            let newYPos = this.labelTool.cubeArray[frameIndex][selectionIndex].position.y - (value - this.labelTool.cubeArray[frameIndex][selectionIndex].scale.y) * Math.cos(this.labelTool.cubeArray[frameIndex][selectionIndex].rotation.z) / 2;
            this.labelTool.cubeArray[frameIndex][selectionIndex].position.y = newYPos;
            bbox.y = newYPos;
            this.annotationObjects.contents[frameIndex][selectionIndex]["y"] = newYPos;
            this.labelTool.cubeArray[frameIndex][selectionIndex].scale.y = value;
            this.annotationObjects.contents[frameIndex][selectionIndex]["width"] = value;
        } else {
            console.log("Could not found object with track ID " + bbox.trackId + " and class " + bbox.class);
        }
    }

    updateCubeLength(bbox: AnnotationObjectParams, frameIndex: number, value: number) {
        let selectionIndex = this.annotationObjects.getSelectionIndex();
        if (selectionIndex !== -1) {
            let newXPos = this.labelTool.cubeArray[frameIndex][selectionIndex].position.x + (value - this.labelTool.cubeArray[frameIndex][selectionIndex].scale.x) * Math.cos(this.labelTool.cubeArray[frameIndex][selectionIndex].rotation.z) / 2;
            this.labelTool.cubeArray[frameIndex][selectionIndex].position.x = newXPos;
            bbox.x = newXPos;
            this.annotationObjects.contents[frameIndex][selectionIndex]["x"] = newXPos;
            let newYPos = this.labelTool.cubeArray[frameIndex][selectionIndex].position.y + (value - this.labelTool.cubeArray[frameIndex][selectionIndex].scale.x) * Math.sin(this.labelTool.cubeArray[frameIndex][selectionIndex].rotation.z) / 2;
            this.labelTool.cubeArray[frameIndex][selectionIndex].position.y = newYPos;
            bbox.y = newYPos;
            this.annotationObjects.contents[frameIndex][selectionIndex]["y"] = newYPos;
            this.labelTool.cubeArray[frameIndex][selectionIndex].scale.x = value;
            this.annotationObjects.contents[frameIndex][selectionIndex]["length"] = value;
        } else {
            console.log("Could not found object with track ID " + bbox.trackId + " and class " + bbox.class);
        }
    }

    updateCubeHeight(bbox: AnnotationObjectParams, i: number, value: number) {
        // let selectionIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(bbox.trackId, bbox.class, i);
        let selectionIndex = this.annotationObjects.getSelectionIndex();
        if (selectionIndex !== -1) {
            const newZPos = this.labelTool.cubeArray[i][selectionIndex].position.z + (value - this.labelTool.cubeArray[i][selectionIndex].scale.z) / 2;
            this.labelTool.cubeArray[i][selectionIndex].scale.z = value;
            this.labelTool.cubeArray[i][selectionIndex].position.z = newZPos;
            this.annotationObjects.contents[i][selectionIndex]["height"] = value;
        } else {
            console.log("Could not found object with track ID " + bbox.trackId + " and class " + bbox.class);
        }
    }

    requestInitFromJson(object: object): RequestInit {
        return {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(object)
        }
    }

    saveAnnotations = async () => {
        const annotationFiles = {
            annotationFiles: getLoader(this.labelTool).createAnnotationFiles(this.labelTool),
            fileNames: this.labelTool.annotationFileNames,
            dataset: this.labelTool.currentDataset,
            lidarChannel: this.labelTool.currentLidarChannel,
            sequence: this.labelTool.currentSequence
        };
        const requestInit: RequestInit = this.requestInitFromJson(annotationFiles);
        const response = await fetch('/save_annotations', requestInit);
        if (!response.ok) {
            throw Error("Response status not OK")
        }
    }

    loadAnnotations() {
        for (let i = 0; i < this.labelTool.annotationFileNames.length; i++) {
            this.labelTool.loadAnnotations(this.labelTool.annotationFileNames[i] , i);
        }
    }

    autoSaveAnnotations = async () => {
        await this.saveAnnotations()
        if (this.saveAnnotationsNow){
            setTimeout(this.autoSaveAnnotations, this.autoSaveInterval);
        }
    }

    downloadAnnotations = () => {
        let annotationFiles = getLoader(this.labelTool).createAnnotationFiles(this.labelTool);
        let zip = new JSZip();
        for (let i = 0; i < annotationFiles.length; i++) {
            zip.file(getLoader(this.labelTool).getFilename(this.labelTool, i), annotationFiles[i]);
        }
        let zipContent = zip.generate();
        $($('#bounding-box-3d-menu ul li')[0]).children().first().attr('href', 'data:application/zip;base64,' + zipContent).attr('download', String(this.labelTool.currentDataset + "_" + this.labelTool.currentSequence + '_annotations.zip'));
    }

    undoOperation(): void {
        if (this.operationStack.empty()) {
            return;
        }
        const op: OperationStackItem = this.operationStack.pop()!;

        // TODO: implement undo operations of all cases
        switch (op.type) {
            case "classLabel":
                this.annotationObjects.changeClass(op.objectIndex, op.prev);
                break;
            case "trackID":
                this.textBoxTrackId.setValue(op.prev, true);
                break;
            case "delete":
                this.addAnnotationObjectFromRect(op.position, op.scale, op.rotation, op.trackId, op.objectIndex, op.objectClass, true);
                break;
            case "position":
                this.annotationObjects.undoObjectPosition(op.objectIndex, op.position);
                break;
            case "scale":
                this.annotationObjects.undoObjectScale(op.objectIndex, op.scale);
                break;
            case "rotation":
                this.annotationObjects.undoObjectRotation(op.objectIndex, op.rotation);
                break;
            case "reset":
                this.annotationObjects.undoResetSingleObject(op.objectIndex, op.boxParams);
                break;
            case "add":
                this.deleteObject(op.objectIndex, this.labelTool.currentFrameIndex, true);
                break;
            case "interpolation":
                break;
            case "changeFrame":
                this.labelTool.changeFrame(op.prev, true);
                break;
        }
    }


    onDocumentMouseMove = (event) => {
        // update the mouse variable
        Utils.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        Utils.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }


    mouseUpLogicLeftClickAtObject() {
        this.showMasterViews = true;
        // open folder of selected object
        // this.annotationObjects.localOnSelect["PCD"](clickedObjectIndex);
        this.openFolder(this.clickedObjectIndex);

        // set selected object
        this.selectedMesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex];
        if (this.selectedMesh !== undefined) {
            for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
                $("#tooltip-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["class"] + "-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["trackId"]).show();
            }
            $("#tooltip-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndex]["class"] + "-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndex]["trackId"]).hide();
            this.addTransformControls();

            if (this.transformControls!.position !== undefined) {
                this.transformControls!.detach();
                this.transformControls!.attach(this.selectedMesh);
            }

            this.transformControls!.size = 2;
        } else {
            this.removeTransformControls();
        }
        this.annotationObjects.select(this.clickedObjectIndex);

        // uncolor previous selected object in image view
        if (this.clickedObjectIndexPrevious !== -1) {
            this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.clickedObjectIndexPrevious, false);
        }
        // select object in cam images
        this.labelToolImage.update2DBoundingBox(this.labelTool.currentFrameIndex, this.clickedObjectIndex, true);

        // move button to right
        $("#left-btn").css("left", window.innerWidth / 3);

        let obj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndex];

        this.showHelperViews(obj["x"], obj["y"], obj["z"]);

        // enable interpolate button if interpolation mode is activated AND selected object is the same as interpolated object
        if (this.labelTool.frameAnnotationType === "continuous_sequence" && this.interpolationMode === true) {
            if (this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndex]["interpolationStartFileIndex"] !== -1 && this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndex]["interpolationStartFileIndex"] !== this.labelTool.currentFrameIndex) {
                this.enableInterpolationBtn();
            } else {
                this.interpolationObjIndexCurrentFile = this.clickedObjectIndex;
                let obj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile];
                this.annotationObjects.updateInterpolationStartParams(obj, this.labelTool.currentFrameIndex);
                this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
                this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
                this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (this.labelTool.currentFrameIndex + 1) + ")";

                if (this.clickedObjectIndexPrevious !== -1) {
                    this.folderPositionArray[this.clickedObjectIndexPrevious].domElement.firstChild.firstChild.innerText = "Position";
                    this.folderSizeArray[this.clickedObjectIndexPrevious].domElement.firstChild.firstChild.innerText = "Size";
                    // remove start position from previous selected object
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndexPrevious]["interpolationStartFileIndex"] = -1;
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.clickedObjectIndexPrevious]["interpolationStart"] = {
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
                    };
                    // enable copy checkbox of prev. object
                    let checkboxElemPrev = document.getElementById("copy-label-to-next-frame-checkbox-" + this.clickedObjectIndexPrevious);
                    this.enableCopyLabelToNextFrameCheckbox(checkboxElemPrev);
                    // disable copy checkbox of current obj
                    let checkboxElemCurrent = document.getElementById("copy-label-to-next-frame-checkbox-" + this.interpolationObjIndexCurrentFile);
                    this.disableCopyLabelToNextFrameCheckbox(checkboxElemCurrent);

                }
            }
        }
        if (this.labelTool.frameAnnotationType === "continuous_sequence") {
            let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
            this.enableInterpolationModeCheckbox(interpolationModeCheckbox);
        }
        // select corresponding class in class menu
        this.setClassPickerClass(obj.class);
    }

    mouseUpLogicLeftClickNoObject() {
        // remove selection in camera view if 2d label exist
        for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
            if (this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["rect"] !== undefined) {
                // removeBoundingBoxHighlight(i);
                this.labelToolImage.removeTextBox(i);
            }
        }

        let selectionIdxCurrentFrame = this.annotationObjects.getSelectionIndex();
        if (selectionIdxCurrentFrame !== -1 && selectionIdxCurrentFrame < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length) {
            let objectClass = this.annotationObjects.contents[this.labelTool.currentFrameIndex][selectionIdxCurrentFrame]["class"];
            // restore color
            this.labelToolImage.changeClassColorImage(selectionIdxCurrentFrame, objectClass);
        }

        // remove selection in birds eye view (lower opacity)
        for (let mesh in this.labelTool.cubeArray[this.labelTool.currentFrameIndex]) {
            let meshObject = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][mesh];
            if (Array.isArray(meshObject.material)) {
                for (let i = 0; i < meshObject.material.length; i++) {
                    if (i === 0) {
                        meshObject.material[i].opacity = 0.9;
                    } else {
                        meshObject.material[i].opacity = 0.1;
                    }
                }
            } else {
                meshObject.material.opacity = 0.9;
            }
        }

        // remove arrows (transform controls)
        if (this.transformControls !== undefined) {
            this.transformControls.detach();
        }
        this.removeTransformControls();
        this.selectedMesh = undefined;
        this.annotationObjects.selectEmpty();

        // disable interpolate button
        if (this.labelTool.frameAnnotationType === "continuous_sequence") {
            this.disableInterpolationBtn();
            let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
            this.disableInterpolationModeCheckbox(interpolationModeCheckbox);
        }

        $("#canvasBev").hide();
        $("#canvasSideView").hide();
        $("#canvasFrontView").hide();
        // move class picker to left
        $("#class-picker").css("left", 10);

        // move button to left
        $("#left-btn").css("left", 0);
    }

    mouseUpLogicLeftClick(clickedObjects: Intersection[], ray: Raycaster) {
        // close folders
        for (let i = 0; i < this.folderBoundingBox3DArray.length; i++) {
            if (this.folderBoundingBox3DArray[i] !== undefined) {
                this.folderBoundingBox3DArray[i].close();
            }
        }

        if (clickedObjects.length > 0 && this.clickedObjectIndex !== -1) {
            this.mouseUpLogicLeftClickAtObject();
        } else {
            this.mouseUpLogicLeftClickNoObject();
        }

        if (this.clickFlag === true) {
            this.clickedPlaneArray = [];
            this.annotationObjects.select(this.clickedObjectIndex);
            this.clickedObjectIndexPrevious = this.annotationObjects.__selectionIndexCurrentFrame;
            this.clickFlag = false;
        }
        else if (this.groundPlaneArray.length === 1 && this.birdsEyeViewFlag === true && this.useTransformControls === false && Key.isCtrlDown()) {

            let groundUpObject = ray.intersectObjects(this.groundPlaneArray);
            if (groundUpObject === undefined || groundUpObject[0] === undefined) {
                return;
            }
            const groundPointMouseUp = groundUpObject[0].point;

            const insertIndex = this.getInsertIndex();
            const trackId = this.getTrackId();
            this.setClickedObjectIndexPrevious();
            const objectClass = this.annotationClasses.getCurrentClass();
            const pos = new Vector3(
                (groundPointMouseUp.x + this.groundPointMouseDown.x) / 2,
                (groundPointMouseUp.y + this.groundPointMouseDown.y) / 2,
                0
            );
            const rot = new Euler(0, 0, 0);
            let scale: Vector3;
            if (Math.abs(groundPointMouseUp.x - this.groundPointMouseDown.x) > 0.1) {
                scale = new Vector3(
                    Math.abs(groundPointMouseUp.x - this.groundPointMouseDown.x),
                    Math.abs(groundPointMouseUp.y - this.groundPointMouseDown.y),
                    (this.labelTool.defaultObjectSizes[objectClass][2]) ?? this.labelTool.defaultObjectSizes.default[2]
                );
            } else if (this.labelTool.defaultObjectSizes[objectClass]?.length === 3) {
                scale = new Vector3(
                    this.labelTool.defaultObjectSizes[objectClass][0],
                    this.labelTool.defaultObjectSizes[objectClass][1],
                    this.labelTool.defaultObjectSizes[objectClass][2],
                );
            } else {
                const d = this.labelTool.defaultObjectSizes.default;
                scale = new Vector3(d[0], d[1], d[2]);
            }
            this.addAnnotationObjectFromRect(pos, scale, rot, trackId, insertIndex, objectClass, false);

            this.groundPlaneArray = [];
        }
    }


    mouseUpLogic(ev: MouseEvent) {
        this.dragControls = false;

        // check if scene contains transform controls
        this.useTransformControls = false;
        for (let i = 0; i < this.scene.children.length; i++) {
            if (this.scene.children[i].name === "transformControls") {
                this.useTransformControls = true;
            }
        }

        let rect = (<Element>ev.target).getBoundingClientRect();
        Mouse.UP.x = ((ev.clientX - rect.left) / Number($("#canvas3d canvas").attr("width"))) * 2 - 1;
        Mouse.UP.y = -((ev.clientY - rect.top) / Number($("#canvas3d canvas").attr("height"))) * 2 + 1;

        const ray = this.createRaycaster(Mouse.UP);
        let clickedObjects: Intersection[];

        if (this.birdsEyeViewFlag === true) {
            clickedObjects = ray.intersectObjects(this.clickedPlaneArray);
        } else {
            clickedObjects = ray.intersectObjects(this.labelTool.cubeArray[this.labelTool.currentFrameIndex]);
        }

        if (ev.button === 0) {
            this.mouseUpLogicLeftClick(clickedObjects, ray);
        }
    }


    handleMouseUp = (ev: MouseEvent) => {
        if (this.mouse_mutex.isLocked()) {
            console.info('Do not handle mouse up event because mouse mutex is locked');
            return;
        }
        this.mouseUpLogic(ev);
    }

    handleMouseDown = (ev: MouseEvent) => {
        if (this.mouse_mutex.isLocked()) {
            console.info('Do not handle mouse down event because mouse mutex is locked');
            return;
        }
        this.mouseDownLogic(ev);
    }

    mouseDownLogic(ev: MouseEvent) {

        let rect = (<Element>ev.target).getBoundingClientRect();
        Mouse.DOWN.x = ((ev.clientX - rect.left) / window.innerWidth) * 2 - 1;
        Mouse.DOWN.y = -((ev.clientY - rect.top) / window.innerHeight) * 2 + 1;
        const ray: Raycaster = this.createRaycaster(Mouse.DOWN);
        const clickedObjects: Intersection[] = ray.intersectObjects(this.labelTool.cubeArray[this.labelTool.currentFrameIndex]);
        let geometry = new PlaneGeometry(2 * this.gridSize, 2 * this.gridSize);
        let material = new MeshBasicMaterial({
            color: 0x000000,
            wireframe: false,
            transparent: true,
            opacity: 0.0,
            side: DoubleSide
        });
        let groundPlane = new Mesh(geometry, material);
        if (clickedObjects.length > 0) {
            if (ev.button === 0) {
                this.clickedObjectIndex = this.labelTool.cubeArray[this.labelTool.currentFrameIndex].indexOf(<Mesh>clickedObjects[0].object);

                this.clickFlag = true;
                this.clickedPoint = clickedObjects[0].point;

                if (this.birdsEyeViewFlag === true) {
                    groundPlane.position.x = this.clickedPoint.x;
                    groundPlane.position.y = this.clickedPoint.y;
                    groundPlane.position.z = -10;//clickedPoint.z;
                    let normal = clickedObjects[0].face!;
                    if ([normal.a, normal.b, normal.c].toString() == [6, 3, 2].toString() || [normal.a, normal.b, normal.c].toString() == [7, 6, 2].toString()) {
                        groundPlane.rotation.x = Math.PI / 2;
                        groundPlane.rotation.y = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [6, 7, 5].toString() || [normal.a, normal.b, normal.c].toString() == [4, 6, 5].toString()) {
                        groundPlane.rotation.x = -Math.PI / 2;
                        groundPlane.rotation.y = -Math.PI / 2 - this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [0, 2, 1].toString() || [normal.a, normal.b, normal.c].toString() == [2, 3, 1].toString()) {
                        groundPlane.rotation.x = Math.PI / 2;
                        groundPlane.rotation.y = Math.PI / 2 + this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [5, 0, 1].toString() || [normal.a, normal.b, normal.c].toString() == [4, 5, 1].toString()) {
                        groundPlane.rotation.x = -Math.PI / 2;
                        groundPlane.rotation.y = -this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex].rotation.z;
                    } else if ([normal.a, normal.b, normal.c].toString() == [3, 6, 4].toString() || [normal.a, normal.b, normal.c].toString() == [1, 3, 4].toString()) {
                        groundPlane.rotation.y = -Math.PI;
                    }
                    groundPlane.name = "planeObject";
                    this.scene.add(groundPlane);
                    this.clickedPlaneArray.push(groundPlane);
                }

            } else if (ev.button === 2 && Key.isCtrlDown()) {
                // rightclick
                this.clickedObjectIndex = this.labelTool.cubeArray[this.labelTool.currentFrameIndex].indexOf(<Mesh>clickedObjects[0].object);
                this.deleteObject(this.clickedObjectIndex);
                // move button to left
                $("#left-btn").css("left", 0);
            }//end right click
        } else {
            for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
                $("#tooltip-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["class"] + "-" + this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["trackId"]).show();
            }
            if (this.birdsEyeViewFlag === true) {
                this.clickedObjectIndex = -1;
                this.groundPlaneArray = [];
                groundPlane.position.x = 0;
                groundPlane.position.y = 0;
                groundPlane.position.z = -10;
                this.groundPlaneArray.push(groundPlane);
                let groundObject = ray.intersectObjects(this.groundPlaneArray);

                if (groundObject !== undefined && groundObject[0] !== undefined) {
                    this.groundPointMouseDown = groundObject[0].point;
                }
            }
        }
    }

    openFolder(selectionIndex) {
        this.clickedPlaneArray = [];
        for (let i = 0; i < this.folderBoundingBox3DArray.length; i++) {
            if (this.folderBoundingBox3DArray[i] !== undefined) {
                this.folderBoundingBox3DArray[i].close();
            }
        }
        if (this.folderBoundingBox3DArray[selectionIndex] !== undefined) {
            this.folderBoundingBox3DArray[selectionIndex].open();
        }
        if (this.folderPositionArray[selectionIndex] !== undefined) {
            this.folderPositionArray[selectionIndex].open();
        }
        if (this.folderRotationArray[selectionIndex] !== undefined) {
            this.folderRotationArray[selectionIndex].open();
        }
        if (this.folderSizeArray[selectionIndex] !== undefined) {
            this.folderSizeArray[selectionIndex].open();
        }
        if (this.folderAttributeArray[selectionIndex] !== undefined) {
            this.folderAttributeArray[selectionIndex].open();
        }
    }


    getInsertIndex(fileIndex: number = this.labelTool.currentFrameIndex): number {
        if (this.annotationObjects.__selectionIndexCurrentFrame === -1 || fileIndex !== this.labelTool.currentFrameIndex) {
            return this.annotationObjects.contents[fileIndex].length;
        } else {
            return this.annotationObjects.__selectionIndexCurrentFrame;
        }
    }

    track = async (box: AnnotationObjectParams) => {
        if (this.clickedObjectIndex === -1) {
            console.warn(`No object clicked`);
            return;
        }
        document.body.classList.add('waiting');

        const release = await this.mouse_mutex.acquire();
        try {
            this.annotationObjects.setSelectionIndex(this.clickedObjectIndex);
            await this.trackOneDirection(this.annotationObjects.copy(box), 0, (i: number) => ++i);
            await this.trackOneDirection(this.annotationObjects.copy(box), this.labelTool.numFrames - 1, (i: number) => --i);
        } finally {
            release();
            document.body.classList.remove('waiting');
        }
    }

    trackOneDirection = async (box: AnnotationObjectParams, startIndex: number, op: (i: number) => number) => {
        // frame index
        let fi: number;
        let objectIndex = -1;
        // Skip all frames without any object with desired trackId
        for (fi = startIndex; (objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(box.trackId, box.class, fi)) < 0; fi = op(fi)) {

        }

        const filter = new MaFilter(this.labelTool.annotationObjects.contents[fi][objectIndex]);

        for (; 0 <= fi && fi < this.labelTool.numFrames; fi = op(fi)) {
            if ((objectIndex = this.annotationObjects.getObjectIndexByTrackIdAndClass(box.trackId, box.class, fi)) >= 0) {
                box = this.labelTool.annotationObjects.contents[fi][objectIndex];
                filter.update(box);
            } else {
                try {
                    const prediction: number[] = filter.predict();
                    box = this.annotationObjects.copy(box);
                    box.fileIndex = fi;
                    const origYaw = box.rotationYaw;
                    this.annotationObjects.setPosRotScaleFromArray(prediction, box);
                    let adjustedYaw = annMath.normAngle(box.rotationYaw - origYaw);
                    if (Math.abs(adjustedYaw) > Math.PI / 2) {
                        console.log("Adjust angle by Math.PI.");
                        box.rotationYaw = annMath.normAngle(box.rotationYaw + Math.PI);
                    }
                    const insertIndex = this.getInsertIndex(fi);
                    await this.predictBoxRotationScalePosition(box, false);
                    this.annotationObjects.set(insertIndex, box);
                    filter.update(box);
                } catch (error) {
                    console.warn(`Error when transfering annotatoin to frame ${fi}\n${error}`);
                    filter.nextStep(box);
                }
            }
        }
    }

    getTrackId(): string {
        if (this.annotationObjects.__selectionIndexCurrentFrame === -1) {
            return this.annotationObjects.getNextTrackID();
        }
        else {
            return this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.annotationObjects.__selectionIndexCurrentFrame]["trackId"];
        }
    }

    setClickedObjectIndexPrevious(): void {
        this.clickedObjectIndexPrevious = this.annotationObjects.__selectionIndexCurrentFrame;
    }

    createRaycaster(mouse: Vector2): Raycaster {
        if (this.birdsEyeViewFlag === false) {
            const vector = new Vector3(mouse.x, mouse.y, 1);
            vector.unproject(this.currentCamera);
            return new Raycaster(this.currentCamera.position, vector.sub(this.currentCamera.position).normalize());
        } else {
            const ray = new Raycaster();
            ray.setFromCamera(mouse, this.currentCamera);
            return ray;
        }
    }

    get3DLabel(insertIndex: number, parameters: AnnotationObjectParams): AnnotationObjectParams {
        const bbox = parameters;
        const cubeGeometry = new BoxBufferGeometry(1.0, 1.0, 1.0);//width, length, height
        let color;
        if (parameters.fromFile === true) {
            color = this.annotationClasses.annotationClasses[parameters.class].color;
        } else {
            color = this.annotationClasses.getCurrentAnnotationClassObject().color;
        }

        const cubeMaterialSide = new MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            side: DoubleSide,
            morphTargets: false
        });
        const cubeMaterialFrontSide = new MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            side: DoubleSide,
            morphTargets: false
        });
        const cubeMaterials = [cubeMaterialFrontSide, cubeMaterialSide, cubeMaterialSide, cubeMaterialSide, cubeMaterialSide, cubeMaterialSide];
        // let faceMaterial = new MeshFaceMaterial(cubeMaterials);
        // let cubeMesh = new Mesh(cubeGeometry, faceMaterial);
        // TODO: check if Mesh can take an array of materials
        const cubeMesh = new Mesh(cubeGeometry, cubeMaterials);
        cubeMesh.position.copy(this.annotationObjects.position(bbox));
        cubeMesh.scale.copy(this.annotationObjects.scale(bbox));
        cubeMesh.rotation.copy(this.annotationObjects.rotation(bbox));
        if (!parameters.trackId) {
            console.log("track id undefined")
        } else {
            cubeMesh.name = "cube-" + parameters.class.toLowerCase() + "-" + parameters.trackId;
        }

        // get bounding box from object
        //let boundingBoxColor = Utils.increaseBrightness(color, 50);
        let boundingBoxColor = 0x000000;
        let edgesGeometry = new EdgesGeometry(cubeMesh.geometry);
        let edgesMaterial = new LineBasicMaterial({color: boundingBoxColor, linewidth: 2});
        let edges = new LineSegments(edgesGeometry, edgesMaterial);
        cubeMesh.add(edges);

        // add object only to scene if file index is equal to current file index
        if (parameters.fileIndex === this.labelTool.currentFrameIndex) {
            this.scene.add(cubeMesh);
            this.addBoundingBoxGui(bbox, undefined, insertIndex);
        }
        // class tooltip
        this.addClassTooltip(parameters.fileIndex, parameters.class, parameters.trackId, bbox);

        this.labelTool.cubeArray[parameters.fileIndex].push(cubeMesh);
        return bbox;
    }


    normalizeDistances() {
        let maxDistance = 0;
        for (let distanceIdx in this.currentDistances) {
            if (this.currentDistances.hasOwnProperty(distanceIdx)) {
                let distance = this.currentDistances[distanceIdx];
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
        }
        for (let i = 0; i < this.currentDistances.length; i++) {
            this.currentDistances[i] = (this.currentDistances[i] / (maxDistance)) * 255;
        }
    }


    addAnnotationObjectFromRect(pos: Vector3, scale: Vector3, rotation: Euler, trackId: string, insertIndex: number, objectClass: string, undo: boolean) {

        const fileIndex = this.labelTool.currentFrameIndex;
        if (!undo) {
            this.operationStack.push({
                type: 'add',
                objectIndex: insertIndex
            })
        }

        const objectClassIdx = this.annotationClasses.getIndexByObjectClass(this.annotationClasses.getCurrentClass());
        const attributes = this.annotationObjects.getDefaultAttributesByClassIdx(objectClassIdx);

        pos.z = pos.z - this.labelTool.positionLidar[2];

        // average dimensions in meters (ref: dimensions.com)
        const box = this.annotationObjects.getDefaultObject();
        box.class = objectClass;
        this.annotationObjects.setPosition(pos, box);
        this.annotationObjects.setScale(scale, box);
        this.annotationObjects.setRotation(rotation, box);
        this.annotationObjects.updateOriginalParams(box);
        box.trackId = trackId;
        box.fromFile = false;
        box.fileIndex = fileIndex;
        box.copyLabelToNextFrame = false;
        box.attributes = attributes;

        const postAdjustment = (box: AnnotationObjectParams) => {
            // project bounding box to 2D image
            this.labelToolImage.projectBoundingBoxToImage(box);

            this.annotationObjects.set(insertIndex, box);
            this.selectAnnotationBox(insertIndex, box);

            // hide track id tooltip
            $("#tooltip-" + this.annotationObjects.contents[fileIndex][insertIndex]["class"] + "-" + this.annotationObjects.contents[fileIndex][insertIndex]["trackId"]).hide();

            // move left button to right
            $("#left-btn").css("left", window.innerWidth / 3);
            this.showHelperViews(pos.x, pos.y, pos.z)

            this.annotationObjects.__insertIndex++;
            this.annotationObjects.select(insertIndex);
            if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                let interpolationModeCheckbox = document.getElementById("interpolation-checkbox");
                this.enableInterpolationModeCheckbox(interpolationModeCheckbox);

                if (this.interpolationMode === true) {
                    this.interpolationObjIndexCurrentFile = insertIndex;
                }
            }
        }

        if (!undo) {
            this.predictBoxRotationScalePosition(box, true).then((box: AnnotationObjectParams) => postAdjustment(box));
        } else {
            postAdjustment(box);
        }
    }

    async predictBoxRotationScalePosition(box: AnnotationObjectParams, change_scale: boolean): Promise<AnnotationObjectParams> {
        const position: Vector3 = this.annotationObjects.position(box);
        const rotation: Euler = this.annotationObjects.rotation(box);
        const scale: Vector3 = this.annotationObjects.scale(box);

        const points = {
            "points": this.pointsForBox(this.pointCloudScanMap[box.fileIndex], position, rotation, scale)
        }

        // TODO: AL changes here.
        if (points.points.length > 10) {
            const requestInit: RequestInit = this.requestInitFromJson(points);
            // TODO: fix bug on server side
            //let newRotation: Euler = await (await fetch('/predict_rotation', requestInit)).json();
            //if (newRotation.z > Math.PI) {
            //    newRotation.z -= Math.PI * 2;
            //}

            this.annotationObjects.updateOriginalParams(box);
            this.growBoxFromParams(box, change_scale);
            // this.annotationObjects.setRotation(newRotation, box);
            this.adjustBoxScale(box, change_scale);
            this.annotationObjects.updateParams(box);
        }
        return box;
    }

    growBoxFromParams(box: AnnotationObjectParams, change_scale: boolean) {
        const scale: Vector3 = this.annotationObjects.scale(box);
        const position: Vector3 = this.annotationObjects.position(box);
        const rotation: Euler = this.annotationObjects.rotation(box);
        this.growBox(scale, position, rotation, box.fileIndex, change_scale);
        this.annotationObjects.setPosition(position, box);
        this.annotationObjects.setRotation(rotation, box);
        this.annotationObjects.setScale(scale, box);
    }

    growBox(scale: Vector3, pos: Vector3, rot: Euler, fileIndex: number, change_scale: boolean): void {
        const threshold = 0.1; // grow distance per iteration
        const trans = MathUtils.transpose(MathUtils.eulerAngleToRotateMatrix(rot, new Vector3()), 4);
        const groundLevel = 0.3
        const points_wo_rotation = this.pointsForBox(this.pointCloudScanMap[fileIndex], pos, rot, scale);
        const points = points_wo_rotation.map(point => {
            const x = point[0];
            const y = point[1];
            const z = point[2];
            const p = [x - scale.x, y - scale.y, z - scale.z, 1];
            const tp = MathUtils.matmul(trans, p, 4);
            return tp;
        })

        const extreme = {
            max: {
                x: -100000,
                y: -100000,
                z: -100000,
            },

            min: {
                x: 100000,
                y: 100000,
                z: 100000,
            },
        };

        let inside_points = 0;
        points.forEach((tp, i) => {
            if ((Math.abs(tp[0]) > scale.x / 2 + 0.01)
                || (Math.abs(tp[1]) > scale.y / 2 + 0.01)
                || (Math.abs(tp[2]) > scale.z / 2 + 0.01)) {


                return;
            } else {

                if ((scale.z < 0.6) || ((scale.z > 0.6) && (tp[2] > -scale.z / 2 + groundLevel))) {
                    inside_points += 1;

                    if (tp[0] > extreme.max.x) {
                        extreme.max.x = tp[0];
                    }

                    if (tp[0] < extreme.min.x) {
                        extreme.min.x = tp[0];
                    }

                    if (tp[1] > extreme.max.y) {
                        extreme.max.y = tp[1];
                    }

                    if (tp[1] < extreme.min.y) {
                        extreme.min.y = tp[1];
                    }
                }

                if (tp[2] > extreme.max.z) {
                    extreme.max.z = tp[2];
                }

                if (tp[2] < extreme.min.z) {
                    extreme.min.z = tp[2];
                }

            }
        });

        let refined_extreme;
        if (inside_points < 10)  //too few points, give up.
        {
            refined_extreme = {
                max: {
                    x: scale.x / 2,
                    y: scale.y / 2,
                    z: scale.z / 2,
                },
                min: {
                    x: -scale.x / 2,
                    y: -scale.y / 2,
                    z: -scale.z / 2,
                }
            };

        } else {
            let extreme_adjusted = true;
            let loop_count = 0;
            while (extreme_adjusted) {
                loop_count++;
                if (loop_count > 100000) {
                    console.log("deep loops in grow_box");
                    break;
                }
                extreme_adjusted = false;
                // x+
                let find_point = points.find(tp => {
                    return tp[0] > extreme.max.x && tp[0] < extreme.max.x + threshold / 2 &&
                        tp[1] < extreme.max.y && tp[1] > extreme.min.y &&
                        tp[2] < extreme.max.z && tp[2] > extreme.min.z + groundLevel;
                });
                if (find_point) {
                    extreme.max.x += threshold / 2;
                    extreme_adjusted = true;
                }
                // x -
                find_point = points.find(tp => {
                    return tp[0] < extreme.min.x && tp[0] > extreme.min.x - threshold / 2 &&
                        tp[1] < extreme.max.y && tp[1] > extreme.min.y &&
                        tp[2] < extreme.max.z && tp[2] > extreme.min.z + groundLevel;
                });
                if (find_point) {
                    extreme.min.x -= threshold / 2;
                    extreme_adjusted = true;
                }
                // y+
                find_point = points.find(tp => {
                    return tp[1] > extreme.max.y && tp[1] < extreme.max.y + threshold / 2 &&
                        tp[0] < extreme.max.x && tp[0] > extreme.min.x &&
                        tp[2] < extreme.max.z && tp[2] > extreme.min.z + groundLevel;
                });
                if (find_point) {
                    extreme.max.y += threshold / 2;
                    extreme_adjusted = true;
                }
                // y -
                find_point = points.find(tp => {
                    return tp[1] < extreme.min.y && tp[1] > extreme.min.y - threshold / 2 &&
                        tp[0] < extreme.max.x && tp[0] > extreme.min.x &&
                        tp[2] < extreme.max.z && tp[2] > extreme.min.z + groundLevel;
                });
                if (find_point) {
                    extreme.min.y -= threshold / 2;
                    extreme_adjusted = true;
                }
                // z+
                find_point = points.find(tp => {
                    return tp[0] < extreme.max.x && tp[0] > extreme.min.x &&
                        tp[1] < extreme.max.y && tp[1] > extreme.min.y &&
                        tp[2] > extreme.max.z && tp[2] < extreme.max.z + threshold / 2;
                });
                if (find_point) {
                    extreme.max.z += threshold / 2;
                    extreme_adjusted = true;
                }
                // z-
                find_point = points.find(tp => {
                    return tp[0] < extreme.max.x && tp[0] > extreme.min.x &&
                        tp[1] < extreme.max.y && tp[1] > extreme.min.y &&
                        tp[2] < extreme.min.z && tp[2] > extreme.min.z - threshold / 2;
                });
                if (find_point) {
                    extreme.min.z -= threshold / 2;
                    extreme_adjusted = true;
                }

            }

            // refine extreme values
            //1 set initial value
            let refined_extreme = {
                max: {
                    x: extreme.max.x - threshold / 2,
                    y: extreme.max.y - threshold / 2,
                    z: extreme.max.z - threshold / 2,
                },
                min: {
                    x: extreme.min.x + threshold / 2,
                    y: extreme.min.y + threshold / 2,
                    z: extreme.min.z + threshold / 2,
                },
            };

            //2  find refined values.
            points.forEach(tp => {
                if (tp[0] > extreme.max.x || tp[0] < extreme.min.x ||
                    tp[1] > extreme.max.y || tp[1] < extreme.min.y ||
                    tp[2] > extreme.max.z || tp[2] < extreme.min.z) {
                } else {
                    if (tp[0] > refined_extreme.max.x && tp[2] > extreme.min.z + groundLevel) {
                        refined_extreme.max.x = tp[0];
                    }
                    if (tp[0] < refined_extreme.min.x && tp[2] > extreme.min.z + groundLevel) {
                        refined_extreme.min.x = tp[0];
                    }
                    if (tp[1] > refined_extreme.max.y && tp[2] > extreme.min.z + groundLevel) {
                        refined_extreme.max.y = tp[1];
                    }
                    if (tp[1] < refined_extreme.min.y && tp[2] > extreme.min.z + groundLevel) {
                        refined_extreme.min.y = tp[1];
                    }
                    if (tp[2] > refined_extreme.max.z) {
                        refined_extreme.max.z = tp[2];
                    }
                    if (tp[2] < refined_extreme.min.z) {
                        refined_extreme.min.z = tp[2];
                    }
                }
            });
            refined_extreme.min.z -= groundLevel;
        }

        // adjust size and pos
        ['x', 'y', 'z'].forEach((axis) => {
            pos[axis] += (refined_extreme.max[axis] + refined_extreme.min[axis]) / 2;
            if (change_scale) {
                scale[axis] += refined_extreme.max[axis] - refined_extreme.min[axis];
            }
        })
    }

    pointsForBox(points: Points, position: Vector3, rotation: Euler, scale: Vector3): number[][] {
        const pos_array = points.geometry.getAttribute("position").array;
        const relative_position_wo_rotation: number[][] = [];

        const box_corners = MathUtils.psrToXyz(position, scale, rotation);
        const extreme: Extreme | null = MathUtils.arrayAsVectorRange(box_corners, 4);

        if (extreme !== null) {
            for (let i = 0; i < pos_array.length / 3; i++) {
                const x = pos_array[i * 3], y = pos_array[i * 3 + 1], z = pos_array[i * 3 + 2];
                if (extreme.min.x <= x && x <= extreme.max.x
                    && extreme.min.y <= y && y <= extreme.max.y
                    && extreme.min.z <= z && z <= extreme.max.z) {
                    relative_position_wo_rotation.push([x - position.x, y - position.y, z - position.z]);
                }
            }
        } else {
            console.warn(`Extreme is null`);
        }
        return relative_position_wo_rotation;
    };

    getDimensionOfPoints(box: AnnotationObjectParams): Extreme {
        // find points for box
        const pointsForBox = this.pointsForBox(this.pointCloudScanMap[box.fileIndex],
            this.annotationObjects.position(<AnnotationObjectParams>box.original),
            this.annotationObjects.rotation(<AnnotationObjectParams>box.original),
            this.annotationObjects.scale(<AnnotationObjectParams>box.original));
        // rotate the points against the box rotation
        const trans = MathUtils.transpose(MathUtils.eulerAngleToRotateMatrix(this.annotationObjects.rotation(box), new Vector3(0, 0, 0)), 4);
        let p: number[][] = []
        for (const point of pointsForBox) {
            const tp = MathUtils.matmul(trans, [...point, 1], 4);
            p.push([tp[0], tp[1], tp[2]]);
        }
        const extreme1: Extreme | null = MathUtils.vectorRange(p);
        if (extreme1 === null) {
            throw Error('Extreme is null');
        }

        //filter out lowest part, to calculate x-y size.
        const zOffset = 0.3;
        p = p.filter(function (point) {
            return point[2] - zOffset > extreme1.min.z;
        })

        //compute range again.
        const extreme2: Extreme | null = MathUtils.vectorRange(p);
        if (extreme2 === null) {
            throw Error('Extreme is null');
        }

        const extreme: Extreme | null = {
            max: {
                x: extreme2.max.x,
                y: extreme2.max.y,
                z: extreme1.max.z,
            },
            min: {
                x: extreme2.min.x,
                y: extreme2.min.y,
                z: extreme1.min.z,
            }
        };

        return extreme;
    };

    adjustBoxScale(box: AnnotationObjectParams, change_scale: boolean) {
        const extreme = this.getDimensionOfPoints(box);

        MathUtils.translateBox(box, 'x', (extreme.max.x + extreme.min.x) / 2)
        MathUtils.translateBox(box, 'y', (extreme.max.y + extreme.min.y) / 2)
        MathUtils.translateBox(box, 'z', (extreme.max.z + extreme.min.z) / 2)

        if (change_scale) {
            box.length = extreme.max.x - extreme.min.x;
            box.width = extreme.max.y - extreme.min.y
            box.height = extreme.max.z - extreme.min.z;
        }
    }

    selectAnnotationBox(insertIndex: number, box: AnnotationObjectParams) {
        this.selectedMesh = this.labelTool.cubeArray[box.fileIndex][insertIndex];
        this.removeTransformControls();
        this.addTransformControls();
    }

    selectAllCopyLabelToNextFrame() {
        if (this.annotationObjects.contents.length === 0) {
            return;
        }
        for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
            this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["copyLabelToNextFrame"] = true;
            const checkboxElem = <HTMLInputElement>document.getElementById("copy-label-to-next-frame-checkbox-" + i)?.firstChild;
            checkboxElem.checked = true;
        }
    }

    unselectAllCopyLabelToNextFrame() {
        if (this.annotationObjects.contents.length === 0) {
            return;
        }
        for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
            // set all to false, expect the selected object (if interpolation mode active)
            if (this.interpolationMode === false || i !== this.annotationObjects.getSelectionIndex()) {
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["copyLabelToNextFrame"] = false;
                const checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
                const checkbox = <HTMLInputElement>checkboxElem!.firstChild;
                checkbox.checked = false;
                $(checkboxElem!).children().first().removeAttr("checked");
            } else {
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][i]["copyLabelToNextFrame"] = true;
                let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
                let checkbox = <HTMLInputElement>checkboxElem!.firstChild;
                checkbox.checked = true;
            }
        }
    }

    //add remove function in dat.GUI
    registerRemoveFunction() {
        dat.GUI.prototype.removeFolder = function (name) {
            let folder = this.__folders[name];
            if (!folder) {
                return;
            }

            folder.close();
            this.__ul.removeChild(folder.domElement.parentNode);
            delete this.__folders[name];
            this.onResize();
        };
    }

    changeClassColorPCD(index: number, label: string) {
        const object = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][index];
        if (Array.isArray(object.material)) {
            for (let i = 0; i < object.material.length; i++) {
                (<MeshBasicMaterial>object.material[i]).color.setHex(Number(this.annotationClasses.annotationClasses[label].color.replace("#", "0x")));
            }
        } else {
            (<MeshBasicMaterial>object.material).color.setHex(Number(this.annotationClasses.annotationClasses[label].color.replace("#", "0x")));
        }
        // change also color of the bounding box
        (<MeshBasicMaterial>(<Mesh>object.children[0]).material).color.setHex(Number(this.annotationClasses.annotationClasses[label].color.replace("#", "0x")));
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][index]["class"] = label;
    }

    interpolateSelectedBox() {
        if (this.interpolationMode === true && this.labelTool.frameAnnotationType === "continuous_sequence") {
            this.interpolate();
        }
    }
//
    interpolate() {
        this.interpolationObjIndexCurrentFile = this.annotationObjects.getSelectionIndex();
        let interpolationStartFileIndex = Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStartFileIndex"]);
        // if (interpolationStartFileIndex === -1) {
        //     this.labelTool.logger.error("Interpolation failed. Select object to interpolate and try again.");
        //     return;
        // }
        let numFrames = this.labelTool.currentFrameIndex - interpolationStartFileIndex;
        let objectIndexStartFile = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["trackId"], this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex);
        let xDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["x"])) / numFrames;
        let yDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["y"])) / numFrames;
        let zDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["z"])) / numFrames;

        let rotationYawEnd = Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"]);
        let rotationYawStart = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationYaw"]);
        let rotationYawDelta = (rotationYawEnd - rotationYawStart) / numFrames;

        let rotationPitchEnd = Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"]);
        let rotationPitchStart = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationPitch"]);
        let rotationPitchDelta = (rotationPitchEnd - rotationPitchStart) / numFrames;

        let rotationRollEnd = Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"]);
        let rotationRollStart = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationRoll"]);
        let rotationRollDelta = (rotationRollEnd - rotationRollStart) / numFrames;

        let widthDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"])) / numFrames;
        let lengthDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["length"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["length"])) / numFrames;
        let heightDelta = (Number(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"]) - Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"])) / numFrames;


        for (let i = 1; i < numFrames; i++) {
            // cloning
            let clonedObject = jQuery.extend(true, {}, this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]);
            let clonedCubeObject = this.labelTool.cubeArray[interpolationStartFileIndex][objectIndexStartFile].clone();
            let clonedSprite = this.labelTool.spriteArray[interpolationStartFileIndex][objectIndexStartFile].clone();
            let objectIndexNextFrame = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["trackId"], this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex + i);
            // use length>2 because 1. element is insertIndex
            if (this.annotationObjects.contents[interpolationStartFileIndex + i] !== undefined && this.annotationObjects.contents[interpolationStartFileIndex + i].length > 0 && objectIndexNextFrame !== -1) {
                // if frame contains some objects, then find object with same trackId and overwrite it
                this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedObject;
                this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedCubeObject;
                this.labelTool.spriteArray[interpolationStartFileIndex + i][objectIndexNextFrame] = clonedSprite;
            } else {
                // else clone object to new frame and adjusts interpolated position and size
                this.annotationObjects.contents[interpolationStartFileIndex + i].push(clonedObject);
                this.labelTool.cubeArray[interpolationStartFileIndex + i].push(clonedCubeObject);
                this.labelTool.spriteArray[interpolationStartFileIndex + i].push(clonedSprite);
                // recalculate index in next frame after cloning object
                objectIndexNextFrame = this.annotationObjects.getObjectIndexByTrackIdAndClass(this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["trackId"], this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["class"], interpolationStartFileIndex + i);
            }

            let newX = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["x"]) + i * xDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["x"] = newX;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["x"] = newX;

            let newY = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["y"]) + i * yDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["y"] = newY;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["y"] = newY;

            let newZ = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["z"]) + i * zDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["z"] = newZ;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["position"]["z"] = newZ;

            let newRotationYaw = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationYaw"]) + i * rotationYawDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationYaw"] = newRotationYaw;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["z"] = newRotationYaw;

            let newRotationPitch = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationPitch"]) + i * rotationPitchDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationPitch"] = newRotationPitch;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["x"] = newRotationPitch;

            let newRotationRoll = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["position"]["rotationRoll"]) + i * rotationRollDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["rotationRoll"] = newRotationRoll;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["rotation"]["y"] = newRotationRoll;

            let newWidth = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["width"]) + i * widthDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["width"] = newWidth;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["x"] = newWidth;

            let newLength = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["length"]) + i * lengthDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["length"] = newLength;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["y"] = newLength;

            let newHeight = Number(this.annotationObjects.contents[interpolationStartFileIndex][objectIndexStartFile]["interpolationStart"]["size"]["height"]) + i * heightDelta;
            this.annotationObjects.contents[interpolationStartFileIndex + i][objectIndexNextFrame]["height"] = newHeight;
            this.labelTool.cubeArray[interpolationStartFileIndex + i][objectIndexNextFrame]["scale"]["z"] = newHeight;
        }

        // Note: end frame index is the same as current file index
        // start position becomes current end position
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["x"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["y"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["z"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationYaw"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationPitch"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["position"]["rotationRoll"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["x"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["x"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["y"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["y"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStart"]["size"]["z"] = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["z"];
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStartFileIndex"] = this.labelTool.currentFrameIndex;
        // set current frame to start position and start size
        this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
        this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Rotation (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
        this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (this.labelTool.currentFrameIndex + 1) + ")";
        // enable start position and start size
        this.enableStartPose();
        // remove end position folder and end position size
        this.folderBoundingBox3DArray[this.interpolationObjIndexCurrentFile].removeFolder("Interpolation End Position (frame " + (this.labelTool.previousFrameIndex + 1) + ")");
        this.folderBoundingBox3DArray[this.interpolationObjIndexCurrentFile].removeFolder("Interpolation End Size (frame " + (this.labelTool.previousFrameIndex + 1) + ")");
        // disable interpolate button
        this.disableInterpolationBtn();

        // this.labelTool.logger.success("Interpolation successfully!");
    }

    setOrbitControls(enableRotate: boolean) {
        // TODO: tmp do not set orbit controls because of mousedown event
        this.currentOrbitControls = new OrbitControls(this.currentCamera, this.renderer.domElement);
        this.currentOrbitControls.enablePan = true;
        this.currentOrbitControls.keyPanSpeed = 15;
        this.currentOrbitControls.enableRotate = enableRotate;
        this.currentOrbitControls.enableKeys = false;
        this.currentOrbitControls.autoRotate = false;// true for demo
        this.currentOrbitControls.maxPolarAngle = Math.PI / 2;
    }


    setClassPickerClass(selectedClass: string) {
        // get class name of selected object
        // get index of selected object within 5 classes (using class name)
        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[this.annotationClasses.annotationClasses[selectedClass].index]).css('background-color', '#525252');
        this.annotationClasses.currentClass = selectedClass;
    }


    setPointerLockControls() {
        this.pointerLockControls = new PointerLockControls(this.currentCamera, this.canvas3D);
        this.pointerLockObject = this.pointerLockControls.getObject();
        this.pointerLockObject.position.set(0, 0, 0);
        this.pointerLockObject.rotation.set(Math.PI / 2, 0, 0);
        this.scene.add(this.pointerLockObject);
    }

    disableStartPose() {
        // disable slider
        this.folderPositionArray[this.interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
        this.folderPositionArray[this.interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
        this.folderRotationArray[this.interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
        this.folderRotationArray[this.interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
        this.folderSizeArray[this.interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
        this.folderSizeArray[this.interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
        this.folderAttributeArray[this.interpolationObjIndexNextFile].domElement.style.opacity = 0.5;
        this.folderAttributeArray[this.interpolationObjIndexNextFile].domElement.style.pointerEvents = "none";
    }

    enableStartPose() {
        // disable slider
        this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
        this.folderPositionArray[this.interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
        this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
        this.folderRotationArray[this.interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
        this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
        this.folderSizeArray[this.interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
        this.folderAttributeArray[this.interpolationObjIndexCurrentFile].domElement.style.opacity = 1.0;
        this.folderAttributeArray[this.interpolationObjIndexCurrentFile].domElement.style.pointerEvents = "all";
    }

    disableInterpolationModeCheckbox(interpolationModeCheckbox) {
        interpolationModeCheckbox.parentElement.parentElement.style.opacity = 0.5;
        interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "none";
        interpolationModeCheckbox.firstChild.setAttribute("tabIndex", "-1");
    }

    disableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox) {
        copyLabelToNextFrameCheckbox.parentElement.parentElement.style.opacity = 0.5;
        copyLabelToNextFrameCheckbox.parentElement.parentElement.style.pointerEvents = "none";
        copyLabelToNextFrameCheckbox.firstChild.setAttribute("tabIndex", "-1");
    }

    enableCopyLabelToNextFrameCheckbox(copyLabelToNextFrameCheckbox) {
        copyLabelToNextFrameCheckbox.parentElement.parentElement.style.opacity = 1.0;
        copyLabelToNextFrameCheckbox.parentElement.parentElement.style.pointerEvents = "all";
        $(copyLabelToNextFrameCheckbox.firstChild).removeAttr("tabIndex");
    }


    enableInterpolationModeCheckbox(interpolationModeCheckbox) {
        interpolationModeCheckbox.parentElement.parentElement.style.opacity = 1.0;
        interpolationModeCheckbox.parentElement.parentElement.style.pointerEvents = "all";
        $(interpolationModeCheckbox.firstChild).removeAttr("tabIndex");
    }


    enableInterpolationBtn() {
        this.interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "all";
        this.interpolateBtn.domElement.parentElement.parentElement.style.opacity = 1.0;
        $(this.interpolateBtn.domElement.firstChild).removeAttr("tabIndex");
    }

    disableInterpolationBtn() {
        this.interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "none";
        this.interpolateBtn.domElement.parentElement.parentElement.style.opacity = 0.5;
        this.interpolateBtn.domElement.firstChild.setAttribute("tabIndex", "-1");
    }

    enablePointSizeSlider() {
        this.pointSizeSlider.domElement.parentElement.parentElement.style.pointerEvents = "all";
        this.pointSizeSlider.domElement.parentElement.parentElement.style.opacity = 1.0;
    }

    enableChooseSequenceDropDown(chooseSequenceDropDown) {
        chooseSequenceDropDown.parentElement.parentElement.parentElement.style.pointerEvents = "all";
        chooseSequenceDropDown.parentElement.parentElement.parentElement.style.opacity = 1.0;
        $(chooseSequenceDropDown.firstChild).removeAttr("tabIndex");
    }

    disableChooseSequenceDropDown(chooseSequenceDropDown) {
        chooseSequenceDropDown.parentElement.parentElement.style.pointerEvents = "none";
        chooseSequenceDropDown.parentElement.parentElement.style.opacity = 0.5;
        chooseSequenceDropDown.tabIndex = -1;
    }

    updateAnnotationOpacity() {
        for (let i = 0; i < this.labelTool.cubeArray[this.labelTool.currentFrameIndex].length; i++) {
            let obj = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][i];
            let sprite = this.labelTool.spriteArray[this.labelTool.currentFrameIndex][i];
            let meshDistance = this.currentCamera.position.distanceTo(obj.position);
            let spriteDistance = this.currentCamera.position.distanceTo(sprite.position);
            this.spriteBehindObject = spriteDistance > meshDistance;
            sprite.material.opacity = this.spriteBehindObject ? 0.2 : 0.8;

            // if number should change size according to its position
            // then comment out the following line and the ::before pseudo-element
            sprite.material.opacity = 0;
        }

    }

    updateScreenPosition() {
        for (let i = 0; i < this.labelTool.cubeArray[this.labelTool.currentFrameIndex].length; i++) {
            let cubeObj = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][i];
            let annotationObj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][i];
            const cubePosition = new Vector3(cubeObj.position.x, cubeObj.position.y, cubeObj.position.z);
            const canvas = this.renderer.domElement;
            cubePosition.project(this.currentCamera);
            cubePosition.x = Math.round((0.5 + cubePosition.x / 2) * (canvas.width));
            cubePosition.y = Math.round((0.5 - cubePosition.y / 2) * (canvas.height));
            if (annotationObj.trackId !== undefined) {
                let classTooltip = $("#tooltip-" + annotationObj.class + "-" + annotationObj.trackId)[0];
                if (classTooltip !== undefined) {
                    let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                    classTooltip.style.top = `${cubePosition.y + this.labelToolImage.headerHeight + imagePaneHeight - 21}px`;
                    classTooltip.style.left = `${cubePosition.x}px`;
                    // TODO: check if string is fine instead of float
                    classTooltip.style.opacity = String((this.spriteBehindObject !== undefined) ? 0.25 : 1);
                }
            }
        }
    }

    updateControls() {
        if (Key.isCtrlDown()) {
            return;
        }
        if (!this.selectedMesh) {
            this.updateCameraPosition();
            this.updateCameraRotation();
        } else {
            this.updateSelectedBox();
        }
    }

    update() {
        // disable rotation of orbit controls if object selected
        if (this.birdsEyeViewFlag === false) {
            if (this.selectedMesh !== undefined && this.currentOrbitControls) {
                this.currentOrbitControls.enableRotate = false;
            } else {
                this.currentOrbitControls.enableRotate = true;
            }
        }

        // find intersections
        // create a Ray with origin at the mouse position
        // and direction into the scene (camera direction)
        let vector = new Vector3(Utils.mousePos.x, Utils.mousePos.y, 1);
        vector.unproject(this.currentCamera);
        let ray = new Raycaster(this.currentCamera.position, vector.sub(this.currentCamera.position).normalize());
        // set ray.camera in three.src version r126, otherwise error: Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.
        ray.camera = this.currentCamera;
        let intersects = ray.intersectObjects(this.scene.children);

        // if there is one (or more) intersections
        if (intersects.length > 0) {
            // if the closest object intersected is not the currently stored intersection object
            if (intersects[0].object !== this.intersectedObject && intersects[0].object.name.startsWith("cube")) {
                // restore previous intersection object (if it exists) to its original color
                if (this.intersectedObject != undefined) {
                    if (Array.isArray(this.intersectedObject.material)) {
                        for (let i = 0; i < this.intersectedObject.material.length; i++) {
                            this.intersectedObject.material[i].color.setHex(this.intersectedObject.currentHex);
                        }
                    } else {
                        this.intersectedObject.material.color.setHex(this.intersectedObject.currentHex);
                    }
                }
                // store reference to closest object as current intersection object
                this.intersectedObject = intersects[0].object;
                // store color of closest object (for later restoration)
                if (Array.isArray(this.intersectedObject.material) && this.intersectedObject.material.length > 0 && this.intersectedObject.material[0] !== undefined) {
                    this.intersectedObject.currentHex = this.intersectedObject.material[0].color.getHex();
                } else {
                    this.intersectedObject.currentHex = this.intersectedObject.material.color.getHex();
                }
                // set a new color for closest object
                // intersectedObject.material.color.setHex(0xff0000);
            }
        } else {
            // there are no intersections
            // restore previous intersection object (if it exists) to its original color
            if (this.intersectedObject) {
                if (Array.isArray(this.intersectedObject.material)) {
                    for (let i = 0; i < this.intersectedObject.material.length; i++) {
                        this.intersectedObject.material[i].color.setHex(this.intersectedObject.currentHex);
                    }
                } else {
                    this.intersectedObject.material.color.setHex(this.intersectedObject.currentHex);
                }
            }
            // remove previous intersection object reference
            //  by setting current intersection object to "nothing"
            this.intersectedObject = null;
        }

    }

    updateSelectedBox() {
        if (!this.selectedMesh || this.selectedMesh === undefined || !this.transformControls || this.transformControls === undefined) {
            throw Error('Updating mesh while mesh not selected');
        }
        const objectIndex = this.annotationObjects.getObjectIndexByName(this.selectedMesh.name);
        if (objectIndex === -1) {
            console.log('Object not found in annotationObjects with index: ' + objectIndex);
            return;
        }

        if (this.transformControls.mode === 'rotate') {
            this.annotationObjects.saveObjectRotation(objectIndex);
            const delta = 0.01;
            this.selectedMesh.rotation.z += delta * (Number(Key.isDown(KEYS.CODE_Q)) - Number(Key.isDown(KEYS.CODE_E)));

        } else if (this.transformControls.mode === 'scale') {
            this.annotationObjects.saveObjectScale(objectIndex);
            const delta = 0.05;
            this.selectedMesh.scale.y += delta * (Number(Key.isDown(KEYS.CODE_W)) - Number(Key.isDown(KEYS.CODE_S)));
            this.selectedMesh.scale.x += delta * (Number(Key.isDown(KEYS.CODE_D)) - Number(Key.isDown(KEYS.CODE_A)));
            this.selectedMesh.scale.z += delta * (Number(Key.isDown(KEYS.CODE_E)) - Number(Key.isDown(KEYS.CODE_Q)));

        } else if (this.transformControls.mode === 'translate') {
            this.annotationObjects.saveObjectPosition(objectIndex);
            const delta = 0.05;
            this.selectedMesh.position.y += delta * (Number(Key.isDown(KEYS.CODE_W)) - Number(Key.isDown(KEYS.CODE_S)));
            this.selectedMesh.position.x += delta * (Number(Key.isDown(KEYS.CODE_D)) - Number(Key.isDown(KEYS.CODE_A)));
            this.selectedMesh.position.z += delta * (Number(Key.isDown(KEYS.CODE_E)) - Number(Key.isDown(KEYS.CODE_Q)));
        }
        this.updateObjectPosition();
    }

    updateCameraPosition() {
        const m: Matrix4 = new Matrix4();
        m.makeRotationFromEuler(new Euler(0, 0, this.currentCamera.rotation.z));
        this.currentOrbitControls.panLeft(Number(Key.isDown(KEYS.CODE_A)) - Number(Key.isDown(KEYS.CODE_D)), m);
        this.currentOrbitControls.panUp(Number(Key.isDown(KEYS.CODE_W)) - Number(Key.isDown(KEYS.CODE_S)), m);
        if (this.currentCamera instanceof PerspectiveCamera) {
            m.makeRotationFromEuler(new Euler(MathUtils.degToRad(90), 0, 0));
            this.currentOrbitControls.panUp(Number(Key.isDown(KEYS.CODE_Q)) - Number(Key.isDown(KEYS.CODE_E)), m);
        } else if (this.currentCamera instanceof OrthographicCamera) {
            const dollyDelta = 1.05;
            if (Key.isDown(KEYS.CODE_E)) {
                this.currentOrbitControls.dollyIn(dollyDelta);
            }
            if (Key.isDown(KEYS.CODE_Q)) {
                this.currentOrbitControls.dollyOut(dollyDelta);
            }
        }
        this.currentOrbitControls.update();
    }

    updateCameraRotation() {
        if (this.currentCamera instanceof PerspectiveCamera) {
            this.currentOrbitControls.rotateUp(MathUtils.degToRad(Number(Key.isDown(KEYS.CODE_DOWN)) - Number(Key.isDown(KEYS.CODE_UP))));
        }
        this.currentOrbitControls.rotateLeft(MathUtils.degToRad(Number(Key.isDown(KEYS.CODE_RIGHT)) - Number(Key.isDown(KEYS.CODE_LEFT))));
    }

    updateObjectPosition() {
        if (!this.selectedMesh) {
            return;
        }
        const objectIdx = this.annotationObjects.getObjectIndexByName(this.selectedMesh.name)!;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["x"] = this.selectedMesh.position.x;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["y"] = this.selectedMesh.position.y;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["z"] = this.selectedMesh.position.z;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["length"] = this.selectedMesh.scale.x;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["width"] = this.selectedMesh.scale.y;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["height"] = this.selectedMesh.scale.z;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["rotationYaw"] = this.selectedMesh.rotation.z;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["rotationPitch"] = this.selectedMesh.rotation.x;
        this.annotationObjects.contents[this.labelTool.currentFrameIndex][objectIdx]["rotationRoll"] = this.selectedMesh.rotation.y;
        // update cube array
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["x"] = this.selectedMesh.position.x;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["y"] = this.selectedMesh.position.y;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["z"] = this.selectedMesh.position.z;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["length"] = this.selectedMesh.scale.x;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["width"] = this.selectedMesh.scale.y;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["height"] = this.selectedMesh.scale.z;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["rotationYaw"] = this.selectedMesh.rotation.z;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["rotationPitch"] = this.selectedMesh.rotation.x;
        this.labelTool.cubeArray[this.labelTool.currentFrameIndex][objectIdx]["rotationRoll"] = this.selectedMesh.rotation.y;

        if (this.interpolationMode === true && this.labelTool.frameAnnotationType === "continuous_sequence") {
            // let selectionIndex = this.annotationObjects.getSelectionIndex();
            let interpolationStartFileIndex = this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
            if (interpolationStartFileIndex !== this.labelTool.currentFrameIndex) {
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"] = this.selectedMesh.position.x;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"] = this.selectedMesh.position.y;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"] = this.selectedMesh.position.z;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationYaw"] = this.selectedMesh.rotation.z;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationPitch"] = this.selectedMesh.rotation.x;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationRoll"] = this.selectedMesh.rotation.y;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["length"] = this.selectedMesh.scale.x;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"] = this.selectedMesh.scale.y;
                this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"] = this.selectedMesh.scale.z;
            }
        }
    }


    changeDataset(datasetName: string) {
        this.labelTool.resetTool();

        this.labelTool.loadConfig(datasetName);
        this.labelTool.setFileNames();
        this.labelTool.initClasses();
        this.initGuiBoundingBoxAnnotations();
        this.labelTool.start();

        // move button to left
        $("#left-btn").css("left", 0);
        // move class picker to left
        $("#class-picker").css("left", 10);
    }


    changeSequence(sequence: string) {
        this.labelTool.resetTool();

        this.labelTool.availableSequences = this.labelTool.config.datasets[this.labelTool.currentDatasetIdx].sequences;
        for (let i = 0; i < this.labelTool.availableSequences.length; i++){
            this.labelTool.sequenceArray.push(this.labelTool.availableSequences[i].name);
        }
        this.labelTool.currentSequence = sequence;

        this.labelTool.weatherTypes = this.labelTool.config.datasets[this.labelTool.currentDatasetIdx].weather_types;

        this.labelTool.setFileNames()

        this.labelTool.start();

        // move button to left
        $("#left-btn").css("left", 0);
        // move class picker to left
        $("#class-picker").css("left", 10);
    }


    removeObject(objectName: string) {
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            let obj = this.scene.children[i];
            if (obj.name === objectName) {
                this.scene.remove(obj);
                return true;
            }
        }
        return false;
    }

    removePointerLock() {
        if (this.pointerLockObject) {
            this.scene.remove(this.pointerLockObject)
        }
        this.pointerLockControls = undefined;
        this.pointerLockObject = undefined;
    }

    createCheckboxAttribute(folderAttributes: dat.dat.GUI, attribute, insertIndex: number, bbox: any): dat.Controller {
        let insertedObject = {}
        insertedObject["attribute_name"] = attribute["name"];
        // if loading annotations from file, then check if attribute value does already exist. If it exists, then use that value instead of default value.
        if ((bbox.fromFile === true || bbox.copyLabelToNextFrame === true || bbox.changeFrame === true) && bbox.attributes !== undefined && bbox.attributes[attribute["name"]] !== undefined) {
            insertedObject["attribute_value"] = bbox.attributes[attribute["name"]];
        } else {
            // use default value
            insertedObject["attribute_value"] = attribute["values"][0];
        }
        insertedObject["insert_index"] = insertIndex;
        let checkbox = folderAttributes.add(insertedObject, ["attribute_value"]).name(attribute["name"]);
        checkbox.onChange((value) => {
            this.annotationObjects.contents[this.labelTool.currentFrameIndex][insertedObject["insert_index"]]["attributes"][insertedObject["attribute_name"]] = value;
        });
        return checkbox;
    }

    createDropDownAttribute(folderAttributes, attribute, insertIndex: number, bbox: AnnotationObjectParams) {
        let insertedObject = {}
        insertedObject["attribute_name"] = attribute["name"];
        // if loading annotations from file, then check if attribute value does already exist. If it exists, then use that value instead of default value.
        if ((bbox.fromFile === true || bbox.copyLabelToNextFrame || bbox.changeFrame === true) && bbox.attributes !== undefined && bbox.attributes[attribute["name"]] !== undefined) {
            insertedObject["attribute_value"] = bbox.attributes[attribute["name"]];
        } else {
            // use default value
            insertedObject["attribute_value"] = attribute["values"][0];
        }
        insertedObject["insert_index"] = insertIndex;
        let dropdown = folderAttributes.add(insertedObject, ["attribute_value"], attribute["values"]).name(attribute["name"]);
        dropdown.onChange((value) => {
            this.annotationObjects.contents[this.labelTool.currentFrameIndex][insertedObject["insert_index"]]["attributes"][insertedObject["attribute_name"]] = value;
        });
        return dropdown;
    }

    createControllers(attributesConfig, folderAttributes: dat.dat.GUI, insertIndex: number, bbox: any): dat.Controller[] {
        const attributesGUI: dat.Controller[] = [];
        for (let i = 0; i < attributesConfig.length; i++) {
            switch (attributesConfig[i]["style"]) {
                case "checkbox":
                    const checkbox: dat.Controller = this.createCheckboxAttribute(folderAttributes, attributesConfig[i], insertIndex, bbox);
                    attributesGUI.push(checkbox);
                    break;
                case "dropdown":
                    const dropdown: dat.Controller = this.createDropDownAttribute(folderAttributes, attributesConfig[i], insertIndex, bbox);
                    attributesGUI.push(dropdown);
                    break;
                default:
                    break;
            }
        }
        return attributesGUI;
    }

    setNextOperationMode() {
        if (!this.transformControls) {
            console.error('Transformcontrols are not defined')
            return;
        }
        const modes = ['rotate', 'scale', 'translate'];
        const mode = this.transformControls.mode;
        const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
        this.setOperationMode(nextMode);
    }

    setOperationMode(mode: string) {
        if (!this.transformControls) {
            console.error('Transformcontrols are not defined')
            return;
        }
        this.transformControls.setMode(mode);
        if (mode === 'translate') {
            this.transformControls.showX = true;
            this.transformControls.showY = true;
            if (this.birdsEyeViewFlag === true) {
                this.transformControls.showZ = true;
            } else {
                this.transformControls.showZ = false;
            }
        } else if (mode === 'rotate') {
            this.transformControls.showX = false;
            this.transformControls.showY = false;
            this.transformControls.showZ = true;
        } else if (mode === 'scale') {
            this.transformControls.showX = true;
            this.transformControls.showY = true;
            if (this.birdsEyeViewFlag === true) {
                this.transformControls.showZ = true;
            } else {
                this.transformControls.showZ = false;
            }
        }
    }

    keyDownSelectedMeshHandler(event: KeyboardEvent) {
        if (!this.transformControls) {
            console.error('Transformcontrols are not defined')
            return;
        }
        switch (event.code) {
            case KEYS.CODE_CONTROL_RIGHT:
            case KEYS.CODE_CONTROL_LEFT:
                this.transformControls.setTranslationSnap(0.5);
                this.transformControls.setRotationSnap(MathUtils.degToRad(15));
                break;
            case KEYS.CODE_I:
                if (this.labelTool.frameAnnotationType === "continuous_sequence") {
                    if (this.annotationObjects.getSelectionIndex() !== -1) {
                        if (this.interpolationMode === true) {
                            if (this.annotationObjects.contents[this.labelTool.currentFrameIndex][this.annotationObjects.getSelectionIndex()]["interpolationStartFileIndex"] !== this.labelTool.currentFrameIndex) {
                                this.interpolate();
                            } else {
                                // this.labelTool.logger.message("Please choose end frame.");
                            }
                        } else {
                            // this.labelTool.logger.message("Please activate interpolation mode first.");
                        }
                    } else {
                        // this.labelTool.logger.message("Please select an object first.");
                    }
                }
            case KEYS.CODE_DELETE:
            case KEYS.CODE_BACK_SPACE:
                this.deleteObject(this.clickedObjectIndex);
                // move button to left
                $("#left-btn").css("left", 0);
                break;
            case KEYS.CODE_R:
                if (!Key.isCtrlDown()) {
                    break;
                }
                this.setOperationMode('rotate');
                break;
            case KEYS.CODE_S:
                if (!Key.isCtrlDown()) {
                    break;
                }
                this.setOperationMode('scale');
                break;
            case KEYS.CODE_T:
                if (!Key.isCtrlDown()) {
                    break;
                }
                this.setOperationMode('translate');
                break;
            case KEYS.CODE_X:
                this.transformControls.showX = !this.transformControls.showX;
                break;
            case KEYS.CODE_Y:
                this.transformControls.showY = !this.transformControls.showY;
                break;
            case KEYS.CODE_Z:
                if (!Key.isCtrlDown() && this.birdsEyeViewFlag === false) {
                    this.transformControls.showZ = !this.transformControls.showZ;
                }
                break;
            case KEYS.CODE_EQUALS:
            case KEYS.CODE_NUMPAD_ADD:
                this.transformControls.setSize(Math.min(this.transformControls.size + 0.1, 10));
                break;
            case KEYS.CODE_DASH:
            case KEYS.CODE_NUMPAD_SUBTRACT:
                this.transformControls.setSize(Math.max(this.transformControls.size - 0.1, 0.1));
                break;
            case KEYS.CODE_SPACE:
                if (!this.labelTool.playSequence) {
                    this.setNextOperationMode();
                }
            case KEYS.CODE_ESCAPE:
                this.removeSelection();
                break;
        }
    }

    // TODO: Check this method
    keyDownNoSelectionHandler(event: KeyboardEvent) {
        switch (event.code) {
            case KEYS.CODE_SPACE:
                // play video sequence from current frame on to end
                this.labelTool.playSequence = !this.labelTool.playSequence;
                if (this.labelTool.playSequence === true) {
                    this.initPlayTimer();
                }
                break;
            // TODO: image size manipulation
            // case KEYS.CODE_DASH:
            // case KEYS.CODE_SUBTRACT:
            //     // this.labelToolImage.changeCanvasSize(this.labelToolImage.imageWidthOriginal * 0.9, this.labelToolImage.imageHeightOriginal * 0.9, this.labelTool.currentCameraChannel);
            //     // this.labelTool.setImageSize();
            //     // this.labelTool.setPanelSizeAndPosition(this.labelTool.currentFrameIndex);
            //     // this.labelToolImage.imageHeightOriginal *= 0.9;
            //     // this.labelToolImage.imageHeightOriginal *= 0.9;
            //     // this.labelTool.initCameraWindows();
            //     // this.labelTool.loadCameraImages();
            //     break;
            // case KEYS.CODE_EQUALS:
            // case KEYS.CODE_ADD:
            //     this.labelToolImage.changeCanvasSize(this.labelToolImage.imageWidthOriginal * 1.1, this.labelToolImage.imageHeightOriginal * 1.1, this.labelTool.currentCameraChannel);
            //     this.labelTool.setImageSize();
            //     this.labelTool.setPanelSizeAndPosition(this.labelTool.currentFrameIndex);
            //     break;
        }
    }

    keyDownHandler = (event: KeyboardEvent) => {

        // Prevent propagation if GUI element is selected
        if ((<Element>event.target).localName == "input") {
            return;
        }

        console.log("entering keyDownHandler");

        // Prevent arrow keys and key z from switching focus to GUI
        if ([KEYS.CODE_UP, KEYS.CODE_DOWN, KEYS.CODE_W, KEYS.CODE_S, KEYS.CODE_Z].includes(event.code)) {
            event.stopPropagation();
            event.preventDefault();
        }
        Key.setKeyDown(event.code);

        if (this.selectedMesh !== undefined) {
            this.keyDownSelectedMeshHandler(event);
        } else {
            this.keyDownNoSelectionHandler(event);
        }
        switch (event.code) {
            case KEYS.CODE_C:
                this.switchView();
                break;
            case KEYS.CODE_N:
                this.labelTool.nextFrame();
                break;
            case KEYS.CODE_P:
                this.labelTool.previousFrame();
                break;
            case KEYS.CODE_TAB:
                this.selectNextObject(Key.isDownShift());
                break;
            case KEYS.CODE_Z:
                if (Key.isCtrlDown()) {
                    this.undoOperation();
                }
                break;
            case KEYS.CODE_0:
                this.annotationClasses.select(9);
                break;
            case KEYS.CODE_1:
            case KEYS.CODE_2:
            case KEYS.CODE_3:
            case KEYS.CODE_4:
            case KEYS.CODE_5:
            case KEYS.CODE_6:
            case KEYS.CODE_7:
            case KEYS.CODE_8:
            case KEYS.CODE_9:
                this.annotationClasses.select(Number(event.code.slice(-1)) - 1);
                break;
        }
    }


    keyUpHandler = (event: KeyboardEvent) => {
        // Prevent propagation if GUI element is selected
        if ((<Element>event.target).localName == "input") {
            return;
        }

        console.log("entering keyUpHandler");
        Key.setKeyUp(event.code);
        switch (event.code) {
            case KEYS.CODE_CONTROL_RIGHT:
            case KEYS.CODE_CONTROL_LEFT:
                if (this.transformControls) {
                    this.transformControls.setTranslationSnap(null);
                    this.transformControls.setRotationSnap(null);
                }
                break;
        }
    };

    switchView() {
        if (this.viewModeController) {
            const viewMode = viewModeOptionsArray[(this.selectedViewModeIndex + 1) % viewModeOptionsArray.length]
            this.viewModeController.setValue(viewMode);
        }
    }

    removeSelection() {
        this.removeObject("transformControls");
        this.selectedMesh = undefined;
        this.clickedObjectIndex = -1;
    }

    selectNextObject(reverseOrder: boolean) {
        const l = this.labelTool.cubeArray[this.labelTool.currentFrameIndex].length;
        if (!this.selectedMesh) {
            this.clickedObjectIndex = reverseOrder ? l - 1 : 0;
            this.selectedMesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex];
        } else {

            this.clickedObjectIndex = reverseOrder ? ((this.clickedObjectIndex - 1 + l) % l) : ((this.clickedObjectIndex + 1) % l);
            this.selectedMesh = this.labelTool.cubeArray[this.labelTool.currentFrameIndex][this.clickedObjectIndex];
            this.removeObject("transformControls");
        }
        this.addTransformControls();
    }

    updateTooltip(className: string, trackIdOld: string, trackIdNew: string, box: AnnotationObjectParams) {
        const oldId = "#tooltip-" + className + "-" + trackIdOld;
        $(oldId).remove();
        this.addClassTooltip(this.labelTool.currentFrameIndex, className, trackIdNew, box);
    }

    addClassTooltip(fileIndex: number, className: string, trackId: string, bbox: AnnotationObjectParams) {
        let classTooltipElement = $("<div class='class-tooltip' id='tooltip-" + className + "-" + trackId + "'>" + trackId + "</div>");
        // Sprite
        const spriteMaterial = new SpriteMaterial({
            alphaTest: 0.5,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        let sprite = new Sprite(spriteMaterial);
        sprite.position.set(bbox.x + bbox.width / 2, bbox.y + bbox.length / 2, bbox.z + bbox.height / 2);
        sprite.scale.set(1, 1, 1);
        sprite.name = "sprite-" + className + "-" + trackId;

        // add tooltip only to DOM if fileIndex is equal to current file index
        if (fileIndex === this.labelTool.currentFrameIndex) {
            $("body").append(classTooltipElement);
            this.scene!.add(sprite);
        }
        this.labelTool.spriteArray[fileIndex].push(sprite);
    }
}
export {LabelTool3D};