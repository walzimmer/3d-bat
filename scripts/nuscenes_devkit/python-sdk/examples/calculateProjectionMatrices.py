import numpy as np
from pyquaternion import Quaternion

# FRONT
# translation_vector = np.array([1.671, -0.026, 1.536])
# rotation_angles = [0.5008123506024099, -0.496820732721925, 0.4963493647221966, -0.5059579598757297]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1262.8093578767177, 0.0, 786.6784634591471],
#                                     [0.0, 1262.8093578767177, 437.9890946201144],
#                                     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# print(camera_extrinsic_matrix)
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)
# [[ 7.80646381e+02 -1.26642261e+03  1.77618244e+01  3.31849256e+03]
#  [ 4.55101190e+02 -9.16357519e+00 -1.25671033e+03  6.39918206e+02]
#  [ 9.99896593e-01 -4.63590596e-03  1.36129354e-02  1.53600000e+00]]


# # FRONT_LEFT
# translation_vector = np.array([1.564, 0.472, 1.535])
# rotation_angles = [0.6749672883132785, -0.6702326464493555, 0.21013653934841947, -0.2259424576550029]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1256.4720761102153, 0.0, 759.9201772536986],
#                                     [0.0, 1256.472076110215, 418.2347543062189],
#                                     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# print(camera_extrinsic_matrix)
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# # FRONT_RIGHT
# translation_vector = np.array([1.593, -0.527, 1.526])
# rotation_angles = [0.22383629788979093,
#                    -0.21087341359410547,
#                    0.6710418554409988,
#                    -0.6746351187363905]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([
#     [1264.1253743585607, 0.0, 761.8659236816043],
#     [0.0, 1264.125374358561, 415.0768894058469],
#     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# print(camera_extrinsic_matrix)
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK_RIGHT
# translation_vector = np.array([1.042,
#                                -0.456,
#                                1.595])
# rotation_angles = [0.12392664517942022,
#                    -0.13099150918735702,
#                    -0.6956208531150481,
#                    0.6954099796860017]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[1259.4297629105833, 0.0, 752.9541347831612],
#                                     [0.0, 1259.4297629105833, 429.46398926977497],
#                                     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# print(camera_extrinsic_matrix)
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK
# translation_vector = np.array([0.086,
#                                -0.007,
#                                1.541])
# rotation_angles = [0.5006316254997311,
#                    -0.508201421131807,
#                    -0.49914796672300266,
#                    0.49188474099671065]
# rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
# camera_intrinsic_matrix = np.array([[798.1242652672415, 0.0, 679.0081140747895],
#                                     [0.0, 798.1242652672414, 419.2474525237902],
#                                     [0.0, 0.0, 1.0]])
# camera_extrinsic_matrix = np.zeros((3, 4))
# camera_extrinsic_matrix[:3, :3] = rotation_matrix
# camera_extrinsic_matrix[:, 3] = translation_vector
# print(camera_extrinsic_matrix)
# projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
# print(projection_matrix)

# CAM_BACK_LEFT
translation_vector = np.array([1.055,
                               0.441,
                               1.605])
rotation_angles = [0.6991074021274409,
                   -0.6957784949830705,
                   -0.11894121100606163,
                   0.11399173011286876]
rotation_matrix = Quaternion(rotation_angles).rotation_matrix.T
camera_intrinsic_matrix = np.array([[1258.2338510172276, 0.0, 742.9036438917772],
                                    [0.0, 1258.2338510172278, 422.93240569290015],
                                    [0.0, 0.0, 1.0]])
camera_extrinsic_matrix = np.zeros((3, 4))
camera_extrinsic_matrix[:3, :3] = rotation_matrix
camera_extrinsic_matrix[:, 3] = translation_vector
print(camera_extrinsic_matrix)
projection_matrix = np.matmul(camera_intrinsic_matrix, camera_extrinsic_matrix)
print(projection_matrix)
