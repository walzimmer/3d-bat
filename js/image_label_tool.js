var canvasArray = [document.getElementById("jpeg-label-canvas-front-left"), document.getElementById("jpeg-label-canvas-front"), document.getElementById("jpeg-label-canvas-front-right"), document.getElementById("jpeg-label-canvas-back-right"), document.getElementById("jpeg-label-canvas-back"), document.getElementById("jpeg-label-canvas-back-left")];
var canvasParamsArray = [{}, {}, {}, {}, {}, {}];
var imgFrontLeft, imgFront, imgFrontRight, imgBackRight, imgBack, imgBackLeft;
var paperArray = [Raphael(canvasArray[0], 640, 360), Raphael(canvasArray[1], 640, 360), Raphael(canvasArray[2], 640, 360), Raphael(canvasArray[3], 640, 360), Raphael(canvasArray[4], 640, 360), Raphael(canvasArray[5], 640, 360)];
var imageArray = [imgFrontLeft, imgFront, imgFrontRight, imgBackRight, imgBack, imgBackLeft];
var fontSize = 20;
var isDragging = false; // For distinguishing click and drag.
var action = "add";
// var grabbedSide = "";
var mouseX = 0;
var mouseY = 0;

// var isIsolated = false;

function remove(index) {
    // TODO: highlight 12 lines (draw 4 transparent (0.5) parallelograms and 2 transparent rectangles (front and rear))
    // removeBoundingBoxHighlight(index);
    removeTextBox(index);
    // annotationObjects.contents[index]["rect"].remove();
    // annotationObjects.contents[index]["rect"].remove();
}

/*********** Event handlers **************/

annotationObjects.onRemove("CAMERA", function (index) {
    remove(index);
});

function select(newIndex, channel) {

    for (var i = 0; i < annotationObjects.contents.length; i++) {
        // if (annotationObjects.contents[i]["rect"] !== undefined) {
        //     removeBoundingBoxHighlight(i);
        // }
        if (annotationObjects.contents[i]["text"] !== undefined) {
            removeTextBox(i);
        }

    }
    if (annotationObjects.contents[newIndex]["channels"][0].channel === channel) {
        if (annotationObjects.contents[newIndex]["channels"][0]["lines"] !== undefined) {
            // if (annotationObjects.contents[newIndex]["rect"] !== undefined) {
            // emphasize only possible if 2D bb exists
            addTextBox(newIndex, channel);
            // emphasizeBBox(newIndex, channel);
        }
    } else {
        if (annotationObjects.contents[newIndex]["channels"][1]["lines"] !== undefined) {
            addTextBox(newIndex, channel);
        }
    }


    // if (isIsolated) {
    //     hideAllBoundingBoxes(newIndex);
    // }
    // unhighlight bb in BEV
    for (var mesh in labelTool.cubeArray[labelTool.currentFileIndex]) {
        var meshObject = labelTool.cubeArray[labelTool.currentFileIndex][mesh];
        meshObject.material.opacity = 0.1;
    }
    // highlight selected bb in BEV
    if (labelTool.cubeArray[labelTool.currentFileIndex][newIndex] !== undefined) {
        labelTool.cubeArray[labelTool.currentFileIndex][newIndex].material.opacity = 0.5;
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
    var canvas = canvasArray[getChannelIndexByName(camChannel)];
    canvasParamsArray[getChannelIndexByName(camChannel)] = {
        x: canvas.offsetLeft,
        y: canvas.offsetTop,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
    };
    changeCanvasSize(640, 360, camChannel);
    labelTool.addResizeEventForImage();
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

function loadData(camChannel) {
    var imgURL = labelTool.workBlob + "/JPEGImages/" + camChannel + "/" + labelTool.getTargetFileName() + ".jpg";
    let channelIdx = getChannelIndexByName(camChannel);
    var img = imageArray[channelIdx];
    if (img !== undefined) {
        img.remove();
    }
    var paper = paperArray[channelIdx];
    imageArray[channelIdx] = paper.image(imgURL, 0, 0, "100%", "100%");
    imageArray[channelIdx].toBack();
    addEventsToImage(imageArray[channelIdx]);
    labelTool.hasLoadedImage = true;
}

labelTool.onLoadData("CAM_FRONT_LEFT", function () {
    loadData("CAM_FRONT_LEFT");
});

labelTool.onLoadData("CAM_FRONT", function () {
    loadData("CAM_FRONT");
});

labelTool.onLoadData("CAM_FRONT_RIGHT", function () {
    loadData("CAM_FRONT_RIGHT");
});

labelTool.onLoadData("CAM_BACK_RIGHT", function () {
    loadData("CAM_BACK_RIGHT");
});

labelTool.onLoadData("CAM_BACK", function () {
    loadData("CAM_BACK");
});

labelTool.onLoadData("CAM_BACK_LEFT", function () {
    loadData("CAM_BACK_LEFT");
});

function changeClass(bbIndex, newClass) {
    let notificationElem = $("#label-tool-log");
    notificationElem.val("5. Repeat steps 1-5, download annotations and continue with next frame");
    notificationElem.css("color", "#969696");
    let annotation = annotationObjects.contents[bbIndex];
    let color = classesBoundingBox[newClass].color;
    if (annotation["channels"][0]["lines"] !== undefined) {
        annotation["channels"][0]["lines"].attr({stroke: color});
    }
    if (annotation["channels"][1]["lines"] !== undefined) {
        annotation["channels"][1]["lines"].attr({stroke: color});
    }
    let textBox;
    if (annotation["channels"][0]["textBox"] !== undefined) {
        textBox = annotation["channels"][0]["textBox"];
    } else if (annotation["channels"][0]["textBox"] !== undefined) {
        textBox = annotation["channels"][1]["textBox"];
    } else {
        // no textbox
        return;
    }
    textBox["text"].attr({text: bboxString(bbIndex, newClass)});
    let box = textBox["text"].getBBox();
    textBox["box"].attr({
        fill: color,
        stroke: "none",
        width: box.width
    });
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
        case "84": // T
            toggleIsolation();
            break;
        case "68": // D
            annotationObjects.removeSelectedBoundingBox();
            break;
    }
    setAction(e);
});

