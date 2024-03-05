import * as THREE from "three";
import {Utils} from "../util/utils";
import * as $ from "jquery";
import {MathUtils} from "../util/math_utils";
import {LabelTool} from "./tool_main";
import {AnnotationClass} from "../annotation/annotation_class";
import {AnnotationObject, AnnotationObjectParams} from "../annotation/annotation_object";
import {RaphaelElement, RaphaelPaper, RaphaelPath} from "raphael";
import {Vector2, Vector3} from "three";

class LabelToolImage{
    labelTool: LabelTool;

    annotationClasses: AnnotationClass;
    annotationObjects: AnnotationObject;

    canvasArray: HTMLCanvasElement[] = [];
    canvasParamsArray: any[] = [];

    paperArray: RaphaelPaper[] = [];
    paperArrayAll: RaphaelPaper[][] = [];

    imageArray: RaphaelElement<"SVG" | "VML", Element | SVGImageElement>[] = [];
    imageArrayAll: RaphaelElement<"SVG" | "VML", Element | SVGImageElement>[][] = [];
    fontSize: number = 20;
    action: string = "add";
    mouseX: number = 0;
    mouseY: number = 0;
    imageWidthOriginal: number = -1;
    imageHeightOriginal: number = -1;
    headerHeight: number = 0;
    circleArray: RaphaelElement<"SVG" | "VML", Element | SVGCircleElement>[] = [];

    constructor(labelTool: LabelTool, annotationClasses: AnnotationClass, annotationObjects: AnnotationObject) {
        this.labelTool = labelTool;
        this.annotationClasses = annotationClasses;
        this.annotationObjects = annotationObjects;
        this.annotationObjects.setLabelToolImage(this);
        this.imageWidthOriginal = this.labelTool.originalImageSize[0];
        this.imageHeightOriginal = this.labelTool.originalImageSize[1];
    }

    initializeCamChannel(camChannel: string){
        const canvas: HTMLCanvasElement = this.canvasArray[Utils.getChannelIndexByName(this.labelTool.cameraChannels, camChannel)];
        if (canvas !== undefined) {
            let channelIdx = Utils.getChannelIndexByName(this.labelTool.cameraChannels, camChannel);
            this.canvasParamsArray[channelIdx] = {
                x: canvas.offsetLeft,
                y: canvas.offsetTop,
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
                center: {x: canvas.offsetWidth / 3, y: canvas.offsetHeight / 3}
            };
        }
    }

    loadCameraImages(camChannel: string, fileIndex: number, labelTool){
        let imgPath = "";

        let path_part_1 = "../../input/" + labelTool.currentDataset + "/" + labelTool.currentSequence + "/images/";
        let path_part_2 = camChannel + "/" + labelTool.imageFileNames[camChannel][fileIndex];
        imgPath =  path_part_1 + path_part_2;

        let channelIdx = Utils.getChannelIndexByName(labelTool.cameraChannels, camChannel);

        const paper: RaphaelPaper = this.paperArrayAll[fileIndex][channelIdx];
        this.imageArray[channelIdx] = paper.image(
            imgPath,
            this.labelTool.currentImageArray[channelIdx]['x'],
            this.labelTool.currentImageArray[channelIdx]['y'],
            this.labelTool.currentImageArray[channelIdx]['width'],
            this.labelTool.currentImageArray[channelIdx]['height']);
    }

    cancelDefault(e) {
        e = e || window.event;
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = false;
        return false;
    }

    addEvent(element, trigger, action) {
        if (typeof element === "string") {
            element = document.getElementById(element);
        }
        if (element.addEventListener) {
            element.addEventListener(trigger, action, false);
            return true;
        } else if (element.attachEvent) {
            element['e' + trigger + action] = action;
            element[trigger + action] = function () {
                element['e' + trigger + action](window.event);
            };
            let r = element.attachEvent('on' + trigger, element[trigger + action]);
            return r;
        } else {
            element['on' + trigger] = action;
            return true;
        }
    }

    setCursor(cursorType) {
        for (let img in this.imageArray) {
            let imgObj = this.imageArray[img];
            imgObj.attr({cursor: cursorType});
        }
    }



