from math import sqrt
import matplotlib as mpl
import matplotlib.cm as cm
import cv2
import numpy as np
from pyquaternion import Quaternion
import os
from nuscenes_utils.data_classes import PointCloud
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
rotation_matrix_lidar_to_ego = Quaternion(cs_record['rotation']).rotation_matrix
translation_vector_lidar_to_ego = np.array(cs_record['translation'])
# Fourth step: transform point cloud to camera frame
cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])
translation_vector_ego_to_cam = -np.array(cs_record['translation'])
rotation_matrix_ego_to_cam = Quaternion(cs_record['rotation']).rotation_matrix.T

rotation_matrix_lidar_to_cam = np.dot(rotation_matrix_ego_to_cam, rotation_matrix_lidar_to_ego)
translation_vector_lidar_to_cam = translation_vector_lidar_to_ego + translation_vector_ego_to_cam
translation_vector_lidar_to_cam = np.dot(rotation_matrix_ego_to_cam, translation_vector_lidar_to_cam)

extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam
extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam

intrinsic_matrix = np.array(cs_record['camera_intrinsic'])
projection_matrix = np.dot(intrinsic_matrix, extrinsic_matrix)
point_cloud.points[3, :] = 1
points_projected = np.dot(projection_matrix, point_cloud.points)
# normalize points
nbr_points = points_projected.shape[1]
points_projected = points_projected / points_projected[2:3, :].repeat(3, 0).reshape(3, nbr_points)

points_transformed = np.dot(extrinsic_matrix, point_cloud.points)
depths = points_transformed[2, :]
distances = []
for i in range(len(points_transformed[0, :])):
    point = points_transformed[:, i]
    distance = sqrt(point[0] ** 2 + point[1] ** 2 + point[2] ** 2)
    distances.append(distance)
# Remove points that are either outside or behind the camera. Leave a margin of 1 pixel for aesthetic reasons.
mask = np.ones(depths.shape[0], dtype=bool)
# take only points that are in front of camera
mask = np.logical_and(mask, depths > 0)
mask = np.logical_and(mask, points_projected[0, :] > 1)
mask = np.logical_and(mask, points_projected[0, :] < 1600 - 1)
mask = np.logical_and(mask, points_projected[1, :] > 1)
mask = np.logical_and(mask, points_projected[1, :] < 900 - 1)
# filter points and distances
points = points_projected[:, mask]
distances_numpy = np.asarray(distances)
distances_numpy = distances_numpy[mask]
max_distance = max(distances_numpy)
# visualize 2d points on image
norm = mpl.colors.Normalize(vmin=0, vmax=320)
cmap = cm.jet
m = cm.ScalarMappable(norm=norm, cmap=cmap)
for i in range(len(points[0, :])):
    distance_idx = 255 - (int(distances_numpy[i] / max_distance * 255))
    color_rgba = m.to_rgba(distance_idx)
    color_rgb = (color_rgba[0] * 255, color_rgba[1] * 255, color_rgba[2] * 255)
    cv2.circle(img, (int(points[0, i]), int(points[1, i])), 4, color_rgb, thickness=-1)
cv2.imwrite("CAM_FRONT_000000_not_working.jpg", img)