function setCursor(cursorType) {
    for (var img in imageArray) {
        var imgObj = imageArray[img];
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
    setCursor("crosshair");
    // action = "add";
    // let bbox = undefined;
    // let selectedBoundingBox = annotationObjects.getSelectedBoundingBox();
    // if (selectedBoundingBox !== undefined) {
    //     bbox = selectedBoundingBox;
    // } else {
    //     return;
    // }

    // var targetRect = bbox["rect"];
    // if (e.offsetX < targetRect.attr("x") - 5 ||
    //     e.offsetX > targetRect.attr("x") + targetRect.attr("width") + 5 ||
    //     e.offsetY < targetRect.attr("y") - 5 ||
    //     e.offsetY > targetRect.attr("y") + targetRect.attr("height") + 5) {
    //     return;
    // }
    // grabbedSide = "";
    // if (e.offsetX <= targetRect.attr("x") + 2) {
    //     grabbedSide += "left";
    // }
    // if (e.offsetX >= targetRect.attr("x") + targetRect.attr("width") - 2) {
    //     grabbedSide += "right";
    // }
    // if (e.offsetY <= targetRect.attr("y") + 2) {
    //     grabbedSide += "top";
    // }
    // if (e.offsetY >= targetRect.attr("y") + targetRect.attr("height") - 2) {
    //     grabbedSide += "bottom";
    // }
    // if (grabbedSide == "") {
    //     setCursor("all-scroll");
    //     action = "move";
    // } else {
    //     action = "resize";
    //     if (grabbedSide == "left" || grabbedSide == "right") {
    //         setCursor("ew-resize");
    //     } else if (grabbedSide == "top" || grabbedSide == "bottom") {
    //         setCursor("ns-resize");
    //     } else if (grabbedSide == "lefttop" || grabbedSide == "rightbottom") {
    //         setCursor("nwse-resize");
    //     } else {
    //         setCursor("nesw-resize");
    //     }
    // }
}

function addEventsToImage(img) {
    img.mousemove(function (e) {
        var e2 = convertPositionToPaper(e);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        setAction(e2);
    });

    img.mousedown(function (e) {
        var e2 = convertPositionToPaper(e);
        // 3: rightclick
        if (e2.which != 3 || isDragging) {
            return;
        }
        var clickedBBIndex = getClickedIndex(e2);
        if (clickedBBIndex != -1) {
            annotationObjects.remove(clickedBBIndex);
            annotationObjects.selectEmpty();
        } else {
            // no bounding box was selected
            // remove selection from current target
            var selectedBBIndex = annotationObjects.getSelectionIndex();
            // removeBoundingBoxHighlight(selectedBBIndex);
            removeTextBox(selectedBBIndex);
        }
    });

    // imgLeft.drag(
    //     //on drag
    //     function (dx, dy, x, y, e) {
    //         $("#label-tool-log").val("2. Activate current bounding box");
    //         $("#label-tool-log").css("color", "#969696");
    //         var e2 = convertPositionToPaper(e);
    //         if (e2.which != 1) {
    //             isDragging = false;
    //         }
    //         if (e2.which == 0) {
    //             // return if right click and in drag mode
    //             return;
    //         }
    //         if (isOutOfCanvas(e2.pageX, e2.pageY)) {
    //             return;
    //         }
    //         var minSize = classesBoundingBox.target().minSize;
    //         var minX = minSize.x;
    //         var minY = minSize.y;
    //         switch (action) {
    //             case "add":
    //                 var rect = drawingRectLeft;
    //                 var width = e2.offsetX - startX;
    //                 var height = e2.offsetY - startY;
    //                 if (!isDragging && (Math.abs(width) > 1 || Math.abs(height) > 1)) {
    //                     isDragging = true;
    //                 }
    //                 if (width < 0) {
    //                     rect.attr({width: -width, x: e2.offsetX});
    //                 } else {
    //                     rect.attr({width: width, x: startX});
    //                 }
    //                 if (height < 0) {
    //                     rect.attr({height: -height, y: e2.offsetY});
    //                 } else {
    //                     rect.attr({height: height, y: startY});
    //                 }
    //                 break;
    //             case "resize":
    //                 var bbox = annotationObjects.getSelectedBoundingBox("ImageLeft");
    //                 var rect = bbox["rect"];
    //                 if (grabbedSide.match(/left/)) {
    //                     var validX = Math.min(e2.offsetX, rect.attr("x") + rect.attr("width") - minX);
    //                     rect.attr({x: validX, width: rect.attr("x") + rect.attr("width") - validX});
    //                     var textBoxDict = annotationObjects.getSelectedBoundingBox("ImageLeft")["textBox"];
    //                     textBoxDict["text"].attr({x: rect.attr("x")});
    //                     textBoxDict["box"].attr({x: rect.attr("x")});
    //                 }
    //                 if (grabbedSide.match(/right/)) {
    //                     var validX = Math.max(e2.offsetX, rect.attr("x") + minX);
    //                     rect.attr({width: validX - rect.attr("x")});
    //                 }
    //                 if (grabbedSide.match(/top/)) {
    //                     var validY = Math.min(e2.offsetY, rect.attr("y") + rect.attr("height") - minY);
    //                     rect.attr({y: validY, height: rect.attr("y") + rect.attr("height") - validY});
    //                     var textBoxDict = annotationObjects.getSelectedBoundingBox("ImageLeft")["textBox"];
    //                     textBoxDict["text"].attr({y: rect.attr("y") - fontSize / 2});
    //                     textBoxDict["box"].attr({y: rect.attr("y") - fontSize});
    //                 }
    //                 if (grabbedSide.match(/bottom/)) {
    //                     var validY = Math.max(e2.offsetY, rect.attr("y") + minY);
    //                     rect.attr({height: validY - rect.attr("y")});
    //                 }
    //                 emphasizeBBox(annotationObjects.getSelectionIndex(), "ImageLeft");
    //                 break;
    //             case "move":
    //                 var rect = annotationObjects.getSelectedBoundingBox("ImageLeft")["rect"];
    //                 var newRectX = e2.offsetX - grabbedPosition.x;
    //                 var newRectY = e2.offsetY - grabbedPosition.y;
    //                 if (newRectX + rect.attr("width") > canvasLeftParams.width) {
    //                     newRectX = canvasLeftParams.width - rect.attr("width");
    //                 } else if (newRectX < 0) {
    //                     newRectX = 0;
    //                 }
    //                 if (newRectY + rect.attr("height") > canvasLeftParams.height) {
    //                     newRectY = canvasLeftParams.height - rect.attr("height");
    //                 } else if (newRectY < 0) {
    //                     newRectY = 0;
    //                 }
    //                 rect.attr({x: newRectX, y: newRectY});
    //                 var textBox = annotationObjects.getSelectedBoundingBox("ImageLeft")["textBox"];
    //                 textBox["text"].attr({x: newRectX, y: newRectY - fontSize / 2});
    //                 textBox["box"].attr({x: newRectX, y: newRectY - fontSize});
    //                 emphasizeBBox(annotationObjects.getSelectionIndex(), "ImageLeft");
    //                 break;
    //         }
    //
    //     },

    // //on click
    // function (x, y, e) {
    //     var e2 = convertPositionToPaper(e);
    //     if (e2.which != 1) {
    //         return;
    //     }
    //     switch (action) {
    //         case "add":
    //             drawingRectLeft = paperLeft.rect(e2.offsetX, e2.offsetY, 0, 0);
    //             drawingRectLeft.attr({
    //                 stroke: classesBoundingBox.target().color,
    //                 "stroke-width": 3
    //             });
    //             drawingRectLeft.node.setAttribute("pointer-events", "none");
    //             startX = e2.offsetX;
    //             startY = e2.offsetY;
    //             break;
    //         case "resize":
    //             isDragging = true;
    //             break;
    //         case "move":
    //             isDragging = true;
    //             if (annotationObjects.getSelectedBoundingBox("ImageLeft") == undefined) {
    //                 return;
    //             }
    //             grabbedPosition.x = e2.offsetX - annotationObjects.getSelectedBoundingBox("ImageLeft")["rect"].attr("x");
    //             grabbedPosition.y = e2.offsetY - annotationObjects.getSelectedBoundingBox("ImageLeft")["rect"].attr("y");
    //             break;
    //     }
    // },
    //
    // //on end
    // function (e) {
    //     var e2 = convertPositionToPaper(e);
    //     var rectX;
    //     var rectY;
    //     var rectHeight;
    //     var rectWidth;
    //     if (drawingRectLeft != undefined && drawingRectLeft != null) {
    //         rectX = drawingRectLeft.attr("x");
    //         rectY = drawingRectLeft.attr("y");
    //         rectWidth = drawingRectLeft.attr("width");
    //         rectHeight = drawingRectLeft.attr("height");
    //         drawingRectLeft.remove();
    //     } else {
    //         return;
    //     }
    //     if (e2.which != 1) {
    //         return;
    //     }
    //     if (!isDragging) {
    //         // remove all previous selections in camera image
    //         for (var i = 0; i < annotationObjects.contents.length; i++) {
    //             removeBoundingBoxHighlight(i,"ImageLeft");
    //             removeTextBox(i,"ImageLeft");
    //         }
    //         // remove all previous selections in birds eye view (lower opacity)
    //         for (var mesh in labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex]) {
    //             var meshObject = labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][mesh];
    //             meshObject.material.opacity = 0.1;
    //         }
    //         var selectedBoundingBoxIndex = getClickedIndex(e2,"ImageLeft");
    //         annotationObjects.select(selectedBoundingBoxIndex);
    //         if (selectedBoundingBoxIndex !== -1) {
    //             // select class in class selection list
    //             var label = annotationObjects.contents[selectedBoundingBoxIndex]["class"];
    //             var selectedClassIndex = classesBoundingBox[label].index;
    //             $('#class-picker ul li').css('background-color', '#323232');
    //             $($('#class-picker ul li')[selectedClassIndex]).css('background-color', '#525252');
    //         }
    //         setAction(e2);
    //         return;
    //     }
    //     isDragging = false;
    //     switch (action) {
    //         case "add":
    //             if (rectWidth < classesBoundingBox.target().minSize.x ||
    //                 rectHeight < classesBoundingBox.target().minSize.y) {
    //                 return;
    //             }
    //
    //
    //             var params = {
    //                 x: rectX,
    //                 y: rectY,
    //                 width: rectWidth,
    //                 height: rectHeight,
    //                 trackId: -1
    //             };
    //             var selectedBoundingBoxIndex = annotationObjects.getSelectionIndex();
    //             if (selectedBoundingBoxIndex !== -1) {
    //                 // a bounding box was already selected
    //                 // replace the selected bounding box with the new one
    //                 // use track id of that selected bounding box
    //                 var label = classesBoundingBox.targetName();
    //                 var trackId = annotationObjects.contents[selectedBoundingBoxIndex]["trackId"];
    //                 params.trackId = trackId;
    //                 annotationObjects.remove(selectedBoundingBoxIndex, "ImageLeft");
    //
    //                 annotationObjects.setSelection(selectedBoundingBoxIndex, "ImageLeft", params, label, false);
    //                 // select class in class selection list
    //                 var selectedClassIndex = classesBoundingBox[label].index;
    //                 $('#class-picker ul li').css('background-color', '#323232');
    //                 $($('#class-picker ul li')[selectedClassIndex]).css('background-color', '#525252');
    //                 // annotationObjects.select(selectedBoundingBoxIndex);
    //             } else {
    //                 // insert new object (bounding box)
    //                 var insertIndex = annotationObjects.__insertIndex;
    //                 var trackId = classesBoundingBox.target().nextTrackId;
    //                 params.trackId = trackId;
    //                 annotationObjects.setSelection(insertIndex, "ImageLeft", params, classesBoundingBox.targetName(), false);
    //                 // annotationObjects.selectTail();
    //                 classesBoundingBox.target().nextTrackId++;
    //             }
    //             annotationObjects.selectEmpty();
    //             drawingRectLeft.remove();
    //             break;
    //         case "resize":
    //             break;
    //         case "move":
    //             break;
    //     }
    //     setAction(e2);
    // }
    // );
}

// function toggleIsolation() {
//     if (isIsolated) {
//         showAllBoundingBoxes();
//     } else {
//         hideAllBoundingBoxes();
//     }
//     isIsolated = !isIsolated;
// }

// function hideAllBoundingBoxes(index) {
//     var targetIndex;
//     if (index == undefined) {
//         targetIndex = annotationObjects.getSelectionIndex();
//     } else {
//         targetIndex = index;
//     }
//     for (var i = 0; i < annotationObjects.length(); ++i) {
//         if (i != targetIndex) {
//             hideImageBBox(i);
//         } else {
//             showImageBBox(i);
//         }
//     }
// }

// function showAllBoundingBoxes() {
//     for (var i = 0; i < annotationObjects.length(); ++i) {
//         if (i != annotationObjects.getSelectionIndex()) {
//             showImageBBox(i);
//         }
//     }
// }

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
// TODO: check if clicked mouse position is within convex hull of projected bounding box
function getClickedIndex(e) {
    let mouseXPos = e.offsetX;
    let mouseYPos = e.offsetY;
    let targetIndex = -1;
    for (let i = 0; i < annotationObjects.contents.length; i++) {
        for (let j = 0; j < annotationObjects.contents[i]["channels"].length; j++) {
            let points2D = annotationObjects.contents[i]["channels"][j]["points2D"];
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
        // var rect = annotationObjects.contents[i]["rect"];
        // if (e.offsetX >= rect.attr("x") &&
        //     e.offsetX <= rect.attr("x") + rect.attr("width") &&
        //     e.offsetY >= rect.attr("y") &&
        //     e.offsetY <= rect.attr("y") + rect.attr("height")) {
        //     targetIndex = i;
        //     return i;
        // }
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
    }
    else if (element.attachEvent) {
        element['e' + trigger + action] = action;
        element[trigger + action] = function () {
            element['e' + trigger + action](window.event);
        };
        var r = element.attachEvent('on' + trigger, element[trigger + action]);
        return r;
    }
    else {
        element['on' + trigger] = action;
        return true;
    }
}

function convertPositionToFile(x, y, camChannel) {
    let canvasParams = canvasParamsArray[getChannelIndexByName(camChannel)];
    return [Math.round(x * labelTool.originalSize[0] / canvasParams.width),
        Math.round(y * labelTool.originalSize[1] / canvasParams.height)]
}

function convertPositionToCanvas(x, y, camChannel) {
    let canvasParams = canvasParamsArray[getChannelIndexByName(camChannel)];
    return [Math.round(x * canvasParams.width / labelTool.originalSize[0]),
        Math.round(y * canvasParams.height / labelTool.originalSize[1])];
}

// function keepAspectRatio() {
//     $(function () {
//         var windowWidth = $("#label-tool-wrapper").width() - 170;
//         var width = Math.max(windowWidth, 500);
//         var height = width * 5 / 8;
//         var windowHeight = $("#label-tool-wrapper").height();
//         if (height > windowHeight) {
//             height = Math.max(windowHeight - 10, 300);
//             width = height * 8 / 5;
//             width = windowWidth < width ? windowWidth - 5 : width;
//             width = width < 500 ? 500 : width;
//         }
//         // changeCanvasSize(width / 2, height / 2);
//         changeCanvasLeftSize(640, 360);
//     });
// }

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
    $(function () {
        for (let canvasElem in canvasArray) {
            let canvasElement = canvasArray[canvasElem];
            let element = $("#" + canvasElement.id);
            element.css('width', width + 'px');
            element.css('height', height + 'px');
            // $('#jpeg-label-canvas-front-left').css('width', width + 'px');
            // $('#jpeg-label-canvas-front-left').css('height', height + 'px');
        }

        paper.setViewBox(0, 0, width, height, true);
        paper.setSize("100%", "100%");
        fontSize = canvas.offsetWidth / 50;
        if (fontSize < 15) {
            fontSize = 15;
        }
        adjustAllBBoxes(camChannel);
        canvasParamsArray[channelIdx] = {
            x: canvas.offsetLeft,
            y: canvas.offsetTop,
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
            center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
        }
    });
}

// TODO: adjust all projected bounding boxes if images size changes
function adjustAllBBoxes(camChannel) {
    for (var i = 0; i < annotationObjects.contents.length; ++i) {
        var canvas = canvasArray[getChannelIndexByName(camChannel)];
        var canvasParams = canvasParamsArray[getChannelIndexByName(camChannel)];
        var linesChannelOne = annotationObjects.contents[i]["channels"][0]["lines"];
        var linesChannelTwo = annotationObjects.contents[i]["channels"][1]["lines"];
        // var rect = annotationObjects.contents[i]["rect"];
        // rect.attr({
        //     width: rect.attr("width") * canvas.offsetWidth / canvasParams.width,
        //     height: rect.attr("height") * canvas.offsetHeight / canvasParams.height,
        //     x: rect.attr("x") * canvas.offsetWidth / canvasParams.width,
        //     y: rect.attr("y") * canvas.offsetHeight / canvasParams.height
        // });
        // var textBox = annotationObjects.contents[i]["textBox"];
        // if (textBox === undefined) {
        //     continue;
        // }
        // textBox["text"].attr({
        //     x: rect.attr("x"),
        //     y: rect.attr("y") - fontSize / 2,
        //     "font-size": fontSize,
        //     text: bboxString(i, annotationObjects.contents[i]["class"])
        // });
        // var box = textBox["text"].getBBox();
        // textBox["box"].attr({x: box.x, y: box.y, width: box.width, height: box.height});
        // emphasizeBBox(i, camChannel);
    }
}

// function isOutOfCanvas(posX, posY) {
//     return posX < canvasLeftParams.x || posX > canvasLeftParams.x + canvasLeftParams.width || posY < canvasLeftParams.y || posY > canvasLeftParams.y + canvasLeftParams.height;
// }

// function hideImageBBox(index) {
//     annotationObjects.contents[index]["rect"].hide();
// }

// function showImageBBox(index) {
//     annotationObjects.contents[index]["rect"].show();
// }

// TODO: emphasize/highlight projected bounding boxes
// function emphasizeBBox(index, camChannel) {
//     removeBoundingBoxHighlight(index);
//     var rect = annotationObjects.contents[index]["rect"];
//     rect.g = rect.glow({color: "#FFF", width: 5, opacity: 1});
//     rect.g[0].node.setAttribute("pointer-events", "none");
//     rect.g[1].node.setAttribute("pointer-events", "none");
//     rect.g[2].node.setAttribute("pointer-events", "none");
//     rect.g[3].node.setAttribute("pointer-events", "none");
//     const x0 = rect.attr("x");
//     const x1 = rect.attr("x") + rect.attr("width") / 2;
//     const x2 = rect.attr("x") + rect.attr("width");
//     const y0 = rect.attr("y");
//     const y1 = rect.attr("y") + rect.attr("height") / 2;
//     const y2 = rect.attr("y") + rect.attr("height");
//     var paper = paperArray[getChannelIndexByName(camChannel)];
//     rect.l = [paper.path("M" + x1 + "," + y0 + " L" + x1 + "," + y2),
//         paper.path("M" + x0 + "," + y1 + " L" + x2 + "," + y1)];
//     for (var i = 0; i <= 1; ++i) {
//         rect.l[i].attr({"stroke-dasharray": "."});
//         rect.l[i].node.setAttribute("pointer-events", "none");
//         rect.l[i].g = rect.l[i].glow({color: "#FFF", width: 1});
//         rect.l[i].g[0].node.setAttribute("pointer-events", "none");
//     }
//     rect.toFront();
// }

// function removeBoundingBoxHighlight(index) {
//     var rect = annotationObjects.contents[index]["rect"];
//     if (rect.g != undefined) {
//         rect.g.remove();
//     }
//     if (rect.l != undefined) {
//         rect.l[0].g.remove();
//         rect.l[0].remove();
//         rect.l[1].g.remove();
//         rect.l[1].remove();
//         delete rect.l;
//     }
// }

function addTextBox(bbIndex, camChannel) {
    var bbox = annotationObjects.contents[bbIndex];
    var trackId = bbox["trackId"];
    var posX = bbox["rect"].attr("x");
    var posY = bbox["rect"].attr("y");
    var label = bbox["class"];
    var firstLetterOfClass = label.charAt(0);
    var paper = paperArray[getChannelIndexByName(camChannel)];
    bbox["textBox"] =
        {
            text: paper.text(posX, posY - fontSize / 2, "#" + firstLetterOfClass + trackId + " " + label)
                .attr({
                    fill: "black",
                    "font-size": fontSize,
                    "text-anchor": "start"
                })
        };
    var box = bbox["textBox"]["text"].getBBox();
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
    var bbox = annotationObjects.contents[index];
    if (bbox["textBox"] === undefined) {
        return;
    }
    bbox["textBox"]["text"].remove();
    bbox["textBox"]["box"].remove();
    delete bbox["textBox"];
}

function bboxString(index, label) {
    var firstLetterOfClass = label.charAt(0);
    var trackId = index + 1;
    return "#" + firstLetterOfClass + trackId.toString() + " " + label;
    // TODO: adjust text length corresponding to font size
    // if (fontSize === 15) {
    // }
}

function adjustTextBox(index) {
    var rect = annotationObjects.contents[index]["rect"];
    var textBox = annotationObjects.contents[index]["textBox"];
    textBox["text"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize / 2});
    textBox["box"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize - 1});
}

// function getRect(params) {
//     var rect = paperArray[getChannelIndexByName(params.channel)].rect(params.x_img, params.y_img, params.width_img, params.height_img)
//         .attr({
//             "stroke": classesBoundingBox[params.class].color,
//             "stroke-width": 3
//         });
//     rect.node.setAttribute("pointer-events", "none");
//     return rect;
// }