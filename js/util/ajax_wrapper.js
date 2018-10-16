/* The alternatives of ajax functions for the stand alone version.
 *
 */

var __labelData = []

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
		var responseDict = {
		    file_names: ["000000", "000001","000002"]
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
		    res = parseAnnotationFile(fileName);
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

function parseAnnotationFile(fileName) {
    var rawFile = new XMLHttpRequest();
    var res = [];
    rawFile.open("GET", labelTool.workBlob + '/Annotations/' + fileName, false);
    rawFile.onreadystatechange = function (){
	if(rawFile.readyState === 4){
	    if(rawFile.status === 200 || rawFile.status == 0) {
		var allText = rawFile.responseText;
		var str_list = allText.split("\n");
		for (var i = 0 ; i < str_list.length ; i++) {
		    var str = str_list[i].split(" ");
		    if(str.length == 16){
			res.push({label: str[0],
				  truncated: str[1],
				  occluded: str[2],
				  alpha: str[3],
				  left: str[4],
				  top: str[5],
				  right: str[6],
				  bottom: str[7],
				  height: str[8],
				  width: str[9],
				  length:str[10],
				  x: str[11],
				  y: str[12],
				  z: str[13],
				  rotation_y: str[14]});
		    }
		}
	    }
	}
    }
    rawFile.send(null);
    return res;
}
