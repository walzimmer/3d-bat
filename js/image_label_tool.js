var canvas = document.getElementById("jpeg-label-canvas");
var c = {};
var paper = Raphael(canvas, c.width, c.height);
var curImg = new Image();
var img;
var startX = 0;
var startY = 0;
var updateFlag = false;
var drawingRect = null;
var emphasisRect = null;
var fontSize = 20;
var isDragging = false; // For distinguishing click and drag.
var grabbedPosition = {
    x: 0,
    y: 0
};
var action = "add";
var grabbedSide = "";
var zoomParam = {offsetX: 0, offsetY: 0, scale: 1};
var mouseX = 0;
var mouseY = 0;
var isIsolated = false;
var nextTrackIds = [1, 1, 1, 1, 1];//Vehicle,Truck, Motorcycle, Bicycle, Pedestrian

/*********** Event handlers **************/

annotationObjects.onRemove("Image", function (index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    removeBoundingBoxHighlight(index);
    removeTextBox(index);
    annotationObjects.get(index, "Image")["rect"].remove();
});

annotationObjects.onSelect("Image", function (newIndex, oldIndex) {
    removeBoundingBoxHighlight(oldIndex);
    removeTextBox(oldIndex);
    addTextBox(newIndex);
    emphasisBBox(newIndex);
    if (isIsolated) {
        hideAllBoundingBoxes(newIndex);
    }
    // highlight bb in BEV
    for (var mesh in labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex]) {
        var meshObject = labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][mesh];
        meshObject.material.opacity = 0.1;
    }
    if (labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][newIndex] !== undefined) {
        labelTool.cubeArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex][newIndex].material.opacity = 0.5;
    }


});

