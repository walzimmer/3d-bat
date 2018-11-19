import numpy as np

# intrinsic matrix is the same for all six cameras
camera_intrinsic_matrix = np.array([[851.809297551590, 0, 981.172134933419],
                                    [0, 849.762831114839, 692.173655689540],
                                    [0, 0, 1]])

# unit in cm
# front
# lat, long, vert
# NOTE: transformation given from cam_front to lidar that is why is must be inverted
translation_vector_lidar_to_cam_front = -np.array([3.402000000000000, -60.713700000000000, 10.430100000000000]).T
rotation_matrix_lidar_to_cam_front = np.array([[0.997215031568529, -0.073433603510448, -0.013026384350508],
                                               [-0.009365480762406, 0.049978954031455, -0.998706359208757],
                                               [0.073989651870149, 0.996046991878090, 0.049152023221249]]).T
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix_lidar_to_cam_front
camera_extrinsic_matrix[:, 3] = translation_vector_lidar_to_cam_front
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front', projection_matrix)

# front right
# transformation values given from car front to each specific cam
translation_vector_lidar_to_cam_front = -np.array([3.402000000000000, -60.713700000000000, 10.430100000000000, 1.0]).T

transf_matrix_lidar_to_cam_front = np.zeros((4, 4))
transf_matrix_lidar_to_cam_front[:3, :3] = rotation_matrix_lidar_to_cam_front
transf_matrix_lidar_to_cam_front[:, 3] = translation_vector_lidar_to_cam_front

# lat, vert, long
translation_vector_cam_front_to_cam_front_right = np.array(
    [-45.1049247450402, 3.38902882987240, -41.2332552580050, 1.0]).T
rotation_matrix_cam_front_to_cam_front_right = np.array([[0.552000000000000, -0.0888000000000000, -0.829100000000000],
                                                         [-0.0299000000000000, 0.991600000000000, -0.126200000000000],
                                                         [0.833300000000000, 0.0945000000000000, 0.544700000000000]])

transf_matrix_to_cam_front_to_cam_front_right = np.zeros((4, 4))
transf_matrix_to_cam_front_to_cam_front_right[:3, :3] = rotation_matrix_cam_front_to_cam_front_right
transf_matrix_to_cam_front_to_cam_front_right[:, 3] = translation_vector_cam_front_to_cam_front_right

camera_extrinsic_matrix = np.matmul(transf_matrix_to_cam_front_to_cam_front_right, transf_matrix_lidar_to_cam_front)
# remove last row to make it a 3x4 matrix
camera_extrinsic_matrix = camera_extrinsic_matrix[:3, :]
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front_right', projection_matrix)

# back right
# lat, vert, long
translation_vector_cam_front_to_cam_back_right = np.array(
    [-138.946355147973, 14.7250624305806, -73.9670437316272, 1.0]).T
rotation_matrix_cam_front_to_cam_back_right = np.array([[-0.119800000000000, 0.0384000000000000, -0.992100000000000],
                                                        [-0.0845000000000000, 0.995200000000000, 0.0488000000000000],
                                                        [0.989200000000000, 0.0897000000000000, -0.116000000000000]])

transf_matrix_to_cam_front_to_cam_back_right = np.zeros((4, 4))
transf_matrix_to_cam_front_to_cam_back_right[:3, :3] = rotation_matrix_cam_front_to_cam_back_right
transf_matrix_to_cam_front_to_cam_back_right[:, 3] = translation_vector_cam_front_to_cam_back_right

camera_extrinsic_matrix = np.matmul(transf_matrix_to_cam_front_to_cam_back_right, transf_matrix_lidar_to_cam_front)
# remove last row to make it a 3x4 matrix
camera_extrinsic_matrix = camera_extrinsic_matrix[:3, :]
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)

print('back_right', projection_matrix)

# back
# lat, vert, long
translation_vector_cam_front_to_cam_back = np.array([1.57295951830214, 13.7980368992530, -155.133930386228, 1.0]).T
rotation_matrix_cam_front_to_cam_back = np.array([[-0.999500000000000, -0.00730000000000000, -0.0292000000000000],
                                                  [-0.00850000000000000, 0.999200000000000, 0.0391000000000000],
                                                  [0.0289000000000000, 0.0394000000000000, -0.998800000000000]])

transf_matrix_to_cam_front_to_cam_back = np.zeros((4, 4))
transf_matrix_to_cam_front_to_cam_back[:3, :3] = rotation_matrix_cam_front_to_cam_back
transf_matrix_to_cam_front_to_cam_back[:, 3] = translation_vector_cam_front_to_cam_back

camera_extrinsic_matrix = np.matmul(transf_matrix_to_cam_front_to_cam_back, transf_matrix_lidar_to_cam_front)
# remove last row to make it a 3x4 matrix
camera_extrinsic_matrix = camera_extrinsic_matrix[:3, :]
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('back', projection_matrix)

# back left
# lat, vert, long
translation_vector_cam_front_to_cam_back_left = np.array([131.379600000000, 15.9267000000000, -84.9142000000000, 1.0]).T
rotation_matrix_cam_front_to_cam_back_left = np.array([[-0.140200000000000, -0.0238000000000000, 0.989800000000000],
                                                       [0.0469000000000000, 0.998400000000000, 0.0306000000000000],
                                                       [-0.989000000000000, 0.0507000000000000, -0.138900000000000]])

transf_matrix_to_cam_front_to_cam_back_left = np.zeros((4, 4))
transf_matrix_to_cam_front_to_cam_back_left[:3, :3] = rotation_matrix_cam_front_to_cam_back_left
transf_matrix_to_cam_front_to_cam_back_left[:, 3] = translation_vector_cam_front_to_cam_back_left

camera_extrinsic_matrix = np.matmul(transf_matrix_to_cam_front_to_cam_back_left, transf_matrix_lidar_to_cam_front)
# remove last row to make it a 3x4 matrix
camera_extrinsic_matrix = camera_extrinsic_matrix[:3, :]
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('back_left', projection_matrix)

# front left
# lat, vert, long
translation_vector_cam_front_to_cam_front_left = np.array(
    [44.9739140815965, 4.73898749148968, -42.3117989136691, 1.0]).T
rotation_matrix_cam_front_to_cam_front_left = np.array([[0.552100000000000, 0.0339000000000000, 0.833100000000000],
                                                        [0.0928000000000000, 0.990500000000000, -0.101800000000000],
                                                        [-0.828600000000000, 0.133500000000000, 0.543700000000000]])

transf_matrix_to_cam_front_to_cam_front_left = np.zeros((4, 4))
transf_matrix_to_cam_front_to_cam_front_left[:3, :3] = rotation_matrix_cam_front_to_cam_front_left
transf_matrix_to_cam_front_to_cam_front_left[:, 3] = translation_vector_cam_front_to_cam_front_left

camera_extrinsic_matrix = np.matmul(transf_matrix_to_cam_front_to_cam_front_left, transf_matrix_lidar_to_cam_front)
# remove last row to make it a 3x4 matrix
camera_extrinsic_matrix = camera_extrinsic_matrix[:3, :]
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print('front_left', projection_matrix)
