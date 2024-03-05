# This code is copied from https://github.com/naurril/SUSTechPOINTS/blob/dev-auto-annotate/algos/pre_annotate.py

import tensorflow as tf
import numpy as np

import src.server.util as util

util.config_gpu()

RESAMPLE_NUM = 10

model_file = "./models/deep_annotation_inference.h5"

rotation_model = tf.keras.models.load_model(model_file)
# rotation_model.summary()

NUM_POINT=512

def sample_one_obj(points, num):
    if points.shape[0] < NUM_POINT:
        return np.concatenate([points, np.zeros((NUM_POINT-points.shape[0], 3), dtype=np.float32)], axis=0)
    else:
        idx = np.arange(points.shape[0])
        np.random.shuffle(idx)
        return points[idx[0:num]]

def predict_yaw(points):
    points = np.array(points).reshape((-1,3))
    input_data = np.stack([x for x in map(lambda x: sample_one_obj(points, NUM_POINT), range(RESAMPLE_NUM))], axis=0)
    pred_val = rotation_model.predict(input_data)
    pred_cls = np.argmax(pred_val, axis=-1)
    
    ret = (pred_cls[0]*3+1.5)*np.pi/180.
    ret =[0,0,ret]
    print(ret)
    return ret


# warmup the model
predict_yaw(np.random.random([1000,3]))
# try:
#     input = []
#     argSplit = argv[1].split(',')
#     for i in range(int(len(argSplit)/3)):
#         input.append([float(argSplit[i*3]), float(argSplit[i*3+1]), float(argSplit[i*3+2])])
#     predict_yaw(input)
# except Exception as e:
#     traceback.print_exc(file=stdout)