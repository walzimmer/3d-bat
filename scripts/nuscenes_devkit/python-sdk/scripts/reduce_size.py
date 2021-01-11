import os
import cv2

path_cam_back = 'CAM_BACK/'
path_cam_back_left = 'CAM_BACK_LEFT/'
path_cam_back_right = 'CAM_BACK_RIGHT/'

path_cam_front = 'CAM_FRONT/'
path_cam_front_left = 'CAM_FRONT_LEFT/'
path_cam_front_right = 'CAM_FRONT_RIGHT/'

path_cam_back_resized = 'CAM_BACK_RESIZED/'
path_cam_back_left_resized = 'CAM_BACK_LEFT_RESIZED/'
path_cam_back_right_resized = 'CAM_BACK_RIGHT_RESIZED/'

path_cam_front_resized = 'CAM_FRONT_RESIZED/'
path_cam_front_left_resized = 'CAM_FRONT_LEFT_RESIZED/'
path_cam_front_right_resized = 'CAM_FRONT_RIGHT_RESIZED/'

files_cam_back = sorted(os.listdir(path_cam_back))
files_cam_back_left = sorted(os.listdir(path_cam_back_left))
files_cam_back_right = sorted(os.listdir(path_cam_back_right))

files_cam_front = sorted(os.listdir(path_cam_front))
files_cam_front_left = sorted(os.listdir(path_cam_front_left))
files_cam_front_right = sorted(os.listdir(path_cam_front_right))

for file_cam_back,file_cam_back_left,file_cam_back_right, file_cam_front,file_cam_front_left,file_cam_front_right in zip(files_cam_back,files_cam_back_left,files_cam_back_right,files_cam_front,files_cam_front_left,files_cam_front_right):
    img_cam_back = cv2.imread(path_cam_back+file_cam_back)
    img_cam_back_left = cv2.imread(path_cam_back_left+file_cam_back_left)
    img_cam_back_right = cv2.imread(path_cam_back_right+file_cam_back_right)

    img_cam_front = cv2.imread(path_cam_front+file_cam_front)
    img_cam_front_left = cv2.imread(path_cam_front_left+file_cam_front_left)
    img_cam_front_right = cv2.imread(path_cam_front_right+file_cam_front_right)

    img_cam_back_resized = cv2.resize(img_cam_back, (int(img_cam_back.shape[1]/10),int(img_cam_back.shape[0]/10)))
    img_cam_back_left_resized = cv2.resize(img_cam_back_left, (int(img_cam_back_left.shape[1]/10),int(img_cam_back_left.shape[0]/10)))
    img_cam_back_right_resized = cv2.resize(img_cam_back_right, (int(img_cam_back_right.shape[1]/10),int(img_cam_back_right.shape[0]/10)))

    img_cam_front_resized = cv2.resize(img_cam_front, (int(img_cam_front.shape[1]/10),int(img_cam_front.shape[0]/10)))
    img_cam_front_left_resized = cv2.resize(img_cam_front_left, (int(img_cam_front_left.shape[1]/10),int(img_cam_front_left.shape[0]/10)))
    img_cam_front_right_resized = cv2.resize(img_cam_front_right, (int(img_cam_front_right.shape[1]/10),int(img_cam_front_right.shape[0]/10)))

    cv2.imwrite(path_cam_back_resized+file_cam_back,img_cam_back_resized)
    cv2.imwrite(path_cam_back_left_resized+file_cam_back_left,img_cam_back_left_resized)
    cv2.imwrite(path_cam_back_right_resized+file_cam_back_right,img_cam_back_right_resized)

    cv2.imwrite(path_cam_front_resized+file_cam_front,img_cam_front_resized)
    cv2.imwrite(path_cam_front_left_resized+file_cam_front_left,img_cam_front_left_resized)
    cv2.imwrite(path_cam_front_right_resized+file_cam_front_right,img_cam_front_right_resized)
