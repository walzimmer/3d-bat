import numpy as np

intrinsic_matrix = np.array([[2.82046004e+03, 0.00000000e+00, 9.60667182e+02],
                             [0.00000000e+00, 2.81622151e+03, 5.25863289e+02],
                             [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[-6.67942916e-04, -1.94233505e-01, 9.80955096e-01],
                            [-9.99986586e-01, 5.16816386e-03, 3.42417940e-04],
                            [-5.13624571e-03, -9.80941709e-01, -1.94234351e-01]], dtype=float).T

translation_vector = np.array([0.82720991e+00, -5.59124063e+00, 8.4336e+00], dtype=float)

# rotate the translation vector, then stack it
translation_vector_rotated = np.matmul(rotation_matrix, translation_vector)
extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[0:3, 0:3] = rotation_matrix
extrinsic_matrix[0:3, 3] = -translation_vector_rotated

# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print(projection_matrix)
# [[ 9.40487461e+02 -2.82009326e+03 -2.01081142e+02  1.48499626e+04]
#  [-3.11563016e+01  1.47347593e+01 -2.86468986e+03 -2.42678068e+04]
#  [ 9.80955096e-01  3.42417940e-04 -1.94234351e-01 -8.28553587e-01]]