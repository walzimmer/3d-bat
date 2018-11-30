import numpy as np

test_point = np.array([0, 0, 0, 1]).T
translation_vector_lidar_to_cam_front_right = np.array([9.8561, -2.6760, -68.6021, 1]).T
rotation_matrix_lidar_to_cam_front_right = np.array([[0.4899, -0.8708, 0.0407],
                                                     [-0.0484, -0.0739, -0.9961],
                                                     [0.8704, 0.4861, -0.0785]])
extrinsic_matrix_cam_front_right = np.zeros((4, 4))
extrinsic_matrix_cam_front_right[:3, :3] = rotation_matrix_lidar_to_cam_front_right
extrinsic_matrix_cam_front_right[:, 3] = translation_vector_lidar_to_cam_front_right

# 1. transform test point and compare with: first translate, then rotate
transformed_point = np.dot(extrinsic_matrix_cam_front_right, test_point)

test_point = test_point[:3]
translation_vector_lidar_to_cam_front_right = translation_vector_lidar_to_cam_front_right[:3]
point_trans_rot = np.dot(rotation_matrix_lidar_to_cam_front_right,
                         test_point + translation_vector_lidar_to_cam_front_right)
# compare positions
print(transformed_point)
print(point_trans_rot)
# 2. first rotate, then translate
point_trans_rot = np.dot(rotation_matrix_lidar_to_cam_front_right,
                         test_point) + translation_vector_lidar_to_cam_front_right
print(point_trans_rot)
