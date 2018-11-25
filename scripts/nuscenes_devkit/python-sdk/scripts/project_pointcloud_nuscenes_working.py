from math import sqrt
import matplotlib as mpl
import matplotlib.cm as cm
import cv2
import numpy as np
from pyquaternion import Quaternion
import os
from nuscenes_utils.data_classes import PointCloud
from nuscenes_utils.geometry_utils import view_points
from nuscenes_utils.nuscenes import NuScenes

nusc = NuScenes(version='v0.1',
                dataroot='/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1',
                verbose=True)
pointsensor_channel = 'LIDAR_TOP'
camera_channel = 'CAM_FRONT'
my_sample = nusc.sample[0]
sample_token = my_sample['token']
sample_record = nusc.get('sample', sample_token)
pointsensor_token = sample_record['data'][pointsensor_channel]
camera_token = sample_record['data'][camera_channel]
cam = nusc.get('sample_data', camera_token)
img = cv2.imread(os.path.join(nusc.dataroot, cam['filename']))
pointsensor = nusc.get('sample_data', pointsensor_token)
point_cloud = PointCloud.from_file(os.path.join(nusc.dataroot, pointsensor['filename']))
# First step: transform the point-cloud to the ego vehicle frame for the timestamp of the sweep.
cs_record = nusc.get('calibrated_sensor', pointsensor['calibrated_sensor_token'])
point_cloud.rotate(Quaternion(cs_record['rotation']).rotation_matrix)
point_cloud.translate(np.array(cs_record['translation']))
# Forth step: transform the point-cloud to camera frame
cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])
point_cloud.translate(-np.array(cs_record['translation']))
point_cloud.rotate(Quaternion(cs_record['rotation']).rotation_matrix.T)
depths = point_cloud.points[2, :]
distances = []
for i in range(len(point_cloud.points[0, :])):
    point = point_cloud.points[:, i]
    distance = sqrt((point[0] ** 2) + (point[1] ** 2) + (point[2] ** 2))
    distances.append(distance)
points = view_points(point_cloud.points[:3, :], np.array(cs_record['camera_intrinsic']), normalize=True)
mask = np.ones(depths.shape[0], dtype=bool)
mask = np.logical_and(mask, depths > 0)
mask = np.logical_and(mask, points[0, :] > 1)
mask = np.logical_and(mask, points[0, :] < 1600 - 1)
mask = np.logical_and(mask, points[1, :] > 1)
mask = np.logical_and(mask, points[1, :] < 900 - 1)
points = points[:, mask]
distances_numpy = np.asarray(distances)
distances_numpy = distances_numpy[mask]
max_distance = max(distances_numpy)
norm = mpl.colors.Normalize(vmin=0, vmax=320)
cmap = cm.jet
m = cm.ScalarMappable(norm=norm, cmap=cmap)
for i in range(len(points[0, :])):
    posX = int(points[0, i])
    posY = int(points[1, i])
    if posX >= 0 and posX < 1600 and posY >= 0 and posY < 900:
        distance_idx = 255 - (int(distances_numpy[i] / max_distance * 255))
        color_rgba = m.to_rgba(distance_idx)
        color_rgb = (color_rgba[0] * 255, color_rgba[1] * 255, color_rgba[2] * 255)
        cv2.circle(img, (posX, posY), 4, color_rgb, thickness=-1)
cv2.imwrite("CAM_FRONT_000000_working.jpg", img)