annotationObjects.onAdd("Image", function (index, cls, params) {
    var bbox = {
        "rect": paper.rect(params.x, params.y, params.width, params.height)
            .attr({
                "stroke": classesBoundingBox[cls].color,
                "stroke-width": 3
            }),
        "trackId": 1
    };
    bbox["rect"].node.setAttribute("pointer-events", "none");

    labelTool.savedFrames[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = false;
    return bbox;
});

labelTool.onInitialize("Image", function () {
    c = {
        x: canvas.offsetLeft,
        y: canvas.offsetTop,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
    };
    keepAspectRatio();
    labelTool.addResizeEventForImage();

    labelTool.savedFrames = [];
    for (var i = 0; i < 3962; i++) {
        labelTool.savedFrames.push([]);
        for (var j = 0; j < 6; j++) {
            labelTool.savedFrames[i].push(false);
        }
    }
});

labelTool.onLoadData("Image", function () {
    var imgURL = labelTool.workBlob + "/JPEGImages/" + labelTool.camChannels[labelTool.currentCameraChannelIndex] + "/" + labelTool.getTargetFileName() + ".jpg";
    if (img != undefined) {
        img.remove();
    }
    img = paper.image(imgURL, 0, 0, "100%", "100%");
    img.toBack();
    addEventsToImage();
    labelTool.hasLoadedImage = true;
});

annotationObjects.onChangeClass("Image", function (bbIndex, newClass) {
    if (!annotationObjects.exists(bbIndex, "Image")) {
        return;
    }
    var bbox = annotationObjects.get(bbIndex, "Image");
    var color = classesBoundingBox[newClass].color;
    bbox["rect"].attr({stroke: color});
    if (bbox["textBox"] != undefined) {
        var textBox = bbox["textBox"];
        textBox["text"].attr({text: bboxString(bbIndex, newClass)});
        var box = textBox["text"].getBBox();
        textBox["box"].attr({
            fill: color,
            stroke: "none",
            width: box.width
        });
    }
    $("#label-tool-log").val("5. Repeat steps 1-5, download annotations and continue with next frame");
    $("#label-tool-log").css("color", "#969696");
});

$(window).keydown(function (e) {
    var e2 = convertPositionToPaper(e);
    var isRectModifyFunction = 37 <= e.which && e.which <= 40;
    var isRectSelectFunction = e.which == 9;
    var isFrameSelectFunction = e.which == 66 || e.which == 78;
    var rect;
    if (isRectModifyFunction) {
        if (labelTool.getTargetDataType() != "Image") {
            return;
        }
        if (annotationObjects.getTarget("Image") == undefined) {
            return;
        } else {
            rect = annotationObjects.getTarget("Image")["rect"]
        }
    }
    var keyCode = e.which.toString();
    if (e.shiftKey) {
        keyCode += "SHIFT";
    }
    var minsize = classesBoundingBox.target().minSize;
    switch (keyCode) {
        case "37SHIFT": // left arrow + shift
            rect.attr({width: Math.max(rect.attr("width") - 1, minsize.x)});
            break;
        case "38SHIFT": // up arrow + shift
            rect.attr({height: Math.max(rect.attr("height") - 1, minsize.y)});
            break;
        case "39SHIFT": // right arrow + shift
            rect.attr({width: Math.min(rect.attr("width") + 1, c.width - rect.attr("x"))});
            break;
        case "40SHIFT": // down arrow + shift
            rect.attr({height: Math.min(rect.attr("height") + 1, c.height - rect.attr("y"))});
            break;
        case "37": // left arrow
            rect.attr({x: Math.max(rect.attr("x") - 1, 0)});
            break;
        case "38": // up arrow
            rect.attr({y: Math.max(rect.attr("y") - 1, 0)});
            break;
        case "39": // left arrow
            rect.attr({x: Math.min(rect.attr("x") + 1, c.width - rect.attr("width"))});
            break;
        case "40": // up arrow
            rect.attr({y: Math.min(rect.attr("y") + 1, c.height - rect.attr("height"))});
            break;
        case "78": // N
            labelTool.nextFrame();
            break;
        case "66": // B
            labelTool.previousFrame();
            break;
        case "9": // Tab
            annotationObjects.selectNext();
            e.preventDefault();
            break;
        case "32": // Space
            if (zoomParam.scale == 1) {
                zoomImage(-mouseX / 2, -mouseY / 2, 2);
            } else {
                zoomImage(0, 0, 1);
            }
            break;
        case "84": // T
            toggleIsolation();
            break;
        case "68": // D
            annotationObjects.removeTarget("Image");
            break;
    }
    if (isRectModifyFunction) {
        adjustTextBox(annotationObjects.getTargetIndex());
        emphasisBBox(annotationObjects.getTargetIndex());
    }
    setAction(e);
});

function setCursor(cursorType) {
    img.attr({cursor: cursorType});
}

function convertPositionToPaper(e) {
    var rv = {
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX: e.pageX,
        pageY: e.pageY,
        which: e.which
    };
    rv.offsetX = e.offsetX / zoomParam.scale - zoomParam.offsetX;
    rv.offsetY = e.offsetY / zoomParam.scale - zoomParam.offsetY;
    return rv;
}

function setAction(e) {
    if (isDragging) {
        return;
    }
    setCursor("crosshair");
    action = "add";
    var bbox = annotationObjects.getTarget("Image");
    if (bbox == undefined) {
        return;
    }
    var targetRect = bbox["rect"];
    if (e.offsetX < targetRect.attr("x") - 5 ||
        e.offsetX > targetRect.attr("x") + targetRect.attr("width") + 5 ||
        e.offsetY < targetRect.attr("y") - 5 ||
        e.offsetY > targetRect.attr("y") + targetRect.attr("height") + 5) {
        return;
    }
    grabbedSide = "";
    if (e.offsetX <= targetRect.attr("x") + 2) {
        grabbedSide += "left";
    }
    if (e.offsetX >= targetRect.attr("x") + targetRect.attr("width") - 2) {
        grabbedSide += "right";
    }
    if (e.offsetY <= targetRect.attr("y") + 2) {
        grabbedSide += "top";
    }
    if (e.offsetY >= targetRect.attr("y") + targetRect.attr("height") - 2) {
        grabbedSide += "bottom";
    }
    if (grabbedSide == "") {
        setCursor("all-scroll");
        action = "move";
    } else {
        action = "resize";
        if (grabbedSide == "left" || grabbedSide == "right") {
            setCursor("ew-resize");
        } else if (grabbedSide == "top" || grabbedSide == "bottom") {
            setCursor("ns-resize");
        } else if (grabbedSide == "lefttop" || grabbedSide == "rightbottom") {
            setCursor("nwse-resize");
        } else {
            setCursor("nesw-resize");
        }
    }
}

function addEventsToImage() {
    img.mousemove(function (e) {
        var e2 = convertPositionToPaper(e);
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        setAction(e2);
    });

    img.mousedown(function (e) {
        var e2 = convertPositionToPaper(e);
        if (e2.which != 3 || isDragging) {
            return;
        }
        var clickedBBIndex = getClickedIndex(e2);
        if (clickedBBIndex != -1) {
            // check if currently selected box was not selected previously
            if (clickedBBIndex != annotationObjects.getTargetIndex()) {
                annotationObjects.select(clickedBBIndex);
            }
            annotationObjects.remove(clickedBBIndex, "Image");
            setAction(e2);
        } else {
            // no bounding box was selected
            // remove selection from current target
            var selectedBBIndex = annotationObjects.getTargetIndex();
            removeBoundingBoxHighlight(selectedBBIndex);
            removeTextBox(selectedBBIndex);
            this.__table.selectEmpty();
        }

    });

    img.drag(
        //on drag
        function (dx, dy, x, y, e) {
            // TODO: automatically activate bounding box after placement
            $("#label-tool-log").val("2. Activate current bounding box");
            $("#label-tool-log").css("color", "#969696");
            var e2 = convertPositionToPaper(e);
            if (e2.which != 1) {
                isDragging = false;
            }
            if (isOutOfCanvas(e2.pageX, e2.pageY)) {
                return;
            }
            var minSize = classesBoundingBox.target().minSize;
            var minX = minSize.x;
            var minY = minSize.y;
            switch (action) {
                case "add":
                    var rect = drawingRect;
                    var width = e2.offsetX - startX;
                    var height = e2.offsetY - startY;
                    if (!isDragging && (Math.abs(width) > 1 || Math.abs(height) > 1)) {
                        isDragging = true;
                    }
                    if (width < 0) {
                        rect.attr({width: -width, x: e2.offsetX});
                    } else {
                        rect.attr({width: width, x: startX});
                    }
                    if (height < 0) {
                        rect.attr({height: -height, y: e2.offsetY});
                    } else {
                        rect.attr({height: height, y: startY});
                    }
                    break;
                case "resize":
                    var bbox = annotationObjects.getTarget("Image");
                    var rect = bbox["rect"];
                    if (grabbedSide.match(/left/)) {
                        var validX = Math.min(e2.offsetX, rect.attr("x") + rect.attr("width") - minX);
                        rect.attr({x: validX, width: rect.attr("x") + rect.attr("width") - validX});
                        var textBoxDict = annotationObjects.getTarget("Image")["textBox"];
                        textBoxDict["text"].attr({x: rect.attr("x")});
                        textBoxDict["box"].attr({x: rect.attr("x")});
                    }
                    if (grabbedSide.match(/right/)) {
                        var validX = Math.max(e2.offsetX, rect.attr("x") + minX);
                        rect.attr({width: validX - rect.attr("x")});
                    }
                    if (grabbedSide.match(/top/)) {
                        var validY = Math.min(e2.offsetY, rect.attr("y") + rect.attr("height") - minY);
                        rect.attr({y: validY, height: rect.attr("y") + rect.attr("height") - validY});
                        var textBoxDict = annotationObjects.getTarget("Image")["textBox"];
                        textBoxDict["text"].attr({y: rect.attr("y") - fontSize / 2});
                        textBoxDict["box"].attr({y: rect.attr("y") - fontSize});
                    }
                    if (grabbedSide.match(/bottom/)) {
                        var validY = Math.max(e2.offsetY, rect.attr("y") + minY);
                        rect.attr({height: validY - rect.attr("y")});
                    }
                    emphasisBBox(annotationObjects.getTargetIndex());
                    break;
                case "move":
                    var rect = annotationObjects.getTarget("Image")["rect"];
                    var newRectX = e2.offsetX - grabbedPosition.x;
                    var newRectY = e2.offsetY - grabbedPosition.y;
                    if (newRectX + rect.attr("width") > c.width) {
                        newRectX = c.width - rect.attr("width");
                    } else if (newRectX < 0) {
                        newRectX = 0;
                    }
                    if (newRectY + rect.attr("height") > c.height) {
                        newRectY = c.height - rect.attr("height");
                    } else if (newRectY < 0) {
                        newRectY = 0;
                    }
                    rect.attr({x: newRectX, y: newRectY});
                    var textBox = annotationObjects.getTarget("Image")["textBox"];
                    textBox["text"].attr({x: newRectX, y: newRectY - fontSize / 2});
                    textBox["box"].attr({x: newRectX, y: newRectY - fontSize});
                    emphasisBBox(annotationObjects.getTargetIndex());
                    break;
            }

        },

        //on click
        function (x, y, e) {
            var e2 = convertPositionToPaper(e);
            if (e2.which != 1) {
                return;
            }
            switch (action) {
                case "add":
                    drawingRect = paper.rect(e2.offsetX, e2.offsetY, 0, 0);
                    drawingRect.attr({
                        stroke: classesBoundingBox.target().color,
                        "stroke-width": 3
                    });
                    drawingRect.node.setAttribute("pointer-events", "none");
                    startX = e2.offsetX;
                    startY = e2.offsetY;
                    break;
                case "resize":
                    isDragging = true;
                    break;
                case "move":
                    isDragging = true;
                    if (annotationObjects.getTarget("Image") == undefined) {
                        return;
                    }
                    grabbedPosition.x = e2.offsetX - annotationObjects.getTarget("Image")["rect"].attr("x");
                    grabbedPosition.y = e2.offsetY - annotationObjects.getTarget("Image")["rect"].attr("y");
                    break;
            }
        },

        //on end
        function (e) {
            var e2 = convertPositionToPaper(e);
            var rectX;
            var rectY;
            var rectHeight;
            var rectWidth;
            if (drawingRect != undefined && drawingRect != null) {
                rectX = drawingRect.attr("x");
                rectY = drawingRect.attr("y");
                rectWidth = drawingRect.attr("width");
                rectHeight = drawingRect.attr("height");
                drawingRect.remove();
            } else {
                return;
            }
            if (e2.which != 1) {
                return;
            }
            if (!isDragging) {
                var index = getClickedIndex(e2);
                annotationObjects.select(index);
                setAction(e2);
                return;
            }
            isDragging = false;
            switch (action) {
                case "add":
                    if (rectWidth < classesBoundingBox.target().minSize.x ||
                        rectHeight < classesBoundingBox.target().minSize.y) {
                        return;
                    }

                    var selectedClassIndex = classesBoundingBox.target().index;
                    var selectedClassInImage = classesBoundingBox.targetName();

                    var bbox = annotationObjects.getTarget("Image");
                    if (!annotationObjects.isValidTarget() || bbox != undefined) {
                        annotationObjects.expand(selectedClassInImage, nextTrackIds[selectedClassIndex]);
                        annotationObjects.selectTail();
                    }


                    var params = {
                        x: rectX,
                        y: rectY,
                        width: rectWidth,
                        height: rectHeight,
                        trackId: nextTrackIds[selectedClassIndex]
                    };
                    nextTrackIds[selectedClassIndex] = nextTrackIds[selectedClassIndex] + 1;
                    annotationObjects.setTarget("Image", params);

                    annotationObjects.selectEmpty();
                    drawingRect.remove();

                    break;
                case "resize":
                    break;
                case "move":
                    break;
            }
            setAction(e2);
        }
    );
}

function toggleIsolation() {
    if (isIsolated) {
        showAllBoundingBoxes();
    } else {
        hideAllBoundingBoxes();
    }
    isIsolated = !isIsolated;
}

function hideAllBoundingBoxes(index) {
    var targetIndex;
    if (index == undefined) {
        targetIndex = annotationObjects.getTargetIndex();
    } else {
        targetIndex = index;
    }
    for (var i = 0; i < annotationObjects.length(); ++i) {
        if (i != targetIndex) {
            hideImageBBox(i);
        } else {
            showImageBBox(i);
        }
    }
}

function showAllBoundingBoxes() {
    for (var i = 0; i < annotationObjects.length(); ++i) {
        if (i != annotationObjects.getTargetIndex()) {
            showImageBBox(i);
        }
    }
}

/**
 * Iterate all bounding boxes and check which one was selected
 * @param e
 * @returns {*}
 */
function getClickedIndex(e) {
    var targetIndex = -1;
    // var targetIndex = annotationObjects.__tail + 1;
    for (var i = 0; i < annotationObjects.length(); ++i) {
        if (annotationObjects.get(i, "Image") == undefined) {
            continue;
        }
        var rect = annotationObjects.get(i, "Image")["rect"];
        if (e.offsetX >= rect.attr("x") &&
            e.offsetX <= rect.attr("x") + rect.attr("width") &&
            e.offsetY >= rect.attr("y") &&
            e.offsetY <= rect.attr("y") + rect.attr("height")) {
            targetIndex = i;
            // if (targetIndex == annotationObjects.getTargetIndex()) {
            return i;
            // }
        }
    }
    return targetIndex;
}

addEvent(canvas, 'contextmenu', function (e) {
    return cancelDefault(e);
});

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
        }
        var r = element.attachEvent('on' + trigger, element[trigger + action]);
        return r;
    }
    else {
        element['on' + trigger] = action;
        return true;
        4
    }
}

