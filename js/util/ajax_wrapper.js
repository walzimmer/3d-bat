function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function request(options) {
    if (options.type === "GET") {
        let res;
        switch (options.url) {
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
    if (labelTool.showOriginalNuScenesLabels === true) {
        url = 'input/' + labelTool.currentDataset + '/annotations_original/' + channel + '/' + labelTool.fileNames[fileIndex] + '.json';

    } else {
        url = 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' +labelTool.fileNames[fileIndex] +'.json';

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
        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                rawFile.open("GET", 'input/' + labelTool.currentDataset + '/annotations_original/LIDAR_TOP/' + fileName, false);
            } else {
                rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/LIDAR_TOP/' + fileName, false);
            }
        } else {
            rawFile.open("GET", 'input/' + labelTool.currentDataset + '/' + labelTool.currentSequence + '/annotations/' + fileName, false);
        }


    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                if (labelTool.currentDataset === labelTool.datasets.NuScenes && labelTool.showOriginalNuScenesLabels === true) {
                    let str_list = rawFile.responseText.split("\n");
                    for (let i = 0; i < str_list.length; i++) {
                        let str = str_list[i].split(" ");
                        if (str.length === 16) {
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
                        } else if (str.length === 18) {
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
                                trackId: str[16],
                                fileIndex: str[17]
                            });
                        }
                    }
                    return frameAnnotations;
                } else {
                    let annotationsJSONString = rawFile.responseText;
                    annotationsJSONArray = JSON.parse(annotationsJSONString);
                    return annotationsJSONArray;
                }
            } else {
                return null;
            }
        }
    };
    rawFile.send(null);
    if (labelTool.showOriginalNuScenesLabels === true) {
        return frameAnnotations;
    } else {
        return annotationsJSONArray;
    }

}
