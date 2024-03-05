import argparse
import numpy as np
import os
import re
from pypcd import pypcd


def sort_human(l):
    convert = lambda text: float(text) if text.isdigit() else text
    alphanum = lambda key: [convert(c) for c in re.split('([-+]?[0-9]*\.?[0-9]*)', key)]
    l.sort(key=alphanum)
    return l


def transform_pointclouds(input_path, output_path):
    for filename in sort_human(os.listdir(input_path)):
        cloud = pypcd.PointCloud.from_path(input_path + filename)
        new_cloud = pypcd.update_field(cloud, "x", -cloud.pc_data["x"])
        new_cloud = pypcd.update_field(new_cloud, "y", -new_cloud.pc_data["y"])
        points = np.column_stack([new_cloud.pc_data["x"], new_cloud.pc_data["y"], new_cloud.pc_data["z"]])

        angle_rad = np.radians(-4)  # convert from degrees to radians for trigonometric function
        rotated_points = np.array([[np.cos(angle_rad), -np.sin(angle_rad), 0],
                                   [np.sin(angle_rad), np.cos(angle_rad), 0],
                                   [0, 0, 1]]) @ points.T

        # calculated value:  [-0.173, -4.791, 7.534]
        translation_lidar_to_road_frame = [-0.173, -4.791,
                                           7.534]  # x/longitudinal, y/lateral, z/altitude, this means position of the LiDAR sensor in the road frame

        print("rotated points x shape", rotated_points[0].shape)
        new_cloud_rotated = pypcd.update_field(new_cloud, "x", rotated_points[0] + translation_lidar_to_road_frame[0])
        new_cloud_rotated = pypcd.update_field(new_cloud_rotated, "y",
                                               rotated_points[1] + translation_lidar_to_road_frame[1])
        new_cloud_rotated = pypcd.update_field(new_cloud_rotated, "z",
                                               rotated_points[2] + translation_lidar_to_road_frame[2])
        new_cloud_rotated.save(output_path + filename)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Transform point cloud scans.')
    parser.add_argument('-i', '--input_path', type=str, help='path to the pointclouds folder.')
    parser.add_argument('-o', '--output_path', type=str,
                        help='path to the output folder (with transformed point clouds). If not set, then the input folder will be used.')
    args = parser.parse_args()
    input_path = args.input_path
    if args.output_path:
        output_path = args.output_path
    else:
        output_path = input_path
    transform_pointclouds(input_path, output_path)