function convertPositionToFile(x, y) {
    return [Math.round(x * labelTool.originalSize[0] / c.width),
        Math.round(y * labelTool.originalSize[1] / c.height)]
}

function convertPositionToCanvas(x, y) {
    return [Math.round(x * c.width / labelTool.originalSize[0]),
        Math.round(y * c.height / labelTool.originalSize[1])];
}

function keepAspectRatio() {
    $(function () {
        var windowWidth = $("#label-tool-wrapper").width() - 170;
        var width = Math.max(windowWidth, 500);
        var height = width * 5 / 8;
        var windowHeight = $("#label-tool-wrapper").height();
        if (height > windowHeight) {
            height = Math.max(windowHeight - 10, 300);
            width = height * 8 / 5;
            width = windowWidth < width ? windowWidth - 5 : width;
            width = width < 500 ? 500 : width;
        }
        changeCanvasSize(width / 2, height / 2);
    });
}

function zoomImage(offsetX, offsetY, scale) {
    var size = scale * 100;
    paper.setSize($('#jpeg-label-canvas').width() * scale, $('#jpeg-label-canvas').height() * scale);
    paper.setViewBox(-offsetX, -offsetY, $('#jpeg-label-canvas').width(), $('#jpeg-label-canvas').height(), true);
    zoomParam.offsetX = offsetX;
    zoomParam.offsetY = offsetY;
    zoomParam.scale = scale;
}

