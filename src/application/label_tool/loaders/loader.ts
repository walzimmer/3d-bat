import { Dataset } from "../../dataset/dataset";
import { LabelTool } from "../tool_main";
import { dataLoader } from "../loaders/dataloader";

export interface AnnotationsLoader {
    loadAnnotations: (frameObject: any, fileIndex: number, labelTool: LabelTool) => void;
    createAnnotationFiles: (labelTool: LabelTool) => any;
    getFilename: (labelTool: LabelTool, i: number) => string;
}


export default function getLoader(labelTool: LabelTool): AnnotationsLoader {
    return new dataLoader();
}
