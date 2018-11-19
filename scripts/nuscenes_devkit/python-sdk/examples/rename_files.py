import os

path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/2018-05-23-001-frame-00042917-00043816/images/CAM_FRONT_RIGHT/'
i = 0
for file in sorted(os.listdir(path)):
    os.rename(path + file, path + str(i).zfill(6) + '.jpg')
    i = i + 1
