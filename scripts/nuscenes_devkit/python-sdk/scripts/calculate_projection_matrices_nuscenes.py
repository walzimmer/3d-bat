import numpy as np
from pyquaternion import Quaternion

# Move 3d point from LIDAR to ego vehicle coord system
translation_vector_lidar_to_imu = np.array([0.891067, 0.0, 1.84292]).T
rotation_matrix_lidar_to_imu = np.array([[1, 0, 0],
                                         [0, 1, 0],
                                         [0, 0, 1]])
# transformation_matrix_lidar_to_ego = np.zeros((4, 4))
# transformation_matrix_lidar_to_ego[:3, :3] = rotation_matrix_lidar_to_ego
# transformation_matrix_lidar_to_ego[:, 3] = translation_vector_lidar_to_ego
#
# #  Move box to sensor coord system
# translation_vector_ego_to_sensor = np.array([-0.086, 0.007, -1.541, 1]).T
# rotation_matrix_ego_to_sensor = np.array([[1.78014178e-02, 9.99841527e-01, -1.74532924e-04],
#                                           [1.48292972e-02, -4.38565732e-04, -9.99889944e-01],
#                                           [-9.99731565e-01, 1.77968704e-02, -1.48347542e-02]])
# transformation_matrix_ego_to_sensor = np.zeros((4, 4))
# transformation_matrix_ego_to_sensor[:3, :3] = rotation_matrix_ego_to_sensor
# transformation_matrix_ego_to_sensor[:, 3] = translation_vector_ego_to_sensor

# FRONT
translation_vector_imu_to_cam = -np.array([1.671, -0.026, 1.536]).T
rotation_angles_imu_to_cam = [0.5008123506024099, -0.496820732721925, 0.4963493647221966, -0.5059579598757297]
rotation_matrix = Quaternion(rotation_angles_imu_to_cam).rotation_matrix.T
camera_intrinsic_matrix = np.array([[1262.8093578767177, 0.0, 786.6784634591471],
                                    [0.0, 1262.8093578767177, 437.9890946201144],
                                    [0.0, 0.0, 2.5]]) / 2.5
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix
camera_extrinsic_matrix[:, 3] = translation_vector_imu_to_cam
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print(projection_matrix)

translation_vector_imu_to_cam = np.array([1.671, -0.026, 1.536]).T
rotation_angles_imu_to_cam = [0.5008123506024099, -0.496820732721925, 0.4963493647221966, -0.5059579598757297]
rotation_matrix = Quaternion(rotation_angles_imu_to_cam).rotation_matrix.T
camera_intrinsic_matrix = np.array([[1262.8093578767177, 0.0, 786.6784634591471],
                                    [0.0, 1262.8093578767177, 437.9890946201144],
                                    [0.0, 0.0, 2.5]]) / 2.5
camera_extrinsic_matrix_one = np.zeros((3, 4))
# translation_vector = np.matmul(rotation_matrix.T, translation_vector.T)  # 3x1
camera_extrinsic_matrix_one[:3, :3] = rotation_matrix
camera_extrinsic_matrix_one[:, 3] = translation_vector_imu_to_cam
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix_one)
print(projection_matrix)

# # FRONT_LEFT
# translation_vector = -np.array([1.564, 0.472, 1.535]).T
# rotation_angles = [0.6749672883132785, -0.6702326464493555, 0.21013653934841947, -0.2259424576550029]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1256.4720761102153, 0.0, 759.9201772536986],
#                                     [0.0, 1256.472076110215, 418.2347543062189],
#                                     [0.0, 0.0, 2.5]])/2.5
# camera_extrinsic_matrix_one = np.zeros((3, 4))
# # translation_vector = np.matmul(rotation_matrix.T, translation_vector.T)  # 3x1
# camera_extrinsic_matrix_one[:3, :3] = rotation_matrix
# camera_extrinsic_matrix_one[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix_one)
# print(projection_matrix)

# translation_vector = -np.array([1.564, 0.472, 1.535]).T
# rotation_angles = [0.6749672883132785, -0.6702326464493555, 0.21013653934841947, -0.2259424576550029]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1256.4720761102153, 0.0, 759.9201772536986],
#                                     [0.0, 1256.472076110215, 418.2347543062189],
#                                     [0.0, 0.0, 2.5]]) / 2.5
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# # FRONT_RIGHT
# translation_vector = -np.array([1.593, -0.527, 1.526]).T
# rotation_angles = [0.22383629788979093,
#                    -0.21087341359410547,
#                    0.6710418554409988,
#                    -0.6746351187363905]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([
#     [1264.1253743585607, 0.0, 761.8659236816043],
#     [0.0, 1264.125374358561, 415.0768894058469],
#     [0.0, 0.0, 2.5]])/2.5
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK_RIGHT
# translation_vector = -np.array([1.042,
#                                 -0.456,
#                                 1.595]).T
# rotation_angles = [0.12392664517942022,
#                    -0.13099150918735702,
#                    -0.6956208531150481,
#                    0.6954099796860017]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1259.4297629105833, 0.0, 752.9541347831612],
#                                     [0.0, 1259.4297629105833, 429.46398926977497],
#                                     [0.0, 0.0, 2.5]]) / 2.5
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK
# position of back camera relative to ego vehicle/body_rp frame (IMU)
# translation_vector = -np.array([0.086, -0.007, 1.541]).T
# rotation_angles = [0.5006316254997311,
#                    -0.508201421131807,
#                    -0.49914796672300266,
#                    0.49188474099671065]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[798.1242652672415, 0.0, 679.0081140747895],
#                                     [0.0, 798.1242652672414, 419.2474525237902],
#                                     [0.0, 0.0, 2.5]]) / 2.5
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# calculate final transformation matrix (extrinsic matrix)
# transformation_matrix_lidar_to_sensor = np.matmul(transformation_matrix_ego_to_sensor,
#                                                   transformation_matrix_lidar_to_ego)
# transformation_matrix_lidar_to_sensor = transformation_matrix_lidar_to_sensor[0:3, :]
# projection_matrix = np.matmul(camera_intrinsic_matrix, transformation_matrix_lidar_to_sensor)
# print(projection_matrix)

# CAM_BACK_LEFT
# translation_vector = -np.array([1.055,
#                                 0.441,
#                                 1.605]).T
# rotation_angles = [0.6991074021274409,
#                    -0.6957784949830705,
#                    -0.11894121100606163,
#                    0.11399173011286876]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1258.2338510172276, 0.0, 742.9036438917772],
#                                     [0.0, 1258.2338510172278, 422.93240569290015],
#                                     [0.0, 0.0, 2.5]])/2.5
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK_LEFT
# translation_vector = -np.array([1.055,
#                                 0.441,
#                                 1.605]).T
# rotation_angles = [0.6991074021274409,
#                    -0.6957784949830705,
#                    -0.11894121100606163,
#                    0.11399173011286876]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1258.2338510172276, 0.0, 742.9036438917772],
#                                     [0.0, 1258.2338510172278, 422.93240569290015],
#                                     [0.0, 0.0, 2.5]]) / 2.5
# camera_extrinsic_matrix_one = np.zeros((3, 4))
# # translation_vector = np.matmul(rotation_matrix.T, translation_vector.T)  # 3x1
# camera_extrinsic_matrix_one[:3, :3] = rotation_matrix
# camera_extrinsic_matrix_one[:, 3] = translation_vector
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix_one)
# print(projection_matrix)
