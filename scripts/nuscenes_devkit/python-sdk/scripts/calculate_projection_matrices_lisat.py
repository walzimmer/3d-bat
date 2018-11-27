import numpy as np


def print_matrix(mat):
    print('[[' + str(mat[0, 0]) + ',' + str(mat[0, 1]) + ',' + str(mat[0, 2]) + ',' + str(mat[0, 3]) + '],')
    print('[' + str(mat[1, 0]) + ',' + str(mat[1, 1]) + ',' + str(mat[1, 2]) + ',' + str(mat[1, 3]) + '],')
    print('[' + str(mat[2, 0]) + ',' + str(mat[2, 1]) + ',' + str(mat[2, 2]) + ',' + str(mat[2, 3]) + ']]')


# intrinsic_matrix_all_cams = np.array([[851.809297551590, 0, 0],
#                                        [0, 849.762831114839, 0],
#                                        [981.172134933419, 692.173655689540, 1]])

# unit in cm
# front
# NOTE: transformation given from cam_front to lidar that is why is must be inverted
# vert, lat, long
translation_vector_lidar_to_cam_front = -np.array([7.7151, -13.4829, -59.7093]).T
rotation_matrix_lidar_to_cam_front = np.array([[0.9972, -0.0734, -0.0130],
                                               [-0.0094, 0.0500, -0.9987],
                                               [0.0740, 0.9960, 0.0492]])
extrinsic_matrix_cam_front = np.zeros((3, 4))
extrinsic_matrix_cam_front[:3, :3] = rotation_matrix_lidar_to_cam_front
extrinsic_matrix_cam_front[:, 3] = translation_vector_lidar_to_cam_front
print('front')
print('transformation matrix')
print_matrix(extrinsic_matrix_cam_front)
intrinsic_matrix_cam_front = np.array([[956.491386075287, 0, 0],
                                       [0, 956.895380415125, 0],
                                       [1057.67184818200, 755.601444846675, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_front, extrinsic_matrix_cam_front)
print('projection matrix')
print_matrix(projection_matrix)

# front right
# transformation values given from car front to each specific cam
translation_vector_lidar_to_cam_front_right = np.array([9.8561, -2.6760, -68.6021]).T
rotation_matrix_lidar_to_cam_front_right = np.array([[0.4899, -0.8708, 0.0407],
                                                     [-0.0484, -0.0739, -0.9961],
                                                     [0.8704, 0.4861, -0.0785]])
extrinsic_matrix_cam_front_right = np.zeros((3, 4))
extrinsic_matrix_cam_front_right[:3, :3] = rotation_matrix_lidar_to_cam_front_right
extrinsic_matrix_cam_front_right[:, 3] = translation_vector_lidar_to_cam_front_right
intrinsic_matrix_cam_front_right = np.array([[887.113495655892, 0, 0],
                                             [0, 891.354025483244, 0],
                                             [961.736408045581, 719.847040255483, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_front_right, extrinsic_matrix_cam_front_right)
print('front_right')
print('transformation matrix')
print_matrix(extrinsic_matrix_cam_front_right)
print('projection matrix')
print_matrix(projection_matrix)

# back right
translation_vector_lidar_to_cam_back_right = np.array([-81.1507, -2.2588, -60.6184]).T
rotation_matrix_lidar_to_cam_back_right = np.array([[-0.1932, -0.9775, -0.0856],
                                                    [-0.0900, 0.1046, -0.9904],
                                                    [0.9770, -0.1837, -0.1082]])
extrinsic_matrix_cam_back_right = np.zeros((3, 4))
extrinsic_matrix_cam_back_right[:3, :3] = rotation_matrix_lidar_to_cam_back_right
extrinsic_matrix_cam_back_right[:, 3] = translation_vector_lidar_to_cam_back_right
intrinsic_matrix_cam_back_right = np.array([[956.491386075287, 0, 0],
                                            [0, 956.895380415125, 0],
                                            [1057.67184818200, 755.601444846675, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_back_right, extrinsic_matrix_cam_back_right)

print('back_right')
print('transformation matrix')
print_matrix(extrinsic_matrix_cam_back_right)
print('projection matrix')
print_matrix(projection_matrix)

# back
translation_vector_lidar_to_cam_back = np.array([-2.0743, -95.8045, -4.2963]).T
rotation_matrix_lidar_to_cam_back = np.array([[-0.9988, 0.0439, 0.0189],
                                              [-0.0149, 0.0895, -0.9959],
                                              [-0.0455, -0.9950, -0.0888]])
extrinsic_matrix_cam_back = camera_extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix_cam_back[:3, :3] = rotation_matrix_lidar_to_cam_back
extrinsic_matrix_cam_back[:, 3] = translation_vector_lidar_to_cam_back
intrinsic_matrix_cam_back = np.array([[945.347881655311, 0, 0],
                                      [0, 952.151727129110, 0],
                                      [929.501480007437, 740.573841330718, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_back, extrinsic_matrix_cam_back)
print('back')
print('transformation matrix')
print_matrix(camera_extrinsic_matrix)
print('projection matrix')
print_matrix(projection_matrix)

# back left
translation_vector_lidar_to_cam_back_left = np.array([71.5185, 1.0001, -84.9344]).T
rotation_matrix_lidar_to_cam_back_left = np.array([[-0.0664, 0.9950, 0.0742],
                                                   [0.0397, 0.0769, -0.9962],
                                                   [-0.9970, -0.0632, -0.0446]])
extrinsic_matrix_cam_back_left = np.zeros((3, 4))
extrinsic_matrix_cam_back_left[:3, :3] = rotation_matrix_lidar_to_cam_back_left
extrinsic_matrix_cam_back_left[:, 3] = translation_vector_lidar_to_cam_back_left
intrinsic_matrix_cam_back_left = np.array([[1012.35313202466, 0, 0],
                                           [0, 1011.51745158046, 0],
                                           [953.535971661032, 793.292735115195, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_back_left, extrinsic_matrix_cam_back_left)
print('back_left')
print('transformation matrix')
print_matrix(camera_extrinsic_matrix)
print('projection matrix')
print_matrix(projection_matrix)

# front left
translation_vector_lidar_to_cam_front_left = np.array([-0.9675, -1.8214, -82.9684]).T
rotation_matrix_lidar_to_cam_front_left = np.array([[0.6119, 0.7910, -0.0001],
                                                    [0.0757, -0.0587, -0.9954],
                                                    [-0.7873, 0.6091, -0.0958]])
extrinsic_matrix_cam_front_left = np.zeros((3, 4))
extrinsic_matrix_cam_front_left[:3, :3] = rotation_matrix_lidar_to_cam_front_left
extrinsic_matrix_cam_front_left[:, 3] = translation_vector_lidar_to_cam_front_left
intrinsic_matrix_cam_front_left = np.array([[904.648144003214, 0, 0],
                                            [0, 916.745949106787, 0],
                                            [976.510691621082, 711.925850741818, 1]]).T
projection_matrix = np.matmul(intrinsic_matrix_cam_front_left, extrinsic_matrix_cam_front_left)
print('front_left')
print('transformation matrix')
print_matrix(camera_extrinsic_matrix)
print('projection matrix')
print_matrix(projection_matrix)