function changeCanvasSize(width, height) {
    $(function () {
        $('#jpeg-label-canvas').css('width', width + 'px');
        $('#jpeg-label-canvas').css('height', height + 'px');
        paper.setViewBox(0, 0, width, height, true);
        paper.setSize("100%", "100%");
        fontSize = canvas.offsetWidth / 50;
        if (fontSize < 15) {
            fontSize = 15;
        }
        adjastAllBBoxes();
        c = {
            x: canvas.offsetLeft,
            y: canvas.offsetTop,
            width: canvas.offsetWidth,
            height: canvas.offsetHeight,
            center: {x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2}
        }
    });
}

function adjastAllBBoxes() {
    for (var i = 0; i < annotationObjects.length(); ++i) {
        if (!annotationObjects.exists(i, "Image")) {
            continue;
        }
        var rect = annotationObjects.get(i, "Image")["rect"];
        rect.attr({
            width: rect.attr("width") * canvas.offsetWidth / c.width,
            height: rect.attr("height") * canvas.offsetHeight / c.height,
            x: rect.attr("x") * canvas.offsetWidth / c.width,
            y: rect.attr("y") * canvas.offsetHeight / c.height
        });
        var textBox = annotationObjects.get(i, "Image")["textBox"];
        if (textBox == undefined) {
            continue;
        }
        textBox["text"].attr({
            x: rect.attr("x"),
            y: rect.attr("y") - fontSize / 2,
            "font-size": fontSize,
            text: bboxString(i, annotationObjects.get(i, "class"))
        });
        var box = textBox["text"].getBBox();
        textBox["box"].attr({x: box.x, y: box.y, width: box.width, height: box.height});
        emphasisBBox(i);
    }
}

