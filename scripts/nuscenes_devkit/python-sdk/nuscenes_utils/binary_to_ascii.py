from random import randint

from nuscenes_utils.data_classes import PointCloud
import os
from nuscenes_utils.nuscenes import NuScenes

nusc = NuScenes()
input_path = nusc.dataroot + 'samples/LIDAR_TOP/'
output_path = nusc.dataroot + 'samples/LIDAR_TOP_ASCII/'
for idx, filename in enumerate(sorted(os.listdir(input_path))):
    if idx == 0:
        continue
    pc = PointCloud.from_file(input_path + filename)
    num_points = len(pc.points.transpose())
    with open(output_path + str(idx).zfill(6) + '.pcd', 'w') as f:
        # mean_x = sum(pc.points[0])/num_points
        # mean_y = sum(pc.points[1])/num_points
        # mean_z = sum(pc.points[2])/num_points
        # pc.points[0] -= mean_x
        # pc.points[1] -= mean_y
        # pc.points[2] -= mean_z

        # min and max values
        print('xmin: ', str(min(pc.points[0])))
        print('xmax: ', str(max(pc.points[0])))
        print('ymin: ', str(min(pc.points[1])))
        print('ymax: ', str(max(pc.points[1])))
        print('zmin: ', str(min(pc.points[2])))
        print('zmax: ', str(max(pc.points[2])))

        for v in pc.points.transpose():
            # TODO: center data
            # TODO: find out how to extract intensity values from binary data
            # temporary set to random number
            i = randint(0, 256)
            f.write("{v[0]:.8f} {v[1]:.8f} {v[2]:.8f} {i}\n".format(v=v, i=i))
    # write header
    with open(output_path + str(idx).zfill(6) + '.pcd', 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write("# .PCD v0.7 - Point Cloud Data file format\n"
                + "VERSION 0.7\n"
                + "FIELDS x y z intensity\n"
                + "SIZE 4 4 4 4\n"
                + "TYPE F F F F\n"
                + "COUNT 1 1 1 1\n"
                + "WIDTH " + str(num_points) + "\n"
                + "HEIGHT 1\n"
                + "VIEWPOINT 0 0 0 1 0 0 0\n"
                + "POINTS " + str(num_points) + "\n"
                + "DATA ascii\n"
                + content)
    break
