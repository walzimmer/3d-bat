import os
import os.path as osp
import argparse
from typing import Tuple

import numpy as np
from PIL import Image
from pyquaternion import Quaternion
from tqdm import tqdm
from random import randint

from nuscenes_utils.data_classes import PointCloud
from nuscenes_utils.geometry_utils import view_points
from nuscenes_utils.nuscenes import NuScenes, NuScenesExplorer


def export_scene_pointcloud(explorer: NuScenesExplorer, out_path: str, scene_token: str, channel: str = 'LIDAR_TOP',
                            min_dist: float = 3.0, max_dist: float = 30.0, verbose: bool = True) -> None:
    """
    Export fused point clouds of a scene to a Wavefront OBJ file.
    This point-cloud can be viewed in your favorite 3D rendering tool, e.g. Meshlab or Maya.
    :param explorer: NuScenesExplorer instance.
    :param out_path: Output path to write the point-cloud to.
    :param scene_token: Unique identifier of scene to render.
    :param channel: Channel to render.
    :param min_dist: Minimum distance to ego vehicle below which points are dropped.
    :param max_dist: Maximum distance to ego vehicle above which points are dropped.
    :param verbose: Whether to print messages to stdout.
    :return: <None>
    """

    # Check inputs.
    valid_channels = ['LIDAR_TOP', 'RADAR_FRONT', 'RADAR_FRONT_RIGHT', 'RADAR_FRONT_LEFT', 'RADAR_BACK_LEFT',
                      'RADAR_BACK_RIGHT']
    camera_channels = ['CAM_FRONT_LEFT', 'CAM_FRONT', 'CAM_FRONT_RIGHT', 'CAM_BACK_LEFT', 'CAM_BACK', 'CAM_BACK_RIGHT']
    assert channel in valid_channels, 'Input channel {} not valid.'.format(channel)

    # Get records from DB.
    scene_rec = explorer.nusc.get('scene', scene_token)
    start_sample_rec = explorer.nusc.get('sample', scene_rec['first_sample_token'])
    sd_rec = explorer.nusc.get('sample_data', start_sample_rec['data'][channel])

    # Make list of frames
    cur_sd_rec = sd_rec
    sd_tokens = []
    while cur_sd_rec['next'] != '':
        cur_sd_rec = explorer.nusc.get('sample_data', cur_sd_rec['next'])
        sd_tokens.append(cur_sd_rec['token'])

    # Write point-cloud.
    with open(out_path, 'w') as f:
        num_points_total = 0
        for sd_token in tqdm(sd_tokens):
            if verbose:
                print('Processing {}'.format(sd_rec['filename']))
            sc_rec = explorer.nusc.get('sample_data', sd_token)
            sample_rec = explorer.nusc.get('sample', sc_rec['sample_token'])
            lidar_token = sd_rec['token']
            lidar_rec = explorer.nusc.get('sample_data', lidar_token)
            filename = osp.join(explorer.nusc.dataroot, lidar_rec['filename'])
            pc = PointCloud.from_file(filename)

            # Get point cloud colors.
            coloring = np.ones((3, pc.points.shape[1])) * -1
            for channel in camera_channels:
                camera_token = sample_rec['data'][channel]
                cam_coloring, cam_mask = pointcloud_color_from_image(nusc, lidar_token, camera_token)
                coloring[:, cam_mask] = cam_coloring

            # Points live in their own reference frame. So they need to be transformed via global to the image plane.
            # First step: transform the point cloud to the ego vehicle frame for the timestamp of the sweep.
            cs_record = explorer.nusc.get('calibrated_sensor', lidar_rec['calibrated_sensor_token'])
            pc.rotate(Quaternion(cs_record['rotation']).rotation_matrix)
            pc.translate(np.array(cs_record['translation']))

            # Optional Filter by distance to remove the ego vehicle.
            dists_origin = np.sqrt(np.sum(pc.points[:3, :] ** 2, axis=0))
            keep = np.logical_and(min_dist <= dists_origin, dists_origin <= max_dist)
            pc.points = pc.points[:, keep]

            min_z = min(pc.points[2])
            max_z = max(pc.points[2])
            if verbose:
                print('Distance filter: Keeping %d of %d points...' % (keep.sum(), len(keep)))

            # Second step: transform to the global frame.
            poserecord = explorer.nusc.get('ego_pose', lidar_rec['ego_pose_token'])
            pc.rotate(Quaternion(poserecord['rotation']).rotation_matrix)
            pc.translate(np.array(poserecord['translation']))

            # AKSHAY
            # points = pc.points
            # points[0, :] = points[0, :] - 1000
            # points[1, :] = points[1, :] - 600
            # r = np.sqrt((points[0, :]) ** 2 + (points[1, :]) ** 2 + (points[2, :]) ** 2)
            # omega = np.arcsin(np.divide((points[2, :]), r))  # elevation angle of each point
            # omega_degree = -np.rad2deg(omega)
            #
            # # plot historgram
            # omega_max = max(omega_degree)
            # omega_min = min(omega_degree)
            #
            # import matplotlib.pyplot as plt
            #
            # LASER_ANGLES = [-30.67, -9.33, -29.33, -8.00, -28.00, -6.67, -26.67, -5.33, -25.33, -4.00, -24.000, -2.67,
            #                 -22.67, -1.33, -21.33, 0.00, -20.00, 1.33, -18.67, 2.67, -17.33, 4.00, -16.00, 5.33, -14.67,
            #                 6.67, -13.33, 8.00, -12.00, 9.33, -10.67, 10.67]
            # [-30.67, -29.33, -28.0, -26.67, -25.33, -24.0, -22.67, -21.33, -20.0, -18.67, -17.33, -16.0,
            #                 -14.67, -13.33, -12.0, -10.67, -9.33, -8.0, -6.67, -5.33, -4.0, -2.67, -1.33, 0.0, 1.33,
            #                 2.67, 4.0, 5.33, 6.67, 8.0, 9.33, 10.67]
            # LASER_ANGLES = [-10.00, 0.67, -8.67, 2.00, -7.33, 3.33, -6.00, 4.67, -4.67, 6.00, -3.33, 7.33, -2.00, 8.67,-0.67,10.00]
            # LASER_ANGLES = sorted(LASER_ANGLES)
            # plt.hist(omega_degree, bins=LASER_ANGLES, range=[-31, 11])  # arguments are passed to np.histogram
            # plt.title("Histogram with 'auto' bins")
            # plt.show()
            # AKSHAY

            # Write points to file
            j = 0
            num_points_sweep = 0
            for v in pc.points.transpose():
                if j % 10 == 0:
                    # TODO: find out how to extract intensity values from binary data
                    # temporary set to random number
                    i = randint(0, 256)
                    # TODO: center data by subtracting mean
                    v[0] = v[0] - 1000
                    v[1] = v[1] - 600
                    f.write("{v[0]:.8f} {v[1]:.8f} {v[2]:.8f} {i}\n".format(v=v, i=i))
                    num_points_sweep = num_points_sweep + 1
                j = j + 1
            num_points_total += num_points_sweep

            if not sd_rec['next'] == "":
                sd_rec = explorer.nusc.get('sample_data', sd_rec['next'])
    # write header
    with open(out_path, 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write("# .PCD v0.7 - Point Cloud Data file format\n"
                + "VERSION 0.7\n"
                + "FIELDS x y z intensity\n"
                + "SIZE 4 4 4 4\n"
                + "TYPE F F F F\n"
                + "COUNT 1 1 1 1\n"
                + "WIDTH " + str(num_points_total) + "\n"
                + "HEIGHT 1\n"
                + "VIEWPOINT 0 0 0 1 0 0 0\n"
                + "POINTS " + str(num_points_total) + "\n"
                + "DATA ascii\n"
                + content)


def pointcloud_color_from_image(nusc, pointsensor_token: str, camera_token: str) -> Tuple[np.array, np.array]:
    """
    Given a point sensor (lidar/radar) token and camera sample_data token, load point-cloud and map it to the image
    plane, then retrieve the colors of the closest image pixels.
    :param pointsensor_token: Lidar/radar sample_data token.
    :param camera_token: Camera sample data token.
    :return (coloring <np.float: 3, n>, mask <np.bool: m>). Returns the colors for n points that reproject into the
        image out of m total points. The mask indicates which points are selected.
    """

    cam = nusc.get('sample_data', camera_token)
    pointsensor = nusc.get('sample_data', pointsensor_token)
    print(nusc.dataroot)
    print(pointsensor['filename'])
    pc = PointCloud.from_file(osp.join(nusc.dataroot, pointsensor['filename']))
    im = Image.open(osp.join(nusc.dataroot, cam['filename']))

    # Points live in the point sensor frame. So they need to be transformed via global to the image plane.
    # First step: transform the point-cloud to the ego vehicle frame for the timestamp of the sweep.
    cs_record = nusc.get('calibrated_sensor', pointsensor['calibrated_sensor_token'])
    pc.rotate(Quaternion(cs_record['rotation']).rotation_matrix)
    pc.translate(np.array(cs_record['translation']))

    # Second step: transform to the global frame.
    poserecord = nusc.get('ego_pose', pointsensor['ego_pose_token'])
    pc.rotate(Quaternion(poserecord['rotation']).rotation_matrix)
    pc.translate(np.array(poserecord['translation']))

    # Third step: transform into the ego vehicle frame for the timestamp of the image.
    poserecord = nusc.get('ego_pose', cam['ego_pose_token'])
    pc.translate(-np.array(poserecord['translation']))
    pc.rotate(Quaternion(poserecord['rotation']).rotation_matrix.T)

    # Fourth step: transform into the camera.
    cs_record = nusc.get('calibrated_sensor', cam['calibrated_sensor_token'])
    pc.translate(-np.array(cs_record['translation']))
    pc.rotate(Quaternion(cs_record['rotation']).rotation_matrix.T)

    # Fifth step: actually take a "picture" of the point cloud.
    # Grab the depths (camera frame z axis points away from the camera).
    depths = pc.points[2, :]

    # Take the actual picture (matrix multiplication with camera-matrix + renormalization).
    points = view_points(pc.points[:3, :], np.array(cs_record['camera_intrinsic']), normalize=True)

    # Remove points that are either outside or behind the camera. Leave a margin of 1 pixel for aesthetic reasons.
    mask = np.ones(depths.shape[0], dtype=bool)
    mask = np.logical_and(mask, depths > 0)
    mask = np.logical_and(mask, points[0, :] > 1)
    mask = np.logical_and(mask, points[0, :] < im.size[0] - 1)
    mask = np.logical_and(mask, points[1, :] > 1)
    mask = np.logical_and(mask, points[1, :] < im.size[1] - 1)
    points = points[:, mask]

    # Pick the colors of the points
    im_data = np.array(im)
    coloring = np.zeros(points.shape)
    for i, p in enumerate(points.transpose()):
        point = p[:2].round().astype(np.int32)
        coloring[:, i] = im_data[point[1], point[0], :]

    return coloring, mask


def convert_point_cloud(scene_name, scene_name_int):
    global nusc

    # Create output folder
    if not out_dir == '' and not osp.isdir(out_dir):
        os.makedirs(out_dir)
    out_path = osp.join(out_dir, '%s.pcd' % str(scene_name_int).zfill(6))
    if osp.exists(out_path):
        print('=> File {} already exists. Aborting.'.format(out_path))
        return
    else:
        print('=> Extracting scene {} to {}'.format(str(scene_name_int).zfill(6), out_path))
    # Extract point-cloud for the specified scene
    scene_tokens = [s['token'] for s in nusc.scene if s['name'] == scene_name]
    assert len(scene_tokens) == 1, 'Error: Invalid scene %s' % scene_name
    export_scene_pointcloud(nusc.explorer, out_path, scene_tokens[0], channel='LIDAR_TOP', verbose=verbose)


if __name__ == '__main__':
    # Read input parameters
    parser = argparse.ArgumentParser(description='Export a scene in Wavefront point cloud format.',
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--scene', default='0', type=str, help='number of a scene/frame, e.g. 1023')
    parser.add_argument('--input_dir', default='../../../datasets/nuscenes/nuscenes_teaser_meta_v1/samples/LIDAR_TOP/',
                        type=str, help='Input folder')
    parser.add_argument('--output_dir', default='../converted_point_clouds/', type=str, help='Output folder')
    parser.add_argument('--verbose', default=1, type=int, help='Whether to print outputs to stdout')
    parser.add_argument('--all', default=0, type=int,
                        help='Whether to convert all points clouds in input folder or not (0=no,1=yes)')
    args = parser.parse_args()
    # out_dir = args.output_dir
    input_dir = args.input_dir
    out_dir = args.output_dir
    verbose = bool(args.verbose)
    convert_all = bool(args.all)

    nusc = NuScenes()
    if convert_all:
        # for i in range(len(os.listdir(input_dir))):
        for scene_name_int, scene in enumerate(nusc.scene):
            # scene_name = nusc.scene[]
            convert_point_cloud(scene['name'], scene_name_int)
    else:
        scene_name_int = int(args.scene)
        scene_name = 'scene-' + str(scene_name_int + 1).zfill(4)
        convert_point_cloud(scene_name, scene_name_int)