function isOutOfCanvas(posX, posY) {
    return posX < c.x || posX > c.x + c.width || posY < c.y || posY > c.y + c.height;
}

function hideImageBBox(index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    annotationObjects.get(index, "Image")["rect"].hide();
}

function showImageBBox(index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    annotationObjects.get(index, "Image")["rect"].show();
}

function emphasisBBox(index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    removeBoundingBoxHighlight(index);
    var rect = annotationObjects.get(index, "Image")["rect"];
    rect.g = rect.glow({color: "#FFF", width: 5, opacity: 1});
    rect.g[0].node.setAttribute("pointer-events", "none");
    rect.g[1].node.setAttribute("pointer-events", "none");
    rect.g[2].node.setAttribute("pointer-events", "none");
    rect.g[3].node.setAttribute("pointer-events", "none");
    const x0 = rect.attr("x");
    const x1 = rect.attr("x") + rect.attr("width") / 2;
    const x2 = rect.attr("x") + rect.attr("width");
    const y0 = rect.attr("y");
    const y1 = rect.attr("y") + rect.attr("height") / 2;
    const y2 = rect.attr("y") + rect.attr("height");
    rect.l = [paper.path("M" + x1 + "," + y0 + " L" + x1 + "," + y2),
        paper.path("M" + x0 + "," + y1 + " L" + x2 + "," + y1)];
    for (var i = 0; i <= 1; ++i) {
        rect.l[i].attr({"stroke-dasharray": "."});
        rect.l[i].node.setAttribute("pointer-events", "none");
        rect.l[i].g = rect.l[i].glow({color: "#FFF", width: 1});
        rect.l[i].g[0].node.setAttribute("pointer-events", "none");
    }
    rect.toFront();
}

