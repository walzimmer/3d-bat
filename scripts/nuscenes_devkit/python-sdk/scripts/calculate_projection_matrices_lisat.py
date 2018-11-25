import numpy as np


def print_matrix(mat):
    print('[[' + str(mat[0, 0]) + ',' + str(mat[0, 1]) + ',' + str(mat[0, 2]) + ',' + str(mat[0, 3]) + '],')
    print('[' + str(mat[1, 0]) + ',' + str(mat[1, 1]) + ',' + str(mat[1, 2]) + ',' + str(mat[1, 3]) + '],')
    print('[' + str(mat[2, 0]) + ',' + str(mat[2, 1]) + ',' + str(mat[2, 2]) + ',' + str(mat[2, 3]) + ']]')


# intrinsic matrix is the same for all six cameras
camera_intrinsic_matrix = np.array([[851.809297551590, 0, 981.172134933419],
                                    [0, 849.762831114839, 692.173655689540],
                                    [0, 0, 1]])

# unit in cm
# front
# NOTE: transformation given from cam_front to lidar that is why is must be inverted
# vert, lat, long
translation_vector_lidar_to_cam_front = -np.array([7.7151, -13.4829, -59.7093]).T
rotation_matrix_lidar_to_cam_front = np.array([[0.9972, -0.0734, -0.0130],
                                               [-0.0094, 0.0500, -0.9987],
                                               [0.0740, 0.9960, 0.0492]]).T
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_front
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_front
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front')
print_matrix(projection_matrix)

# front right
# transformation values given from car front to each specific cam
translation_vector_lidar_to_cam_front = -np.array([3.402000000000000, -60.713700000000000, 10.430100000000000, 1.0]).T
translation_vector_lidar_to_cam_front_right = np.array([9.8561, -2.6760, -68.6021]).T
rotation_matrix_lidar_to_cam_front_right = np.array([[0.4899, -0.8708, 0.0407],
                                                     [-0.0484, -0.0739, -0.9961],
                                                     [0.8704, 0.4861, -0.0785]])
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_front_right
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_front_right
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front_right')
print_matrix(projection_matrix)

# back right
translation_vector_lidar_to_cam_back_right = np.array([-81.1507, -2.2588, -60.6184]).T
rotation_matrix_lidar_to_cam_back_right = np.array([[-0.1932, -0.9775, -0.0856],
                                                    [-0.0900, 0.1046, -0.9904],
                                                    [0.9770, -0.1837, -0.1082]])
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_back_right
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_back_right
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)

print('back_right')
print_matrix(projection_matrix)

# back
rotation_matrix_lidar_to_cam_back = np.array([[-0.9988, 0.0439, 0.0189],
                                              [-0.0149, 0.0895, -0.9959],
                                              [-0.0455, -0.9950, -0.0888]])
translation_vector_lidar_to_cam_back = np.array([-2.0743, -95.8045, -4.2963]).T
camera_extrinsic_matrix = camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_back
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_back
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('back')
print_matrix(projection_matrix)

# back left
translation_vector_lidar_to_cam_back_left = np.array([71.5185, 1.0001, -84.9344]).T
rotation_matrix_lidar_to_cam_back_left = np.array([[-0.0664, 0.9950, 0.0742],
                                                   [0.0397, 0.0769, -0.9962],
                                                   [-0.9970, -0.0632, -0.0446]])
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_back_left
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_back_left
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('back_left')
print_matrix(projection_matrix)

# front left
translation_vector_lidar_to_cam_front_left = np.array([-0.9675, -1.8214, -82.9684]).T
rotation_matrix_lidar_to_cam_front_left = np.array([[0.6119, 0.7910, -0.0001],
                                                    [0.0757, -0.0587, -0.9954],
                                                    [-0.7873, 0.6091, -0.0958]])
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_front_left
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_front_left
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front_left')
print_matrix(projection_matrix)
