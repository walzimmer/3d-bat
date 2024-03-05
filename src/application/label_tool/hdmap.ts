import * as path from 'path-browserify';
import {FileLoader, Group, LoadingManager, MathUtils, Object3D} from "three";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
// TODO: import tool 3d
// import {LabelTool3D} from "./tool_3d";
import {LabelTool} from "./tool_main";

export class HDMap {

    labelTool: LabelTool;
    // TODO: tool 3d
    // labelTool3D: LabelTool3D;
    hdmap: THREE.Group;
    static instance: HDMap;
    static objectName = 'hdmap';

    private constructor(labelTool: LabelTool) {
        this.labelTool = labelTool;
        // TODO: tool 3d
        // this.labelTool3D = this.labelTool.labelTool3D;
        this.loadHDMap();
        HDMap.instance = this;
    }

    private until(conditionFunction: () => boolean) {
        const poll = resolve => {
            if (conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), 100);
        }
        return new Promise(poll);
    }

    // Only load the hd map on first call, then re-use the object
    // Singleton pattern
    static getInstance(labelTool: LabelTool): HDMap {
        return HDMap.instance ?? new HDMap(labelTool);
    }

    async get(): Promise<THREE.Group> {
        await this.until(() => !!this.hdmap);
        return this.hdmap;
    }

    private saveHDMap(hdmap: THREE.Group) {
        this.hdmap = new Group();
        this.hdmap.copy(hdmap, true);
    }

    private applyTransforms(hdmap: THREE.Group, transforms: HDMapTransforms) {
        const posZ = -this.labelTool.positionLidar[2] / 2;
        if (transforms) {
            ['x', 'y', 'z'].forEach(axis => {
                hdmap.rotation[axis] = MathUtils.degToRad(transforms.rotation[axis])
                hdmap.position[axis] = transforms.position ? transforms.position[axis] : 0;
            });
            if (hdmap.position.z == 0) {
                hdmap.position.z = posZ;
            }
        }
    }

    private async loadHDMap() {
        try {
            const prefix = path.join('input', this.labelTool.currentDataset, HDMap.objectName, 'resources');
            const loader = new FileLoader();
            loader.load(path.join(prefix, 'transform.json'), (data) => {
                const transforms = JSON.parse(<string>data);
                const mtlLoader = new MTLLoader()
                mtlLoader.load(path.join(prefix, 'world.mtl'), (mtl) => {
                    mtl.preload();
                    const objLoader = new OBJLoader()
                    objLoader
                        .setMaterials(mtl)
                        .load(path.join(prefix, 'world.obj'),
                            (hdmap) => {
                                //this.applyTransforms(hdmap, transforms);
                                // rotate hd map (90° around x-axis) -> roll
                                hdmap.rotateX(Math.PI / 2);
                                // rotate hd map 180 degrees around y-axis -> yaw
                                let rotationYaw = 175;
                                // calculate yaw in radians
                                rotationYaw = MathUtils.degToRad(rotationYaw);
                                hdmap.rotateY(rotationYaw);

                                // rotate hd map 90 degrees around x-axis -> pitch
                                let rotationPitch = 1;
                                // calculate pitch in radians
                                rotationPitch = MathUtils.degToRad(rotationPitch);
                                hdmap.rotateX(rotationPitch);

                                let rotationRoll = -2;
                                // calculate pitch in radians
                                rotationRoll = MathUtils.degToRad(rotationRoll);
                                hdmap.rotateZ(rotationRoll);

                                // translate hd map to the center of the lidar

                                // translation east and west. positive is west
                                hdmap.translateX(895 - 24);
                                // translation north and south. positive is north
                                hdmap.translateZ(1077.5 - 8); //-> y is height
                                // translate hd map down to the ground by lidar height
                                hdmap.translateY((-this.labelTool.positionLidar[2] / 2) - 0.2);

                                hdmap.name = HDMap.objectName;
                                this.saveHDMap(hdmap);
                            },
                            () => {
                            },
                            (err) => console.error("ERROR when loading hdmap: ", err)
                        );
                });
            });
        } catch (e: any) {
            console.warn(`HDMap could not be loaded. \nError: \n${e.stack}`)
        }
    }
}

type HDMapTransforms = {
    position?: {
        x?: number,
        y?: number,
        z?: number
    },
    rotation: {
        x?: number,
        y?: number,
        z?: number
    }
}
