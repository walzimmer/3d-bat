import os

from nuscenes_utils.geometry_utils import BoxVisibility, view_points
from nuscenes_utils.nuscenes import NuScenes
import numpy as np

nusc = NuScenes(version='v0.1',
                dataroot='/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/nuscenes/nuscenes_teaser_meta_v1/',
                verbose=True)

output_path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/Annotations/'

# iterate over all 3977 samples
for idx, sample in enumerate(nusc.sample):
    sample_token = sample['token']
    sample_data_record = nusc.get('sample', sample_token)

    selected_data = {}
    for channel, sample_data_token in sample_data_record['data'].items():
        if channel != 'CAM_BACK':
            continue
        sd_record = nusc.get('sample_data', sample_data_token)
        sensor_modality = sd_record['sensor_modality']
        if sensor_modality in ['lidar', 'camera']:
            # create output directory
            os.makedirs(output_path + channel, exist_ok=True)
            selected_data[channel] = sample_data_token
            # boxes returned are already in camera space
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
                        corners_3d = box.corners()  # box.z8 3D points in numpy format
                        # 1. parameter: 3D points 3xN
                        # 2. parameter: camera matrix
                        # write labels that reside in point cloud space
                        # TODO: 1. transform labels from point cloud space to ego vehicle space for timestamp of sweep
                        # TODO: 2. transform labels from ego vehicle frame to global frame
                        # TODO: 3. transform labels from global frame to ego vehicle frame for timestamp of image
                        # TODO: 4. transform labels from ego vehicle frame to camera/sensor frame
                        corner_points_2d = view_points(corners_3d, np.array(cs_record['camera_intrinsic']),
                                                       normalize=True)
                        # # corner_points_2d: 8x2 array
                        xmin = min(corner_points_2d[0, :])
                        ymin = min(corner_points_2d[1, :])
                        xmax = max(corner_points_2d[0, :])
                        ymax = max(corner_points_2d[1, :])
                    else:
                        xmin = 0
                        ymin = 0
                        xmax = 0
                        ymax = 0
                    score = 1.0
                    file_writer.write(
                        category + ' ' + str(truncated) + ' ' + str(occluded) + ' ' + str(alpha) + ' ' + str(
                            xmin) + ' ' + str(ymin) + ' ' + str(xmax) + ' ' + str(ymax) + ' ' + str(
                            length) + ' ' + str(height) + ' ' + str(width) + ' ' + str(-box.center[2]) + ' ' + str(
                            box.center[1]) + ' ' + str(box.center[0]) + ' ' + str(rotation_y) + ' ' + str(score) + '\n')

# for annotation in nusc.sample_annotation:
#     category = annotation.category_name
#     visibility_object = nusc.get('visibility', annotation['visibility_token'])
#     visibility_level = visibility_object.level
#     sizex = annotation.size[0]
#     sizey = annotation.size[1]
#     sizez = annotation.size[2]
#     posx = annotation.translation[0]
#     posy = annotation.translation[1]
#     posz = annotation.translation[2]
#     rotation_yaw = annotation.rotation[0]
