let canvasArray = [];
let canvasParamsArray = [{}, {}, {}, {}, {}, {}];
let paperArray = [];
let paperArrayAll = [];
let imageArray = [];
let imageArrayAll = [];
let fontSize = 20;
let isDragging = false; // For distinguishing click and drag.
let action = "add";
let mouseX = 0;
let mouseY = 0;

function remove(index) {
    // TODO: highlight 12 lines (draw 4 transparent (0.5) parallelograms and 2 transparent rectangles (front and rear))
    // removeBoundingBoxHighlight(index);
    removeTextBox(index);
}

/*********** Event handlers **************/

annotationObjects.onRemove("CAMERA", function (index) {
    remove(index);
});

function select(newIndex, channel) {

    for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        if (annotationObjects.contents[labelTool.currentFileIndex][i]["text"] !== undefined) {
            removeTextBox(i);
        }

    }
    if (annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][0].channel === channel) {
        if (annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][0]["lines"] !== undefined && annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][0]["lines"][0] !== undefined
            && !isNaN(annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][0]["lines"][0]) && isFinite(annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][0]["lines"][0])) {
            // emphasize only possible if 2D bb exists
            addTextBox(newIndex, channel);
        }
    } else {
        if (annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][1]["lines"] !== undefined && annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][1]["lines"][0] !== undefined
            && !isNaN(annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][1]["lines"][0]) && isFinite(annotationObjects.contents[labelTool.currentFileIndex][newIndex]["channels"][1]["lines"][0])) {
            addTextBox(newIndex, channel);
        }
    }

    // unhighlight bb in BEV
    for (let mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
        let meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
        meshObject.material.opacity = 0.9;
    }
    // highlight selected bb in BEV
    if (labelTool.cubeArray[labelTool.currentFileIndex][newIndex] !== undefined) {
        labelTool.cubeArray[labelTool.currentFileIndex][newIndex].material.opacity = 0.1;
    }
}

annotationObjects.onSelect("CAM_FRONT_LEFT", function (newIndex) {
    select(newIndex, "CAM_FRONT_LEFT");
});

annotationObjects.onSelect("CAM_FRONT", function (newIndex) {
    select(newIndex, "CAM_FRONT");
});

annotationObjects.onSelect("CAM_FRONT_RIGHT", function (newIndex) {
    select(newIndex, "CAM_FRONT_RIGHT");
});

annotationObjects.onSelect("CAM_BACK_RIGHT", function (newIndex) {
    select(newIndex, "CAM_BACK_RIGHT");
});

annotationObjects.onSelect("CAM_BACK", function (newIndex) {
    select(newIndex, "CAM_BACK");
});

annotationObjects.onSelect("CAM_BACK_LEFT", function (newIndex) {
    select(newIndex, "CAM_BACK_LEFT");
});

function initialize(camChannel) {
    let canvas = canvasArray[getChannelIndexByName(camChannel)];
    if (canvas !== undefined) {
        canvasParamsArray[getChannelIndexByName(camChannel)] = {
            x: canvas.offsetLeft,
            y: canvas.offsetTop,
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
            center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
        };
        let width;
        let height;
        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
            width = 320;
            height = 180;
        }
        changeCanvasSize(width, height, camChannel);
        labelTool.addResizeEventForImage();
    }
}

labelTool.onInitialize("CAM_FRONT_LEFT", function () {
    initialize("CAM_FRONT_LEFT");
});

labelTool.onInitialize("CAM_FRONT", function () {
    initialize("CAM_FRONT");
});

labelTool.onInitialize("CAM_FRONT_RIGHT", function () {
    initialize("CAM_FRONT_RIGHT");
});

labelTool.onInitialize("CAM_BACK_RIGHT", function () {
    initialize("CAM_BACK_RIGHT");
});

labelTool.onInitialize("CAM_BACK", function () {
    initialize("CAM_BACK");
});

labelTool.onInitialize("CAM_BACK_LEFT", function () {
    initialize("CAM_BACK_LEFT");
});

