import os
import random

# sequence = '2018-05-23-001-frame-00042917-00043816'# DONE
# sequence = '2018-05-23-001-frame-00077323-00078222'# DONE
# sequence = '2018-05-23-001-frame-00080020-00080919'# DONE
sequence = '2018-05-23-001-frame-00106993-00107892'

path_in = '/media/cvrr/data/sandbox/datasets/lisat/data/sequences/' + sequence + '/undistorted/velodyne/'
path_out = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/pointclouds/'

for filename in sorted(os.listdir(path_in)):
    with open(path_in + filename) as file_reader:
        lines = file_reader.readlines()
        numPoints = len(lines)
        header = '# .PCD v0.7 - Point Cloud Data file format\nVERSION 0.7\nFIELDS x y z intensity\nSIZE 4 4 4 4\nTYPE F F F F\nCOUNT 1 1 1 1\nWIDTH ' + str(
            numPoints) + '\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS ' + str(numPoints) + '\nDATA ascii\n'
        with open(path_out + filename.replace('.txt', '.pcd'), 'w') as file_writer:
            file_writer.write(header)
            for line in lines:
                line = line.rstrip()
                points = line.split(' ')
                x = round(float(points[0]) / 100, 2)
                y = round(float(points[1]) / 100, 2)
                z = round(float(points[2]) / 100, 2)
                i = points[3]
                file_writer.write(str(x) + ' ' + str(y) + ' ' + str(z) + ' ' + str(i) + '\n')
