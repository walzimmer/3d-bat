import os

path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_FRONT/'
i = 0
for file in sorted(os.listdir(path)):
    os.rename(path + file, path + str(i).zfill(6) + '.jpg')
    i = i + 1
