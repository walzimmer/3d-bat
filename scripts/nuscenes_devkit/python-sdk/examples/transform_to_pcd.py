import os
import random

path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/2018-05-23-001-frame-00042917-00043816/pointclouds/'

for filename in sorted(os.listdir(path)):
    with open(path + filename) as file_reader:
        lines = file_reader.readlines()
        numPoints = len(lines)
        header = '# .PCD v0.7 - Point Cloud Data file format\nVERSION 0.7\nFIELDS x y z intensity\nSIZE 4 4 4 4\nTYPE F F F F\nCOUNT 1 1 1 1\nWIDTH ' + str(
            numPoints) + '\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS ' + str(numPoints) + '\nDATA ascii\n'
        with open(path + filename.replace('.txt', '.pcd'), 'w') as file_writer:
            file_writer.write(header)
            for line in lines:
                line = line.rstrip()
                points = line.split(' ')
                x = round(float(points[0]) / 100, 2)
                y = round(float(points[1]) / 100, 2)
                z = round(float(points[2]) / 100, 2)
                file_writer.write(str(x) + ' ' + str(y) + ' ' + str(z) + ' ' + str(random.randint(0, 255)) + '\n')
