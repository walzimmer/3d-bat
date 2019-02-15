import os

import cv2

# sequence = '2018-05-23-001-frame-00042917-00043816' # DONE
# sequence = '2018-05-23-001-frame-00077323-00078222' # DONE
# sequence = '2018-05-23-001-frame-00080020-00080919' # DONE
# sequence = '2018-05-23-001-frame-00106993-00107892' # DONE
# sequence = '2018-07-02-005-frame-00000000-00000900' # DONE
# sequence = '2018-07-02-005-frame-00000900-00001800'  # DONE
sequence = '2018-07-02-005-frame-00001800-00002700'

path_in = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/images/CAM_FRONT_orig/'
path_out = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/images/CAM_FRONT/'
for file in sorted(os.listdir(path_in)):
    image = cv2.imread(path_in + file)
    image_cropped = image[0:960, 0:1920]
    cv2.imwrite(path_out + file, image_cropped)

path_in = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/images/CAM_BACK_orig/'
path_out = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/images/CAM_BACK/'
for file in sorted(os.listdir(path_in)):
    image = cv2.imread(path_in + file)
    image_cropped = image[0:960, 0:1920]
    cv2.imwrite(path_out + file, image_cropped)
