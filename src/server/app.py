import requests
from flask import *
from flask import Flask
from flask import request
from src.server.pre_annotate import predict_yaw
from src.server.active_learning import pvrcnn_inference
from os import path

app = Flask(__name__)


@app.route("/save_annotations", methods=['POST'])
def save_annotations():
    data = request.json

    for i in range(len(data['annotationFiles'])):
        filePath = path.join('input', data['dataset'], data['sequence'], 'annotations', data['lidarChannel']['channel'], data['fileNames'][i])
        with open(filePath, 'w') as f:
            f.write(data['annotationFiles'][i])

    return {
        'status': 'success'
    }

@app.route("/save_detections", methods=['POST'])
def save_detections():
    data = request.json

    for i in range(len(data['annotationFiles'])):
        filePath = path.join('input', data['dataset'], data['sequence'], 'annotations', data['lidarChannel']['channel'], data['fileNames'][i])
        with open(filePath, 'w') as f:
            f.write(data['annotationFiles'][i])

    return {
        'status': 'success'
    }


@app.route("/connect-to-workstation", methods=['POST'])
def connect_to_workstation():
    data = request.json
    if (data['mode'] == 'AL'):
        data_json = {
            'mode': data['mode'],
            'op': data['op'],
            'N_select': data['N_select'],
            'query': data['query'],
        }
        print(data_json)

    elif (data['mode'] == 'inference'):
        data_json = {
            'mode': data['mode'],
            'op': data['op'],
            'frame_ids': data['filenames'],
        }

    elif (data['mode'] == 'evaluation'):
        data_json = {
            'mode': data['mode'],
            'op': data['op'],
            'frame_ids': data['filenames'],
        }

    url = 'http://172.29.0.8:5000/run-docker-script'

    try:
        print("sending data to workstation")
        response = requests.post(url, json=data_json)
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:

        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(debug=True)

