import numpy as np

# translation_vector_lidar_to_cam_front = -np.array([3.40200000000000, 10.4301000000000, -60.7137000000000, 1]).T
# translation_vector_lidar_to_cam_front = -np.array([3.40200000000000, -60.7137000000000, 10.4301000000000, 1]).T
# translation_vector_lidar_to_cam_front = -np.array([-60.7137000000000, 10.4301000000000, 3.40200000000000, 1]).T
# translation_vector_lidar_to_cam_front = -np.array([-60.7137000000000, 3.40200000000000, 10.4301000000000, 1]).T
translation_vector_lidar_to_cam_front = -np.array(
    [10.4301000000000, -60.7137000000000, 3.40200000000000, 1]).T
# translation_vector_lidar_to_cam_front = -np.array([3.40200000000000, -60.7137000000000, 10.4301000000000, 1]).T

rotation_matrix_lidar_to_cam_front = np.array([[0.9972, -0.0734, -0.0130],
                                               [-0.0094, 0.0500, -0.9987],
                                               [0.0740, 0.9960, 0.0492]]).T

# rotation_matrix_lidar_to_cam_front = np.array([[1, 0, 0],
#                                                [0, 1, 0],
#                                                [0, 0, 1]])

transformation_matrix_cam_front_to_lidar = np.zeros((4, 4))
transformation_matrix_cam_front_to_lidar[:3, :3] = rotation_matrix_lidar_to_cam_front
transformation_matrix_cam_front_to_lidar[:, 3] = translation_vector_lidar_to_cam_front
# first translate, then rotate

# all positions are in cam front space

# lat, vert, long   working without rotation
# pos_cam_front = np.array([0, 0, 0, 1])
# pos_cam_front_right = np.array([-45.1049247450402, 3.38902882987240, -41.2332552580050, 1])
# pos_cam_back_right = np.array([-138.946355147973, 14.7250624305806, -73.9670437316272, 1])
# pos_cam_back = np.array([1.57295951830214, 13.7980368992530, -155.133930386228, 1])
# pos_cam_back_left = np.array([131.379600000000, 15.9267000000000, -84.9142000000000, 1])
# pos_cam_front_left = np.array([44.9739140815965, 4.73898749148968, -42.3117989136691, 1])


# lat, long, vert          not working
# pos_cam_front = np.array([0, 0, 0, 1])
# pos_cam_front_right = np.array([-45.1049247450402, -41.2332552580050, 3.38902882987240, 1])
# pos_cam_back_right = np.array([-138.946355147973, -73.9670437316272, 14.7250624305806, 1])
# pos_cam_back = np.array([1.57295951830214, -155.133930386228, 13.7980368992530, 1])
# pos_cam_back_left = np.array([131.379600000000, -84.9142000000000, 15.9267000000000, 1])
# pos_cam_front_left = np.array([44.9739140815965, -42.3117989136691, 4.73898749148968, 1])

# # long, vert, lat          not working
# pos_cam_front = np.array([0, 0, 0, 1])
# pos_cam_front_right = np.array([-41.2332552580050, 3.38902882987240, -45.1049247450402, 1])
# pos_cam_back_right = np.array([-73.9670437316272, 14.7250624305806, -138.946355147973, 1])
# pos_cam_back = np.array([-155.133930386228, 13.7980368992530, 1.57295951830214, 1])
# pos_cam_back_left = np.array([-84.9142000000000, 15.9267000000000, 131.379600000000, 1])
# pos_cam_front_left = np.array([-42.3117989136691, 4.73898749148968, 44.9739140815965, 1])

# long, lat, vert       not working
# pos_cam_front = np.array([0, 0, 0, 1])
# pos_cam_front_right = np.array([-41.2332552580050, -45.1049247450402, 3.38902882987240, 1])
# pos_cam_back_right = np.array([-73.9670437316272, -138.946355147973, 14.7250624305806, 1])
# pos_cam_back = np.array([-155.133930386228, 1.57295951830214, 13.7980368992530, 1])
# pos_cam_back_left = np.array([-84.9142000000000, 131.379600000000, 15.9267000000000, 1])
# pos_cam_front_left = np.array([-42.3117989136691, 44.9739140815965, 4.73898749148968, 1])

# vert, lat, long        not working
pos_cam_front = np.array([0, 0, 0, 1])
pos_cam_front_right = np.array([3.38902882987240, -45.1049247450402, -41.2332552580050, 1])
pos_cam_back_right = np.array([14.7250624305806, -138.946355147973, -73.9670437316272, 1])
pos_cam_back = np.array([13.7980368992530, 1.57295951830214, -155.133930386228, 1])
pos_cam_back_left = np.array([15.9267000000000, 131.379600000000, -84.9142000000000, 1])
pos_cam_front_left = np.array([4.73898749148968, 44.9739140815965, -42.3117989136691, 1])

# vert, long, lat      not working
# pos_cam_front = np.array([0, 0, 0, 1])
# pos_cam_front_right = np.array([3.38902882987240, -41.2332552580050, -45.1049247450402, 1])
# pos_cam_back_right = np.array([14.7250624305806, -73.9670437316272, -138.946355147973, 1])
# pos_cam_back = np.array([13.7980368992530, -155.133930386228, 1.57295951830214, 1])
# pos_cam_back_left = np.array([15.9267000000000, -84.9142000000000, 131.379600000000, 1])
# pos_cam_front_left = np.array([4.73898749148968, -42.3117989136691, 44.9739140815965, 1])

# print transformed positions in velodyne space (lat, vert, long)
print('position: cam_front')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_front))
print('position: cam_front_right')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_front_right))
print('position: cam_back_right')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_back_right))
print('position: cam_back')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_back))
print('position: cam_back_left')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_back_left))
print('position: cam_front_left')
print(np.dot(transformation_matrix_cam_front_to_lidar, pos_cam_front_left))
