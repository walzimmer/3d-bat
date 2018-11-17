import numpy as np
from pyquaternion import Quaternion
import os
# import nuscenes_utils.nuscenes as nusc
from nuscenes_utils.data_classes import PointCloud
from nuscenes_utils.geometry_utils import view_points
from nuscenes_utils.nuscenes import NuScenes

# CAM_BACK new
# from nuscenes_utils.binary_to_ascii import nusc
# from nuscenes_utils.data_classes import PointCloud
#
# translation_vector = np.array([0.086,
#                                -0.007,
#                                1.541])
# rotation_angles = [0.5006316254997311,
#                    -0.508201421131807,
#                    -0.49914796672300266,
#                    0.49188474099671065]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix
# camera_intrinsic_matrix = np.array([[798.1242652672415, 0.0, 679.0081140747895],
#                                     [0.0, 798.1242652672414, 419.2474525237902],
#                                     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix_one = np.zeros((3, 4))
# # camera_extrinsic_matrix_two = np.matmul(rotation_matrix.T, translation_vector.T)  # 3x1
# camera_extrinsic_matrix_one[:3, :3] = rotation_matrix
# # camera_extrinsic_matrix_one[:, 3] = camera_extrinsic_matrix_two
# camera_extrinsic_matrix_one[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix_one)
# print(projection_matrix)


# cam = nusc.get('sample_data', camera_token)
# pointsensor = nusc.get('sample_data', pointsensor_token)

# file = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1/samples/LIDAR_TOP/n008-2018-05-21-11-06-59-0400__LIDAR_TOP__1526915243047392.pcd.bin'
# pc = PointCloud.from_file(file)
# print('tests')
# 4xN


nusc = NuScenes(version='v0.1',
                dataroot='/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1',
                verbose=True)

# 3d position in sensor coordinate frame (lidar)
points3D = np.array([[1.897873113706401],
                     [0.5311127602929823],
                     [-9.832123501686596],
                     [1]])
# im = Image.open(osp.join(self.nusc.dataroot, cam['filename']))
# Points live in the point sensor frame. So they need to be transformed via global to the image plane.
# First step: transform the point-cloud to the ego vehicle frame for the timestamp of the sweep.
pointsensor_channel = 'LIDAR_TOP'
camera_channel = 'CAM_BACK'
my_sample = nusc.sample[0]
sample_token = my_sample['token']
sample_record = nusc.get('sample', sample_token)
pointsensor_token = sample_record['data'][pointsensor_channel]
camera_token = sample_record['data'][camera_channel]
cam = nusc.get('sample_data', camera_token)
pointsensor = nusc.get('sample_data', pointsensor_token)

# cs_record = nusc.get('calibrated_sensor', pointsensor['calibrated_sensor_token'])
cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])

# rotation_matrix = Quaternion(cs_record['rotation']).rotation_matrix
# points3D[:3, :] = np.dot(rotation_matrix, points3D[:3, :])
# translation_vector = np.array(cs_record['translation'])
# # for i in range(3):
# #     points3D[i, :] = points3D[i, :] + translation_vector[i]
#
# # Second step: transform to the global frame.
# poserecord = nusc.get('ego_pose', pointsensor['ego_pose_token'])
# rotation_matrix = Quaternion(poserecord['rotation']).rotation_matrix
# points3D[:3, :] = np.dot(rotation_matrix, points3D[:3, :])
# translation_vector = np.array(poserecord['translation'])
# for i in range(3):
#     points3D[i, :] = points3D[i, :] + translation_vector[i]
#
# # Third step: transform into the ego vehicle frame for the timestamp of the image.
# poserecord = nusc.get('ego_pose', cam['ego_pose_token'])
# rotation_matrix = Quaternion(poserecord['rotation']).rotation_matrix.T
# points3D[:3, :] = np.dot(rotation_matrix, points3D[:3, :])
# translation_vector = -np.array(poserecord['translation'])
# for i in range(3):
#     points3D[i, :] = points3D[i, :] + translation_vector[i]
#
# # Fourth step: transform into the camera.
# cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])
# rotation_matrix = Quaternion(cs_record['rotation']).rotation_matrix.T
# points3D[:3, :] = np.dot(rotation_matrix, points3D[:3, :])
# translation_vector = -np.array(cs_record['translation'])
# for i in range(3):
#     points3D[i, :] = points3D[i, :] + translation_vector[i]

# OR: do only those two steps:
# 1. Move box to ego vehicle coord system
# box.translate(-np.array(pose_record['translation']))
# box.rotate(Quaternion(pose_record['rotation']).inverse)
#
# 2. Move box to sensor coord system
# box.translate(-np.array(cs_record['translation']))
# box.rotate(Quaternion(cs_record['rotation']).inverse)

# Fifth step: actually take a "picture" of the point cloud.
# Grab the depths (camera frame z axis points away from the camera).
# depths = points3D[2, :]

# TODO
# Set the height to be the coloring.
# coloring = points3D[2, :]


# --------------------------------
# transform from lidar to CAM_BACK
# translation vector is: long,lat, vert (0.086, -0.007,1.541)
#                     must be: lat, vert, long
translation_vector = np.array([-0.007, 1.541, 0.086])

rotation_angles = [0.5006316254997311,
                   -0.508201421131807,
                   -0.49914796672300266,
                   0.49188474099671065]
rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
points3D[:3, :] = np.dot(rotation_matrix, points3D[:3, :])
for i in range(3):
    points3D[i, :] = points3D[i, :] + translation_vector[i]

# Multiply with intrinsic matrix and normalize to get 2D point coordinates  OR call view_points
# camera_intrinsic = np.array([[798.12426527, 0.0, 679.00811407],
#                              [0.0, 798.12426527, 419.24745252],
#                              [0.0, 0.0, 1.0]])

# Take the actual picture (matrix multiplication with camera-matrix + renormalization).
points = view_points(points3D[:3, :], np.array(cs_record['camera_intrinsic']), normalize=True)
# print 8 2D points of car
print(points)
# TODO: all 8 points should be within this 2D box
# 711.2052971998752 379.53076863504674 1008.7345435520874 570.4641298240495
