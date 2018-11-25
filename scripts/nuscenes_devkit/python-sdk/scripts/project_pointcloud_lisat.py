import os
import numpy as np
import cv2

# 2D points were calculated and exported in matlab
points_path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/projected_points/CAM_FRONT/'
image_in_path = 'CAM_FRONT_000000.jpg'
with open(points_path + '000000.txt') as file_reader:
    lines = file_reader.readlines()
    points2D = []
    for idx, line in enumerate(lines):
        pointsArray = line.rstrip().split(' ')
        if float(pointsArray[0]) > 0 and float(pointsArray[0]) < 1920 and float(pointsArray[1]) > 0 and float(
                pointsArray[1]) < 1440:
            points2D.append((pointsArray[0], pointsArray[1]))

# project points
img = cv2.imread(image_in_path)
# change size of image
# img.setSize(320, 180)
for i in range(len(points2D)):
    x = int(float(points2D[i][0]))
    y = int(float(points2D[i][1]))
    cv2.circle(img, (x, y), 4, (0, 255, 0))
cv2.imwrite('CAM_FRONT_000000_projected_3.jpg', img)
