import numpy as np

extrinsic_matrix = np.array([[-0.0047123, -0.9999733, 0.00558502, 1.671],
                             [0.01358668, -0.0056486, -0.99989174, -0.026],
                             [0.99989659, -0.00463591, 0.01361294, 1.536]])

intrinsic_matrix = np.array([[1262.8093578767177, 0.0, 786.6784634591471],
                             [0.0, 1262.8093578767177, 437.9890946201144],
                             [0.0, 0.0, 1.0]])

# 3x3 * 3x4 = 3x4
projection_matrix = np.dot(intrinsic_matrix, extrinsic_matrix)
print(projection_matrix)
