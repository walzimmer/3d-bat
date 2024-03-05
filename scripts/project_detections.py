import numpy as np
import os
import cv2
import json

# read 4 frames

path = '../output/projection_results/'
projection_matrices = []

# s40_far
projection_matrices.append(np.array(
    [[-5.35802524e+02, 9.09003992e+03, -3.72093178e+01, 3.82610365e+05],
     [-4.77936015e+01, 3.51841562e+01, -9.03153469e+03, 9.72826614e+04],
     [-9.95558291e-01, 7.55554009e-02, -5.61700232e-02, 4.65221911e+02]]))

# s40_near
projection_matrices.append(np.array(
    [[-4.19951579e+02, 2.89201624e+03, -2.48593171e+02, 2.36281904e+05],
     [3.38518175e+01, -5.46540587e+01, -2.84424002e+03, 7.74757596e+03],
     [-9.62740980e-01, 1.55067946e-01, -2.21548498e-01, 4.43080190e+02]]))

# s50_far
projection_matrices.append(np.array(
    [[1.20429007e+03, -8.81519960e+03, -1.11485728e+02, -4.59038459e+04],
     [-5.54761591e+01, 7.31604050e+01, -8.82353441e+03, 7.31091760e+04],
     [9.95798266e-01, 7.05062987e-02, -5.84352225e-02, 4.41625645e-02]]))

# s50_near
projection_matrices.append(np.array(
    [[9.40487461e+02, -2.82009326e+03, -2.01081143e+02, -1.48499626e+04],
     [-3.11563010e+01, 1.47347593e+01, -2.86468986e+03, 2.42678068e+04],
     [9.80955096e-01, 3.42417940e-04, -1.94234351e-01, 8.28553591e-01]]))

radius = 10
thickness = 10
camera_channels = ['s40_n_cam_far', 's40_n_cam_near', 's50_s_cam_far', 's50_s_cam_near']
camera_channel = 's40_n_cam_far'

# for idx, camera_channel in enumerate(camera_channels):
# path_detections = 'input/providentia/' + camera_channel + '/2021_01_24_10_' + camera_channel + '/annotations/2021_01_24_10_s40_n_cam_far_1611481801_238758096.json'
#path_detections = "../input/providentia/s40_n_cam_far/2021_01_24_10_s40_n_cam_far/annotations/2021_01_24_10_s40_n_cam_far_1611481801_238758096.json"
path_detections = "../input/providentia/s40_n_cam_far/2021_02_11_11_s40_n_cam_far/annotations/000000.json"
detections_object = []
with open(path_detections, 'r') as reader:
    detections_object = json.loads(reader.read())

img = cv2.imread(path + camera_channel + '_half.jpg')

projection_matrix = projection_matrices[0]
for obj in detections_object['labels']:
    point_3d = np.array([float(obj['box3d']['location']['x']), float(obj['box3d']['location']['y']),
                         float(obj['box3d']['location']['z']), 1.0])
    # project 3d point into camera

    projected_point = np.matmul(projection_matrix, point_3d)
    # divide by third coordinate
    projected_point[0] = projected_point[0] / projected_point[2]
    projected_point[1] = projected_point[1] / projected_point[2]
    cv2.circle(img, (int(projected_point[0]/2), int(projected_point[1]/2)), radius=radius, color=(0, 255, 0),
               thickness=thickness)

cv2.imwrite(path + camera_channel + '_half_results.jpg', img)
