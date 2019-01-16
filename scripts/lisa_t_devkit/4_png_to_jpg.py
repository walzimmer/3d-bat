import os
import cv2

from PIL import Image

# sequence = '2018-05-23-001-frame-00042917-00043816'# DONE
# sequence = '2018-05-23-001-frame-00077323-00078222' DONE
sequence = '2018-05-23-001-frame-00080020-00080919'
# sequence = '2018-05-23-001-frame-00106993-00107892' DONE already jpg


channel_array = ['CAM_FRONT', 'CAM_FRONT_RIGHT', 'CAM_FRONT_LEFT', 'CAM_BACK', 'CAM_BACK_LEFT', 'CAM_BACK_RIGHT']
for channel in channel_array:
    path_in = '/media/cvrr/data/sandbox/datasets/lisat/data/sequences/' + sequence + '/undistorted/' + channel + '/'
    path_out = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/images/' + channel + '/'

    for file in sorted(os.listdir(path_in)):
        img = Image.open(path_in + file)
        file_to_remove = file
        img.save(path_out + file.replace(".png", ".jpg"))
        os.remove(path_in + file_to_remove)
