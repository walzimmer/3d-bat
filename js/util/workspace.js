// TODO:
//   implement JPEG feature of packAnnotation()
//	 implement JPEG feature
//   implement server sending feature of archiveWorkFiles()
//   implement branch feature bbox reader

// Instantiate with WorkSpace("PCD")

class WorkSpace {
    constructor(dataType) {
        this.classColor = {
            car: "blue",
            motorbike: "green",
            pedestrian: "red",
            bus: "yellow",
            truck: "white",
            cyclist: "orange",
            train: "cyan",
            obstacle: "purple",
            stop_signal: "red",
            wait_signal: "yellow",
            go_signal: "green"
        };
        this.labelId = -1;
        this.workBlob = ''; // Base url of blob
        this.curFile = 0; // Base name of current file
        this.fileList = [];
        this.dataType = dataType; // JPEG or PCD
        this.originalSize = [0, 0]; // Original size of jpeg image
        this.bboxes = []; // Bounding boxes
        this.results = []; // Replacement of azure blob for output
        this.originalBboxes = []; // For checking modified or not
        this.hold_flag = false; //Hold bbox flag
        this.labeling_files = [];
    }


    /********** Externally defined functions **********
     * Define with the prototype in the labeling tools.
     **************************************************/

    // Visualize 2d and 3d data
    showData() {
    }

    // Set values to this.bboxes from annotations
    loadAnnotations(annotations) {
    }

    // Create annotations from this.bboxes
    packAnnotations() {
    }


    /****************** Public functions **************/

    // Call this first to specify target label
    setLabelId(labelId) {
        this.labelId = labelId;
    }

    // Get informations of workspace (call this for initialization)
    getWorkFiles() {
        this.workBlob = "input"; // "https://devrosbag.blob.core.windows.net/labeltool/3d_label_test";
        this.curFile = 1; // For test (please make labeling tool start with frame:1)
        this.numFiles = 3962;
        this.fileList = ["000000", "000001", "000002"];
        // for (var i = 0; i < this.numFiles; i++) {
        //     this.fileList.append(i.toString())
        // }
        this.results = new Array(this.fileList.length);
        this.originalSize[0] = 800;
        this.originalSize[1] = 600;
        if (this.dataType == "JPEG") {
            dirBox.value = this.workBlob;
        } else {
            if (!Detector.webgl) Detector.addGetWebGLMessage();
            init();
            animate();
        }
        this.showData();
    }

    // Create workspace on server
    setWorkFiles() {
        this.getWorkFiles();
    }

    // Get annotations from server
    getAnnotations() {
        if (this.labeling_files.indexOf(this.fileList[this.curFile]) == -1) {
            this.labeling_files.push(this.fileList[this.curFile]);
            var res = [];
            var fileName = this.fileList[this.curFile] + ".txt";
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", this.workBlob + '/Annotations/' + fileName, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {
                        var allText = rawFile.responseText;
                        var str_list = allText.split("\n");
                        for (var i = 0; i < str_list.length; i++) {
                            var str = str_list[i].split(" ");
                            if (str.length == 16) {
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
                                    rotation_y: str[14]
                                });
                            }
                        }
                    }
                }
            }
            rawFile.send(null);
            this.loadAnnotations(res);
        } else {
            this.loadAnnotations(this.results[this.curFile]);
        }
    }

    // Output annotations
    setAnnotations() {
        this.pending = true;
        if (this.dataType == "JPEG") {
            textBox.value = "Sending... plz do nothing.";
        }
        var annotations = this.packAnnotations();
        this.results[this.curFile] = annotations;
    }

    previousFile() {
        if (this.curFile > 0) {
            this.setAnnotations();
            this.curFile--;
            this.onChangeFile();
        }
    }

    nextFile() {
        if (this.curFile < this.fileList.length - 1) {
            this.setAnnotations();
            this.curFile++;
            this.onChangeFile();
        }
    }

    jumpFile() {
        if (this.curFile < this.fileList.length - 1) {
            if (this.isModified()) {
                this.setAnnotations();
            }
            this.curFile = Number(pageBox.value) - 1;
            this.onChangeFile();
        }
    }

    onChangeFile() {
        if (this.dataType == "JPEG") {
            imageBox.value = (this.curFile + 1) + "/" + this.fileList.length; //TODO
        }
        ground_mesh.visible = false;
        image_array[0].visible = false;
        this.showData();
    }

    // Archive and update database
    archiveWorkFiles() {
        var annotations_result = this.results[1];
        alert(annotations_result)
    }
}
