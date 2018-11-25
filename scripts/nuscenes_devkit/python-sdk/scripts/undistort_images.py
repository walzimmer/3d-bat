import os
import cv2
import numpy as np

# FRONT
image_path_in_front = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_FRONT/'
image_path_out_front = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_FRONT/'
# k_1, k_2, p_1, p_2 (radial, tangential)
distortion_coeff_front = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
# intrinsic_matrix is same for all 6 cameras
camera_intrinsic_matrix = np.array([[851.809297551590, 0, 981.172134933419],
                                    [0, 849.762831114839, 692.173655689540],
                                    [0, 0, 1]])
for file in sorted(os.listdir(image_path_in_front)):
    img = cv2.imread(image_path_in_front + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_front)
    cv2.imwrite(image_path_out_front + file, dst)

# FRONT_RIGHT
image_path_in_front_right = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_FRONT_RIGHT/'
image_path_out_front_right = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_FRONT_RIGHT/'
distortion_coeff_front_right = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
for file in sorted(os.listdir(image_path_in_front_right)):
    img = cv2.imread(image_path_in_front_right + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_front_right)
    cv2.imwrite(image_path_out_front_right + file, dst)

# BACK_RIGHT
image_path_in_back_right = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_BACK_RIGHT/'
image_path_out_back_right = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_BACK_RIGHT/'
distortion_coeff_back_right = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
for file in sorted(os.listdir(image_path_in_back_right)):
    img = cv2.imread(image_path_in_back_right + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_back_right)
    cv2.imwrite(image_path_out_back_right + file, dst)

# BACK
image_path_in_back = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_BACK/'
image_path_out_back = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_BACK/'
distortion_coeff_back = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
for file in sorted(os.listdir(image_path_in_back)):
    img = cv2.imread(image_path_in_back + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_back)
    cv2.imwrite(image_path_out_back + file, dst)

# BACK_LEFT
image_path_in_back_left = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_BACK_LEFT/'
image_path_out_back_left = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_BACK_LEFT/'
distortion_coeff_back_left = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
for file in sorted(os.listdir(image_path_in_back_left)):
    img = cv2.imread(image_path_in_back_left + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_back_left)
    cv2.imwrite(image_path_out_back_left + file, dst)

# FRONT_LEFT
image_path_in_front_left = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/distorted/CAM_FRONT_LEFT/'
image_path_out_front_left = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/sequences/2018-05-23-001-frame-00042917-00043816/undistorted/CAM_FRONT_LEFT/'
distortion_coeff_front_left = np.array([-0.243484617174364, 0.061191670493188, 0, 0])
for file in sorted(os.listdir(image_path_in_front_left)):
    img = cv2.imread(image_path_in_front_left + file)
    dst = cv2.undistort(img, camera_intrinsic_matrix, distortion_coeff_front_left)
    cv2.imwrite(image_path_out_front_left + file, dst)
