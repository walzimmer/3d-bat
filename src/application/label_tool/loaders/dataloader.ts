import {Utils} from "../../util/utils";
import {LabelTool} from "../tool_main";
import {AnnotationsLoader} from "./loader";
import {Euler} from "three";
import THREE = require("three");


export class dataLoader implements AnnotationsLoader {
    getFilename = (labelTool: LabelTool, i: number) => labelTool.annotationFileNames[i];
    loadAnnotations = (frameObject: any, fileIndex: number, labelTool: LabelTool) => {
        const frames = frameObject.openlabel.frames;
        const index = parseInt(Object.keys(frames)[0]);
        let frameProperties = {};
        if (frames[index].hasOwnProperty("frame_properties")){
            frameProperties = frames[index].frame_properties;
        } else {
            console.log("No transformation matrix found in frame properties.");
            frameProperties = {};
        }
        labelTool.frameProperties[fileIndex] = frameProperties;

        const objects = frames[index].objects

        for (let [idx, obj] of Object.entries(objects)) {
            const entry: any = obj as any;
            const val = entry.object_data.cuboid.val;
            const quat = new THREE.Quaternion(val[3], val[4], val[5], val[6]);
            const euler = new Euler();
            euler.setFromQuaternion(quat);

            let params = labelTool.annotationObjects.getDefaultObject();

            params.class = entry.object_data.type;
            params.original.class = entry.object_data.type;

            params.rotationYaw = euler.z;
            params.original.rotationYaw = euler.z;
            params.rotationPitch = euler.y;
            params.original.rotationPitch = euler.y;
            params.rotationRoll = euler.x;
            params.original.rotationRoll = euler.x;

            params.trackId = idx;
            params.original.trackId = idx;

            params.x = val[0];
            params.original.x = val[0];
            params.y = val[1];
            params.original.y = val[1];
            params.z = val[2];
            params.original.z = val[2];

            let length;
            let width;
            let height;

            length = Math.max(val[7], 0.0001);
            width = Math.max(val[8], 0.0001);
            height = Math.max(val[9], 0.0001);

            params.length = length;
            params.original.length = length;
            params.width = width;
            params.original.width = width;
            params.height = height;
            params.original.height = height;

            params.fileIndex = fileIndex;

            let objectClassIdx = labelTool.annotationClasses.getIndexByObjectClass(entry.object_data.type);
            let defaultAttributes = labelTool.annotationObjects.getDefaultAttributesByClassIdx(objectClassIdx);

            if (entry.object_data.cuboid.attributes !== undefined) {
                params.attributes = entry.object_data.cuboid.attributes;
            } else {
                // set default attributes defined in the config file
                params.attributes = defaultAttributes;
            }
            labelTool.annotationObjects.set(labelTool.annotationObjects.__insertIndex, params);
            labelTool.annotationObjects.__insertIndex++;
        }
        labelTool.annotationObjects.__insertIndex = 0;

    }
    createAnnotationFiles = (labelTool: LabelTool) => {
        const annotationFiles: string[] = [];
        for (let j = 0; j < labelTool.numFrames; j++) {
            const annotationsInFrame: any[] = [];
            const objects: {
                [id in string]: { object_data: any }
            } = {}
            for (let i = 0; i < labelTool.annotationObjects.contents[j].length; i++) {
                if (labelTool.annotationObjects.contents[j][i] !== undefined && labelTool.cubeArray[j][i] !== undefined) {
                    let annotationObj = labelTool.annotationObjects.contents[j][i];
                    const posX = labelTool.cubeArray[j][i].position.x;
                    const posY = labelTool.cubeArray[j][i].position.y;
                    const posZ = labelTool.cubeArray[j][i].position.z;
                    const length = labelTool.cubeArray[j][i].scale.x;
                    const width = labelTool.cubeArray[j][i].scale.y;
                    const height = labelTool.cubeArray[j][i].scale.z;
                    const rotationRoll = labelTool.cubeArray[j][i].rotation.x;
                    const rotationPitch = labelTool.cubeArray[j][i].rotation.y;
                    const rotationYaw = labelTool.cubeArray[j][i].rotation.z;
                    const euler = new Euler(rotationRoll, rotationPitch, rotationYaw);
                    const quat = new THREE.Quaternion();
                    quat.setFromEuler(euler);
                    let objectClassIdx = Utils.getIndexByClass(labelTool.config.datasets[labelTool.datasetArray.indexOf(labelTool.currentDataset)].classes, annotationObj["class"]);
                    let defaultAttributes = labelTool.annotationObjects.getDefaultAttributesByClassIdx(objectClassIdx);

                    let attributesJSON: any = {};
                    attributesJSON = {
                        "text": [],
                        "num": [],
                        "boolean": []
                    };

                    let occlusion_level = defaultAttributes["occlusion_level"];
                    if (annotationObj["attributes"]["occlusion_level"] !== undefined) {
                        occlusion_level = annotationObj["attributes"]["occlusion_level"]
                    }
                    attributesJSON["text"].push({
                        "name": "occlusion_level",
                        "val": occlusion_level
                    });

                    if (defaultAttributes["body_color"] !== undefined) {
                        let body_color = defaultAttributes["body_color"];
                        if (annotationObj["attributes"]["body_color"] !== undefined) {
                            body_color = annotationObj["attributes"]["body_color"]
                        }
                        attributesJSON["text"].push({
                            "name": "body_color",
                            "val": body_color
                        });
                    }

                    let sensor_id = defaultAttributes["sensor_id"];
                    if (annotationObj["attributes"]["sensor_id"] !== undefined) {
                        sensor_id = annotationObj["attributes"]["sensor_id"]
                    }
                    attributesJSON["text"].push({
                        "name": "sensor_id",
                        "val": sensor_id
                    });

                    if (defaultAttributes["type"] !== undefined) {
                        let sub_type = defaultAttributes["type"];
                        if (annotationObj["attributes"]["type"] !== undefined) {
                            sub_type = annotationObj["attributes"]["type"]
                        }
                        attributesJSON["text"].push({
                            "name": "type",
                            "val": sub_type
                        });
                    }

                    let num_points = defaultAttributes["num_points"];
                    if (annotationObj["attributes"]["num_points"] !== undefined) {
                        num_points = annotationObj["attributes"]["num_points"]
                    }
                    attributesJSON["num"].push({
                        "name": "num_points",
                        "val": num_points
                    });

                    let score = defaultAttributes["score"];
                    if (annotationObj["attributes"]["score"] !== undefined) {
                        score = annotationObj["attributes"]["score"]
                    }
                    attributesJSON["num"].push({
                        "name": "score",
                        "val": score
                    });

                    if (defaultAttributes["number_of_trailers"] !== undefined) {
                        let number_of_trailers = defaultAttributes["number_of_trailers"];
                        if (annotationObj["attributes"]["number_of_trailers"] !== undefined) {
                            number_of_trailers = annotationObj["attributes"]["number_of_trailers"]
                        }
                        attributesJSON["num"].push({
                            "name": "number_of_trailers",
                            "val": number_of_trailers
                        });
                    }

                    if (defaultAttributes["is_electric"] !== undefined) {
                        let is_electric = defaultAttributes["is_electric"];
                        if (annotationObj["attributes"]["is_electric"] !== undefined) {
                            is_electric = annotationObj["attributes"]["is_electric"]
                        }
                        attributesJSON["boolean"].push({
                            "name": "is_electric",
                            "val": is_electric
                        });
                    }

                    if (defaultAttributes["flashing_emergency_lights"] !== undefined) {
                        let flashing_emergency_lights = defaultAttributes["flashing_emergency_lights"];
                        if (annotationObj["attributes"]["flashing_emergency_lights"] !== undefined) {
                            flashing_emergency_lights = annotationObj["attributes"]["flashing_emergency_lights"]
                        }
                        attributesJSON["boolean"].push({
                            "name": "flashing_emergency_lights",
                            "val": flashing_emergency_lights
                        });
                    }

                    if (defaultAttributes["has_rider"] !== undefined) {
                        let has_rider = defaultAttributes["has_rider"];
                        if (annotationObj["attributes"]["has_rider"] !== undefined) {
                            has_rider = annotationObj["attributes"]["has_rider"]
                        }
                        attributesJSON["boolean"].push({
                            "name": "has_rider",
                            "val": has_rider
                        });
                    }

                    objects[annotationObj["trackId"]] = {
                        object_data: {
                            name: annotationObj["class"] + "_" + annotationObj["trackId"].substring(0, 8),
                            type: annotationObj["class"],
                            cuboid: {
                                name: "shape3D",
                                val: [
                                    posX,
                                    posY,
                                    posZ,
                                    quat.x,
                                    quat.y,
                                    quat.z,
                                    quat.w,
                                    length,
                                    width,
                                    height,
                                ],
                                attributes: attributesJSON
                            }
                        }
                    }
                }
            }
            let annotationsInFrameJSON = {
                openlabel: {
                    metadata: {
                        schema_version: "1.0.0"
                    },
                    coordinate_systems: labelTool.annotationObjects["coordinate_systems"][j],
                    frames: {
                        [j.toString()]: {
                            frame_properties: labelTool.frameProperties[j],
                            objects: objects,
                        }
                    },
                    streams: labelTool.annotationObjects["streams"][j],
                }
            }
            annotationFiles.push(JSON.stringify(annotationsInFrameJSON));
        }
        return annotationFiles;
    }

}