    remove(index: number) {
        this.removeTextBox(index);
    }

    removeTextBox(index) {
        let bbox = this.annotationObjects.contents[this.labelTool.currentFrameIndex][index];
        if (bbox["textBox"] === undefined) {
            return;
        }
        bbox["textBox"]["text"].remove();
        bbox["textBox"]["box"].remove();
        delete bbox["textBox"];
    }


    removeProjectedBoundingBox(channelObj) {
        for (let lineObj in channelObj.lines) {
            if (channelObj.lines.hasOwnProperty(lineObj)) {
                let line = channelObj.lines[lineObj];
                if (line !== undefined) {
                    line.remove();
                }
            }
        }
    }

    remove2DBoundingBoxes() {
        for (let i = 0; i < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; i++) {
            for (let j = 0; j < this.annotationObjects.contents[this.labelTool.currentFrameIndex][i].channels.length; j++) {
                for (let k = 0; k < this.annotationObjects.contents[this.labelTool.currentFrameIndex][i].channels[j].lines.length; k++) {
                    let line = this.annotationObjects.contents[this.labelTool.currentFrameIndex][i].channels[j].lines[k];
                    if (line !== undefined) {
                        line.remove();
                    }
                }
            }
        }
    }

    calculateProjectedBoundingBox(xPos: number, yPos: number, zPos: number, length: number, width: number, height: number, yaw: number, channelName: string) {
        let channelIdx = Utils.getChannelIndexByName(this.labelTool.cameraChannels, channelName);

        let x_dir = this.labelTool.coordinateSystem['x-axis'];
        let y_dir = this.labelTool.coordinateSystem['y-axis'];
        let z_dir = this.labelTool.coordinateSystem['z-axis'];

        const cornerPoints: Vector3[] = [];
        if (x_dir == 'forward' && y_dir == 'left' && z_dir == 'up') {
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos - width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos - width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos + width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos + width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos - width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos - width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos + width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos + width / 2, zPos + height / 2));
        }

        else if (x_dir == 'forward' && y_dir == 'right' && z_dir == 'up') {
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos + width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos + width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos - width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos - width / 2, zPos - height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos + width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos + width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos + length / 2, yPos - width / 2, zPos + height / 2));
            cornerPoints.push(new THREE.Vector3(xPos - length / 2, yPos - width / 2, zPos + height / 2));
        }

        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(new THREE.Euler(0, 0, yaw, 'XYZ'));
        const projectedPoints: Vector2[] = [];
        for (let cornerPoint in cornerPoints) {
            let point = cornerPoints[cornerPoint];
            let point4D = new THREE.Vector4(point.x - xPos, point.y - yPos, point.z - zPos, 1);
            let point4DRotated = point4D.applyMatrix4(rotationMatrix);
            let point4DHomogeneous = [point4DRotated.x + xPos, point4DRotated.y + yPos, point4DRotated.z + zPos, 1];

            // transform 3D point from s110_lidar_ouster_south to vehicle_lidar_robosense if current channel is vehicle_camera_basler_16mm
            if (channelName === "vehicle_camera_basler_16mm") {
                const currentFileIdx = this.labelTool.currentFrameIndex;
                const frame_properties = this.labelTool.frameProperties[currentFileIdx];
                const vehicleToInfrastructureTransformationMatrix = frame_properties["transforms"]["vehicle_lidar_robosense_to_s110_lidar_ouster_south"]["transform_src_to_dst"]["matrix4x4"];
                // convert to THREE.js 4x4 matrix
                const vehicleToInfrastructureTransformationMatrix4x4 = new THREE.Matrix4();
                vehicleToInfrastructureTransformationMatrix4x4.set(
                    vehicleToInfrastructureTransformationMatrix[0][0], vehicleToInfrastructureTransformationMatrix[0][1], vehicleToInfrastructureTransformationMatrix[0][2], vehicleToInfrastructureTransformationMatrix[0][3],
                    vehicleToInfrastructureTransformationMatrix[1][0], vehicleToInfrastructureTransformationMatrix[1][1], vehicleToInfrastructureTransformationMatrix[1][2], vehicleToInfrastructureTransformationMatrix[1][3],
                    vehicleToInfrastructureTransformationMatrix[2][0], vehicleToInfrastructureTransformationMatrix[2][1], vehicleToInfrastructureTransformationMatrix[2][2], vehicleToInfrastructureTransformationMatrix[2][3],
                    vehicleToInfrastructureTransformationMatrix[3][0], vehicleToInfrastructureTransformationMatrix[3][1], vehicleToInfrastructureTransformationMatrix[3][2], vehicleToInfrastructureTransformationMatrix[3][3]
                );
                const infraToVehicleTransformationMatrix = vehicleToInfrastructureTransformationMatrix4x4.clone().invert();
                const point4DHomogeneousVector = new THREE.Vector4(point4DHomogeneous[0], point4DHomogeneous[1], point4DHomogeneous[2], point4DHomogeneous[3]);
                point4DHomogeneousVector.applyMatrix4(infraToVehicleTransformationMatrix);
                point4DHomogeneous = [point4DHomogeneousVector.x, point4DHomogeneousVector.y, point4DHomogeneousVector.z, point4DHomogeneousVector.w];
            }

            let projectionMatrix;
            projectionMatrix = this.labelTool.cameraChannels[channelIdx].projectionMatrix;
            let point2D = MathUtils.matrixProduct3x4(projectionMatrix, point4DHomogeneous);

            if (point2D[2] > 0) {
                // add only points that are in front of camera

                let windowX = (point2D[0] / point2D[2]);
                let windowY = (point2D[1] / point2D[2]);

                const zoomFactor = this.labelTool.imageScale[channelIdx];
                const cursorX = this.labelTool.currentImageArray[channelIdx]['cursorX'];
                const cursorY = this.labelTool.currentImageArray[channelIdx]['cursorY'];


                projectedPoints.push(new THREE.Vector2(
                    windowX * zoomFactor ,
                    windowY * zoomFactor));

            }
            else {
                // do not draw bounding box if it is too close to camera or behind
                return [];
            }
        }
        return projectedPoints;
    }

    calculateAndDrawLineSegments(channelObj, className: string, selected: boolean) {
        let channel = channelObj.channel;
        let lineArray: RaphaelPath<"SVG" | "VML">[] = [];
        let channelIdx = Utils.getChannelIndexByName(this.labelTool.cameraChannels, channel);
        // temporary color bottom 4 lines in yellow to check if projection matrix is correct
        // uncomment line to use yellow to color bottom 4 lines
        let color;
        if (selected === true) {
            color = this.labelTool.colorSelectedObject;
        } else {
            color = this.annotationClasses.annotationClasses[className].color;
        }

        // bottom four lines
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[1], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[2], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[3], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[0], color)!);

        // draw line for orientation
        let pointZero;
        let pointOne;
        let pointTwo;
        let pointThree;

        pointZero = channelObj.projectedPoints[6].clone();
        pointOne = channelObj.projectedPoints[7].clone();
        pointTwo = channelObj.projectedPoints[4].clone();
        pointThree = channelObj.projectedPoints[5].clone();


        let startPoint = pointZero.add(pointThree.sub(pointZero).multiplyScalar(0.5));
        let startPointCloned = startPoint.clone();
        let helperPoint = pointOne.add(pointTwo.sub(pointOne).multiplyScalar(0.5));
        let helperPointCloned = helperPoint.clone();
        let endPoint = startPointCloned.add(helperPointCloned.sub(startPointCloned).multiplyScalar(0.2));
        lineArray.push(this.drawLine(channelIdx, startPoint, endPoint, color)!);


        // top four lines
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[4], channelObj.projectedPoints[5], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[5], channelObj.projectedPoints[6], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[6], channelObj.projectedPoints[7], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[7], channelObj.projectedPoints[4], color)!);

        // vertical lines
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[4], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[5], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[6], color)!);
        lineArray.push(this.drawLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[7], color)!);

        return lineArray;
    }

    normalize2DBoxPositions(boxPositions) {
        let normalized2DBoxPositions: number[][] = [];
        for (let i = 0; i < boxPositions.length; i++) {
            normalized2DBoxPositions.push([boxPositions[i].x / this.imageWidthOriginal, boxPositions[i].y / this.imageHeightOriginal]);
        }
        return normalized2DBoxPositions;
    }

    update2DBoundingBox(fileIndex, objectIndex, isSelected) {
        if (objectIndex >= this.annotationObjects.contents[fileIndex].length) {
            console.log("objectIndex out of bounds");
            return;
        }
        let className = this.annotationObjects.contents[fileIndex][objectIndex].class;
        for (let channelObjectIdx in this.annotationObjects.contents[fileIndex][objectIndex].channels) {
            if (this.annotationObjects.contents[fileIndex][objectIndex].channels.hasOwnProperty(channelObjectIdx)) {
                let channelObj = this.annotationObjects.contents[fileIndex][objectIndex].channels[channelObjectIdx];
                if (channelObj.channel !== '') {
                    let x = this.annotationObjects.contents[fileIndex][objectIndex]["x"];
                    let y = this.annotationObjects.contents[fileIndex][objectIndex]["y"];
                    let z = this.annotationObjects.contents[fileIndex][objectIndex]["z"];
                    let length = this.annotationObjects.contents[fileIndex][objectIndex]["length"];
                    let width = this.annotationObjects.contents[fileIndex][objectIndex]["width"];
                    let height = this.annotationObjects.contents[fileIndex][objectIndex]["height"];
                    let rotationYaw = this.annotationObjects.contents[fileIndex][objectIndex]["rotationYaw"];
                    let rotationPitch = this.annotationObjects.contents[fileIndex][objectIndex]["rotationPitch"];
                    let rotationRoll = this.annotationObjects.contents[fileIndex][objectIndex]["rotationRoll"];
                    let channel = channelObj.channel;
                    channelObj.projectedPoints = this.calculateProjectedBoundingBox(x, y, z, length, width, height, rotationYaw, channel);
                    // remove previous drawn lines of all 6 channels
                    this.removeProjectedBoundingBox(channelObj);
                    if (channelObj.projectedPoints !== undefined && channelObj.projectedPoints.length === 8) {
                        channelObj.lines = this.calculateAndDrawLineSegments(channelObj, className, isSelected);
                    }
                }
            }
        }
    }

    drawLine(channelIdx: number, pointStart, pointEnd, color) {
        if (pointStart !== undefined && pointEnd !== undefined && isFinite(pointStart.x) && isFinite(pointStart.y) && isFinite(pointEnd.x) && isFinite(pointEnd.y)) {

            let line = this.paperArrayAll[this.labelTool.currentFrameIndex][channelIdx].path(
                ["M", pointStart.x, pointStart.y, "L", pointEnd.x, pointEnd.y]);
            line.attr("stroke", color);
            line.attr("stroke-width", 1);
            return line;
        } else {
            return undefined;
        }
    }

    projectBoundingBoxToImage(box: AnnotationObjectParams) {
        // calculate projected points for each channel
        for (let i = 0; i < this.labelTool.cameraChannels.length; i++) {
            let channel = this.labelTool.cameraChannels[i].channel;
            let projectedBoundingBox = this.calculateProjectedBoundingBox(box.x, box.y, box.z, box.length, box.width, box.height, box.rotationYaw, channel);
            box.channels[i].projectedPoints = projectedBoundingBox;
        }

        // calculate 2D line segments
        for (let i = 0; i < box.channels.length; i++) {
            let channelObj = box.channels[i];
            if (channelObj.channel !== undefined && channelObj.channel !== '') {
                if (box.channels[i].projectedPoints !== undefined && box.channels[i].projectedPoints.length === 8) {
                    box.channels[i]["lines"] = this.calculateAndDrawLineSegments(channelObj, box.class, true);
                }
            }
        }
    }

    projectPoints(points3D, channelIdx: number) {
        const labelTool3D = this.labelTool.getLabelTool3D();
        const points2D: { x: number, y: number }[] = [];
        labelTool3D.currentPoints3D = [];
        labelTool3D.currentDistances = [];
        let projectionMatrix;
        let scalingFactor;

        const imagePanelHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
        scalingFactor = this.imageHeightOriginal / imagePanelHeight;

        projectionMatrix = this.labelTool.cameraChannels[channelIdx].projectionMatrix;

        for (let i = 0; i < points3D.length; i++) {
            const point3D = points3D[i];
            const point2D = MathUtils.matrixProduct3x4(projectionMatrix, point3D);
            if (point2D[2] > 0) {
                // use only points that are in front of the camera
                let windowX = point2D[0] / point2D[2];
                let windowY = point2D[1] / point2D[2];
                labelTool3D.currentPoints3D.push(point3D);
                // calculate distance
                let distance = Math.sqrt(Math.pow(point3D[0], 2) + Math.pow(point3D[1], 2) + Math.pow(point3D[2], 2));
                labelTool3D.currentDistances.push(distance);
                points2D.push({x: windowX / scalingFactor, y: windowY / scalingFactor});
            }
        }
        return points2D;


    }

    showProjectedPoints(points3D) {
        let labelTool3D = this.labelTool.getLabelTool3D();
        for (let channelIdx = 0; channelIdx < this.labelTool.cameraChannels.length; channelIdx++) {
            let paper = this.paperArrayAll[this.labelTool.currentFrameIndex][channelIdx];
            let points2D = this.projectPoints(points3D, channelIdx);
            labelTool3D.normalizeDistances();
            for (let i = 0; i < points2D.length; i++) {
                let pt2D = points2D[i];
                let circle = paper.circle(pt2D.x, pt2D.y, 1);
                let distance = labelTool3D.currentDistances[i];
                let color = labelTool3D.colorMap[Math.floor(distance)];
                circle.attr("stroke", color);
                circle.attr("stroke-width", 1);
                this.circleArray.push(circle);
            }
        }
    }

    hideProjectedPoints() {
        for (let i = this.circleArray.length - 1; i >= 0; i--) {
            const circle = this.circleArray[i];
            circle.remove();
            this.circleArray.splice(i, 1);
        }
    }

    draw2DProjection(params) {
        for (let i = 0; i < params.channels.length; i++) {
            if (params.channels[i].channel !== undefined && params.channels[i].channel !== "") {
                params.channels[i].projectedPoints = this.calculateProjectedBoundingBox(params.x, params.y, params.z, params.length, params.width, params.height, params.rotationYaw, params.channels[i].channel);
                // calculate line segments
                let channelObj = params.channels[i];
                if (params.channels[i].projectedPoints !== undefined && params.channels[i].projectedPoints.length === 8) {
                    params.channels[i].lines = this.calculateAndDrawLineSegments(channelObj, params.class, false);
                }
            }
        }
    }


    draw2DProjections() {
        if (this.annotationObjects.contents !== undefined && this.annotationObjects.contents.length > 0) {
            for (let j = 0; j < this.annotationObjects.contents[this.labelTool.currentFrameIndex].length; j++) {
                let annotationObj = this.annotationObjects.contents[this.labelTool.currentFrameIndex][j];
                let params = this.annotationObjects.setObjectParameters(annotationObj);
                this.draw2DProjection(params);
                // set new params
                for (let i = 0; i < annotationObj["channels"].length; i++) {
                    this.annotationObjects.contents[this.labelTool.currentFrameIndex][j]["channels"][i]["lines"] = params["channels"][i]["lines"];
                }
            }
        }
    }

    changeClassColorImage(bbIndex, newClass) {
        let annotation = this.annotationObjects.contents[this.labelTool.currentFrameIndex][bbIndex];
        let color = this.annotationClasses.annotationClasses[newClass].color;
        // update color in all 6 channels
        for (let i = 0; i < annotation["channels"].length; i++) {
            if (annotation["channels"][i]["lines"] !== undefined && annotation["channels"][i]["lines"][0] !== undefined) {
                for (let lineObj in annotation["channels"][i]["lines"]) {
                    if (annotation["channels"][i]["lines"].hasOwnProperty(lineObj)) {
                        const line = annotation["channels"][i]["lines"][lineObj];
                        line.attr({stroke: color});
                    }
                }
            }
        }
    }
}
export {LabelToolImage};