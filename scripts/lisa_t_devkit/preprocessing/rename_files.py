import os

# cam_channels = ['CAM_BACK', 'CAM_BACK_LEFT', 'CAM_BACK_RIGHT', 'CAM_FRONT', 'CAM_FRONT_LEFT', 'CAM_FRONT_RIGHT']
# for channel in cam_channels:
#     path = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/2018-05-23-001-frame-00042917-00043816_small/images/' + channel + '/'
#     i = 0
#     for file in sorted(os.listdir(path)):
#         os.rename(path + file, path + str(i).zfill(6) + '.jpg')
#         i = i + 1

pointcloud_folders = ['pointclouds', 'pointclouds_without_ground']
for folder in pointcloud_folders:
    path = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/2018-05-23-001-frame-00042917-00043816_small/' + folder + '/'
    i = 0
    for file in sorted(os.listdir(path)):
        os.rename(path + file, path + str(i).zfill(6) + '.pcd')
        i = i + 1