function removeBoundingBoxHighlight(index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    var rect = annotationObjects.get(index, "Image")["rect"];
    if (rect.g != undefined) {
        rect.g.remove();
    }
    if (rect.l != undefined) {
        rect.l[0].g.remove();
        rect.l[0].remove();
        rect.l[1].g.remove();
        rect.l[1].remove();
        delete rect.l;
    }
}

function addTextBox(bbIndex) {
    if (!annotationObjects.exists(bbIndex, "Image")) {
        return;
    }
    var bbox = annotationObjects.get(bbIndex, "Image");
    var trackId = annotationObjects.contents[bbIndex]["Image"]["trackId"];
    var posX = bbox["rect"].attr("x");
    var posY = bbox["rect"].attr("y");
    var cls = annotationObjects.get(bbIndex, "class");
    var firstLetterOfClass = cls.charAt(0);
    bbox["textBox"] =
        {
            text: paper.text(posX, posY - fontSize / 2, "#" + firstLetterOfClass + trackId + " " + cls)
                .attr({
                    fill: "black",
                    "font-size": fontSize,
                    "text-anchor": "start"
                })
        };
    // bbox["textBox"]["text"].attr("text", bboxString(bbIndex, cls));
    var box = bbox["textBox"]["text"].getBBox();
    bbox["textBox"]["box"] = paper.rect(box.x, box.y, box.width, box.height)
        .attr({
            fill: classesBoundingBox[cls].color,
            stroke: "none"
        });
    bbox["textBox"]["box"].node.setAttribute("pointer-events", "none");
    bbox["textBox"]["text"].node.setAttribute("pointer-events", "none");
    bbox["textBox"]["text"].toFront();
}

function removeTextBox(index) {
    if (!annotationObjects.exists(index, "Image")) {
        return;
    }
    var bbox = annotationObjects.get(index, "Image");
    if (bbox["textBox"] == undefined) {
        return;
    }
    bbox["textBox"]["text"].remove();
    bbox["textBox"]["box"].remove();
    delete bbox["textBox"];
}

function bboxString(index, label) {
    var firstLetterOfClass = label.charAt(0);
    var trackId = index + 1;
    if (fontSize == 15) {
        return "text", "#" + firstLetterOfClass + trackId.toString();
    } else {
        return "#" + firstLetterOfClass + trackId.toString() + " " + label;
    }
}

function adjustTextBox(index) {
    var rect = annotationObjects.get(index, "Image")["rect"];
    var textBox = annotationObjects.get(index, "Image")["textBox"];
    textBox["text"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize / 2});
    textBox["box"].attr({x: rect.attr("x"), y: rect.attr("y") - fontSize - 1});
}
