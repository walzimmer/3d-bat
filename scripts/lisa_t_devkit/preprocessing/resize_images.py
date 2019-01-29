import os
import cv2

path = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/assets/textures/keyboard_small/'

for file in sorted(os.listdir(path)):
    img = cv2.imread(path + file, cv2.IMREAD_UNCHANGED)
    img_small = cv2.resize(img, (32, 32), interpolation=cv2.INTER_AREA)
    cv2.imwrite(path + file, img_small)
