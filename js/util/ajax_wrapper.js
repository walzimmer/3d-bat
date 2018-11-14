/* The alternatives of ajax functions for the stand alone version.
 *
 */

var __labelData = [];


function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function request(options) {
    if (options.type === "GET") {
        switch (options.url) {
            case "/labels/":
                var responseDict = {
                    blob: "input",
                    progress: 102
                };
                var res = {responseText: JSON.stringify([responseDict])};
                options.complete(res);
                break;
            case "/label/image_size/":
                var responseDict = {
                    width: 640,
                    height: 360
                };
                var res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/file_names/":
                let numFiles = 3962;
                let fileNameArray = [];
                for (let i = 0; i < numFiles; i++) {
                    fileNameArray.push(pad(i, 6))
                }
                let responseDict = {
                    file_names: fileNameArray
                };
                var res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/annotations/":
                let fileName = options.data["file_name"];
                var res = [];
                if (labelTool.loadNuScenesLabels === true) {
                    for (channelObj in labelTool.camChannels) {
                        if (labelTool.camChannels.hasOwnProperty(channelObj){
                            let channelObject = labelTool.camChannels[channelObj];
                            let channel = channelObject.channel;
                            // if (fileName in __labelData) {
                            //     res = JSON.parse(__labelData[fileName]);
                            // } else {
                            let resChannel = parseAnnotationFile(fileName, channel);
                            res.push({channel: resChannel});
                            // }
                        }

                    }

                } else {
                    // if (fileName in __labelData) {
                    //     res = JSON.parse(__labelData[fileName]);
                    // } else {
                    res = parseAnnotationFile(fileName, undefined);
                    // }
                }

                options.success(res);
                break;
        }
    } else if (options.type == "POST") {
        switch (options.url) {
            case "/label/annotations/":
                /* if (options.data["label_id"] == 2) {*/
                __labelData[options.data["file_name"]] = options.data["annotations"];
                options.success("None");
                /* } else {
                   options.error();
                   }*/
                break;
        }
    }
}

function annotationFileExist(fileIndex, channel) {
    let url;
    if (labelTool.loadNuScenesLabels === true) {
        // load already created annotations provided by NuScenes
        url = labelTool.workBlob + '/Annotations/' + channel + '/' + labelTool.fileNames[fileIndex] + '.txt';
    } else {
        // load annotations from user
        url = labelTool.workBlob + '/Annotations_test/' + labelTool.fileNames[fileIndex] + '.txt';
    }

    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function parseAnnotationFile(fileName, channel) {
    var rawFile = new XMLHttpRequest();
    var res = [];
    try {
        if (labelTool.loadNuScenesLabels === true) {
            rawFile.open("GET", labelTool.workBlob + '/Annotations/' + channel + '/' + fileName, false);
        } else {
            rawFile.open("GET", labelTool.workBlob + '/Annotations_test/' + fileName, false);
        }

    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                var str_list = allText.split("\n");
                for (var i = 0; i < str_list.length; i++) {
                    var str = str_list[i].split(" ");
                    if (labelTool.loadNuScenesLabels === true && str.length === 16) {
                        res.push({
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
                            rotation_y: str[14],
                            score: str[15]
                        });
                    } else if (labelTool.loadNuScenesLabels === false && str.length === 18) {
                        res.push({
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
                            rotation_y: str[14],
                            score: str[15],
                            trackId: str[16],
                            channel: str[17]
                        });
                    }
                }
                return res;
            } else {
                return null;
            }
        }
    };
    rawFile.send(null);
    return res;
}
