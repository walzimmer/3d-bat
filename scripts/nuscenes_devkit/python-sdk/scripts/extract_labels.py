import os

from pyquaternion import Quaternion

from nuscenes_utils.data_classes import PointCloud
from nuscenes_utils.geometry_utils import BoxVisibility, view_points
from nuscenes_utils.nuscenes import NuScenes
import numpy as np

nusc = NuScenes(version='v0.1',
                dataroot='/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1/',
                verbose=True)

output_path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/NuScenes/Annotations/'

# iterate over all 3977 samples
for idx, sample in enumerate(nusc.sample):
    sample_token = sample['token']
    sample_record = nusc.get('sample', sample_token)
    selected_data = {}
    for channel, sample_data_token in sample_record['data'].items():
        sample_data_record = nusc.get('sample_data', sample_data_token)
        sensor_modality = sample_data_record['sensor_modality']
        if sensor_modality in ['lidar']:
            # create output directory
            os.makedirs(output_path + channel, exist_ok=True)
            selected_data[channel] = sample_data_token
            # boxes returned are transformed from global to camera/LIDAR space within get_sample_data
            data_path, boxes, camera_intrinsic = nusc.get_sample_data(sample_data_token,
                                                                      box_vis_level=BoxVisibility.IN_FRONT)
            with open(output_path + channel + '/' + str(idx).zfill(6) + '.txt', 'w') as file_writer:
                for box in boxes:
                    category = box.name
                    truncated = 0
                    occluded = 0
                    alpha = 0
                    width = box.wlh[0]
                    length = box.wlh[1]
                    height = box.wlh[2]
                    posx = box.center[0]
                    posy = box.center[1]
                    posz = box.center[2]
                    rotation_y = box.orientation.angle

                    if sensor_modality == 'camera':
                        camera_token = sample['data'][channel]
                        cam = nusc.get('sample_data', camera_token)
                        cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])
                        corners_3d = box.corners()  # 3D points in numpy format
                        # 1. parameter: 3D points 3xN
                        # 2. parameter: camera matrix
                        # write labels that reside in global frame
                        # transformation from global -> ego, ego -> point cloud will be done in javascript

                        # temporary: do transformation in python
                        # pointsensor_channel = 'LIDAR_TOP'
                        # pointsensor_token = sample_record['data'][pointsensor_channel]
                        # pointsensor = nusc.get('sample_data', pointsensor_token)
                        # poserecord = nusc.get('ego_pose', pointsensor['ego_pose_token'])

                        # 1. step: transform points from global frame to ego frame
                        # add 4th row with ones to make it homogeneous vectors
                        # cornerPointCloud = PointCloud(np.array([box.center[0], box.center[1], box.center[2], 1]))
                        # cornerPointCloud.rotate(Quaternion(poserecord['rotation']).rotation_matrix.T)
                        # cornerPointCloud.translate(-np.array(poserecord['translation']))

                        # 2. step: transform point cloud from ego frame to point cloud frame
                        # cs_record = nusc.get('calibrated_sensor', pointsensor['calibrated_sensor_token'])
                        # cornerPointCloud.rotate(Quaternion(cs_record['rotation']).rotation_matrix.T)
                        # cornerPointCloud.translate(-np.array(cs_record['translation']))
                        # onePoint = cornerPointCloud.points
                        # xPos = onePoint[0]
                        # yPos = onePoint[1]
                        # zPos = onePoint[2]
                        corner_points_2d = view_points(corners_3d, np.array(cs_record['camera_intrinsic']),
                                                       normalize=True)
                        # # corner_points_2d: 8x2 array
                        # xmin = min(corner_points_2d[0, :])
                        # ymin = min(corner_points_2d[1, :])
                        # xmax = max(corner_points_2d[0, :])
                        # ymax = max(corner_points_2d[1, :])
                        # NOTE: we do not need image coordinates
                        #
                        xmin = 0
                        ymin = 0
                        xmax = 0
                        ymax = 0
                    else:
                        xmin = 0
                        ymin = 0
                        xmax = 0
                        ymax = 0
                    score = 1.0
                    file_writer.write(
                        category + ' ' + str(truncated) + ' ' + str(occluded) + ' ' + str(alpha) + ' ' + str(xmin)
                        + ' ' + str(ymin) + ' ' + str(xmax) + ' ' + str(ymax) + ' ' + str(width) + ' ' + str(length)
                        + ' ' + str(height) + ' ' + str(posx) + ' ' + str(-posy) + ' ' + str(posz)
                        + ' ' + str(rotation_y) + ' ' + str(score) + '\n')
    # temporary break after 1. sample
    break
