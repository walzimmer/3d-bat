function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function request(options) {
    if (options.type === "GET") {
        let responseDict;
        let res;
        switch (options.url) {
            case "/labels/":
                responseDict = {
                    blob: "input",
                    progress: 102
                };
                res = {responseText: JSON.stringify([responseDict])};
                options.complete(res);
                break;
            case "/label/annotations/":
                let fileName = options.data["file_name"];
                res = [];
                res = parseAnnotationFile(fileName);
                options.success(res);
                break;
        }
    }
}

function annotationFileExist(fileIndex, channel) {
    let url;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        url = 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + labelTool.currentDataset + "_" + labelTool.currentSequence + '_annotations.txt';
    } else {
        if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
            // load already created annotations provided by NuScenes
            url = 'input/' + labelTool.currentDataset + '/Annotations/' + channel + '/' + labelTool.fileNames[fileIndex] + '.txt';
        } else {
            // load annotations from user
            url = 'input/' + labelTool.currentDataset + '/Annotations_test/' + labelTool.fileNames[fileIndex] + '.txt';
        }
    }


    let http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status !== 404;
}

function parseAnnotationFile(fileName) {
    let rawFile = new XMLHttpRequest();
    let annotationsJSONArray = [];
    let frameAnnotations = [];
    try {
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + fileName, false);
        } else {
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                rawFile.open("GET", 'input/' + labelTool.currentDataset + '/Annotations/LIDAR_TOP/' + fileName, false);
            } else {
                rawFile.open("GET", 'input/' + labelTool.currentDataset + '/Annotations_test/' + fileName, false);
            }
        }


    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
                    let str_list = rawFile.responseText.split("\n");
                    for (let i = 0; i < str_list.length; i++) {
                        let str = str_list[i].split(" ");
                        if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes && str.length === 16) {
                            frameAnnotations.push({
                                class: str[0],
                                truncated: str[1],
                                occluded: str[2],
                                alpha: str[3],
                                left: str[4],
                                top: str[5],
                                right: str[6],
                                bottom: str[7],
                                height: str[8],
                                width: str[9],
                                length: str[10],
                                x: str[11],
                                y: str[12],
                                z: str[13],
                                rotationY: str[14],
                                score: str[15]
                            });
                        } else if (labelTool.showOriginalNuScenesLabels === false && labelTool.currentDataset === labelTool.datasets.NuScenes && str.length === 17) {
                            frameAnnotations.push({
                                class: str[0],
                                truncated: str[1],
                                occluded: str[2],
                                alpha: str[3],
                                left: str[4],
                                top: str[5],
                                right: str[6],
                                bottom: str[7],
                                height: str[8],
                                width: str[9],
                                length: str[10],
                                x: str[11],
                                y: str[12],
                                z: str[13],
                                rotationY: str[14],
                                score: str[15],
                                trackId: str[16]
                            });
                        }
                    }
                    return frameAnnotations;
                } else {
                    let annotationsJSONString = rawFile.responseText;
                    annotationsJSONArray = eval(annotationsJSONString);
                    return annotationsJSONArray;
                }
            } else {
                return null;
            }
        }
    };
    rawFile.send(null);
    if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
        return frameAnnotations;
    } else {
        return annotationsJSONArray;
    }

}
