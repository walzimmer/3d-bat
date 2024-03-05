import { LabelTool } from "../label_tool/tool_main";

class FileOperations {


    constructor() {
    }

    static loadJSONFile(fileName) {
        // const data = require('../config/'+fileName);
        let jsonObject = undefined;
        let url = '../config/' + fileName;
        let http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        if (http.status !== 404) {
            // file exists
            let rawFile = new XMLHttpRequest();
            rawFile.open("GET", '../config/' + fileName, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status === 0) {
                        let jsonString = rawFile.responseText;
                        jsonObject = JSON.parse(jsonString);
                        return jsonObject;
                    }
                }
            }
            rawFile.send(null);
            return jsonObject;
        } else {
            // file not found
            console.log("config file not found.");
        }
    }

    static annotationFileExist(fileIndex, channel, labelTool) {
        let url;
        url = 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + labelTool.currentLidarChannel + '/' + labelTool.fileNames[fileIndex]
        let http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status !== 404;
    }

    static parseAnnotationFile(fileName: string, labelTool: LabelTool) {
        let rawFile = new XMLHttpRequest();
        let annotationsJSONArray = [];
        let frameAnnotations: any[] = [];

        try {
            rawFile.open("GET", '../../input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + labelTool.currentLidarChannel['channel'] + '/' + fileName, false);

        } catch (error) {
            // no labels available for this camera image
            // do not through an error message
        }
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status === 0) {
                    let annotationsJSONString = rawFile.responseText;
                    annotationsJSONArray = JSON.parse(annotationsJSONString);
                    return annotationsJSONArray;
                }
                else {
                    return null;
                }
            }
        };
        rawFile.send(null);
        return annotationsJSONArray;
    }

    static loadFileNames(fileName: string, labelTool: LabelTool) {

        let fileNameArray: any = undefined;
        let url = ""
        url  = '../../input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/' + fileName;
        let http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();

        if (http.status !== 404) {
            // file exists
            let rawFile = new XMLHttpRequest();
            rawFile.open("GET", url, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status === 0) {
                        fileNameArray = rawFile.responseText.split("\n");
                        fileNameArray = fileNameArray.filter(e => e);
                        return fileNameArray;
                    }
                }
            }
            rawFile.send(null);
            return fileNameArray;
        } else {
            // file not found
            console.log("File not found: " + fileName + ". Please execute: python scripts/create_filename_list.py");
        }
    }

    static loadColorMap(activeColorMap): string[] {
        let rawFile = new XMLHttpRequest();
        try {
            rawFile.open("GET", '../../assets/colormaps/' + activeColorMap, false);
        } catch (error) {
            console.log("Color map not found.");
            return [];
        }

        let colorMap: string[] = [];
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status === 0) {
                    let allText = rawFile.responseText;
                    colorMap = allText.replace(/"/g, '').split("\n");
                }
            }
        };
        rawFile.send(null);
        return colorMap;
    }

}

export {FileOperations};