function loadCameraImages(camChannel, fileIndex) {
    let imgPath = "input/" + labelTool.currentDataset + "/" + labelTool.sequence + "/images/" + camChannel + "/" + labelTool.fileNames[fileIndex] + ".jpg";
    let channelIdx = getChannelIndexByName(camChannel);
    let paper = paperArrayAll[fileIndex][channelIdx];
    imageArray[channelIdx] = paper.image(imgPath, 0, 0, "100%", "100%");
}

function changeClass(bbIndex, newClass) {
    let annotation = annotationObjects.contents[labelTool.currentFileIndex][bbIndex];
    let color = classesBoundingBox[newClass].color;
    // update color in all 6 channels
    for (let i = 0; i < annotation["channels"].length; i++) {
        if (annotation["channels"][i]["lines"] !== undefined && annotation["channels"][i]["lines"][0] !== undefined) {
            for (let lineObj in annotation["channels"][i]["lines"]) {
                if (annotation["channels"][i]["lines"].hasOwnProperty(lineObj)) {
                    let line = annotation["channels"][i]["lines"][lineObj];
                    line.attr({stroke: color});
                }
            }
        }
    }
}

annotationObjects.onChangeClass("CAM_FRONT_LEFT", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

annotationObjects.onChangeClass("CAM_FRONT", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

annotationObjects.onChangeClass("CAM_FRONT_RIGHT", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

annotationObjects.onChangeClass("CAM_BACK_RIGHT", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

annotationObjects.onChangeClass("CAM_BACK", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

annotationObjects.onChangeClass("CAM_BACK_LEFT", function (bbIndex, newClass) {
    changeClass(bbIndex, newClass);
});

$(window).keydown(function (e) {
    let keyCode = e.which.toString();
    if (e.shiftKey) {
        keyCode += "SHIFT";
    }
    switch (keyCode) {
        case "78": // N
            labelTool.nextFrame();
            break;
        case "66": // B
            labelTool.previousFrame();
            break;
    }
    setAction(e);
});

function setCursor(cursorType) {
    for (let img in imageArray) {
        let imgObj = imageArray[img];
        imgObj.attr({cursor: cursorType});
    }
}

function convertPositionToPaper(e) {
    return {
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX: e.pageX,
        pageY: e.pageY,
        which: e.which
    };
}

function setAction(e) {
    if (isDragging) {
        return;
    }
    setCursor("hand");//crosshair
}

function addEventsToImage(img) {
    img.mousemove(function (e) {
        let e2 = convertPositionToPaper(e);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        setAction(e2);
    });

    img.mousedown(function (e) {
        let e2 = convertPositionToPaper(e);
        // 3: rightclick
        if (e2.which != 3 || isDragging) {
            return;
        }
        let clickedBBIndex = getClickedIndex(e2);
        if (clickedBBIndex != -1) {
            annotationObjects.remove(clickedBBIndex);
            annotationObjects.selectEmpty();
        } else {
            // no bounding box was selected
            // remove selection from current target
            let selectedBBIndex = annotationObjects.getSelectionIndex();
            // removeBoundingBoxHighlight(selectedBBIndex);
            removeTextBox(selectedBBIndex);
        }
    });

}

function isWithinPolygon(numVertices, xPosArray, yPosArray, mouseXPos, mouseYPos) {
    let i, j, c = false;
    for (i = 0, j = numVertices - 1; i < numVertices; j = i++) {
        if (((yPosArray[i] > mouseYPos) != (yPosArray[j] > mouseYPos)) &&
            (mouseXPos < (xPosArray[j] - xPosArray[i]) * (mouseYPos - yPosArray[i]) / (yPosArray[j] - yPosArray[i]) + xPosArray[i])) {
            c = !c;
        }
    }
    return c;
}

/**
 * Iterate all bounding boxes and check which one was selected
 * @param e
 * @returns {*}
 */
function getClickedIndex(e) {
    let mouseXPos = e.offsetX;
    let mouseYPos = e.offsetY;
    let targetIndex = -1;
    for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        for (let j = 0; j < annotationObjects.contents[labelTool.currentFileIndex][i]["channels"].length; j++) {
            let points2D = annotationObjects.contents[labelTool.currentFileIndex][i]["channels"][j]["points2D"];
            let xPosArray = [];
            let yPosArray = [];
            for (let k = 0; k < points2D.length; k++) {
                xPosArray.push(points2D[k].x);
                yPosArray.push(points2D[k].y);
            }
            if (isWithinPolygon(points2D.length, xPosArray, yPosArray, mouseXPos, mouseYPos)) {
                return i;
            }
        }
    }
    return targetIndex;
}

for (let canvasElem in canvasArray) {
    let canvas = canvasArray[canvasElem];
    addEvent(canvas, 'contextmenu', function (e) {
        return cancelDefault(e);
    });
}

function cancelDefault(e) {
    e = e || window.event;
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = false;
    return false;
}

function addEvent(element, trigger, action) {
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

function getChannelIndexByName(camChannel) {
    for (let channelObj in labelTool.camChannels) {
        if (labelTool.camChannels.hasOwnProperty(channelObj)) {
            let channelObject = labelTool.camChannels[channelObj];
            if (camChannel === channelObject.channel) {
                return labelTool.camChannels.indexOf(channelObject);
            }
        }
    }
}

function changeCanvasSize(width, height, camChannel) {
    let channelIdx = getChannelIndexByName(camChannel);
    let paper = paperArray[channelIdx];
    let canvas = canvasArray[channelIdx];
    let element = $("#" + canvas.id);
    element.css('width', width + 'px');
    element.css('height', height + 'px');
    paper.setViewBox(0, 0, width, height, true);
    paper.setSize("100%", "100%");
    fontSize = canvas.offsetWidth / 50;
    if (fontSize < 15) {
        fontSize = 15;
    }

    canvasParamsArray[channelIdx] = {
        x: canvas.offsetLeft,
        y: canvas.offsetTop,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
    };
}

function addTextBox(bbIndex, camChannel) {
    let bbox = annotationObjects.contents[labelTool.currentFileIndex][bbIndex];
    let trackId = bbox["trackId"];
    let channelIdx = getChannelIndexByName(camChannel);
    let posX = bbox["channels"][channelIdx]["lines"][5].attr("x");
    let posY = bbox["rect"].attr("y");
    let label = bbox["class"];
    let firstLetterOfClass = label.charAt(0);
    let paper = paperArray[getChannelIndexByName(camChannel)];
    bbox["textBox"] =
        {
            text: paper.text(posX, posY - fontSize / 2, "#" + firstLetterOfClass + trackId + " " + label)
                .attr({
                    fill: "black",
                    "font-size": fontSize,
                    "text-anchor": "start"
                })
        };
    let box = bbox["textBox"]["text"].getBBox();
    bbox["textBox"]["box"] = paper.rect(box.x, box.y, box.width, box.height)
        .attr({
            fill: classesBoundingBox[label].color,
            stroke: "none"
        });
    bbox["textBox"]["box"].node.setAttribute("pointer-events", "none");
    bbox["textBox"]["text"].node.setAttribute("pointer-events", "none");
    bbox["textBox"]["text"].toFront();
}

function removeTextBox(index) {
    let bbox = annotationObjects.contents[labelTool.currentFileIndex][index];
    if (bbox["textBox"] === undefined) {
        return;
    }
    bbox["textBox"]["text"].remove();
    bbox["textBox"]["box"].remove();
    delete bbox["textBox"];
}

function bboxString(index, label) {
    let firstLetterOfClass = label.charAt(0);
    let trackId = index + 1;
    return "#" + firstLetterOfClass + trackId.toString() + " " + label;
    // TODO: adjust text length corresponding to font size
}

function adjustTextBox(index) {
    let rect = annotationObjects.contents[labelTool.currentFileIndex][index]["rect"];
    let textBox = annotationObjects.contents[labelTool.currentFileIndex][index]["textBox"];
    textBox["text"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize / 2});
    textBox["box"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize - 1});
}