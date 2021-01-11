import os
import cv2

path_cam_back = '../../../../input/NuScenes/ONE/images/CAM_BACK/'
path_cam_back_left = '../../../../input/NuScenes/ONE/images/CAM_BACK_LEFT/'
path_cam_back_right = '../../../../input/NuScenes/ONE/images/CAM_BACK_RIGHT/'

path_cam_front = '../../../../input/NuScenes/ONE/images/CAM_FRONT/'
path_cam_front_left = '../../../../input/NuScenes/ONE/images/CAM_FRONT_LEFT/'
path_cam_front_right = '../../../../input/NuScenes/ONE/images/CAM_FRONT_RIGHT/'

files_cam_back = sorted(os.listdir(path_cam_back))
files_cam_back_left = sorted(os.listdir(path_cam_back_left))
files_cam_back_right = sorted(os.listdir(path_cam_back_right))

files_cam_front = sorted(os.listdir(path_cam_front))
files_cam_front_left = sorted(os.listdir(path_cam_front_left))
files_cam_front_right = sorted(os.listdir(path_cam_front_right))

for file_cam_back, file_cam_back_left, file_cam_back_right, file_cam_front, file_cam_front_left, file_cam_front_right in zip(
        files_cam_back, files_cam_back_left, files_cam_back_right, files_cam_front, files_cam_front_left,
        files_cam_front_right):
    img_cam_back = cv2.imread(path_cam_back + file_cam_back)
    img_cam_back_left = cv2.imread(path_cam_back_left + file_cam_back_left)
    img_cam_back_right = cv2.imread(path_cam_back_right + file_cam_back_right)

    img_cam_front = cv2.imread(path_cam_front + file_cam_front)
    img_cam_front_left = cv2.imread(path_cam_front_left + file_cam_front_left)
    img_cam_front_right = cv2.imread(path_cam_front_right + file_cam_front_right)

    img_cam_back_resized = cv2.resize(img_cam_back, (int(img_cam_back.shape[1] / 10), int(img_cam_back.shape[0] / 10)))
    img_cam_back_left_resized = cv2.resize(img_cam_back_left,
                                           (int(img_cam_back_left.shape[1] / 10), int(img_cam_back_left.shape[0] / 10)))
    img_cam_back_right_resized = cv2.resize(img_cam_back_right, (
    int(img_cam_back_right.shape[1] / 10), int(img_cam_back_right.shape[0] / 10)))

    img_cam_front_resized = cv2.resize(img_cam_front,
                                       (int(img_cam_front.shape[1] / 10), int(img_cam_front.shape[0] / 10)))
    img_cam_front_left_resized = cv2.resize(img_cam_front_left, (
    int(img_cam_front_left.shape[1] / 10), int(img_cam_front_left.shape[0] / 10)))
    img_cam_front_right_resized = cv2.resize(img_cam_front_right, (
    int(img_cam_front_right.shape[1] / 10), int(img_cam_front_right.shape[0] / 10)))

    cv2.imwrite(path_cam_back + file_cam_back, img_cam_back_resized)
    cv2.imwrite(path_cam_back_left + file_cam_back_left, img_cam_back_left_resized)
    cv2.imwrite(path_cam_back_right + file_cam_back_right, img_cam_back_right_resized)

    cv2.imwrite(path_cam_front + file_cam_front, img_cam_front_resized)
    cv2.imwrite(path_cam_front_left + file_cam_front_left, img_cam_front_left_resized)
    cv2.imwrite(path_cam_front_right + file_cam_front_right, img_cam_front_right_resized)
