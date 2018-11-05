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
    if (options.type == "GET") {
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
                    width: 800,
                    height: 600
                };
                var res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/file_names/":
                numFiles = 3962;
                fileNameArray = [];
                for (var i = 0; i < numFiles; i++) {
                    fileNameArray.push(pad(i, 6))
                }
                var responseDict = {
                    file_names: fileNameArray
                };
                var res = {responseText: JSON.stringify(responseDict)};
                options.complete(res);
                break;
            case "/label/annotations/":
                var fileName = options.data["file_name"];
                var res;
                if (fileName in __labelData) {
                    res = JSON.parse(__labelData[fileName]);
                } else {
                    res = parseAnnotationFile(fileName, options.data["channel"]);
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
};

function annotationFileExist(fileIndex,channelNumber) {
    var url = labelTool.workBlob + '/Annotations_test/' + labelTool.camChannels[channelNumber] + '/' + labelTool.fileNames[fileIndex] + '.txt';
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

function parseAnnotationFile(fileName, channel) {
    var rawFile = new XMLHttpRequest();
    var res = [];
    // var channel_array = ['LIDAR_TOP', 'CAM_FRONT', 'CAM_FRONT_RIGHT', 'CAM_FRONT_LEFT', 'CAM_BACK', 'CAM_BACK_RIGHT', 'CAM_BACK_LEFT'];
    // for (channel in channel_array) {
    try {
        rawFile.open("GET", labelTool.workBlob + '/Annotations_test/' + channel + '/' + fileName, false);
    } catch (error) {
        // no labels available for this camera image
        // do not through an error message
    }

    // rawFile.open("GET", labelTool.workBlob + '/Annotations/CAM_FRONT/' + fileName, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                var str_list = allText.split("\n");
                for (var i = 0; i < str_list.length; i++) {
                    var str = str_list[i].split(" ");
                    if (str.length == 17) {
                        res.push({
                            label: str[0],
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
                            trackId : str[16]
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
