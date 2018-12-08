import numpy as np

translation_vector_cam_front_to_lidar = np.array(
    [3.40200000000000, 10.4301000000000, -60.7137000000000]).T  # lat, vert, long

rotation_matrix_lidar_to_cam_front = np.array([[0.9972, -0.0734, -0.0130],
                                               [-0.0094, 0.0500, -0.9987],
                                               [0.0740, 0.9960, 0.0492]])

rotation_matrix_cam_front_to_lidar = np.array([[0.9972, -0.0734, -0.0130],
                                               [-0.0094, 0.0500, -0.9987],
                                               [0.0740, 0.9960, 0.0492]]).T
# first translate, then rotate

# all positions are in cam front space

# lat, vert, long   working without rotation
pos_cam_front = -np.array([0, 0, 0])
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_front + translation_vector_cam_front_to_lidar))
# pos_cam_front_right = -np.array([-45.1049247450402, 3.38902882987240, -41.2332552580050])
pos_cam_front_right = -np.array([59.3601, -3.4744, -14.5092])  # lat, vert, long
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_front_right + translation_vector_cam_front_to_lidar))
# pos_cam_back_right = -np.array([-138.946355147973, 14.7250624305806, -73.9670437316272])
pos_cam_back_right = -np.array([57.7637, -2.6769, -147.1316])  # lat,vert,long
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_back_right + translation_vector_cam_front_to_lidar))
# pos_cam_back = -np.array([1.57295951830214, 13.7980368992530, -155.133930386228])
pos_cam_back = -np.array([6.1710, -7.6738, -155.4445])
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_back + translation_vector_cam_front_to_lidar))
# pos_cam_back_left = -np.array([131.379600000000, 15.9267000000000, -84.9142000000000])
pos_cam_back_left = -np.array([-66.3038, -8.4754, -142.3289])
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_back_left + translation_vector_cam_front_to_lidar))
# pos_cam_front_left = -np.array([44.9739140815965, 4.73898749148968, -42.3117989136691])
pos_cam_front_left = -np.array([-60.3292, -0.5690, -13.9802])
print(np.dot(rotation_matrix_cam_front_to_lidar, pos_cam_front_left + translation_vector_cam_front_to_lidar))
